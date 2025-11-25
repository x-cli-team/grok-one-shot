#!/bin/bash

# Smart Doc Sync - Intelligent synchronization with conflict detection
# This replaces the need for manual SKIP_DOC_SYNC overrides

set -e

echo "🧠 Smart Doc Sync - Analyzing changes..."

# Check what files are being changed
CHANGED_FILES=$(git diff --name-only HEAD~1 2>/dev/null || git diff --name-only --cached)

# Check if we're changing both .agent docs AND site files
AGENT_DOCS_CHANGED=$(echo "$CHANGED_FILES" | grep -c "^\.agent/" || true)
SITE_FILES_CHANGED=$(echo "$CHANGED_FILES" | grep -c "^apps/site/src/" || true)

echo "📊 Change analysis:"
echo "   🗂️  .agent/ docs changed: $AGENT_DOCS_CHANGED"
echo "   🌐 Site files changed: $SITE_FILES_CHANGED"

# Smart decision logic
if [[ $AGENT_DOCS_CHANGED -gt 0 && $SITE_FILES_CHANGED -gt 0 ]]; then
    echo "🛡️  CONFLICT PREVENTION: Both .agent docs and site files changed"
    echo "   ⚠️  Skipping auto-sync to prevent overwrites"
    echo "   💡 .agent docs will sync on next .agent-only commit"
    export SKIP_DOC_SYNC=true
    echo "✅ Smart sync decision: SKIP (conflict prevention)"
else
    echo "✅ Smart sync decision: PROCEED (no conflicts detected)"
fi

# Run the sync if not skipped
if [[ "${SKIP_DOC_SYNC:-false}" == "true" ]]; then
    echo "⏭️  Doc sync skipped by smart analysis"
else
    echo "🔄 Running documentation sync..."
    npm run update-agent-docs-auto
fi

echo "🏁 Smart sync analysis complete"