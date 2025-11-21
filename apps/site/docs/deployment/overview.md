---
title: Deployment Overview
---

# Deployment Overview

Deploy and manage Grok One-Shot in various environments.

## Overview

Grok One-Shot supports deployment in development, CI/CD, containerized, and team environments. This guide covers installation, configuration, and best practices for each scenario.

## Deployment Scenarios

### 1. Local Development

**Best for:** Individual developers, learning, experimentation

**Installation:**

```bash
# Via npm
npm install -g @xagent/one-shot

# Via Bun (faster)
bun install -g @xagent/one-shot

# Verify
grok --version
```

**Configuration:**

```bash
# Set API key
export GROK_API_KEY="your-key"

# Add to shell profile
echo 'export GROK_API_KEY="your-key"' >> ~/.bashrc
source ~/.bashrc
```

**Pros:**

- Quick setup
- Full interactive features
- Easy updates

**Cons:**

- Manual configuration
- Not team-synchronized

### 2. Team Environment

**Best for:** Development teams, shared standards

**Approach:** Shared configuration with individual API keys

**Setup:**

1. **Create team configuration template:**

```bash
# team-config/.grok-template.json
{
"model": "grok-2-1212",
"confirmations": true,
"mcpServers": {
"filesystem": {
"command": "npx",
"args": ["-y", "@modelcontextprotocol/server-filesystem", "/workspace"]
}
}
}
```

2. **Team member setup:**

```bash
# Clone template
cp team-config/.grok-template.json ~/.grok/settings.json

# Add personal API key
grok -k "personal-api-key"
```

3. **Document in team README:**

```markdown
## Grok One-Shot Setup

1. Install: `npm install -g @xagent/one-shot`
2. Copy config: `cp team-config/.grok-template.json ~/.grok/settings.json`
3. Set API key: `export GROK_API_KEY="your-key"`
4. Test: `grok --version`
```

**Pros:**

- Consistent team configuration
- Individual API keys (cost tracking)
- Easy onboarding

**Cons:**

- Manual synchronization
- Configuration drift possible

### 3. CI/CD Environment

**Best for:** Automated checks, PR analysis, code generation

**Setup in CI pipeline:**

```yaml
# .github/workflows/ai-checks.yml
name: AI Code Checks

on: [pull_request]

jobs:
ai-review:
runs-on: ubuntu-latest
steps:
- uses: actions/checkout@v3

- name: Install Grok One-Shot
run: npm install -g @xagent/one-shot

- name: AI Code Review
env:
GROK_API_KEY: ${{ secrets.GROK_API_KEY }}
run: |
grok -p "Review PR for security issues and code quality" > review.txt
cat review.txt

- name: Comment PR
uses: actions/github-script@v6
with:
script: |
const fs = require('fs');
const review = fs.readFileSync('review.txt', 'utf8');
github.rest.issues.createComment({
issue_number: context.issue.number,
owner: context.repo.owner,
repo: context.repo.repo,
body: '## AI Code Review\n\n' + review
});
```

**Security considerations:**

- Use repository secrets for API keys
- Limit API key permissions
- Set token usage limits
- Monitor costs

**Pros:**

- Automated consistency
- Scales with team
- No manual intervention

**Cons:**

- API costs per run
- Requires secret management
- Network dependency

### 4. Docker Container

**Best for:** Consistent environments, cloud deployments

**Dockerfile:**

```dockerfile
FROM node:20-alpine

# Install Grok One-Shot
RUN npm install -g @xagent/one-shot

# Set working directory
WORKDIR /workspace

# Environment variables
ENV GROK_MODEL=grok-2-1212
ENV GROK_UX_MINIMAL=true

# API key passed at runtime
ENV GROK_API_KEY=""

# Default command
CMD ["grok"]
```

**Build and run:**

```bash
# Build image
docker build -t grok-oneshot:latest .

# Run interactively
docker run -it \
-e GROK_API_KEY="your-key" \
-v $(pwd):/workspace \
grok-oneshot:latest

# Run headless
docker run \
-e GROK_API_KEY="your-key" \
-v $(pwd):/workspace \
grok-oneshot:latest \
grok -p "analyze code"
```

**Docker Compose:**

```yaml
version: "3.8"
services:
grok-oneshot:
image: grok-oneshot:latest
environment:
  - GROK_API_KEY=${GROK_API_KEY}
  - GROK_MODEL=grok-2-1212
volumes:
  - ./:/workspace
stdin_open: true
tty: true
```

**Pros:**

- Consistent environment
- Easy distribution
- Isolated dependencies

**Cons:**

- Added complexity
- Requires Docker knowledge
- Volume mapping needed

### 5. Remote Server

**Best for:** Team access, centralized execution

**Setup on server:**

```bash
# SSH to server
ssh user@server

# Install Node.js/Bun
curl -fsSL https://bun.sh/install | bash

# Install Grok One-Shot
bun install -g @xagent/one-shot

# Configure
export GROK_API_KEY="team-key"
echo 'export GROK_API_KEY="team-key"' >> ~/.bashrc
```

**Team access:**

```bash
# SSH with TTY forwarding
ssh -t user@server "grok"

# Or use tmux for persistent sessions
ssh user@server
tmux new -s grok
grok
# Detach: Ctrl+B, D
# Reattach: tmux attach -t grok
```

**Pros:**

- Centralized API key management
- Shared computing resources
- Persistent sessions

**Cons:**

- Network latency
- SSH access required
- Server maintenance needed

## Configuration Management

### Environment Variables

**Recommended for CI/CD and containers:**

```bash
# Essential
export GROK_API_KEY="xai-xxxxxxxxxxxxx"

# Optional
export GROK_MODEL="grok-2-1212"
export GROK_BASE_URL="https://api.x.ai/v1"
export MAX_TOOL_ROUNDS=400

# Performance
export GROK_UX_MINIMAL=true # For headless environments
```

### Settings File

**Recommended for development:**

```json
{
  "apiKey": "xai-xxxxxxxxxxxxx",
  "model": "grok-2-1212",
  "confirmations": true,
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/workspace"]
    }
  }
}
```

**Location:** `~/.grok/settings.json`

### Hybrid Approach

**Base config in settings.json, overrides via environment:**

```bash
# Base settings in ~/.grok/settings.json
# Override model for specific task
GROK_MODEL=grok-4-fast-non-reasoning grok -p "quick query"
```

## Security Best Practices

### API Key Management

**DO:**

- Use environment variables in CI/CD
- Store in secrets management (GitHub Secrets, HashiCorp Vault)
- Rotate keys periodically
- Use separate keys per environment
- Monitor usage and costs

**DON'T:**

- Commit API keys to git
- Share keys in team chat
- Use production keys in development
- Hard-code keys in scripts
- Leave keys in shell history

### Example: GitHub Secrets

```bash
# Add secret via GitHub UI
# Settings → Secrets → Actions → New repository secret
# Name: GROK_API_KEY
# Value: xai-xxxxxxxxxxxxx

# Use in workflow
env:
GROK_API_KEY: ${{ secrets.GROK_API_KEY }}
```

### Example: Docker Secrets

```bash
# Create secret
echo "xai-xxxxxxxxxxxxx" | docker secret create grok_api_key -

# Use in Docker Compose
secrets:
grok_api_key:
external: true

services:
grok:
secrets:
- grok_api_key
environment:
- GROK_API_KEY=/run/secrets/grok_api_key
```

## Performance Optimization

### CI/CD Optimization

**Reduce execution time:**

```yaml
# Cache npm installation
- uses: actions/cache@v3
with:
path: ~/.npm
key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}

# Use fast model for simple checks
- name: Quick checks
env:
GROK_MODEL: grok-4-fast-non-reasoning
run: grok -p "check for console.log statements"
```

### Container Optimization

**Reduce image size:**

```dockerfile
FROM node:20-alpine # Alpine = smaller base

# Install only production dependencies
RUN npm install -g @xagent/one-shot --omit=dev

# Multi-stage build
FROM node:20-alpine AS build
RUN npm install -g @xagent/one-shot

FROM node:20-alpine
COPY --from=build /usr/local/lib/node_modules /usr/local/lib/node_modules
COPY --from=build /usr/local/bin/grok /usr/local/bin/grok
```

### Network Optimization

**Reduce latency:**

- Deploy close to X.AI API (US-based)
- Use Bun instead of Node.js (4x faster startup)
- Enable HTTP/2 (automatic with HTTPS)
- Reuse connections (automatic in most environments)

## Monitoring and Logging

### Token Usage Tracking

**In interactive mode:**

```
Press Ctrl+I to see token usage
```

**In CI/CD:**

```bash
# Extract from session file
grok -p "analyze code" > /dev/null
cat ~/.grok/sessions/*.json | jq '.tokenUsage'
```

### Cost Tracking

**Per-user tracking:**

```bash
# Different API keys per team member
# Monitor via X.AI dashboard
```

**Per-project tracking:**

```bash
# Different API keys per project
# Or tag usage in tracking system
```

### Error Logging

**Enable debug mode:**

```bash
export GROK_DEBUG=true
grok 2>&1 | tee grok-debug.log
```

**In CI/CD:**

```yaml
- name: AI checks with logging
run: |
export GROK_DEBUG=true
grok -p "review code" 2>&1 | tee ai-log.txt

- name: Upload logs
if: failure()
uses: actions/upload-artifact@v3
with:
name: ai-logs
path: ai-log.txt
```

## Scaling Strategies

### Horizontal Scaling

**Run multiple instances for parallel tasks:**

```bash
# Parallel analysis
grok -p "analyze auth" &
grok -p "analyze api" &
grok -p "analyze db" &
wait

# Combine results
cat ~/.grok/sessions/*.json | jq '.messages[-1].content'
```

### Rate Limiting

**Respect API limits:**

```bash
# Add delays between requests
for file in src/**/*.ts; do
grok -p "analyze $file"
sleep 2 # Avoid rate limits
done
```

### Batch Processing

**Process multiple items efficiently:**

```bash
# Single request for multiple files
grok -p "analyze all TypeScript files in src/ for security issues"

# Instead of individual requests per file
```

## Troubleshooting

### Installation Issues

**Problem:** `command not found: grok`

**Solution:**

```bash
# Add npm global bin to PATH
export PATH="$PATH:$(npm bin -g)"

# Or reinstall
npm install -g @xagent/one-shot
```

### CI/CD Issues

**Problem:** Interactive mode fails in CI

**Solution:**

```bash
# Always use headless mode in CI
grok -p "your query" # Not: grok
```

**Problem:** Rate limits in CI

**Solution:**

```yaml
# Add retry logic
- name: AI checks
uses: nick-invision/retry@v2
with:
timeout_minutes: 10
max_attempts: 3
command: grok -p "review code"
```

### Docker Issues

**Problem:** TTY errors in container

**Solution:**

```bash
# Run with proper flags
docker run -it grok-oneshot # Interactive
docker run grok-oneshot grok -p "query" # Headless
```

## Upgrade Strategy

### Update Process

**Development:**

```bash
npm update -g @xagent/one-shot
grok --version # Verify
```

**CI/CD:**

```yaml
# Pin version for stability
- name: Install
run: npm install -g @xagent/one-shot@1.1.101

# Or use latest
- name: Install
run: npm install -g @xagent/one-shot@latest
```

**Docker:**

```dockerfile
# Pin version
RUN npm install -g @xagent/one-shot@1.1.101

# Or use latest
RUN npm install -g @xagent/one-shot@latest
```

### Breaking Changes

**Check changelog:**

```bash
# View release notes
npm view @xagent/one-shot versions
npm view @xagent/one-shot@1.1.101
```

## See Also

- [Quickstart Guide](../getting-started/quickstart.md) - Installation basics
- [Settings](../configuration/settings.md) - Configuration details
- [Advanced Installation](../administration/advanced-installation.md) - Complex setups
- [Troubleshooting](../build-with-claude-code/troubleshooting.md) - Common issues

---

Choose the deployment strategy that matches your team size, workflow, and infrastructure.
