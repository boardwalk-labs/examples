// hello-routine — the 20-line floor.
//
// One manual trigger, one agent() call, one returned output. Run it, read the result, then
// start swapping in your own prompt.

import { agent } from "@boardwalk-labs/workflow";

// The platform calls run(); whatever it returns is the run's output. This workflow takes no
// input, so it declares no parameter at all.
export default async function run(): Promise<string> {
  // No model named — Boardwalk routes automatically (the default provider, on every engine).
  // Pin a model, or bring your own keys, whenever you want:
  //   await agent("…", { model: "anthropic/claude-sonnet-4.5" })            // pick the model
  //   await agent("…", { model: "anthropic/claude-sonnet-4.5", provider: "anthropic" }) // your key
  return agent("Write a haiku about a boardwalk at sunrise.");
}
