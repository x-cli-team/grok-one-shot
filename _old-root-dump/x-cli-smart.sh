#!/usr/bin/env bash
set -euo pipefail

# --- thresholds (override via env) ---
LINES_T="${GROK_COMPACT_LINES:-800}"          # switch if >800 lines
BYTES_T="${GROK_COMPACT_BYTES:-200000}"       # or >200 KB
SESSION_FILE="${GROK_SESSION_LOG:-$HOME/.grok/session.log}"

# --- respect explicit flags ---
for a in "$@"; do
  case "$a" in
    --compact) FORCE_COMPACT=1 ;;
    --no-compact) FORCE_NO_COMPACT=1 ;;
  esac
done

# --- decide compact ---
COMPACT_ENV="${COMPACT:-}"
if [[ -z "${FORCE_COMPACT:-}" && -z "${FORCE_NO_COMPACT:-}" && -z "$COMPACT_ENV" ]]; then
  if [[ -f "$SESSION_FILE" ]]; then
    LINES=$(wc -l < "$SESSION_FILE" | tr -d ' ')
    BYTES=$(wc -c < "$SESSION_FILE" | tr -d ' ')
    if [[ "$LINES" -gt "$LINES_T" || "$BYTES" -gt "$BYTES_T" ]]; then
      export COMPACT=1
    fi
  fi
fi

# --- run local if src/index.ts exists; else published ---
if [[ -f "src/index.ts" ]]; then
  exec npx --yes tsx src/index.ts "$@"
else
  exec npx --yes @xagent/x-cli@latest "$@"
fi