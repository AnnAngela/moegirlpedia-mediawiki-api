#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "$script_dir/.." && pwd)"

cd "$repo_root"

print_usage() {
    cat <<'EOF'
Usage:
  npm run release
  npm run release -- [<version>] [--push]
  bash scripts/release.sh [<version>] [--push]

If <version> is omitted, the script prompts for it interactively.
EOF
}

version_input=""
should_push="false"

for arg in "$@"; do
    case "$arg" in
        --push)
            should_push="true"
            ;;
        -h|--help)
            print_usage
            exit 0
            ;;
        *)
            if [[ -n "$version_input" ]]; then
                echo "Unexpected argument: $arg" >&2
                print_usage >&2
                exit 1
            fi

            version_input="$arg"
            ;;
    esac
done

if [[ -z "$version_input" ]]; then
    current_version="$(jq -r '.version' package.json)"

    while [[ -z "$version_input" ]]; do
        read -r -p "Target version (current: ${current_version}): " version_input

        if [[ -z "$version_input" ]]; then
            echo "Version cannot be empty." >&2
        fi
    done
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

if [[ "$should_push" == "true" ]]; then
    git push origin "$branch_name"
    git push origin "$tag_name"
fi

echo "Created release branch $branch_name and tag $tag_name."
