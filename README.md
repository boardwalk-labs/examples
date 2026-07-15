# examples

Working, copyable [Boardwalk](https://boardwalk.sh) workflow templates. Each one is a standalone
project: copy it out (or `boardwalk init <dir> --template <name>`), fill in `.env`, run.

**Every template is a parity test.** It must run unmodified under `boardwalk dev`, the
self-hosted Boardwalk engine, and the hosted Boardwalk platform — the CI harness in this repo enforces it. A
template that needs per-engine edits is rejected.

## Templates

Start with the primitives — one feature each — then compose them into the multi-agent patterns.

### Primitives

| Template | What it demonstrates |
| --- | --- |
| [`hello-routine`](./templates/hello-routine) | The minimal workflow: manual trigger, one `agent()` call, `output()` |
| [`claude-code-cron`](./templates/claude-code-cron) | Running an existing `claude -p` command-line script on a schedule, unchanged |
| [`morning-digest`](./templates/morning-digest) | Cron + `secrets.get` + agent summarization |
| [`webhook-responder`](./templates/webhook-responder) | Webhook trigger + typed `input` + conditional triage |
| [`pipeline`](./templates/pipeline) | `workflows.call` composition: a parent durably fanning work through a child |
| [`long-watch`](./templates/long-watch) | `sleep({ until })` + budget caps over a long-running watch |

### Patterns

The orchestration shapes behind big multi-agent jobs — bug hunts, migrations, deep research,
triage. Each is one composable idea you can drop into a larger program: spawn separate agents
with their own context windows so the work gets finished, verified, and kept on-goal.

| Template | What it demonstrates |
| --- | --- |
| [`classify-and-act`](./templates/classify-and-act) | A classifier agent labels the task; code routes it to a tailored handler |
| [`fan-out-judge`](./templates/fan-out-judge) | Fan out + synthesize: `parallel()` drafts + a `schema`-validated judge |
| [`adversarial-verify`](./templates/adversarial-verify) | One skeptical agent per claim — verify by trying to refute |
| [`generate-and-filter`](./templates/generate-and-filter) | Brainstorm wide in parallel, dedupe, keep the best by a rubric |
| [`tournament`](./templates/tournament) | Rank items by agent-judged pairwise comparison (merge sort holds the bracket) |
| [`loop-until-done`](./templates/loop-until-done) | Loop spawning finders until nothing new turns up |
| [`quarantine-triage`](./templates/quarantine-triage) | Read untrusted content with no-privilege agents; act in trusted code |

## Conventions (every template)

- `index.ts` — the whole workflow, **as a script**: a pure-literal `meta` export, then the program as the module body (top-level await throughout). Importing the file is running it.
- `agent()` calls name **no model** by default — the default `boardwalk` provider routes
  automatically on every engine (locally via `boardwalk login`); a comment shows the
  explicit-model form. BYO keys are an explicit `provider`, never a fallback.
- `.env.example` documents every secret the template needs. **No real secrets, ever.**
- Minimal dependencies — `@boardwalk-labs/workflow` and the platform, nothing else unless the
  template is *about* a dependency.

## Running the harness

```sh
node harness/run.mjs                 # uses `boardwalk` from PATH
BOARDWALK_CLI="node ../cli/bin/boardwalk.js" node harness/run.mjs
```

It validates every template (`boardwalk check`), checks registry/.env.example consistency, and
executes the agent-free templates end-to-end via `boardwalk dev`. (Agent templates execute in
the scheduled platform battery; they run under `dev` once the local engine ships.)

## Contributing a template

A new template needs a primitive or pattern not already covered, the conventions above, and a
green harness. Keep each template to one idea; don't bundle unrelated features.

## The Boardwalk repos

- [`boardwalk`](https://github.com/boardwalk-labs/boardwalk) — the open-source single-node engine: cron scheduling, webhooks, durable runs, run history
- [`sdk`](https://github.com/boardwalk-labs/sdk) — `@boardwalk-labs/workflow`, the TypeScript API a workflow program imports
- [`cli`](https://github.com/boardwalk-labs/cli) — `boardwalk`: scaffold, validate, run locally, deploy
- [`plugins`](https://github.com/boardwalk-labs/plugins) — skills + MCP server for Claude Code, Codex, Cursor, OpenClaw, OpenCode
- [`runner`](https://github.com/boardwalk-labs/runner) — self-hosted runner: your machines execute hosted-scheduled runs

Hosted platform and docs: [boardwalk.sh](https://boardwalk.sh).

## License

MIT
