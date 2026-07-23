// loop-until-done — keep going until the work runs dry, not for a fixed number of passes.
//
// When you don't know how much there is to find (bugs, edge cases, missing tickets), "do 3
// passes" either stops early or wastes the last passes. Instead: spawn a finder, dedupe what's
// new against everything seen, and stop only after a couple of empty rounds in a row. A budget
// and a hard round ceiling keep a runaway hunt bounded.

import { phase, agent } from "@boardwalk-labs/workflow";

interface Input {
  /** The material to comb for issues (a spec, a log, a diff). */
  text: string;
  /** Hard ceiling on rounds (defaults to 8). @asType integer @minimum 1 */
  maxRounds?: number;
}

interface Finding {
  title: string;
  detail: string;
}

interface Findings {
  findings: Finding[];
}

interface Report {
  rounds: number;
  found: number;
  stoppedDry: boolean;
  findings: Finding[];
}

const DRY_ROUNDS = 2; // stop after this many consecutive rounds that add nothing new.

export default async function run(input: Input): Promise<Report> {
  const { text, maxRounds = 8 } = input;

  const seen = new Set<string>();
  const all: Finding[] = [];
  let dry = 0;
  let round = 0;

  phase("Hunt");
  while (dry < DRY_ROUNDS && round < maxRounds) {
    round += 1;
    const known = all.map((f) => f.title).join("; ");
    const { findings } = await agent<Findings>(
      `Find issues in the material below that are NOT already in the known list. Return only NEW,
distinct issues; return an empty list if you can't find any more.

Known so far: ${known === "" ? "(none yet)" : known}

Material:
${text}

Answer ONLY with JSON: {"findings": [{"title": "...", "detail": "..."}]}`,
      {
        schema: {
          type: "object",
          properties: {
            findings: {
              type: "array",
              items: {
                type: "object",
                properties: { title: { type: "string" }, detail: { type: "string" } },
                required: ["title", "detail"],
              },
            },
          },
          required: ["findings"],
        },
      },
    );

    let added = 0;
    for (const f of findings) {
      const key = f.title.trim().toLowerCase();
      if (key !== "" && !seen.has(key)) {
        seen.add(key);
        all.push(f);
        added += 1;
      }
    }
    dry = added === 0 ? dry + 1 : 0;
  }

  return { rounds: round, found: all.length, stoppedDry: dry >= DRY_ROUNDS, findings: all };
}
