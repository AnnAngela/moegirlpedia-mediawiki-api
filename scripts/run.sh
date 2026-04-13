#!/usr/bin/env bash
set -euo pipefail

base_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$base_dir"

if [[ ! -d node_modules ]]; then
    npm install
fi

if [[ ! -f dist/index.js ]]; then
    npm run build
fi

node dist/index.js "$@"
