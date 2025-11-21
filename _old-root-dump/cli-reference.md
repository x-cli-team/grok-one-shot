---
title: CLI reference
---

# CLI reference

> Complete reference for Grok One-Shot command-line interface, including commands and flags.

## CLI commands

| Command                       | Description                                    | Example                                  |
| :---------------------------- | :--------------------------------------------- | :--------------------------------------- |
| `grok`                        | Start interactive REPL                         | `grok`                                   |
| `grok "query"`                | Start REPL with initial prompt                 | `grok "explain this project"`            |
| `grok -p "query"`             | Query via SDK, then exit                       | `grok -p "explain this function"`        |
| `cat file \| grok -p "query"` | Process piped content                          | `cat logs.txt \| grok -p "explain"`      |
| `grok mcp`                    | Configure Model Context Protocol (MCP) servers | See the Grok One-Shot MCP documentation. |

> ** Parity Gap:** Grok One-Shot does not yet support `-c`/`--continue` or `-r`/`--resume` flags for session continuation. Sessions are auto-saved to `~/.grok/sessions/` but resuming must be done manually.

> ** Parity Gap:** No `grok update` command. Updates must be done via package manager (`npm update -g @xagent/one-shot` or `bun update -g @xagent/one-shot`).

## CLI flags

Customize Grok One-Shot's behavior with these command-line flags:

| Flag                             | Description                                                                                                             | Example                                          |
| :------------------------------- | :---------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------- |
| `--add-dir`                      | Add additional working directories for Grok to access (validates each path exists as a directory)                       | `grok --add-dir ../apps ../lib`                  |
| `--allowedTools`                 | A list of tools that should be allowed without prompting the user for permission, in addition to settings.json files    | `"Bash(git log:*)" "Bash(git diff:*)" "Read"`    |
| `--disallowedTools`              | A list of tools that should be disallowed without prompting the user for permission, in addition to settings.json files | `"Bash(git log:*)" "Bash(git diff:*)" "Edit"`    |
| `--print`, `-p`                  | Print response without interactive mode (see SDK documentation for programmatic usage details)                          | `grok -p "query"`                                |
| `--system-prompt`                | Replace the entire system prompt with custom text (works in both interactive and print modes)                           | `grok --system-prompt "You are a Python expert"` |
| `--verbose`                      | Enable verbose logging, shows full turn-by-turn output (helpful for debugging in both print and interactive modes)      | `grok --verbose`                                 |
| `--max-turns`                    | Limit the number of agentic turns in non-interactive mode                                                               | `grok -p --max-turns 3 "query"`                  |
| `--model`                        | Sets the model for the current session (e.g., `grok-2-1212`, `grok-beta`)                                               | `grok --model grok-2-1212`                       |
| `--dangerously-skip-permissions` | Skip permission prompts (use with caution)                                                                              | `grok --dangerously-skip-permissions`            |

> ** Parity Gap:** Grok One-Shot does not support `--agents` flag for dynamic subagent definition. Subagent functionality may be added in future releases.

> ** Parity Gap:** No `--system-prompt-file` or `--append-system-prompt` flags. Only `--system-prompt` is supported for complete prompt replacement.

> ** Parity Gap:** No `--output-format`, `--input-format`, or `--include-partial-messages` flags for structured output in print mode.

> ** Parity Gap:** No `--permission-mode` or `--permission-prompt-tool` flags. Permission handling is simpler than Claude Code's IAM system.

<Tip>
The `-p` (print) flag is useful for scripting and automation, allowing you to use Grok One-Shot non-interactively.
</Tip>

### System prompt flags

Grok One-Shot provides the `--system-prompt` flag for customizing the system prompt:

| Flag              | Behavior                           | Modes               | Use Case                                               |
| :---------------- | :--------------------------------- | :------------------ | :----------------------------------------------------- |
| `--system-prompt` | **Replaces** entire default prompt | Interactive + Print | Complete control over Grok's behavior and instructions |

**When to use:**

- **`--system-prompt`**: Use when you need complete control over Grok's system prompt. This removes all default Grok One-Shot instructions, giving you a blank slate.

```bash theme={null}
grok --system-prompt "You are a Python expert who only writes type-annotated code"
```

<Note>
The `--system-prompt` flag completely replaces the default system prompt. For most use cases, consider whether you need this level of control, as it removes Grok One-Shot's built-in coding capabilities.
</Note>

For detailed information about print mode (`-p`) including verbose logging and programmatic usage, see the Grok One-Shot documentation.

## See also

- [Interactive mode](/en/interactive-mode) - Shortcuts, input modes, and interactive features
- [Slash commands](/en/slash-commands) - Interactive session commands
- [Quickstart guide](/en/quickstart) - Getting started with Grok One-Shot
- [Common workflows](/en/common-workflows) - Advanced workflows and patterns
- [Settings](/en/settings) - Configuration options
