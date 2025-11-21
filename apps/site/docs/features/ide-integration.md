---
title: IDE Integration
---

# IDE Integration

**Status:** Planned Feature (TBD)

## Overview

Native IDE extensions for VS Code and JetBrains IDEs will bring Grok One-Shot directly into your editor with seamless integration.

## Planned Features

### VS Code Extension

- **Inline AI assistance** - Code suggestions and completions
- **Terminal integration** - grok embedded in VS Code terminal
- **Context sync** - Open files automatically available to AI
- **Sidebar panel** - Dedicated Grok One-Shot interface
- **Keyboard shortcuts** - Quick access to AI commands
- **File operations** - AI can modify open files directly
- **Git integration** - Commit, PR creation from extension

### JetBrains Extension

- **IntelliJ IDEA, PyCharm, WebStorm** compatibility
- **Tool window** - Dedicated Grok One-Shot panel
- **Editor actions** - Right-click AI commands
- **Context awareness** - Current file and cursor position
- **Refactoring support** - AI-powered refactorings
- **Inspection integration** - AI suggestions in code inspection

### Shared Capabilities

- **File watching** - AI aware of unsaved changes
- **Project context** - Full project structure available
- **Multi-cursor support** - Bulk AI operations
- **Diff preview** - Changes shown in editor diff view
- **Settings sync** - Shared configuration with CLI

## Roadmap

### Q2 2025: Sprint 11-12 (4 weeks)

- VS Code extension MVP
- Basic editor integration
- Context synchronization

**Priority:** P1 - Major feature for market positioning

## Current Workaround

Use Grok One-Shot CLI in integrated terminal:

```bash
# In VS Code or JetBrains terminal
grok

# AI can still modify files
# Refresh editor to see changes
```

## See Roadmap

- `.agent/parity/implementation-roadmap.md` - Q2 2025 Sprint 11-12
- `.agent/docs/development/extension-architecture.md` - TBD

---

**Check back Q2 2025 for IDE extensions.**
