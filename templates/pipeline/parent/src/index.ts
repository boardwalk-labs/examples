// pipeline (parent) — composition via workflows.call.
//
// The parent fans a list of URLs through the `pipeline-child` workflow — one durable child run
// per URL — and aggregates the results. Composition is just code: no DAG syntax, no pipeline
// DSL; a loop and an await.

import { phase, workflows } from "@boardwalk-labs/workflow";

interface Input {
  /** The URLs to fan through the child — keep a single run to ~10. */
  urls: string[];
}

interface Result {
  count: number;
  summaries: { url: string; summary: unknown }[];
}

export default async function run(input: Input): Promise<Result> {
  const { urls } = input;

  phase("Fan out");
  const summaries: { url: string; summary: unknown }[] = [];
  for (const url of urls) {
    // Each call is a real child run: it shows up in run history, it's billed and budgeted on
    // its own, and it's idempotent — if THIS parent restarts, it re-attaches to the same child
    // instead of running it twice.
    const summary = await workflows.call("pipeline-child", { url });
    summaries.push({ url, summary });
  }

  phase("Aggregate");
  return {
    count: summaries.length,
    summaries,
  };
}
