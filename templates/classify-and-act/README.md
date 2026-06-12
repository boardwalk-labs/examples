# classify-and-act

A classifier agent labels the incoming task; deterministic code routes it to a handler tuned
for that label — a tailored agent for the messy cases, a plain action for the routine ones.

## Setup

1. `boardwalk init my-triage --template classify-and-act` (or copy this directory)
2. No secrets required.

## Run

```sh
boardwalk check .
boardwalk run . --org <your-org> --input '{"message": "the export button 500s on Safari"}'
```

## How it works

- **Classify** — one `agent()` call returns a `schema`-validated `{ category, reason }`.
- **Act** — a `switch` over the category routes to a handler. `bug`, `feature_request`, and
  `question` each spend an agent with a prompt written for that case; `spam` is dropped in code,
  so the obvious path costs nothing.

## Make it yours

Swap the categories for your own (priorities, teams, languages), and let some branches take a
real action — `fetch()` a tracker, hand off with `workflows.call()` — instead of drafting text.
Routing in code keeps the cheap path cheap and reserves the model for the judgment calls.
