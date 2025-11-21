#!/bin/bash

# Minimal Tool Code Validation for Husky Pre-commit
# Focuses on critical tool integrity checks only

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

validate_tool_exists() {
    local tool_file="$1"
    local tool_name="$2"
    
    if [ ! -f "$tool_file" ]; then
        FAILED_TESTS+=("$tool_name - File missing")
        return 1
    fi
    
    # Check for class and export
    if grep -q "class.*$tool_name" "$tool_file" && grep -q "export.*$tool_name" "$tool_file"; then
        return 0
    else
        FAILED_TESTS+=("$tool_name - Structure broken")
        return 1
    fi
}

[ "$SILENT" != "true" ] && echo "🔧 Validating tool code integrity..."

# Core Tools
validate_tool_exists "src/tools/bash.ts" "BashTool"
validate_tool_exists "src/tools/text-editor.ts" "TextEditorTool"
validate_tool_exists "src/tools/search.ts" "SearchTool"
validate_tool_exists "src/tools/todo-tool.ts" "TodoTool"
validate_tool_exists "src/tools/confirmation-tool.ts" "ConfirmationTool"

# Advanced Tools (critical ones)
validate_tool_exists "src/tools/advanced/multi-file-editor.ts" "MultiFileEditorTool"
validate_tool_exists "src/tools/advanced/advanced-search.ts" "AdvancedSearchTool"

# Intelligence Tools (most critical)
validate_tool_exists "src/tools/intelligence/ast-parser.ts" "ASTParserTool"
validate_tool_exists "src/tools/intelligence/symbol-search.ts" "SymbolSearchTool"

# Critical integration points
test_silent "Tool exports in index.ts" "grep -q 'export.*BashTool.*from' src/tools/index.ts"
test_silent "GrokAgent imports tools" "grep -q 'BashTool' src/agent/grok-agent.ts"
test_silent "Tool API registrations" "grep -q 'name.*view_file' src/grok/tools.ts"

if [ ${#FAILED_TESTS[@]} -gt 0 ]; then
    [ "$SILENT" != "true" ] && echo ""
    [ "$SILENT" != "true" ] && echo "❌ Critical tool issues detected:"
    for test in "${FAILED_TESTS[@]}"; do
        [ "$SILENT" != "true" ] && echo "   • $test"
    done
    [ "$SILENT" != "true" ] && echo ""
    [ "$SILENT" != "true" ] && echo "🚫 This indicates accidental changes to core tool files"
    exit 1
else
    [ "$SILENT" != "true" ] && echo "✅ All critical tools validated successfully"
    exit 0
fi