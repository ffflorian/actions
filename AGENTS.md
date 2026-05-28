# AGENTS Guide

This file explains how coding agents should work in this repository.

## General

### Approach

- Think before acting. Read existing files before writing code.
- Be concise in output but thorough in reasoning.
- Prefer editing over rewriting whole files.
- Do not re-read files you have already read.
- Test your code before declaring done.
- No sycophantic openers or closing fluff.
- Keep solutions simple and direct.
- User instructions always override this file.

### Output

- Return code first. Explanation after, only if non-obvious.
- No inline prose. Use comments sparingly - only where logic is unclear.
- No boilerplate unless explicitly requested.

### Code Rules

- Simplest working solution. No over-engineering.
- No abstractions for single-use operations.
- No speculative features or "you might also want..."
- Read the file before modifying it. Never edit blind.
- No docstrings or type annotations on code not being changed.
- No error handling for scenarios that cannot happen.
- Three similar lines is better than a premature abstraction.

### Review Rules

- State the bug. Show the fix. Stop.
- No suggestions beyond the scope of the review.
- No compliments on the code before or after the review.

### Debugging Rules

- Never speculate about a bug without reading the relevant code first.
- State what you found, where, and the fix. One pass.
- If cause is unclear: say so. Do not guess.

### Simple Formatting

- No em dashes, smart quotes, or decorative Unicode symbols.
- Plain hyphens and straight quotes only.
- Natural language characters (accented letters, CJK, etc.) are fine when the content requires them.
- Code output must be copy-paste safe.

## Project Overview

This repository contains reusable GitHub Actions:

- `coolify-deploy`: Trigger a Coolify deployment and optionally wait for completion.
- `force-release`: Force a semantic-release by temporarily injecting `releaseRules` and running semantic-release.
- `git-mirror`: Mirror repository refs to GitLab and/or Codeberg over SSH.
- `github-action-release`: Create semantic releases and maintain major/latest tags.
- `hugo-theme-update`: Update Hugo modules and open an automated pull request.
- `yarn-update`: Check for yarn updates and open an automated pull request.

Each TypeScript action directory contains:

- `action.yml` — action metadata
- `src/` — TypeScript source (`index.ts`) and `__tests__/`
- `dist/index.js` — bundled output, **always committed** alongside source changes
- `package.json`, `yarn.lock`, `.yarnrc.yml`, `.yarn/releases/` — Yarn 4 setup
- `tsconfig.json`
- `README.md` — user-facing documentation

## Code Style

- Keep action metadata and workflow files in YAML with consistent two-space indentation.
- Pin external actions to full commit SHAs instead of floating tags.
- Keep shell snippets POSIX/Bash-safe and quote variables.
- Keep documentation concise and actionable; each action README must document inputs and usage.
- Prefer minimal, focused changes; avoid unrelated refactors.

## TypeScript Actions

Actions that require Node.js logic are written in TypeScript:

- **Package manager**: yarn (Yarn 4). Never use npm. Each action has its own `yarn.lock`.
- **Dependency versions**: pin all to exact versions (no `^` or `~` ranges).
- **Source entry point**: `src/index.ts`.
- **Bundle**: built with `esbuild` into `dist/index.js`; always regenerate with `yarn build` after source changes.
- **Runtime target**: `node26`.
- **Invocation**: composite actions run the bundle via `node "${{ github.action_path }}/dist/index.js"`. The `yarn-update` action uses `using: node24` with `main: dist/index.js` directly.
- **Inputs**: passed as `INPUT_<NAME>` env vars (uppercase, matching the action input name) and read with `@actions/core` `getInput()`.
- **Formatting**: enforced by Prettier via `@ffflorian/prettier-config`. No ESLint.

### Validation (run before committing)

Each TypeScript action supports the following scripts via `yarn`:

```bash
yarn install --immutable   # install exact locked dependencies
yarn lint                  # Prettier check for `src/`
yarn fix                   # Prettier write for `src/`
yarn type-check            # tsc --noEmit
yarn test                  # Vitest unit tests
yarn build                 # bundle to dist/index.js
```

## Testing

- **Framework**: [Vitest](https://vitest.dev/) (not Jest).
- **Test files**: live in `<action-dir>/src/__tests__/` (e.g. `run.test.ts`, `utils.test.ts`).
- Use `vi.hoisted()` for any values that must be defined before `vi.mock()` factory functions run.
- Run tests with `yarn test` from the action subdirectory.

## Development Conventions

- Update action READMEs when changing action inputs, behavior, or permissions.
- Preserve backward compatibility for published action interfaces unless intentionally breaking.
- Never use npm; always use yarn.

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

### Lint, build, and publish (`.github/workflows/lint_build_publish.yml`)

Runs on push to `main` and on pull requests targeting `main`. Jobs:

1. **`lint_build_publish`**: runs root-level Prettier (`@ffflorian/prettier-config@0.7.0` + `prettier@3.8.1`), builds all four TypeScript actions, then publishes a semantic release on push to `main` using `./github-action-release`.
2. **`hugo_theme_update_test`**: `yarn install --immutable && yarn lint && yarn type-check && yarn test` inside `hugo-theme-update/`.
3. **`coolify_deploy_test`**: `yarn install --immutable && yarn lint && yarn type-check && yarn test` inside `coolify-deploy/`.
4. **`force_release_test`**: `yarn install --immutable && yarn lint && yarn type-check && yarn test` inside `force-release/`.
5. **`yarn_update_test`**: `yarn install --immutable && yarn lint && yarn type-check && yarn test` inside `yarn-update/`.

### Other workflows

- **`force-release.yml`**: manual `workflow_dispatch` that runs `./force-release` on this repository.
- **`git_mirror.yml`**: mirrors this repository to GitLab/Codeberg.
- **`yarn_update.yml`**: scheduled monthly + manual; runs `./yarn-update` to open a PR when a newer yarn is available.

When changing release behavior, keep `lint_build_publish.yml` and `github-action-release/action.yml` aligned.

## PR Guidelines

- Keep PR titles and descriptions focused on what changed and why.
- Document any user-facing action input/output or behavior changes in the relevant README.
