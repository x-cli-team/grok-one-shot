---
title: Grok One-Shot settings
---

# Grok One-Shot settings

> Configure Grok One-Shot with global settings and environment variables.

Grok One-Shot offers a variety of settings to configure its behavior to meet your needs. You can configure Grok One-Shot by editing the `settings.json` file or using CLI commands for common settings.

## Settings files

The `settings.json` file is the mechanism for configuring Grok One-Shot:

- **User settings** are defined in `~/.grok/settings.json` and apply to all projects.

> ** Parity Gap:** Grok One-Shot does not support project-level settings files (`.grok/settings.json` in project directories) or enterprise managed policy settings. All configuration is user-level only.

**Location:** `~/.grok/settings.json`

**Example settings.json:**

```json
{
  "apiKey": "your-grok-api-key",
  "baseUrl": "https://api.x.ai/v1",
  "model": "grok-2-1212",
  "name": "Your Name",
  "confirmations": true,
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/home/user/projects"
      ],
      "env": {
        "PATH": "/usr/local/bin:/usr/bin:/bin"
      }
    },
    "github": {
      "command": "node",
      "args": ["github-mcp-server/dist/index.js"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  }
}
```

### Available settings

`settings.json` supports the following options:

| Key             | Description                                                                                      | Example                                                            |
| :-------------- | :----------------------------------------------------------------------------------------------- | :----------------------------------------------------------------- |
| `apiKey`        | Your Grok API key for authentication                                                             | `"xai-abc123def456..."`                                            |
| `baseUrl`       | API endpoint URL (default: `https://api.x.ai/v1`)                                                | `"https://api.x.ai/v1"`                                            |
| `model`         | Default model to use for Grok One-Shot                                                           | `"grok-2-1212"`, `"grok-beta"`, `"grok-4-fast-non-reasoning"`      |
| `name`          | Your name for personalization in AI responses                                                    | `"Alice"`                                                          |
| `confirmations` | Whether to prompt for confirmation before file edits and bash commands (default: `true`)         | `true`, `false`                                                    |
| `mcpServers`    | MCP server configurations. See [MCP Integration documentation](../build-with-claude-code/mcp.md) | `{"server-name": {"command": "npx", "args": [...], "env": {...}}}` |

> ** Parity Gap:** Grok One-Shot does not support many advanced settings available in Claude Code, including:
>
> - `permissions` (allow/deny/ask rules for tools)
> - `hooks` (custom commands before/after tool executions)
> - `sandbox` (sandboxing configuration)
> - `companyAnnouncements`
> - `includeCoAuthoredBy`
> - `statusLine`
> - `outputStyle`
> - `cleanupPeriodDays`
> - `forceLoginMethod` / `forceLoginOrgUUID`
> - Plugin-related settings (`enabledPlugins`, `extraKnownMarketplaces`)
> - AWS/Bedrock configuration
> - MCP server approval settings

### MCP Server Configuration

MCP servers extend Grok One-Shot with additional tools and capabilities. Configure them in the `mcpServers` object:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/home/user/projects"
      ]
    },
    "github": {
      "command": "node",
      "args": ["github-mcp-server/dist/index.js"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}",
        "DEBUG": "true"
      }
    }
  }
}
```

**Manage via CLI:**

```bash
grok mcp add <name> "<command>"
grok mcp list
grok mcp remove <name>
```

**Environment variable substitution:**

- Use `${VAR_NAME}` syntax to reference environment variables
- Variables are resolved when MCP servers start
- Useful for keeping secrets out of settings.json

See [MCP Integration documentation](../build-with-claude-code/mcp.md) for details.

### Settings precedence

Settings are applied in order of precedence (highest to lowest):

1. **Command line arguments**

- Temporary overrides for a specific session
- Example: `grok -k "temp-key" -m "grok-beta"`

2. **Environment variables**

- Override settings file values
- Example: `GROK_MODEL=grok-beta grok`

3. **User settings** (`~/.grok/settings.json`)

- Persistent global settings

> ** Parity Gap:** Claude Code supports enterprise managed policies and project-level settings that take precedence over user settings. Grok One-Shot only has user-level settings.

### Editing settings

**Via commands:**

```bash
# API key (prompts if not set)
grok -k "new-key"

# Name
grok set-name "Your Name"

# Confirmations toggle
grok toggle-confirmations

# MCP servers
grok mcp add servername "command"
grok mcp remove servername
```

**Manual editing:**

```bash
# View current settings
cat ~/.grok/settings.json

# Edit with your preferred editor
vim ~/.grok/settings.json
nano ~/.grok/settings.json
code ~/.grok/settings.json
```

**Important:** Valid JSON required. Invalid JSON will cause errors on startup.

**Reset settings:**

```bash
# Backup current settings
cp ~/.grok/settings.json ~/.grok/settings.json.backup

# Delete settings (will be recreated on next run)
rm ~/.grok/settings.json

# Or reset to defaults
cat > ~/.grok/settings.json << 'EOF'
{
"confirmations": true
}
EOF
```

## Environment variables

Grok One-Shot supports the following environment variables to control its behavior:

### Core Configuration

| Variable          | Purpose                                                    | Example                           |
| :---------------- | :--------------------------------------------------------- | :-------------------------------- |
| `GROK_API_KEY`    | API key for xAI authentication (overrides settings.json)   | `"xai-abc123..."`                 |
| `GROK_MODEL`      | Default model to use (overrides settings.json)             | `"grok-beta"`                     |
| `GROK_BASE_URL`   | API endpoint URL (overrides settings.json)                 | `"https://custom.example.com/v1"` |
| `MAX_TOOL_ROUNDS` | Maximum number of tool execution iterations (default: 400) | `500`                             |

### UX Configuration

| Variable           | Purpose                                                       | Example   |
| :----------------- | :------------------------------------------------------------ | :-------- |
| `GROK_TEXT_COLOR`  | Force text color for terminal compatibility                   | `"black"` |
| `TERM_BACKGROUND`  | Terminal theme hint (light/dark)                              | `"dark"`  |
| `GROK_UX_ENHANCED` | Enable/disable enhanced UI features (spinners, progress bars) | `"false"` |
| `GROK_UX_MINIMAL`  | Minimal UI mode for low resource usage                        | `"true"`  |
| `GROK_UX_DEBUG`    | Enable UX debug logging                                       | `"true"`  |

### Debug Configuration

| Variable            | Purpose                      | Example  |
| :------------------ | :--------------------------- | :------- |
| `GROK_DEBUG`        | Enable general debug output  | `"true"` |
| `GROK_DEBUG_COLORS` | Debug color detection system | `"1"`    |

### Network Configuration

| Variable      | Purpose                                                                  | Example                          |
| :------------ | :----------------------------------------------------------------------- | :------------------------------- |
| `HTTP_PROXY`  | Specify HTTP proxy server for network connections                        | `"http://proxy.example.com:80"`  |
| `HTTPS_PROXY` | Specify HTTPS proxy server for network connections                       | `"http://proxy.example.com:443"` |
| `NO_PROXY`    | List of domains and IPs to which requests bypass proxy (comma-separated) | `"localhost,127.0.0.1,.local"`   |

> ** Parity Gap:** Claude Code supports many additional environment variables for advanced features not present in Grok One-Shot, including:
>
> - Model-specific configuration (Haiku, Opus, Sonnet variants)
> - AWS Bedrock configuration
> - Google Vertex AI configuration
> - Bash execution limits and behavior
> - Prompt caching control
> - MCP timeouts and token limits
> - Telemetry and auto-update control
> - Client certificate (mTLS) configuration
> - Extended thinking configuration
> - Slash command configuration

## Shell profile configuration

Add to `~/.bashrc`, `~/.zshrc`, or equivalent:

```bash
# Grok One-Shot Configuration
export GROK_API_KEY="your-api-key-here"
export GROK_MODEL="grok-2-1212"
export MAX_TOOL_ROUNDS=400

# Optional: Terminal theme
export TERM_BACKGROUND=dark

# Optional: Debug mode
# export GROK_DEBUG=true

# Path (if needed)
export PATH="$PATH:$(npm bin -g)" # or Bun path
```

**Apply changes:**

```bash
source ~/.bashrc # or ~/.zshrc
```

## Advanced configuration

### Custom API endpoint

For proxy or custom deployments:

```bash
export GROK_BASE_URL="https://my-proxy.example.com/api/v1"
```

### Multiple environments

Use shell aliases for different configurations:

```bash
# ~/.bashrc
alias grok-prod='GROK_MODEL=grok-2-1212 grok'
alias grok-beta='GROK_MODEL=grok-beta grok'
alias grok-fast='GROK_MODEL=grok-4-fast-non-reasoning grok'
```

Usage:

```bash
grok-prod "analyze code"
grok-beta "try new features"
grok-fast "quick question"
```

### Per-project settings

Use environment files (note: not automatically loaded):

```bash
# project/.env
GROK_MODEL=grok-beta
MAX_TOOL_ROUNDS=500
```

Load before running:

```bash
source .env && grok
```

> ** Parity Gap:** Claude Code supports automatic loading of project-level `.claude/settings.json` files that are checked into source control and shared with teams. Grok One-Shot requires manual environment file loading for per-project configuration.

## Session storage

**Location:** `~/.grok/sessions/`

**Contents:**

- One JSON file per session
- Full conversation history
- Token usage tracking
- Timestamps and metadata

**Management:**

```bash
# View sessions
ls -la ~/.grok/sessions/

# View specific session
cat ~/.grok/sessions/session-2025-11-05-14-30.json

# Clean old sessions (older than 30 days)
find ~/.grok/sessions/ -name "*.json" -mtime +30 -delete

# Archive sessions
mkdir ~/session-archives
mv ~/.grok/sessions/*.json ~/session-archives/
```

> ** Parity Gap:** Claude Code supports automatic cleanup of old sessions via `cleanupPeriodDays` setting (default: 30 days). Grok One-Shot requires manual session cleanup.

## Tools available to Grok agent

Grok One-Shot has access to a set of powerful tools that help it understand and modify your codebase:

| Tool             | Description                                 | Permission Required |
| :--------------- | :------------------------------------------ | :------------------ |
| **Bash**         | Executes shell commands in your environment | Confirmation\*      |
| **Edit**         | Makes targeted edits to specific files      | Confirmation\*      |
| **Glob**         | Finds files based on pattern matching       | No                  |
| **Grep**         | Searches for patterns in file contents      | No                  |
| **NotebookEdit** | Modifies Jupyter notebook cells             | Confirmation\*      |
| **Read**         | Reads the contents of files                 | No                  |
| **WebFetch**     | Fetches content from a specified URL        | Confirmation\*      |
| **WebSearch**    | Performs web searches with domain filtering | Confirmation\*      |
| **Write**        | Creates or overwrites files                 | Confirmation\*      |

\* Confirmation can be disabled via `confirmations: false` in settings.json or `grok toggle-confirmations`

> ** Parity Gap:** Claude Code supports:
>
> - Granular permission rules (allow/deny/ask) for each tool
> - Tool-specific permission rules (e.g., allow specific Bash commands, deny specific file paths)
> - Working directories configuration
> - Permission modes (acceptAll, acceptEdits, ask, bypassPermissions)
> - Hooks system to run custom commands before/after tool execution
> - SlashCommand tool for custom slash commands
> - Task tool for sub-agents
> - TodoWrite tool for task management
> - NotebookRead tool (separate from NotebookEdit)
>
> Grok One-Shot only supports a global confirmation toggle for all permission-requiring tools.

## Troubleshooting

### Settings not applied

**Check:**

1. File exists: `ls ~/.grok/settings.json`
2. Valid JSON: `python -m json.tool ~/.grok/settings.json`
3. Correct permissions: `chmod 644 ~/.grok/settings.json`

### Environment variables not working

**Solutions:**

```bash
# Verify environment
printenv | grep GROK

# Check shell profile loaded
echo $GROK_API_KEY

# Reload profile
source ~/.bashrc # or ~/.zshrc
```

### MCP servers not starting

**Check:**

1. Command is correct and executable
2. Dependencies installed
3. Paths are absolute
4. Environment variables set

**Debug:**

```bash
# Test command independently
\<command from settings.json\>

# Check logs with debug mode
export GROK_DEBUG=true
grok
```

### API key not found

**Solutions:**

```bash
# Check priority order:
# 1. Command line flag
grok -k "your-key"

# 2. Environment variable
export GROK_API_KEY="your-key"
grok

# 3. Settings file
echo '{"apiKey":"your-key"}' > ~/.grok/settings.json
grok

# 4. Will be prompted interactively
grok
```

## Best practices

### Security

**Do:**

- Use environment variables for API keys
- Restrict file permissions: `chmod 600 ~/.grok/settings.json`
- Never commit settings.json to git
- Use `${VAR}` references for secrets in MCP config
- Review confirmations before approving operations

**Don't:**

- Share settings.json publicly
- Hardcode API keys in commands
- Give MCP servers unnecessary permissions
- Disable confirmations unless you fully trust the AI's actions

### Organization

**Recommendations:**

- Keep settings.json minimal
- Use environment variables for temporary changes
- Document custom configurations
- Backup settings before major changes
- Use descriptive names for MCP servers

### Performance

**Optimize:**

- Remove unused MCP servers
- Use appropriate model for task (fast vs quality)
- Clean old sessions periodically
- Use headless mode (`-p`) for simple queries
- Adjust `MAX_TOOL_ROUNDS` based on task complexity

## See also

- [CLI Reference](../reference/cli-reference.md) - Command-line options
- [MCP Integration](../build-with-claude-code/mcp.md) - Model Context Protocol
- [Environment Variables](../reference/environment-variables.md) - Complete environment variable reference
- [Troubleshooting](../operations/troubleshooting.md) - Common issues and solutions

---

**Note:** This documentation is adapted from Claude Code. Features marked with parity gaps are not yet implemented in Grok One-Shot but may be added in future versions.
