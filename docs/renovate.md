# Renovate Runner Template

Run Renovate on the RandyMCNetwork self-hosted runners with this reusable job:
`.github/workflows/renovate.yml`. The consuming repository owns the schedule; the shared workflow
owns Renovate's runtime configuration and execution.

## Layout

- `.github/renovate/config.js` contains the shared Renovate policy and per-caller overrides.
- Each project keeps a small scheduled workflow and may pass package names to disable locally.
- The approved Paper API target is set once in `.github/renovate/config.js`.

## Caller workflow

The project owns the trigger. The reusable job runs on any available runner carrying the
`self-hosted` label; add a dedicated label such as `renovate` if the runner pool should be isolated.
Store `RENOVATE_APP_ID` and `RENOVATE_APP_PRIVATE_KEY` as repository secrets of each repository
using Renovate. On GitHub Free, organization secrets are not available to private repositories;
move them to organization secrets once the plan allows it. Optional `REPOSILITE_USER` and
`REPOSILITE_TOKEN` secrets give Renovate read access to `repo.milu.me` for internal Maven packages.

```yaml
name: Renovate

on:
  schedule:
    - cron: '23 2 * * *'
      timezone: Europe/Berlin
  workflow_dispatch:

permissions:
  contents: read

jobs:
  renovate:
    uses: RandyMCNetwork/pipeline-templates/.github/workflows/renovate.yml@main
    with:
      disabled-packages: |
        com.example:dependency-that-breaks-this-project
    secrets: inherit
```

The schedule uses `Europe/Berlin`, including daylight-saving changes. Projects can choose different
minutes to spread the queue across the three runners.

The GitHub App installation must have access to each consuming repository. Renovate needs
repository permissions for checks and commit statuses (read/write), contents (read/write), issues
(read/write), pull requests (read/write), workflows (read/write), administration (read), and
Dependabot alerts (read). It also needs organization Members read access. Metadata read is granted
by GitHub automatically.

## Reusable job interface

`workflow_call` inputs:

| Input | Default | Purpose |
| --- | --- | --- |
| `runs-on` | `self-hosted` | Selects the runner or runner label. |
| `disabled-packages` | empty | Newline-separated Renovate package names to disable for this caller only. |
| `timeout-minutes` | `45` | Maximum duration for one run. |

The job checks out the calling repository and the template repository, creates a short-lived
GitHub App installation token scoped to the calling repository, then invokes
`renovatebot/github-action` with the shared runtime config.

Use a GitHub App token rather than `GITHUB_TOKEN` so PRs created by Renovate can start the
consuming repository's normal CI workflows.

## Project-specific exclusions

The workflow passes `disabled-packages` to the runtime config as an environment variable. The
config parses one package name or pattern per line and appends a final package rule:

```js
const disabledPackages = (process.env.RENOVATE_DISABLED_PACKAGES ?? '')
  .split(/\r?\n/)
  .map((name) => name.trim())
  .filter(Boolean);

module.exports = {
  onboarding: false,
  requireConfig: 'optional',
  extends: ['config:recommended'],
  packageRules: disabledPackages.length
    ? [{
        matchPackageNames: disabledPackages,
        enabled: false,
      }]
    : [],
};
```

For Maven and Gradle packages, pass the `groupId:artifactId` coordinate, for example
`io.papermc.paper:paper-api`. Renovate also supports patterns in `matchPackageNames` if a project
needs to exclude a family of related packages.

## Shared preset policy

The shared runtime config currently:

- uses `config:recommended` and explicitly enables the Dependency Dashboard issue;
- targets only `dev`; repositories without a `dev` branch fall back to their default branch
  (`$default`). The workflow checks for `dev` and passes the result as `RENOVATE_TARGET_BRANCH`;
- never suggests Maven `-SNAPSHOT` versions; dependencies currently on a snapshot move to the
  next stable release instead;
- waits seven days after a release before suggesting dependency updates, with no wait for Maven
  packages in the `de.randymc` and `xyz.daarkii` groups;
- labels Renovate PRs and dashboard issues `dependencies`;
- automerges `patch`, `minor`, `major`, `pin`, and `digest` updates after required checks pass;
- constrains `io.papermc.paper:paper-api` to the central value in `config.js`, leaving
  automerge enabled so a centrally approved bump rolls out after each project's checks pass;
- constrains all `eu.cloudnetservice.cloudnet` packages to the central `cloudNetVersion`
  (currently `4.0.0-RC16`) in the same way;
- keeps `com.velocitypowered:velocity-api` on the central `velocityApiMajor` (currently `4`), so
  minor and patch updates still roll out but a new major needs a change in `config.js`;
- groups `xyz.daarkii` libraries and `de.randymc` packages into one PR each, so related internal
  artifacts move together;
- keeps `typescript` below 7 because typescript-eslint does not support it yet;
- raises Renovate's hourly PR limit to 10 so one nightly run can open all pending updates;
- disables dependencies requested through the caller's `disabled-packages` input.

The central Paper API target is currently `26.2.build.129-stable`, matching Randy-Lib's shared
version catalog. To update Paper later, change the `paperApiVersion` constant in `config.js`; the
next scheduled Renovate runs will create PRs against the selected version.

## Operational notes

- The template requires Docker on the self-hosted runner because `renovatebot/github-action`
  starts Renovate's container.
- Set required status checks in each repository's branch protection. Platform automerge must not
  be allowed to merge before the project's CI completes.
- A reusable workflow cannot own the caller's `schedule`; the consuming repository must contain
  the small trigger workflow shown above.
- This design removes per-project `renovate.json` files. Projects customize exclusions through the
  reusable-workflow input instead.
- `dependencyDashboard: true` creates Renovate's generated Dashboard issue; it does not use a
  repository's `.github/ISSUE_TEMPLATE` files. Pull-request creation is enabled by default, and the
  GitHub App has the write permissions needed to create both issues and PRs.
- Only enable this self-hosted job for repositories trusted to run on the shared runner. Renovate
  may execute repository build tools while refreshing artifacts.
