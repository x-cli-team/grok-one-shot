---
title: Output styles
---

# Output styles

> Adapt Grok One-Shot for uses beyond software engineering

> **Parity Gap**: Grok One-Shot does not currently implement the output styles feature from Claude Code. This is a planned enhancement.

## What are output styles?

Output styles (in Claude Code) allow you to customize the AI assistant's behavior and communication style by modifying the system prompt. This lets you use the tool as different types of agents while keeping its core capabilities like running scripts, reading/writing files, and tracking TODOs.

## Claude Code's built-in output styles

In Claude Code, there are three built-in output styles:

- **Default**: Software engineering assistant (standard behavior)
- **Explanatory**: Educational mode with "Insights" explaining implementation choices and codebase patterns
- **Learning**: Collaborative mode where the AI teaches by asking you to implement small pieces of code with `TODO(human)` markers

## How output styles work (in Claude Code)

Output styles modify the system prompt by:

- Removing default software engineering instructions
- Adding custom instructions for the selected style
- Preserving core tool functionality (file operations, bash, etc.)

## Current status in Grok One-Shot

**Not yet implemented**. Grok One-Shot currently uses a single system prompt optimized for software engineering tasks.

**Current capabilities**:

- Software engineering assistant (default mode)
- No output style switching
- No custom style creation
- No `/output-style` command

## Workarounds

While output styles are not natively supported, you can achieve similar results:

### 1. GROK.md customization

Add instructions to your project's `GROK.md` file:

```markdown
# Custom Behavior

When working on this project, please:

- Explain your reasoning before making changes
- Add detailed comments to new code
- Ask me to implement small helper functions
```

This will influence the AI's behavior for that specific project.

### 2. Session-level prompts

Start your session with instructions:

```
Please act as a teaching assistant. Explain your reasoning
before making changes and ask me to implement small pieces
when appropriate.
```

The AI will maintain this context throughout the session.

### 3. Command-line system prompt

> **Note**: This feature may be added in a future version. Check the current CLI options with `grok --help`.

A potential future enhancement could allow:

```bash
# Hypothetical future feature
grok --system-prompt "You are a teaching assistant..."
```

## Comparison to related features

### GROK.md vs. system prompt customization

| Feature     | GROK.md                | Output Styles (future)   |
| ----------- | ---------------------- | ------------------------ |
| Scope       | Project-specific       | Global or project        |
| Location    | Project root           | `~/.grok/output-styles/` |
| Format      | Loaded as user message | Modifies system prompt   |
| Persistence | Committed to repo      | User or project settings |
| Use case    | Project conventions    | Communication style      |

### Output styles vs. agents (future)

Both are planned features with different purposes:

- **Output styles**: Change how the main AI communicates
- **Sub-agents**: Delegate specific sub-tasks to specialized agents with different models/tools

### Output styles vs. slash commands

Different levels of customization:

- **Output styles**: Change the overall system prompt and behavior
- **Slash commands**: Predefined prompts for specific tasks (already supported in Grok One-Shot)

## Planned implementation

**Status**: Planned for future sprint

**Proposed features**:

1. Built-in styles: Default, Explanatory, Learning (matching Claude Code)
2. Custom style creation via markdown files
3. Style storage in `~/.grok/output-styles/` (user) and `.grok/output-styles/` (project)
4. CLI command or interactive menu for switching styles
5. Settings integration for persistence

**Proposed file format**:

```markdown
---
name: Teaching Assistant
description: Explains code and asks you to implement small pieces
---

# Teaching Assistant Style

You are an interactive CLI tool that helps users learn software
engineering by doing. When making changes:

1. Explain your reasoning first
2. For helper functions under 20 lines, add TODO(human) markers
3. Provide hints about implementation approach
4. Celebrate when the user completes TODOs

[Additional custom instructions...]
```

## Feature request

Interested in output styles for Grok One-Shot?

1. Star the GitHub repository
2. Comment on or create a feature request issue
3. Contribute! PRs welcome for this feature

## Related documentation

- **GROK.md**: See `.agent/docs/claude-code/configuration/grok-md.md`
- **Slash commands**: See `.agent/docs/claude-code/features/slash-commands.md`
- **Settings**: See `.agent/docs/claude-code/configuration/settings.md`

## Example use cases

When output styles are implemented, you could use them for:

**Learning Mode**:

- Onboarding new developers
- Teaching specific patterns or frameworks
- Code review with educational feedback

**Documentation Mode**:

- Generate comprehensive inline documentation
- Explain complex algorithms
- Create learning resources from code

**Research Mode**:

- Detailed analysis and explanations
- Exploration of multiple approaches
- Trade-off discussions

**Minimal Mode**:

- Concise responses only
- No explanations unless asked
- Fast iterations

## Contributing

Want to help implement output styles? The implementation would involve:

1. **System prompt management**: Modify `src/agent/grok-agent.ts` to support dynamic system prompts
2. **Storage**: Add file loading from `~/.grok/output-styles/`
3. **Settings integration**: Update `src/utils/settings.ts`
4. **CLI command**: Add new command or interactive menu
5. **Built-in styles**: Create default style definitions
6. **Documentation**: Update this page when implemented

See `.agent/docs/development/contributing.md` for contribution guidelines.

---

**Status**: Planned feature
**Priority**: P2 (quality of life improvement)
**Effort**: Medium (1-2 sprints)

**Last updated**: November 7, 2025
**Version**: 1.1.101
