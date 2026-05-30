# yarn Update Action

Checks all yarn installations in the repository and creates a pull request when updates are found.

## What It Does

- Finds all `.yarn` directories in the workspace (up to 5 levels deep).
- Fails with a clear error if no repository checkout is detected in the workspace.
- Compares each yarn installation with the latest stable version.
- Runs `yarn install --mode=update-lockfile` for each updated installation.
- Ensures all updated installations resolve to the same stable yarn version.
- Creates one update PR when any yarn installation changes, or updates an existing open PR for the same branch if one already exists.

## Inputs

| Name | Required | Default | Description |
| --- | --- | --- | --- |
| `assignee` | No | - | GitHub username to assign to the pull request. |
| `git_authorship` | Yes | - | Commit author/committer in format `Name <email>`. |
| `release_cooldown_days` | No | `0` | Minimum age in days a yarn release must have before being considered for an update. When set, the action installs the newest release that is at least this many days old rather than the absolute latest. Set to `0` or leave unset to always use the latest stable release. |
| `reviewer` | No | - | GitHub username to request a review from on the pull request. |

## Outputs

| Name           | Description                                                                      |
| -------------- | -------------------------------------------------------------------------------- |
| `YARN_VERSION` | The yarn version that all installations were updated to, if any update occurred. |

## Recommended Permissions

```yaml
permissions:
  contents: write
  pull-requests: write
```

## Required Environment Variables

| Name | Required | Description |
| --- | --- | --- |
| `GITHUB_TOKEN` | Yes | Token used to authenticate GitHub API requests and to push the update branch/create the pull request. Usually `${{ secrets.GITHUB_TOKEN }}`. |

## Usage

```yaml
name: Update yarn

on:
  schedule:
    - cron: '0 6 * * 1'

jobs:
  update-yarn:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
      - uses: ffflorian/actions/yarn-update@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          assignee: ffflorian
          git_authorship: Florian Imdahl <git@ffflorian.de>
          release_cooldown_days: 7
          reviewer: ffflorian
```
