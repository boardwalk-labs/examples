# webhook-responder

A webhook-triggered workflow: POST a JSON event at its URL, it triages — page, ticket, or ignore
— and outputs the decision. Agent-free on purpose: this template demonstrates the **trigger +
input** path, and a run costs no model tokens.

## Try it, right now

```sh
boardwalk check .   # validate — no account needed
boardwalk deploy . --org <your-org> --run --input '{"event":"deploy_failed","service":"api","severity":"high"}'
boardwalk deploy . --org <your-org> --run --input '{"event":"heartbeat","severity":"low"}'
```

`run` deploys, triggers a hosted run, and waits, printing the decision back. Inspect any run
later with `boardwalk runs <runId> --logs`.

## Deploy

A `webhook` trigger attaches to one of your org's webhooks — an endpoint you create once and can
share across any number of workflows. Create it first (the signing secret is shown ONCE):

```sh
boardwalk webhooks create webhook-responder
boardwalk deploy . --org <your-org>
```

Then point your producer at the URL it printed. The secret is never in the URL — it rides in a
header, and for the default `token` scheme that header is `X-Boardwalk-Token`:

```sh
curl -X POST "$WEBHOOK_URL" -H "X-Boardwalk-Token: $WEBHOOK_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"event":"deploy_failed","service":"api","severity":"critical"}'
```

## Notes

- Every workflow attached to a webhook runs on every delivery. To send different events to
  different workflows, create a second webhook and select events on the sender's side.

- The typed `run(input)` parameter IS the payload contract: the deploy derives its schema, so the
  dashboard's run form and your producers know the shape. There's no pre-run gate — a payload
  arrives best-effort, exactly like a Lambda event; validate in code if you need a hard check.
- The triage here is deterministic `if`/`else`. When the judgment gets fuzzier than rules can
  express, hand that one decision to `agent()` and keep the rest as code.
