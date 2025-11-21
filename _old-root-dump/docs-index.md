# Documentation Index

Complete map of Grok One-Shot documentation. All files are in `.agent/` directory.

## Quick Navigation

- **Start Here**: `GROK.md` (or `CLAUDE.md` symlink)
- **Architecture**: `.agent/system/architecture.md`
- **Contributing**: `.agent/README.md`
- **Git Workflow**: `.agent/sop/git-workflow.md`
- **Current Sprint**: `.agent/tasks/2025-11-05-sprint-claude-md-migration-and-docs-alignment.md`

## Documentation Structure

### Core Documentation (Root)

- `GROK.md` - Main documentation (this file)
- `CLAUDE.md` - Symlink to GROK.md for industry compatibility
- `docs-index.md` - This index file
- `README.md` - Project README for GitHub

### User Documentation (`.agent/docs/claude-code/`)

**Getting Started**

- `getting-started/overview.md` - Project overview and introduction
- `getting-started/quickstart.md` - Quick start guide (5-minute setup)
- `getting-started/common-workflows.md` - Real-world usage patterns

**Building with Grok One-Shot**

- `build-with-claude-code/subagents.md` - Autonomous task execution
- `build-with-claude-code/mcp.md` - Model Context Protocol integration
- `build-with-claude-code/troubleshooting.md` - Common issues and solutions

**Deployment**

- `deployment/overview.md` - Deployment strategies and environments

**Administration**

- `administration/advanced-installation.md` - Complex installation scenarios
- `administration/data-usage.md` - Data handling and privacy

**Configuration**

- `configuration/settings.md` - Configuration and settings
- `configuration/terminal-configuration.md` - Terminal setup and optimization
- `configuration/model-configuration.md` - Model selection and tuning
- `configuration/profiles.md` - Configuration profiles (TBD)

**Reference**

- `reference/cli-reference.md` - Complete CLI command reference
- `reference/interactive-mode.md` - Interactive session guide
- `reference/slash-commands.md` - Slash command reference
- `reference/advanced-slash-commands.md` - Advanced slash commands (TBD)

**Features**

- `features/context-management.md` - Context loading and optimization
- `features/tool-system.md` - Built-in tool capabilities
- `features/session-management.md` - Session handling and storage
- `features/git-integration.md` - Git operations and workflows
- `features/workflow-automation.md` - Automation patterns
- `features/research-mode.md` - Codebase exploration
- `features/codebase-intelligence.md` - Advanced indexing and semantic search ⭐ **NEW**
- `features/plan-mode.md` - Claude Code Plan Mode implementation ⭐ **COMPLETE**
- `features/paste-detection-parity.md` - Paste detection Claude Code parity tracker 🔄 **IN PROGRESS**
- `features/error-handling.md` - Error handling and recovery
- `features/plan-mode.md` - Plan mode (TBD)
- `features/ide-integration.md` - IDE extensions (TBD)
- `features/multi-file-operations.md` - Advanced multi-file ops (TBD)
- `features/codebase-intelligence.md` - Code intelligence (TBD)
- `features/performance-monitoring.md` - Performance metrics (TBD)
- `features/testing-integration.md` - Testing framework integration (TBD)
- `features/code-templates.md` - Code generation templates (TBD)
- `features/custom-tools.md` - Custom tool creation (TBD)
- `features/session-restore.md` - Session restoration (TBD)
- `features/export-import.md` - Export/import capabilities (TBD)
- `features/analytics.md` - Analytics dashboard (TBD)
- `features/notifications.md` - Notifications and alerts (TBD)
- `features/plugin-system.md` - Plugin architecture (TBD)
- `features/cloud-sync.md` - Cloud synchronization (TBD)

**Resources**

- `resources/legal-and-compliance.md` - Legal information and compliance

### System Architecture (`.agent/system/`)

**Core System Design**

- `architecture.md` - System architecture, data flow, module structure
- `critical-state.md` - Critical system state and health monitoring
- `api-schema.md` - API schemas and data structures

**Installation & Configuration**

- `installation.md` - Installation guide and setup
- `version-synchronization.md` - Version management across monorepo

**User Experience**

- `ux-feedback-system.md` - User feedback collection and analysis

### Standard Operating Procedures (`.agent/sop/`)

**Development Workflows**

- `documentation-workflow.md` - How to write and sync documentation
- `git-workflow.md` - Git branching, commits, and collaboration
- `automation-protection.md` - Protecting automated processes

**Release Management**

- `release-management.md` - Release process and checklist
- `version-management.md` - Version numbering and synchronization
- `npm-publishing-troubleshooting.md` - NPM publish issues and solutions

**Feature Development**

- `adding-new-command.md` - How to add new CLI commands
- `ux-feedback-system-maintenance.md` - Maintaining UX feedback system

### Feature Parity Analysis (`.agent/parity/`)

**Competitive Analysis**

- `README.md` - Overview of parity analysis
- `competitive-matrix.md` - Feature comparison matrix
- `gap-analysis.md` - Feature gaps and priorities

**Tool-Specific Analysis**

- `claude-code-features.md` - Claude Code feature breakdown
- `cursor-features.md` - Cursor feature breakdown
- `codex-features.md` - GitHub Copilot/Codex features
- `grok-cli-current-state.md` - Current Grok One-Shot capabilities

**Planning**

- `implementation-roadmap.md` - Feature implementation roadmap

### Active Tasks (`.agent/tasks/`)

**Current Sprint (November 2025)**

- `2025-11-05-sprint-claude-md-migration-and-docs-alignment.md` - Current epic
- `2025-11-05-claude-code-docs-mapping.md` - Claude Code docs mapping
- `2025-11-05-epic-status-summary.md` - Current status summary
- `2025-11-05-sprint-rebaseline.md` - Rebase documentation
- `2025-11-05-align-docs-to-claude-code-standards.md` - Initial alignment plan

**October 2025 Sprints**

- `2025-10-24-sprint-build-agent-claude-code-parity.md` - Agent parity work
- `2025-10-24-sprint-ux-refinement-claude-feel.md` - UX improvements
- `2025-10-23-sprint-git-integration-enhancement.md` - Git improvements
- `2025-10-23-sprint-paste-text-summary-enhancement.md` - Paste handling
- `2025-10-18-sprint-documentation-website.md` - Docusaurus site setup
- `2025-10-18-sprint-automated-testimonial-collection.md` - Testimonials
- `2025-10-18-sprint-enhanced-installation-ux.md` - Installation UX
- `2025-10-17-sprint-auto-compact-mode.md` - Compact mode
- `2025-10-17-sprint-hotfix-repaint-storm.md` - Performance fix
- `2025-10-16-sprint-automate-version-sync-and-hooks.md` - Version sync
- `2025-10-16-sprint-fix-faulty-tools.md` - Tool reliability
- `2025-10-16-sprint-stop-screen-glitch-cpu-spikes.md` - Performance issues

**Planning Documents**

- `2025-10-18-roadmap-claude-code-parity.md` - Long-term roadmap
- `2025-10-16-prd-example.md` - PRD template example
- `2025-10-16-prd-tool-inventory.md` - Tool inventory PRD
- `2025-10-16-plan-continue-tool-fixes.md` - Tool fix planning
- `2024-10-24-test-plan-mode-implementation.md` - Plan mode testing

### Incident Reports (`.agent/incidents/`)

**Resolved Incidents**

- `incident-npm-publish-failure.md` - NPM publish 403 error resolution
- `paste-detection-issues-v1123.md` - Paste detection problems
- `tool-reliability-fix-issue.md` - Tool reliability incident

### Session Logs (`.agent/sessions/`)

**Agent Sessions**

- `2025-10-27-agent-session-og-tags-fix.md` - OpenGraph tags fix session

### Commands (`.agent/commands/`)

**Agent Initialization**

- `init-agent.md` - Agent initialization command documentation

## Documentation by Use Case

### For New Users

1. Start: `.agent/docs/claude-code/getting-started/overview.md`
2. Quick start: `.agent/docs/claude-code/getting-started/quickstart.md`
3. Workflows: `.agent/docs/claude-code/getting-started/common-workflows.md`
4. CLI reference: `.agent/docs/claude-code/reference/cli-reference.md`
5. Troubleshooting: `.agent/docs/claude-code/build-with-claude-code/troubleshooting.md`

### For New Contributors

1. Start: `.agent/README.md`
2. Architecture: `.agent/system/architecture.md`
3. Git workflow: `.agent/sop/git-workflow.md`
4. Documentation: `.agent/sop/documentation-workflow.md`

### For Feature Development

1. Current roadmap: `.agent/parity/implementation-roadmap.md`
2. Gap analysis: `.agent/parity/gap-analysis.md`
3. Adding commands: `.agent/sop/adding-new-command.md`
4. Architecture: `.agent/system/architecture.md`

### For Release Management

1. Release SOP: `.agent/sop/release-management.md`
2. Version management: `.agent/sop/version-management.md`
3. NPM troubleshooting: `.agent/sop/npm-publishing-troubleshooting.md`
4. Critical state: `.agent/system/critical-state.md`

### For Understanding Current Work

1. Current sprint: `.agent/tasks/2025-11-05-sprint-claude-md-migration-and-docs-alignment.md`
2. Epic status: `.agent/tasks/2025-11-05-epic-status-summary.md`
3. Roadmap: `.agent/tasks/2025-10-18-roadmap-claude-code-parity.md`

### For Troubleshooting

1. Incidents: `.agent/incidents/`
2. NPM issues: `.agent/sop/npm-publishing-troubleshooting.md`
3. Critical state: `.agent/system/critical-state.md`

## File Naming Conventions

### Task Files

Format: `YYYY-MM-DD-{type}-{description}.md`

Types:

- `sprint-` - Sprint implementation plans
- `plan-` - General planning documents
- `prd-` - Product requirement documents
- `roadmap-` - Long-term roadmaps
- `test-` - Test plans
- `epic-` - Epic status documents

### Incident Files

Format: `incident-{description}.md` or `{description}-v{version}.md`

### Session Files

Format: `YYYY-MM-DD-agent-session-{description}.md`

## Documentation Standards

### Writing Guidelines

1. **Clarity**: Write for both humans and AI agents
2. **Structure**: Use clear headings and sections
3. **Links**: Use relative paths for internal links
4. **Token Efficiency**: Keep docs focused and concise
5. **Updates**: Update via git commits; Husky syncs to Docusaurus

### Markdown Standards

- Use ATX-style headers (`#` not `===`)
- Code blocks with language tags
- Tables for structured data
- Task lists for checklists

### Auto-Sync Process

The Husky pre-commit hook automatically:

1. Syncs `.agent/docs/` → `apps/site/docs/`
2. Updates documentation indexes
3. Validates markdown structure
4. Runs on every commit

See `.agent/sop/documentation-workflow.md` for details.

## Token Budget

This documentation system is designed for token efficiency:

- **GROK.md**: ~1,600 tokens (comprehensive overview)
- **docs-index.md**: ~500 tokens (this file)
- **Total startup**: ~3,500 tokens (94.6-95.8% reduction vs old 65k-85k!)
- **44 Claude Code docs**: Available on-demand via Read tool
- **On-demand loading**: AI reads specific docs only when needed

This achieves industry-standard documentation with minimal startup cost.

## Contributing to Documentation

1. **Follow structure**: Add to appropriate directory
2. **Update index**: Add new docs to this file
3. **Use templates**: Follow existing doc patterns
4. **Auto-sync**: Commit triggers Husky pre-commit hook
5. **Test locally**: Verify in `.agent/docs/` before committing

See `.agent/sop/documentation-workflow.md` for complete workflow.

---

**Last Updated**: 2025-11-05
**Version**: 1.2.0
**Maintained By**: Grok One-Shot Team
