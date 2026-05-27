# actions

A collection of GitHub Actions for use in my projects.

## Available actions

| Action | Purpose | Documentation |
| --- | --- | --- |
| `coolify-deploy` | Trigger a Coolify deployment and optionally wait for completion. | [coolify-deploy/README.md](coolify-deploy/README.md) |
| `docker-image-release` | Create semantic releases and publish Docker images to GHCR. | [docker-image-release/README.md](docker-image-release/README.md) |
| `force-release` | Force a release by updating semantic-release release rules and running semantic-release. | [force-release/README.md](force-release/README.md) |
| `git-mirror` | Mirror a repository to GitLab and/or Codeberg over SSH. | [git-mirror/README.md](git-mirror/README.md) |
| `github-action-release` | Create semantic releases and maintain major/latest tags. | [github-action-release/README.md](github-action-release/README.md) |
| `hugo-theme-update` | Update Hugo module dependencies and open a pull request when updates are found. | [hugo-theme-update/README.md](hugo-theme-update/README.md) |
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

- `coolify-deploy`
- `docker-image-release`
- `force-release`
- `git-mirror`
- `github-action-release`
- `hugo-theme-update`
- `yarn-update`

See each action README for required inputs, permissions, and complete examples.
