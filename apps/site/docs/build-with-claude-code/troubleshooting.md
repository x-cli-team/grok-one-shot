---
title: Troubleshooting
---

# Troubleshooting

> Discover solutions to common issues with Grok One-Shot installation and usage.

> **Note:** This documentation is adapted from Claude Code. Some features and troubleshooting steps may differ for Grok One-Shot. See parity gap notes throughout.

## Common installation issues

### Command not found: grok

**Cause:** Global npm/bun binary not in PATH

**Solutions:**

```bash
# For npm
export PATH="$PATH:$(npm bin -g)"

# For Bun
export PATH="$PATH:$HOME/.bun/bin"

# Add to shell profile (~/.bashrc, ~/.zshrc, etc.)
echo 'export PATH="$PATH:$(npm bin -g)"' >> ~/.bashrc
source ~/.bashrc

# Or reinstall
npm install -g @xagent/one-shot

# Verify
which grok
```

### Windows installation issues: errors in WSL

You might encounter the following issues in WSL:

**OS/platform detection issues**: If you receive an error during installation, WSL may be using Windows `npm`. Try:

- Run `npm config set os linux` before installation
- Install with `npm install -g @xagent/one-shot --force --no-os-check` (Do NOT use `sudo`)

**Node not found errors**: If you see `exec: node: not found` when running `grok`, your WSL environment may be using a Windows installation of Node.js. You can confirm this with `which npm` and `which node`, which should point to Linux paths starting with `/usr/` rather than `/mnt/c/`. To fix this, try installing Node via your Linux distribution's package manager or via [`nvm`](https://github.com/nvm-sh/nvm).

**nvm version conflicts**: If you have nvm installed in both WSL and Windows, you may experience version conflicts when switching Node versions in WSL. This happens because WSL imports the Windows PATH by default, causing Windows nvm/npm to take priority over the WSL installation.

You can identify this issue by:

- Running `which npm` and `which node` - if they point to Windows paths (starting with `/mnt/c/`), Windows versions are being used
- Experiencing broken functionality after switching Node versions with nvm in WSL

To resolve this issue, fix your Linux PATH to ensure the Linux node/npm versions take priority:

**Primary solution: Ensure nvm is properly loaded in your shell**

The most common cause is that nvm isn't loaded in non-interactive shells. Add the following to your shell configuration file (`~/.bashrc`, `~/.zshrc`, etc.):

```bash
# Load nvm if it exists
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
```

Or run directly in your current session:

```bash
source ~/.nvm/nvm.sh
```

**Alternative: Adjust PATH order**

If nvm is properly loaded but Windows paths still take priority, you can explicitly prepend your Linux paths to PATH in your shell configuration:

```bash
export PATH="$HOME/.nvm/versions/node/$(node -v)/bin:$PATH"
```

> **Warning:** Avoid disabling Windows PATH importing (`appendWindowsPath = false`) as this breaks the ability to easily call Windows executables from WSL. Similarly, avoid uninstalling Node.js from Windows if you use it for Windows development.

### Linux and Mac installation issues: permission or command not found errors

When installing Grok One-Shot with npm, `PATH` problems may prevent access to `grok`.
You may also encounter permission errors if your npm global prefix is not user writable (eg. `/usr`, or `/usr/local`).

**Recommended solution: Configure npm for user installs**

```bash
# Configure npm for user-level installs
mkdir -p ~/.npm-global
npm config set prefix '~/.npm-global'

# Add to PATH
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

# Now install without sudo
npm install -g @xagent/one-shot

# Verify
which grok
```

**Alternative: Use npx (no installation needed)**

```bash
npx @xagent/one-shot
```

> **Parity Gap**: Grok One-Shot does not have a native installer like Claude Code. Installation is via npm/bun only.

## API Key and authentication

### No API key found

**Error message:**

```
No API key found. Set GROK_API_KEY environment variable.
```

**Cause:** GROK_API_KEY environment variable not set

**Solutions:**

**1. Set environment variable permanently (recommended):**

```bash
# Add to your shell profile (~/.bashrc, ~/.zshrc, or ~/.profile)
echo 'export GROK_API_KEY="xai-your-actual-key-here"' >> ~/.bashrc

# Reload your shell
source ~/.bashrc

# Verify it's set
echo $GROK_API_KEY
```

**2. Set for current session only:**

```bash
export GROK_API_KEY="xai-your-key-here"
grok
```

**3. Pass via command-line flag:**

```bash
grok -k "xai-your-key-here"
```

**Get your API key:**

- Visit: https://console.x.ai
- Sign in or create account
- Navigate to "API Keys" section
- Click "Create new API key"
- Copy the key (starts with `xai-`)

### Invalid API key or 401 errors

**Cause:** Wrong or expired key

**Solutions:**

```bash
# Check settings file
cat ~/.grok/settings.json

# Update key via command line
grok -k "new-key-here"

# Or edit settings file directly
vim ~/.grok/settings.json
```

### Rate limit exceeded

**Cause:** Too many API requests

**Solutions:**

- Wait a few minutes
- Upgrade API plan at https://console.x.ai
- Reduce token usage per request
- Use headless mode (`-p` flag) for simple queries
- Start new sessions to clear context

> **Parity Gap**: Grok One-Shot does not have `/logout` or session management commands like Claude Code.

## Performance and stability

### High CPU or memory usage

Grok One-Shot is designed to work with most development environments, but may consume significant resources when processing large codebases. If you're experiencing performance issues:

1. Start new sessions to clear context (close and restart)
2. Use headless mode (`grok -p "query"`) for simple tasks
3. Consider adding large build directories to your `.gitignore` file
4. Close other applications to free up resources

> **Parity Gap**: Grok One-Shot does not have a `/compact` command like Claude Code to reduce context size within a session.

### Command hangs or freezes

If Grok One-Shot seems unresponsive:

1. Press Ctrl+C to attempt to cancel the current operation
2. If unresponsive, you may need to close the terminal and restart
3. Check `xcli-startup.log` for error messages

### Responses are slow

**Causes & Solutions:**

**1. Network latency**

- Check internet speed
- Try different network

**2. Using Node.js instead of Bun**

```bash
# Install Bun (4x faster)
curl -fsSL https://bun.sh/install | bash

# Reinstall with Bun
bun install -g @xagent/one-shot
```

**3. Large context loaded**

- Start fresh session
- Be more specific in requests
- Check token usage in session files

**4. Wrong model**

```bash
# Use faster model via environment variable
export GROK_MODEL="grok-4-fast-non-reasoning"
grok
```

> **Parity Gap**: Grok One-Shot does not have interactive model switching (Ctrl+M) like Claude Code.

### AI responses are incomplete

**Causes:**

- Network interruption
- Token limit reached
- API timeout

**Solutions:**

```
> Continue from where you left off

> Try that again, but shorter

# Or start new session
grok
```

### "Too many tool rounds" error

**Cause:** Hit MAX_TOOL_ROUNDS limit (default: 400)

**Solutions:**

```bash
# Increase limit
export MAX_TOOL_ROUNDS=500

# Or break task into smaller pieces
# Or be more specific in request
```

## File operation issues

### "Error: requires interactive terminal"

**Cause:** Running in non-TTY environment

**Solutions:**

```bash
# Use headless mode
grok -p "your message"

# Or ensure proper TTY
# (don't redirect or run in scripts without -p flag)
```

### Changes not applied

**Causes:**

1. Rejected confirmation
2. File permissions
3. Git conflicts

**Solutions:**

```bash
# Check file permissions
ls -la <file>

# Check git status
git status

# Verify working directory
pwd
grok -d /correct/path
```

### Wrong files modified

**Prevention:**

- Review changes carefully
- Use specific file paths in requests
- Keep confirmations enabled
- Use git to track changes

**Recovery:**

```bash
# Git restore
git diff
git checkout -- <file>

# Or restore from backup
# Sessions saved in ~/.grok/sessions/
```

### File not found errors

**Causes:**

- Wrong working directory
- File doesn't exist
- Typo in filename

**Solutions:**

```bash
# Check current directory
pwd

# Change directory
grok -d /correct/path

# Verify file exists
ls <file>

# List directory contents
ls -la
```

> **Parity Gap**: Grok One-Shot does not have `/permissions` command for configuring approval prompts like Claude Code.

## MCP server issues

### MCP server won't start

**Symptoms:**

```
Failed to start MCP server: filesystem
```

**Solutions:**

```bash
# Test command independently
npx -y @modelcontextprotocol/server-filesystem /path

# Check permissions
ls -la /path

# Check settings file
cat ~/.grok/settings.json

# Verify dependencies installed
which npx
node --version

# Remove and re-add in settings
vim ~/.grok/settings.json
```

### MCP tools not available

**Causes:**

- Server started but failed tool discovery
- Tool schema invalid
- Server crashed after startup

**Solutions:**

```bash
# Check configured servers
cat ~/.grok/settings.json | grep mcpServers -A 20

# Check server command works
# (run the command manually)

# Restart Grok One-Shot
grok
> Use the [specific tool name] to ...
```

### Slow MCP performance

**Causes:**

- Server processing takes time
- Network latency (for remote servers)
- Large data transfers

**Solutions:**

- Use more specific requests
- Implement caching in custom servers
- Optimize server queries
- Consider local vs remote servers

> **Parity Gap**: Grok One-Shot does not have interactive MCP server status checks or OAuth authentication flows like Claude Code.

## Search and discovery issues

### Search not working

> **Parity Gap**: Grok One-Shot uses built-in search capabilities. System ripgrep installation may not be required, but can improve performance.

If search functionality seems limited:

**Optional: Install system ripgrep for better performance**

```bash
# macOS (Homebrew)
brew install ripgrep

# Windows (winget)
winget install BurntSushi.ripgrep.MSVC

# Ubuntu/Debian
sudo apt install ripgrep

# Alpine Linux
apk add ripgrep

# Arch Linux
pacman -S ripgrep
```

### Slow or incomplete search results on WSL

Disk read performance penalties when [working across file systems on WSL](https://learn.microsoft.com/en-us/windows/wsl/filesystems) may result in fewer-than-expected matches when using Grok One-Shot on WSL.

**Solutions:**

1. **Submit more specific searches**: Reduce the number of files searched by specifying directories or file types
2. **Move project to Linux filesystem**: Ensure your project is on the Linux filesystem (`/home/`) rather than Windows (`/mnt/c/`)
3. **Use native Windows instead**: Run Grok One-Shot natively on Windows for better file system performance

## IDE integration issues

> **Parity Gap**: Grok One-Shot does not have IDE integrations like Claude Code's VS Code or JetBrains plugins. It is a standalone CLI tool.

Grok One-Shot is a terminal-based tool and does not integrate directly with IDEs. However, you can:

- Use it in IDE integrated terminals
- Open files with your IDE using environment variables or commands
- Use it alongside your IDE workflow

### Terminal issues in IDEs

If you're using Grok One-Shot in IDE terminals (VS Code, JetBrains, etc.) and experiencing issues:

**ESC key not working in JetBrains terminals**

1. Go to Settings → Tools → Terminal
2. Either:

- Uncheck "Move focus to the editor with Escape", or
- Click "Configure terminal keybindings" and delete the "Switch focus to Editor" shortcut

3. Apply the changes

**Terminal display issues**

```bash
# Set terminal background
export TERM_BACKGROUND=dark # or 'light'

# Disable UX enhancements if needed
export GROK_UX_ENHANCED=false
export GROK_UX_MINIMAL=true
```

## Markdown formatting issues

Grok One-Shot sometimes generates markdown files with missing language tags on code fences, which can affect syntax highlighting and readability.

### Missing language tags in code blocks

If you notice code blocks like this in generated markdown:

````markdown
```
function example() \{
return "hello";
\}
```
````

Instead of properly tagged blocks like:

````markdown
```javascript
function example() \{
return "hello";
\}
```
````

**Solutions:**

1. **Ask Grok to add language tags**: Request "Please add appropriate language tags to all code blocks in this markdown file."

2. **Use post-processing**: Set up scripts or hooks to detect and add missing language tags after file generation

3. **Manual verification**: Review generated markdown files and request corrections

### Inconsistent spacing and formatting

If generated markdown has excessive blank lines or inconsistent spacing:

**Solutions:**

1. **Request formatting corrections**: Ask Grok to "Fix spacing and formatting issues in this markdown file."

2. **Use formatting tools**: Run markdown formatters like `prettier` on generated files

3. **Specify formatting preferences**: Include formatting requirements in your requests or project documentation

### Best practices for markdown generation

To minimize formatting issues:

- **Be explicit in requests**: Ask for "properly formatted markdown with language-tagged code blocks"
- **Use project conventions**: Document your preferred markdown style in `GROK.md`
- **Review before committing**: Check generated markdown files before adding to git

## Platform-specific issues

### macOS

**Issue:** Terminal color problems

```bash
export TERM_BACKGROUND=dark # or 'light'
```

**Issue:** Permission denied

```bash
# Don't use sudo with npm
# Configure user-level npm instead (see installation section)
```

### Windows

**Issue:** Git Bash compatibility

- Use Windows Terminal or PowerShell instead
- Install latest Git for Windows
- Consider WSL for better compatibility

**Issue:** Symlink errors (CLAUDE.md)

```bash
# Run as Administrator for symlink creation
# Or manually copy GROK.md to CLAUDE.md
cp GROK.md CLAUDE.md
```

### Linux

**Issue:** Old Node.js version

```bash
# Update Node.js via package manager
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Or use nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
```

## Common error messages

### "EACCES: permission denied"

**Solution:** Don't use sudo. Configure npm for user installs (see installation section).

### "ECONNREFUSED"

**Solution:** Check internet connection and API endpoint. Verify GROK_API_KEY is set.

### "Cannot find module"

**Solution:** Reinstall dependencies:

```bash
npm cache clean --force
npm install -g @xagent/one-shot
```

### "Maximum call stack size exceeded"

**Solution:** Reduce complexity of request or increase Node.js memory:

```bash
export NODE_OPTIONS="--max-old-space-size=4096"
```

## Debug mode

### Enable debugging

```bash
# Set debug flags
export GROK_DEBUG=true
export GROK_UX_DEBUG=true

# Run with debugging
grok

# Check startup log
cat xcli-startup.log
```

### Useful debug output

**Check settings:**

```bash
cat ~/.grok/settings.json
```

**Check sessions:**

```bash
ls -la ~/.grok/sessions/
cat ~/.grok/sessions/latest-session.json
```

**Check environment:**

```bash
printenv | grep GROK
printenv | grep MAX_TOOL_ROUNDS
printenv | grep NODE
```

## Getting more help

> **Parity Gap**: Grok One-Shot does not have `/bug` or `/doctor` commands like Claude Code.

If you're experiencing issues not covered here:

1. Check the [GitHub repository](https://github.com/your-org/grok) for known issues
2. Review `xcli-startup.log` in your current directory
3. Check session files in `~/.grok/sessions/`
4. Enable debug mode and review output
5. File an issue on GitHub with:

- Grok One-Shot version (`grok --version`)
- Operating system and version
- Node.js/Bun version (`node --version` or `bun --version`)
- Error message and stack trace
- Steps to reproduce
- Debug logs (`xcli-startup.log`)

### Reporting issues

**Template:**

```markdown
**Version:** grok 1.1.101
**OS:** macOS 13.5 / Ubuntu 22.04 / Windows 11
**Runtime:** Node.js 20.10.0 / Bun 1.0.0
**Error:** [error message]
**Steps to reproduce:**

1. ...
2. ...
   **Debug logs:** [attach xcli-startup.log]
   **Settings:** [relevant parts of ~/.grok/settings.json]
```

## See also

- [Quickstart Guide](../getting-started/quickstart.md) - Getting started
- [CLI Reference](../reference/cli-reference.md) - Command-line options
- [Configuration](../configuration/settings.md) - Settings guide
- [MCP Integration](./mcp.md) - MCP server setup

---

**Parity Note**: This troubleshooting guide is adapted from Claude Code documentation. Some features (native installer, IDE integrations, /doctor, /bug commands, OAuth flows) are not available in Grok One-Shot. The core troubleshooting principles still apply.
