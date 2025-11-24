#!/bin/bash

# Agent iterative testing script
# Usage: ./scripts/test-agent-iterative.sh "test prompt"

PROMPT="${1:-project summary}"
LOG_FILE="agent-test-$(date +%s).log"

echo "🧪 Testing agent with prompt: '$PROMPT'"
echo "📝 Logging to: $LOG_FILE"

# Build and run with logging
bun run build > /dev/null 2>&1
echo "✅ Build complete"

# Run the test and capture output
echo "🤖 Running test..."
./dist/index.js -p "$PROMPT" > "$LOG_FILE" 2>&1

# Show results
echo "📊 Test complete - results in $LOG_FILE"
echo "📄 Output preview:"
head -20 "$LOG_FILE"
echo "..."
echo "📏 Total lines: $(wc -l < "$LOG_FILE")"

# Check for common issues
echo "🔍 Issue analysis:"
if grep -q "⏺" "$LOG_FILE"; then
    echo "❌ Found isolated dots (⏺)"
    grep -n "⏺" "$LOG_FILE" | head -5
else
    echo "✅ No isolated dots found"
fi

if grep -q "ERROR\|Error\|error" "$LOG_FILE"; then
    echo "❌ Found errors"
    grep -n -i "error" "$LOG_FILE" | head -3
else
    echo "✅ No errors found"
fi

echo "🏁 Analysis complete"