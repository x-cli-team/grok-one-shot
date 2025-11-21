---
title: Grok One-Shot Overview
---

# Grok One-Shot Overview

> Learn about Grok One-Shot, an agentic coding tool that lives in your terminal and helps you turn ideas into code faster than ever before.

## Get started in 30 seconds

Prerequisites:

- A Grok API key from [console.x.ai](https://console.x.ai)

**Install Grok One-Shot:**

```bash
# Using npm (Node.js 18+)
npm install -g @xagent/one-shot

# Using Bun (faster)
bun install -g @xagent/one-shot
```

**Start using Grok One-Shot:**

```bash
# Set your API key
export GROK_API_KEY="your-key-here"

# Navigate to your project
cd your-project

# Start Grok One-Shot
grok
```

You'll see the welcome screen on first use. That's it! [Continue with Quickstart (5 mins) →](./quickstart.md)

> ** Parity Gap:** Grok One-Shot does not yet have a native installer script like Claude Code's `curl | bash` method. Installation currently requires npm or Bun. See [Troubleshooting](../build-with-claude-code/troubleshooting.md) if you hit issues.

> ** Parity Gap:** Grok One-Shot does not yet have a VS Code extension. All interactions are terminal-based.

## What Grok One-Shot does for you

- **Build features from descriptions**: Tell Grok One-Shot what you want to build in plain English. It will make a plan, write the code, and ensure it works.
- **Debug and fix issues**: Describe a bug or paste an error message. Grok One-Shot will analyze your codebase, identify the problem, and implement a fix.
- **Navigate any codebase**: Ask anything about your codebase, and get a thoughtful answer back. Grok One-Shot maintains awareness of your entire project structure and can find up-to-date information from the web with [MCP](../build-with-claude-code/mcp.md) integration for external datasources.
- **Automate tedious tasks**: Fix lint issues, resolve merge conflicts, and write release notes. Do all this in a single command from your developer machines, or automatically in CI.

## Why developers love Grok One-Shot

- **Works in your terminal**: Not another chat window. Not another IDE. Grok One-Shot meets you where you already work, with the tools you already love.
- **Takes action**: Grok One-Shot can directly edit files, run commands, and create commits. Need more? [MCP](../build-with-claude-code/mcp.md) lets Grok One-Shot read your design docs in Google Drive, update your tickets in Jira, or use _your_ custom developer tooling.
- **Unix philosophy**: Grok One-Shot is composable and scriptable. `tail -f app.log | grok -p "Notify me if you see any anomalies in this log stream"` _works_. Your CI can run `grok -p "If there are new text strings, translate them into French and raise a PR for review"`.
- **Fast and efficient**: Powered by Grok's fast reasoning models from xAI, with efficient token usage and quick response times.

> ** Parity Gap:** Grok One-Shot uses the Grok API (xAI) instead of Claude API. No enterprise hosting options (AWS Bedrock, GCP Vertex AI) are currently available. Security and compliance features are limited compared to Claude Code Enterprise.

## Next steps

**Getting Started:**

- [Quickstart](./quickstart.md) - See Grok One-Shot in action with practical examples
- [Common workflows](./common-workflows.md) - Step-by-step guides for common workflows
- [Troubleshooting](../build-with-claude-code/troubleshooting.md) - Solutions for common issues

**Configuration:**

- [Settings](../configuration/settings.md) - Customize Grok One-Shot for your workflow
- [CLI reference](../reference/cli-reference.md) - Learn about CLI commands and controls
- [MCP Integration](../build-with-claude-code/mcp.md) - Extend Grok One-Shot with external tools

**Advanced Features:**

- [Subagents](../build-with-claude-code/subagents.md) - Use specialized AI agents for specific tasks
- [Skills](./skills.md) - Create modular capabilities
- [Hooks](./hooks.md) - Customize behavior with shell hooks

> ** Parity Gap:** Grok One-Shot does not yet have an Agent SDK. Custom AI agent creation via SDK is not available.

## Key Features

### Intelligent Code Operations

- Multi-file editing with context awareness
- Refactoring with impact analysis
- Syntax-aware modifications
- Automated testing and validation

### Research & Automation

- Automated research workflows with approval gates
- Codebase exploration and analysis
- Implementation planning
- Recommendation generation

### Terminal Integration

- React/Ink-based rich terminal UI
- Session management with auto-save to `~/.grok/sessions/`
- Token usage tracking
- Interactive confirmation dialogs

### Context Management

- On-demand documentation loading (~700 tokens at startup, 93-96% reduction)
- Project-aware context via GROK.md files
- Intelligent Read tool for specific docs
- MCP for external data sources

### MCP (Model Context Protocol)

- Connect to Google Drive, Figma, Slack, and more
- Custom tool development
- Server management via CLI commands
- See [MCP documentation](../build-with-claude-code/mcp.md)

## Architecture

Grok One-Shot is built with TypeScript and runs on Node.js or Bun:

```
User Terminal
│
▼
Grok One-Shot (React/Ink UI)
│
├─→ Chat Interface
├─→ Confirmation System
└─→ Input Handling
│
▼
GrokAgent (Core Logic)
│
├─→ Message Management
├─→ Tool Execution (Read, Write, Edit, Bash, etc.)
└─→ Context Loading
│
▼
Grok API (xAI)
grok-2-1212 / grok-beta
```

## System Requirements

**Minimum:**

- Node.js 18+ or Bun runtime
- Terminal with 256-color support
- Grok API key from [console.x.ai](https://console.x.ai)
- 100MB disk space

**Recommended:**

- Bun runtime (4x faster than Node.js)
- Modern terminal (iTerm2, Windows Terminal, Alacritty, etc.)
- Git installed for repository operations
- 200MB disk space for session storage

## Getting Help

**Documentation:**

- See GROK.md and docs-index.md in your project
- All docs in `.agent/docs/` directory
- Use `grok --help` for CLI options

**Troubleshooting:**

- Check `xcli-startup.log` in current directory for startup diagnostics
- See [Troubleshooting Guide](../build-with-claude-code/troubleshooting.md)
- File issues in GitHub repository

**Community:**

- Updates: Check `grok --version` for latest version
- License: MIT (open source)

---

**Ready to get started?** Continue to the [Quickstart Guide](./quickstart.md) →
