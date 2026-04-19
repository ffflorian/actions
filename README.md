# actions

A collection of GitHub Actions for use in my projects.

## Available actions

| Action | Purpose | Documentation |
| --- | --- | --- |
| `force-release` | Force a release by pushing an empty commit with the message `fix: Force release`. | [force-release/README.md](force-release/README.md) |
| `git-mirror` | Mirror a repository to GitLab and/or Codeberg over SSH. | [git-mirror/README.md](git-mirror/README.md) |
| `github-action-release` | Create semantic releases and maintain major/latest tags. | [github-action-release/README.md](github-action-release/README.md) |
| `yarn-update` | Check for yarn updates and open a pull request when needed. | [yarn-update/README.md](yarn-update/README.md) |

## Usage

Use any action from this repository in your workflow jobs:

```yaml
jobs:
  example:
    runs-on: ubuntu-latest
    steps:
      - uses: ffflorian/actions/<action-name>@v1
```

Replace `<action-name>` with one of:

- `force-release`
- `git-mirror`
- `github-action-release`
- `yarn-update`

See each action README for required inputs, permissions, and complete examples.
