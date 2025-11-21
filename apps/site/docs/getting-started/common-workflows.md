---
title: Common workflows
---

# Common workflows

> Learn about common workflows with Grok One-Shot.

Each task in this document includes clear instructions, example commands, and best practices to help you get the most from Grok One-Shot.

## Understand new codebases

### Get a quick codebase overview

Suppose you've just joined a new project and need to understand its structure quickly.

<Steps>
<Step title="Navigate to the project root directory">
```bash theme={null}
cd /path/to/project
```
</Step>

<Step title="Start Grok One-Shot">
```bash theme={null}
grok
```
</Step>

<Step title="Ask for a high-level overview">
```
> give me an overview of this codebase
```
</Step>

<Step title="Dive deeper into specific components">
```
> explain the main architecture patterns used here
```

```
> what are the key data models?
```

```
> how is authentication handled?
```

</Step>
</Steps>

<Tip>
Tips:

- Start with broad questions, then narrow down to specific areas
- Ask about coding conventions and patterns used in the project
- Request a glossary of project-specific terms
  </Tip>

### Find relevant code

Suppose you need to locate code related to a specific feature or functionality.

<Steps>
<Step title="Ask Grok to find relevant files">
```
> find the files that handle user authentication
```
</Step>

<Step title="Get context on how components interact">
```
> how do these authentication files work together?
```
</Step>

<Step title="Understand the execution flow">
```
> trace the login process from front-end to database
```
</Step>
</Steps>

<Tip>
Tips:

- Be specific about what you're looking for
- Use domain language from the project
  </Tip>

---

## Fix bugs efficiently

Suppose you've encountered an error message and need to find and fix its source.

<Steps>
<Step title="Share the error with Grok">
```
> I'm seeing an error when I run npm test
```
</Step>

<Step title="Ask for fix recommendations">
```
> suggest a few ways to fix the @ts-ignore in user.ts
```
</Step>

<Step title="Apply the fix">
```
> update user.ts to add the null check you suggested
```
</Step>
</Steps>

<Tip>
Tips:

- Tell Grok the command to reproduce the issue and get a stack trace
- Mention any steps to reproduce the error
- Let Grok know if the error is intermittent or consistent
  </Tip>

---

## Refactor code

Suppose you need to update old code to use modern patterns and practices.

<Steps>
<Step title="Identify legacy code for refactoring">
```
> find deprecated API usage in our codebase
```
</Step>

<Step title="Get refactoring recommendations">
```
> suggest how to refactor utils.js to use modern JavaScript features
```
</Step>

<Step title="Apply the changes safely">
```
> refactor utils.js to use ES2024 features while maintaining the same behavior
```
</Step>

<Step title="Verify the refactoring">
```
> run tests for the refactored code
```
</Step>
</Steps>

<Tip>
Tips:

- Ask Grok to explain the benefits of the modern approach
- Request that changes maintain backward compatibility when needed
- Do refactoring in small, testable increments
  </Tip>

---

## Use specialized subagents

> ** PARITY GAP**: Grok One-Shot does not currently implement user-configurable subagents like Claude Code's `/agents` command. The subagent framework exists internally for specific tasks (docgen, prd-assistant, etc.) but is not user-accessible.

**Claude Code Feature:**

- `/agents` command to view and create custom AI subagents
- Automatic delegation to specialized subagents
- Project-specific subagents in `.claude/agents/`

**Grok One-Shot Current State:**
Currently, Grok One-Shot uses internal subagents for specific system tasks (see [subagents documentation](../build-with-grok/subagents.md)) but doesn't expose subagent creation or management to users. For specialized workflows, consider:

- Using MCP servers for custom tools: `grok mcp add <server-name> <command>`
- Creating documentation in `.agent/docs/` to guide Grok's behavior
- Using GROK.md to define project-specific context and workflows

**Planned Implementation:** Q2 2026 (Sprint 18-20)

---

## Use Plan Mode for safe code analysis

> ** PARITY GAP**: Grok One-Shot does not currently implement Plan Mode. This is a Claude Code feature for read-only code exploration.

**Claude Code Feature:**
Plan Mode restricts Claude to read-only operations, perfect for exploring codebases, planning complex changes, or reviewing code safely.

**Grok One-Shot Alternative:**
While there's no explicit "Plan Mode", you can achieve similar results by:

1. Explicitly asking Grok to only analyze without making changes:

```
> analyze the authentication system and suggest improvements (don't make any changes yet)
```

2. Reviewing Grok's suggestions before approving file edits
3. Using confirmation prompts to control when edits are applied

**Planned Implementation:** Q1 2026 (Sprint 14-16)

---

## Work with tests

Suppose you need to add tests for uncovered code.

<Steps>
<Step title="Identify untested code">
```
> find functions in NotificationsService.swift that are not covered by tests
```
</Step>

<Step title="Generate test scaffolding">
```
> add tests for the notification service
```
</Step>

<Step title="Add meaningful test cases">
```
> add test cases for edge conditions in the notification service
```
</Step>

<Step title="Run and verify tests">
```
> run the new tests and fix any failures
```
</Step>
</Steps>

<Tip>
Tips:

- Ask for tests that cover edge cases and error conditions
- Request both unit and integration tests when appropriate
- Have Grok explain the testing strategy
  </Tip>

---

## Create pull requests

Suppose you need to create a well-documented pull request for your changes.

<Steps>
<Step title="Summarize your changes">
```
> summarize the changes I've made to the authentication module
```
</Step>

<Step title="Generate a PR with Grok">
```
> create a pr
```
</Step>

<Step title="Review and refine">
```
> enhance the PR description with more context about the security improvements
```
</Step>

<Step title="Add testing details">
```
> add information about how these changes were tested
```
</Step>
</Steps>

<Tip>
Tips:

- Ask Grok directly to make a PR for you
- Review Grok's generated PR before submitting
- Ask Grok to highlight potential risks or considerations
  </Tip>

## Handle documentation

Suppose you need to add or update documentation for your code.

<Steps>
<Step title="Identify undocumented code">
```
> find functions without proper JSDoc comments in the auth module
```
</Step>

<Step title="Generate documentation">
```
> add JSDoc comments to the undocumented functions in auth.js
```
</Step>

<Step title="Review and enhance">
```
> improve the generated documentation with more context and examples
```
</Step>

<Step title="Verify documentation">
```
> check if the documentation follows our project standards
```
</Step>
</Steps>

<Tip>
Tips:

- Specify the documentation style you want (JSDoc, docstrings, etc.)
- Ask for examples in the documentation
- Request documentation for public APIs, interfaces, and complex logic
  </Tip>

---

## Work with images

> ** PARITY GAP**: Grok One-Shot does not currently support image analysis. This is a Claude Code feature.

**Claude Code Feature:**

- Drag and drop images into the CLI
- Paste images with ctrl+v
- Analyze screenshots, diagrams, UI mockups
- Generate code from visual designs

**Grok One-Shot Alternative:**
Currently, Grok One-Shot is text-only. For visual design tasks:

- Describe the visual elements in detail via text
- Use ASCII diagrams for simple visualizations
- Link to external images with detailed descriptions

**Planned Implementation:** Q3 2026 (Sprint 22-24)

---

## Reference files and directories

> ** PARITY GAP**: Grok One-Shot does not currently support `@` file references like Claude Code.

**Claude Code Feature:**
Use `@` to quickly include files or directories:

- `@src/utils/auth.js` - Include file contents
- `@src/components` - Show directory listing
- `@github:repos/owner/repo/issues` - Fetch MCP resources

**Grok One-Shot Alternative:**
Explicitly ask Grok to read files:

```
> read the file src/utils/auth.js and explain the logic
> show me the structure of the src/components directory
```

Grok will use the Read, Glob, and Grep tools to access the files you need.

**Planned Implementation:** Q2 2026 (Sprint 17-19)

---

## Use extended thinking

> ** PARITY GAP**: Grok One-Shot does not currently support extended thinking mode. This is a Claude-specific feature not available in Grok API.

**Claude Code Feature:**

- Enable extended thinking with `Tab` key
- Use "think" or "think hard" prompts
- See visible thinking process
- Useful for complex architectural decisions

**Grok One-Shot Alternative:**
While Grok doesn't have a dedicated "extended thinking" mode, you can encourage deeper analysis by:

- Asking Grok to "analyze carefully" or "think through all implications"
- Requesting step-by-step breakdowns
- Asking for pros/cons analysis
- Requesting multiple approaches

**Not Planned:** This feature depends on Grok API capabilities

---

## Resume previous conversations

> ** PARITY GAP**: Grok One-Shot does not currently support resuming previous conversations.

**Claude Code Feature:**

- `claude --continue` - Resume most recent conversation
- `claude --resume` - Interactive conversation picker
- Full conversation history restoration

**Grok One-Shot Current State:**
Grok One-Shot auto-saves conversations to `~/.grok/sessions/` but does not currently support resuming them. Session files contain:

- Complete message history
- Token usage
- Timestamp and metadata

**Planned Implementation:** Q1 2026 (Sprint 12-14)

**Workaround:** Review session files in `~/.grok/sessions/` to see past conversations

---

## Run parallel Grok sessions with Git worktrees

Suppose you need to work on multiple tasks simultaneously with complete code isolation between Grok instances.

<Steps>
<Step title="Understand Git worktrees">
Git worktrees allow you to check out multiple branches from the same
repository into separate directories. Each worktree has its own working
directory with isolated files, while sharing the same Git history. Learn
more in the [official Git worktree
documentation](https://git-scm.com/docs/git-worktree).
</Step>

<Step title="Create a new worktree">
```bash theme={null}
# Create a new worktree with a new branch
git worktree add ../project-feature-a -b feature-a

# Or create a worktree with an existing branch

git worktree add ../project-bugfix bugfix-123

````

This creates a new directory with a separate working copy of your repository.

</Step>

<Step title="Run Grok in each worktree">
```bash theme={null}
# Navigate to your worktree
cd ../project-feature-a

# Run Grok in this isolated environment
grok
````

</Step>

<Step title="Run Grok in another worktree">
```bash theme={null}
cd ../project-bugfix
grok
```
</Step>

<Step title="Manage your worktrees">
```bash theme={null}
# List all worktrees
git worktree list

# Remove a worktree when done

git worktree remove ../project-feature-a

````

</Step>
</Steps>

<Tip>
Tips:

- Each worktree has its own independent file state, making it perfect for parallel Grok sessions
- Changes made in one worktree won't affect others, preventing Grok instances from interfering with each other
- All worktrees share the same Git history and remote connections
- For long-running tasks, you can have Grok working in one worktree while you continue development in another
- Use descriptive directory names to easily identify which task each worktree is for
- Remember to initialize your development environment in each new worktree according to your project's setup. Depending on your stack, this might include:
_ JavaScript projects: Running dependency installation (`npm install`, `yarn`)
_ Python projects: Setting up virtual environments or installing with package managers \* Other languages: Following your project's standard setup process
</Tip>

---

## Use Grok as a unix-style utility

### Add Grok to your verification process

Suppose you want to use Grok One-Shot as a linter or code reviewer.

**Add Grok to your build script:**

```json theme={null}
// package.json
{
...
"scripts": {
...
"lint:grok": "grok -p 'you are a linter. please look at the changes vs. main and report any issues related to typos. report the filename and line number on one line, and a description of the issue on the second line. do not return any other text.'"
}
}
````

<Tip>
Tips:

- Use Grok for automated code review in your CI/CD pipeline
- Customize the prompt to check for specific issues relevant to your project
- Consider creating multiple scripts for different types of verification
  </Tip>

### Pipe in, pipe out

Suppose you want to pipe data into Grok, and get back data in a structured format.

**Pipe data through Grok:**

```bash theme={null}
cat build-error.txt | grok -p 'concisely explain the root cause of this build error' > output.txt
```

<Tip>
Tips:

- Use pipes to integrate Grok into existing shell scripts
- Combine with other Unix tools for powerful workflows
- Consider using structured prompts for consistent output
  </Tip>

### Control output format

> ** PARITY GAP**: Grok One-Shot does not currently support `--output-format` flag.

**Claude Code Feature:**

- `--output-format text` - Plain text response (default)
- `--output-format json` - JSON array with metadata
- `--output-format stream-json` - Real-time JSON streaming

**Grok One-Shot Current State:**
Currently outputs plain text only. For structured output, use prompting:

```bash theme={null}
grok -p 'analyze this code and return ONLY a JSON object with "issues" and "suggestions" arrays' < code.py > analysis.txt
```

**Planned Implementation:** Q1 2026 (Sprint 15-16)

---

## Create custom slash commands

> ** PARITY GAP**: Grok One-Shot does not currently support custom slash commands. This is a planned feature.

**Claude Code Feature:**

- Create commands in `.claude/commands/`
- Use `$ARGUMENTS` placeholder
- Personal commands in `~/.claude/commands/`
- Project commands shared via Git

**Grok One-Shot Alternative:**
While slash commands aren't available yet, you can:

1. Document common prompts in `.agent/docs/workflows/`
2. Create shell aliases for common Grok commands:

```bash
# In ~/.bashrc or ~/.zshrc
alias grok-optimize='grok -p "Analyze the performance of this code and suggest three specific optimizations:"'
alias grok-security='grok -p "Review this code for security vulnerabilities, focusing on:"'
```

3. Use shell scripts to wrap common Grok workflows

**Planned Implementation:** Q2 2026 (Sprint 19-21)

---

## Ask Grok about its capabilities

Grok has built-in access to its documentation and can answer questions about its own features and limitations.

### Example questions

```
> can Grok One-Shot create pull requests?
```

```
> how does Grok One-Shot handle permissions?
```

```
> what commands are available?
```

```
> how do I use MCP with Grok One-Shot?
```

```
> what are the limitations of Grok One-Shot?
```

<Note>
Grok provides documentation-based answers to these questions. For executable examples and hands-on demonstrations, refer to the specific workflow sections above.
</Note>

<Tip>
Tips:

- Grok always has access to the latest Grok One-Shot documentation via GROK.md and docs-index.md
- Ask specific questions to get detailed answers
- Grok can explain features like MCP integration, configuration, and workflows
  </Tip>

---

## Next steps

<Card title="Grok One-Shot documentation" icon="book" href="/docs-index">
Explore comprehensive documentation in `.agent/docs/`
</Card>
