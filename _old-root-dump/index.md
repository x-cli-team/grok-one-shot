---
title: Developer Resources
sidebar_position: 1
---

# Developer Resources

Welcome to the Grok One-Shot developer hub. Here you'll find everything you need to build with, extend, and contribute to Grok One-Shot.

## Quick Links

### 🛠️ Development Setup

- [Development Setup](./setup) - Get your local development environment ready
- [Contributing Guide](../community/contributing) - How to contribute to Grok One-Shot
- [Architecture Overview](../architecture/overview) - Understand how Grok One-Shot works

### 🔧 Building with Grok One-Shot

- [MCP Integration](../build-with-claude-code/mcp) - Connect external tools and services
- [Hooks System](../build-with-claude-code/hooks) - Automate workflows with hooks
- [Configuration](../configuration/settings) - Advanced configuration options

### 📖 API Reference

- [CLI Reference](../reference/cli-reference) - Complete command-line interface
- [Environment Variables](../configuration/settings#environment-variables) - Configuration via environment
- [Settings Schema](../configuration/settings#settings-schema) - JSON configuration format

## Development Workflow

### Local Development

1. **Clone the repository**

   ```bash
   git clone https://github.com/x-cli-team/grok-one-shot.git
   cd grok-one-shot
   ```

2. **Install dependencies**

   ```bash
   bun install
   ```

3. **Run in development mode**
   ```bash
   bun run dev
   ```

### Contributing Code

- Follow the [Contributing Guide](../community/contributing)
- Check the [Development Setup](./setup) for detailed instructions
- Review [Architecture](../architecture/overview) to understand the codebase

### Testing

- Run tests: `bun test`
- Build locally: `bun run build`
- Check types: `bun run typecheck`

## Extension Points

### MCP Servers

Extend Grok One-Shot capabilities by creating Model Context Protocol servers:

- File system tools
- API integrations
- Database connections
- Custom business logic

### Configuration

Customize behavior through:

- User settings (`~/.grok/settings.json`)
- Project settings (`.grok/settings.json`)
- Environment variables
- Command-line flags

## Resources

### Documentation

- [Getting Started](../getting-started/overview) - User guide
- [Features](../features/context-management) - Detailed feature documentation
- [Configuration](../configuration/settings) - Setup and customization

### Community

- [Discord Community](https://discord.gg/grok-one-shot) - Chat with developers
- [GitHub Issues](https://github.com/x-cli-team/grok-one-shot/issues) - Report bugs and request features
- [Discussions](https://github.com/x-cli-team/grok-one-shot/discussions) - General discussions

## Support

Need help with development?

- Check our [Troubleshooting Guide](../build-with-claude-code/troubleshooting)
- Ask in [Discord #developers](https://discord.gg/grok-one-shot)
- Create a [GitHub Discussion](https://github.com/x-cli-team/grok-one-shot/discussions)
