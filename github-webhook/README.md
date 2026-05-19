# GitHub-style Webhook Action

Sends a GitHub-style webhook request to any HTTP endpoint.

## What It Does

- Uses the current GitHub event payload by default.
- Optionally accepts a custom JSON payload.
- Sends GitHub-style headers (`X-GitHub-Event`, `X-GitHub-Delivery`, `User-Agent`).
- Optionally signs payloads with `X-Hub-Signature-256`.
- Fails the workflow when the webhook endpoint does not return a success status.

## Inputs

| Name | Required | Default | Description |
| --- | --- | --- | --- |
| `webhook_url` | Yes | - | Destination webhook URL. |
| `event_type` | No | `workflow_dispatch` | Event name sent as `X-GitHub-Event`. |
| `payload` | No | current event payload | Optional JSON payload override. |
| `webhook_secret` | No | - | Optional secret for `X-Hub-Signature-256` signing. |
| `timeout_ms` | No | `10000` | Request timeout in milliseconds. |

## Outputs

| Name | Description |
| --- | --- |
| `delivery_id` | UUID sent as `X-GitHub-Delivery`. |
| `status_code` | HTTP status code from the webhook response. |

## Recommended Permissions

```yaml
permissions:
  contents: read
```

## Usage

```yaml
name: Send webhook

on:
  workflow_dispatch:

jobs:
  notify:
    runs-on: ubuntu-latest
    steps:
      - uses: ffflorian/actions/github-webhook@v1
        with:
          webhook_url: ${{ secrets.EXTERNAL_WEBHOOK_URL }}
          event_type: workflow_dispatch
          webhook_secret: ${{ secrets.EXTERNAL_WEBHOOK_SECRET }}
```
