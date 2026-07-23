// long-watch — the hold-and-pay pattern done right: sleep({ until }) + budget caps.
//
// Watch a URL until it comes back healthy or a deadline passes. The run HOLDS across each
// sleep — locals survive, no checkpoint dance, no state machine — and `budget` caps how long
// a forgotten watch can run. Agent-free, so a run costs no model tokens.

import { phase, sleep } from "@boardwalk-labs/workflow";

interface WatchInput {
  /** The URL to probe. */
  url: string;
  /** Give up after this many seconds (defaults to 600). @asType integer @minimum 1 */
  deadlineSeconds?: number;
  /** Seconds between probes (defaults to 30). @asType integer @minimum 1 */
  intervalSeconds?: number;
}

interface WatchResult {
  healthy: boolean;
  url: string;
  status: number;
  attempts: number;
}

export default async function run(input: WatchInput): Promise<WatchResult> {
  const { url, deadlineSeconds = 600, intervalSeconds = 30 } = input;
  const deadline = new Date(Date.now() + deadlineSeconds * 1000);

  phase("Watch");
  let attempts = 0;
  for (;;) {
    attempts += 1;
    const status = await probe(url);
    if (status !== null && status >= 200 && status < 300) {
      return { healthy: true, url, status, attempts };
    }

    const nextProbe = new Date(Date.now() + intervalSeconds * 1000);
    if (nextProbe >= deadline) {
      // Failure is a verdict: the throw fails the run, and the error message carries what the
      // watch saw, so the unhealthy outcome is visible in run history (and in notifications).
      throw new Error(
        `${url} was not healthy within ${String(deadlineSeconds)}s ` +
          `(last status: ${status === null ? "unreachable" : String(status)}, attempts: ${String(attempts)})`,
      );
    }
    // The run holds here — no polling loop in YOUR infrastructure, no requeue, no state to
    // persist. `locals` (attempts, deadline) are simply still in scope when it wakes.
    await sleep({ until: nextProbe });
  }
}

/** One probe; null when the request itself failed (DNS, refused, timeout). */
async function probe(url: string): Promise<number | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    return res.status;
  } catch {
    return null;
  }
}
