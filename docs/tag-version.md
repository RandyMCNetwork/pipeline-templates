# Tag Version Job

Reusable job that creates and pushes a tag for a version supplied by the caller. It is idempotent
when the tag already exists.

```yaml
jobs:
  tag:
    needs: version
    uses: RandyMCNetwork/pipeline-templates/.github/workflows/tag-version.yml@main
    with:
      version: ${{ needs.version.outputs.version }}
      tag-prefix: v
    permissions:
      contents: write
```

Use this only when the target project's release flow needs Git tags. The target workflow decides
when it is safe to create one.
