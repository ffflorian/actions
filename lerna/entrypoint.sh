#!/usr/bin/env bash

# Environment variables:
#
# - GITHUB_TOKEN|GH_TOKEN: A GitHub token for pushing to GitHub (required)
# - GITHUB_USER|GH_USER: A GitHub user for pushing to GitHub (required)
#
# - NPM_AUTH_TOKEN: An npm token for publishing (not needed if Lerna will not publish)
# - GIT_EMAIL: An email address for writing commits (default is <GITHUB_USER>@users.noreply.github.com)
# - GIT_NAME: A name for writing commits (default is <GITHUB_USER>)

GITHUB_USER="${GH_USER:-"${GITHUB_USER}"}"
GITHUB_TOKEN="${GH_TOKEN:-"${GITHUB_TOKEN}"}"
GIT_NAME="${GIT_NAME:-"${GITHUB_USER}"}"

if [ -z "${GITHUB_TOKEN}" ]; then
  echo "No GitHub token set."
  exit 1
fi

if [ -z "${GIT_NAME}" ]; then
  echo "No git name and no GitHub user set."
  exit 1
fi

if [ -z "${GIT_EMAIL}" ] && [ -z "${GITHUB_USER}" ]; then
  echo "No git email address and no GitHub user set."
  exit 1
fi

GIT_EMAIL="${GIT_EMAIL:-"${GITHUB_USER}@users.noreply.github.com"}"

echo "//registry.npmjs.org/:_authToken=${NPM_AUTH_TOKEN}" > "${HOME}/.npmrc"
git config --global "user.email" "${GIT_EMAIL}"
git config --global "user.name" "${GIT_NAME}"

REPO="$(git config remote.origin.url)"
REPO="${REPO/https:\/\/github.com\//https:\/\/${GITHUB_USER}:${GITHUB_TOKEN}@github.com\/}"
git remote set-url origin "${REPO}"

sh -c "lerna $*"

rm "${HOME}/.npmrc" "${HOME}/.gitconfig"

unset REPO
unset GITHUB_TOKEN
unset NPM_AUTH_TOKEN
