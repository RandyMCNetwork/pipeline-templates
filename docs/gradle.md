# Gradle Lifecycle Job

Reusable Gradle job. It checks out the caller and runs all lifecycle tasks in one Gradle
invocation on one runner. This avoids a second runner VM when a target pipeline needs both checks
and publishing.

```yaml
jobs:
  gradle:
    uses: RandyMCNetwork/pipeline-templates/.github/workflows/gradle.yml@main
    with:
      java-version: '25'
      lifecycle: check publish
      app-version: ${{ needs.version.outputs.version }}
      gradle-arguments: -PbuildChannel=prod
    secrets: inherit
```

`lifecycle` accepts standard Gradle tasks, such as `check`, `build`, `test`, `publish`, or a
space-separated combination. Gradle resolves task dependencies, so `check publish` does not run a
shared dependency twice.

`app-version` is optional. When set, the template passes it as `-Pversion=<app-version>`, matching
the existing Gradle publishing convention. Use `gradle-arguments` for further project-specific
Gradle properties, such as `-Pversion=...` or `-PbuildChannel=prod`.

`REPOSILITE_USER` and `REPOSILITE_TOKEN` are optional. Pass them only when the target build needs
private dependency resolution or publishing.

`runs-on` is optional and defaults to `self-hosted`. Set it to `ubuntu-latest` if the build should run on a GitHub-hosted runner instead.

`timeout-minutes` is optional and defaults to `45`.

