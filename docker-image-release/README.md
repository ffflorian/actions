# Docker Image Release

Creates a GitHub release using semantic-release and publishes a Docker image to GHCR and optionally Docker Hub.

## What It Does

- Checks out the repository.
- Logs in to GitHub Container Registry.
- Logs in to Docker Hub (when `DOCKER_TOKEN` is set).
- Extracts Docker metadata for image labels.
- Creates a `.releaserc.json` for semantic-release.
- Runs [semantic-release](https://github.com/semantic-release/semantic-release).
- Publishes a Docker image (or multiple images for monorepos) with `latest` and the new release version tag to GHCR and, optionally, Docker Hub.
- Passes `VERSION` (release version) and `COMMIT` (release git SHA) as Docker build args.

To bake these into the image as environment variables, add the following to your `Dockerfile`:

```dockerfile
ARG VERSION
ENV VERSION=$VERSION

ARG COMMIT
ENV COMMIT=$COMMIT
```

## Inputs

| Name            | Required | Default                    | Description                                                                                              |
| --------------- | -------- | -------------------------- | -------------------------------------------------------------------------------------------------------- |
| `GITHUB_TOKEN`  | Yes      | -                          | Token used by semantic-release and GHCR publish.                                                         |
| `DOCKER_TOKEN`  | No       | -                          | Docker Hub token. When set, the image is also published to Docker Hub using `github.repository_owner` as the username. |
| `git_author`    | Yes      | -                          | Git author/committer name used for release commits.                                                      |
| `git_email`     | Yes      | -                          | Git author/committer email used for release commits.                                                     |
| `publish_files` | No       | `CHANGELOG.md`             | Newline-separated list of files to include in the release commit.                                        |
| `image_name`    | No       | `${{ github.repository }}` | Base name of the Docker image to publish.                                                                |
| `dockerfiles`   | No       | -                          | Newline-separated list of `suffix:dockerfile` pairs for monorepo multi-image builds. When set, each entry produces a separate image named `<image_name>-<suffix>`. When unset, a single image is built from `Dockerfile`. |

## Outputs

The action forwards the semantic-release result so later steps can consume it.

| Name                        | Description                                  |
| --------------------------- | -------------------------------------------- |
| `new_release_published`     | Whether semantic-release published a release |
| `new_release_version`       | Version of the new release                   |
| `new_release_major_version` | Major version of the new release             |
| `new_release_minor_version` | Minor version of the new release             |
| `new_release_patch_version` | Patch version of the new release             |
| `new_release_channel`       | Distribution channel of the new release      |
| `new_release_notes`         | Release notes for the new release            |
| `new_release_git_head`      | Git SHA of the new release                   |
| `new_release_git_tag`       | Git tag of the new release                   |
| `last_release_version`      | Version of the previous release, if any      |
| `last_release_git_head`     | Git SHA of the previous release, if any      |
| `last_release_git_tag`      | Git tag of the previous release, if any      |

## Recommended Permissions

```yaml
permissions:
  contents: write
  packages: write
  issues: write
```

## Usage

### Single image

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
      - id: release
        uses: ffflorian/actions/docker-image-release@v1
        with:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          git_author: Florian Imdahl
          git_email: git@ffflorian.de
          publish_files: |
            CHANGELOG.md

      - if: steps.release.outputs.new_release_published == 'true'
        run: echo "Published ${{ steps.release.outputs.new_release_git_tag }}"
```

### Monorepo with multiple images

Builds `ghcr.io/<repo>-backend` from `backend.Dockerfile` and `ghcr.io/<repo>-frontend` from `frontend.Dockerfile`, both tagged with the same release version.

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
      - id: release
        uses: ffflorian/actions/docker-image-release@v1
        with:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          git_author: Florian Imdahl
          git_email: git@ffflorian.de
          dockerfiles: |
            backend:backend.Dockerfile
            frontend:frontend.Dockerfile

      - if: steps.release.outputs.new_release_published == 'true'
        run: echo "Published ${{ steps.release.outputs.new_release_git_tag }}"
```
