#!/usr/bin/env bash
# install-helper for omarchy-quick-ai: build initial models cache
set -euo pipefail

PLUGIN_DIR="$(cd "$(dirname "$0")" && pwd)"
CACHE_BUILDER="$PLUGIN_DIR/bin/build-models-cache"

if [[ ! -x "$CACHE_BUILDER" ]]; then
  chmod +x "$CACHE_BUILDER" 2>/dev/null || true
fi

echo "Building Quick AI models cache..." >&2
if [[ -x "$CACHE_BUILDER" ]]; then
  if "$CACHE_BUILDER" --refresh; then
    echo "Models cache built at ${XDG_CACHE_HOME:-$HOME/.cache}/omarchy/quick-ai/models.json" >&2
  else
    echo "Warning: failed to build models cache; refresh it later from Quick AI settings" >&2
  fi
else
  echo "Warning: build-models-cache not found or not executable" >&2
fi

echo "Quick AI install helper done. Enable with: omarchy plugin enable omarchy-quick-ai" >&2
