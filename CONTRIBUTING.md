# Contributing to boardwalk-examples

Templates are the top of the funnel — a new user's first ten minutes. The bar is accordingly
specific.

## What gets accepted

A new template needs **a primitive or pattern not already covered** by the table in
[README.md](./README.md), plus:

- **Parity:** it runs unmodified under `boardwalk dev`, the self-hosted engine, and Boardwalk
  Cloud. A template that needs per-engine edits is rejected.
- **One idea per template.** Resist the kitchen sink — if it demonstrates two patterns, it's
  probably two templates (or one too many).
- **Conventions:** pure-literal `meta` + default-exported `run`; `agent()` names no model by
  default (a comment shows the explicit form); `.env.example` documents every secret;
  dependencies only when the template is *about* the dependency.
- **No secrets, ever.** Placeholders in `.env.example`; CI provides real values from its own
  store. A leaked credential fails review even if revoked.

## Mechanics

Each template is a directory under `templates/` registered in `registry.json` — name,
description, tags, `secrets`, `packages` (sub-packages for multi-workflow templates), and
`files` (the exact list `boardwalk init` downloads; the harness fails if it drifts from disk).
Agent-free templates also get a `dev` block so the harness executes them end-to-end.

```sh
node harness/run.mjs    # must be green (uses `boardwalk` from PATH, or $BOARDWALK_CLI)
```

## Reporting

Bugs and proposals via GitHub issues (templates provided). Security reports: see
[SECURITY.md](./SECURITY.md) — never a public issue.
