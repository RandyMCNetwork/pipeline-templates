# Promotion PR Job

Reusable job that opens a pull request from `dev` to `main` whenever `dev` contains commits missing
from `main`. It never merges: approve and merge the PR when the whole of `dev` should ship, or close
it and cherry-pick instead.

```yaml
jobs:
  promote:
    needs: checks
    uses: RandyMCNetwork/pipeline-templates/.github/workflows/promotion-pr.yml@main
    secrets: inherit
```

Run it from the consuming repository's pipeline on pushes to `dev`, typically after the checks
pass. The job is idempotent:

- if `dev` has no commits missing from `main`, it does nothing;
- if a promotion PR is already open, it does nothing. The PR's head is the `dev` branch itself, so
  new pushes update the open PR automatically.

## Interface

| Input | Default | Purpose |
| --- | --- | --- |
| `runs-on` | `ubuntu-latest` | Selects the runner or runner label. |
| `source-branch` | `dev` | Branch whose commits are promoted. |
| `target-branch` | `main` | Branch receiving the PR. |

The job reuses the Renovate GitHub App, so it needs the same `RENOVATE_APP_ID` and
`RENOVATE_APP_PRIVATE_KEY` repository secrets described in [Renovate](renovate.md). The app's
existing contents and pull-request permissions are sufficient.

Using the app instead of `GITHUB_TOKEN` has two effects:

- the PR starts the consuming repository's normal CI workflows;
- the PR author is the app, so a maintainer can approve it under branch protection that requires a
  review.

## Merge method

Merge promotion PRs with a **merge commit**. Squash or rebase merges rewrite the promoted commits,
so `dev` stays ahead of `main` forever and the next run reopens a PR containing already-shipped
changes.
