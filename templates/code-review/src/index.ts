// code-review — review a diff with a reusable, on-demand "reviewer" skill.
//
// The review procedure lives in skills/reviewer/SKILL.md, not in this prompt. The agent sees a
// one-line catalog entry ("reviewer: …"), loads the full rubric with the built-in `skill` tool when
// it starts, and pulls the detailed security checklist (a bundled resource) only if it needs it.
// That's progressive disclosure: the standing prompt stays small while the procedure stays versioned
// alongside the code, reusable across every agent() that names it.

import { agent } from "@boardwalk-labs/workflow";

interface Input {
  /** The unified diff (or code) to review. */
  diff: string;
}

export default async function run(input: Input): Promise<{ review: string }> {
  // `skills: ["reviewer"]` makes the reviewer skill available: its name + description ride the prompt
  // as a compact catalog, and the model calls `skill({ name: "reviewer" })` to load the body (and
  // `skill({ name: "reviewer", file: "checklist.md" })` for the bundled checklist) on demand.
  const review = await agent(
    `Review the following change. You have a "reviewer" skill — call the \`skill\` tool to load its
instructions before you start, and load its checklist resource if you need the detail.

Diff:
${input.diff}`,
    { skills: ["reviewer"] },
  );

  return { review };
}
