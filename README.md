# RandyMCNetwork Job Templates

Reusable GitHub Actions **jobs**, not complete pipelines. Every consuming project owns its
triggers, branch rules, concurrency, `if` conditions, job names, dependencies, and deploy flow.
Use only the jobs that fit that project.

## Available templates

- [Commitlint](docs/commitlint.md)
- [Gradle lifecycle](docs/gradle.md)
- [Gradle change detection](docs/gradle-changes.md)
- [Node check](docs/node-check.md)
- [Resolve publish version](docs/resolve-publish-version.md)
- [Tag version](docs/tag-version.md)
- [Build and push a GHCR image](docs/ghcr-build.md)

## Rules for consumers

- A pipeline belongs in the consuming repository, never here.
- Pass project-specific commands and properties as workflow inputs.
- Keep deploy steps tied to the target infrastructure; this repository only builds a container image.
- Start with `main`, then pin production callers to a release tag or commit when one exists. Pass
  the same ref to `template-ref` when using Commitlint or Resolve Publish Version.
- Publish credentials are repository or organization secrets of the consuming repository.

### Small composition example

The target project decides the event and job order. This shows only the composition pattern:

```yaml
jobs:
  commits:
    uses: RandyMCNetwork/pipeline-templates/.github/workflows/commitlint.yml@main
    with:
      template-ref: main

  checks:
    needs: commits
    uses: RandyMCNetwork/pipeline-templates/.github/workflows/gradle.yml@main
    with:
      java-version: '25'
      lifecycle: check
```
