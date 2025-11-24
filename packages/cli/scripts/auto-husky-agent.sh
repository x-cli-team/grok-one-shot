#!/bin/bash

# Auto-Husky Agent Integration Script
# Runs local agent to fix husky-reported errors and automate commits
# Usage: ./scripts/auto-husky-agent.sh "Your commit message"

set -e

COMMIT_MSG="${1:-'Automated commit with agent fixes'}"
AGENT_BINARY="grok-one-shot"  # Change to 'xcli' if using legacy binary
DOCS_DIR="apps/site/docs"
BUILD_TIMEOUT=60  # seconds

echo "🤖 Auto-Husky Agent Integration"
echo "================================"
echo "Commit Message: $COMMIT_MSG"
echo "Agent Binary: $AGENT_BINARY"
echo ""

# Step 1: Run husky pre-commit and capture output
echo "🔍 [Step 1] Running husky pre-commit checks..."
if ! npx husky run pre-commit 2>&1 | tee /tmp/husky-agent.log; then
  echo "⚠️ Husky failed - analyzing errors..."
  HUSKY_FAILED=true
else
  echo "✅ Husky passed - direct commit"
  git add .
  git commit -m "$COMMIT_MSG"
  echo "🎉 Commit successful!"
  exit 0
fi

# Step 2: Extract and categorize errors
echo "📋 [Step 2] Analyzing husky errors..."
ERROR_TYPE=""

# Check for MDX/Docusaurus errors
if grep -qi "mdx\\|docusaurus\\|build:site" /tmp/husky-agent.log; then
  ERROR_TYPE="MDX"
  echo "🔍 Detected MDX/Docusaurus errors"
  cd apps/site
  BUILD_LOG="/tmp/docusaurus-build.log"
  if timeout $BUILD_TIMEOUT npm run build 2>&1 | tee $BUILD_LOG; then
    echo "✅ Docusaurus build succeeded locally"
    cd ../..
    ERROR_TYPE="LINKS"  # Only warnings remain
  else
    echo "❌ Docusaurus build failed - extracting broken links"
    grep -i "broken\\|link\\|anchor" $BUILD_LOG | head -10 || echo "No specific broken links found"
    cd ../..
  fi
elif grep -qi "tool\\|validate-tool-code" /tmp/husky-agent.log; then
  ERROR_TYPE="TOOLS"
  echo "🔧 Detected tool validation errors"
elif grep -qi "core-features\\|test-core" /tmp/husky-agent.log; then
  ERROR_TYPE="CORE"
  echo "🧪 Detected core features test failures"
else
  ERROR_TYPE="UNKNOWN"
  echo "❓ Unknown error type detected"
fi

# Step 3: Agent-assisted fix based on error type
echo "🛠️ [Step 3] Running local agent to fix $ERROR_TYPE errors..."

case $ERROR_TYPE in
  "MDX"|"LINKS")
    echo "📝 Fixing MDX broken links with agent..."
    # Use agent to fix common broken link patterns
    cd $DOCS_DIR
    
    # Agent prompt for MDX fixes
    if command -v $AGENT_BINARY >/dev/null 2>&1; then
      echo "🤖 Agent: Fixing broken MDX links..."
      $AGENT_BINARY -p "Scan all .mdx files in current directory for broken relative links like '../../getting-started/overview.md'. Convert them to absolute paths starting with '/docs/'. Fix Docusaurus links like '/en/plugins-reference' to internal doc paths. Add missing anchors like '#project-context-grokmd'. Make minimal changes only - preserve all content and rebranding text. Files to check: hooks-guide.mdx, settings.mdx, mcp.mdx, subagents.mdx, plan-mode.mdx, common-workflows.mdx, cli-reference.mdx, interactive-mode.mdx, slash-commands.mdx, hooks.mdx, skills.mdx" 2>/dev/null || echo "Agent MDX fix completed (or skipped)"
    else
      echo "⚠️ Agent binary not found - applying automated sed fixes"
      # Fallback automated fixes
      find . -name "*.mdx" -exec sed -i '' 's|\.\./\.\./getting-started/overview\.mdx|/docs/getting-started/overview.mdx|g' {} \;
      find . -name "*.mdx" -exec sed -i '' 's|\.\./reference/[^ ]*|/docs/reference/|g' {} \;
      find . -name "*.mdx" -exec sed -i '' 's|/en/plugins-reference|/docs/features/plugins|g' {} \;
      find . -name "*.mdx" -exec sed -i '' 's|/en/slash-commands|/docs/reference/slash-commands|g' {} \;
      find . -name "*.mdx" -exec sed -i '' 's|/en/hooks|/docs/getting-started/hooks|g' {} \;
    fi
    
    cd ../..
    ;;
    
  "TOOLS")
    echo "🔧 Agent: Fixing tool validation issues..."
    if command -v $AGENT_BINARY >/dev/null 2>&1; then
      $AGENT_BINARY -p "Check src/tools/ directory for missing or broken tool files. Ensure all 25+ tools have proper exports. Validate src/tools/index.ts exports all tools. Fix any missing imports in src/agent/grok-agent.ts. Run 'npm run test:tools:validate' after fixes. Make minimal changes to restore tool integrity." 2>/dev/null || echo "Agent tool fix completed"
    fi
    ;;
    
  "CORE")
    echo "🧪 Agent: Fixing core features..."
    if command -v $AGENT_BINARY >/dev/null 2>&1; then
      $AGENT_BINARY -p "Run './scripts/test-core-features.sh' and fix the 3 failing CLI entry point tests (version display, help display, missing API key handling). Ensure node dist/index.js --version returns proper version format. Fix argument parsing in src/index.ts if needed. Test direct Node execution works." 2>/dev/null || echo "Agent core fix completed"
    fi
    ;;
    
  "UNKNOWN")
    echo "❓ Agent: General error analysis..."
    if command -v $AGENT_BINARY >/dev/null 2>&1; then
      $AGENT_BINARY -p "Analyze /tmp/husky-agent.log for the specific error blocking the commit. Provide a bash one-liner fix if possible. Focus on the most likely issue based on error patterns." < /tmp/husky-agent.log 2>/dev/null || echo "Agent general analysis completed"
    fi
    ;;
esac

# Step 4: Re-test husky after agent fixes
echo "🔍 [Step 4] Re-testing husky after agent fixes..."
if npx husky run pre-commit 2>&1 | tee /tmp/husky-fixed.log; then
  echo "✅ Agent fixes successful - husky now passes!"
  echo "💾 Auto-committing with fixes..."
  git add .
  git commit -m "$COMMIT_MSG (auto-fixed by husky agent)"
  rm -f /tmp/husky-*.log
  echo "🎉 Automated commit successful!"
  exit 0
else
  echo "⚠️ Agent fixes insufficient for full husky pass"
  echo "📋 Showing remaining errors:"
  cat /tmp/husky-fixed.log
  echo ""
  echo "💡 Next steps:"
  echo "   1. Run './scripts/auto-husky-agent.sh --manual' for interactive agent session"
  echo "   2. Or use 'git commit --no-verify' to bypass husky temporarily"
  echo "   3. Check specific error type: $ERROR_TYPE"
  exit 1
fi