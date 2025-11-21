---
title: Get Started with Grok One-Shot Hooks
---

# Get Started with Grok One-Shot Hooks

> ** PARITY GAP**: Grok One-Shot does not currently implement the hooks system described in this document. This is a comprehensive Claude Code feature planned for future implementation.

## Status in Grok One-Shot

**Current Status:** Not Implemented
**Planned:** Q2 2026 (Sprint 18-20)
**Priority:** P2 - Workflow automation

**What This Feature Would Enable:**

- Deterministic control over Grok's behavior
- Automatic code formatting after edits
- Custom notification workflows
- Permission management and file protection
- Session lifecycle automation
- Integration with external tools

**Alternative Approaches:** Until hooks are implemented:

1. Use Git hooks for pre-commit automation
2. Create shell scripts in your repository
3. Document workflows in `.agent/docs/`
4. Use MCP servers for external integrations
5. Implement manual workflow checks

---

> Learn how to customize and extend Grok One-Shot's behavior by registering shell commands

Grok One-Shot hooks would be user-defined shell commands that execute at various points
in Grok One-Shot's lifecycle. Hooks would provide deterministic control over Grok
One-Shot's behavior, ensuring certain actions always happen rather than relying on
the LLM to choose to run them.

<Tip>
For reference documentation on hooks, see [Hooks reference](/en/hooks).
</Tip>

Example use cases for hooks would include:

- **Notifications**: Customize how you get notified when Grok One-Shot is awaiting
  your input or permission to run something.
- **Automatic formatting**: Run `prettier` on .ts files, `gofmt` on .go files,
  etc. after every file edit.
- **Logging**: Track and count all executed commands for compliance or
  debugging.
- **Feedback**: Provide automated feedback when Grok One-Shot produces code that
  does not follow your codebase conventions.
- **Custom permissions**: Block modifications to production files or sensitive
  directories.

By encoding these rules as hooks rather than prompting instructions, you turn
suggestions into app-level code that executes every time it is expected to run.

<Warning>
You must consider the security implication of hooks as you add them, because hooks run automatically during the agent loop with your current environment's credentials.
For example, malicious hooks code can exfiltrate your data. Always review your hooks implementation before registering them.

For full security best practices, see [Security Considerations](/en/hooks#security-considerations) in the hooks reference documentation.
</Warning>

## Hook Events Overview

Grok One-Shot would provide several hook events that run at different points in the
workflow:

- **PreToolUse**: Runs before tool calls (can block them)
- **PostToolUse**: Runs after tool calls complete
- **UserPromptSubmit**: Runs when the user submits a prompt, before Grok processes it
- **Notification**: Runs when Grok One-Shot sends notifications
- **Stop**: Runs when Grok One-Shot finishes responding
- **SubagentStop**: Runs when subagent tasks complete
- **PreCompact**: Runs before Grok One-Shot is about to run a compact operation
- **SessionStart**: Runs when Grok One-Shot starts a new session or resumes an existing session
- **SessionEnd**: Runs when Grok One-Shot session ends

Each event receives different data and can control Grok's behavior in
different ways.

## Quickstart

In this quickstart, you'll add a hook that logs the shell commands that Grok
One-Shot runs.

### Prerequisites

Install `jq` for JSON processing in the command line.

### Step 1: Open hooks configuration

Run the `/hooks` [slash command](/en/slash-commands) and select
the `PreToolUse` hook event.

`PreToolUse` hooks run before tool calls and can block them while providing
Grok feedback on what to do differently.

### Step 2: Add a matcher

Select `+ Add new matcher…` to run your hook only on Bash tool calls.

Type `Bash` for the matcher.

<Note>You can use `*` to match all tools.</Note>

### Step 3: Add the hook

Select `+ Add new hook…` and enter this command:

```bash theme={null}
jq -r '"\(.tool_input.command) - \(.tool_input.description // "No description")"' >> ~/.grok/bash-command-log.txt
```

### Step 4: Save your configuration

For storage location, select `User settings` since you're logging to your home
directory. This hook will then apply to all projects, not just your current
project.

Then press Esc until you return to the REPL. Your hook is now registered!

### Step 5: Verify your hook

Run `/hooks` again or check `~/.grok/settings.json` to see your configuration:

```json theme={null}
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '\"\\(.tool_input.command) - \\(.tool_input.description // \"No description\")\"' >> ~/.grok/bash-command-log.txt"
          }
        ]
      }
    ]
  }
}
```

### Step 6: Test your hook

Ask Grok to run a simple command like `ls` and check your log file:

```bash theme={null}
cat ~/.grok/bash-command-log.txt
```

You should see entries like:

```
ls - Lists files and directories
```

## More Examples

<Note>
For a complete example implementation, see the [bash command validator example](https://github.com/anthropics/claude-code/blob/main/examples/hooks/bash_command_validator_example.py) in our public codebase (Claude Code reference).
</Note>

### Code Formatting Hook

Automatically format TypeScript files after editing:

````json theme={null}
{
"hooks": {
"PostToolUse": [
{
"matcher": "Edit|Write",
"hooks": [
{
"type": "command",
"command": "jq -r '.tool_input.file_path' | { read file_path; if echo \"$file_path\" | grep -q '\\.ts

### Markdown Formatting Hook

Automatically fix missing language tags and formatting issues in markdown files:

```json theme={null}
{
"hooks": {
"PostToolUse": [
{
"matcher": "Edit|Write",
"hooks": [
{
"type": "command",
"command": "\"$GROK_PROJECT_DIR\"/.grok/hooks/markdown_formatter.py"
}
]
}
]
}
}
````

Create `.grok/hooks/markdown_formatter.py` with this content:

````python theme={null}
#!/usr/bin/env python3
"""
Markdown formatter for Grok One-Shot output.
Fixes missing language tags and spacing issues while preserving code content.
"""
import json
import sys
import re
import os

def detect_language(code):
"""Best-effort language detection from code content."""
s = code.strip()

# JSON detection
if re.search(r'^\s*[{\[]', s):
try:
json.loads(s)
return 'json'
except:
pass

# Python detection
if re.search(r'^\s*def\s+\w+\s*\(', s, re.M) or \
re.search(r'^\s*(import|from)\s+\w+', s, re.M):
return 'python'

# JavaScript detection
if re.search(r'\b(function\s+\w+\s*\(|const\s+\w+\s*=)', s) or \
re.search(r'=>|console\.(log|error)', s):
return 'javascript'

# Bash detection
if re.search(r'^#!.*\b(bash|sh)\b', s, re.M) or \
re.search(r'\b(if|then|fi|for|in|do|done)\b', s):
return 'bash'

# SQL detection
if re.search(r'\b(SELECT|INSERT|UPDATE|DELETE|CREATE)\s+', s, re.I):
return 'sql'

return 'text'

def format_markdown(content):
"""Format markdown content with language detection."""
# Fix unlabeled code fences
def add_lang_to_fence(match):
indent, info, body, closing = match.groups()
if not info.strip():
lang = detect_language(body)
return f"{indent}```\{lang\}\n\{body\}\{closing\}\n"
return match.group(0)

fence_pattern = r'(?ms)^([ \t]\{0,3\})```([^\n]*)\n(.*?)(\n\1```)\s*$'
content = re.sub(fence_pattern, add_lang_to_fence, content)

# Fix excessive blank lines (only outside code fences)
content = re.sub(r'\n\{3,\}', '\n\n', content)

return content.rstrip() + '\n'

# Main execution
try:
input_data = json.load(sys.stdin)
file_path = input_data.get('tool_input', {}).get('file_path', '')

if not file_path.endswith(('.md', '.mdx')):
sys.exit(0) # Not a markdown file

if os.path.exists(file_path):
with open(file_path, 'r', encoding='utf-8') as f:
content = f.read()

formatted = format_markdown(content)

if formatted != content:
with open(file_path, 'w', encoding='utf-8') as f:
f.write(formatted)
print(f" Fixed markdown formatting in \{file_path\}")

except Exception as e:
print(f"Error formatting markdown: \{e\}", file=sys.stderr)
sys.exit(1)
````

Make the script executable:

```bash theme={null}
chmod +x .grok/hooks/markdown_formatter.py
```

This hook automatically:

- Detects programming languages in unlabeled code blocks
- Adds appropriate language tags for syntax highlighting
- Fixes excessive blank lines while preserving code content
- Only processes markdown files (`.md`, `.mdx`)

### Custom Notification Hook

Get desktop notifications when Grok needs input:

```json theme={null}
\{
"hooks": {
"Notification": [
{
"matcher": "",
"hooks": [
{
"type": "command",
"command": "notify-send 'Grok One-Shot' 'Awaiting your input'"
\}
]
}
]
}
}
```

### File Protection Hook

Block edits to sensitive files:

```json theme={null}
\{
"hooks": {
"PreToolUse": [
{
"matcher": "Edit|Write",
"hooks": [
{
"type": "command",
"command": "python3 -c \"import json, sys; data=json.load(sys.stdin); path=data.get('tool_input',{\}).get('file_path',''); sys.exit(2 if any(p in path for p in ['.env', 'package-lock.json', '.git/']) else 0)\""
}
]
}
]
}
}
```

## Alternative Approaches (Current Implementation)

Since hooks are not yet implemented, here are alternatives:

### 1. Git Hooks for Automation

Use Git's built-in hook system for file validation and formatting:

```bash
# .git/hooks/pre-commit
#!/bin/bash

# Format TypeScript files
git diff --cached --name-only --diff-filter=ACM | grep '\.ts$' | xargs npx prettier --write

# Format markdown files
git diff --cached --name-only --diff-filter=ACM | grep '\.md$' | xargs npx markdownlint --fix

# Re-add formatted files
git diff --cached --name-only --diff-filter=ACM | xargs git add
```

Make it executable:

```bash
chmod +x .git/hooks/pre-commit
```

### 2. Repository Scripts

Create workflow scripts in your repository:

```bash
# scripts/format-code.sh
#!/bin/bash
# Format all code files

echo "Formatting TypeScript files..."
npx prettier --write "**/*.ts"

echo "Formatting markdown files..."
npx markdownlint --fix "**/*.md"

echo "Done!"
```

Reference in your GROK.md:

```markdown
# Development Workflows

## Code Formatting

Run `scripts/format-code.sh` to format all code files.
Ask me to run this after making changes.
```

### 3. Document Workflows

Document expected workflows in `.agent/docs/`:

```markdown
# .agent/docs/workflows/code-quality.md

# Code Quality Workflows

## Before Committing

1. Run TypeScript formatter: `npx prettier --write **/*.ts`
2. Run linter: `npm run lint`
3. Run tests: `npm test`
4. Check security: `npm audit`

## During Review

1. Check for TODOs: `grep -r "TODO" src/`
2. Verify documentation: Check that new features have docs
3. Test manually: Run the application and test changes
```

Then in GROK.md:

```markdown
# Code Quality

See `.agent/docs/workflows/code-quality.md` for code quality checklist.
Ask me to verify these before commits.
```

### 4. MCP Server Integration

Use MCP servers for external tool integration:

```bash
# Add a custom MCP server for workflow automation
grok mcp add workflow-checker "node ./mcp-servers/workflow/index.js"
```

The MCP server can provide tools that Grok uses when needed:

- `check_file_format` - Validate file formatting
- `run_security_scan` - Run security checks
- `validate_tests` - Ensure tests pass

### 5. Manual Prompting

Include workflow instructions in your prompts:

```
After editing TypeScript files, run prettier to format them.
After editing markdown, check for broken links.
Before committing, run the test suite.
```

Or in GROK.md:

```markdown
# Development Rules

## Automatic Actions

After editing any file:

1. Format with appropriate formatter (prettier for .ts, markdownlint for .md)
2. Run linter if applicable
3. Verify tests still pass

Before any commit:

1. Run full test suite
2. Check for console.log statements
3. Verify no TODOs remain
```

## When Hooks Are Implemented

Future hook system improvements might include:

### Visual Hook Management UI

```
/hooks
┌─────────────────────────────────────┐
│ Hook Configuration │
├─────────────────────────────────────┤
│ Event: PostToolUse │
│ Matcher: Edit|Write │
│ Command: ./format.sh │
│ Status: Active │
├─────────────────────────────────────┤
│ [Add Hook] [Edit] [Remove] [Test] │
└─────────────────────────────────────┘
```

### Hook Templates

```bash
# Install pre-configured hook templates
grok hooks install prettier-format
grok hooks install eslint-check
grok hooks install test-runner
```

### Hook Marketplace

```bash
# Browse available hooks
grok hooks browse

# Install community hooks
grok hooks install @community/typescript-formatter
```

## Learn More

- For reference documentation on hooks, see [Hooks reference](/en/hooks).
- For comprehensive security best practices and safety guidelines, see [Security Considerations](/en/hooks#security-considerations) in the hooks reference documentation.
- For troubleshooting steps and debugging techniques, see [Debugging](/en/hooks#debugging) in the hooks reference
  documentation.

## See Also

- [Hooks Reference](./hooks.md) - Complete hooks documentation
- [Plugin System](../features/plugin-system.md) - Plugin system overview
- [MCP Integration](../build-with-claude-code/mcp.md) - Current extensibility
- [Settings](../configuration/settings.md) - Configuration files

---

**Status:** This feature is planned but not yet implemented in Grok One-Shot.
**Last Updated:** 2025-11-07
; then npx prettier --write \"$file_path\"; fi; }"
}
]
}
]
}
}

```

### Markdown Formatting Hook

Automatically fix missing language tags and formatting issues in markdown files:

__CODE_BLOCK_20__

Create __CODE_BLOCK_21__ with this content:

__CODE_BLOCK_22__\{lang\}\n\{body\}\{closing\}\n"
return match.group(0)

fence_pattern = r'(?ms)^([ \t]\{0,3\})__CODE_BLOCK_23__)\s*$'
content = re.sub(fence_pattern, add_lang_to_fence, content)

# Fix excessive blank lines (only outside code fences)
content = re.sub(r'\n\{3,\}', '\n\n', content)

return content.rstrip() + '\n'

# Main execution
try:
input_data = json.load(sys.stdin)
file_path = input_data.get('tool_input', {}).get('file_path', '')

if not file_path.endswith(('.md', '.mdx')):
sys.exit(0) # Not a markdown file

if os.path.exists(file_path):
with open(file_path, 'r', encoding='utf-8') as f:
content = f.read()

formatted = format_markdown(content)

if formatted != content:
with open(file_path, 'w', encoding='utf-8') as f:
f.write(formatted)
print(f" Fixed markdown formatting in \{file_path\}")

except Exception as e:
print(f"Error formatting markdown: \{e\}", file=sys.stderr)
sys.exit(1)
__CODE_BLOCK_24__bash theme=\{null\}
chmod +x .grok/hooks/markdown_formatter.py
__CODE_BLOCK_25__json theme=\{null\}
\{
"hooks": {
"Notification": [
{
"matcher": "",
"hooks": [
{
"type": "command",
"command": "notify-send 'Grok One-Shot' 'Awaiting your input'"
\}
]
}
]
}
}
__CODE_BLOCK_26__json theme=\{null\}
\{
"hooks": {
"PreToolUse": [
{
"matcher": "Edit|Write",
"hooks": [
{
"type": "command",
"command": "python3 -c \"import json, sys; data=json.load(sys.stdin); path=data.get('tool_input',{\}).get('file_path',''); sys.exit(2 if any(p in path for p in ['.env', 'package-lock.json', '.git/']) else 0)\""
}
]
}
]
}
}
__CODE_BLOCK_27__bash
# .git/hooks/pre-commit
#!/bin/bash

# Format TypeScript files
git diff --cached --name-only --diff-filter=ACM | grep '\.ts$' | xargs npx prettier --write

# Format markdown files
git diff --cached --name-only --diff-filter=ACM | grep '\.md$' | xargs npx markdownlint --fix

# Re-add formatted files
git diff --cached --name-only --diff-filter=ACM | xargs git add
__CODE_BLOCK_28__bash
chmod +x .git/hooks/pre-commit
__CODE_BLOCK_29__bash
# scripts/format-code.sh
#!/bin/bash
# Format all code files

echo "Formatting TypeScript files..."
npx prettier --write "**/*.ts"

echo "Formatting markdown files..."
npx markdownlint --fix "**/*.md"

echo "Done!"
__CODE_BLOCK_30__markdown
# Development Workflows

## Code Formatting

Run __CODE_BLOCK_31__ to format all code files.
Ask me to run this after making changes.
__CODE_BLOCK_32__markdown
# .agent/docs/workflows/code-quality.md

# Code Quality Workflows

## Before Committing

1. Run TypeScript formatter: __CODE_BLOCK_33__
2. Run linter: __CODE_BLOCK_34__
3. Run tests: __CODE_BLOCK_35__
4. Check security: __CODE_BLOCK_36__

## During Review

1. Check for TODOs: __CODE_BLOCK_37__
2. Verify documentation: Check that new features have docs
3. Test manually: Run the application and test changes
__CODE_BLOCK_38__markdown
# Code Quality

See __CODE_BLOCK_39__ for code quality checklist.
Ask me to verify these before commits.
__CODE_BLOCK_40__bash
# Add a custom MCP server for workflow automation
grok mcp add workflow-checker "node ./mcp-servers/workflow/index.js"
__CODE_BLOCK_41__
After editing TypeScript files, run prettier to format them.
After editing markdown, check for broken links.
Before committing, run the test suite.
__CODE_BLOCK_42__markdown
# Development Rules

## Automatic Actions

After editing any file:

1. Format with appropriate formatter (prettier for .ts, markdownlint for .md)
2. Run linter if applicable
3. Verify tests still pass

Before any commit:

1. Run full test suite
2. Check for console.log statements
3. Verify no TODOs remain
__CODE_BLOCK_43__
/hooks
┌─────────────────────────────────────┐
│ Hook Configuration │
├─────────────────────────────────────┤
│ Event: PostToolUse │
│ Matcher: Edit|Write │
│ Command: ./format.sh │
│ Status: Active │
├─────────────────────────────────────┤
│ [Add Hook] [Edit] [Remove] [Test] │
└─────────────────────────────────────┘
__CODE_BLOCK_44__bash
# Install pre-configured hook templates
grok hooks install prettier-format
grok hooks install eslint-check
grok hooks install test-runner
__CODE_BLOCK_45__bash
# Browse available hooks
grok hooks browse

# Install community hooks
grok hooks install @community/typescript-formatter
```

## Learn More

- For reference documentation on hooks, see [Hooks reference](/en/hooks).
- For comprehensive security best practices and safety guidelines, see [Security Considerations](/en/hooks#security-considerations) in the hooks reference documentation.
- For troubleshooting steps and debugging techniques, see [Debugging](/en/hooks#debugging) in the hooks reference
  documentation.

## See Also

- [Hooks Reference](./hooks.md) - Complete hooks documentation
- [Plugin System](../features/plugin-system.md) - Plugin system overview
- [MCP Integration](../build-with-claude-code/mcp.md) - Current extensibility
- [Settings](../configuration/settings.md) - Configuration files

---

**Status:** This feature is planned but not yet implemented in Grok One-Shot.
**Last Updated:** 2025-11-07
