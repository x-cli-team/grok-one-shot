---
title: Grok One-Shot on the Web
---

# Grok One-Shot on the Web

> Claude Code on the web - A Claude.ai exclusive feature

## Parity Gap: No Grok One-Shot Web Interface

**Current Status**: Grok One-Shot is a **terminal-only** CLI tool. Unlike Claude Code, there is no web interface or cloud execution environment provided by xAI.

**What This Means**:

- **No web-based UI**: You cannot run Grok One-Shot from a browser
- **No cloud execution**: All tasks run locally on your machine
- **No iOS/mobile app**: No mobile interface for monitoring or kicking off tasks
- **No remote sessions**: Cannot move sessions between devices
- **No managed VMs**: No Anthropic-style managed cloud environments
- **No GitHub integration UI**: No web portal for connecting repositories

**What Grok One-Shot Offers Instead**:

1. **Terminal-based interface**: Full-featured React/Ink CLI interface
2. **Local execution**: Fast, low-latency execution on your machine
3. **Session management**: Auto-saved sessions in `~/.grok/sessions/`
4. **Headless mode**: Run tasks non-interactively via `-p` flag
5. **Full filesystem access**: Direct access to your local development environment
6. **MCP integration**: Extensible via Model Context Protocol

**Why Terminal-Only Can Be Better**:

- **No network overhead**: Instant response, no remote VM startup time
- **Complete control**: Full access to your local tools and environment
- **Privacy**: Code never leaves your machine (except API calls)
- **Cost-effective**: No cloud compute costs
- **Integration**: Easy integration with local git, editors, and tools

This document describes Claude Code on the web as reference for what cloud-based AI code assistants can offer.

---

## What is Claude Code on the Web? (Reference)

Claude Code on the web is a **Claude.ai exclusive feature** that lets developers run Claude Code tasks asynchronously on secure cloud infrastructure.

<Note>
Claude Code on the web is currently in research preview and only available to Claude Pro and Max users.
</Note>

### Claude Code Web Features (Not Available in Grok One-Shot)

- **Answering questions**: Ask about code architecture and how features are implemented
- **Bugfixes and routine tasks**: Well-defined tasks that don't require frequent steering
- **Parallel work**: Tackle multiple bug fixes in parallel
- **Repositories not on your local machine**: Work on code you don't have checked out locally
- **Backend changes**: Where AI can write tests and then write code to pass those tests

Claude Code is also available on the **Claude iOS app**, which is perfect for:

- **On the go**: Kick off tasks while commuting or away from laptop
- **Monitoring**: Watch the trajectory and steer the agent's work

Developers can also **move Claude Code sessions** from the Claude app to their terminal to continue tasks locally.

## Grok One-Shot: Terminal-First Approach

While Grok One-Shot doesn't offer web or mobile interfaces, it provides a powerful terminal-based workflow:

### Getting Started with Grok One-Shot

1. **Install via npm/bun**:

```bash
npm install -g grok
# or
bun install -g grok
```

2. **Set API key**:

```bash
export GROK_API_KEY="your-key-here"
```

3. **Run interactively**:

```bash
grok
```

4. **Run headless tasks**:

```bash
grok -p "analyze the authentication flow"
```

### Interactive Mode

Grok One-Shot provides a rich terminal interface with:

- **Streaming responses**: Real-time AI output
- **Syntax highlighting**: Formatted code display
- **Token tracking**: Live token usage display
- **Confirmation gates**: Approve operations before execution
- **Session history**: Automatic session saving

### Headless Mode

For automated or non-interactive use:

```bash
# Single task
grok -p "list all TODO comments in the codebase"

# With specific model
grok -m grok-4-fast-non-reasoning -p "fix linting errors"

# From specific directory
grok -d /path/to/project -p "analyze dependencies"
```

### Session Management

Sessions are automatically saved to `~/.grok/sessions/`:

```bash
# Sessions are timestamped
~/.grok/sessions/2025-11-07T14-30-00.json

# Each session includes:
# - Full conversation history
# - Token usage statistics
# - Timestamps
# - Model used
```

### MCP Integration

Extend capabilities via Model Context Protocol:

```bash
# Add MCP server
grok mcp add <server-name> <command>

# List servers
grok mcp list

# Remove server
grok mcp remove <server-name>
```

## Claude Code Web Features: Detailed Reference

The following sections describe Claude Code's web features for reference.

### How Claude Code Web Works (Reference Only)

When you start a task on Claude Code on the web:

1. **Repository cloning**: Repository is cloned to an Anthropic-managed VM
2. **Environment setup**: Claude prepares a secure cloud environment
3. **Network configuration**: Internet access is configured based on settings
4. **Task execution**: Claude analyzes code, makes changes, runs tests
5. **Completion**: User is notified and can create a PR with changes
6. **Results**: Changes are pushed to a branch, ready for pull request

### Moving Tasks Between Web and Terminal (Claude Code)

Claude Code allows moving sessions between web and terminal - **this is not available in Grok One-Shot** since there is no web interface.

**Grok One-Shot alternative**: All work happens in the terminal. Use session files for continuity:

```bash
# Sessions auto-save to ~/.grok/sessions/
# Resume by reviewing session history or starting new tasks
```

### Cloud Environment (Claude Code Reference)

Claude Code provides:

- **Default image**: Universal image with common toolchains
- **Language-specific setups**: Python, Node.js, Java, Go, Rust, C++
- **Environment configuration**: Custom environment variables
- **Dependency management**: SessionStart hooks

**Grok One-Shot approach**: Uses your local development environment directly:

- Your installed languages and tools
- Your local dependencies
- Your environment variables
- Your git configuration

### Network Access and Security (Claude Code)

Claude Code web provides:

- **Isolated virtual machines**: Each session in isolated VM
- **Network access controls**: Limited by default
- **Credential protection**: Secure proxy for git operations
- **GitHub proxy**: Dedicated proxy for GitHub operations

**Grok One-Shot security model**:

- **Local execution**: All operations on your local machine
- **Your credentials**: Uses your local git/ssh credentials
- **Your network**: Full access to local network and internet
- **Your tools**: Direct access to your development tools

## Grok One-Shot Best Practices

Since Grok One-Shot runs locally, follow these best practices:

### 1. Project Configuration

Create a `GROK.md` file in your repository root:

```markdown
# Project Guidelines

## Code Style

- Use TypeScript strict mode
- Follow Airbnb style guide
- 2 spaces for indentation

## Architecture

- Feature-based folder structure
- Dependency injection for services
- Unit tests for all business logic

## Review Criteria

- All tests must pass
- No console.log statements
- Update relevant documentation
```

### 2. Use Hooks for Automation

Configure `.grok/settings.json`:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup",
        "hooks": [
          {
            "type": "command",
            "command": "npm install"
          }
        ]
      }
    ]
  }
}
```

### 3. Leverage Headless Mode

For repetitive tasks:

```bash
# Code review
grok -p "review recent changes for security issues"

# Refactoring
grok -p "refactor UserService to use dependency injection"

# Documentation
grok -p "update API docs for auth endpoints"
```

### 4. Session History

Review past sessions for learning:

```bash
ls -ltr ~/.grok/sessions/

# Sessions are JSON files you can inspect
cat ~/.grok/sessions/latest.json
```

### 5. MCP Extensions

Add domain-specific tools:

```bash
# Add database tools
grok mcp add postgres-tools node-postgres-mcp

# Add API testing tools
grok mcp add api-tester http-mcp-server
```

## Comparing Approaches

| Feature            | Claude Code on Web           | Grok One-Shot             |
| ------------------ | ---------------------------- | ------------------------- |
| **Execution**      | Cloud-based managed VMs      | Local terminal            |
| **Access**         | Browser + mobile app         | Terminal only             |
| **Setup**          | GitHub integration UI        | CLI installation          |
| **Environment**    | Anthropic-managed containers | Your local machine        |
| **Network**        | Configurable proxy + limits  | Full local access         |
| **Sessions**       | Move web ↔ terminal         | Terminal only             |
| **Parallel tasks** | Multiple cloud sessions      | Multiple terminal windows |
| **Cost**           | Rate limits + usage          | API calls only            |
| **Privacy**        | Code on Anthropic VMs        | Code stays local          |
| **Latency**        | VM startup + network         | Instant local             |
| **Isolation**      | Strong VM isolation          | Process-level             |

## Use Case Comparison

### Best for Claude Code on Web:

- Working on the go (mobile)
- Repositories not checked out locally
- Parallel tasks on multiple repos
- Team collaboration with shared environments
- Repositories requiring complex cloud setup

### Best for Grok One-Shot:

- Local development workflow
- Fast iteration cycles
- Projects requiring local tools
- Privacy-sensitive codebases
- Integration with local git workflow
- Custom tooling and scripts

## Future Considerations

If xAI develops a web interface for Grok, it might include:

- **Web-based UI**: Browser access to Grok One-Shot
- **Cloud execution**: Managed VMs for running tasks
- **Mobile app**: iOS/Android apps for remote task management
- **Session portability**: Move sessions between web and terminal
- **Managed environments**: Pre-configured language environments
- **GitHub integration**: Direct repository integration UI

Until then, Grok One-Shot's terminal-first approach provides:

- **Simplicity**: Single execution environment
- **Speed**: No remote VM overhead
- **Control**: Full access to local environment
- **Privacy**: Code never leaves your machine
- **Integration**: Native git and tool integration

## Related Resources

- [Grok One-Shot Documentation](/.agent/docs/claude-code/)
- [GROK.md Configuration Guide](/.agent/docs/claude-code/configuration/memory-claude-md.md)
- [Session Management](/.agent/docs/claude-code/reference/sessions.md)
- [MCP Integration](/.agent/docs/claude-code/features/plugin-system.md)
- [Headless Mode Guide](/.agent/docs/claude-code/getting-started/quickstart.md)

## Terminal-First Philosophy

Grok One-Shot embraces a terminal-first philosophy:

**Why Terminal-First Works**:

1. **Developer native environment**: Developers already work in terminals
2. **Easy integration**: Fits naturally into existing workflows
3. **Scriptable**: Easy to automate and integrate with other tools
4. **Fast**: No network overhead or VM startup time
5. **Flexible**: Works with any editor, IDE, or tool
6. **Portable**: Run anywhere with terminal access

**Terminal Best Practices**:

- Use `tmux` or `screen` for persistent sessions
- Leverage shell aliases for common tasks
- Integrate with git hooks for automation
- Use terminal multiplexers for parallel work
- Script repetitive workflows

**Example Workflow**:

```bash
# Morning routine
alias grok-review="grok -p 'review changes since yesterday'"
alias grok-todos="grok -p 'list all TODO and FIXME comments'"

# Pre-commit
alias grok-lint="grok -p 'fix all linting errors'"
alias grok-test="grok -p 'ensure all tests pass'"

# Feature development
grok-review
git checkout -b feature/new-auth
grok -p "implement JWT authentication for /api/login endpoint"
grok-test
git add . && git commit -m "feat: add JWT authentication"
```

## Conclusion

While Claude Code offers a web interface for cloud-based execution, Grok One-Shot provides a powerful terminal-first experience that integrates naturally with local development workflows. The choice between cloud-based and local execution depends on your specific needs:

- **Choose cloud-based** (Claude Code): For mobile access, parallel cloud tasks, and managed environments
- **Choose terminal-based** (Grok One-Shot): For local development, fast iteration, privacy, and native tool integration

Both approaches have their strengths, and the best choice depends on your workflow, privacy requirements, and development environment preferences.
