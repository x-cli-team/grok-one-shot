---
title: Plan Mode
---

# Plan Mode

**Status:** Planned Feature (TBD)

## Overview

Plan Mode will provide a dedicated read-only exploration and planning phase before code execution, allowing users to review and approve AI-generated plans before any changes are made.

## Planned Features

### Core Capabilities

- **Read-Only Exploration**
- AI explores codebase without making changes
- Safe discovery phase with no file modifications
- Full access to Read, Glob, Grep tools only

- **Plan Generation**
- AI creates detailed execution plan
- Step-by-step breakdown of intended changes
- Impact analysis and risk assessment
- Dependency identification

- **Plan Review**
- Visual plan representation
- Change preview with file diffs
- Estimated token usage
- Risk indicators

- **Plan Approval Workflow**
- User reviews plan before execution
- Option to modify plan
- Approve/reject/refine workflow
- Plan-to-execution bridge

### Activation

**Planned triggers:**

```bash
# Explicit activation
grok --plan-mode

# Automatic activation (configurable)
# For complex multi-file operations

# Keyboard shortcut
Shift+Tab (twice) to enter plan mode
```

### Example Workflow

```
User: "Refactor authentication system to use OAuth"

[Plan Mode Activated]

AI: Entering plan mode to explore and create plan...

1. Exploring codebase
- Found authentication in src/auth/
- Identified 12 files affected
- Analyzed current implementation

2. Creating plan

Plan: OAuth Migration
├── Phase 1: Setup
│ ├── Install dependencies (passport, passport-google-oauth20)
│ └── Create OAuth configuration
├── Phase 2: Implementation
│ ├── Create OAuth strategy (src/auth/oauth-strategy.ts)
│ ├── Update auth middleware (src/auth/middleware.ts)
│ └── Add OAuth routes (src/api/oauth-routes.ts)
├── Phase 3: Integration
│ ├── Update user model (src/models/user.ts)
│ ├── Modify login flow (src/api/auth-routes.ts)
│ └── Update session handling (src/services/session-service.ts)
└── Phase 4: Testing
├── Add unit tests (tests/auth/)
├── Add integration tests
└── Manual testing checklist

Files to modify: 12
Files to create: 4
Estimated complexity: High
Estimated tokens: ~35,000
Risk level: Medium (authentication is critical)

[Approve] [Modify] [Reject]

User: Approve

[Plan Mode Exit → Execution Mode]

AI: Executing plan...
[Proceeds with changes]
```

## Technical Approach

**Planned implementation:**

1. **Plan Mode State**

- Separate UI mode indicator
- Read-only tool restrictions
- Plan data structure

2. **Plan Representation**

```typescript
interface Plan {
  id: string;
  description: string;
  phases: Phase[];
  filesAffected: string[];
  filesCreated: string[];
  estimatedTokens: number;
  riskLevel: "low" | "medium" | "high";
  dependencies: string[];
}
```

3. **Transition Logic**

- Enter: Switch to plan mode tools
- Review: Present plan to user
- Approve: Unlock write tools
- Execute: Follow plan steps
- Complete: Report results

## Roadmap

### Q1 2025: Sprint 1-2 (4 weeks)

- UI state management (activation, read-only interface)
- Keyboard shortcuts (Shift+Tab × 2)
- Safe exploration with read-only tools
- User approval workflow
- Plan-to-execution bridge

### Priority

**P0 - Critical** for competitive parity with Claude Code

Plan Mode is essential for:

- Safe exploration of unfamiliar codebases
- User confidence in AI changes
- Complex multi-file operations
- Risk mitigation

## Current Status

**Not yet implemented**

Current workaround:

```
User: "Before making changes, explain your plan"

AI: "I'll:
1. Read authentication files
2. Analyze current implementation
3. Propose changes
4. Wait for your approval
Then proceed with implementation."

User: "Approved, proceed"
```

## When Available

Plan Mode will transform the way users interact with Grok One-Shot for complex tasks:

- Confidence in AI understanding
- Visibility into planned changes
- Risk assessment before execution
- Ability to refine plans
- Safer multi-file operations

## Related Features

- [Subagents](./subagents.md) - Autonomous exploration (available now)
- [Research Mode](./research-mode.md) - Codebase analysis (available now)
- [Tool System](./tool-system.md) - Tool restrictions for plan mode
- [Multi-File Operations](#) - Coordinated changes (TBD)

## See Roadmap

For implementation timeline and details, see:

- `.agent/parity/implementation-roadmap.md`
- `/docs/roadmap`

---

**Check back after Q1 2025 for Plan Mode availability.**

Your feedback on this planned feature is welcome! File issues or discussions on GitHub.
