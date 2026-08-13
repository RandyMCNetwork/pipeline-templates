# Clean Maven Package Versions Job

Reusable scheduled cleanup job for Maven packages in a GitHub organization. It keeps the newest
three versions independently for stable releases (`main`), `*-dev-SNAPSHOT` (`dev`), and
`*-RC-SNAPSHOT` (`test`). Other versions, including PR snapshots, are never deleted.

The caller owns scheduling. `package-name` is the exact GitHub Packages Maven package name and is
required because it can differ from the repository name.

```yaml
name: Clean Maven packages

on:
  schedule:
    - cron: '23 3 * * *'
  workflow_dispatch:

permissions:
  contents: read
  packages: write

jobs:
  cleanup:
    uses: RandyMCNetwork/pipeline-templates/.github/workflows/cleanup-maven.yml@main
    with:
      package-name: com.example.my-library
```

Set `owner` only when the package belongs to a different organization. The calling repository must
have admin access to the Package; `packages: write` alone cannot grant that access.
