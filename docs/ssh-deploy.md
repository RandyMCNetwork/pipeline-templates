# SSH deployment

`ssh-deploy.yml` checks out the calling repository and executes its deployment script on the
VPS through the pinned SSH action. It runs on `light`, with a 15-minute job timeout and the
SSH action's 10-minute command timeout. The remote host receives `DEPLOY_PATH` and `IMAGE_REF`.

Keep Compose services, health checks, rollback behavior, and server checkout handling in the
calling repository's `.github/scripts/deploy.sh`. The script is read from the workflow's commit;
it runs on the remote host, not on the runner. Moving an inline script into this file does not
change its commands. Include this path in CD runtime filters so changes to deployment behavior
can be deployed.

```yaml
  deploy:
    if: needs.version.outputs.release == 'true'
    needs: [version, build-and-push]
    uses: RandyMCNetwork/pipeline-templates/.github/workflows/ssh-deploy.yml@main
    with:
      image-ref: ${{ needs.build-and-push.outputs.image-ref }}
    secrets: inherit
    permissions:
      contents: read
```

| Input | Default | Purpose |
| --- | --- | --- |
| `image-ref` | required | Immutable GHCR reference produced by `ghcr-build.yml` |
| `script-path` | `.github/scripts/deploy.sh` | Remote commands stored in the calling repository |
| `environment` | `production` | Environment of the calling repository, including approval rules |

Set `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, and `VPS_DEPLOY_PATH` as secrets in the selected
environment, or pass repository/organization secrets through `secrets: inherit`. `VPS_PORT`
is optional and defaults to 22. Environment secrets take precedence inside the deployment job;
they do not need to be read by the calling job. The deployment script should start with
`set -eu` and check that `DEPLOY_PATH` and `IMAGE_REF` are non-empty.

The caller retains triggers, branch conditions, concurrency, image build dependencies, and
tagging. Specialized deployments such as a restricted SSH command receiving a source archive
can remain standalone jobs.
