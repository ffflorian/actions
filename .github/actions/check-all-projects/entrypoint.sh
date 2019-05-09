#!/usr/bin/env bash

set -e

ENTRYPOINT_FILE="entrypoint.sh"

for DIR in *; do
  if [ -d "${DIR}" ]; then
    (
      cd "${DIR}"
      if [ -r "${ENTRYPOINT_FILE}" ]; then
        echo "#### Testing \"${DIR}\" ..."
        shellcheck "${ENTRYPOINT_FILE}"
        echo
      fi
    )
  fi
done
