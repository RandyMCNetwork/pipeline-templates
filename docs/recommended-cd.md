# Recommended CD Workflow

Use this file in consuming repositories as `.github/workflows/cd.yml`.

```yaml
name: CD

on:
  push:
    branches:
      - main
      - dev
  pull_request:
    types: [opened, synchronize, reopened]

concurrency:
  group: cd-${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: true

permissions:
  contents: read

jobs:
  deploy-release:
    name: Deploy release
    if: github.event_name == 'push' && github.ref_name == 'main'
    uses: RandyMCNetwork/pipeline-templates/.github/workflows/semantic-release.yml@main
    permissions:
      contents: write
    secrets: inherit

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

## When to Use It

Use this CD workflow for libraries and Gradle artifacts that should publish automatically:

- `main` publishes stable release versions.
- `dev` publishes development snapshots.
- Eligible pull requests publish PR snapshots.

## Required Setup

Add these repository secrets in the consuming repository:

- `REPOSILITE_USER`
- `REPOSILITE_TOKEN`

The consuming repository also needs a `maven-publish` setup that routes release and snapshot versions to the correct Reposilite repositories.
