---
title: Development Setup
sidebar_position: 2
---

# Development Setup

Get your local development environment ready for contributing to Grok One-Shot.

## Prerequisites

### Required

- **Node.js 18+** (recommend 20+)
- **Bun** (package manager and runtime)
- **Git** for version control
- **VS Code** (recommended) with suggested extensions

### Recommended

- **Terminal** with good TypeScript/Node.js support
- **GitHub CLI** for pull request management

## Quick Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/x-cli-team/grok-one-shot.git
cd grok-one-shot

# Install dependencies
bun install

# Verify setup
bun run typecheck
bun test
```

### 2. Development Commands

```bash
# Development mode (hot reload)
bun run dev

# Build for production
bun run build

# Run tests
bun test

# Type checking
bun run typecheck

# Linting
bun run lint
```

### 3. Environment Setup

Create your development configuration:

```bash
# Set up API key for testing
export GROK_API_KEY="your-development-key"

# Optional: Use development model
export GROK_MODEL="grok-4-fast-non-reasoning"
```

## Project Structure

```
grok-one-shot/
├── src/                    # Source code
│   ├── agent/             # Core AI agent logic
│   ├── commands/          # CLI subcommands
│   ├── hooks/             # React hooks
│   ├── mcp/               # MCP integration
│   ├── services/          # Business logic
│   ├── ui/                # Terminal UI components
│   └── utils/             # Shared utilities
├── apps/
│   └── site/              # Documentation site
├── .agent/                # Agent documentation
│   ├── docs/              # Comprehensive docs
│   └── system/            # System configuration
├── tests/                 # Test files
└── scripts/               # Build and utility scripts
```

## Development Workflow

### 1. Feature Development

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and test
bun run dev
# Test your changes...

# Run full test suite
bun run typecheck
bun test
bun run lint
```

### 2. Testing Changes

```bash
# Run in development mode
bun run dev

# Test specific functionality
bun run dev -- "test specific feature"

# Test with different models
GROK_MODEL=grok-4-fast bun run dev
```

### 3. Documentation

```bash
# Start documentation site
cd apps/site
npm run start

# View at http://localhost:3000
```

## VS Code Setup

### Recommended Extensions

Install these extensions for the best development experience:

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-json"
  ]
}
```

### Settings

Add to your VS Code settings:

```json
{
  "typescript.preferences.quoteStyle": "single",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

## Debugging

### Development Debugging

```bash
# Run with debug output
DEBUG=grok:* bun run dev

# Specific debug namespaces
DEBUG=grok:agent bun run dev
DEBUG=grok:mcp bun run dev
```

### VS Code Debugging

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Grok One-Shot",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/src/index.ts",
      "runtimeExecutable": "bun",
      "runtimeArgs": ["--inspect"],
      "env": {
        "NODE_ENV": "development",
        "GROK_API_KEY": "your-dev-key"
      }
    }
  ]
}
```

## Testing

### Unit Tests

```bash
# Run all tests
bun test

# Run specific test file
bun test src/agent/grok-agent.test.ts

# Watch mode
bun test --watch
```

### Integration Tests

```bash
# Test with real API (requires GROK_API_KEY)
GROK_API_KEY=your-key bun test integration

# Test MCP integration
bun test mcp
```

## Building

### Local Build

```bash
# Build for production
bun run build

# Test the built version
node dist/index.js --help
```

### Distribution

```bash
# Create distribution package
npm pack

# Test global installation
npm install -g ./xagent-one-shot-*.tgz
```

## Common Issues

### Bun Installation Issues

```bash
# Install bun via npm if curl fails
npm install -g bun

# Or use specific version
npm install -g bun@1.0.0
```

### TypeScript Issues

```bash
# Clear TypeScript cache
rm -rf node_modules/.cache
bun install

# Restart TypeScript server in VS Code
Cmd+Shift+P > "TypeScript: Restart TS Server"
```

### API Key Issues

```bash
# Verify API key is set
echo $GROK_API_KEY

# Test API connectivity
grok -p "test connection"
```

## Next Steps

1. **Read the [Contributing Guide](../community/contributing)**
2. **Explore the [Architecture Overview](../architecture/overview)**
3. **Check out open [Good First Issues](https://github.com/x-cli-team/grok-one-shot/labels/good%20first%20issue)**
4. **Join the [Developer Discord](https://discord.gg/grok-one-shot)**

Ready to contribute? Start with a small change and work your way up to larger features!
