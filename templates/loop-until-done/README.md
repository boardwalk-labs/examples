# loop-until-done

For work of unknown size (bug hunts, edge cases, missing tickets), keep spawning finder agents
until they stop turning up anything new — not for a fixed number of passes.

## Setup

1. `boardwalk init my-hunt --template loop-until-done` (or copy this directory)
2. No secrets required.

## Run

```sh
boardwalk check .
boardwalk run . --org <your-org> --input '{"text": "<a spec, a log, or a diff to comb for issues>"}'
```

## How it works

- Each round, a finder `agent()` is given everything found so far and asked only for *new*,
  distinct issues.
- The program dedupes against what it has seen and counts consecutive empty rounds. It stops
  after `DRY_ROUNDS` dry rounds in a row, or when `maxRounds` is hit.
- `budget.max_usd` and the round ceiling keep a runaway hunt bounded.

A fixed "do 3 passes" either stops early or wastes the last passes; looping to dryness adapts to
how much is actually there.

## Make it yours

Give the finder real eyes — a `tools`/`mcp` connection to your repo or logs — and change the stop
condition to fit the task (no new errors in the build output, queue drained, target count
reached). Add a `cron` trigger to run it on a schedule.
