---
title: Slash commands
---

# Slash commands

> Control Grok's behavior during an interactive session with slash commands.

> ** Parity Gap:** Grok One-Shot has a minimal set of built-in slash commands compared to Claude Code. Custom slash commands (via `.grok/commands/`) are not yet supported but are planned for future releases.

## Built-in slash commands

> ** Parity Gap:** Grok One-Shot currently supports only a minimal set of slash commands. The following Claude Code commands are not yet available: `/add-dir`, `/agents`, `/bashes`, `/bug`, `/clear`, `/compact`, `/config`, `/context`, `/cost`, `/doctor`, `/export`, `/help`, `/hooks`, `/init`, `/login`, `/logout`, `/mcp`, `/memory`, `/model`, `/output-style`, `/permissions`, `/pr_comments`, `/privacy-settings`, `/review`, `/sandbox`, `/rewind`, `/status`, `/statusline`, `/terminal-setup`, `/todos`, `/usage`, `/vim`.

| Command | Purpose       |
| :------ | :------------ |
| `/exit` | Exit the REPL |

<Note>
Most functionality in Grok One-Shot is accessed through natural language prompts or keyboard shortcuts rather than slash commands. See the [interactive mode guide](/en/interactive-mode) for keyboard shortcuts.
</Note>

## Custom slash commands

> ** Parity Gap:** Custom slash commands are not yet implemented in Grok One-Shot. This is a planned feature for a future release.

Custom slash commands allow you to define frequently-used prompts as Markdown files that the CLI can execute. Commands are organized by scope (project-specific or personal) and support namespacing through directory structures.

### Syntax

```
/<command-name> [arguments]
```

#### Parameters

| Parameter        | Description                                                       |
| :--------------- | :---------------------------------------------------------------- |
| `<command-name>` | Name derived from the Markdown filename (without `.md` extension) |
| `[arguments]`    | Optional arguments passed to the command                          |

### Command types

#### Project commands

Commands stored in your repository and shared with your team. When listed in `/help`, these commands show "(project)" after their description.

**Location**: `.grok/commands/` (planned)

In the following example, we create the `/optimize` command:

```bash theme={null}
# Create a project command (when feature is available)
mkdir -p .grok/commands
echo "Analyze this code for performance issues and suggest optimizations:" > .grok/commands/optimize.md
```

#### Personal commands

Commands available across all your projects. When listed in `/help`, these commands show "(user)" after their description.

**Location**: `~/.grok/commands/` (planned)

In the following example, we create the `/security-review` command:

```bash theme={null}
# Create a personal command (when feature is available)
mkdir -p ~/.grok/commands
echo "Review this code for security vulnerabilities:" > ~/.grok/commands/security-review.md
```

### Features

#### Namespacing

Organize commands in subdirectories. The subdirectories are used for organization and appear in the command description, but they do not affect the command name itself. The description will show whether the command comes from the project directory (`.grok/commands`) or the user-level directory (`~/.grok/commands`), along with the subdirectory name.

Conflicts between user and project level commands are not supported. Otherwise, multiple commands with the same base file name can coexist.

For example, a file at `.grok/commands/frontend/component.md` creates the command `/component` with description showing "(project:frontend)".
Meanwhile, a file at `~/.grok/commands/component.md` creates the command `/component` with description showing "(user)".

#### Arguments

Pass dynamic values to commands using argument placeholders:

##### All arguments with `$ARGUMENTS`

The `$ARGUMENTS` placeholder captures all arguments passed to the command:

```bash theme={null}
# Command definition
echo 'Fix issue #$ARGUMENTS following our coding standards' > .grok/commands/fix-issue.md

# Usage
> /fix-issue 123 high-priority
# $ARGUMENTS becomes: "123 high-priority"
```

##### Individual arguments with `$1`, `$2`, etc.

Access specific arguments individually using positional parameters (similar to shell scripts):

```bash theme={null}
# Command definition
echo 'Review PR #$1 with priority $2 and assign to $3' > .grok/commands/review-pr.md

# Usage
> /review-pr 456 high alice
# $1 becomes "456", $2 becomes "high", $3 becomes "alice"
```

Use positional arguments when you need to:

- Access arguments individually in different parts of your command
- Provide defaults for missing arguments
- Build more structured commands with specific parameter roles

#### Bash command execution

Execute bash commands before the slash command runs using the `!` prefix. The output is included in the command context. You _must_ include `allowed-tools` with the `Bash` tool, but you can choose the specific bash commands to allow.

For example:

```markdown theme={null}
---
allowed-tools: Bash(git add:*), Bash(git status:*), Bash(git commit:*)
description: Create a git commit
---

## Context

- Current git status: !`git status`
- Current git diff (staged and unstaged changes): !`git diff HEAD`
- Current branch: !`git branch --show-current`
- Recent commits: !`git log --oneline -10`

## Your task

Based on the above changes, create a single git commit.
```

#### File references

Include file contents in commands using the `@` prefix to [reference files](/en/common-workflows#reference-files-and-directories).

For example:

```markdown theme={null}
# Reference a specific file

Review the implementation in @src/utils/helpers.js

# Reference multiple files

Compare @src/old-version.js with @src/new-version.js
```

#### Thinking mode

Slash commands can trigger extended thinking by including extended thinking keywords.

> ** Parity Gap:** Extended thinking mode is not yet supported in Grok One-Shot.

### Frontmatter

Command files support frontmatter, useful for specifying metadata about the command:

| Frontmatter                | Purpose                                                                                                                                                                               | Default                             |
| :------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :---------------------------------- |
| `allowed-tools`            | List of tools the command can use                                                                                                                                                     | Inherits from the conversation      |
| `argument-hint`            | The arguments expected for the slash command. Example: `argument-hint: add [tagId] \| remove [tagId] \| list`. This hint is shown to the user when auto-completing the slash command. | None                                |
| `description`              | Brief description of the command                                                                                                                                                      | Uses the first line from the prompt |
| `model`                    | Specific model string (e.g., `grok-2-1212`, `grok-beta`)                                                                                                                              | Inherits from the conversation      |
| `disable-model-invocation` | Whether to prevent `SlashCommand` tool from calling this command                                                                                                                      | false                               |

For example:

```markdown theme={null}
---
allowed-tools: Bash(git add:*), Bash(git status:*), Bash(git commit:*)
argument-hint: [message]
description: Create a git commit
model: grok-2-1212
---

Create a git commit with message: $ARGUMENTS
```

Example using positional arguments:

```markdown theme={null}
---
argument-hint: [pr-number] [priority] [assignee]
description: Review pull request
---

Review PR #$1 with priority $2 and assign to $3.
Focus on security, performance, and code style.
```

## Plugin commands

> ** Parity Gap:** Grok One-Shot does not yet support plugins or plugin commands. This functionality is planned for future releases.

[Plugins](/en/plugins) can provide custom slash commands that integrate seamlessly with the CLI. Plugin commands work exactly like user-defined commands but are distributed through plugin marketplaces.

### How plugin commands work

Plugin commands are:

- **Namespaced**: Commands can use the format `/plugin-name:command-name` to avoid conflicts (plugin prefix is optional unless there are name collisions)
- **Automatically available**: Once a plugin is installed and enabled, its commands appear in `/help`
- **Fully integrated**: Support all command features (arguments, frontmatter, bash execution, file references)

### Plugin command structure

**Location**: `commands/` directory in plugin root

**File format**: Markdown files with frontmatter

**Basic command structure**:

```markdown theme={null}
---
description: Brief description of what the command does
---

# Command Name

Detailed instructions for Grok on how to execute this command.
Include specific guidance on parameters, expected outcomes, and any special considerations.
```

**Advanced command features**:

- **Arguments**: Use placeholders like `{arg1}` in command descriptions
- **Subdirectories**: Organize commands in subdirectories for namespacing
- **Bash integration**: Commands can execute shell scripts and programs
- **File references**: Commands can reference and modify project files

### Invocation patterns

```shell Direct command (when no conflicts) theme={null}
/command-name
```

```shell Plugin-prefixed (when needed for disambiguation) theme={null}
/plugin-name:command-name
```

```shell With arguments (if command supports them) theme={null}
/command-name arg1 arg2
```

## MCP slash commands

> ** Parity Gap:** While Grok One-Shot supports MCP servers, MCP prompts are not yet exposed as slash commands. This functionality may be added in future releases.

MCP servers can expose prompts as slash commands that become available in the CLI. These commands are dynamically discovered from connected MCP servers.

### Command format

MCP commands follow the pattern:

```
/mcp__<server-name>__<prompt-name> [arguments]
```

### Features

#### Dynamic discovery

MCP commands are automatically available when:

- An MCP server is connected and active
- The server exposes prompts through the MCP protocol
- The prompts are successfully retrieved during connection

#### Arguments

MCP prompts can accept arguments defined by the server:

```
# Without arguments
> /mcp__github__list_prs

# With arguments
> /mcp__github__pr_review 456
> /mcp__jira__create_issue "Bug title" high
```

#### Naming conventions

- Server and prompt names are normalized
- Spaces and special characters become underscores
- Names are lowercased for consistency

### Managing MCP connections

Use the `grok mcp` command to:

- Add MCP servers
- List configured servers
- Remove servers

> ** Parity Gap:** Grok One-Shot's MCP management is command-line based (`grok mcp add/list/remove`), not slash-command based like Claude Code's `/mcp` command.

### MCP permissions and wildcards

When configuring permissions for MCP tools, note that **wildcards are not supported**:

- **Correct**: `mcp__github` (approves ALL tools from the github server)
- **Correct**: `mcp__github__get_issue` (approves specific tool)
- **Incorrect**: `mcp__github__*` (wildcards not supported)

To approve all tools from an MCP server, use just the server name: `mcp__servername`. To approve specific tools only, list each tool individually.

## `SlashCommand` tool

> ** Parity Gap:** The `SlashCommand` tool is not yet implemented in Grok One-Shot since custom slash commands are not yet supported.

The `SlashCommand` tool allows the AI to execute custom slash commands programmatically during a conversation. This gives the AI the ability to invoke custom commands on your behalf when appropriate.

To encourage the AI to trigger `SlashCommand` tool, your instructions (prompts, GROK.md, etc.) generally need to reference the command by name with its slash.

Example:

```
> Run /write-unit-test when you are about to start writing tests.
```

This tool puts each available custom slash command's metadata into context up to the character budget limit. You can use `/context` to monitor token usage and follow the operations below to manage context.

### `SlashCommand` tool supported commands

`SlashCommand` tool only supports custom slash commands that:

- Are user-defined. Built-in commands like `/compact` and `/init` are _not_ supported.
- Have the `description` frontmatter field populated. We use the `description` in the context.

### Disable `SlashCommand` tool

To prevent the AI from executing any slash commands via the tool:

```bash theme={null}
/permissions
# Add to deny rules: SlashCommand
```

This will also remove SlashCommand tool (and the slash command descriptions) from context.

### Disable specific commands only

To prevent a specific slash command from becoming available, add `disable-model-invocation: true` to the slash command's frontmatter.

This will also remove the command's metadata from context.

### `SlashCommand` permission rules

The permission rules support:

- **Exact match**: `SlashCommand:/commit` (allows only `/commit` with no arguments)
- **Prefix match**: `SlashCommand:/review-pr:*` (allows `/review-pr` with any arguments)

### Character budget limit

The `SlashCommand` tool includes a character budget to limit the size of command descriptions shown to the AI. This prevents token overflow when many commands are available.

The budget includes each custom slash command's name, args, and description.

- **Default limit**: 15,000 characters
- **Custom limit**: Set via `SLASH_COMMAND_TOOL_CHAR_BUDGET` environment variable

When the character budget is exceeded, the AI will see only a subset of the available commands. In `/context`, a warning will show with "M of N commands".

## Skills vs slash commands

> ** Parity Gap:** Neither custom slash commands nor Agent Skills are currently implemented in Grok One-Shot. These are planned features for future releases.

**Slash commands** and **Agent Skills** serve different purposes:

### Use slash commands for

**Quick, frequently-used prompts**:

- Simple prompt snippets you use often
- Quick reminders or templates
- Frequently-used instructions that fit in one file

**Examples**:

- `/review` → "Review this code for bugs and suggest improvements"
- `/explain` → "Explain this code in simple terms"
- `/optimize` → "Analyze this code for performance issues"

### Use Skills for

**Comprehensive capabilities with structure**:

- Complex workflows with multiple steps
- Capabilities requiring scripts or utilities
- Knowledge organized across multiple files
- Team workflows you want to standardize

**Examples**:

- PDF processing Skill with form-filling scripts and validation
- Data analysis Skill with reference docs for different data types
- Documentation Skill with style guides and templates

### Key differences

| Aspect         | Slash Commands                   | Agent Skills                        |
| -------------- | -------------------------------- | ----------------------------------- |
| **Complexity** | Simple prompts                   | Complex capabilities                |
| **Structure**  | Single .md file                  | Directory with SKILL.md + resources |
| **Discovery**  | Explicit invocation (`/command`) | Automatic (based on context)        |
| **Files**      | One file only                    | Multiple files, scripts, templates  |
| **Scope**      | Project or personal              | Project or personal                 |
| **Sharing**    | Via git                          | Via git                             |

### Example comparison

**As a slash command**:

```markdown theme={null}
# .grok/commands/review.md

Review this code for:

- Security vulnerabilities
- Performance issues
- Code style violations
```

Usage: `/review` (manual invocation)

**As a Skill**:

```
.grok/skills/code-review/
├── SKILL.md (overview and workflows)
├── SECURITY.md (security checklist)
├── PERFORMANCE.md (performance patterns)
├── STYLE.md (style guide reference)
└── scripts/
└── run-linters.sh
```

Usage: "Can you review this code?" (automatic discovery)

The Skill provides richer context, validation scripts, and organized reference material.

### When to use each

**Use slash commands**:

- You invoke the same prompt repeatedly
- The prompt fits in a single file
- You want explicit control over when it runs

**Use Skills**:

- The AI should discover the capability automatically
- Multiple files or scripts are needed
- Complex workflows with validation steps
- Team needs standardized, detailed guidance

Both slash commands and Skills can coexist. Use the approach that fits your needs.

## See also

- [Interactive mode](/en/interactive-mode) - Shortcuts, input modes, and interactive features
- [CLI reference](/en/cli-reference) - Command-line flags and options
- [Settings](/en/settings) - Configuration options
- [Memory management](/en/memory) - Managing Grok's memory across sessions
