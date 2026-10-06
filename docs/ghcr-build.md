# Build and Push GHCR Image Job

Reusable container-build job. It logs in to GHCR, produces standard SHA and default-branch tags,
uses runner-appropriate BuildKit caching, and returns an immutable digest reference. Deployment is
deliberately not included.

```yaml
jobs:
  image:
    uses: RandyMCNetwork/pipeline-templates/.github/workflows/ghcr-build.yml@main
    with:
      runs-on: self-hosted
      build-args: |
        NEXT_PUBLIC_APP_VERSION=${{ github.sha }}
    permissions:
      contents: read
      packages: write
```

Use `needs.image.outputs.image-ref` in an infrastructure-specific deploy job in the target
repository. `image` must already be lowercase because GHCR rejects uppercase image names.
When `image` is omitted, the template derives and lowercases `ghcr.io/<owner>/<repository>` from
the calling repository. Builds from `main`, `dev`, and `test` also receive immutable
`main-sha-<shortsha>`, `dev-sha-<shortsha>`, or `test-sha-<shortsha>` tags. These tags allow the
GHCR cleanup template to retain the latest three images for each channel independently.

`runs-on` defaults to `self-hosted`. The runner must have Docker available for Buildx. Set
`runs-on: ubuntu-latest` to opt a caller back into a GitHub-hosted runner.

`platforms` specifies the target platform(s) for the container image (e.g. `linux/amd64`, `linux/arm64`, or `linux/amd64,linux/arm64`). It defaults to `linux/amd64` to match standard server deployments across hosted and self-hosted runners.

GitHub-hosted runners use the GitHub Actions BuildKit cache. Self-hosted runners keep BuildKit's
state in a named builder across jobs, so image layers stay on the runner and do not use the cloud
cache service. The Buildx binary cache is also disabled for self-hosted runs.
