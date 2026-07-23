# webhook-responder

A webhook-triggered workflow: POST a JSON event at its URL, it triages — page, ticket, or ignore
— and outputs the decision. Agent-free on purpose: this template demonstrates the **trigger +
input** path, and a run costs no model tokens.

## Try it, right now

```sh
boardwalk check .   # validate — no account needed
boardwalk run . --org <your-org> --input '{"event":"deploy_failed","service":"api","severity":"high"}'
boardwalk run . --org <your-org> --input '{"event":"heartbeat","severity":"low"}'
```

`run` deploys, triggers a hosted run, and waits, printing the decision back. Inspect any run
later with `boardwalk runs <runId> --logs`.

## Deploy

```sh
boardwalk deploy . --org <your-org>
```

Deploying a workflow with a `webhook` trigger gives it a URL + token (shown in the dashboard).
Point your producer at it:

```sh
curl -X POST "$WEBHOOK_URL" -H "Authorization: Bearer $WEBHOOK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"event":"deploy_failed","service":"api","severity":"critical"}'
```

## Notes

- The typed `run(input)` parameter IS the payload contract: the deploy derives its schema, so the
  dashboard's run form and your producers know the shape. There's no pre-run gate — a payload
  arrives best-effort, exactly like a Lambda event; validate in code if you need a hard check.
- The triage here is deterministic `if`/`else`. When the judgment gets fuzzier than rules can
  express, hand that one decision to `agent()` and keep the rest as code.
