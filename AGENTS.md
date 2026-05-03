# AGENTS.md

This file contains conventions for AI agents and contributors working in this repository.

## Project Overview

This repository contains reusable composite GitHub Actions:

- `git-mirror`: Mirror repository refs to GitLab and/or Codeberg.
- `github-action-release`: Create semantic releases and maintain major/latest tags.
- `hugo-theme-update`: Update Hugo modules and open an automated pull request.
- `yarn-update`: Update yarn and open an automated pull request.

## Repository Structure

- `.github/workflows/main.yml`: Release workflow for this repository.
- `git-mirror/action.yml`: Mirror action definition.
- `github-action-release/action.yml`: Release action definition.
- `hugo-theme-update/action.yml`: Hugo module update action definition.
- `yarn-update/action.yml`: yarn update action definition.
- Each action directory should include a matching `README.md`.
- TypeScript-based actions keep source in `src/main.ts`, bundle with esbuild into `dist/index.js`, and commit `dist/index.js` to the repository.

## Code Style

- Keep action metadata and workflow files in YAML with consistent two-space indentation.
- Pin external actions to full commit SHAs instead of floating tags.
- Keep shell snippets POSIX/Bash-safe and quote variables.
- Keep documentation concise and actionable; each action README must document inputs and usage.
- Prefer minimal, focused changes; avoid unrelated refactors.

## TypeScript Actions

Actions that require Node.js logic are written in TypeScript:

- Source lives in `<action-dir>/src/main.ts`.
- Bundled with `esbuild` into `<action-dir>/dist/index.js` (committed to the repo).
- Use `yarn` for dependency management — do **not** use npm.
- Commit both `package.json` and `yarn.lock`; do not add them to `.gitignore`.
- Pin all dependencies to exact versions (no `^` or `~` ranges).
- Build script: `esbuild src/main.ts --bundle --platform=node --target=node24 --outfile=dist/index.js`.
- The composite action invokes the bundled script via `node "${{ github.action_path }}/dist/index.js"`.
- Environment inputs are passed as `INPUT_<NAME>` env vars and read with `@actions/core` `getInput()`.

## Development Conventions

- Update action READMEs when changing action inputs, behavior, or permissions.
- Preserve backward compatibility for published action interfaces unless intentionally breaking.

## Commit Messages

Use semantic/conventional commit messages:

```text
feat: add new feature
fix: fix a bug
chore: maintenance tasks
docs: documentation changes
refactor: internal restructuring without behavior change
test: add or update tests
build: build/release system changes
ci: CI/CD configuration changes
```

- Do not mention AI tools in commit messages.

## Branch Naming

Use semantic branch names:

```text
feat/<short-description>
fix/<short-description>
chore/<short-description>
docs/<short-description>
refactor/<short-description>
```

- Do not include AI/tool identifiers in branch names.

## CI/CD

Current workflow (`.github/workflows/main.yml`):

1. Runs on push to `main`.
2. Uses the local `github-action-release` composite action.
3. Requires `GITHUB_TOKEN` and write access to repository contents.

When changing release behavior, keep workflow and `github-action-release/action.yml` aligned.

## PR Guidelines

- Keep PR titles and descriptions focused on what changed and why.
- Do not reference AI tools in PR titles or descriptions.
- Document any user-facing action input/output or behavior changes in the relevant README.
