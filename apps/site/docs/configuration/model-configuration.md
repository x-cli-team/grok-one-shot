---
title: Model Configuration
---

# Model Configuration

Configure and optimize Grok model selection for your specific use cases.

## Overview

Grok One-Shot supports multiple X.AI models, each optimized for different scenarios. Understanding model capabilities and configuration helps you balance speed, quality, and cost.

## Available Models

### grok-2-1212 (Default)

**Best for:** General-purpose coding and complex tasks

**Characteristics:**

- **Intelligence:** High reasoning capability
- **Speed:** Moderate (2-5 seconds typical)
- **Context:** 128k tokens
- **Quality:** Excellent code generation and analysis
- **Cost:** Standard pricing

**Use cases:**

- Complex refactoring
- Architecture decisions
- Multi-file changes
- Code reviews
- Research and analysis

**Example:**

```bash
export GROK_MODEL="grok-2-1212"
grok "refactor authentication system to use JWT"
```

### grok-beta

**Best for:** Bleeding-edge features and capabilities

**Characteristics:**

- **Intelligence:** Latest model improvements
- **Speed:** Moderate to slow
- **Context:** 128k tokens
- **Quality:** Experimental, may be unstable
- **Cost:** Beta pricing (may vary)

**Use cases:**

- Testing new capabilities
- Experimental features
- Research projects
- Early adopters

**Example:**

```bash
export GROK_MODEL="grok-beta"
grok "try advanced code understanding features"
```

**Warning:** Beta models may have:

- Unexpected behavior
- API changes
- Availability fluctuations
- Different pricing

### grok-4-fast-non-reasoning

**Best for:** Quick queries and simple tasks

**Characteristics:**

- **Intelligence:** Streamlined, focused
- **Speed:** Very fast (less than 1 second typical)
- **Context:** 128k tokens
- **Quality:** Good for straightforward tasks
- **Cost:** Lower pricing

**Use cases:**

- Quick file searches
- Simple edits
- Code formatting
- Fast iteration
- List operations

**Example:**

```bash
export GROK_MODEL="grok-4-fast-non-reasoning"
grok -p "list all TODO comments"
```

**Limitations:**

- Less sophisticated reasoning
- May miss complex patterns
- Better for mechanical tasks
- Not ideal for architecture decisions

## Model Selection Methods

### 1. Environment Variable (Persistent)

**Set default model:**

```bash
# Add to ~/.bashrc or ~/.zshrc
export GROK_MODEL="grok-2-1212"
```

**Pros:**

- Sets default for all sessions
- No need to specify each time
- Easy to change globally

**Cons:**

- Requires shell restart to change
- Same model for all projects

### 2. Command Line Flag (Per-Session)

**Specify at launch:**

```bash
grok -m grok-4-fast-non-reasoning
```

**Pros:**

- Override default for specific session
- Test different models easily
- Project-specific choices

**Cons:**

- Must specify each time
- Verbose command line

### 3. Settings File (Persistent)

**Edit `~/.grok/settings.json`:**

```json
{
  "model": "grok-2-1212",
  "apiKey": "your-key"
}
```

**Pros:**

- Persistent default
- Centralized configuration
- Works without environment variables

**Cons:**

- Manual file editing
- Requires JSON knowledge

### 4. Interactive Switch (In-Session)

**During session - press `Ctrl+M`:**

```
Current model: grok-2-1212
Available models:
1. grok-2-1212 (current)
2. grok-beta
3. grok-4-fast-non-reasoning

Select model: [1-3]
```

**Pros:**

- Switch mid-session
- No restart needed
- Try different models instantly

**Cons:**

- Temporary (resets on exit)
- Must remember keyboard shortcut

## Model Comparison

### Performance vs Quality

```
High Quality, Slower
↑
│ grok-2-1212
│ ●
│
│ grok-beta
│ ● (experimental)
│
│ grok-4-fast-non-reasoning
│ ●
│
└────────────────────────→
Fast, Lower Quality
```

### Decision Matrix

| Task Type             | Recommended Model | Reason                   |
| --------------------- | ----------------- | ------------------------ |
| Complex refactoring   | grok-2-1212       | Needs reasoning          |
| Architecture design   | grok-2-1212       | Strategic thinking       |
| Quick file search     | grok-4-fast       | Speed matters            |
| Simple edits          | grok-4-fast       | Straightforward          |
| Multi-file changes    | grok-2-1212       | Coordination needed      |
| Code review           | grok-2-1212       | Deep analysis            |
| Format code           | grok-4-fast       | Mechanical task          |
| Research codebase     | grok-2-1212       | Understanding needed     |
| List files/functions  | grok-4-fast       | Simple queries           |
| Experimental features | grok-beta         | Testing new capabilities |

### Cost Considerations

**Typical token usage:**

```
Simple query: 500-2,000 tokens
Code edit: 2,000-10,000 tokens
Multi-file refactor: 10,000-50,000 tokens
Research session: 20,000-100,000 tokens
```

**Optimization strategies:**

1. Use grok-4-fast for simple tasks (lower cost)
2. Use grok-2-1212 for complex work (worth the cost)
3. Switch models mid-session as needed (Ctrl+M)
4. Use headless mode for automation (saves tokens)

## Configuration Examples

### Development Workflow

**Fast iteration on simple tasks:**

```bash
# ~/.bashrc
alias grok-fast='GROK_MODEL=grok-4-fast-non-reasoning grok'
alias grok='grok' # Uses default grok-2-1212

# Usage
grok-fast "find all console.log statements"
grok "refactor error handling"
```

### Project-Specific Setup

**Use different models per project:**

```bash
# ~/projects/simple-app/.env
export GROK_MODEL=grok-4-fast-non-reasoning

# ~/projects/complex-system/.env
export GROK_MODEL=grok-2-1212

# Load before running
cd ~/projects/simple-app
source .env && grok
```

### Shell Aliases

**Quick model switching:**

```bash
# ~/.bashrc or ~/.zshrc
alias grok-default='GROK_MODEL=grok-2-1212 grok'
alias grok-fast='GROK_MODEL=grok-4-fast-non-reasoning grok'
alias grok-beta='GROK_MODEL=grok-beta grok'
```

**Usage:**

```bash
grok-fast "quick query"
grok-default "complex task"
grok-beta "test new features"
```

### Advanced Configuration

**Model + other settings:**

```bash
# High-performance simple tasks
alias grok-quick='GROK_MODEL=grok-4-fast-non-reasoning MAX_TOOL_ROUNDS=100 grok -p'

# Deep research mode
alias grok-research='GROK_MODEL=grok-2-1212 MAX_TOOL_ROUNDS=500 grok'

# Beta testing
alias grok-experimental='GROK_MODEL=grok-beta GROK_DEBUG=true grok'
```

## Optimization Strategies

### When to Use Each Model

**Use grok-4-fast-non-reasoning when:**

- Task is well-defined and simple
- Speed is priority
- Output format is predictable
- No complex reasoning needed
- Cost optimization matters

**Examples:**

```bash
grok-fast "list all TypeScript files"
grok-fast "format this JSON"
grok-fast "find functions named 'validate'"
grok-fast "count lines of code"
```

**Use grok-2-1212 when:**

- Task requires reasoning
- Multi-step operations
- Quality is priority
- Complex codebase understanding
- Strategic decisions

**Examples:**

```bash
grok "refactor authentication system"
grok "analyze performance bottlenecks"
grok "design new feature architecture"
grok "review security implications"
```

**Use grok-beta when:**

- Testing new features
- Experimental workflows
- Early access needed
- Providing feedback to X.AI

**Examples:**

```bash
grok-beta "test advanced code understanding"
grok-beta "try new reasoning capabilities"
```

### Hybrid Approach

**Start fast, upgrade if needed:**

```bash
# 1. Quick exploration
GROK_MODEL=grok-4-fast-non-reasoning grok

> Search for authentication code
[Quick search results]

# 2. Switch to detailed analysis (Ctrl+M)
> Now analyze the authentication flow in depth
[Switches to grok-2-1212 for complex analysis]
```

### Context Management

**All models support 128k context, but usage differs:**

**grok-4-fast-non-reasoning:**

- Efficient token usage
- Focused responses
- Less context needed

**grok-2-1212:**

- More context utilization
- Deeper analysis
- Higher token consumption

**Strategy:**

```bash
# For token-intensive tasks, start with default context
GROK_MODEL=grok-2-1212 grok

# For many small tasks, use fast model
GROK_MODEL=grok-4-fast-non-reasoning grok -p "query 1" && \
grok -p "query 2" && \
grok -p "query 3"
```

## Monitoring and Analysis

### Token Usage Tracking

**Check usage during session:**

```
# Press Ctrl+I in interactive mode
Token Usage:
Input: 15,432 tokens
Output: 8,721 tokens
Total: 24,153 tokens
Model: grok-2-1212
```

**Review session files:**

```bash
# Sessions saved in ~/.grok/sessions/
cat ~/.grok/sessions/latest-session.json | grep -A5 "tokenUsage"
```

### Performance Metrics

**Compare models empirically:**

```bash
# Fast model timing
time GROK_MODEL=grok-4-fast-non-reasoning grok -p "list files"
# Typical: 1-2 seconds

# Default model timing
time GROK_MODEL=grok-2-1212 grok -p "list files"
# Typical: 3-5 seconds
```

## Troubleshooting

### Model Not Found

**Error:** `Unknown model: grok-xyz`

**Cause:** Typo or unsupported model

**Solution:**

```bash
# Check spelling
echo $GROK_MODEL

# Valid models:
# - grok-2-1212
# - grok-beta
# - grok-4-fast-non-reasoning
```

### Slow Responses

**Symptoms:** Model takes too long

**Solutions:**

```bash
# 1. Switch to fast model
export GROK_MODEL=grok-4-fast-non-reasoning

# 2. Or use Ctrl+M in session

# 3. Check network
ping api.x.ai

# 4. Reduce context
# Start new session if context is large
```

### Poor Quality Results

**Symptoms:** Fast model gives inadequate responses

**Solutions:**

```bash
# 1. Switch to default model
export GROK_MODEL=grok-2-1212

# 2. Or use Ctrl+M in session

# 3. Be more specific in prompts
# "Refactor auth" → "Refactor authentication to use JWT tokens with refresh token rotation"
```

### Model Switch Not Working

**Symptoms:** Ctrl+M doesn't change model

**Causes:**

- Terminal doesn't capture Ctrl+M
- Session state issue

**Solutions:**

```bash
# 1. Restart session with desired model
grok -m grok-2-1212

# 2. Set via environment
export GROK_MODEL=grok-2-1212

# 3. Check terminal bindings
# Some terminals may capture Ctrl+M
```

## Best Practices

### General Guidelines

**DO:**

- Start with grok-2-1212 for unknown complexity
- Switch to grok-4-fast for simple follow-ups
- Use environment variables for consistent defaults
- Monitor token usage (Ctrl+I)
- Test grok-beta for new features (when available)

**DON'T:**

- Use grok-4-fast for complex reasoning
- Use grok-2-1212 for trivial queries unnecessarily
- Ignore token costs on large operations
- Assume beta model stability
- Forget to switch models when needs change

### Optimal Configurations

**For learning/exploration:**

```bash
# Use default model, generous tool rounds
export GROK_MODEL=grok-2-1212
export MAX_TOOL_ROUNDS=500
```

**For production automation:**

```bash
# Use fast model, limit rounds
export GROK_MODEL=grok-4-fast-non-reasoning
export MAX_TOOL_ROUNDS=100
```

**For experimentation:**

```bash
# Use beta, enable debug
export GROK_MODEL=grok-beta
export GROK_DEBUG=true
```

## Advanced Topics

### Custom Model Endpoints

**For proxy or custom deployments:**

```bash
export GROK_BASE_URL="https://custom-endpoint.example.com/v1"
export GROK_MODEL="grok-2-1212"
```

### API Version Compatibility

Grok One-Shot uses X.AI API v1 endpoints:

- Base URL: `https://api.x.ai/v1`
- Compatible with standard OpenAI API format
- Model names specific to X.AI

### Future Models

X.AI regularly releases new models. Check documentation:

```bash
# List available models (future feature)
grok --list-models
```

## See Also

- [Settings](./settings.md) - General configuration
- [Terminal Configuration](./terminal-configuration.md) - Terminal setup
- [CLI Reference](../reference/cli-reference.md) - Command-line options
- [Interactive Mode](../reference/interactive-mode.md) - Using sessions

---

Model selection is key to balancing speed, quality, and cost for your specific workflows.
