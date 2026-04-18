# yarn Update Action

Checks all Yarn installations in the repository and creates a pull request when updates are found.

## What It Does

- Checks out the repository.
- Installs Node.js.
- Finds all `.yarn` directories in the repository.
- Compares each Yarn installation with the latest stable version.
- Runs `yarn install --mode=update-lockfile` for each updated installation.
- Ensures all updated installations resolve to the same stable Yarn version.
- Creates one update PR when any Yarn installation changes.

## Inputs

| Name             | Required | Default | Description                                       |
| ---------------- | -------- | ------- | ------------------------------------------------- |
| `git_authorship` | Yes      | -       | Commit author/committer in format `Name <email>`. |

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
```
