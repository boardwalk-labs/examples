# adversarial-verify

Extract the factual claims from a document, then spin up one skeptical agent per claim — each
told to *refute* it. A claim survives only if its own verifier can't knock it down.

## Setup

1. `boardwalk init my-verifier --template adversarial-verify` (or copy this directory)
2. No secrets required.

## Run

```sh
boardwalk check .
boardwalk run . --org <your-org> --input '{"document": "Our API handles 1M req/s with zero downtime since 2019."}'
```

## How it works

- **Extract claims** — one `agent()` returns a `schema`-validated list of checkable claims.
- **Verify ×N** — `parallel()` runs one verifier per claim, each prompted to assume the claim is
  wrong until proven otherwise. Each thunk catches its own failure so one bad verifier doesn't
  sink the batch. The output flags every unsupported claim.

The separate context windows are the point: the agent that *wrote* a claim never gets to grade
it, so self-preferential bias has nowhere to hide.

## Make it yours

Point the verifiers at ground truth instead of their own knowledge: give each one a `tools` or
`mcp` connection to your codebase, your docs, or the web, and have it check the claim against a
real source. This is the spine of deep-research and "verify every claim in my draft" workflows.
