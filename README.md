# examples

Working, copyable [Boardwalk](https://boardwalk.sh) workflow templates. Each one is a standalone
project: copy it out (or `boardwalk init <dir> --template <name>`), set its secrets, run.

**Every template is a parity test.** It must run unmodified under the self-hosted Boardwalk
engine and the hosted Boardwalk platform — the CI harness in this repo enforces it. A
template that needs per-engine edits is rejected.

## Templates

Start with the primitives — one feature each — then compose them into the multi-agent patterns.

### Primitives

| Template | What it demonstrates |
| --- | --- |
| [`hello-routine`](./templates/hello-routine) | The minimal workflow: manual trigger, one `agent()` call, one returned output |
| [`claude-code-cron`](./templates/claude-code-cron) | Running an existing `claude -p` command-line script on a schedule, unchanged |
| [`morning-digest`](./templates/morning-digest) | Cron + `secrets.get` + agent summarization |
| [`webhook-responder`](./templates/webhook-responder) | Webhook trigger + a typed `run(input)` + conditional triage |
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
| [`loop-with-verify`](./templates/loop-with-verify) | Loop until finders run dry, then a separate checker keeps only the verified findings |
| [`quarantine-triage`](./templates/quarantine-triage) | Read untrusted content with no-privilege agents; act in trusted code |
| [`code-review`](./templates/code-review) | Review a diff with a reusable reviewer skill loaded on demand (progressive disclosure) |

## Conventions (every template)

- **Two files are the workflow.** `workflow.jsonc` is the deployment descriptor (slug, triggers,
  permissions, budget — the policy the control plane reads as data), and `src/index.ts` exports the
  program: `export default async function run(input, context)`. The trigger's payload is `input`,
  and whatever `run` returns is the run's output.
- **Native types are the I/O contract.** Templates type `input` and the return value where the
  workflow has a shape — the deploy derives their schemas for the dashboard's run form and for
  callers. A bare `run(input)` (no annotation) is the untyped floor.
- `agent()` calls name **no model** by default — the default `boardwalk` provider routes
  automatically on every engine; a comment shows the
  explicit-model form. BYO keys are an explicit `provider`, never a fallback.
- Every secret a template needs is declared in the descriptor's `permissions.secrets` and in the
  registry `secrets` list; you set the value with `boardwalk secrets set NAME --org <your-org>`.
  **No real secrets, ever.**
- Minimal dependencies — `@boardwalk-labs/workflow` and the platform, nothing else unless the
  template is *about* a dependency.

## Running the harness

```sh
node harness/run.mjs                 # uses `boardwalk` from PATH
BOARDWALK_CLI="node ../cli/bin/boardwalk.js" node harness/run.mjs
```

It validates every template (`boardwalk check`), checks registry/filesystem consistency, and
executes the agent-free templates end-to-end through the self-hosted server engine (set
`BOARDWALK_SERVER` to the `boardwalk-server` binary). (Agent templates execute in the
scheduled platform battery.)

## Contributing a template

A new template needs a primitive or pattern not already covered, the conventions above, and a
green harness. Keep each template to one idea; don't bundle unrelated features.

## The Boardwalk repos

- [`boardwalk`](https://github.com/boardwalk-labs/boardwalk) — the open-source single-node engine: cron scheduling, webhooks, durable runs, run history
- [`sdk-typescript`](https://github.com/boardwalk-labs/sdk-typescript) — `@boardwalk-labs/workflow`, the TypeScript API a workflow program imports
- [`cli`](https://github.com/boardwalk-labs/cli) — `boardwalk`: scaffold, validate, run, deploy
- [`plugins`](https://github.com/boardwalk-labs/plugins) — coding-agent skills (Claude Code, Codex, Cursor, OpenClaw, OpenCode) + a control-plane MCP server
- [`runner`](https://github.com/boardwalk-labs/runner) — self-hosted runner: your machines execute hosted-scheduled runs

Hosted platform and docs: [boardwalk.sh](https://boardwalk.sh).

## License

MIT
