# 📚 .agent Documentation System

_Last synced: 2025-11-05_
_Protection: Husky pre-commit hook prevents accidental folder deletion_

## 🔄 Recent Updates (November 2025)

- **⭐ NEW: Adaptive Terminal Color System**: Revolutionary terminal theme detection that automatically adapts text colors for optimal visibility across all terminal environments. Includes multiple manual override options via environment variables.
- **⭐ NEW: /safe-push Command**: Stable automated git workflow with 5-step quality checks (TypeScript, ESLint, git operations) integrated directly into CLI with real-time feedback. Replaces crash-prone smart-push.
- **🎨 Universal Text Visibility**: Fixed white text invisibility on light terminals by implementing adaptive color detection using COLORFGBG, TERM_BACKGROUND, and TERM_PROGRAM environment variables.
- **🛡️ CLI Stability Improvements**: Eliminated smart-push crashes by creating simplified workflow that doesn't overwhelm the CLI interface with complex shell operations.
- **🚨 CRITICAL FIX: Response Truncation Bug Resolved**: Fixed streaming system bug causing AI responses to cut off mid-sentence. Root cause was throttling logic preventing final content chunks from being processed. Solution: Added force parameter to bypass throttling on stream completion. Impact: 100% response completeness achieved.
- **📚 Streaming Architecture Documentation**: Added comprehensive technical documentation in `.agent/technical/streaming-architecture.md` with critical maintenance guidelines
- **Package Manager Migration**: Switched to Bun for development (npm for distribution)
- **Tooling Optimization**: 4x faster installs, improved TypeScript compilation
- **Lint System Overhaul**: Fixed parsing errors, streamlined configuration
- **Development Workflow**: New SOP for Bun-optimized development process

## Overview

This directory contains AI agent documentation for X-CLI. This system helps AI agents understand the project context efficiently without scanning the entire codebase.

### 🎯 Recent Features

- **Custom Assistant Name**: Users can set a custom name for the AI assistant via `grok set-name <name>`, stored globally in user settings
- **Persistent Confirmation System**: File operations and bash commands require user confirmation by default, with `grok toggle-confirmations` to enable/disable

## 🚀 New: "Research → Recommend → Execute → Auto-Doc" Workflow

X-CLI now features a complete workflow that transforms complex tasks into structured, operator-in-the-loop experiences:

### **Phase 1: Research** 🤔

- AI analyzes your task using intelligent context loading
- Loads system docs, SOPs, and recent task history
- Generates structured Issues/Options/Recommendation/Plan output

### **Phase 2: Recommend** 💡

- Presents clear decision framework with trade-offs
- Shows multiple options with effort/risk analysis
- Recommends optimal approach with confidence scoring

### **Phase 3: Execute** ⚡

- Sequential TODO execution with real-time progress
- Automatic diff display and patch generation
- Safety features: backups, git commits, error recovery
- Adaptive recovery when execution fails

### **Phase 4: Auto-Doc** 📝

- Automatic completion documentation in `.agent/tasks/`
- Lesson learning and SOP candidate detection
- Complete audit trail with metadata and outcomes

### Usage

```bash
# Interactive workflow (recommended)
xcli "implement user authentication system"

# Headless mode for CI
xcli --headless "add logging to API endpoints"

# Non-interactive fallback
xcli --noninteractive "old behavior"
```

### Benefits

- **Safety First**: All changes have patches and backups
- **Resilient**: Adaptive recovery from execution failures
- **Documented**: Automatic knowledge accumulation
- **Efficient**: "One-confirm" decision points, then hands-free execution
- **Contextual**: AI learns from project history and patterns

## 🚨 Critical Configuration Warnings

**🤖 AUTOMATED RELEASE SYSTEM IS NOW FULLY OPERATIONAL (2025-10-17)**

**DO NOT MODIFY THESE SETTINGS UNLESS YOU KNOW WHAT YOU'RE DOING:**

### 🔒 Protected NPM Publishing Settings

- **`package.json` name**: Must remain `"@xagent/x-cli"` (scoped). Changing this will break NPM publishing unless you have token access for that scope.
- **`package.json` publishConfig**: Must not include `"registry": "https://npm.pkg.github.com/"`. Publishing should go to npmjs.com, not GitHub Packages.
- **NPM_TOKEN secret**: Must be a valid automation token from the NPM account owning `@xagent/x-cli`.

### 🔒 Protected Automation Workflow

- **`.github/workflows/release.yml`**: Combined workflow handling version bump + NPM publish
- **`.husky/pre-commit`**: Git hook for version synchronization
- **`scripts/check-version.cjs`**: Automated version bumping and README updates
- **GitHub Secrets**: `PAT_TOKEN` (git operations) + `NPM_TOKEN` (NPM publishing)

### 🔒 Protected Git Operations

- **Git Hooks**: Do not re-enable interactive pre-push hooks, as they block CI/CD pushes.
- **Branch Protection**: Do not prevent GitHub Actions from pushing to main branch.

**Why?** Previous changes to these broke the entire publishing flow. The current system took multiple iterations to get working.

**📚 Full Protection Details**: See `sop/automation-protection.md`

## 📁 Directory Structure

### 📋 system/

Core project information and architecture:

- **architecture.md** - Project structure and design patterns
- **api-schema.md** - API endpoints and data schemas
- **critical-state.md** - Current system state snapshot
- **installation.md** - Installation and setup guide
- **ux-feedback-system.md** - Claude Code-style visual feedback architecture
- **version-synchronization.md** - Automated version management system

### 📝 tasks/

Product requirement documents and feature specifications:

- Store PRDs before implementation
- Reference related architecture and dependencies
- Track implementation progress

### 🎯 parity/

**STRATEGIC PRIORITY**: Competitive analysis driving development roadmap:

- **README.md** - Strategic overview and navigation
- **claude-code-features.md** - Comprehensive Claude Code capability analysis
- **cursor-features.md** - Cursor IDE AI-native editor capabilities
- **codex-features.md** - OpenAI Codex autonomous coding agent analysis
- **x-cli-current-state.md** - Complete X CLI capability inventory
- **gap-analysis.md** - Detailed feature gaps with P0/P1/P2 priorities
- **implementation-roadmap.md** - Strategic development plan through Q4 2025
- **competitive-matrix.md** - Side-by-side feature comparison matrix

**Current Position**: 65/100 vs Claude Code 95/100  
**Target**: 90%+ feature parity by Q4 2025

### 📖 sop/

Standard operating procedures and workflows:

- Development patterns and conventions
- Deployment and maintenance procedures
- Code review and testing guidelines
- **development-workflow.md** - Bun-optimized development process and package management (NEW)
- **ux-feedback-system-maintenance.md** - UX system maintenance and extension guidelines
- **automation-protection.md** - Critical automation system protection
- **release-management.md** - Automated publishing workflow procedures
- **npm-publishing-troubleshooting.md** - Complete NPM publishing failure diagnosis and recovery

### 🚨 incidents/

Documented failures with root cause analysis:

- Error patterns and their fixes
- Recovery procedures
- Prevention strategies

### 🛡️ guardrails/

Enforceable rules to prevent recurring mistakes:

- Naming conventions
- Configuration constraints
- Implementation patterns

### ⚙️ commands/

Documentation for documentation system commands:

- Usage guides for /init-agent, /update-agent-docs, etc.
- Integration workflows

### 📝 sessions/

Agent-assisted development session logs:

- Documented learnings and changes from development sessions
- Technical insights gained during implementation
- Process improvements and future recommendations

## 🎯 Usage Guidelines

### For AI Agents

1. **Always read README.md first** - Get project overview (this file)
2. **Check system/critical-state.md** - Understand current architecture
3. **Review relevant tasks/** - Check for related work or conflicts
4. **Follow sop/** patterns - Use established conventions
5. **Check guardrails/** - Avoid known failure patterns

### For Updates

- Run `/update-agent-docs` after significant changes
- Add new PRDs to tasks/ before implementation
- Update system docs when architecture changes
- Document new patterns in sop/

## 🔗 Cross-References

- Main project documentation: ../README.md
- Configuration: ../.grok/settings.json
- Build instructions: ../package.json

## 🆕 Recent Tasks

Recent sprint planning and implementation tasks:

- [2025-10-17-sprint-hotfix-repaint-storm.md](./tasks/2025-10-17-sprint-hotfix-repaint-storm.md)
- [2025-10-18-sprint-automated-testimonial-collection.md](./tasks/2025-10-18-sprint-automated-testimonial-collection.md)
- [2025-10-18-sprint-documentation-website.md](./tasks/2025-10-18-sprint-documentation-website.md)
- [2025-10-24-test-plan-mode-implementation.md](./tasks/2025-10-24-test-plan-mode-implementation.md)
- [2025-10-31-token-usage-investigation.md](./tasks/2025-10-31-token-usage-investigation.md)
- [2025-11-03-deep-codebase-intelligence-sprint-plan.md](./tasks/2025-11-03-deep-codebase-intelligence-sprint-plan.md)
- [2025-11-03-sprint-automatic-agent-docs-updates.md](./tasks/2025-11-03-sprint-automatic-agent-docs-updates.md)
- [2025-11-03-sprint-enhanced-plan-mode-claude-parity.md](./tasks/2025-11-03-sprint-enhanced-plan-mode-claude-parity.md)
- [2025-11-03-sprint-intelligent-text-paste-claude-parity.md](./tasks/2025-11-03-sprint-intelligent-text-paste-claude-parity.md)
- [file-create-test.md](./tasks/file-create-test.md)

_This section is automatically updated when new task files are created._

---

_Generated by Grok CLI Documentation System_
_Last updated: 2025-10-11_
