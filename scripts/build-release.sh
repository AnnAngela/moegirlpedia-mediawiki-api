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
    --platform=node \
    --target=node24.11 \
    --outdir=dist \
    --outbase=src \
    --legal-comments=linked \
    --tree-shaking=true \
    --metafile=.cache/metafile.json \
    # --banner:js="$banner"

chmod 755 dist/index.js
