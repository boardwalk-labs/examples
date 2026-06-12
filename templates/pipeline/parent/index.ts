// pipeline (parent) — composition via workflows.call.
//
// The parent fans a list of URLs through the `pipeline-child` workflow — one durable child run
// per URL — and aggregates the results. Composition is just code: no DAG syntax, no pipeline
// DSL; a loop and an await.

import { Phase, input, output, workflows, type WorkflowMeta } from "@boardwalk/workflow";

export const meta = {
  name: "pipeline",
  description: "Durably fan URLs through the pipeline-child workflow and aggregate the summaries.",
  triggers: [{ kind: "manual" }],
  input_schema: {
    type: "object",
    properties: {
      urls: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 10 },
    },
    required: ["urls"],
  },
  budget: { max_usd: 2 },
} satisfies WorkflowMeta;

export default async function run(): Promise<void> {
  const urls = (input as { urls: string[] }).urls;

  Phase("Fan out");
  const summaries: { url: string; summary: unknown }[] = [];
  for (const url of urls) {
    // Each call is a real child run: it shows up in run history, it's billed and budgeted on
    // its own, and it's idempotent — if THIS parent restarts, it re-attaches to the same child
    // instead of running it twice.
    const summary = await workflows.call("pipeline-child", { url });
    summaries.push({ url, summary });
  }

  Phase("Aggregate");
  output({
    count: summaries.length,
    summaries,
  });
}
