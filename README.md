# RandyMCNetwork Pipeline Templates

Reusable GitHub Actions workflows for RandyMCNetwork Gradle libraries and Paper projects.

The recommended setup is:

- CI on protected branches, pull requests, and short-lived branches: commitlint plus `./gradlew check --no-daemon`.
- CD on `main`: resolve the next semantic version, tag `v<version>`, and publish stable artifacts to `artifacts`.
- CD on `dev` and eligible pull requests: publish snapshot artifacts to `artifact-snapshots`.

## Quick Start

Create these two files in the consuming repository.

### `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches:
      - main
      - dev
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
- Repository or organization secrets named `REPOSILITE_USER` and `REPOSILITE_TOKEN` available to the consuming repository.
- Branches named `main` for stable artifacts and `dev` for snapshots.
- Branch protection or repository rules should require CI before changes land on `main` and `dev`.

Called reusable workflows do not receive secrets from this template repository. Publish secrets must be configured on the consuming repository or as organization secrets with access to the consuming repository.

## Agent Migration Prompt

Copy this prompt into a project agent when you want to migrate a repository to these shared pipeline templates.

```text
Migrate this repository to the shared RandyMCNetwork pipeline template structure.

Goal:
- Use the reusable workflows from `RandyMCNetwork/pipeline-templates`.
- CI must validate Conventional Commits and run `./gradlew check --no-daemon`.
- CD must publish stable versions from `main` without running `./gradlew check` again.
- CD must publish snapshot versions from `dev` without running `./gradlew check` again.
- Pull requests from `feature/**`, `codex/**`, `fix/**`, and `hotfix/**` must publish PR snapshots when publishing is configured.
- CI must be the quality gate. CD must not use Semantic Release as a check job.
- Keep the change small and do not refactor unrelated code.

Repository classification:
1. Decide whether this repository publishes API/implementation dependencies or server-loader artifacts.
2. Use API repositories for dependencies that other Gradle builds resolve directly, including:
   - APIs
   - Gradle plugin implementations
   - normal `implementation` dependencies
   - `compileOnly` dependencies
   Configure API/implementation publishing like this:
   - non-SNAPSHOT versions -> `https://repo.milu.me/releases`
   - SNAPSHOT versions -> `https://repo.milu.me/snapshots`
3. Use artifact repositories only for libraries that the Minecraft server runtime loader downloads at runtime. Configure runtime-loader artifact publishing like this:
   - non-SNAPSHOT versions -> `https://repo.milu.me/artifacts`
   - SNAPSHOT versions -> `https://repo.milu.me/artifact-snapshots`
4. If the repository type is unclear, stop and ask whether it is "API/Implementation Dependency" or "Runtime Loader Artifact" before changing publish URLs.

Implementation steps:
1. Inspect existing `.github/workflows/*`, `build.gradle*`, `settings.gradle*`, `gradle.properties`, `gradlew`, and publishing configuration.
2. Replace or add `.github/workflows/ci.yml` using `https://github.com/RandyMCNetwork/pipeline-templates/blob/main/docs/recommended-ci.md`.
3. Replace or add `.github/workflows/cd.yml` using `https://github.com/RandyMCNetwork/pipeline-templates/blob/main/docs/recommended-cd.md`.
4. Configure Gradle `maven-publish` so every published subproject has a `MavenPublication`, sources JAR, and Javadoc JAR when appropriate.
5. Ensure `./gradlew publish -Pversion=<resolved-version> --no-daemon` publishes to the correct Reposilite repository based on whether the version contains `SNAPSHOT`.
6. Ensure publish credentials are read from `REPOSILITE_USER` and `REPOSILITE_TOKEN`.
7. Verify the consuming repository has access to these secrets through repository secrets or organization secrets.
8. Run `./gradlew check --no-daemon` locally and make sure the CI workflow runs it.
9. Verify branch protection or repository rules require CI before changes land on `main` and `dev`.
10. Run `./gradlew publishToMavenLocal --no-daemon` if publishing configuration changed.
11. Validate workflow YAML syntax.
12. Search for old `RandyMCNetwork/templates` references and remove them.
13. Commit with a Conventional Commit message and push.

Expected workflow references:
- `RandyMCNetwork/pipeline-templates/.github/workflows/commitlint.yml@main`
- `RandyMCNetwork/pipeline-templates/.github/workflows/semantic-release.yml@main`
- `RandyMCNetwork/pipeline-templates/.github/workflows/upload-to-reposilite.yml@main`

Important auth note:
- Called reusable workflows do not receive secrets from `RandyMCNetwork/pipeline-templates`.
- `secrets: inherit` passes secrets from the consuming repository or organization to the reusable workflow.
- Do not pass `secrets: inherit` to the commitlint job; it does not need secrets.
- Stable release publishing needs `contents: write` because the workflow creates and pushes `v<version>` tags.

Final response:
- List changed files.
- State the repository classification: API/Implementation Dependency or Runtime Loader Artifact.
- State the selected stable and snapshot Reposilite URLs.
- State commands run and whether they passed.
- Include the commit hash and pushed branch.
```

## Templates

- [Commitlint](docs/commitlint.md)
- [Semantic Release](docs/semantic-release.md)
- [Upload to Reposilite](docs/upload-to-reposilite.md)
- [Recommended CI](docs/recommended-ci.md)
- [Recommended CD](docs/recommended-cd.md)
- [Version Resolver](docs/resolve-publish-version.md)
