# Force Release Action

Forces a release by updating semantic-release release rules and running semantic-release.

## What It Does

- Checks out the repository.
- Configures the git author and committer.
- Installs `semantic-release` and `@semantic-release/changelog` as exact dev dependencies using yarn.
- Reads the repository root `.releaserc.json` or the `release` entry in the root `package.json`.
- Replaces `releaseRules` with the following configuration so `feat` triggers a minor release and `fix`, `perf`, `revert`, `docs`, `style`, `refactor`, `ci`, and `chore` trigger patch releases.
- Runs semantic-release using the configured command.
- Restores the original release config file after semantic-release completes.

## Inputs

| Name | Required | Default | Description |
| --- | --- | --- | --- |
| `GITHUB_TOKEN` | Yes | - | GitHub token used to check out the repository and run semantic-release. |
| `run_command` | No | `npx --no semantic-release` | Command used to run semantic-release. |
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
    {"type": "chore", "release": "patch"},
    {"type": "ci", "release": "patch"},
    {"type": "docs", "release": "patch"},
    {"type": "feat", "release": "minor"},
    {"type": "fix", "release": "patch"},
    {"type": "perf", "release": "patch"},
    {"type": "refactor", "release": "patch"},
    {"type": "revert", "release": "patch"},
    {"type": "style", "release": "patch"}
  ]
}
```

The action prefers `.releaserc.json` when both files exist. If that file is missing, it updates `package.json#release`. If neither release configuration exists, the action creates a new temporary `.releaserc.json` for the semantic-release run.

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
