## Repowise-first codebase context

This repository is indexed in Repowise as `pipeline-templates`. Treat its Repowise index as the primary source of codebase context.

- Start repository questions with Repowise: use `get_overview`, `get_answer`, `get_context`, `get_symbol`, `get_risk`, or `get_why`.
- When a tool supports it, explicitly query `repo="pipeline-templates"`.
- Use `Read`, `Grep`, and `Glob` only to verify code before editing or when Repowise cannot provide the required detail.
- Do not re-read source ranges returned with `verified: true`, unless Repowise reports stale or approximate bounds.
- Before editing, use `get_risk` for blast radius and tests; use `get_why` before changing an established pattern or architectural decision.
