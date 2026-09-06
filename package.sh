#!/usr/bin/env bash
#
# Build a clean Chrome Web Store upload zip.
#
# Uses an allowlist: only the files Chrome actually needs are staged and zipped,
# so nothing stray (the .git dir, docs, icon sources, .DS_Store) can leak into
# the package. Everything the manifest references must appear in FILES below.
#
# Usage:  ./package.sh   ->   dist/antimouse-<version>.zip

set -euo pipefail
cd "$(dirname "$0")"

# Exactly what the manifest loads — keep in sync with manifest.json.
FILES=(
  manifest.json
  styles.css
  src/main.js
  src/overlay.js
  src/page-links.js
  src/search.js
  src/settings-store.js
  src/settings.js
  icons/icon-16.png
  icons/icon-48.png
  icons/icon-128.png
  LICENSE
)

VERSION=$(node -p "require('./manifest.json').version")
OUT="dist/antimouse-${VERSION}.zip"
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT

# Stage the allowlisted files, preserving their directory structure.
for f in "${FILES[@]}"; do
  if [[ ! -e "$f" ]]; then
    echo "error: missing file '$f' (referenced in package.sh)" >&2
    exit 1
  fi
  mkdir -p "$STAGE/$(dirname "$f")"
  cp "$f" "$STAGE/$f"
done

mkdir -p dist
rm -f "$OUT"

# -r recurse, -X drop macOS extended attrs / resource forks.
( cd "$STAGE" && zip -rX - . ) > "$OUT"

echo "Built $OUT"
echo "--- contents ---"
unzip -l "$OUT"
