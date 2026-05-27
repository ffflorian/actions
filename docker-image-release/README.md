# Docker Image Release

Creates a GitHub release using semantic-release and publishes a Docker image to GHCR.

## What It Does

- Checks out the repository.
- Logs in to GitHub Container Registry.
- Extracts Docker metadata (`latest` on `main`, plus `sha` tag).
- Creates a `.releaserc.json` for semantic-release.
- Runs [semantic-release](https://github.com/semantic-release/semantic-release).
- Publishes a Docker image with metadata tags and the new release version tag.

## Inputs

| Name | Required | Default | Description |
| --- | --- | --- | --- |
| `dry_run` | No | `false` | If `true`, simulates release and docker publish steps. |
| `GITHUB_TOKEN` | Yes | - | Token used by semantic-release and GHCR publish. |
| `git_author` | Yes | - | Git author/committer name used for release commits. |
| `git_email` | Yes | - | Git author/committer email used for release commits. |
| `publish_files` | No | `CHANGELOG.md` | Newline-separated list of files to include in the release commit. |

## Outputs

None

## Recommended Permissions

```yaml
permissions:
  contents: write
  packages: write
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
    permissions:
      contents: write
      packages: write
    steps:
      - uses: ffflorian/actions/docker-image-release@v1
        with:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          git_author: Florian Imdahl
          git_email: git@ffflorian.de
          publish_files: |
            CHANGELOG.md
          dry_run: 'false'
```
