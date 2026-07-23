// pipeline-child — the unit of work the parent composes.
//
// Fetch one URL, agent-summarize it, return the summary. A workflow like any other: you can run
// it directly, on its own trigger, or — as the pipeline parent does — via workflows.call.

import { agent } from "@boardwalk-labs/workflow";

interface Input {
  /** The URL to fetch and summarize. */
  url: string;
}

interface Summary {
  url: string;
  summary: string;
}

export default async function run(input: Input): Promise<Summary> {
  const { url } = input;

  const res = await fetch(url, { headers: { "User-Agent": "pipeline-child-workflow" } });
  if (!res.ok) throw new Error(`${url} returned ${res.status}`);
  const text = (await res.text()).slice(0, 20_000); // keep the prompt bounded

  const summary = await agent(
    `Summarize this page in 3 bullets, then one sentence on who'd care about it.\n\nURL: ${url}\n\n${text}`,
  );

  return { url, summary };
}
