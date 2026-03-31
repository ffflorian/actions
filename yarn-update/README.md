# yarn Update Action

Checks whether a newer stable yarn version is available and creates a pull request when an update is found.

## What It Does

- Checks out the repository.
- Installs Node.js.
- Compares current yarn version with the latest stable version.
- Creates an update PR using `peter-evans/create-pull-request` when yarn changes.

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
