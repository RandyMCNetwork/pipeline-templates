# Recommended CI Workflow

Use this file in consuming repositories as `.github/workflows/ci.yml`.

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

## When to Use It

Use this CI workflow for Gradle repositories that should validate feature, fix, hotfix, and Codex branches before merging.

It intentionally ignores documentation-only changes and GitHub workflow changes, because the reusable template itself covers the shared workflow behavior.
