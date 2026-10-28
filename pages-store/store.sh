#!/usr/bin/env bash
# Puts a build in its place on the store branch (or removes a preview), prunes previews whose
# branch is gone, rewrites preview/index.html and pushes. See action.yml. Settings come from the
# environment: TARGET, SOURCE, REMOVE, BRANCH, SHA, URL, STORE_BRANCH, STAMP.
set -euo pipefail

lib="$(cd "$(dirname "$0")/../lib" && pwd)"
case "$TARGET" in '' | preview/[a-z0-9]*) ;; *) echo "::error::bad target '$TARGET'"; exit 1 ;; esac
case "$TARGET" in *..* | */*/*) echo "::error::bad target '$TARGET'"; exit 1 ;; esac
[ "$REMOVE" = true ] || [ -d "$SOURCE" ] || { echo "::error::no build at '$SOURCE'"; exit 1; }

export GIT_AUTHOR_NAME="github-actions[bot]" GIT_COMMITTER_NAME="github-actions[bot]"
export GIT_AUTHOR_EMAIL="41898282+github-actions[bot]@users.noreply.github.com"
export GIT_COMMITTER_EMAIL="$GIT_AUTHOR_EMAIL"

# The pages carry the commit they were built from, for anything that checks which build an address
# is serving (the Lighthouse workflow does).
if [ "$REMOVE" != true ] && [ "$STAMP" = true ]; then
  at="$(git log -1 --format=%cI "$SHA" 2>/dev/null || date -u +%FT%TZ)"
  find "$SOURCE" -name '*.html' -exec sed -i "s/__BUILD_SHA__/${SHA}/g; s/__BUILD_SHORT__/${SHA:0:7}/g; s/__BUILD_AT__/${at}/g" {} +
fi
message="$(git log -1 --format=%s "$SHA" 2>/dev/null || true)"
repo_url="$GITHUB_SERVER_URL/$GITHUB_REPOSITORY"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

for attempt in 1 2 3 4 5 6 7 8; do
  rm -rf "$work/tree" && mkdir -p "$work/tree"
  # The current branch (one commit, no history), or nothing on the very first run.
  lease=""
  if git fetch -q --depth=1 origin "+refs/heads/$STORE_BRANCH:refs/remotes/origin/$STORE_BRANCH" 2>/dev/null; then
    lease="$(git rev-parse "refs/remotes/origin/$STORE_BRANCH")"
    git archive "$lease" | tar -x -C "$work/tree"
  fi

  if [ -z "$TARGET" ]; then
    # The live site: everything at the root except preview/ is replaced.
    find "$work/tree" -mindepth 1 -maxdepth 1 ! -name preview -exec rm -rf {} +
    cp -a "$SOURCE"/. "$work/tree"/
  else
    rm -rf "${work:?}/tree/$TARGET"
    if [ "$REMOVE" != true ]; then
      mkdir -p "$work/tree/$TARGET" && cp -a "$SOURCE"/. "$work/tree/$TARGET"/
      node -e 'require("fs").writeFileSync(process.argv[1], JSON.stringify({ branch: process.argv[2], sha: process.argv[3], at: new Date().toISOString(), message: process.argv[4], url: process.argv[5] }, null, 2) + "\n")' \
        "$work/tree/$TARGET/_preview.json" "$BRANCH" "$SHA" "$message" "$URL"
    fi
  fi

  # Previews of branches that no longer exist go too (in case a delete event was missed).
  if git ls-remote --heads origin | sed 's#.*refs/heads/##' > "$work/branches"; then
    node "$lib/previews.mjs" index "$work/tree" "$repo_url" "$work/branches"
  else
    node "$lib/previews.mjs" index "$work/tree" "$repo_url"
  fi

  # Commit the tree with a separate index, so the checkout is untouched.
  export GIT_INDEX_FILE="$work/index"
  rm -f "$GIT_INDEX_FILE"
  git --work-tree "$work/tree" add -A -f .
  what="${TARGET:-live site}"
  [ "$REMOVE" = true ] && what="remove $TARGET"
  commit="$(git commit-tree "$(git write-tree)" -m "Pages: $what from ${SHA:0:7}")"
  unset GIT_INDEX_FILE
  # Replace the branch only if nobody else has since (the lease), otherwise start again.
  if git push -q --force-with-lease="refs/heads/$STORE_BRANCH:${lease}" origin "$commit:refs/heads/$STORE_BRANCH"; then
    echo "::notice title=Pages store::$what from ${SHA:0:7}"
    exit 0
  fi
  echo "Someone else updated $STORE_BRANCH; trying again ($attempt)"
  sleep $((attempt * 3))
done
echo "::error::Couldn't update $STORE_BRANCH"
exit 1
