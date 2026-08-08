# Version Resolver

Script: `.github/scripts/resolve-publish-version.mjs`

This helper resolves Maven publish versions from Git tags and Conventional Commit messages.

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
tag=v1.2.2
```

## Version Formats

- `next`: `<next>`
- `dev`: `<next>-dev-SNAPSHOT`
- `pr <number>`: `<next>-PR<number>-SNAPSHOT`

## Bump Rules

- First release with no existing `v<semver>` tag: `1.0.0`
- `feat:`: minor bump
- `fix:` or `perf:`: patch bump
- `!`, `BREAKING CHANGE`, or `BREAKING-CHANGE`: major bump
- No detected bump after an existing release tag: patch bump

## Gradle Fallback

If no release tag exists, the script reports a fallback `base` from `build.gradle.kts` or `build.gradle` when possible. This does not change the first release version; the first release is still `1.0.0`.
