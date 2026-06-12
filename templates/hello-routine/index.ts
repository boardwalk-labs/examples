// hello-routine — the 20-line floor.
//
// One manual trigger, one agent() call, one output. Run it, read the result, then start
// swapping in your own prompt.

import { agent, output, type WorkflowMeta } from "@boardwalk/workflow";

export const meta = {
  name: "hello-routine",
  description: "The smallest useful workflow: one agent call, one output.",
  triggers: [{ kind: "manual" }],
} satisfies WorkflowMeta;

// No model named — Boardwalk Cloud routes automatically; a local engine uses its
// configured default. Pin one explicitly whenever you want:
//   await agent("…", { model: "anthropic/claude-sonnet-4.5" })
const haiku = await agent("Write a haiku about a boardwalk at sunrise.");
output(haiku);
