# actions

A collection of GitHub Actions for use in my projects.

## Available actions

| Action                  | Purpose                                                     | Documentation                                                      |
| ----------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------ |
| `git-mirror`            | Mirror a repository to GitLab and/or Codeberg over SSH.     | [git-mirror/README.md](git-mirror/README.md)                       |
| `github-release-action` | Create semantic releases and maintain major/latest tags.    | [github-release-action/README.md](github-release-action/README.md) |
| `yarn-update`           | Check for Yarn updates and open a pull request when needed. | [yarn-update/README.md](yarn-update/README.md)                     |

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

- `git-mirror`
- `github-release-action`
- `yarn-update`

See each action README for required inputs, permissions, and complete examples.
