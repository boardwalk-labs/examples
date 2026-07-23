// generate-and-filter — brainstorm wide, then keep only what survives a rubric.
//
// Several generators propose ideas from different angles (parallel, independent context so they
// don't converge on the same answer), the program dedupes the pile in plain code, and a single
// judge scores the survivors against a rubric and returns the best few. Diverge hard, narrow hard.

import { phase, agent, parallel } from "@boardwalk-labs/workflow";

interface Input {
  /** What to brainstorm, e.g. names for a CLI tool. */
  brief: string;
  /** How many to return (defaults to 3). @asType integer @minimum 1 */
  keep?: number;
}

interface Ideas {
  ideas: string[];
}

interface Ranked {
  picks: { idea: string; why: string }[];
}

interface Result {
  brief: string;
  considered: number;
  picks: { idea: string; why: string }[];
}

const ANGLES = [
  "Go literal and descriptive — say exactly what it does.",
  "Go evocative — a metaphor or an image, not a description.",
  "Go playful — a pun, a portmanteau, something that makes people smile.",
];

export default async function run(input: Input): Promise<Result> {
  const { brief, keep = 3 } = input;

  phase("Generate");
  const batches = await parallel(
    ANGLES.map((angle) => async () => {
      const { ideas } = await agent<Ideas>(
        `Brainstorm 5 ideas for: ${brief}

Angle: ${angle}

Answer ONLY with JSON: {"ideas": ["...", "..."]}`,
        {
          schema: {
            type: "object",
            properties: { ideas: { type: "array", items: { type: "string" } } },
            required: ["ideas"],
          },
        },
      );
      return ideas;
    }),
  );

  // Dedupe in plain code — case- and whitespace-insensitive. The model never has to be trusted
  // not to repeat itself across the independent batches. (A failed generator is a null batch —
  // skipped, not fatal.)
  const seen = new Set<string>();
  const pool: string[] = [];
  for (const idea of batches.filter((b) => b !== null).flat()) {
    const key = idea.trim().toLowerCase();
    if (key !== "" && !seen.has(key)) {
      seen.add(key);
      pool.push(idea.trim());
    }
  }

  phase("Filter");
  const { picks } = await agent<Ranked>(
    `From these candidates for "${brief}", pick the best ${String(keep)} against this rubric:
memorable, easy to say out loud, and not easily confused with an existing tool. Reject anything
generic. Candidates:

${pool.map((p, i) => `${String(i + 1)}. ${p}`).join("\n")}

Answer ONLY with JSON: {"picks": [{"idea": "...", "why": "<one sentence>"}]}`,
    {
      schema: {
        type: "object",
        properties: {
          picks: {
            type: "array",
            items: {
              type: "object",
              properties: { idea: { type: "string" }, why: { type: "string" } },
              required: ["idea", "why"],
            },
          },
        },
        required: ["picks"],
      },
    },
  );

  return { brief, considered: pool.length, picks };
}
