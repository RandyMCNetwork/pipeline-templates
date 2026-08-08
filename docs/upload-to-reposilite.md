# Upload to Reposilite Template

Reusable workflow: `.github/workflows/upload-to-reposilite.yml`

Use this template to publish snapshot artifacts from `dev` and eligible pull requests.

## How to Call It

```yaml
jobs:
  deploy-snapshot:
    name: Deploy snapshot
    if: >
      (github.event_name == 'push' && github.ref_name == 'dev') ||
      (github.event_name == 'pull_request' &&
       (startsWith(github.head_ref, 'feature/') ||
        startsWith(github.head_ref, 'codex/') ||
        startsWith(github.head_ref, 'fix/') ||
        startsWith(github.head_ref, 'hotfix/')))
    uses: RandyMCNetwork/pipeline-templates/.github/workflows/upload-to-reposilite.yml@main
    permissions:
      contents: read
    secrets: inherit
```

## Required Secrets

- `REPOSILITE_USER`
- `REPOSILITE_TOKEN`

## What It Does

1. Checks out the consuming repository with full history.
2. Sets up JDK 25 and Node.js 22.
3. Checks out this public template repository into `.template-source`.
4. Resolves a snapshot version.
5. Runs `./gradlew publish -Pversion=<version> --no-daemon`.

This workflow does not run `./gradlew check`. Run checks in CI before snapshot publishing.

## Snapshot Versions

The resolver creates predictable Maven versions:

- Push to `dev`: `<next>-dev-SNAPSHOT`
- Pull request `123`: `<next>-PR123-SNAPSHOT`

`<next>` uses the same Conventional Commit rules as release publishing.

## Gradle Publishing Expectation

The consuming project decides where snapshot artifacts go. The usual RandyMCNetwork library setup routes versions containing `SNAPSHOT` to:

```text
https://repo.milu.me/artifact-snapshots
```
