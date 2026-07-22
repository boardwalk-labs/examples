# hello-routine

The smallest useful workflow: one `agent()` call, one `output()`. ~20 lines.

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
and so you can see the shape of a workflow: a pure-literal `meta` (the contract engines read
without executing your code), then the program as the module body — a script that runs top to
bottom, top-level await and all.
