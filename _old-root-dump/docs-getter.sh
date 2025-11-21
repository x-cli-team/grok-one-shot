#!/bin/bash

 

# Compatible script for older bash versions (macOS default)

 

DOCS_DIR="/tmp/all-claude-docs"

PLATFORM_DIR="$DOCS_DIR/platform"

CODE_DIR="$DOCS_DIR/claude-code"

 

# Create directories

mkdir -p "$PLATFORM_DIR"

mkdir -p "$CODE_DIR"

 

SUCCESS_COUNT=0

FAIL_COUNT=0

 

echo "🚀 Downloading ALL Claude documentation..."

echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "📚 PART 1: Claude Code CLI Docs"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""

 

# Claude Code CLI docs - simple list

CODE_DOCS="overview quickstart common-workflows mcp analytics cli-reference interactive-mode slash-commands settings troubleshooting data-usage legal-and-compliance hooks hooks-guide skills output-styles plugins github-actions claude-code-on-the-web"

 

for doc in $CODE_DOCS; do

    url="https://code.claude.com/docs/en/${doc}.md"

    output="${CODE_DIR}/${doc}.md"

 

    printf "Downloading CLI: %-30s " "${doc}.md..."

 

    if curl -f -L -s "$url" -o "$output" 2>/dev/null; then

        SIZE=$(wc -c < "$output" 2>/dev/null || echo "0")

        if [ "$SIZE" -gt 50 ]; then

            printf "✅ (%7d bytes)\n" "$SIZE"

            SUCCESS_COUNT=$((SUCCESS_COUNT + 1))

        else

            echo "❌ Too small"

            rm -f "$output"

            FAIL_COUNT=$((FAIL_COUNT + 1))

        fi

    else

        echo "❌ Failed"

        FAIL_COUNT=$((FAIL_COUNT + 1))

    fi

done

 

echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "📚 PART 2: Platform Documentation"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""

 

# Platform docs - one per line for readability

# Format: url_path|output_path|display_name

cat << 'EOF' | while IFS='|' read -r url_path output_path display_name; do

intro-to-claude|first-steps/intro.md|Intro

quickstart|first-steps/quickstart.md|Quickstart

about-claude/models/overview|models/overview.md|Models Overview

about-claude/models/choosing-a-model|models/choosing.md|Choosing Model

about-claude/models/whats-new-claude-4-5|models/whats-new.md|What's New

about-claude/models/migrating-to-claude-4-5|models/migrating.md|Migrating

about-claude/models/model-deprecations|models/deprecations.md|Deprecations

about-claude/models/pricing|models/pricing.md|Pricing

build-with-claude/overview|build/overview.md|Build Overview

build-with-claude/using-the-messages-api|build/messages-api.md|Messages API

build-with-claude/context-windows|build/context-windows.md|Context Windows

build-with-claude/prompting-best-practices|build/best-practices.md|Best Practices

build-with-claude/prompt-caching|capabilities/prompt-caching.md|Prompt Caching

build-with-claude/context-editing|capabilities/context-editing.md|Context Editing

build-with-claude/extended-thinking|capabilities/extended-thinking.md|Extended Thinking

build-with-claude/streaming-messages|capabilities/streaming.md|Streaming

build-with-claude/batch-processing|capabilities/batch.md|Batch Processing

build-with-claude/citations|capabilities/citations.md|Citations

build-with-claude/multilingual-support|capabilities/multilingual.md|Multilingual

build-with-claude/token-counting|capabilities/tokens.md|Token Counting

build-with-claude/embeddings|capabilities/embeddings.md|Embeddings

build-with-claude/vision|capabilities/vision.md|Vision

build-with-claude/pdf-support|capabilities/pdf.md|PDF Support

build-with-claude/files-api|capabilities/files-api.md|Files API

build-with-claude/search-results|capabilities/search.md|Search Results

build-with-claude/google-sheets-add-on|capabilities/sheets.md|Google Sheets

agents-and-tools/tool-use/overview|tools/overview.md|Tools Overview

agents-and-tools/tool-use/how-to-implement-tool-use|tools/implementation.md|Tool Implementation

agents-and-tools/tool-use/token-efficient-tool-use|tools/token-efficient.md|Token Efficient

agents-and-tools/tool-use/fine-grained-tool-streaming|tools/streaming.md|Tool Streaming

agents-and-tools/tool-use/bash-tool|tools/bash.md|Bash Tool

agents-and-tools/tool-use/code-execution-tool|tools/code-execution.md|Code Execution

agents-and-tools/tool-use/computer-use-tool|tools/computer-use.md|Computer Use

agents-and-tools/tool-use/text-editor-tool|tools/text-editor.md|Text Editor

agents-and-tools/tool-use/web-fetch-tool|tools/web-fetch.md|Web Fetch

agents-and-tools/tool-use/web-search-tool|tools/web-search.md|Web Search

agents-and-tools/tool-use/memory-tool|tools/memory.md|Memory Tool

agents-and-tools/agent-skills/overview|agent-skills/overview.md|Skills Overview

agents-and-tools/agent-skills/quickstart|agent-skills/quickstart.md|Skills Quickstart

agents-and-tools/agent-skills/best-practices|agent-skills/best-practices.md|Skills Best Practices

agents-and-tools/agent-skills/using-skills-with-the-api|agent-skills/api.md|Skills API

api/agent-sdk/overview|sdk/overview.md|SDK Overview

api/agent-sdk/typescript-sdk|sdk/typescript.md|TypeScript SDK

api/agent-sdk/python-sdk|sdk/python.md|Python SDK

agents-and-tools/mcp-in-the-api|mcp/api.md|MCP in API

agents-and-tools/mcp-connector|mcp/connector.md|MCP Connector

agents-and-tools/remote-mcp-servers|mcp/remote.md|Remote MCP

api/claude-on-amazon-bedrock|platforms/bedrock.md|Amazon Bedrock

api/claude-on-vertex-ai|platforms/vertex-ai.md|Vertex AI

build-with-claude/prompt-engineering/overview|prompt-engineering/overview.md|PE Overview

build-with-claude/prompt-engineering/prompt-generator|prompt-engineering/generator.md|Prompt Generator

build-with-claude/prompt-engineering/use-prompt-templates|prompt-engineering/templates.md|Templates

build-with-claude/prompt-engineering/prompt-improver|prompt-engineering/improver.md|Improver

build-with-claude/prompt-engineering/be-clear-and-direct|prompt-engineering/clear.md|Be Clear

build-with-claude/prompt-engineering/use-examples|prompt-engineering/examples.md|Use Examples

build-with-claude/prompt-engineering/let-claude-think|prompt-engineering/think.md|Let Think

build-with-claude/prompt-engineering/use-xml-tags|prompt-engineering/xml.md|XML Tags

build-with-claude/prompt-engineering/give-claude-a-role|prompt-engineering/role.md|Give Role

build-with-claude/prompt-engineering/prefill-claudes-response|prompt-engineering/prefill.md|Prefill

build-with-claude/prompt-engineering/chain-complex-prompts|prompt-engineering/chain.md|Chain Prompts

build-with-claude/prompt-engineering/long-context-tips|prompt-engineering/long-context.md|Long Context

build-with-claude/prompt-engineering/extended-thinking-tips|prompt-engineering/ext-thinking.md|Extended Thinking

test-and-evaluate/define-success|test/success.md|Define Success

test-and-evaluate/develop-test-cases|test/test-cases.md|Test Cases

test-and-evaluate/using-the-evaluation-tool|test/eval-tool.md|Eval Tool

test-and-evaluate/reducing-latency|test/latency.md|Reduce Latency

test-and-evaluate/strengthen-guardrails/reduce-hallucinations|guardrails/hallucinations.md|Hallucinations

test-and-evaluate/strengthen-guardrails/increase-output-consistency|guardrails/consistency.md|Consistency

test-and-evaluate/strengthen-guardrails/mitigate-jailbreaks|guardrails/jailbreaks.md|Jailbreaks

test-and-evaluate/strengthen-guardrails/streaming-refusals|guardrails/refusals.md|Streaming Refusals

test-and-evaluate/strengthen-guardrails/reduce-prompt-leak|guardrails/leak.md|Prompt Leak

test-and-evaluate/strengthen-guardrails/keep-claude-in-character|guardrails/character.md|Keep in Character

api/administration-api|admin/admin-api.md|Admin API

api/usage-and-cost-api|admin/usage-api.md|Usage API

api/claude-code-analytics-api|admin/analytics-api.md|Analytics API

EOF

 

    # Skip empty lines

    [ -z "$url_path" ] && continue

 

    url="https://docs.claude.com/en/docs/${url_path}"

    output="${PLATFORM_DIR}/${output_path}"

 

    # Create subdirectory

    mkdir -p "$(dirname "$output")"

 

    printf "Downloading Platform: %-30s " "${display_name}..."

 

    if curl -f -L -s "$url" -o "$output" 2>/dev/null; then

        SIZE=$(wc -c < "$output" 2>/dev/null || echo "0")

        if [ "$SIZE" -gt 50 ]; then

            printf "✅ (%7d bytes)\n" "$SIZE"

            SUCCESS_COUNT=$((SUCCESS_COUNT + 1))

        else

            echo "❌ Too small"

            rm -f "$output"

            FAIL_COUNT=$((FAIL_COUNT + 1))

        fi

    else

        echo "❌ Failed"

        rm -f "$output"

        FAIL_COUNT=$((FAIL_COUNT + 1))

    fi

done

 

echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "📊 SUMMARY"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""

echo "   ✅ Success: $SUCCESS_COUNT files"

echo "   ❌ Failed: $FAIL_COUNT files"

echo ""

 

if [ $SUCCESS_COUNT -gt 0 ]; then

    ZIP_FILE="/tmp/all-claude-docs.zip"

    echo "📦 Creating zip file..."

    cd /tmp

    zip -q -r "$ZIP_FILE" all-claude-docs/

 

    ZIP_SIZE=$(du -h "$ZIP_FILE" | cut -f1)

    echo "✅ Created: $ZIP_FILE ($ZIP_SIZE)"

    echo ""

    echo "📁 To use: cp /tmp/all-claude-docs.zip /home/user/grok-one-shot/"

    echo ""

else

    echo "❌ No files downloaded"

    exit 1

fi