# SPEC — `examples`

> The template gallery behind `boardwalk init`, and the top of the funnel. MIT. Public in **Phase 1**.
>
> **Every template is a parity test**: it must run unmodified under the self-hosted engine and the hosted Boardwalk platform.

## 1. Purpose

Working, copyable workflows that (a) get a new user from zero to a green run in minutes, (b) demonstrate each core primitive in a real context, and (c) continuously prove the parity promise in CI. A template that needs per-engine edits is rejected.

## 2. Repository shape

```
templates/
  <template-name>/
    workflow.jsonc    — the deployment descriptor (slug, triggers, permissions, budget)
    src/index.ts      — the workflow program: `export default async function run(input, context)`
    package.json      — name, deps (minimal), boardwalk template metadata
    tsconfig.json     — editor/typecheck config (the scaffold shape)
    README.md         — what it does, setup in <5 steps, how to run (check / run / self-host)
registry.json         — template index consumed by `boardwalk init` (name, description, tags, required secrets)
harness/              — CI runner that executes every template end-to-end
```

Rules:
- **No secrets, ever** — secrets are named in the registry `secrets` list and set with `boardwalk secrets set`; CI provides real values from its own secret store.
- **Multi-workflow templates** (e.g. `pipeline`) hold one sub-package per workflow (`parent/`, `child/`) — one workflow per project directory keeps each deploy link separate; the registry entry lists its `packages`.
- **Model-omission-friendly:** templates call `agent(prompt)` without a model by default — the default `boardwalk` provider routes automatically on every engine; a commented line shows the explicit-model form.
- **Minimal dependencies** per template; each template is a standalone npm project (`init` copies it out verbatim).
- Each `README.md` is the template's docs page; `registry.json` descriptions are one sentence.

## 3. Initial template set (v1)

| Template | Demonstrates |
|---|---|
| `hello-routine` | The 20-line floor: manual trigger, one `agent()` call, one returned output |
| `claude-code-cron` | **The migration template:** an existing `claude -p` script run on a cron via `child_process` — zero-rewrite hosting for Claude Code scripts |
| `morning-digest` | Cron + `secrets.get` (a GitHub PAT) + `agent()` summarization |
| `webhook-responder` | Webhook trigger (`token` auth) + a typed `run(input)` payload + conditional logic |
| `fan-out-judge` | `parallel()` over `agent()` calls + `schema` structured output |
| `pipeline` | `workflows.call` composition: a parent workflow durably invoking a child |
| `long-watch` | `sleep({ until })` + budget caps — the hold-and-pay pattern done right |

Additions require: a distinct primitive or pattern not already covered, plus the parity bar.

## 4. CI (the harness)

- On every PR: each template is validated (`check`-equivalent) and the agent-free ones **executed end-to-end** under the self-hosted server engine with CI-provided env; asserts terminal status `completed` and the expected output.
- **Modes exercised in CI:** `harness/run.mjs` (zero-dep) runs `boardwalk check` on every package, enforces registry ⇄ filesystem consistency, then runs the agent-free templates (`webhook-responder`, `long-watch`) end-to-end under the **self-hosted server** engine via `boardwalk build` → `boardwalk-server` over a workflows dir → trigger through the JSON API → assert the expected output. The server leg runs when `$BOARDWALK_SERVER` names the binary (from `@boardwalk-labs/engine`); `$BOARDWALK_CLI` overrides the CLI. The agent templates need provider keys, so in CI they're covered by `check` and run end-to-end where keys are available.
- The **hosted-platform** leg needs an account and is verified platform-side, not in OSS CI.
- A template whose external dependency is flaky gets a recorded/stubbed variant for PR CI and keeps the live variant in the scheduled run — never a skipped test.

## 5. Ready to go public when

1. All v1 templates green in the harness under the self-hosted server path; platform path green for `hello-routine`, `morning-digest`, `claude-code-cron` at minimum.
2. `boardwalk init <name>` consumes `registry.json` and produces a project that runs without edits (beyond setting its secrets).
3. Publication checklist passes.
