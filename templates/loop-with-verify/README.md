# loop-with-verify

A two-loop stack. A finder loop turns up issues of unknown size (the *maker*); a separate checker
agent then grades every finding and keeps only the ones it can confirm (the *checker*). The agent
that finds a problem never decides whether it's real, so weak or best-practice "findings" get
filtered out instead of reaching you.

This is [`loop-until-done`](../loop-until-done) plus a verification pass — the single biggest
reliability win when you loop an agent toward a goal.

## Setup

1. `boardwalk init my-loop --template loop-with-verify` (or copy this directory)
2. No secrets required.

## Run

```sh
boardwalk check .
boardwalk run . --org <your-org> --input '{"text": "<a spec, a log, or a diff to comb for issues>"}'
```

The output separates `findings` (verified) from `rejectedFindings` (with the reason each was thrown
out), so you can see the checker earning its keep.

## How it works

- **Loop 1 (the maker).** Each round, a finder `agent()` gets everything found so far and is asked
  only for *new*, distinct issues. The program dedupes in code and counts consecutive empty rounds,
  stopping after `DRY_ROUNDS` dry rounds in a row or when `maxRounds` is hit.
- **Loop 2 (the checker).** Every accumulated finding goes to a *separate* `agent()`, run in
  `parallel()`, prompted to refute it against a strict bar (a concrete correctness or security
  defect, not a stylistic or best-practice note) and to default to rejecting when unsure.
- **Layered exits.** A verifier confirms what's real, a hard round ceiling caps the hunt, and
  `budget.max_usd` caps the spend. A loop with no explicit exits is the most expensive mistake.

## Cost

Verification re-sends the material once per finding, so the checker pass scales with
*findings × material size* — expect roughly 2× the tokens of the finder alone. Keep the material
compact, or batch several findings into one checker call, when that gets large.

## Make it yours

- **Give the finder real eyes** — a `tools`/`mcp` connection to your repo, logs, or tracker — and
  change the stop condition to fit (no new errors in the build, queue drained, target count reached).
- **Tune the checker's bar** to your stakes: stricter to cut false positives, looser to keep more.
- **Make it recurring.** This is a *bounded* loop: one run that converges and stops. To run it on a
  cadence, add a `cron` trigger to `workflow.jsonc` — each tick is then its own fresh run. Reach for
  `workflows.schedule(...)` only when the schedule is computed at runtime.
