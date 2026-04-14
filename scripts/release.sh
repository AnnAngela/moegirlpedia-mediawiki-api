#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "$script_dir/.." && pwd)"

cd "$repo_root"

resolve_default_branch() {
    local remote_head=""

    if remote_head="$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null)"; then
        echo "${remote_head#origin/}"
        return 0
    fi

    if git show-ref --verify --quiet refs/heads/master; then
        echo "master"
        return 0
    fi

    if git show-ref --verify --quiet refs/heads/main; then
        echo "main"
        return 0
    fi

    echo "Could not determine the default branch." >&2
    return 1
}

print_usage() {
    cat <<'EOF'
Usage:
  npm run release
  npm run release -- [<version>]
  bash scripts/release.sh [<version>]

If <version> is omitted, the script prompts for it interactively.
EOF
}

version_input=""

for arg in "$@"; do
    case "$arg" in
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
default_branch="$(resolve_default_branch)"

if [[ "$(git branch --show-current)" != "$default_branch" ]]; then
    echo "Run this script from the $default_branch branch." >&2
    exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
    echo "Working tree must be clean before creating a release branch." >&2
    exit 1
fi

npm run lint

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
release_branch_created="false"
release_tag_created="false"
release_branch_pushed="false"

cleanup() {
    local exit_code=$?
    local cleanup_failed="false"
    local current_branch=""

    trap - EXIT

    current_branch="$(git branch --show-current)"

    if [[ "$exit_code" -ne 0 && "$current_branch" == "$branch_name" && "$release_branch_pushed" == "false" ]]; then
        git reset --hard HEAD >/dev/null 2>&1 || true
        current_branch="$(git branch --show-current)"
    fi

    if [[ "$current_branch" != "$default_branch" ]]; then
        if ! git switch "$default_branch" >/dev/null 2>&1; then
            echo "Failed to switch back to $default_branch." >&2
            cleanup_failed="true"
        fi
    fi

    if [[ "$exit_code" -ne 0 && "$release_branch_pushed" == "false" ]]; then
        if [[ "$release_tag_created" == "true" ]]; then
            if ! git tag -d "$tag_name" >/dev/null 2>&1; then
                echo "Failed to delete tag $tag_name during cleanup." >&2
                cleanup_failed="true"
            fi
        fi

        if [[ "$release_branch_created" == "true" ]]; then
            if ! git branch -D "$branch_name" >/dev/null 2>&1; then
                echo "Failed to delete branch $branch_name during cleanup." >&2
                cleanup_failed="true"
            fi
        fi
    fi

    if [[ "$cleanup_failed" == "true" ]]; then
        exit 1
    fi

    exit "$exit_code"
}

trap cleanup EXIT

if git rev-parse --verify "$branch_name" >/dev/null 2>&1; then
    echo "Branch $branch_name already exists." >&2
    exit 1
fi

if git rev-parse --verify "$tag_name" >/dev/null 2>&1; then
    echo "Tag $tag_name already exists." >&2
    exit 1
fi

if git ls-remote --exit-code --heads origin "$branch_name" >/dev/null 2>&1; then
    echo "Remote branch $branch_name already exists." >&2
    exit 1
fi

if git ls-remote --exit-code --tags origin "$tag_name" >/dev/null 2>&1; then
    echo "Remote tag $tag_name already exists." >&2
    exit 1
fi

git switch -c "$branch_name"
release_branch_created="true"

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
release_tag_created="true"

git push origin "$branch_name"
release_branch_pushed="true"
git push origin "$tag_name"

echo "Created release branch $branch_name and pushed tag $tag_name."
