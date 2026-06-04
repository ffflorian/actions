# Hugo Theme Update Action

Runs `hugo mod get -u ./...` and `hugo mod tidy` on a configurable schedule, and creates a pull request when module updates are found.

## What It Does

- Checks out the repository.
- Installs Hugo.
- Optionally skips the run when a previous update PR was created within `cooldown_days`.
- Runs `hugo mod get -u ./...` to upgrade all Hugo module dependencies.
- Runs `hugo mod tidy` to clean up `go.sum` and `go.mod`.
- Creates one update PR against the repository default branch when any module files have changed, or updates an existing open PR for the same branch if one already exists.

## Inputs

| Name | Required | Default | Description |
| --- | --- | --- | --- |
| `git_authorship` | Yes | - | Commit author/committer in format `Name <email>`. |
| `GITHUB_TOKEN` | Yes | - | GitHub token with `contents: write` and `pull-requests: write` permissions. Also needs `issues: write` when `assignees` is set. |
| `cooldown_days` | No | `0` | Minimum days between update PRs. When set, the action checks the last PR it created and skips if it is younger than this many days. Set to `0` or leave unset to always run. |
| `hugo_version` | No | `latest` | Hugo version to install. |
| `assignees` | No | - | Newline- or comma-separated GitHub usernames to assign to the created or updated pull request. |
| `reviewers` | No | - | Newline- or comma-separated GitHub usernames to request as reviewers on the created or updated pull request. |

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
  issues: write # only needed when using "assignees"
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
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          git_authorship: Florian Imdahl <git@ffflorian.de>
          cooldown_days: 7
          assignees: |
            ffflorian
          reviewers: |
            ffflorian
```
