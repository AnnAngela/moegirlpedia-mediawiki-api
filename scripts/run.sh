#!/usr/bin/env bash
set -euo pipefail

base_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$base_dir"

if [[ ! -f dist/.bundled ]]; then
    echo "Expected dist/.bundled to exist. Run npm run build first." >&2
    exit 1
fi

node dist/index.js "$@"
