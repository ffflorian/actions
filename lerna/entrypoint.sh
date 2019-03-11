#!/usr/bin/env bash

GITHUB_TOKEN="${GH_TOKEN:-GITHUB_TOKEN}"
GIT_EMAIL="${GIT_EMAIL:-"${GIT_USER}@users.noreply.github.com"}"

echo "//registry.npmjs.org/:_authToken=${NPM_AUTH_TOKEN}" > "${HOME}/.npmrc"
git config --global "user.email" "${GIT_EMAIL}"
git config --global "user.name" "${GIT_USER}"

REPO="$(git config remote.origin.url)"
REPO="${REPO/https:\/\/github.com\//https:\/\/${GIT_USER}:${GH_TOKEN}@github.com\/}"
git remote set-url origin "${REPO}"

sh -c "lerna $*"

rm "${HOME}/.npmrc"
unset REPO
