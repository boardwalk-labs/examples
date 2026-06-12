# fan-out-judge

Draft the same task three ways **in parallel**, then a judge agent picks the winner — and must
answer in a fixed JSON shape (`agent()`'s `schema` option), so your code consumes a typed verdict,
not prose.

## Run

```sh
boardwalk run . --org <your-org> --input '{"task":"Write the launch tweet for our new CLI."}'
```

## What it demonstrates

- **`parallel()`** — fan out independent `agent()` calls; total latency ≈ the slowest draft, not
  the sum.
- **`schema`** — the judge's reply is validated against a JSON Schema; the run fails loudly on a
  malformed answer instead of silently propagating junk. (Belt-and-suspenders: the prompt also
  says "answer ONLY with JSON".)
- **Wide-then-narrow** — generating N candidates and judging beats iterating on one draft when
  the solution space is wide. Crank the angles list, or swap the judge for a panel.

## Make it yours

The `ANGLES` array is the knob. For higher stakes, give each draft a different *model* instead of
a different style: `agent(prompt, { model: "anthropic/claude-sonnet-4.5" })` vs an open-source
model — same judge.
