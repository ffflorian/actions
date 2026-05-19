# GitHub-style Webhook Action

Sends a GitHub-style webhook request to any HTTP endpoint.

## What It Does

- Uses the current GitHub event payload by default.
- Sends GitHub-style headers (`X-GitHub-Event`, `X-GitHub-Delivery`, `User-Agent`).
- Fails the workflow when the webhook endpoint does not return a success status.

## Inputs

| Name          | Required | Default             | Description                          |
| ------------- | -------- | ------------------- | ------------------------------------ |
| `webhook_url` | Yes      | -                   | Destination webhook URL.             |
| `event_type`  | No       | `workflow_dispatch` | Event name sent as `X-GitHub-Event`. |
| `timeout_ms`  | No       | `10000`             | Request timeout in milliseconds.     |

## Outputs

| Name          | Description                                 |
| ------------- | ------------------------------------------- |
| `delivery_id` | UUID sent as `X-GitHub-Delivery`.           |
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
```
