// fan-out-judge — parallel() over agent() calls + schema-validated structured output.
//
// Three drafts written concurrently from different angles, then a judge picks the winner and
// must answer in a fixed JSON shape (the `schema` option). Wide-then-narrow beats
// one-attempt-iterated whenever the solution space is wide.

import { phase, agent, input, output, parallel, type WorkflowMeta } from "@boardwalk-labs/workflow";

export const meta = {
  slug: "fan-out-judge",
  title: "Fan Out Judge",
  description: "Draft an answer three ways in parallel, then judge the best one.",
  triggers: [{ kind: "manual" }],
  input_schema: {
    type: "object",
    properties: {
      task: { type: "string", description: "What to write, e.g. a launch tweet, an apology email." },
    },
    required: ["task"],
  },
  budget: { max_usd: 1 },
} satisfies WorkflowMeta;

const ANGLES = [
  "Be direct and plain — short sentences, no adjectives you can't defend.",
  "Be warm and human — write like a person, not a press release.",
  "Be bold — take a position; vivid, concrete, a little surprising.",
];

interface Verdict {
  winner: number;
  rationale: string;
}

const task = (input as { task: string }).task;

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

output({
  winner: drafts[verdict.winner] ?? drafts[0] ?? "",
  rationale: verdict.rationale,
  drafts,
});
