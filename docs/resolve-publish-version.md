# Resolve Publish Version Job

Script: `.github/scripts/resolve-publish-version.mjs`

This reusable job resolves Maven publish versions from Git tags and Conventional Commit
messages. It returns outputs for later jobs; it does not publish, tag, or decide when a
release happens.

## How to Call It

```yaml
jobs:
  version:
    uses: RandyMCNetwork/pipeline-templates/.github/workflows/resolve-publish-version.yml@main
    with:
      mode: dev # next, dev, rc, or pr
      template-ref: main
```

For pull requests, pass `mode: pr` and `pull-request-number: ${{ github.event.number }}`.
Use `needs.version.outputs.version` in the publish or tag job.

## Modes

```shell
node .github/scripts/resolve-publish-version.mjs next
node .github/scripts/resolve-publish-version.mjs dev
node .github/scripts/resolve-publish-version.mjs pr 123
```

## Output

The script writes GitHub Actions output keys:

```text
version=1.2.3
next=1.2.3
base=1.2.2
bump=patch
release=true
tag=v1.2.2
```

## Version Formats

- `next`: `<next>`
- `dev`: `<next>-dev-SNAPSHOT`
- `rc`: `<next>-RC-SNAPSHOT`
- `pr <number>`: `<next>-PR<number>-SNAPSHOT`

## Bump Rules

- First release with no existing `v<semver>` tag and a release-relevant commit: `1.0.0`
- `feat:`: minor bump
- `fix:`, `perf:`, or `hotfix:`: patch bump
- `chore(deps):` and Renovate's `chore(deps-...)`: patch bump
- `!`, `BREAKING CHANGE`, or `BREAKING-CHANGE`: major bump
- All other commit types, including plain `chore:`, do not create a release. The job returns
  `release=false` and leaves `version` and `next` empty.

Consumers must gate publish, image, deployment, and tag jobs with
`needs.version.outputs.release == 'true'`. A non-release change makes the `version` job succeed
and skips the remaining CD jobs.

## Gradle Fallback

If no release tag exists, the script reports a fallback `base` from `build.gradle.kts` or `build.gradle` when possible. This does not change the first release version; the first release is still `1.0.0`.
