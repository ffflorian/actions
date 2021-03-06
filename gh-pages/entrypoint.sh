#!/usr/bin/env bash

# Environment variables:
#
# - GH_TOKEN: A GitHub token for pushing to GitHub (required)
# - GH_USER: A GitHub user for pushing to GitHub (required)
#
# - GIT_EMAIL: An email address for writing commits (default is <GH_USER>@users.noreply.github.com)
# - GIT_NAME: A name for writing commits (default is <GH_USER>)

set -e

if [ -z "${GH_TOKEN}" ]; then
  echo "No GitHub token set."
  exit 1
fi

if [ -z "${GH_USER}" ]; then
  echo "No GitHub user set."
  exit 1
fi

GIT_NAME="${GIT_NAME:-"${GH_USER}"}"
GIT_EMAIL="${GIT_EMAIL:-"${GH_USER}@users.noreply.github.com"}"

git config --global "user.email" "${GIT_EMAIL}"
git config --global "user.name" "${GIT_NAME}"

REPO="$(git config remote.origin.url)"
REPO="${REPO/https:\/\/github.com\//https:\/\/${GH_USER}:${GH_TOKEN}@github.com\/}"
git remote set-url origin "${REPO}"

yarn global add gh-pages@~2.0

sh -c "gh-pages $*"

rm "${HOME}/.gitconfig"

unset REPO
unset GH_TOKEN
