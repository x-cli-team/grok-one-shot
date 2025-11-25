#!/bin/bash

# Core Features Test Suite for Husky Pre-commit Hook
# Focused on build-time validation to prevent commit-breaking issues

set -e  # Exit on any error

# Silent mode for husky - minimal output
SILENT=${1:-false}

if [ "$SILENT" != "true" ]; then
    echo "🧪 Running Core Features Validation..."
fi

FAILED_TESTS=()

# Helper function for silent testing
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

# Essential build-time tests only
test_silent "TypeScript compilation" "npm run typecheck"
test_silent "Production build" "npm run build"
test_silent "Build artifacts exist" "[ -f dist/index.js ] && [ -f dist/index.d.ts ]"
test_silent "Package.json valid" "node -e \"require('./package.json')\""
test_silent "Essential dependencies in package.json" "grep -q commander package.json && grep -q \"@modelcontextprotocol/sdk\" package.json && grep -q react package.json && grep -q ink package.json"
test_silent "Documentation files exist" "[ -f GROK.md ] && [ -f docs-index.md ]"
test_silent "Core source files exist" "[ -f src/index.ts ] && [ -f src/agent/grok-agent.ts ] && [ -f src/utils/settings-manager.ts ]"
test_silent "ESLint passes" "npm run lint"

# In CI environments, also test CLI basic functionality with test API key
if [ -n "$CI" ] || [ -n "$GITHUB_ACTIONS" ]; then
    # Set test API key for CI validation
    export GROK_API_KEY="${X_API_KEY:-test-key-for-validation-only}"
    
    # Extra check: ensure dist files exist in CI
    if [ ! -f "dist/index.js" ]; then
        [ "$SILENT" != "true" ] && echo "❌ dist/index.js missing in CI environment"
        FAILED_TESTS+=("dist/index.js missing in CI environment")
    fi
    
    test_silent "CLI version display (CI)" "node dist/index.js --version"
    test_silent "CLI help display (CI)" "node dist/index.js --help"
fi

# Results
if [ ${#FAILED_TESTS[@]} -gt 0 ]; then
    if [ "$SILENT" != "true" ]; then
        echo ""
        echo "❌ Failed core feature tests:"
        for test in "${FAILED_TESTS[@]}"; do
            echo "   - $test"
        done
    fi
    exit 1
else
    [ "$SILENT" != "true" ] && echo "✅ All core features validated successfully"
    exit 0
fi