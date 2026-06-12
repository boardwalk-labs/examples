# tournament

Rank a list by pairwise comparison instead of absolute scoring. A deterministic merge sort holds
the bracket; one fresh agent judges each matchup, so only two items are ever in context at once.

## Setup

1. `boardwalk init my-ranker --template tournament` (or copy this directory)
2. No secrets required.

## Run

```sh
boardwalk check .
boardwalk run . --org <your-org> \
  --input '{"items": ["login is broken", "typo in footer", "data loss on save"], "criterion": "higher severity", "topK": 1}'
```

## How it works

- A `sort()` (plain merge sort) orders the items; its comparator is a single `agent()` call that
  answers only "A or B?" — comparative judgment is far steadier than asking a model to score 1–10.
- The loop keeps the running order in code, so the context stays tiny no matter how many items
  you rank. Independent subtrees sort in parallel. Cost is ~`n·log(n)` comparisons.
- Take `ranked[0]` for a single winner, or the whole `ranked` list for a full ordering.

## Make it yours

Same comparator covers both picking a single winner from many drafts and ordering a large list
(1,000+ tickets by severity) — just change `topK`. For a very large list, bucket the items, rank
each bucket in parallel, and merge.
