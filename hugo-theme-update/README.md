# Hugo Theme Update Action

Runs `hugo mod get -u ./...` and `hugo mod tidy` on a configurable schedule, and creates a pull request when module updates are found.

## What It Does

- Checks out the repository.
- Installs Hugo.
- Optionally skips the run when a previous update PR was created within `cooldown_days`.
- Runs `hugo mod get -u ./...` to upgrade all Hugo module dependencies.
- Runs `hugo mod tidy` to clean up `go.sum` and `go.mod`.
- Creates one update PR when any module files have changed.

## Inputs

| Name | Required | Default | Description |
| --- | --- | --- | --- |
| `git_authorship` | Yes | - | Commit author/committer in format `Name <email>`. |
| `github_token` | Yes | - | GitHub token with `contents: write` and `pull-requests: write` permissions. |
| `cooldown_days` | No | `0` | Minimum days between update PRs. When set, the action checks the last PR it created and skips if it is younger than this many days. Set to `0` or leave unset to always run. |
| `hugo_version` | No | `latest` | Hugo version to install. |

## Outputs

| Name        | Description                                                            |
| ----------- | ---------------------------------------------------------------------- |
| `pr_number` | The number of the created pull request, or empty if no PR was created. |
| `pr_url`    | The URL of the created pull request, or empty if no PR was created.    |

## Recommended Permissions

```yaml
permissions:
  contents: write
  pull-requests: write
```

## Usage

```yaml
name: Update Hugo modules

on:
  schedule:
    - cron: '0 6 * * 1'

jobs:
  hugo-theme-update:
    runs-on: ubuntu-latest
    steps:
      - uses: ffflorian/actions/hugo-theme-update@v1
        with:
          git_authorship: Florian Imdahl <git@ffflorian.de>
          github_token: ${{ secrets.GITHUB_TOKEN }}
          cooldown_days: 7
```
