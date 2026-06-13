// loop-until-done — keep going until the work runs dry, not for a fixed number of passes.
//
// When you don't know how much there is to find (bugs, edge cases, missing tickets), "do 3
// passes" either stops early or wastes the last passes. Instead: spawn a finder, dedupe what's
// new against everything seen, and stop only after a couple of empty rounds in a row. A budget
// and a hard round ceiling keep a runaway hunt bounded.

import { phase, agent, input, output, type WorkflowMeta } from "@boardwalk-labs/workflow";

export const meta = {
  name: "loop-until-done",
  description: "Spawn finder agents until they stop turning up anything new.",
  triggers: [{ kind: "manual" }],
  input_schema: {
    type: "object",
    properties: {
      text: {
        type: "string",
        description: "The material to comb for issues (a spec, a log, a diff).",
      },
      maxRounds: { type: "integer", minimum: 1, default: 8, description: "Hard ceiling on rounds." },
    },
    required: ["text"],
  },
  budget: { max_usd: 2 },
} satisfies WorkflowMeta;

// A `type` (not `interface`) so the array stays assignable to output()'s JSON value.
type Finding = { title: string; detail: string };

interface Findings {
  findings: Finding[];
}

const { text, maxRounds = 8 } = input as { text: string; maxRounds?: number };
const DRY_ROUNDS = 2; // stop after this many consecutive rounds that add nothing new.

const seen = new Set<string>();
const all: Finding[] = [];
let dry = 0;
let round = 0;

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
    {
      schema: {
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
      },
    },
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

output({ rounds: round, found: all.length, stoppedDry: dry >= DRY_ROUNDS, findings: all });
