#!/usr/bin/env sh

# All arguments are used as pattern for grep.

set -e

PATTERN="$*"
GIT_LAST_COMMIT="$(git log -1 --pretty=%B | head -n 1)"
LAST_COMMIT="${EVENT_COMMIT_MESSAGE:-GIT_LAST_COMMIT}"

if echo "$LAST_COMMIT" | grep -qP "$PATTERN"; then
  echo "\"$LAST_COMMIT\" matches \"$PATTERN\""
  exit 0
fi

echo "\"$LAST_COMMIT\" does not match \"$PATTERN\""
exit 78
