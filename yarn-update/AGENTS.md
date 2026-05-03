# AGENTS.md — yarn-update

This file contains conventions for AI agents and contributors working on the `yarn-update` action.

## Overview

`yarn-update` is a GitHub TypeScript action (runtime: `node24`) that:

1. Scans the repository workspace for `.yarn` directories (up to 5 levels deep).
2. Fetches the latest stable yarn release from the GitHub API, optionally applying a cooldown period.
3. Runs `yarn set version` and `yarn install --mode=update-lockfile` in each project.
4. Opens a pull request with the changes if any upgrades were applied.

## Project Structure

```
yarn-update/
├── action.yml          # Action metadata (using: node24, runs: dist/index.js)
├── dist/index.js       # Bundled output — always regenerate with `yarn build` after src changes
├── src/
│   ├── index.ts        # Action entry point (run() + createPullRequest())
│   ├── utils.ts        # Pure, testable utility exports
│   └── utils.test.ts   # Vitest unit tests for utils
├── package.json        # All dependency versions are pinned (no ^ or ~)
├── yarn.lock           # Committed lockfile — update with `yarn install`
├── tsconfig.json       # TypeScript config (target: ES2022, moduleResolution: bundler)
├── prettier.config.mjs # Prettier config via @ffflorian/prettier-config
└── README.md           # User-facing documentation
```

## Development

### Prerequisites

- Node.js ≥ 20
- Yarn 1.x (`yarn install`)

### Install dependencies

```bash
yarn install
```

### Build the bundle (required before committing src changes)

```bash
yarn build
```

The bundled `dist/index.js` must be committed alongside source changes so GitHub Actions can run the action without a separate install step.

### Run tests

```bash
yarn test
```

### Type-check

```bash
yarn type-check
```

### Format check

```bash
yarn format:check
```

## Coding Conventions

- **Package manager**: use `yarn` (not `npm`). The lockfile is `yarn.lock`.
- **Dependency versions**: all versions in `package.json` must be pinned exactly (no `^` or `~` ranges).
- **Version comparison**: always use `semver.compare(semver.coerce(a), semver.coerce(b))` from the `semver` package. Do not write custom version-parsing logic.
- **Utility functions** (`findYarnDirs`, `compareVersions`, `fetchEligibleRelease`) live in `src/utils.ts` as named exports so they can be unit-tested independently.
- **Tests**: written with Vitest. Run `yarn test` to verify.
- **No ESLint** — formatting is enforced by Prettier only.

## CI

The workflow at `.github/workflows/yarn_update_ci.yml` runs on changes to `yarn-update/**` and executes:

1. `yarn install --frozen-lockfile`
2. `yarn format:check`
3. `yarn type-check`
4. `yarn test`

## Action Inputs / Outputs

See `README.md` for the full input/output reference and usage example.
