# Force Release Action

Forces a release by committing to the repository.

## What It Does

- Checks out the repository.
- Configures the git author and committer.
- Finds all `package.json` files in the repository (excluding `node_modules`) and writes a `.force-release` timestamp file into each package directory. This ensures `multi-semantic-release` detects per-package changes and triggers a release for every package.
- Pushes the release commit to the current branch, triggering the release pipeline.
- Immediately follows up with a second `chore:` commit that removes all `.force-release` files, so they don't stay in the repository long-term. The `chore:` prefix ensures this cleanup commit does not trigger another release.

## Inputs

| Name             | Required | Default              | Description                                       |
| ---------------- | -------- | -------------------- | ------------------------------------------------- |
| `GITHUB_TOKEN`   | Yes      | -                    | GitHub token used to push the release commit.     |
| `commit_message` | No       | `fix: Force release` | The commit message for the release commit.        |
| `git_authorship` | Yes      | -                    | Commit author/committer in format `Name <email>`. |

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
          git_authorship: 'Florian Imdahl <git@ffflorian.de>'
```
