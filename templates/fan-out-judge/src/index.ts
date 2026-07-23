// fan-out-judge — parallel() over agent() calls + schema-validated structured output.
//
// Three drafts written concurrently from different angles, then a judge picks the winner and
// must answer in a fixed JSON shape (the `schema` option). Wide-then-narrow beats
// one-attempt-iterated whenever the solution space is wide.

import { phase, agent, parallel } from "@boardwalk-labs/workflow";

interface Input {
  /** What to write, e.g. a launch tweet, an apology email. */
  task: string;
}

const ANGLES = [
  "Be direct and plain — short sentences, no adjectives you can't defend.",
  "Be warm and human — write like a person, not a press release.",
  "Be bold — take a position; vivid, concrete, a little surprising.",
];

interface Verdict {
  winner: number;
  rationale: string;
}

interface Result {
  winner: string;
  rationale: string;
  drafts: (string | null)[];
}

export default async function run(input: Input): Promise<Result> {
  const { task } = input;

  phase("Draft ×3");
  const drafts = await parallel(
    ANGLES.map((angle) => () => agent(`${task}\n\nStyle constraint: ${angle}`)),
  );

  phase("Judge");
  const verdict = await agent<Verdict>(
    `You are judging ${String(drafts.length)} drafts of the same task: "${task}".

${drafts.map((d, i) => `--- DRAFT ${String(i)} ---\n${d}`).join("\n\n")}

Pick the single best draft. Answer ONLY with JSON: {"winner": <index>, "rationale": "<one sentence>"}`,
    {
      schema: {
        type: "object",
        properties: {
          winner: { type: "integer", minimum: 0, maximum: ANGLES.length - 1 },
          rationale: { type: "string" },
        },
        required: ["winner", "rationale"],
      },
    },
  );

  return {
    winner: drafts[verdict.winner] ?? drafts[0] ?? "",
    rationale: verdict.rationale,
    drafts,
  };
}
