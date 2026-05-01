# yarn Update Action

Checks all yarn installations in the repository and creates a pull request when updates are found.

## What It Does

- Checks out the repository.
- Installs Node.js.
- Finds all `.yarn` directories in the repository.
- Compares each yarn installation with the latest stable version.
- Runs `yarn install --mode=update-lockfile` for each updated installation.
- Ensures all updated installations resolve to the same stable yarn version.
- Creates one update PR when any yarn installation changes.

## Inputs

| Name                   | Required | Default | Description                                                                             |
| ---------------------- | -------- | ------- | --------------------------------------------------------------------------------------- |
| `git_authorship`       | Yes      | -       | Commit author/committer in format `Name <email>`.                                       |
| `release_cooldown_days`| No       | `0`     | How many days a yarn release must be old before it is eligible for an update. Set to `0` to disable. |

## Outputs

None

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
    steps:
      - uses: ffflorian/actions/yarn-update@v1
        with:
          git_authorship: Florian Imdahl <git@ffflorian.de>
          release_cooldown_days: 7
```
