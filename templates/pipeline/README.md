# pipeline

Two workflows composing via **`workflows.call`**: the parent fans a list of URLs through the
child (one durable child run per URL) and aggregates the summaries. Composition is just code — a
loop and an `await`, no DAG syntax.

This template is **two packages** (one workflow per project directory, so each keeps its own
deploy link):

```
pipeline/
  parent/   — "pipeline": fans out + aggregates
  child/    — "pipeline-child": fetch one URL, summarize it
```

## Deploy (child first — the parent calls it by slug)

```sh
boardwalk deploy child  --org <your-org>
boardwalk deploy parent --org <your-org>
boardwalk run parent --org <your-org> \
  --input '{"urls":["https://example.com","https://news.ycombinator.com"]}'
```

## Why `workflows.call` instead of a function call?

- **Durability:** each child is a real run — own history, own budget, own retry story. If the
  parent crashes and restarts, the idempotent call re-attaches to the same child instead of
  running it twice.
- **Independence:** the child is also a normal workflow — run it alone, give it its own
  triggers, evolve it separately. The parent only depends on its slug and input shape.

Want the fan-out concurrent? Wrap the calls in `parallel()` — but sequential is the right
default until the child is proven idempotent against your real side effects.
