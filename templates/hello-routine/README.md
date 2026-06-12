# hello-routine

The smallest useful workflow: one `agent()` call, one `output()`. ~20 lines.

## Setup

1. `boardwalk init my-routine --template hello-routine` (or copy this directory)
2. There's no step 2 — it needs no secrets.

## Run

```sh
boardwalk check .                 # validate locally — no account
boardwalk run . --org <your-org>  # deploy + run on Boardwalk Cloud
```

`agent()` names no model, so Cloud routes automatically. On a self-hosted engine it uses your
configured default model. (`boardwalk dev` runs the program locally too; `agent()` there lands
with the local engine.)

## Make it yours

Change the prompt. That's the whole template — it exists so your first green run is minutes away,
and so you can see the shape of a workflow: a pure-literal `meta` (the contract engines read
without executing your code) and a default-exported `run` function (ordinary TypeScript).
