#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

if [ "${NO_FETCH_SCHEMA:-0}" != "1" ]; then
  echo "Fetching Recall API endpoint schemas and merging into a single OpenAPI document..."
  bun run "${SCRIPT_DIR}/fetch-and-merge-openapi.ts"
else
  echo "Skipping schema fetch (NO_FETCH_SCHEMA=1)..."
fi

echo
echo "Generating TypeScript client with OpenAPI-ts..."
bun openapi-ts

echo
echo "Done."
