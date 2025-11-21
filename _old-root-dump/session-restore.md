---
title: Session Restoration
---
# Session Restoration

**Status:** Planned Feature (TBD)

## Overview

Resume previous sessions with full context, continue conversations, and restore interrupted work seamlessly.

## Planned Features

- **Session resume** - Continue from where you left off
- **Context restoration** - Full conversation history loaded
- **Work recovery** - Resume interrupted operations
- **Session branching** - Fork session at any point
- **Session merging** - Combine insights from multiple sessions
- **Selective restore** - Choose parts of session to restore
- **Session search** - Find and resume old sessions
- **Auto-resume** - Resume last session on startup

### Example Workflow

```bash
# Resume last session
grok --resume

# Resume specific session
grok --resume session-2025-11-05-14-30-12

# Resume with summary
grok --resume --summarize

# List resumable sessions
grok sessions list

# Branch from session point
grok sessions branch session-xyz --from-message 15
```

## Roadmap

- **Q2 2025:** Sprint 17-18 - Context management features including session restore

**Priority:** P1 - User experience enhancement

## Current Capabilities

- Sessions saved automatically
- Manual review of session files
- No built-in resume command
- Manual context restoration

## Workaround

```bash
# Manually resume via summary
cat ~/.grok/sessions/session-2025-11-05-14-30-12.json | jq -r '.messages[-5:] | .[] | .content | .[0:200]'

grok

> Continuing from previous session:
[Paste summary]
Now let's...
```

---

**Check back Q2 2025 for session restoration.**