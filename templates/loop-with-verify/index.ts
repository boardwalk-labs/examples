// loop-with-verify — a two-loop stack: find until dry (the maker), then verify each (the checker).
//
// A finder loop turns up new, distinct issues each round until two rounds in a row find nothing new.
// Then a SEPARATE agent grades every accumulated finding, prompted to refute it against a strict bar,
// and only the ones it confirms survive. The writer never grades its own work, so weak or
// best-practice "findings" get filtered out instead of reaching you. One run, in-memory state, with a
// hard round ceiling AND a budget cap as the layered exits.

import { phase, agent, parallel, input, output, type WorkflowMeta } from "@boardwalk-labs/workflow";

export const meta = {
  slug: "loop-with-verify",
  title: "Loop With Verify",
  description: "Find issues until the hunt runs dry, then keep only the ones a separate checker confirms.",
  triggers: [{ kind: "manual" }],
  input_schema: {
    type: "object",
    properties: {
      text: {
        type: "string",
        description: "The material to comb for issues (a spec, a log, a diff).",
      },
      maxRounds: { type: "integer", minimum: 1, default: 8, description: "Hard ceiling on finder rounds." },
    },
    required: ["text"],
  },
  budget: { max_usd: 3 },
} satisfies WorkflowMeta;

type Finding = { title: string; detail: string };
interface Findings {
  findings: Finding[];
}

const FINDINGS_SCHEMA = {
  type: "object",
  properties: {
    findings: {
      type: "array",
      items: {
        type: "object",
        properties: { title: { type: "string" }, detail: { type: "string" } },
        required: ["title", "detail"],
      },
    },
  },
  required: ["findings"],
} as const;

const VERDICT_SCHEMA = {
  type: "object",
  properties: { real: { type: "boolean" }, reason: { type: "string" } },
  required: ["real", "reason"],
} as const;

const { text, maxRounds = 8 } = input as { text: string; maxRounds?: number };
const DRY_ROUNDS = 2; // stop the hunt after this many consecutive rounds that add nothing new.

const seen = new Set<string>();
const all: Finding[] = [];
let dry = 0;
let round = 0;

// LOOP 1 — the maker. Find NEW distinct issues until the hunt runs dry or hits the ceiling.
phase("Hunt");
while (dry < DRY_ROUNDS && round < maxRounds) {
  round += 1;
  const known = all.map((f) => f.title).join("; ");
  const { findings } = await agent<Findings>(
    `Find issues in the material below that are NOT already in the known list. Return only NEW,
distinct issues; return an empty list if you can't find any more.

Known so far: ${known === "" ? "(none yet)" : known}

Material:
${text}

Answer ONLY with JSON: {"findings": [{"title": "...", "detail": "..."}]}`,
    { schema: FINDINGS_SCHEMA },
  );

  let added = 0;
  for (const f of findings) {
    const key = f.title.trim().toLowerCase();
    if (key !== "" && !seen.has(key)) {
      seen.add(key);
      all.push(f);
      added += 1;
    }
  }
  dry = added === 0 ? dry + 1 : 0;
}

// LOOP 2 — the checker. A SEPARATE agent grades each finding, prompted to refute. Run concurrently
// (a barrier): independent of the finder, a strict bar, and it defaults to rejecting when unsure.
phase("Verify");
const verdicts = await parallel(
  all.map((f) => async () => {
    const v = await agent<{ real: boolean; reason: string }>(
      `You are a strict, skeptical reviewer. Material under review:

${text}

A reviewer claims this issue:
TITLE: ${f.title}
DETAIL: ${f.detail}

Decide whether this is a REAL defect actually present in the material. Set real:true ONLY for a
concrete CORRECTNESS or SECURITY defect. Set real:false for anything speculative, stylistic, or
merely a best-practice suggestion (logging, audit trails, naming, observability) and for anything
not actually applicable to this code. Default to real:false when uncertain.

Answer ONLY with JSON: {"real": true|false, "reason": "..."}`,
      { schema: VERDICT_SCHEMA },
    );
    return { title: f.title, detail: f.detail, real: v.real, reason: v.reason };
  }),
);

const verified = verdicts.filter((v) => v.real);
const rejected = verdicts.filter((v) => !v.real);

output({
  rounds: round,
  found: all.length,
  verified: verified.length,
  rejected: rejected.length,
  stoppedDry: dry >= DRY_ROUNDS,
  findings: verified.map((v) => ({ title: v.title, detail: v.detail })),
  rejectedFindings: rejected.map((v) => ({ title: v.title, reason: v.reason })),
});
