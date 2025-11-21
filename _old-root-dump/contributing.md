---
title: Contributing
sidebar_position: 2
---

# Contributing to Grok One-Shot

We welcome contributions from the community! Whether you're fixing bugs, adding features, improving documentation, or sharing feedback, every contribution helps make Grok One-Shot better.

## Ways to Contribute

### 🐛 Report Bugs

Found a bug? Help us fix it by providing detailed information:

- **[GitHub Issues](https://github.com/x-cli-team/grok-one-shot/issues)** - Report bugs with detailed reproduction steps
- Include your OS, Node.js version, and Grok One-Shot version
- Provide command output and error messages
- Share minimal code examples that reproduce the issue

### 💡 Suggest Features

Have an idea for a new feature or improvement?

- **[GitHub Discussions](https://github.com/x-cli-team/grok-one-shot/discussions)** - Discuss feature ideas with the community
- Check existing issues to avoid duplicates
- Explain the use case and expected behavior
- Consider implementation complexity and backward compatibility

### 📖 Improve Documentation

Help make our documentation clearer and more comprehensive:

- Fix typos and grammatical errors
- Add examples and use cases
- Improve explanations of complex features
- Add missing documentation for new features

### 🔧 Code Contributions

Ready to dive into the code? Here's how to get started:

## Development Setup

### Prerequisites

- Node.js 16+ or Bun
- Git
- Your favorite code editor

### Fork and Clone

```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/grok-one-shot.git
cd grok-one-shot

# Add the original repo as upstream
git remote add upstream https://github.com/x-cli-team/grok-one-shot.git
```

### Install Dependencies

```bash
# Using npm
npm install

# Using bun (recommended)
bun install
```

### Development Workflow

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Make your changes
# ...

# Test your changes
npm test

# Build the project
npm run build

# Commit your changes
git add .
git commit -m "feat: add your feature description"

# Push to your fork
git push origin feature/your-feature-name
```

### Pull Request Process

1. **Update your fork** with the latest changes from upstream
2. **Create a feature branch** from the main branch
3. **Make your changes** with clear, focused commits
4. **Test thoroughly** to ensure nothing breaks
5. **Update documentation** if needed
6. **Submit a pull request** with a clear description

## Code Guidelines

### Code Style

- Follow existing code formatting and style
- Use TypeScript for type safety
- Write clear, descriptive variable and function names
- Add JSDoc comments for public APIs

### Testing

- Write tests for new features and bug fixes
- Ensure all existing tests pass
- Test on multiple platforms when possible
- Include integration tests for user-facing features

### Commit Messages

Follow conventional commit format:

```
feat: add new feature
fix: resolve bug in feature
docs: update documentation
test: add missing tests
refactor: improve code structure
```

## Community Guidelines

### Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive feedback
- Respect different perspectives and experience levels

### Communication

- **[Discord](https://discord.com/channels/1315720379607679066/1315822328139223064)** - Real-time chat and questions
- **[GitHub Discussions](https://github.com/x-cli-team/grok-one-shot/discussions)** - Feature discussions and Q&A
- **[GitHub Issues](https://github.com/x-cli-team/grok-one-shot/issues)** - Bug reports and feature requests

## Recognition

Contributors are recognized in:

- GitHub contributors page
- Release notes for significant contributions
- Special thanks in documentation
- Community Discord channel

## Getting Help

Need help with contributing? Reach out:

- Ask in Discord for real-time help
- Post in GitHub Discussions for detailed questions
- Tag maintainers in issues for urgent matters

Thank you for contributing to Grok One-Shot! 🚀
