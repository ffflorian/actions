# Force Release Action

Forces a release by creating a commit and pushing it to the repository.

## What It Does

- Checks out the repository.
- Configures the git author and committer.
- If `packages` is set: writes a `.force-release` timestamp file into each specified package directory, stages those files, and commits them. This ensures `multi-semantic-release` detects per-package changes and releases every listed package.
- If `packages` is not set: creates an empty commit (suitable for single-package repos using standard `semantic-release`).
- Pushes the commit to the current branch, triggering a release pipeline.

## Inputs

| Name             | Required | Default              | Description                                                                                       |
| ---------------- | -------- | -------------------- | ------------------------------------------------------------------------------------------------- |
| `GITHUB_TOKEN`   | Yes      | -                    | GitHub token used to push the release commit.                                                     |
| `commit_message` | No       | `fix: Force release` | The commit message for the release commit.                                                        |
| `git_authorship` | Yes      | -                    | Commit author/committer in format `Name <email>`.                                                 |
| `packages`       | No       | -                    | Space-separated list of package directories (e.g. `packages/foo packages/bar`). See note below.  |

> **`packages` note:** When set, a `.force-release` timestamp file is written into each listed directory and included in the commit. This gives `multi-semantic-release` the per-package file change it needs to trigger a release for every package.

## Outputs

None

## Recommended Permissions

```yaml
permissions:
  contents: write
```

## Usage

### Single-package repo (standard `semantic-release`)

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

### Monorepo with `multi-semantic-release`

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
          packages: 'packages/foo packages/bar'
```
