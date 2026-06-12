// hello-routine — the 20-line floor.
//
// One manual trigger, one agent() call, one output. Run it, read the result, then start
// swapping in your own prompt.

import { agent, output, type WorkflowMeta } from "@boardwalk-labs/workflow";

export const meta = {
  name: "hello-routine",
  description: "The smallest useful workflow: one agent call, one output.",
  triggers: [{ kind: "manual" }],
} satisfies WorkflowMeta;

// No model named — Boardwalk routes automatically (the default provider, on every engine).
// Pin a model, or bring your own keys, whenever you want:
//   await agent("…", { model: "anthropic/claude-sonnet-4.5" })            // pick the model
//   await agent("…", { model: "anthropic/claude-sonnet-4.5", provider: "anthropic" }) // your key
const haiku = await agent("Write a haiku about a boardwalk at sunrise.");
output(haiku);
