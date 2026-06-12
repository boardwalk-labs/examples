# boardwalk-examples

Working, copyable [Boardwalk](https://boardwalk.sh) workflow templates. Each one is a standalone
project: copy it out (or `boardwalk init <dir> --template <name>`), fill in `.env`, run.

**Every template is a parity test.** It must run unmodified under `boardwalk dev`, the
self-hosted Boardwalk engine, and Boardwalk Cloud — the CI harness in this repo enforces it. A
template that needs per-engine edits is rejected.

## Templates

| Template | What it demonstrates |
| --- | --- |
| [`hello-routine`](./templates/hello-routine) | The 20-line floor: manual trigger, one `agent()` call, `output()` |
| [`claude-code-cron`](./templates/claude-code-cron) | **The migration template** — your existing `claude -p` script on a hosted cron, zero rewrite |
| [`morning-digest`](./templates/morning-digest) | Cron + `secrets.get` + agent summarization |
| [`webhook-responder`](./templates/webhook-responder) | Webhook trigger + typed `input` + conditional triage |
| [`fan-out-judge`](./templates/fan-out-judge) | `parallel()` agent drafts + a `schema`-validated judge |
| [`pipeline`](./templates/pipeline) | `workflows.call` composition: parent durably fanning work through a child |
| [`long-watch`](./templates/long-watch) | `sleep({ until })` + budget caps — hold-and-pay done right |

## Conventions (every template)

- `index.ts` — the whole workflow: a pure-literal `meta` + a default-exported `run` function.
- `agent()` calls name **no model** by default (Cloud routes automatically; local engines use a
  configured default); a comment shows the explicit-model form.
- `.env.example` documents every secret the template needs. **No real secrets, ever.**
- Minimal dependencies — `@boardwalk/workflow` and the platform, nothing else unless the
  template is *about* a dependency.

## Running the harness

```sh
node harness/run.mjs                 # uses `boardwalk` from PATH
BOARDWALK_CLI="node ../boardwalk-cli/bin/boardwalk.js" node harness/run.mjs
```

It validates every template (`boardwalk check`), checks registry/.env.example consistency, and
executes the agent-free templates end-to-end via `boardwalk dev`. (Agent templates execute in
the scheduled Cloud battery; they run under `dev` once the local engine ships.)

## Contributing a template

A new template needs a primitive or pattern not already covered, the conventions above, and a
green harness. One idea per template — resist the kitchen sink.

## License

MIT
