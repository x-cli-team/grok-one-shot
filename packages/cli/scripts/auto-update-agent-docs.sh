#!/bin/bash

# Auto-update .agent/docs using AI agent analysis
# Runs during pre-commit to document session changes

set -e

echo "🤖 Auto-updating .agent/docs based on session changes..."

# Skip in CI environments
if [ -n "$CI" ] || [ -n "$GITHUB_ACTIONS" ]; then
  echo "⏭️ Skipping AI doc updates in CI environment"
  exit 0
fi

# Check if grok command is available
if ! command -v grok &> /dev/null; then
  echo "⚠️ Grok command not available - skipping AI doc updates"
  exit 0
fi

# Get changed files from git status (staged + unstaged)
CHANGED_FILES=$(git status --porcelain | awk '{print $2}' | head -20)  # Limit to first 20 files

if [ -z "$CHANGED_FILES" ]; then
  echo "📝 No changes detected - skipping doc updates"
  exit 0
fi

echo "📊 Analyzing changes in: $(echo "$CHANGED_FILES" | wc -l) files"

# Create a temporary prompt file
TEMP_PROMPT="/tmp/grok-doc-update-prompt.txt"
cat > "$TEMP_PROMPT" << 'EOF'
You are an expert technical writer updating internal documentation for Grok One-Shot CLI.

SESSION CHANGES TO DOCUMENT:
{CHANGES}

INSTRUCTIONS:
1. Review the changed files above
2. Identify which .agent/docs/ files need updates based on these changes
3. Update only the relevant documentation files in .agent/docs/
4. Focus on technical accuracy and clarity
5. Keep changes minimal and targeted
6. Do not modify files outside .agent/docs/

IMPORTANT: Only update documentation that directly relates to the code changes. Skip unrelated docs.
EOF

# Replace placeholder with actual changes
sed -i.bak "s/{CHANGES}/$(echo "$CHANGED_FILES" | sed 's/$/\\n/' | tr -d '\n')/" "$TEMP_PROMPT"

# Run grok with timeout (60 seconds max)
echo "🧠 Running AI analysis and doc updates..."
if timeout 60 grok -f "$TEMP_PROMPT" 2>/dev/null; then
  echo "✅ AI doc updates completed successfully"
else
  echo "⚠️ AI doc update timed out or failed - continuing with commit"
fi

# Clean up temp file
rm -f "$TEMP_PROMPT" "$TEMP_PROMPT.bak"