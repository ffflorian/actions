# Force Release Action

Forces a release by updating semantic-release release rules and running semantic-release.

## What It Does

- Checks out the repository.
- Configures the git author and committer.
- Installs `semantic-release`, `@semantic-release/changelog`, and `@semantic-release/git` as exact dev dependencies using yarn.
- Reads the repository root `.releaserc.json` or the `release` entry in the root `package.json`.
- If `.releaserc.json` is missing but `package.json#release` exists, creates a minimal temporary `.releaserc.json` with the release rules below injected into `@semantic-release/commit-analyzer`.
- If neither release config exists, creates a full temporary `.releaserc.json` with angular presets, the release rules below, changelog/github/git plugins, and configurable git assets.
- Replaces `releaseRules` with the following configuration so `feat` triggers a minor release and `fix`, `perf`, `revert`, `docs`, `style`, `refactor`, `ci`, and `chore` trigger patch releases.
- Runs semantic-release using the configured command.
- Restores the original release config file after semantic-release completes.

## Inputs

| Name | Required | Default | Description |
| --- | --- | --- | --- |
| `GITHUB_TOKEN` | Yes | - | GitHub token used to check out the repository and run semantic-release. |
| `run_command` | No | `npx --no semantic-release` | Command used to run semantic-release. |
| `git_authorship` | Yes | - | Commit author/committer in format `Name <email>`. |
| `assets` | No | `CHANGELOG.md` | Newline-separated asset paths used for `@semantic-release/git`. |

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

The action prefers `.releaserc.json` over `package.json#release` when both release configs exist. If `.releaserc.json` is missing and `package.json#release` exists, the action writes a temporary `.releaserc.json` containing only the `@semantic-release/commit-analyzer` plugin with the configured `releaseRules`. If neither release configuration exists, the action writes a full temporary `.releaserc.json` with the default semantic-release plugin stack, including angular presets, changelog/github/git plugins, and configurable git assets.

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
          assets: |
            CHANGELOG.md
            docs/RELEASE.md
```
