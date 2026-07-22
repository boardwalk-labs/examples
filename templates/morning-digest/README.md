# morning-digest

Every weekday at 9am: fetch the GitHub issues assigned to you, agent-summarize them into a
prioritized digest, output it.

The division of labor is the point of the template: **deterministic code fetches** (the trusted
layer holds the token — the model never sees it), **the agent writes**. Keep that shape and your
workflows stay debuggable and injection-resistant.

## Setup

1. Copy this directory (or `boardwalk init digest --template morning-digest`).
2. Create a GitHub token with issue read access.
3. Provide `GITHUB_TOKEN`: `boardwalk secrets set GITHUB_TOKEN --org <your-org>`
   (or add the secret in the dashboard).
4. Adjust the cron `expr` / `timezone` if 9am ET isn't your morning.

## Run

```sh
boardwalk check .                   # validate locally
boardwalk deploy . --org <your-org> # the cron takes over
boardwalk run . --org <your-org>    # or trigger one digest right now
```

## Make it yours

Swap the fetch for anything with an API — your ticket queue, your monitoring, your inbox — and
adjust the prompt. The cron + secret + summarize shape carries over unchanged.
