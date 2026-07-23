# Contributing to examples

Templates are the top of the funnel — a new user's first ten minutes. The bar is accordingly
specific.

## What gets accepted

A new template needs **a primitive or pattern not already covered** by the table in
[README.md](./README.md), plus:

- **Parity:** it runs unmodified under the self-hosted engine and the hosted
  Boardwalk platform. A template that needs per-engine edits is rejected.
- **One idea per template.** Resist the kitchen sink — if it demonstrates two patterns, it's
  probably two templates (or one too many).
- **Conventions:** a `workflow.jsonc` descriptor + `src/index.ts` exporting a default
  `run(input, context)` function, with native input/return types wherever the workflow has a
  shape (the deploy derives their schemas); `agent()` names no model by
  default (a comment shows the explicit form); every secret is declared in
  the descriptor's `permissions.secrets` and the registry `secrets` list;
  dependencies only when the template is *about* the dependency.
- **No secrets, ever.** Users set values with `boardwalk secrets set`; CI provides real values
  from its own store. A leaked credential fails review even if revoked.

## Mechanics

Each template is a directory under `templates/` registered in `registry.json` — name,
description, tags, `secrets`, `packages` (sub-packages for multi-workflow templates), and
`files` (the exact list `boardwalk init` downloads; the harness fails if it drifts from disk).
Agent-free templates also get an `e2e` block so the harness executes them end-to-end.

```sh
node harness/run.mjs    # must be green (uses `boardwalk` from PATH, or $BOARDWALK_CLI)
```

## Reporting

Bugs and proposals via GitHub issues (templates provided). Security reports: see
[SECURITY.md](./SECURITY.md) — never a public issue.
