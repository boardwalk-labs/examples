// pipeline-child — the unit of work the parent composes.
//
// Fetch one URL, agent-summarize it, output the summary. A workflow like any other: you can run
// it directly, on its own trigger, or — as the pipeline parent does — via workflows.call.

import { agent, input, output, type WorkflowMeta } from "@boardwalk/workflow";

export const meta = {
  name: "pipeline-child",
  description: "Fetch one URL and summarize it (the pipeline's unit of work).",
  triggers: [{ kind: "manual" }],
  input_schema: {
    type: "object",
    properties: { url: { type: "string" } },
    required: ["url"],
  },
  budget: { max_usd: 0.25, max_duration_seconds: 120 },
} satisfies WorkflowMeta;

export default async function run(): Promise<void> {
  const url = (input as { url: string }).url;

  const res = await fetch(url, { headers: { "User-Agent": "pipeline-child-workflow" } });
  if (!res.ok) throw new Error(`${url} returned ${res.status}`);
  const text = (await res.text()).slice(0, 20_000); // keep the prompt bounded

  const summary = await agent(
    `Summarize this page in 3 bullets, then one sentence on who'd care about it.\n\nURL: ${url}\n\n${text}`,
  );

  output({ url, summary });
}
