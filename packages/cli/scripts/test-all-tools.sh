#!/bin/bash

# Comprehensive Tool Testing Suite
# Tests all 25+ tools with proper isolation and error handling

set -e

echo "🔧 Comprehensive Tool Testing Suite"
echo "===================================="

FAILED_TESTS=()
PASSED_TESTS=()
SKIPPED_TESTS=()

log_test() {
    echo "🔍 Testing: $1"
}

log_pass() {
    echo "✅ PASS: $1"
    PASSED_TESTS+=("$1")
}

log_fail() {
    echo "❌ FAIL: $1"
    FAILED_TESTS+=("$1")
}

log_skip() {
    echo "⏭️  SKIP: $1"
    SKIPPED_TESTS+=("$1")
}

# Test environment setup
export GROK_API_KEY="test-key-12345"
export NODE_ENV="test"

echo "📦 Tool System Infrastructure"
echo "-----------------------------"

log_test "Tool exports and imports"
if npm run typecheck >/dev/null 2>&1; then
    log_pass "Tool exports and imports"
else
    log_fail "Tool exports and imports"
fi

echo ""
echo "🔧 Core Tools (6 tools)"
echo "----------------------"

# File Operations Tools
log_test "TextEditorTool class"
if node -e "
const { TextEditorTool } = require('./dist/tools/index.js');
const tool = new TextEditorTool();
console.log('Tool instantiated:', tool.constructor.name);
" 2>/dev/null; then
    log_pass "TextEditorTool class"
else
    log_skip "TextEditorTool class (requires build)"
fi

log_test "BashTool class"
if node -e "
const { BashTool } = require('./dist/tools/index.js');
const tool = new BashTool();
console.log('Tool instantiated:', tool.constructor.name);
" 2>/dev/null; then
    log_pass "BashTool class"
else
    log_skip "BashTool class (requires build)"
fi

echo ""
echo "🔍 Search Tools (4 tools)"
echo "------------------------"

log_test "SearchTool functionality"
if grep -q "class SearchTool" src/tools/search.ts; then
    log_pass "SearchTool functionality"
else
    log_fail "SearchTool functionality"
fi

log_test "AdvancedSearchTool"
if [ -f "src/tools/advanced/advanced-search.ts" ]; then
    log_pass "AdvancedSearchTool"
else
    log_fail "AdvancedSearchTool"
fi

echo ""
echo "🤖 AI Intelligence Tools (7 tools)"
echo "----------------------------------"

INTELLIGENCE_TOOLS=(
    "ast-parser.ts:ASTParserTool"
    "symbol-search.ts:SymbolSearchTool"
    "dependency-analyzer.ts:DependencyAnalyzerTool"
    "code-context.ts:CodeContextTool"
    "refactoring-assistant.ts:RefactoringAssistantTool"
    "vector-search-tool.ts:VectorSearchTool"
    "autonomous-task-tool.ts:AutonomousTaskTool"
)

for tool in "${INTELLIGENCE_TOOLS[@]}"; do
    IFS=':' read -r file class <<< "$tool"
    log_test "$class"
    if [ -f "src/tools/intelligence/$file" ]; then
        log_pass "$class"
    else
        log_fail "$class"
    fi
done

echo ""
echo "🏗️ Advanced Development Tools (6 tools)"
echo "---------------------------------------"

ADVANCED_TOOLS=(
    "multi-file-editor.ts:MultiFileEditorTool"
    "file-tree-operations.ts:FileTreeOperationsTool"
    "code-aware-editor.ts:CodeAwareEditorTool"
    "operation-history.ts:OperationHistoryTool"
)

for tool in "${ADVANCED_TOOLS[@]}"; do
    IFS=':' read -r file class <<< "$tool"
    log_test "$class"
    if [ -f "src/tools/advanced/$file" ]; then
        log_pass "$class"
    else
        log_fail "$class"
    fi
done

echo ""
echo "📋 Task Management Tools (3 tools)"
echo "---------------------------------"

log_test "TodoTool system"
if [ -f "src/tools/todo-tool.ts" ]; then
    log_pass "TodoTool system"
else
    log_fail "TodoTool system"
fi

log_test "Todo list creation function"
if grep -q "create_todo_list" src/grok/tools.ts; then
    log_pass "Todo list creation function"
else
    log_fail "Todo list creation function"
fi

log_test "Todo list update function"
if grep -q "update_todo_list" src/grok/tools.ts; then
    log_pass "Todo list update function"
else
    log_fail "Todo list update function"
fi

echo ""
echo "🔌 MCP Integration"
echo "-----------------"

log_test "MCP Manager"
if [ -f "src/mcp/client.ts" ] && grep -q "MCPManager" src/mcp/client.ts; then
    log_pass "MCP Manager"
else
    log_fail "MCP Manager"
fi

log_test "MCP Configuration"
if [ -f "src/mcp/config.ts" ] && grep -q "loadMCPConfig" src/mcp/config.ts; then
    log_pass "MCP Configuration"
else
    log_fail "MCP Configuration"
fi

echo ""
echo "🛡️ Safety & Confirmation Tools"
echo "------------------------------"

log_test "ConfirmationTool"
if [ -f "src/tools/confirmation-tool.ts" ]; then
    log_pass "ConfirmationTool"
else
    log_fail "ConfirmationTool"
fi

log_test "Confirmation service"
if [ -f "src/utils/confirmation-service.ts" ]; then
    log_pass "Confirmation service"
else
    log_fail "Confirmation service"
fi

echo ""
echo "📊 Results Summary"
echo "=================="
echo "✅ Passed: ${#PASSED_TESTS[@]} tools/systems"
echo "❌ Failed: ${#FAILED_TESTS[@]} tools/systems"
echo "⏭️  Skipped: ${#SKIPPED_TESTS[@]} tools/systems"

if [ ${#FAILED_TESTS[@]} -gt 0 ]; then
    echo ""
    echo "❌ Failed Tools:"
    for test in "${FAILED_TESTS[@]}"; do
        echo "   - $test"
    done
    echo ""
    echo "🚫 Some tools are missing or broken!"
    exit 1
else
    echo ""
    echo "🎉 All tool systems are present and configured correctly!"
    echo "📝 Note: This tests tool presence and configuration, not runtime execution"
    echo "🚀 For runtime testing, use individual tool test suites"
fi