// hello-routine — the 20-line floor.
//
// One manual trigger, one agent() call, one returned output. Run it, read the result, then
// start swapping in your own prompt.

import { agent } from "@boardwalk-labs/workflow";

// The platform calls run(); whatever it returns is the run's output. This workflow takes no
// input, so it declares no parameter at all.
export default async function run(): Promise<string> {
  // No model named — Boardwalk routes automatically (the default provider, on every engine).
  // Pin a model, or bring your own key, whenever you want:
  //   await agent("…", { model: "anthropic/claude-sonnet-5" })   // an id from `boardwalk models`
  //   await agent("…", { model: "claude-sonnet-5", provider: "my-anthropic" })  // your own key
  // With a provider of your own, `provider` is the name YOU gave it (`boardwalk inference add`)
  // and `model` reaches that vendor's API verbatim — so it's the vendor's id, not a catalog one.
  return agent("Write a haiku about a boardwalk at sunrise.");
}
