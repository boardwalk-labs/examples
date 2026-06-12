// long-watch — the hold-and-pay pattern done right: sleep({ until }) + budget caps.
//
// Watch a URL until it comes back healthy or a deadline passes. The run HOLDS across each
// sleep — locals survive, no checkpoint dance, no state machine — and `budget` caps how long
// a forgotten watch can run. Agent-free, so it runs end-to-end under `boardwalk dev` today.

import { Phase, input, output, sleep, type WorkflowMeta } from "@boardwalk-labs/workflow";

export const meta = {
  name: "long-watch",
  description: "Probe a URL until it's healthy or the deadline passes.",
  triggers: [{ kind: "manual" }],
  input_schema: {
    type: "object",
    properties: {
      url: { type: "string", description: "The URL to probe." },
      deadlineSeconds: { type: "integer", minimum: 1, default: 600 },
      intervalSeconds: { type: "integer", minimum: 1, default: 30 },
    },
    required: ["url"],
  },
  budget: { max_duration_seconds: 3600 },
  concurrency: { mode: "serial" },
} satisfies WorkflowMeta;

interface WatchInput {
  url: string;
  deadlineSeconds?: number;
  intervalSeconds?: number;
}

const { url, deadlineSeconds = 600, intervalSeconds = 30 } = input as WatchInput;
const deadline = new Date(Date.now() + deadlineSeconds * 1000);

Phase("Watch");
let attempts = 0;
let healthyStatus: number | null = null;
for (;;) {
  attempts += 1;
  const status = await probe(url);
  if (status !== null && status >= 200 && status < 300) {
    healthyStatus = status;
    break;
  }

  const nextProbe = new Date(Date.now() + intervalSeconds * 1000);
  if (nextProbe >= deadline) {
    output({ healthy: false, url, lastStatus: status, attempts });
    throw new Error(`${url} was not healthy within ${String(deadlineSeconds)}s`);
  }
  // The run holds here — no polling loop in YOUR infrastructure, no requeue, no state to
  // persist. `locals` (attempts, deadline) are simply still in scope when it wakes.
  await sleep({ until: nextProbe });
}
output({ healthy: true, url, status: healthyStatus, attempts });

/** One probe; null when the request itself failed (DNS, refused, timeout). */
async function probe(url: string): Promise<number | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    return res.status;
  } catch {
    return null;
  }
}
