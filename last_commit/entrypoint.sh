#!/usr/bin/env sh

PATTERN="$*"
LAST_COMMIT="$(git log -1 --pretty=%B)"

if echo "$LAST_COMMIT" | grep -qP "$PATTERN"; then
  echo "\"$LAST_COMMIT\" matches \"$PATTERN\""
  exit 0
fi

echo "\"$LAST_COMMIT\" does not match \"$PATTERN\""
exit 78
