---
title: Advanced Installation
---

# Advanced Installation

Advanced installation scenarios and configurations for complex environments.

## Overview

This guide covers advanced installation methods, multi-version management, custom builds, and troubleshooting for complex environments.

## Installation Methods

### Standard Installation

**Via npm:**

```bash
npm install -g @xagent/one-shot
```

**Via Bun (recommended for performance):**

```bash
bun install -g @xagent/one-shot
```

**Via Yarn:**

```bash
yarn global add @xagent/one-shot
```

**Via pnpm:**

```bash
pnpm add -g @xagent/one-shot
```

### From Source

**Clone and build:**

```bash
# Clone repository
git clone https://github.com/grok-team/grok.git
cd grok

# Install dependencies
bun install # or npm install

# Build
bun run build

# Link globally
bun link

# Verify
grok --version
```

**Benefits:**

- Latest unreleased features
- Ability to modify code
- Contribute to development

**Drawbacks:**

- Manual updates
- Potential instability
- Build dependencies required

### Specific Version Installation

**Install specific version:**

```bash
npm install -g @xagent/one-shot@1.1.101
```

**Pin version in package.json:**

```json
{
  "devDependencies": {
    "@xagent/one-shot": "1.1.101"
  }
}
```

**Why pin versions:**

- Reproducible builds
- Avoid breaking changes
- Team consistency

### User-Level Installation (Without sudo)

**Problem:** Global install requires sudo

**Solution 1: Configure npm prefix**

```bash
# Create directory for global packages
mkdir ~/.npm-global

# Configure npm to use it
npm config set prefix '~/.npm-global'

# Add to PATH
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

# Install without sudo
npm install -g @xagent/one-shot
```

**Solution 2: Use npx**

```bash
# Run without installation
npx @xagent/one-shot

# Add alias for convenience
echo 'alias grok="npx @xagent/one-shot"' >> ~/.bashrc
```

**Solution 3: Use Bun (no sudo needed)**

```bash
# Bun installs to user directory by default
bun install -g @xagent/one-shot
```

## Multi-Version Management

### nvm (Node Version Manager)

**Install nvm:**

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
```

**Use different Node.js versions:**

```bash
# Install Node.js versions
nvm install 18
nvm install 20

# Use Node 20 for Grok One-Shot
nvm use 20
npm install -g @xagent/one-shot

# Switch versions
nvm use 18 # Different project
nvm use 20 # Back to Grok One-Shot
```

### Multiple Grok Versions

**Scenario:** Test new version while keeping stable version

**Approach 1: npm aliases**

```bash
# Install stable version
npm install -g @xagent/one-shot@1.1.101

# Install beta to different location
npm install -g @xagent/one-shot@beta --prefix ~/.local/beta-xagent

# Create aliases
alias grok-stable='grok'
alias grok-beta='~/.local/beta-xagent/bin/grok'
```

**Approach 2: npx with version**

```bash
# Use specific version via npx
npx @xagent/one-shot@1.1.101 "query"
npx @xagent/one-shot@latest "query"
```

## Platform-Specific Installation

### macOS

**Homebrew (if available):**

```bash
# Currently not in Homebrew
# Use npm or Bun
brew install node # or: brew install bun
npm install -g @xagent/one-shot
```

**M1/M2 (Apple Silicon):**

```bash
# Works natively on Apple Silicon
# No Rosetta needed
bun install -g @xagent/one-shot
```

**Multiple shells (bash/zsh/fish):**

```bash
# Bash
echo 'export GROK_API_KEY="your-key"' >> ~/.bashrc

# Zsh (macOS default)
echo 'export GROK_API_KEY="your-key"' >> ~/.zshrc

# Fish
echo 'set -x GROK_API_KEY "your-key"' >> ~/.config/fish/config.fish
```

### Windows

**PowerShell:**

```powershell
# Install Node.js from nodejs.org
# Or use Bun
npm install -g @xagent/one-shot

# Set environment variable (persistent)
[System.Environment]::SetEnvironmentVariable('GROK_API_KEY', 'your-key', 'User')

# Or set in current session
$env:GROK_API_KEY = "your-key"
```

**Git Bash:**

```bash
npm install -g @xagent/one-shot
echo 'export GROK_API_KEY="your-key"' >> ~/.bashrc
```

**WSL (Windows Subsystem for Linux):**

```bash
# Use Linux installation method
curl -fsSL https://bun.sh/install | bash
bun install -g @xagent/one-shot
```

**Scoop (package manager):**

```powershell
# Currently not in Scoop
# Use npm/Bun
scoop install nodejs
npm install -g @xagent/one-shot
```

**Chocolatey:**

```powershell
# Currently not in Chocolatey
# Use npm/Bun
choco install nodejs
npm install -g @xagent/one-shot
```

### Linux

**Debian/Ubuntu:**

```bash
# Install Node.js 20 (recommended)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Or install Bun
curl -fsSL https://bun.sh/install | bash

# Install Grok One-Shot
npm install -g @xagent/one-shot
# or: bun install -g @xagent/one-shot
```

**Fedora/RHEL/CentOS:**

```bash
# Install Node.js
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs

# Install Grok One-Shot
npm install -g @xagent/one-shot
```

**Arch Linux:**

```bash
# Install Node.js
sudo pacman -S nodejs npm

# Install Grok One-Shot
npm install -g @xagent/one-shot
```

**Alpine Linux (Docker):**

```bash
# Minimal installation for containers
apk add --no-cache nodejs npm
npm install -g @xagent/one-shot
```

## Enterprise Installation

### Centralized Deployment

**Deploy to all developer workstations:**

```bash
#!/bin/bash
# deploy-xagent.sh

# Check if installed
if ! command -v grok &> /dev/null; then
echo "Installing Grok One-Shot..."
npm install -g @xagent/one-shot@1.1.101
fi

# Configure
if [ ! -f ~/.grok/settings.json ]; then
mkdir -p ~/.grok
cp /shared/config/grok-settings.json ~/.grok/settings.json
fi

# Verify
grok --version
echo " Grok One-Shot ready"
```

**Deploy via configuration management:**

**Ansible:**

```yaml
# playbook.yml
- name: Install Grok One-Shot
hosts: developers
tasks:
- name: Install via npm
npm:
name: "@xagent/one-shot"
global: yes
version: "1.1.101"

- name: Copy settings template
copy:
src: grok-settings.json
dest: ~/.grok/settings.json
mode: "0600"
```

**Puppet:**

```puppet
package { '@xagent/one-shot':
ensure => '1.1.101',
provider => 'npm',
}

file { '/home/user/.grok/settings.json':
ensure => file,
content => template('xagent/settings.json.erb'),
mode => '0600',
}
```

### Air-Gapped Environments

**Scenario:** No internet access on target systems

**Approach 1: npm pack**

```bash
# On internet-connected system
npm pack @xagent/one-shot
# Creates: xagent-one-shot-1.1.101.tgz

# Transfer file to air-gapped system
# On air-gapped system
npm install -g ./xagent-one-shot-1.1.101.tgz
```

**Approach 2: Private npm registry**

```bash
# Set up Verdaccio or Artifactory
# Mirror @xagent/one-shot package

# On air-gapped system, point to private registry
npm config set registry http://internal-npm.company.com
npm install -g @xagent/one-shot
```

**Approach 3: Build from source**

```bash
# On internet-connected system
git clone https://github.com/grok-team/grok.git
cd grok
npm install
npm run build
tar -czf grok-built.tar.gz dist/ node_modules/ package.json

# Transfer to air-gapped system
# Extract and link
tar -xzf grok-built.tar.gz
npm link
```

## Custom Builds

### Modify Source

**Scenario:** Need custom features or patches

**Steps:**

```bash
# 1. Clone and setup
git clone https://github.com/grok-team/grok.git
cd grok
git checkout -b custom-features
bun install

# 2. Make changes
vim src/agent/grok-agent.ts # Your modifications

# 3. Build
bun run build

# 4. Test
bun run dist/index.js --version

# 5. Link globally
bun link

# Verify
grok --version # Should show your custom build
```

**Maintain custom fork:**

```bash
# Keep up to date with upstream
git remote add upstream https://github.com/grok-team/grok.git
git fetch upstream
git rebase upstream/main

# Resolve conflicts, rebuild
bun run build
```

### Build Flags and Options

**Optimize for production:**

```bash
# Build with optimization
NODE_ENV=production bun run build

# Minify output
# (Already configured in tsup.config.ts)

# Bundle dependencies
# (Already bundled)
```

### Platform-Specific Builds

**Cross-platform considerations:**

```bash
# Build includes platform-specific shims
# No additional steps needed

# Test on target platform
npm run build
npm pack
# Transfer to target and test
```

## Proxy and Firewall Configuration

### Corporate Proxy

**Configure npm to use proxy:**

```bash
# HTTP proxy
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080

# With authentication
npm config set proxy http://user:pass@proxy.company.com:8080

# Install through proxy
npm install -g @xagent/one-shot
```

**Configure Grok One-Shot API requests:**

```bash
# Set proxy for API requests (if needed)
export HTTP_PROXY=http://proxy.company.com:8080
export HTTPS_PROXY=http://proxy.company.com:8080
```

### SSL Certificate Issues

**Problem:** Corporate SSL interception

**Solution:**

```bash
# Option 1: Add custom CA (recommended)
export NODE_EXTRA_CA_CERTS=/path/to/corporate-ca.pem

# Option 2: Disable SSL verification (insecure, not recommended)
export NODE_TLS_REJECT_UNAUTHORIZED=0
```

## Dependency Management

### Isolated Installations

**Use npm workspaces:**

```bash
# Project-specific installation
cd my-project
npm install @xagent/one-shot --save-dev

# Use via npx
npx grok

# Or via npm script
# package.json
{
"scripts": {
"grok": "grok"
}
}

npm run grok
```

### Vendoring Dependencies

**Bundle everything for offline use:**

```bash
# Create vendor directory
mkdir vendor
cd vendor

# Download package and all dependencies
npm pack @xagent/one-shot
npm pack $(npm view @xagent/one-shot dependencies | jq -r 'keys[]')

# Install from vendor directory
npm install -g ./vendor/@xagent-one-shot-*.tgz --ignore-scripts
```

## Verification and Testing

### Installation Verification

**Comprehensive check:**

```bash
# 1. Command exists
command -v grok
which grok

# 2. Version correct
grok --version

# 3. Help displays
grok --help

# 4. Can access API
export GROK_API_KEY="test-key"
grok -p "echo test" || echo "API test failed"

# 5. Settings file created
ls -la ~/.grok/settings.json
```

### Integration Testing

**Test in actual environment:**

```bash
# Test headless mode
grok -p "list files in current directory"

# Test interactive mode
echo "list files" | grok

# Test with confirmations
grok toggle-confirmations
```

## Troubleshooting

### Common Issues

**Problem:** `EACCES: permission denied`

**Solution:**

```bash
# Don't use sudo
# Configure user-level npm instead (see above)
```

**Problem:** `command not found: grok`

**Solution:**

```bash
# Add to PATH
export PATH="$PATH:$(npm bin -g)"

# Or reinstall
npm install -g @xagent/one-shot
```

**Problem:** `Cannot find module`

**Solution:**

```bash
# Clear npm cache
npm cache clean --force

# Reinstall
npm uninstall -g @xagent/one-shot
npm install -g @xagent/one-shot
```

**Problem:** Slow installation

**Solution:**

```bash
# Use Bun (4x faster)
bun install -g @xagent/one-shot

# Or use fast npm registry mirror
npm config set registry https://registry.npmmirror.com
npm install -g @xagent/one-shot
npm config set registry https://registry.npmjs.org # Restore
```

### Platform-Specific Issues

**macOS: Permission errors with npm**

```bash
# Fix npm permissions
sudo chown -R $(whoami) $(npm config get prefix)/{lib/node_modules,bin,share}
```

**Windows: Long path issues**

```bash
# Enable long paths in Git for Windows
git config --system core.longpaths true
```

**Linux: Old Node.js version**

```bash
# Update Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

## Upgrade and Rollback

### Upgrade

```bash
# Check current version
grok --version

# Upgrade to latest
npm update -g @xagent/one-shot

# Or specific version
npm install -g @xagent/one-shot@1.2.0

# Verify
grok --version
```

### Rollback

```bash
# Uninstall current
npm uninstall -g @xagent/one-shot

# Install previous version
npm install -g @xagent/one-shot@1.1.101

# Verify
grok --version
```

## See Also

- [Quickstart Guide](../getting-started/quickstart.md) - Basic installation
- [Deployment Overview](../deployment/overview.md) - Deployment strategies
- [Settings](../configuration/settings.md) - Configuration details
- [Troubleshooting](../build-with-claude-code/troubleshooting.md) - Common issues

---

Advanced installation methods provide flexibility for complex enterprise and development environments.
