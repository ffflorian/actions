# yarn Update Action

Checks all yarn installations in the repository and creates a pull request when updates are found.

## What It Does

- Finds all `.yarn` directories in the workspace (up to 5 levels deep).
- Compares each yarn installation with the latest stable version.
- Runs `yarn install --mode=update-lockfile` for each updated installation.
- Ensures all updated installations resolve to the same stable yarn version.
- Creates one update PR when any yarn installation changes.

## Inputs

| Name | Required | Default | Description |
| --- | --- | --- | --- |
| `git_authorship` | Yes | - | Commit author/committer in format `Name <email>`. |
| `release_cooldown_days` | No | `0` | Minimum age in days a yarn release must have before being considered for an update. When set, the action installs the newest release that is at least this many days old rather than the absolute latest. Set to `0` or leave unset to always use the latest stable release. |

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
        with:
          git_authorship: Florian Imdahl <git@ffflorian.de>
          release_cooldown_days: 7
```
