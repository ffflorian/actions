# Empty Commit Action

Creates an empty commit and pushes it to the repository.

## What It Does

- Checks out the repository.
- Configures the git author and committer.
- Creates an empty commit with the specified message.
- Pushes the commit to the current branch.

## Inputs

| Name             | Required | Default                          | Description                                       |
| ---------------- | -------- | -------------------------------- | ------------------------------------------------- |
| `GITHUB_TOKEN`   | Yes      | -                                | GitHub token used to push the empty commit.       |
| `commit_message` | Yes      | -                                | The message for the empty commit.                 |
| `git_authorship` | No       | `Florian Imdahl <git@ffflorian.de>` | Commit author/committer in format `Name <email>`. |

## Outputs

None

## Recommended Permissions

```yaml
permissions:
  contents: write
```

## Usage

```yaml
name: Empty Commit

on:
  workflow_dispatch:
    inputs:
      commit_message:
        description: 'Commit message'
        required: true

jobs:
  empty-commit:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: ffflorian/actions/empty-commit@v1
        with:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          commit_message: ${{ inputs.commit_message }}
```
