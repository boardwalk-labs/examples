# claude-code-cron

**The migration template.** You already have a Claude Code prompt you run on a schedule —
a crontab line, a GitHub Action, a script on a box somewhere. This hosts it: same `claude -p`
invocation, plus scheduling, a secret vault, run history, and notifications-grade observability.

There is deliberately nothing clever here. The program shells out to the Claude Code CLI via
`child_process`, exactly like your script does. Zero rewrite.

## Setup

1. Copy this directory (or `boardwalk init my-cron --template claude-code-cron`).
2. Replace `PROMPT` with the prompt you run today.
3. Adjust the cron `expr` / `timezone` in `meta.triggers`.
4. Provide `ANTHROPIC_API_KEY`: `boardwalk secrets set ANTHROPIC_API_KEY --org <your-org>`
   (or add the secret in the dashboard).

## Run

```sh
boardwalk check .                   # validate locally
boardwalk deploy . --org <your-org> # ship it — the cron trigger takes over from here
boardwalk run . --org <your-org>    # or trigger one run right now
```

## Notes

- The schedule lives in `meta` (the manifest), not in a separate scheduler config — version it
  with the code.
- `secrets.get` is fail-closed: only names declared in `permissions.secrets` resolve, and values
  never appear in logs or model context.
- `budget.max_duration_seconds` caps a runaway run.
