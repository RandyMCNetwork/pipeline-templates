# RandyMCNetwork Job Templates

Reusable GitHub Actions **jobs**, not complete pipelines. Every consuming project owns its
triggers, branch rules, concurrency, `if` conditions, job names, dependencies, and deploy flow.
Use only the jobs that fit that project.

## Available templates

- [Commitlint](docs/commitlint.md)
- [Gradle lifecycle](docs/gradle.md)
- [Gradle change detection](docs/gradle-changes.md)
- [Node check](docs/node-check.md)
- [Renovate](docs/renovate.md)
- [Promotion PR](docs/promotion-pr.md)
- [Resolve publish version](docs/resolve-publish-version.md)
- [Tag version](docs/tag-version.md)
- [Build and push a GHCR image](docs/ghcr-build.md)
- [Deploy a repository script via SSH](docs/ssh-deploy.md)
- [Clean Maven package versions](docs/cleanup-maven.md)
- [Clean GHCR package versions](docs/cleanup-ghcr.md)
- [BetterModel pack](docs/bettermodel-pack.md)

## Self-hosted runner pools

All jobs default to self-hosted runners:

| Pool | Jobs | Selector |
| --- | --- | --- |
| macOS heavy | Gradle, BetterModel/Paper | `["self-hosted","macOS","ARM64","heavy"]` |
| Linux heavy | Node checks, Docker/GHCR, Renovate | `["self-hosted","Linux","X64","heavy"]` |
| Linux light | Commitlint, change detection, version/tag, promotion, cleanup, SSH deployment | `light` |

Configurable `runs-on` inputs accept one label or a JSON array of labels. Caller overrides
still take precedence. Light runners intentionally advertise only `light`, so general
`self-hosted` jobs cannot accidentally consume them. Cache selection uses the actual
`runner.environment`, not the selected label text; self-hosted jobs default to local caches.
The public template repository also needs access to its selected self-hosted runner group.

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
