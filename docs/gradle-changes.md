# Gradle Change Detection Job

Reusable Gradle-relevant change detection. It uses `dorny/paths-filter` rather than a custom Git
diff script and returns `needs.changes.outputs.changed` as `true` or `false`.

```yaml
jobs:
  changes:
    uses: RandyMCNetwork/pipeline-templates/.github/workflows/gradle-changes.yml@main

  checks:
    needs: changes
    if: needs.changes.outputs.changed == 'true'
    uses: RandyMCNetwork/pipeline-templates/.github/workflows/gradle.yml@main
    with:
      lifecycle: check
```

The default filter covers source files, Gradle wrappers/configuration, and common Java quality
configuration. Use `filters` to add project-specific rules in the syntax accepted by
`dorny/paths-filter`.
