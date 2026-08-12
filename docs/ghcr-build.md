# Build and Push GHCR Image Job

Reusable container-build job. It logs in to GHCR, produces standard SHA and default-branch tags,
uses GitHub Actions cache, and returns an immutable digest reference. Deployment is deliberately
not included.

```yaml
jobs:
  image:
    uses: RandyMCNetwork/pipeline-templates/.github/workflows/ghcr-build.yml@main
    with:
      build-args: |
        NEXT_PUBLIC_APP_VERSION=${{ github.sha }}
    permissions:
      contents: read
      packages: write
```

Use `needs.image.outputs.image-ref` in an infrastructure-specific deploy job in the target
repository. `image` must already be lowercase because GHCR rejects uppercase image names.
When `image` is omitted, the template derives and lowercases `ghcr.io/<owner>/<repository>` from
the calling repository.
