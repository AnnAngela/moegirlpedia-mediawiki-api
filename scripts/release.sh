#!/usr/bin/env bash
set -euo pipefail

version_input="${1:-}"
push_flag="${2:-}"

if [[ -z "$version_input" ]]; then
    echo "Usage: $0 <version> [--push]" >&2
    exit 1
fi

normalized_version="${version_input#v}"
tag_name="v${normalized_version}"
branch_name="production/${tag_name}"

if [[ "$(git branch --show-current)" != "master" ]]; then
    echo "Run this script from the master branch." >&2
    exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
    echo "Working tree must be clean before creating a release branch." >&2
    exit 1
fi

if git rev-parse --verify "$branch_name" >/dev/null 2>&1; then
    echo "Branch $branch_name already exists." >&2
    exit 1
fi

if git rev-parse --verify "$tag_name" >/dev/null 2>&1; then
    echo "Tag $tag_name already exists." >&2
    exit 1
fi

git switch -c "$branch_name"

npm version "$normalized_version" --no-git-tag-version
npm ci
npm run build

temporary_gitignore="$(mktemp)"
grep -vx 'dist' .gitignore > "$temporary_gitignore"
cat "$temporary_gitignore" > .gitignore
rm -f "$temporary_gitignore"

git add .gitignore dist package-lock.json package.json
git commit -m "chore(release): ${tag_name}"
git tag "$tag_name"

if [[ "$push_flag" == "--push" ]]; then
    git push origin "$branch_name"
    git push origin "$tag_name"
fi

echo "Created release branch $branch_name and tag $tag_name."
