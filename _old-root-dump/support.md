---
title: Getting Support
sidebar_position: 3
---

# Getting Support

Need help with Grok One-Shot? We're here to help! Choose the best support channel for your question.

## Quick Help

### 📚 Documentation First

Before reaching out, check if your question is covered in our documentation:

- **[Getting Started](/docs/getting-started/quickstart)** - Installation and first steps
- **[Configuration](/docs/configuration/settings)** - Settings and customization
- **[Features](/docs/features/plan-mode)** - Feature guides and examples
- **[Troubleshooting](/docs/build-with-claude-code/troubleshooting)** - Common issues and solutions

### 🔍 Search Existing Issues

Check if your question has already been asked:

- **[GitHub Issues](https://github.com/x-cli-team/grok-one-shot/issues)** - Known bugs and feature requests
- **[GitHub Discussions](https://github.com/x-cli-team/grok-one-shot/discussions)** - Community Q&A

## Support Channels

### 💬 Real-time Chat

For quick questions and community interaction:

**[Discord Server](https://discord.com/channels/1315720379607679066/1315822328139223064)**

- General questions and tips
- Community discussions
- Real-time help from other users
- Show off your Grok One-Shot workflows

### 🐛 Bug Reports

Found a bug? Help us fix it:

**[GitHub Issues](https://github.com/x-cli-team/grok-one-shot/issues)**

- Detailed bug reports with reproduction steps
- Include system information and error logs
- Feature requests with clear use cases
- Security vulnerabilities (use private reporting)

**What to Include:**

- Grok One-Shot version (`grok --version`)
- Operating system and version
- Node.js/Bun version
- Command that caused the issue
- Complete error message
- Steps to reproduce

### 💭 Feature Discussions

Want to discuss new features or improvements?

**[GitHub Discussions](https://github.com/x-cli-team/grok-one-shot/discussions)**

- Feature ideas and proposals
- Design discussions
- User experience feedback
- Integration suggestions

### 📧 Direct Contact

For sensitive issues or partnership inquiries:

- Security issues: Use GitHub's private vulnerability reporting
- Business inquiries: Contact through GitHub profile

## Common Issues

### Installation Problems

**Command not found after installation:**

```bash
# Check if installed globally
npm list -g @xagent/one-shot

# Reinstall globally
npm install -g @xagent/one-shot

# Or use npx
npx @xagent/one-shot --version
```

**Permission errors on macOS/Linux:**

```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm

# Or use a Node version manager like nvm
```

### API Key Issues

**"API key not found" error:**

```bash
# Set API key via command
grok -k "your-api-key"

# Or set environment variable
export GROK_API_KEY="your-api-key"

# Verify it's set
echo $GROK_API_KEY
```

### Connection Problems

**Network or proxy issues:**

```bash
# Set proxy if needed
export HTTP_PROXY="http://proxy.example.com:8080"
export HTTPS_PROXY="http://proxy.example.com:8080"

# Check connectivity
curl -I https://api.x.ai
```

### Performance Issues

**Slow responses:**

- Check your internet connection
- Try a different model: `grok -m grok-4-fast-non-reasoning`
- Reduce context with shorter prompts
- Clear session cache: `rm -rf ~/.grok/sessions/`

## Response Times

### Community Support

- **Discord**: Usually within hours during active times
- **GitHub Discussions**: 1-3 days for community responses
- **GitHub Issues**: 1-7 days depending on complexity

### What We Prioritize

1. **Security vulnerabilities** - Immediate attention
2. **Critical bugs** affecting core functionality
3. **Popular feature requests** with community support
4. **Documentation improvements**
5. **Enhancement requests**

## Self-Help Resources

### Debug Mode

Enable debug output for troubleshooting:

```bash
export GROK_DEBUG=true
grok your-command
```

### Configuration Check

Verify your configuration:

```bash
# View current settings
cat ~/.grok/settings.json

# Test basic functionality
grok "echo hello world"
```

### Update to Latest Version

Many issues are fixed in newer versions:

```bash
# Check current version
grok --version

# Update to latest
npm update -g @xagent/one-shot

# Or reinstall
npm uninstall -g @xagent/one-shot
npm install -g @xagent/one-shot
```

## Contributing to Support

### Help Other Users

- Answer questions in Discord
- Share solutions in GitHub Discussions
- Improve documentation with your learnings

### Report Documentation Issues

Found unclear or missing documentation?

- Open an issue with specific suggestions
- Submit a pull request with improvements

Thank you for being part of the Grok One-Shot community! 🙏
