# Force Release Action

Forces a release by creating an empty commit and pushing it to the repository.

## What It Does

- Checks out the repository.
- Configures the git author and committer.
- Creates an empty commit with a configurable message (default: `fix: Force release`).
- Pushes the commit to the current branch, triggering a release pipeline.

## Inputs

| Name               | Required | Default                             | Description                                       |
| ------------------ | -------- | ----------------------------------- | ------------------------------------------------- |
| `GITHUB_TOKEN`     | Yes      | -                                   | GitHub token used to push the release commit.     |
| `commit_message`   | No       | `fix: Force release`                | The commit message for the empty release commit.  |
| `git_authorship`   | No       | `Florian Imdahl <git@ffflorian.de>` | Commit author/committer in format `Name <email>`. |

## Outputs

None

## Recommended Permissions

```yaml
permissions:
  contents: write
```

## Usage

```yaml
name: Force Release

on:
  workflow_dispatch:

jobs:
  force-release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: ffflorian/actions/force-release@v1
        with:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```
