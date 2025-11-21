---
title: Quickstart
---

# Quickstart

> Welcome to Grok One-Shot!

This quickstart guide will have you using AI-powered coding assistance in just a few minutes. By the end, you'll understand how to use Grok One-Shot for common development tasks.

## Before you begin

Make sure you have:

- A terminal or command prompt open
- A code project to work with
- A Grok API key from [console.x.ai](https://console.x.ai)

## Step 1: Install Grok One-Shot

To install Grok One-Shot, use one of the following methods:

**NPM (Node.js 18+):**

```bash
npm install -g @xagent/one-shot
```

**Bun (Recommended - 4x faster):**

```bash
bun install -g @xagent/one-shot
```

> ** Parity Gap:** Grok One-Shot does not yet have native installers like Claude Code's `brew install` or `curl | bash` scripts. Installation currently requires npm or Bun.

## Step 2: Set up your API key

Grok One-Shot requires a Grok API key to use. Set it as an environment variable:

**For current session:**

```bash
export GROK_API_KEY="your-key-here"
```

**For permanent setup (recommended):**

Add to your shell profile (`~/.bashrc`, `~/.zshrc`, or `~/.profile`):

```bash
echo 'export GROK_API_KEY="xai-your-actual-key-here"' >> ~/.bashrc
source ~/.bashrc

# Verify it's set
echo $GROK_API_KEY
```

**Get your API key:**

1. Visit [console.x.ai](https://console.x.ai)
2. Sign in or create an account
3. Navigate to "API Keys" section
4. Click "Create new API key"
5. Copy the key (starts with `xai-`)

> ** Parity Gap:** Grok One-Shot does not have OAuth-based login like Claude Code. You must manually configure your API key via environment variable.

## Step 3: Start your first session

Open your terminal in any project directory and start Grok One-Shot:

```bash
cd /path/to/your/project
grok
```

You'll see the Grok One-Shot welcome screen:

```
Welcome to X-CLI v1.1.101

Claude Code-level intelligence in your terminal!

Interactive Chat:

Ask me anything! Try:
• "What files are in this directory?"
• "Fix the bug in user-service.ts"
• "Add tests for the authentication module"

Power Features:

• Auto-edit mode: Press Shift+Tab to toggle hands-free editing
• Project memory: Create .grok/GROK.md to customize behavior
• Documentation: Run "/init-agent" for .agent docs system
```

> ** Parity Gap:** Grok One-Shot does not have `/help` or `/resume` commands like Claude Code. Session management features are limited. Use `grok --help` for CLI options.

## Step 4: Ask your first question

Let's start with understanding your codebase. Try one of these commands:

```
> what does this project do?
```

Grok One-Shot will analyze your files and provide a summary. You can also ask more specific questions:

```
> what technologies does this project use?
```

```
> where is the main entry point?
```

```
> explain the folder structure
```

> **Note:** Grok One-Shot reads your files as needed - you don't have to manually add context.

## Step 5: Make your first code change

Now let's make Grok One-Shot do some actual coding. Try a simple task:

```
> add a hello world function to the main file
```

Grok One-Shot will:

1. Find the appropriate file
2. Show you the proposed changes
3. Ask for your approval
4. Make the edit

> **Note:** Grok One-Shot always asks for permission before modifying files. You can approve individual changes or press `Shift+Tab` to enable "Auto-Accept" mode for the session.

## Step 6: Use Git with Grok One-Shot

Grok One-Shot makes Git operations conversational:

```
> what files have I changed?
```

```
> commit my changes with a descriptive message
```

You can also prompt for more complex Git operations:

```
> create a new branch called feature/quickstart
```

```
> show me the last 5 commits
```

```
> help me resolve merge conflicts
```

## Step 7: Fix a bug or add a feature

Grok One-Shot is proficient at debugging and feature implementation.

Describe what you want in natural language:

```
> add input validation to the user registration form
```

Or fix existing issues:

```
> there's a bug where users can submit empty forms - fix it
```

Grok One-Shot will:

- Locate the relevant code
- Understand the context
- Implement a solution
- Run tests if available

## Step 8: Test out other common workflows

There are a number of ways to work with Grok One-Shot:

**Refactor code:**

```
> refactor the authentication module to use async/await instead of callbacks
```

**Write tests:**

```
> write unit tests for the calculator functions
```

**Update documentation:**

```
> update the README with installation instructions
```

**Code review:**

```
> review my changes and suggest improvements
```

> **Tip:** Grok One-Shot is your AI pair programmer. Talk to it like you would a helpful colleague - describe what you want to achieve, and it will help you get there.

## Essential commands

Here are the most important commands for daily use:

| Command          | What it does                   | Example                           |
| ---------------- | ------------------------------ | --------------------------------- |
| `grok`           | Start interactive mode         | `grok`                            |
| `grok "task"`    | Run a one-time task            | `grok "fix the build error"`      |
| `grok -p "task"` | Run headless, then exit        | `grok -p "explain this function"` |
| `grok -d <dir>`  | Change working directory       | `grok -d /path/to/project`        |
| `grok --yes`     | Auto-approve all confirmations | `grok --yes`                      |
| `exit` or Ctrl+C | Exit Grok One-Shot             | `> exit`                          |

> ** Parity Gap:** Grok One-Shot does not yet support `--continue`, `--resume`, or `commit` subcommands like Claude Code. Session management features are limited.

See the [CLI reference](../reference/cli-reference.md) for a complete list of commands.

## Pro tips for beginners

**Be specific with your requests:**

Instead of: "fix the bug"

Try: "fix the login bug where users see a blank screen after entering wrong credentials"

**Use step-by-step instructions:**

Break complex tasks into steps:

```
> 1. create a new database table for user profiles
```

```
> 2. create an API endpoint to get and update user profiles
```

```
> 3. build a webpage that allows users to see and edit their information
```

**Let Grok One-Shot explore first:**

Before making changes, let Grok One-Shot understand your code:

```
> analyze the database schema
```

```
> build a dashboard showing products that are most frequently returned by our UK customers
```

**Save time with shortcuts:**

- Press `Shift+Tab` to toggle auto-accept mode
- Use headless mode (`-p`) for quick queries
- Set `GROK_API_KEY` once in your shell profile

## What's next?

Now that you've learned the basics, explore more advanced features:

**Learn More:**

- [Common workflows](./common-workflows.md) - Step-by-step guides for common tasks
- [CLI reference](../reference/cli-reference.md) - Master all commands and options
- [Configuration](../configuration/settings.md) - Customize Grok One-Shot for your workflow

**Advanced Features:**

- [MCP Integration](../build-with-claude-code/mcp.md) - Connect to external data sources
- [Hooks](./hooks.md) - Customize behavior with shell hooks
- [Subagents](../build-with-claude-code/subagents.md) - Use specialized AI agents (planned)

## Getting help

- **Command help**: Run `grok --help` for CLI options
- **Documentation**: See GROK.md and docs-index.md in your project
- **Troubleshooting**: Check [Troubleshooting Guide](../build-with-claude-code/troubleshooting.md)
- **Logs**: Check `xcli-startup.log` in current directory for startup diagnostics
- **Issues**: File bugs in the GitHub repository

---

**Ready to dive deeper?** Continue to [Common Workflows](./common-workflows.md) →
