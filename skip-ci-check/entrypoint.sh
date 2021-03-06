#!/usr/bin/env sh

set -e

#shellcheck disable=SC2016
PATTERN='tolower($0) ~ !/\[ci skip|skip ci\]/'
GIT_LAST_COMMIT="$(git log -1 --pretty=%B | head -n 1)"
LAST_COMMIT="${EVENT_COMMIT_MESSAGE:-$GIT_LAST_COMMIT}"

if echo "$LAST_COMMIT" | awk "$PATTERN{f=1} END {exit !f}"; then
  echo "Commit \"$LAST_COMMIT\" should not skip CI"
  exit 0
fi

echo "Commit \"$LAST_COMMIT\" should skip CI"
exit 78
