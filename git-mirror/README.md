# Git Mirror Action

Mirrors the current repository to GitLab and/or Codeberg via SSH.

## What It Does

- Checks out the full git history.
- Pushes to [GitLab](https://gitlab.com) when `GITLAB_SECRET` is provided.
- Pushes to [Codeberg](https://codeberg.org) when `CODEBERG_SECRET` is provided.
- Can optionally push all refs (`--mirror` style behavior in the mirror action).

## Inputs

| Name                     | Required | Default | Description                                  |
| ------------------------ | -------- | ------- | -------------------------------------------- |
| `GITLAB_REMOTE`          | No       | -       | GitLab remote URL to mirror to.              |
| `GITLAB_SECRET`          | No       | -       | SSH private key for GitLab authentication.   |
| `GITLAB_PUSH_ALL_REFS`   | No       | `false` | Whether to push all refs to GitLab.          |
| `CODEBERG_REMOTE`        | No       | -       | Codeberg remote URL to mirror to.            |
| `CODEBERG_SECRET`        | No       | -       | SSH private key for Codeberg authentication. |
| `CODEBERG_PUSH_ALL_REFS` | No       | `false` | Whether to push all refs to Codeberg.        |

## Outputs

None

## Recommended permissions

```yaml
permissions:
  contents: read
```

## Usage

```yaml
name: Mirror Repository

on:
  push:
    branches: [main]

jobs:
  mirror:
    runs-on: ubuntu-latest
    steps:
      - uses: ffflorian/actions/git-mirror@v1
        with:
          GITLAB_REMOTE: git@gitlab.com:your-group/your-repo.git
          GITLAB_SECRET: ${{ secrets.GITLAB_SSH_KEY }}
          GITLAB_PUSH_ALL_REFS: 'true'
          CODEBERG_REMOTE: git@codeberg.org:your-org/your-repo.git
          CODEBERG_SECRET: ${{ secrets.CODEBERG_SSH_KEY }}
```
