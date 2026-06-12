# generate-and-filter

Brainstorm wide from several angles in parallel, dedupe the pile in plain code, then let one
judge keep the best few against a rubric. Diverge hard, narrow hard.

## Setup

1. `boardwalk init my-namer --template generate-and-filter` (or copy this directory)
2. No secrets required.

## Run

```sh
boardwalk check .
boardwalk run . --org <your-org> --input '{"brief": "a name for a CLI that ships agent workflows", "keep": 3}'
```

## How it works

- **Generate** — `parallel()` runs several generators, each with a different angle and its own
  clean context so they don't converge on the same idea.
- **Dedupe** — the program collapses near-duplicates (case/whitespace-insensitive) without
  trusting the model to not repeat itself.
- **Filter** — one judge scores the survivors against a rubric and returns the top `keep`.

## Make it yours

Change the angles and the rubric — that's where the quality lives. For taste-heavy choices
(names, designs, copy) hand the survivors to the [`tournament`](../tournament) template for a
pairwise ranking instead of a single rubric pass.
