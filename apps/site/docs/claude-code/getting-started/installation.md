# Installation

Get Grok One-Shot running in under 2 minutes with our simple installation process.

## Prerequisites

- **Node.js 18+** or **Bun** runtime
- **Terminal** with 256-color support
- **Grok API key** from [console.x.ai](https://console.x.ai)

## Quick Install

**Using npm (Node.js):**

```bash
npm install -g @xagent/one-shot
```

**Using Bun (Recommended - 4x faster):**

```bash
bun install -g @xagent/one-shot
```

**Verify installation:**

```bash
grok --version
```

## Get Your API Key

1. Visit [console.x.ai](https://console.x.ai)
2. Sign in or create an account
3. Navigate to "API Keys" section
4. Click "Create new API key"
5. Copy the key (starts with `xai-`)

## Configure API Key

**Option 1: Environment Variable (Recommended)**

```bash
# Add to ~/.bashrc, ~/.zshrc, or equivalent
export GROK_API_KEY="xai-your-actual-key-here"

# Reload your shell
source ~/.bashrc  # or ~/.zshrc
```

**Option 2: One-time Setup**

```bash
# Set for current session only
export GROK_API_KEY="xai-your-key-here"
```

**Option 3: Settings File**

```bash
# Create settings file
mkdir -p ~/.grok
echo '{"apiKey":"xai-your-key-here"}' > ~/.grok/settings.json
```

## Start Using Grok One-Shot

```bash
# Navigate to your project
cd your-project

# Start interactive mode
grok

# Or run a one-time command
grok "what does this project do?"
```

## First Run

On first launch, you'll see the welcome screen:

```
Welcome to X-CLI v1.1.105

Claude Code-level intelligence in your terminal!

Interactive Chat:

Ask me anything! Try:
• "What files are in this directory?"
• "Fix the bug in user-service.ts"
• "Add tests for the authentication module"

Power Features:

• Plan Mode: Press Shift+Tab twice for read-only exploration
• Project memory: Create GROK.md to customize behavior
• MCP integration: Connect external tools and services
```

## Troubleshooting

### Command not found

If `grok` command isn't found after installation:

```bash
# Check if global bin directory is in PATH
npm bin -g  # or: bun bin -g

# Add to PATH if needed (replace with your actual path)
export PATH="$PATH:$(npm bin -g)"
```

### Permission errors

```bash
# Fix npm permissions (macOS/Linux)
sudo chown -R $(whoami) $(npm config get prefix)/{lib/node_modules,bin,share}

# Or use a Node version manager
# nvm, n, or fnm are recommended
```

### API key issues

```bash
# Verify key is set
echo $GROK_API_KEY

# Test with explicit key
grok -k "xai-your-key" "hello"
```

### Installation fails

```bash
# Clear npm cache
npm cache clean --force

# Try with verbose logging
npm install -g @xagent/one-shot --verbose

# Alternative: Use npx without global install
npx @xagent/one-shot
```

## Advanced Installation

### Using Package Managers

**macOS - Homebrew (Coming Soon):**

```bash
# Not yet available - use npm/bun for now
# brew install grok-one-shot
```

**Linux - APT (Coming Soon):**

```bash
# Not yet available - use npm/bun for now
# apt install grok-one-shot
```

### Docker Installation

```bash
# Pull the image
docker pull xagent/one-shot:latest

# Run interactively
docker run -it \
  -e GROK_API_KEY="your-key" \
  -v $(pwd):/workspace \
  -w /workspace \
  xagent/one-shot:latest
```

### Development Installation

```bash
# Clone the repository
git clone https://github.com/x-cli-team/grok-one-shot.git
cd grok-one-shot

# Install dependencies
npm install  # or: bun install

# Build and link locally
npm run build
npm link

# Or run directly
npm start  # or: bun start
```

## Next Steps

**Learn the Basics:**

- [Quickstart Guide](./quickstart.md) - 5-minute tutorial
- [Common Workflows](./common-workflows.md) - Step-by-step examples

**Configure Your Setup:**

- [Settings](../configuration/settings.md) - Customize behavior
- [MCP Integration](../build-with-claude-code/mcp.md) - Add external tools

**Get Help:**

- [CLI Reference](../reference/cli-reference.md) - Complete command guide
- [Troubleshooting](../build-with-claude-code/troubleshooting.md) - Common issues

---

**Ready to start coding with AI?** Continue to [Quickstart](./quickstart.md) →
