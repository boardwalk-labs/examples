# SPEC — `boardwalk-examples`

> The template gallery behind `boardwalk init`, and the top of the funnel. MIT. Public in **Phase 1**.
>
> Governing context: root [`MASTER_SPEC.md`](../MASTER_SPEC.md) §5.3 — **every template is a parity test**: it must run unmodified under `boardwalk dev`, the self-hosted engine, and Boardwalk Cloud.

## 1. Purpose

Working, copyable workflows that (a) get a new user from zero to a green run in minutes, (b) demonstrate each core primitive in a real context, and (c) continuously prove the parity promise in CI. A template that needs per-engine edits is rejected.

## 2. Repository shape

```
templates/
  <template-name>/
    index.ts          — the workflow program
    package.json      — name, deps (minimal), boardwalk template metadata
    .env.example      — every secret/env var the template needs, with comments
    README.md         — what it does, setup in <5 steps, how to run (dev / self-host / deploy)
registry.json         — template index consumed by `boardwalk init` (name, description, tags, required secrets)
harness/              — CI runner that executes every template end-to-end
```

Rules:
- **No secrets, ever** — `.env.example` placeholders only; CI provides real values from its own secret store.
- **Multi-workflow templates** (e.g. `pipeline`) hold one sub-package per workflow (`parent/`, `child/`) — one workflow per project directory keeps each deploy link separate; the registry entry lists its `packages`.
- **Model-omission-friendly:** templates call `agent(prompt)` without a model by default (works on Cloud routing and on a locally configured default); a commented line shows the explicit-model form.
- **Minimal dependencies** per template; each template is a standalone npm project (`init` copies it out verbatim).
- Each `README.md` is the template's docs page; `registry.json` descriptions are one sentence.

## 3. Initial template set (v1)

| Template | Demonstrates |
|---|---|
| `hello-routine` | The 20-line floor: manual trigger, one `agent()` call, `output()` |
| `claude-code-cron` | **The migration template:** an existing `claude -p` script run on a cron via `child_process` — zero-rewrite hosting for Claude Code scripts |
| `morning-digest` | Cron + `secrets.get` (a GitHub PAT) + `agent()` summarization + `output()` |
| `webhook-responder` | Webhook trigger (`token` auth) + `input` payload + conditional logic |
| `fan-out-judge` | `parallel()` over `agent()` calls + `schema` structured output |
| `pipeline` | `workflows.call` composition: a parent workflow durably invoking a child |
| `long-watch` | `sleep({ until })` + budget caps — the hold-and-pay pattern done right |

Additions require: a distinct primitive or pattern not already covered, plus the parity bar.

## 4. CI (the harness)

- On every PR: each template is validated (`check`-equivalent) and **executed end-to-end** under the local engine with CI-provided env; asserts terminal status `completed` and a non-empty event stream.
- **v0.1 status:** `harness/run.mjs` (zero-dep, `$BOARDWALK_CLI` or `boardwalk` on PATH) runs `boardwalk check` on every package, enforces registry ⇄ filesystem ⇄ `.env.example` consistency, and dev-executes the agent-free templates (`webhook-responder`, `long-watch`) against a local HTTP fixture. The agent templates join the dev battery when the local engine ships; until then they're covered by `check` + the scheduled Cloud battery.
- On a schedule: the same battery against Boardwalk Cloud via the public CLI path (deploy → run → assert), so Cloud parity regressions surface here.
- A template whose external dependency is flaky gets a recorded/stubbed variant for PR CI and keeps the live variant in the scheduled run — never a skipped test.

## 5. Ready to go public when

1. All v1 templates green in the harness under the local path (`dev`); Cloud path green for `hello-routine`, `morning-digest`, `claude-code-cron` at minimum.
2. `boardwalk init <name>` consumes `registry.json` and produces a project that runs without edits (beyond `.env`).
3. Publication checklist (MASTER_SPEC §8) passes.
