---
title: 📦 Installation & Setup Guide
---

# 📦 Installation & Setup Guide

## Overview

Grok One-Shot is installed globally via npm and includes automated installation scripts to handle common issues.

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
npm install -g @xagent/one-shot@latest
```

#### Try Without Installing

```bash
npx @xagent/one-shot@latest
```

#### Alternative Package Managers

```bash
# Yarn
yarn global add @xagent/one-shot@latest

# pnpm
pnpm add -g @xagent/one-shot@latest

# Bun
bun add -g @xagent/one-shot@latest
```

#### Force Installation (if needed)

```bash
npm install -g @xagent/one-shot --force
```

## Post-Installation Setup

### 1. Verify Installation

```bash
grok-one-shot --version
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
which grok-one-shot
grok-one-shot --version
```

### 3. Get Started

```bash
grok-one-shot --help
```

### 4. First Run

```bash
grok-one-shot
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
npm uninstall -g @xagent/one-shot

# Clean cache
npm cache clean --force
```

### Alternative Installation

Download pre-built binaries from: https://github.com/x-cli-team/grok-one-shot/releases

## Requirements

- Node.js (latest LTS recommended)
- npm, yarn, or pnpm
- Internet connection for API access
