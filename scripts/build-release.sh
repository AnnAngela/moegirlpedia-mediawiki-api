#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "$script_dir/.." && pwd)"

cd "$repo_root"

rm -rf dist
mkdir -p dist

banner=$'#!/usr/bin/env node\nimport { createRequire } from "node:module";\nconst require = createRequire(import.meta.url);'

npx esbuild src/index.ts \
    --bundle \
    --format=esm \
    --outfile=dist/index.js \
    --platform=node \
    --target=node24.11 \
    # --banner:js="$banner"

chmod 755 dist/index.js
