# code-review

Review a diff with a reusable **skill** instead of a giant prompt. The review rubric lives in
`skills/reviewer/SKILL.md`; the agent loads it on demand and pulls the bundled security checklist
only when it needs the detail.

## Setup

1. `boardwalk init my-review --template code-review` (or copy this directory)
2. No secrets required.

## Run

```sh
boardwalk check .
boardwalk run . --org <your-org> --input '{"diff": "--- a/auth.ts\n+++ b/auth.ts\n@@\n- const q = `SELECT * FROM users WHERE id = ${id}`\n+ const q = db.query(\"SELECT * FROM users WHERE id = $1\", [id])"}'
```

## How it works

- **Folder-per-skill** — `skills/reviewer/` holds `SKILL.md` (YAML frontmatter `name` + `description`,
  then the procedure) and `checklist.md` (a bundled resource).
- **Progressive disclosure** — `agent(..., { skills: ["reviewer"] })` puts only the skill's name +
  description in the prompt. The model calls the built-in `skill` tool to load the body
  (`skill({ name: "reviewer" })`) and the checklist (`skill({ name: "reviewer", file: "checklist.md" })`)
  when it actually reviews — so the standing prompt stays small and the procedure stays versioned with
  the code.

## Make it yours

Edit `skills/reviewer/SKILL.md` to encode your team's review standards, and add more resources
(`style-guide.md`, `architecture.md`) beside it — the agent loads them by name. Point several
workflows at the same skill so the rubric is authored once and reused. Swap the manual trigger for a
`webhook` to review every opened pull request.
