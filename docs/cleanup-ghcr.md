# Clean GHCR Package Versions Job

Reusable scheduled cleanup job for a GHCR container package in a GitHub organization. It keeps the
newest three images independently by immutable tags: `main-sha-<shortsha>`,
`dev-sha-<shortsha>`, and `test-sha-<shortsha>`. A version is retained when any of its channel tags
is within that channel's newest three. Legacy images and images without one of those tags are never
deleted.

```yaml
name: Clean container packages

on:
  schedule:
    - cron: '37 3 * * *'
  workflow_dispatch:

permissions:
  contents: read
  packages: write

jobs:
  cleanup:
    uses: RandyMCNetwork/pipeline-templates/.github/workflows/cleanup-ghcr.yml@main
    with:
      package-name: my-service
```

`package-name` is required and excludes `ghcr.io/<owner>/`. Set `owner` only for a different
organization. The calling repository must have admin access to the package.
