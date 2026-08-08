# RandyMCNetwork Pipeline Templates

Reusable GitHub Actions workflows for RandyMCNetwork Gradle libraries and Paper projects.

The recommended setup is:

- CI on pull requests and short-lived branches: commitlint plus `./gradlew check --no-daemon`.
- CD on `main`: resolve the next semantic version, tag `v<version>`, and publish a release.
- CD on `dev` and eligible pull requests: publish snapshot artifacts.

## Quick Start

Create these two files in the consuming repository.

### `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches:
      - 'feature/**'
      - 'codex/**'
      - 'fix/**'
      - 'hotfix/**'
    paths-ignore:
      - '**/*.md'
      - 'docs/**'
      - '.agents/**'
      - '.github/**'
      - '.idea/**'
      - '.vscode/**'
  pull_request:
    types: [opened, synchronize, reopened]
    paths-ignore:
      - '**/*.md'
      - 'docs/**'
      - '.agents/**'
      - '.github/**'
      - '.idea/**'
      - '.vscode/**'

concurrency:
  group: ci-${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: true

permissions:
  contents: read

jobs:
  commitlint:
    name: Commitlint
    uses: RandyMCNetwork/pipeline-templates/.github/workflows/commitlint.yml@main
    secrets: inherit

  gradle:
    name: Gradle checks
    if: >
      github.event_name == 'push' ||
      startsWith(github.head_ref, 'feature/') ||
      startsWith(github.head_ref, 'codex/') ||
      startsWith(github.head_ref, 'fix/') ||
      startsWith(github.head_ref, 'hotfix/')
    needs: commitlint
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up JDK 25
        uses: actions/setup-java@v4
        with:
          java-version: '25'
          distribution: 'temurin'
          cache: gradle

      - name: Grant execute permission for gradlew
        run: chmod +x gradlew

      - name: Run Gradle checks
        run: ./gradlew check --no-daemon
```

### `.github/workflows/cd.yml`

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

## Requirements

- `gradlew` in the consuming repository.
- A working Gradle `check` task.
- JDK 25 compatible project configuration.
- Conventional Commit messages.
- `maven-publish` configured for Reposilite.
- Repository secrets named `REPOSILITE_USER` and `REPOSILITE_TOKEN`.
- Branches named `main` for releases and `dev` for snapshots.

## Templates

- [Commitlint](docs/commitlint.md)
- [Semantic Release](docs/semantic-release.md)
- [Upload to Reposilite](docs/upload-to-reposilite.md)
- [Recommended CI](docs/recommended-ci.md)
- [Recommended CD](docs/recommended-cd.md)
- [Version Resolver](docs/resolve-publish-version.md)
