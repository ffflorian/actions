#!/usr/bin/env sh

# Optional environment variables:
#
# - GIT_EMAIL: An email address for writing commits
# - GIT_NAME: A name for writing commits
# - REPO_URL: A new URL for the repository (e.g. https://user:token@github.com/...)

set -e

[ -n "${GIT_EMAIL}" ] && git config --global "user.email" "${GIT_EMAIL}"
[ -n "${GIT_NAME}"  ] && git config --global "user.name" "${GIT_NAME}"
[ -n "${REPO_URL}"  ] && git remote set-url origin "${REPO}"
