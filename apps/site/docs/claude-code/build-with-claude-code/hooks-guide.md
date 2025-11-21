# Get Started with Hooks

> **⚠️ PARITY GAP**: Grok One-Shot does not currently implement the hooks system described in this document. This is a Claude Code feature planned for future implementation.

## What Are Hooks?

Hooks are user-defined shell commands that execute at various points in your AI CLI tool's lifecycle. They provide deterministic control over behavior, ensuring certain actions always happen rather than relying on the LLM to choose to run them.

## Status in Grok One-Shot

**Current Status:** Not Implemented

**What Hooks Enable (in Claude Code):**

- **Notifications**: Desktop alerts when AI needs input or permission
- **Automatic formatting**: Run `prettier` on `.ts` files, `gofmt` on `.go` files after every edit
- **Logging**: Track and count all executed commands for compliance or debugging
- **Feedback**: Provide automated feedback when AI produces code that doesn't follow conventions
- **Custom permissions**: Block modifications to production files or sensitive directories

## Alternative Approaches in Grok One-Shot

Since hooks aren't available yet, you can achieve similar outcomes through:

### 1. Explicit Instructions in GROK.md

Add formatting and quality requirements to your project's `GROK.md` file:

```markdown
# Project Guidelines

## Code Quality

After modifying any TypeScript files, always run:

- `prettier --write <file>`
- `eslint --fix <file>`

## Restricted Files

Never modify these files without explicit approval:

- `.env`
- `package-lock.json`
- `yarn.lock`
- Files in `.git/`
```

### 2. Git Pre-commit Hooks

Use standard Git hooks for code quality automation:

```bash
# .git/hooks/pre-commit
#!/bin/bash

# Format staged files
npx prettier --write $(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|js|tsx|jsx)$')

# Run linter
npm run lint-staged
```

### 3. Shell Script Wrappers

Wrap `grok` commands with custom automation:

```bash
#!/bin/bash
# dev-with-checks.sh

# Run Grok One-Shot
grok "$@"

# Post-session cleanup
echo "Running post-session checks..."
npm run format
npm run lint
git add -u
```

### 4. CI/CD Integration

Add automated checks in your CI/CD pipeline:

```yaml
# .github/workflows/code-quality.yml
name: Code Quality
on: [push, pull_request]
jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run formatter
        run: npm run format:check
      - name: Run linter
        run: npm run lint
```

### 5. MCP Servers for Custom Tools

Use MCP (Model Context Protocol) to add custom tools to Grok One-Shot:

```bash
# Add an MCP server that provides formatting tools
grok mcp add formatter "npx -y @modelcontextprotocol/server-formatter"
```

Then ask Grok One-Shot to use the formatting tools when needed.

## When Hooks Are Implemented

Future hook events that would likely be supported:

- **PreToolUse**: Before tool calls (can block them)
- **PostToolUse**: After tool calls complete
- **UserPromptSubmit**: When user submits a prompt
- **Notification**: When notifications are sent
- **SessionStart**: When session starts
- **SessionEnd**: When session ends

Example configuration (future):

```json
// ~/.grok/settings.json (future)
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "npx prettier --write \"$FILE_PATH\""
          }
        ]
      }
    ]
  }
}
```

## See Also

- [Hooks Reference](./hooks.md) - Detailed feature documentation
- [MCP Integration](./mcp.md) - Current extensibility mechanism
- [Settings Reference](../configuration/settings.md) - Current configuration options
- [GROK.md Guide](../../getting-started/overview.md#project-context-grokmd) - Project-level instructions

---

**Want this feature?** Consider:

- Opening a feature request in the Grok One-Shot repository
- Using Git hooks and CI/CD as interim solutions
- Exploring MCP servers for custom tool integration

**Last Updated:** 2025-11-07
