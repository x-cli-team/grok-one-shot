#!/bin/bash

# Quick Tool System Validation for Husky Pre-commit
# Tests tool registration and basic instantiation without execution

set -e

SILENT=${1:-false}
FAILED_TESTS=()

test_silent() {
    local test_name="$1"
    local test_command="$2"
    
    if eval "$test_command" >/dev/null 2>&1; then
        [ "$SILENT" != "true" ] && echo "✅ $test_name"
        return 0
    else
        [ "$SILENT" != "true" ] && echo "❌ $test_name"
        FAILED_TESTS+=("$test_name")
        return 1
    fi
}

# Test tool system integrity
test_silent "Tool exports exist" "grep -q 'export.*Tool' src/tools/index.ts"
test_silent "GrokAgent imports tools" "grep -q 'TextEditorTool' src/agent/grok-agent.ts"
test_silent "Tool registration system" "grep -q 'getAllGrokTools' src/grok/tools.ts"
test_silent "MCP manager exists" "grep -q 'MCPManager' src/mcp/client.ts"
test_silent "Tool interface types" "grep -q 'ToolResult' src/types/index.ts"

# Test critical tool files exist
CORE_TOOLS=(
    "bash.ts"
    "text-editor.ts" 
    "search.ts"
    "todo-tool.ts"
    "confirmation-tool.ts"
)

for tool in "${CORE_TOOLS[@]}"; do
    test_silent "Core tool: $tool" "[ -f src/tools/$tool ]"
done

# Test advanced tool directories
test_silent "Advanced tools directory" "[ -d src/tools/advanced ]"
test_silent "Intelligence tools directory" "[ -d src/tools/intelligence ]"
test_silent "Documentation tools directory" "[ -d src/tools/documentation ]"

# Test tool compilation (quick syntax check) - already covered in main build
test_silent "Tool index structure" "grep -q 'export.*Tool.*from' src/tools/index.ts"

# Results
if [ ${#FAILED_TESTS[@]} -gt 0 ]; then
    [ "$SILENT" != "true" ] && echo "❌ Tool system validation failed: ${#FAILED_TESTS[@]} issues"
    exit 1
else
    [ "$SILENT" != "true" ] && echo "✅ Tool system validated (${#CORE_TOOLS[@]} core tools + advanced systems)"
    exit 0
fi