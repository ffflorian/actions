# Force Release Action

Forces a release by updating semantic-release release rules and pushing a release commit.

## What It Does

- Checks out the repository.
- Configures the git author and committer.
- Reads the repository root `.releaserc.json` or the `release` entry in the root `package.json`.
- Replaces `releaseRules` with the following configuration so `feat` triggers a minor release and `fix`, `perf`, `revert`, `docs`, `style`, `refactor`, `ci`, and `chore` trigger patch releases.
- Commits the updated configuration, or creates an empty release commit if the rules are already in place.
- Pushes the release commit to the current branch, triggering the release pipeline.

## Inputs

| Name | Required | Default | Description |
| --- | --- | --- | --- |
| `GITHUB_TOKEN` | Yes | - | GitHub token used to check out the repository and push the release commit. |
| `commit_message` | No | `chore: Force release` | The commit message for the release commit. |
| `git_authorship` | Yes | - | Commit author/committer in format `Name <email>`. |

## Outputs

None

## Recommended Permissions

```yaml
permissions:
  contents: write
```

## Release Rules Applied

```json
{
  "releaseRules": [
    {"type": "feat", "release": "minor"},
    {"type": "fix", "release": "patch"},
    {"type": "perf", "release": "patch"},
    {"type": "revert", "release": "patch"},
    {"type": "docs", "release": "patch"},
    {"type": "style", "release": "patch"},
    {"type": "refactor", "release": "patch"},
    {"type": "ci", "release": "patch"},
    {"type": "chore", "release": "patch"}
  ]
}
```

The action prefers `.releaserc.json` when both files exist. If that file is missing, it updates `package.json#release`. If neither release configuration exists, the action creates a new `.releaserc.json`.

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
