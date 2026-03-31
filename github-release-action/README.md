# GitHub Action Release

Creates a GitHub Actions release using semantic-release, updates `CHANGELOG.md`, and maintains major/latest tags.

## What It Does

- Checks out the repository.
- Creates a `.releaserc.json` for semantic-release.
- Runs [semantic-release](https://github.com/semantic-release/semantic-release)
- Updates and pushes major (`vX`) and `latest` tags when a new release is published.

## Inputs

| Name           | Required | Default | Description                                              |
| -------------- | -------- | ------- | -------------------------------------------------------- |
| `dry_run`      | No       | `false` | If `true`, simulates release steps without pushing tags. |
| `GITHUB_TOKEN` | Yes      | -       | Token used by semantic-release and git push operations.  |
| `git_author`   | Yes      | -       | Git author/committer name used for release commits.      |
| `git_email`    | Yes      | -       | Git author/committer email used for release commits.     |

## Outputs

None

## Recommended Permissions

```yaml
permissions:
  contents: write
```

## Usage

```yaml
name: Release

on:
  push:
    branches: [main]

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: ffflorian/actions/github-release-action@v1
        with:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          git_author: Florian Imdahl
          git_email: git@ffflorian.de
          dry_run: 'false'
```
