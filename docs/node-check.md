# Node Check Job

Reusable Node.js quality job. It installs dependencies and can independently run lint, test,
build, and an optional Docker image check on the same runner.

```yaml
jobs:
  checks:
    uses: RandyMCNetwork/pipeline-templates/.github/workflows/node-check.yml@main
    with:
      node-version: '22'
      lint-command: npm run lint
      test-command: npm test
      build-command: npm run build
      build-environment: |
        DB_HOST=127.0.0.1
        DB_PORT=59999
      docker-build: true
      docker-tags: example:ci
```

Set `lint-command`, `test-command`, or `build-command` to an empty string to omit that part.
Set `docker-build: true` to validate a container image after the Node lifecycle without starting a
second runner VM. `docker-context`, `dockerfile`, `docker-tags`, and `docker-build-args` match
the corresponding Docker action inputs. Triggers and job dependencies remain in the caller.
