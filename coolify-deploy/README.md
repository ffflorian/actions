# Coolify Deploy Action

Triggers one or more Coolify deployments and can optionally wait until they finish.

## What It Does

- Calls the Coolify deploy API for the provided resource UUIDs.
- Supports forcing a rebuild without cache.
- Optionally polls Coolify until all triggered deployments finish.
- Fails when the deploy request fails, a deployment fails, or the wait timeout is reached.

## Inputs

| Name | Required | Default | Description |
| --- | --- | --- | --- |
| `token` | Yes | - | Coolify API token. |
| `domain` | No | `app.coolify.io` | Coolify domain without protocol. |
| `uuid` | Yes | - | Coolify resource UUIDs to deploy. Comma-separated values are supported. |
| `force` | No | `false` | Force a rebuild without cache. |
| `waitForDeploy` | No | `false` | Wait for the triggered deployments to complete. |
| `timeout` | No | `300` | Timeout in seconds when waiting for deployments. |
| `interval` | No | `10` | Polling interval in seconds when waiting for deployments. |

## Usage

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: ffflorian/actions/coolify-deploy@v1
        with:
          token: ${{ secrets.COOLIFY_TOKEN }}
          domain: coolify.example.com
          uuid: 123e4567-e89b-12d3-a456-426614174000
          force: true
          waitForDeploy: true
```
