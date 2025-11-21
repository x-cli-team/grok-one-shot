---
title: Interactive mode
---

# Interactive mode

> Complete reference for keyboard shortcuts, input modes, and interactive features in Grok One-Shot sessions.

## Keyboard shortcuts

<Note>
Keyboard shortcuts may vary by platform and terminal. Press `?` to see available shortcuts for your environment.
</Note>

### General controls

| Shortcut         | Description                        | Context                                        |
| :--------------- | :--------------------------------- | :--------------------------------------------- |
| `Ctrl+C`         | Cancel current input or generation | Standard interrupt                             |
| `Ctrl+D`         | Exit Grok One-Shot session         | EOF signal                                     |
| `Ctrl+L`         | Clear terminal screen              | Keeps conversation history                     |
| `Ctrl+O`         | Toggle verbose output              | Shows detailed tool usage and execution        |
| `Ctrl+R`         | Reverse search command history     | Search through previous commands interactively |
| `Up/Down arrows` | Navigate command history           | Recall previous inputs                         |

> ** Parity Gap:** Grok One-Shot does not support `Ctrl+V` for pasting images from clipboard. Image support may be added in future releases.

> ** Parity Gap:** No `Esc` + `Esc` rewind functionality. Code/conversation rewinding is not yet implemented.

> ** Parity Gap:** No `Tab` toggle for extended thinking mode. Extended thinking is not yet supported.

> ** Parity Gap:** No `Shift+Tab` or `Alt+M` for toggling permission modes. Permission system is simpler than Claude Code's IAM.

### Multiline input

| Method           | Shortcut       | Context                           |
| :--------------- | :------------- | :-------------------------------- |
| Quick escape     | `\` + `Enter`  | Works in all terminals            |
| macOS default    | `Option+Enter` | Default on macOS                  |
| Control sequence | `Ctrl+J`       | Line feed character for multiline |
| Paste mode       | Paste directly | For code blocks, logs             |

> ** Parity Gap:** No `/terminal-setup` command for configuring `Shift+Enter` binding. Use the default multiline methods above.

<Tip>
Use backslash + Enter (`\` + `Enter`) for multiline input. This works consistently across all terminals.
</Tip>

### Quick commands

| Shortcut     | Description                      | Notes                                                         |
| :----------- | :------------------------------- | :------------------------------------------------------------ |
| `#` at start | Memory shortcut - add to GROK.md | Prompts for file selection                                    |
| `/` at start | Slash command                    | See [slash commands](/en/slash-commands)                      |
| `!` at start | Bash mode                        | Run commands directly and add execution output to the session |
| `@`          | File path mention                | Trigger file path autocomplete                                |

## Vim editor mode

> ** Parity Gap:** Grok One-Shot does not yet support vim editor mode. This feature may be added in future releases based on user demand.

## Command history

Grok One-Shot maintains command history for the current session:

- History is stored per working directory
- Cleared with `/clear` command (if implemented)
- Use Up/Down arrows to navigate (see keyboard shortcuts above)
- **Note**: History expansion (`!`) is disabled by default

### Reverse search with Ctrl+R

Press `Ctrl+R` to interactively search through your command history:

1. **Start search**: Press `Ctrl+R` to activate reverse history search
2. **Type query**: Enter text to search for in previous commands - the search term will be highlighted in matching results
3. **Navigate matches**: Press `Ctrl+R` again to cycle through older matches
4. **Accept match**:

- Press `Tab` or `Esc` to accept the current match and continue editing
- Press `Enter` to accept and execute the command immediately

5. **Cancel search**:

- Press `Ctrl+C` to cancel and restore your original input
- Press `Backspace` on empty search to cancel

The search displays matching commands with the search term highlighted, making it easy to find and reuse previous inputs.

## Background bash commands

Grok One-Shot supports running bash commands in the background, allowing you to continue working while long-running processes execute.

### How backgrounding works

When Grok One-Shot runs a command in the background, it runs the command asynchronously and immediately returns a background task ID. Grok can respond to new prompts while the command continues executing in the background.

To run commands in the background, you can either:

- Prompt Grok One-Shot to run a command in the background
- Press Ctrl+B to move a regular Bash tool invocation to the background. (Tmux users must press Ctrl+B twice due to tmux's prefix key.)

**Key features:**

- Output is buffered and Grok can retrieve it using the BashOutput tool
- Background tasks have unique IDs for tracking and output retrieval
- Background tasks are automatically cleaned up when Grok One-Shot exits

**Common backgrounded commands:**

- Build tools (webpack, vite, make)
- Package managers (npm, yarn, pnpm)
- Test runners (jest, pytest)
- Development servers
- Long-running processes (docker, terraform)

### Bash mode with `!` prefix

Run bash commands directly without going through Grok by prefixing your input with `!`:

```bash theme={null}
! npm test
! git status
! ls -la
```

Bash mode:

- Adds the command and its output to the conversation context
- Shows real-time progress and output
- Supports the same `Ctrl+B` backgrounding for long-running commands
- Does not require Grok to interpret or approve the command

This is useful for quick shell operations while maintaining conversation context.

## See also

- [Slash commands](/en/slash-commands) - Interactive session commands
- [CLI reference](/en/cli-reference) - Command-line flags and options
- [Settings](/en/settings) - Configuration options
- [Memory management](/en/memory) - Managing GROK.md files
