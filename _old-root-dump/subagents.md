---
title: Subagents
---

# Subagents

> Learn about subagents in Grok One-Shot - specialized AI agents for specific tasks.

## Overview

Subagents are specialized AI agents designed to handle specific tasks efficiently. While Claude Code offers user-configurable subagents through the `/agents` command, Grok One-Shot currently implements an internal subagent framework for system-level tasks.

## Status in Grok One-Shot

**Current Status:** Partially Implemented
**User-Facing Features:** Not Available
**Planned Full Implementation:** Q2 2026 (Sprint 18-20)

### What Works Today

Grok One-Shot has an internal subagent framework (`src/subagents/subagent-framework.ts`) that powers specific system tasks:

- **docgen** - Document generation
- **prd-assistant** - PRD analysis and suggestions
- **delta** - Change analysis between commits
- **token-optimizer** - Token usage optimization
- **summarizer** - Content compression and summarization
- **sentinel** - Error monitoring and pattern detection
- **regression-hunter** - Regression risk analysis
- **guardrail** - Rule compliance validation

These subagents operate internally and are not directly accessible to users.

### What's Not Available Yet

**Claude Code Features:**

- `/agents` command to view and manage subagents
- Create custom subagents with specialized prompts
- Configure subagent tool access
- Automatic delegation to specialized subagents
- Project-specific subagents in `.claude/agents/`
- User-defined subagent descriptions and behaviors

## Claude Code Subagents

In Claude Code, subagents provide a way to delegate specific tasks to specialized AI agents. Here's how they work in Claude Code:

### View Available Subagents

```
> /agents
```

This shows all available subagents and lets you create new ones.

### Use Subagents Automatically

Claude Code will automatically delegate appropriate tasks to specialized subagents:

```
> review my recent code changes for security issues
```

```
> run all tests and fix any failures
```

### Explicitly Request Specific Subagents

```
> use the code-reviewer subagent to check the auth module
```

```
> have the debugger subagent investigate why users can't log in
```

### Create Custom Subagents

```
> /agents
```

Then select "Create New subagent" and follow the prompts to define:

- Subagent type (e.g., `api-designer`, `performance-optimizer`)
- When to use it
- Which tools it can access
- Its specialized system prompt

### Project-Specific Subagents

Create project-specific subagents in `.claude/agents/` for team sharing:

```bash
# Directory structure
.claude/
└── agents/
├── code-reviewer.md
├── security-auditor.md
└── performance-optimizer.md
```

## Grok One-Shot Internal Subagents

While Grok One-Shot doesn't expose subagent management to users, it uses an internal subagent framework for system tasks. Here's what each subagent does:

### DocGen Subagent

**Purpose:** Generate documentation for projects

**Use Case:** When the system needs to create documentation automatically

**Configuration:**

- Context Limit: 2000 tokens
- Timeout: 30 seconds
- Max Retries: 2

**Example Internal Usage:**

```typescript
const taskId = await subagentFramework.spawnSubagent({
  type: "docgen",
  input: {
    projectPath: "/path/to/project",
    docType: "README",
  },
  priority: "medium",
});

const result = await subagentFramework.waitForResult(taskId);
// result.output contains generated documentation
```

### PRD Assistant Subagent

**Purpose:** Analyze PRDs for conflicts and suggestions

**Use Case:** When reviewing product requirement documents

**Configuration:**

- Context Limit: 2000 tokens
- Timeout: 20 seconds
- Max Retries: 1

**What It Analyzes:**

- Suggestions based on existing project patterns
- Conflicts with current architecture
- Similar tasks in the project
- Architecture impact assessment

### Delta Subagent

**Purpose:** Analyze changes between Git commits

**Use Case:** Understanding the impact of code changes

**Configuration:**

- Context Limit: 1500 tokens
- Timeout: 15 seconds
- Max Retries: 1

**What It Provides:**

- List of files changed
- Architecture change detection
- New features identified
- Impact assessment

### Token Optimizer Subagent

**Purpose:** Optimize token usage in conversations

**Use Case:** When conversations become too large

**Configuration:**

- Context Limit: 1000 tokens
- Timeout: 10 seconds
- Max Retries: 1

**What It Does:**

- Analyzes current token usage
- Suggests compression strategies
- Provides reduction estimates
- Recommends optimization techniques

### Summarizer Subagent

**Purpose:** Compress and summarize content

**Use Case:** When conversation history needs compaction

**Configuration:**

- Context Limit: 2000 tokens
- Timeout: 25 seconds
- Max Retries: 2

**Features:**

- Configurable compression ratio
- Key point extraction
- Original length tracking
- Maintains important context

### Sentinel Subagent

**Purpose:** Monitor for errors and patterns

**Use Case:** Continuous system monitoring

**Configuration:**

- Context Limit: 1000 tokens
- Timeout: 10 seconds
- Max Retries: 1

**Monitors:**

- Error logs
- Command patterns
- System health
- Alert generation

### Regression Hunter Subagent

**Purpose:** Detect potential regressions

**Use Case:** Before applying code changes

**Configuration:**

- Context Limit: 1500 tokens
- Timeout: 15 seconds
- Max Retries: 1

**Analyzes:**

- Proposed changes
- Known failure patterns
- Risk level assessment
- Test recommendations

### Guardrail Subagent

**Purpose:** Validate plans against rules

**Use Case:** Ensuring compliance with project constraints

**Configuration:**

- Context Limit: 1000 tokens
- Timeout: 10 seconds
- Max Retries: 1

**Checks:**

- Rule violations
- Warnings
- Compliance status
- New rule suggestions

## Subagent Framework Architecture

### Task Management

The subagent framework manages tasks through a lifecycle:

1. **Task Creation** - Spawn a new subagent task
2. **Execution** - Run in isolated context
3. **Result Storage** - Store results for retrieval
4. **Cleanup** - Clear old results after timeout

### Performance Metrics

The framework tracks:

- Total tasks executed
- Active task count
- Completed task count
- Average execution time
- Total tokens used

### Example Metrics Query

```typescript
const metrics = subagentFramework.getPerformanceMetrics();
console.log(metrics);
// {
// totalTasks: 15,
// activeTasks: 2,
// completedTasks: 13,
// averageExecutionTime: 1234,
// totalTokensUsed: 18500
// }
```

## Alternatives for Users Today

While user-facing subagents aren't available yet, here are current alternatives:

### 1. Use MCP Servers

Add custom tools via MCP for specialized functionality:

```bash
grok mcp add custom-analyzer "node ./analyzers/security.js"
grok mcp add code-reviewer "python ./scripts/review.py"
```

### 2. Document Specialized Workflows

Create documentation in `.agent/docs/` to guide Grok's behavior:

```markdown
# .agent/docs/workflows/security-review.md

## Security Review Workflow

When reviewing code for security:

1. Check for SQL injection vulnerabilities
2. Verify input validation
3. Check authentication/authorization
4. Review cryptography usage
5. Check for XSS vulnerabilities
```

Then ask Grok to follow these workflows:

```
> Follow the security review workflow in .agent/docs/workflows/security-review.md to check the auth module
```

### 3. Use GROK.md for Project Context

Define specialized behaviors in your GROK.md:

```markdown
# GROK.md

## Code Review Guidelines

When asked to review code:

- Focus on security, performance, and maintainability
- Check test coverage
- Verify documentation
- Look for edge cases
```

### 4. Create Shell Scripts

Wrap common Grok workflows in shell scripts:

```bash
#!/bin/bash
# scripts/grok-review.sh

echo "Running Grok security review..."
grok -p "Review the following files for security issues: $@"
```

Usage:

```bash
./scripts/grok-review.sh src/auth/*.ts
```

## Planned User-Facing Subagents

### Roadmap for Full Subagent Support

**Q2 2026 (Sprint 18-20):**

- `/agents` command implementation
- Subagent creation and management
- Custom subagent definitions
- Tool access configuration

**Features to Expect:**

1. **View Subagents**

```
> /agents
```

2. **Create Subagents**

```
> /agents create
Name: security-auditor
Description: Review code for security vulnerabilities
Tools: Read, Grep, Glob
Prompt: You are a security expert...
```

3. **Use Subagents**

```
> use security-auditor to check the auth module
```

4. **Project Subagents**

```
.grok/agents/
├── code-reviewer.md
├── test-generator.md
└── doc-writer.md
```

## Comparison: Claude Code vs Grok One-Shot

| Feature                  | Claude Code          | Grok One-Shot |
| ------------------------ | -------------------- | ------------- |
| **View Subagents**       | `/agents` command    | Not available |
| **Create Subagents**     | Interactive creation | Not available |
| **Automatic Delegation** | Yes                  | Internal only |
| **Custom Prompts**       | Yes                  | Not available |
| **Tool Restrictions**    | Yes                  | Internal only |
| **Project Subagents**    | `.claude/agents/`    | Not available |
| **Internal Framework**   | Unknown              | Implemented   |
| **User API**             | Yes                  | Not available |

## Best Practices (for Future Use)

When user-facing subagents become available:

### 1. Create Focused Subagents

Keep subagents focused on a single responsibility:

**Good:**

- `security-auditor` - Security reviews only
- `test-generator` - Test creation only
- `doc-writer` - Documentation only

**Bad:**

- `code-helper` - Too broad, unclear purpose

### 2. Use Descriptive Names

Name subagents clearly:

- `api-designer` over `api1`
- `performance-optimizer` over `perf`
- `database-schema-reviewer` over `db`

### 3. Limit Tool Access

Only grant tools that the subagent needs:

- Read-only subagents: `Read`, `Grep`, `Glob`
- Code generators: `Read`, `Write`, `Edit`
- Reviewers: `Read`, `Grep`, `Glob`, `Bash` (for running tests)

### 4. Write Clear Descriptions

Help Grok know when to use the subagent:

**Good:**

```
description: Review Python code for PEP 8 compliance, type hints, and docstrings. Use when checking Python code style or when the user asks for Python code review.
```

**Bad:**

```
description: Reviews code
```

### 5. Share via Git

Commit project subagents for team consistency:

```bash
git add .grok/agents/
git commit -m "Add code review subagent"
git push
```

## Technical Details

### Subagent Configuration Interface

```typescript
interface SubagentConfig {
  type: string;
  contextLimit: number;
  timeout: number;
  maxRetries: number;
}
```

### Subagent Task Interface

```typescript
interface SubagentTask {
  id: string;
  type: string;
  input: any;
  priority: "low" | "medium" | "high";
  createdAt: number;
}
```

### Subagent Result Interface

```typescript
interface SubagentResult {
  taskId: string;
  type: string;
  success: boolean;
  output?: any;
  error?: string;
  tokensUsed: number;
  executionTime: number;
  summary: string;
}
```

## Next Steps

### For Current Users

1. **Use MCP servers** for custom tools
2. **Document workflows** in `.agent/docs/`
3. **Configure GROK.md** for project-specific behaviors
4. **Create shell scripts** for common workflows

### For Future Use

1. **Learn subagent concepts** from this documentation
2. **Plan subagent strategies** for your projects
3. **Prepare workflow documentation** that can be converted to subagents
4. **Watch for updates** in release notes

## Related Documentation

- [Common Workflows](../getting-started/common-workflows.md) - See subagent section
- [MCP Integration](./mcp.md) - Alternative for custom tools
- [Plugin System](../features/plugin-system.md) - Future integration point
- [GROK.md Guide](../../overview.md) - Project context configuration

## Contributing

Want to help implement user-facing subagents?

1. Review the internal framework in `src/subagents/subagent-framework.ts`
2. Check the [implementation roadmap](../../parity/implementation-roadmap.md)
3. Open issues for discussion in the GitHub repository
4. Submit PRs for subagent-related features

---

**Status:** Internal framework implemented, user-facing features planned
**Planned Release:** Q2 2026 (Sprint 18-20)
**Last Updated:** 2025-11-07
