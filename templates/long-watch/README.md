# long-watch

Probe a URL until it's healthy or a deadline passes — the **hold-and-pay** pattern: the run
simply `sleep`s between probes and stays alive across the waits. Your locals (`attempts`, the
deadline) survive; there's no checkpoint dance, no requeue, no state machine.

Agent-free, so it runs end-to-end under `boardwalk dev` today:

```sh
boardwalk dev . --input '{"url":"https://example.com","deadlineSeconds":10,"intervalSeconds":2}'
```

## Deploy

```sh
boardwalk deploy . --org <your-org>
boardwalk run . --org <your-org> --input '{"url":"https://your-service/healthz"}' --no-wait
```

## What it demonstrates

- **`sleep({ until })`** — durable waits to an absolute time. A held run is cheap; an
  always-on poller in your infra is not.
- **`budget.max_duration_seconds`** — the backstop. A watch someone forgot about ends itself.
- **`concurrency: { mode: "serial" }`** — a second trigger queues instead of double-watching.
- **Failure is a verdict** — the run still `output()`s what it saw, then fails, so the
  unhealthy outcome is visible in run history (and in notifications), not silent.
