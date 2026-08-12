# Commitlint Template

Reusable workflow: `.github/workflows/commitlint.yml`

Use this job template to validate Conventional Commit messages. The calling workflow decides
which events and branches should run it.

## How to Call It

```yaml
jobs:
  commitlint:
    name: Commitlint
    uses: RandyMCNetwork/pipeline-templates/.github/workflows/commitlint.yml@main
    with:
      template-ref: main
```

## Trigger

This template only supports `workflow_call`. It does not run directly on pushes or pull requests inside `RandyMCNetwork/pipeline-templates`.

Add the event triggers, branch filters, job conditions, and concurrency settings in the
consuming repository's workflow.

## What It Does

1. Checks out the consuming repository with full history.
2. Installs `@commitlint/cli` and `@commitlint/config-conventional`.
3. Checks out this public template repository into `.template-source` at `template-ref`.
4. Runs commitlint using `.github/commitlint.config.cjs` from this repository.

## Rules

Commit subjects must follow Conventional Commits:

```text
feat: add inventory template
fix(cache): prevent stale lock reuse
docs: document pipeline usage
```

Breaking changes are detected through `!` or `BREAKING CHANGE`.

## Notes

There are no branch-name rules in this template. Put branch policy in the target project's
workflow, where it can match the project policy.
