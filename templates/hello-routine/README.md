# hello-routine

The smallest useful workflow: one `agent()` call, one returned output. ~20 lines.

## Setup

1. `boardwalk init my-routine --template hello-routine` (or copy this directory)
2. There's no step 2 — it needs no secrets.

## Run

```sh
boardwalk check .                 # validate locally — no account
boardwalk run . --org <your-org>  # deploy + run on hosted Boardwalk
```

`agent()` names no model and no provider, so Boardwalk routes it automatically — that's the
default on every engine. Your own keys are used only when you name a provider explicitly.

## Make it yours

Change the prompt. That's the whole template — it exists so your first green run is minutes away,
and so you can see the shape of a workflow: a `workflow.jsonc` deployment descriptor (the policy
the control plane reads without executing your code), and `src/index.ts` exporting a default
`run()` function the platform calls — whatever it returns is the run's output.
