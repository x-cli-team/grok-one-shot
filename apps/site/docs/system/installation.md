# 📦 Installation & Setup Guide

## Overview

Grok CLI is installed globally via npm and includes automated installation scripts to handle common issues.

**Development Note (Updated 2025-11-02)**: The project now uses Bun for development workflows, while maintaining npm compatibility for user installation and CI/CD pipelines.

## Installation Methods

### Automated Installation (Recommended)

Use the provided `install.sh` script for automatic handling of installation issues:

```bash
curl -fsSL https://raw.githubusercontent.com/x-cli-team/grok-one-shot/main/install.sh | bash
```

The script automatically:

- Detects and removes conflicting installations
- Tries multiple installation methods (npm, yarn, pnpm)
- Handles common npm cache and permission issues
- Cleans up failed installations

### Manual Installation

If automated installation fails, try manual methods:

#### Standard NPM Install (Recommended)

```bash
npm install -g @xagent/x-cli@latest
```

#### Try Without Installing

```bash
npx @xagent/x-cli@latest
```

#### Alternative Package Managers

```bash
# Yarn
yarn global add @xagent/x-cli@latest

# pnpm
pnpm add -g @xagent/x-cli@latest

# Bun (Recommended for speed)
bun add -g @xagent/x-cli@latest

# Bun alternative (latest)
bun x @xagent/x-cli@latest
```

#### Force Installation (if needed)

```bash
npm install -g @xagent/x-cli --force
```

## Post-Installation Setup

### 1. Verify Installation

```bash
grok --version
```

### 2. Set API Key

```bash
# Environment variable (recommended)
export GROK_API_KEY=your_api_key_here

# Save permanently to shell profile
echo 'export GROK_API_KEY=your_api_key_here' >> ~/.zshrc
source ~/.zshrc

# Or save permanently (bash users)
echo 'export GROK_API_KEY=your_api_key_here' >> ~/.bashrc
source ~/.bashrc
```

### 3. PATH Setup (If "command not found")

```bash
# Add npm global bin to PATH (macOS/Linux)
echo 'export PATH="$(npm config get prefix)/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Verify it works
which grok
grok --version
```

### 3. Get Started

```bash
grok --help
```

### 4. First Run

```bash
grok
```

This launches the interactive chat interface.

## Troubleshooting

### Common Installation Issues

- **Permission errors**: Try with `sudo` or use a Node version manager
- **Cache issues**: The install script automatically cleans npm cache
- **Stuck installations**: Script kills running processes and removes old files

### Manual Cleanup

If needed, manually clean before reinstalling:

```bash
# Kill running processes
pkill -f grok

# Remove installation
npm uninstall -g @xagent/x-cli

# Clean cache
npm cache clean --force
```

### Alternative Installation

Download pre-built binaries from: https://github.com/x-cli-team/grok-one-shot/releases

## Requirements

- Node.js (latest LTS recommended)
- npm, yarn, or pnpm
- Internet connection for API access
