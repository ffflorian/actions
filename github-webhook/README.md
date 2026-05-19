# GitHub-style Webhook Action

Sends a GitHub-style webhook request to any HTTP endpoint.

## What It Does

- Uses the current GitHub event payload as the JSON request body.
- Sends GitHub-style webhook headers such as `Accept`, `User-Agent`, `X-GitHub-Delivery`, `X-GitHub-Event`, and installation target headers.
- Optionally signs the payload with `X-Hub-Signature` and `X-Hub-Signature-256` when a secret is configured.
- Fails the workflow when the webhook endpoint does not return a success status.

## Inputs

| Name | Required | Default | Description |
| --- | --- | --- | --- |
| `webhook_url` | Yes | - | Destination webhook URL. |
| `secret` | No | - | Shared secret used to HMAC-sign the payload and generate `X-Hub-Signature` and `X-Hub-Signature-256`. |
| `event_type` | No | `workflow_dispatch` | Event name sent as `X-GitHub-Event`. |
| `hook_id` | No | - | Optional webhook ID sent as `X-GitHub-Hook-Id`. |
| `timeout_ms` | No | `10000` | Request timeout in milliseconds. |

## Outputs

| Name          | Description                                 |
| ------------- | ------------------------------------------- |
| `delivery_id` | UUID sent as `X-GitHub-Delivery`.           |
| `status_code` | HTTP status code from the webhook response. |

## GitHub-style request

This action sends the current workflow event payload as JSON and adds GitHub-style webhook headers so receivers can process it like a GitHub webhook delivery. With `secret` configured, the payload is HMAC-signed the same way GitHub signs webhook requests. Prefer validating `X-Hub-Signature-256`; `X-Hub-Signature` is included for GitHub compatibility.

Example header set sent by this action:

```text
Accept: */*
Content-Type: application/json
User-Agent: GitHub-Hookshot/1a57e472
X-GitHub-Delivery: 1a57e472-537d-11f1-8e9b-7bc2ead18eb0
X-GitHub-Event: push
X-GitHub-Hook-Id: 605961050
X-GitHub-Hook-Installation-Target-Id: 207300990
X-GitHub-Hook-Installation-Target-Type: repository
X-Hub-Signature: sha1=...
X-Hub-Signature-256: sha256=...
```

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
          secret: ${{ secrets.EXTERNAL_WEBHOOK_SECRET }}
          event_type: workflow_dispatch
          hook_id: '605961050'
```
