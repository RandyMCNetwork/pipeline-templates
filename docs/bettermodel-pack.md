# BetterModel Pack Job

Reusable job that turns Blockbench models (`.bbmodel`) into resource pack assets with the
[BetterModel](https://github.com/toxicity188/BetterModel) Paper plugin. It starts a throwaway
Paper server with BetterModel, the given config and models, waits until BetterModel has written its
pack, stops the server and uploads the generated `assets/` directory as an artifact.

```yaml
jobs:
  models:
    uses: RandyMCNetwork/pipeline-templates/.github/workflows/bettermodel-pack.yml@main
    with:
      config-path: bettermodel/config.yml
      bettermodel-version: 3.5.0
      bettermodel-sha256: 0f983569b45e82f657fd6267f68115cc679fa066f0e8eec2ce328596dcb57ed6
      runs-on: ubuntu-latest

  pack:
    needs: models
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v7
        with:
          name: bettermodel-pack
          path: build/bettermodel/assets
```

- `config-path` is required. The file needs `pack-type: folder` and must not set
  `build-folder-location`. Servers must use the same config and BetterModel version, or the item
  model ids in the pack do not match what the servers send.
- `bettermodel-version` and `bettermodel-sha256` are required. The jar comes from Hangar; the job
  fails if its SHA-256 differs.
- `models-path` defaults to `models`. Only `*.bbmodel` files directly in that directory are used.
- `paper-version` defaults to `26.2` and uses that version's latest build from the Paper Fill API,
  checked against its published SHA-256. `java-version` defaults to `25`.
- `artifact-name` defaults to `bettermodel-pack`. The artifact contains the namespaces below
  `assets/`; BetterModel's own `pack.mcmeta` and `pack.png` are not included.
- `runs-on` defaults to `self-hosted`. The runner needs `bash`, `curl`, `jq`, `python3` and about
  2 GB of free memory for Paper.

The job accepts the Minecraft EULA for the throwaway server (`eula=true`).
