// tournament — rank items by pairwise comparison, not absolute scoring.
//
// Asking a model to score things 1–10 drifts; asking "which of these two is better?" stays
// steady. So we hold the bracket in deterministic code (a merge sort) and spend one fresh agent
// per matchup — only the two items being compared ever sit in a context window. Take the top
// item for a single winner, or the whole order for a ranked list.

import { phase, agent, input, output, type WorkflowMeta } from "@boardwalk-labs/workflow";

export const meta = {
  slug: "tournament",
  title: "Tournament",
  description: "Rank items by agent-judged pairwise comparison (merge sort holds the bracket).",
  triggers: [{ kind: "manual" }],
  input_schema: {
    type: "object",
    properties: {
      items: { type: "array", items: { type: "string" }, description: "The items to rank." },
      criterion: { type: "string", description: "What 'better' means, e.g. 'higher severity'." },
      topK: { type: "integer", minimum: 1, description: "How many top items to highlight." },
    },
    required: ["items", "criterion"],
  },
  budget: { max_usd: 2 },
} satisfies WorkflowMeta;

interface Compare {
  winner: "a" | "b";
}

const { items, criterion, topK } = input as { items: string[]; criterion: string; topK?: number };

// One matchup = one fresh agent. Resolves true when `a` should rank ahead of `b`.
async function aBeatsB(a: string, b: string): Promise<boolean> {
  const { winner } = await agent<Compare>(
    `Which item better fits the criterion: ${criterion}?

A: ${a}
B: ${b}

Answer ONLY with JSON: {"winner": "a"} or {"winner": "b"}.`,
    {
      schema: {
        type: "object",
        properties: { winner: { type: "string", enum: ["a", "b"] } },
        required: ["winner"],
      },
    },
  );
  return winner === "a";
}

// Merge sort: the deterministic loop holds the running order; the comparator is the only agent
// in play, so only two items are ever in context at once. Independent subtrees sort in parallel.
async function sort(xs: string[]): Promise<string[]> {
  if (xs.length <= 1) return xs;
  const mid = Math.floor(xs.length / 2);
  const [left, right] = await Promise.all([sort(xs.slice(0, mid)), sort(xs.slice(mid))]);

  const out: string[] = [];
  let i = 0;
  let j = 0;
  while (i < left.length && j < right.length) {
    const a = left[i];
    const b = right[j];
    if (a === undefined || b === undefined) break; // unreachable; satisfies the index checker.
    if (await aBeatsB(a, b)) {
      out.push(a);
      i += 1;
    } else {
      out.push(b);
      j += 1;
    }
  }
  out.push(...left.slice(i), ...right.slice(j));
  return out;
}

phase(`Rank ${String(items.length)} items`);
const ranked = await sort(items);

output({
  criterion,
  ranked,
  top: topK !== undefined ? ranked.slice(0, topK) : (ranked[0] ?? null),
});
