---
name: reviewer
description: How to review a code diff for correctness, security, and clarity
---

# Reviewing a diff

Work through the change in this order, and be specific — cite the exact file and line.

1. **Correctness** — does it do what it claims? Look for off-by-one errors, inverted conditionals,
   unhandled `null`/`undefined`, broken error paths, and edge cases the change forgot.
2. **Security** — untrusted input reaching a query, command, path, or request; secrets in code or
   logs; missing authorization checks. For the full list, load the bundled checklist with
   `skill({ name: "reviewer", file: "checklist.md" })` and apply each item.
3. **Clarity** — names that mislead, dead code, and comments that explain *why* rather than *what*.

Return a one-line verdict (`approve` or `request-changes`), then a bulleted list of findings. Each
finding gets a `file:line` reference and a concrete suggested fix. If the diff is clean, say so
plainly rather than inventing nits.
