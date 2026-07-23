// adversarial-verify — check every claim with a fresh, skeptical agent.
//
// One agent pulls the factual claims out of a document; then one verifier per claim runs in
// parallel, each told to REFUTE it. A claim survives only if its own skeptic can't knock it
// down. Separate context windows are the point: the writer never grades its own work, so
// self-preferential bias has nowhere to hide.

import { phase, agent, parallel } from "@boardwalk-labs/workflow";

interface Input {
  /** The text whose factual claims to check. */
  document: string;
}

interface Claims {
  claims: string[];
}

interface Verdict {
  supported: boolean;
  reason: string;
}

interface ClaimVerdict {
  claim: string;
  supported: boolean;
  reason: string;
}

interface Report {
  total: number;
  failed: number;
  verdicts: ClaimVerdict[];
}

export default async function run(input: Input): Promise<Report> {
  const { document } = input;

  phase("Extract claims");
  const { claims } = await agent<Claims>(
    `List every checkable factual claim in the document below — one entry per claim, in your own
words, no opinions or hedges. Answer ONLY with JSON: {"claims": ["...", "..."]}

Document:
${document}`,
    {
      schema: {
        type: "object",
        properties: { claims: { type: "array", items: { type: "string" } } },
        required: ["claims"],
      },
    },
  );

  phase(`Verify ×${String(claims.length)}`);
  // One skeptic per claim, all at once. A thrown verifier shouldn't sink the batch, so each thunk
  // catches its own failure and reports an "unsupported" verdict instead.
  const verdicts = (
    await parallel(
      claims.map((claim) => async (): Promise<ClaimVerdict> => {
        try {
          const v = await agent<Verdict>(
            `Try to REFUTE this claim. Assume it is wrong until you can't. If it holds up, say so;
if it is false, vague, or unsupported, say that. Claim: "${claim}"

Answer ONLY with JSON: {"supported": <true|false>, "reason": "<one sentence>"}`,
            {
              schema: {
                type: "object",
                properties: { supported: { type: "boolean" }, reason: { type: "string" } },
                required: ["supported", "reason"],
              },
            },
          );
          return { claim, supported: v.supported, reason: v.reason };
        } catch (err) {
          return { claim, supported: false, reason: `verifier failed: ${String(err)}` };
        }
      }),
    )
  ).filter((v) => v !== null);

  const failed = verdicts.filter((v) => !v.supported);
  return { total: verdicts.length, failed: failed.length, verdicts };
}
