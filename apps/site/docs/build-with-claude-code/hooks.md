---
title: Hooks Reference
---

# Hooks Reference

> ** PARITY GAP**: Grok One-Shot does not currently implement the hooks system described in this document. This is a comprehensive feature from Claude Code that is planned for future implementation.

## What Are Hooks (Claude Code Feature)

Claude Code hooks are user-defined shell commands that execute at various points in Claude Code's lifecycle. Hooks provide deterministic control over behavior, ensuring certain actions always happen rather than relying on the LLM to choose to run them.

## Status in Grok One-Shot

**Current Status:** Not Implemented

**Why This Matters:** Hooks are a powerful automation feature that allow you to:

- Automatically format code after edits (e.g., run `prettier` on TypeScript files)
- Block modifications to sensitive files
- Send desktop notifications when input is needed
- Validate commands before execution
- Inject context into sessions
- Customize workflows without prompting

**Current Workarounds in Grok One-Shot:**

1. **Manual Commands**: You can ask Grok One-Shot to run formatting commands explicitly

```
> format the files you just edited with prettier
```

2. **Pre-commit Hooks**: Use Git pre-commit hooks independently for code quality

```bash
# .git/hooks/pre-commit
npx prettier --write .
```

3. **Shell Scripts**: Wrap `grok` commands in shell scripts for automation

```bash
#!/bin/bash
grok -p "review code" && npm run format
```

## Future Implementation

When hooks are implemented in Grok One-Shot, they would likely:

- Use `~/.grok/settings.json` or `.grok/settings.json` for configuration
- Support similar hook events (PreToolUse, PostToolUse, SessionStart, etc.)
- Execute bash commands at defined lifecycle points
- Allow both user-level and project-level hooks

## Related Features

- **MCP Integration**: Grok One-Shot supports MCP servers which can provide custom tools (see [MCP documentation](./mcp.md))
- **Settings Configuration**: Current settings are in `~/.grok/settings.json` (see [Settings reference](../configuration/settings.md))

## See Also

- [Claude Code Hooks Documentation](https://docs.anthropic.com/en/docs/agent-reference/hooks) - Original feature documentation
- [MCP Integration](./mcp.md) - Current extensibility option in Grok One-Shot
- [Configuration Guide](../configuration/settings.md) - Current settings system

---

**Want this feature?** Consider:

- Opening a feature request in the Grok One-Shot repository
- Contributing to the implementation if you're interested in development
- Using MCP servers as an alternative extensibility mechanism

**Last Updated:** 2025-11-07
