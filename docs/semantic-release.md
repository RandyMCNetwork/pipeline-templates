# Semantic Release Template

Reusable workflow: `.github/workflows/semantic-release.yml`

Use this template to publish stable artifacts from `main`.

## How to Call It

```yaml
jobs:
  deploy-release:
    name: Deploy release
    if: github.event_name == 'push' && github.ref_name == 'main'
    uses: RandyMCNetwork/pipeline-templates/.github/workflows/semantic-release.yml@main
    permissions:
      contents: write
    secrets: inherit
```

## Required Secrets

- `REPOSILITE_USER`
- `REPOSILITE_TOKEN`

## Required Permissions

The caller must grant:

```yaml
permissions:
  contents: write
```

This is needed because the workflow creates and pushes `v<version>` tags.

## What It Does

1. Checks out the consuming repository with full history.
2. Sets up JDK 25 and Node.js 22.
3. Runs `./gradlew check --no-daemon`.
4. Resolves the next semantic version from Conventional Commits.
5. Creates a `v<version>` Git tag when it does not already exist.
6. Runs `./gradlew publish -Pversion=<version> --no-daemon`.

## Version Rules

- No existing `v<semver>` tag: first release is `1.0.0`.
- `feat:` commits produce a minor bump.
- `fix:` and `perf:` commits produce a patch bump.
- `!`, `BREAKING CHANGE`, or `BREAKING-CHANGE` produces a major bump.
- If no bump is detected after an existing release tag, the next version is a patch bump.

## Gradle Publishing Expectation

The consuming project decides where stable artifacts go. The usual RandyMCNetwork library setup routes non-SNAPSHOT versions to:

```text
https://repo.milu.me/artifacts
```
