# Commitlint Template

Reusable workflow: `.github/workflows/commitlint.yml`

Use this template to validate Conventional Commit messages on pull requests and short-lived branches.

## How to Call It

```yaml
jobs:
  commitlint:
    name: Commitlint
    uses: RandyMCNetwork/pipeline-templates/.github/workflows/commitlint.yml@main
```

## Trigger

This template only supports `workflow_call`. It does not run directly on pushes or pull requests inside `RandyMCNetwork/pipeline-templates`.

Add the push and pull request triggers in the consuming repository's CI workflow.

## What It Does

1. Checks out the consuming repository with full history.
2. Installs `@commitlint/cli` and `@commitlint/config-conventional`.
3. Checks out this public template repository into `.template-source`.
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

The workflow validates only eligible branch names for pull requests. This keeps dependency update branches and other external automation from failing unless they intentionally use the project branch pattern.
