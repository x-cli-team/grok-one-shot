# Grok One-Shot - AI-Powered CLI Assistant

**Version**: 1.2.0
**Built with**: Grok API (xAI), TypeScript, React/Ink
**Purpose**: Terminal-based AI assistant for software development

## Overview

Grok One-Shot is an interactive CLI tool that brings AI-powered assistance directly to your terminal. Built as a clone of Claude Code adapted for the Grok API, it provides intelligent code editing, research, and development workflow automation.

## Core Capabilities

- **Interactive Terminal UI**: React/Ink-based interface with rich text formatting
- **Intelligent Code Operations**: Multi-file editing, refactoring, analysis
- **Research & Planning**: Automated research workflows with approval gates
- **Context-Aware**: Loads project documentation on-demand
- **MCP Integration**: Model Context Protocol for enhanced capabilities
- **Session Management**: Auto-saves conversations with token tracking

## 📚 Documentation Structure & Context Loading

### SSOT Documentation Location

All project documentation is now consolidated in `apps/site/docs/` as the single source of truth. This includes:

- User guides and features
- Developer references and architecture
- Parity analyses and technical docs
- General project information (roadmap, legal)

### Context Loading for AI Agent

- **Startup Load**: GROK.md + docs-summary.md (~5-10k tokens compressed)
- **On-Demand Access**: Full docs available via Read tool from `apps/site/docs/`
- **Compressed Summary**: `.agent/docs-summary.md` provides condensed awareness of all docs for efficient context
- **Sprint Tracking**: `.agent/tasks/current-sprint.md` auto-updated via Husky for current work awareness

### Required Workflow for Sprint Management

When starting or progressing through a sprint:

1. Create/update sprint doc in `.agent/tasks/` (e.g., `2025-11-XX-sprint-name.md`)
2. Update `.agent/tasks/current-sprint.md` with active sprint details
3. Commit changes – Husky auto-updates docs-summary.md with sprint status
4. Agent starts with full awareness of current work for seamless resumption

### Legacy Sync Note (Resolved)

Documentation is now maintained directly in `apps/site/docs/` (Docusaurus site). No more sync from `.agent/docs/`.
Automatic sync destroys unique branding and interactive elements.

## Verification

$ grep -A 5 "EXCLUDED_FILES" apps/site/src/scripts/sync-agent-docs.js

````

### Future-Proof Workflow (MANDATORY)

**When Editing Site/UI Files** (`index.tsx`, `index.module.css`):

1. **Manual Sync Only**: Run `npm run sync:docs` explicitly when needed
2. **Skip Auto-Sync**: Use `SKIP_DOC_SYNC=true npm run smart-push` for site changes
3. **Verify Protection Before Sync**:

   ```bash
   # Check exclusions exist
   grep "index.tsx" apps/site/src/scripts/sync-agent-docs.js

   # Test: Should NOT overwrite custom features
   cd apps/site && npm run sync:docs
   grep -c "completionBadge" src/pages/index.tsx  # Should return 7
````

### Pre-Commit Safety Check (Add to `.husky/pre-commit`)

````bash
# 🚨 PROTECT LANDING PAGE FROM DOC SYNC OVERWRITE
if git diff --name-only | grep -q '^apps/site/src/pages/index\.\(tsx\|css\)

```bash
# Set API key
export GROK_API_KEY="your-key-here"

# Run interactively
grok-one-shot

# Run with initial message
grok-one-shot "analyze the authentication flow"

# Headless mode
grok-one-shot -p "list all TODO comments"
````

## Architecture

### Key Components

- **GrokAgent** (`src/agent/grok-agent.ts`): Core AI agent with streaming support
- **Chat Interface** (`src/ui/components/`): React-based terminal UI
- **Hooks System** (`src/hooks/`): React hooks for state management
- **MCP Integration** (`src/mcp/`): Model Context Protocol client
- **Context System**: On-demand documentation loading (GROK.md + docs-index.md)
- **Codebase Intelligence** (`src/services/`): Advanced indexing and semantic search
- **Plan Mode** (`src/services/`): Read-only exploration with comprehensive tooling

### Context Loading Strategy

Grok One-Shot uses an efficient on-demand context loading approach:

- **Startup**: Loads only GROK.md + docs-index.md (~700 tokens)
- **Runtime**: AI agent reads specific docs via Read tool as needed
- **Savings**: 93-96% reduction vs old auto-read system (65k-85k → 700 tokens)

## Configuration

### Environment Variables

```bash
GROK_API_KEY        # Required: xAI API key
GROK_MODEL          # Optional: Model selection (default: grok-4-fast-non-reasoning)
GROK_BASE_URL       # Optional: Custom API endpoint
MAX_TOOL_ROUNDS     # Optional: Max tool iterations (default: 400)
```

### Settings

Settings stored in `~/.grok/settings.json`:

- API key and base URL
- Model preferences
- Confirmation settings
- MCP server configurations

## Documentation Structure

All detailed documentation lives in `apps/site/docs/`:

- **Architecture**: System design, data flow, module structure
- **Development**: Setup, contribution guidelines, testing
- **Features**: Detailed capability documentation
- **Operations**: Deployment, monitoring, troubleshooting
- **SOP**: Standard operating procedures and workflows
- **Tasks**: Current sprints and implementation plans

See `docs-index.md` for complete documentation map.

## Development Workflow

### 🧪 **Agent Self-Testing: Revolutionary Development Method**

**BREAKTHROUGH**: Grok One-Shot introduces the first AI-agent self-testing workflow for iterative development. The agent can test itself, analyze outputs, and iterate to perfection.

#### **Primary Development Method**

```bash
# 🚀 CORE WORKFLOW: Agent tests itself and iterates
./scripts/test-agent-iterative.sh "test prompt"
# Agent reads log, identifies issues, makes fixes, repeats

# 📊 Comprehensive test suite (multiple test cases)
./scripts/agent-self-test.js

# ⚡ Quick iteration loop
npm run test-log "specific prompt"
# Outputs to agent-test.log for analysis
```

#### **Why This is Revolutionary**

1. **Complete Visibility**: See exactly what users see
2. **Automated Issue Detection**: Scripts find formatting problems, errors, isolated dots
3. **Rapid Iteration**: No manual testing - agent fixes itself
4. **Pattern Recognition**: Identify systemic issues across scenarios
5. **Quality Assurance**: Every change verified immediately

#### **Iteration Process**

```
Test → Read Log → Identify Issues → Make Fixes → Re-test → Perfect!
```

**Example Success**: Used this method to fix the isolated `⏺` dot bug in 3 iterations:

1. **Test**: Found dots appearing between sections
2. **Log Analysis**: Revealed empty markdown headers causing issue
3. **Fix**: Enhanced content validation in UI components
4. **Verify**: Clean output with no visual artifacts ✅

### Build & Run

```bash
# Install dependencies
bun install

# Development mode
bun run dev

# Build for production
bun run build

# Run tests
bun test
```

### Code Structure

```
src/
├── agent/              # GrokAgent core logic
├── commands/           # CLI subcommands (mcp, set-name, etc.)
├── hooks/              # React hooks for state management
├── mcp/                # Model Context Protocol integration
├── services/           # Business logic (codebase intelligence, Plan Mode, workflows)
├── ui/                 # Terminal UI components (React/Ink)
├── utils/              # Utilities (settings, confirmation, etc.)
└── index.ts            # Entry point

.agent/
├── docs/               # Comprehensive documentation
│   ├── architecture/   # System architecture docs
│   ├── development/    # Developer guides
│   ├── features/       # Feature documentation
│   └── operations/     # Ops and deployment
├── sop/                # Standard operating procedures
├── system/             # System configuration
└── tasks/              # Sprint plans and tasks
```

## Key Features

### 1. Advanced Codebase Intelligence ⭐ **NEW**

- **Deep Code Understanding**: Million-line codebase indexing with symbol extraction
- **Semantic Search**: Natural language code discovery ("find authentication logic")
- **Architectural Analysis**: Feature mapping and cross-cutting concern detection
- **Flow Tracing**: Execution path analysis with complexity metrics
- **Symbol Intelligence**: Complete relationship mapping and usage tracking

### 2. Plan Mode - Claude Code Parity ⭐ **COMPLETE**

- **Read-Only Exploration**: Safe codebase analysis with tool simulation
- **Strategy Formulation**: AI-powered planning with approval workflows
- **Phased Activation**: Rich visual feedback (3800+ lines of architecture)
- **Keyboard Activation**: Shift+Tab twice for instant Plan Mode

### 3. Intelligent Code Editing

- Multi-file edits with context awareness
- Refactoring with impact analysis
- Syntax-aware modifications

### 4. Research Workflows

- Automated research with approval gates
- Codebase exploration and analysis
- Recommendation generation

### 3. MCP Integration

- Extensible via Model Context Protocol
- Custom tools and capabilities
- Server management via CLI

### 4. Session Management

- Auto-saves to `~/.grok/sessions/`
- Token usage tracking
- Session replay capability

### 5. Confirmation System

- Configurable approval gates
- Operation-level control
- Session-level overrides

## Common Commands

```bash
# Interactive mode
grok-one-shot

# With initial message
grok-one-shot "analyze authentication flow"

# Headless (non-interactive)
grok-one-shot -p "list all TODOs"

# Change directory
grok-one-shot -d /path/to/project

# Model selection
grok-one-shot -m grok-4-fast-non-reasoning

# MCP server management
grok-one-shot mcp add <server-name> <command>
grok-one-shot mcp list
grok-one-shot mcp remove <server-name>

# Configuration
grok-one-shot set-name "Your Name"
grok-one-shot toggle-confirmations
```

## Best Practices

1. **Context Management**: Let AI load docs on-demand; don't pre-load everything
2. **Token Efficiency**: Use headless mode for simple queries
3. **MCP Extensions**: Add custom tools via MCP for domain-specific needs
4. **Session Review**: Check `~/.grok/sessions/` for session history
5. **Documentation**: Keep `apps/site/docs/` updated directly (no sync needed)

## Integration with CI/CD

Pre-commit hooks automatically:

- Edit docs directly in `apps/site/docs/` (Docusaurus site)
- Validate documentation structure
- Update doc indexes

## Troubleshooting

### Common Issues

**"No API key found"**

- Set `GROK_API_KEY` environment variable
- Or use `-k` flag: `grok-one-shot -k your-key`

**"Error: X CLI requires an interactive terminal"**

- Use `-p` flag for headless mode
- Or run in proper TTY environment

**"Too many tool rounds"**

- Increase `MAX_TOOL_ROUNDS` environment variable
- Default is 400; adjust based on task complexity

### Debug Logging

Check `xcli-startup.log` in current directory for startup diagnostics.

## Contributing

See `apps/site/docs/community/contributing.md` for detailed contribution guidelines.

## License

MIT License - see LICENSE file

## Support

- Issues: File in GitHub repository
- Documentation: See `apps/site/docs/` directory
- Updates: Check `grok-one-shot --version` for latest version

---

**For detailed documentation, see `docs-index.md` and `apps/site/docs/` directory.**
; then
echo "⚠️ LANDING PAGE CHANGES DETECTED"
echo "💡 Skipping automatic doc sync to preserve custom features (badges, PARITY nav)"
SKIP_DOC_SYNC=true

# Skip sync-agent-docs but run other validations

npm run lint && npm run typecheck
else

# Normal sync for .agent/ docs only

npm run update-agent-docs-auto || echo "📝 Documentation sync skipped"
fi

````

### Emergency Recovery (If Sync Breaks Again)
**Immediate Git Restore**:
```bash
# Restore from most recent backup (before sync)
git checkout HEAD~1 -- apps/site/src/pages/index.tsx apps/site/src/pages/index.module.css

# Verify restoration
echo "Checking landing page features:"
grep -c "completionBadge" apps/site/src/pages/index.tsx  # Should be 7
grep "PARITY-" apps/site/src/pages/index.tsx            # Should show nav link
grep "powerful-features" apps/site/src/pages/index.tsx  # Should show section ID
````

**Manual Re-apply** (If no backup):

1. **Add Completion Badges** (7 feature cards):
   ```bash
   # Use sed or manual edit to restore <div className={styles.completionBadge}>XX% Complete</div>
   ```
2. **Restore PARITY Nav**: Line ~38: `<NavLink href="#powerful-features">PARITY-[62%]</NavLink>`
3. **Add Section ID**: FeaturesSection: `<section id="powerful-features" className={styles.section}>`
4. **Right-Align CSS**: `justify-content: space-between` + `margin-left: auto`

### Monitoring Commands (Add to Workflow)

**Daily Check** (Add to `.bashrc` or `package.json`):

```bash
# Verify landing page protection before any sync
alias check-site-protection='echo "=== LANDING PAGE SYNC PROTECTION ===" && \
  grep -A 5 "EXCLUDED_FILES" apps/site/src/scripts/sync-agent-docs.js && \
  echo "Features count: $(grep -c "completionBadge" apps/site/src/pages/index.tsx)/7" && \
  echo "PARITY nav: $(grep -c "PARITY-" apps/site/src/pages/index.tsx)"'

# Usage: check-site-protection
```

**CI/CD Verification** (GitHub Actions):

```yaml
- name: Verify Landing Page Protection
  run: |
    if ! grep -q "EXCLUDED_FILES.*index.tsx" apps/site/src/scripts/sync-agent-docs.js; then
      echo "❌ ERROR: Landing page exclusions missing from sync-agent-docs.js!"
      echo "💡 Add 'src/pages/index.tsx' to EXCLUDED_FILES array immediately"
      exit 1
    fi
    echo "✅ Landing page protection verified - $(grep -c 'completionBadge' apps/site/src/pages/index.tsx) badges found"
```

### Team Alert (All Contributors - Add to CONTRIBUTING.md)

```
🚨 CRITICAL: Landing Page Sync Protection

## NEVER DO THIS:
- Run `npm run smart-push` on branches with site changes without `SKIP_DOC_SYNC=true`
- Auto-sync when editing `apps/site/src/pages/index.*` files
- Ignore `check-site-protection` warnings

## ALWAYS DO THIS:
- Use: `SKIP_DOC_SYNC=true npm run smart-push` for site/UI changes
- Verify: `check-site-protection` before merging site changes
- Manual sync: `npm run sync:docs` only for .agent/ documentation

## Why This Matters
The landing page contains custom marketing features (badges, PARITY nav, hero animations)
that took hours to design. One sync overwrite = hours of lost work.

## Recovery Cost
- Manual restoration: 30-60 minutes
- Prevention: 2 minutes (use SKIP_DOC_SYNC)
```

### Impact Assessment

- **Risk**: HIGH (custom features = marketing value)
- **Frequency**: Every husky-triggered sync affecting .agent/ files
- **Prevention ROI**: 100% (exclusions eliminate risk completely)
- **Status**: Landing page now **permanently protected** from sync overwrites

---

## Quick Start

```bash
# Set API key
export GROK_API_KEY="your-key-here"

# Run interactively
grok-one-shot

# Run with initial message
grok-one-shot "analyze the authentication flow"

# Headless mode
grok-one-shot -p "list all TODO comments"
```

## Architecture

### Key Components

- **GrokAgent** (`src/agent/grok-agent.ts`): Core AI agent with streaming support
- **Chat Interface** (`src/ui/components/`): React-based terminal UI
- **Hooks System** (`src/hooks/`): React hooks for state management
- **MCP Integration** (`src/mcp/`): Model Context Protocol client
- **Context System**: On-demand documentation loading (GROK.md + docs-index.md)
- **Codebase Intelligence** (`src/services/`): Advanced indexing and semantic search
- **Plan Mode** (`src/services/`): Read-only exploration with comprehensive tooling

### Context Loading Strategy

Grok One-Shot uses an efficient on-demand context loading approach:

- **Startup**: Loads only GROK.md + docs-index.md (~700 tokens)
- **Runtime**: AI agent reads specific docs via Read tool as needed
- **Savings**: 93-96% reduction vs old auto-read system (65k-85k → 700 tokens)

## Configuration

### Environment Variables

```bash
GROK_API_KEY        # Required: xAI API key
GROK_MODEL          # Optional: Model selection (default: grok-4-fast-non-reasoning)
GROK_BASE_URL       # Optional: Custom API endpoint
MAX_TOOL_ROUNDS     # Optional: Max tool iterations (default: 400)
```

### Settings

Settings stored in `~/.grok/settings.json`:

- API key and base URL
- Model preferences
- Confirmation settings
- MCP server configurations

## Documentation Structure

All detailed documentation lives in `apps/site/docs/`:

- **Architecture**: System design, data flow, module structure
- **Development**: Setup, contribution guidelines, testing
- **Features**: Detailed capability documentation
- **Operations**: Deployment, monitoring, troubleshooting
- **SOP**: Standard operating procedures and workflows
- **Tasks**: Current sprints and implementation plans

See `docs-index.md` for complete documentation map.

## Development Workflow

### 🧪 **Agent Self-Testing: Revolutionary Development Method**

**BREAKTHROUGH**: Grok One-Shot introduces the first AI-agent self-testing workflow for iterative development. The agent can test itself, analyze outputs, and iterate to perfection.

#### **Primary Development Method**

```bash
# 🚀 CORE WORKFLOW: Agent tests itself and iterates
./scripts/test-agent-iterative.sh "test prompt"
# Agent reads log, identifies issues, makes fixes, repeats

# 📊 Comprehensive test suite (multiple test cases)
./scripts/agent-self-test.js

# ⚡ Quick iteration loop
npm run test-log "specific prompt"
# Outputs to agent-test.log for analysis
```

#### **Why This is Revolutionary**

1. **Complete Visibility**: See exactly what users see
2. **Automated Issue Detection**: Scripts find formatting problems, errors, isolated dots
3. **Rapid Iteration**: No manual testing - agent fixes itself
4. **Pattern Recognition**: Identify systemic issues across scenarios
5. **Quality Assurance**: Every change verified immediately

#### **Iteration Process**

```
Test → Read Log → Identify Issues → Make Fixes → Re-test → Perfect!
```

**Example Success**: Used this method to fix the isolated `⏺` dot bug in 3 iterations:

1. **Test**: Found dots appearing between sections
2. **Log Analysis**: Revealed empty markdown headers causing issue
3. **Fix**: Enhanced content validation in UI components
4. **Verify**: Clean output with no visual artifacts ✅

### Build & Run

```bash
# Install dependencies
bun install

# Development mode
bun run dev

# Build for production
bun run build

# Run tests
bun test
```

### Code Structure

```
src/
├── agent/              # GrokAgent core logic
├── commands/           # CLI subcommands (mcp, set-name, etc.)
├── hooks/              # React hooks for state management
├── mcp/                # Model Context Protocol integration
├── services/           # Business logic (codebase intelligence, Plan Mode, workflows)
├── ui/                 # Terminal UI components (React/Ink)
├── utils/              # Utilities (settings, confirmation, etc.)
└── index.ts            # Entry point

.agent/
├── docs/               # Comprehensive documentation
│   ├── architecture/   # System architecture docs
│   ├── development/    # Developer guides
│   ├── features/       # Feature documentation
│   └── operations/     # Ops and deployment
├── sop/                # Standard operating procedures
├── system/             # System configuration
└── tasks/              # Sprint plans and tasks
```

## Key Features

### 1. Advanced Codebase Intelligence ⭐ **NEW**

- **Deep Code Understanding**: Million-line codebase indexing with symbol extraction
- **Semantic Search**: Natural language code discovery ("find authentication logic")
- **Architectural Analysis**: Feature mapping and cross-cutting concern detection
- **Flow Tracing**: Execution path analysis with complexity metrics
- **Symbol Intelligence**: Complete relationship mapping and usage tracking

### 2. Plan Mode - Claude Code Parity ⭐ **COMPLETE**

- **Read-Only Exploration**: Safe codebase analysis with tool simulation
- **Strategy Formulation**: AI-powered planning with approval workflows
- **Phased Activation**: Rich visual feedback (3800+ lines of architecture)
- **Keyboard Activation**: Shift+Tab twice for instant Plan Mode

### 3. Intelligent Code Editing

- Multi-file edits with context awareness
- Refactoring with impact analysis
- Syntax-aware modifications

### 4. Research Workflows

- Automated research with approval gates
- Codebase exploration and analysis
- Recommendation generation

### 3. MCP Integration

- Extensible via Model Context Protocol
- Custom tools and capabilities
- Server management via CLI

### 4. Session Management

- Auto-saves to `~/.grok/sessions/`
- Token usage tracking
- Session replay capability

### 5. Confirmation System

- Configurable approval gates
- Operation-level control
- Session-level overrides

## Common Commands

```bash
# Interactive mode
grok-one-shot

# With initial message
grok-one-shot "analyze authentication flow"

# Headless (non-interactive)
grok-one-shot -p "list all TODOs"

# Change directory
grok-one-shot -d /path/to/project

# Model selection
grok-one-shot -m grok-4-fast-non-reasoning

# MCP server management
grok-one-shot mcp add <server-name> <command>
grok-one-shot mcp list
grok-one-shot mcp remove <server-name>

# Configuration
grok-one-shot set-name "Your Name"
grok-one-shot toggle-confirmations
```

## Best Practices

1. **Context Management**: Let AI load docs on-demand; don't pre-load everything
2. **Token Efficiency**: Use headless mode for simple queries
3. **MCP Extensions**: Add custom tools via MCP for domain-specific needs
4. **Session Review**: Check `~/.grok/sessions/` for session history
5. **Documentation**: Keep `apps/site/docs/` updated directly (no sync needed)

## Integration with CI/CD

Pre-commit hooks automatically:

- Edit docs directly in `apps/site/docs/` (Docusaurus site)
- Validate documentation structure
- Update doc indexes

## Troubleshooting

### Common Issues

**"No API key found"**

- Set `GROK_API_KEY` environment variable
- Or use `-k` flag: `grok-one-shot -k your-key`

**"Error: X CLI requires an interactive terminal"**

- Use `-p` flag for headless mode
- Or run in proper TTY environment

**"Too many tool rounds"**

- Increase `MAX_TOOL_ROUNDS` environment variable
- Default is 400; adjust based on task complexity

### Debug Logging

Check `xcli-startup.log` in current directory for startup diagnostics.

## Contributing

See `apps/site/docs/community/contributing.md` for detailed contribution guidelines.

## License

MIT License - see LICENSE file

## Support

- Issues: File in GitHub repository
- Documentation: See `apps/site/docs/` directory
- Updates: Check `grok-one-shot --version` for latest version

---

**For detailed documentation, see `docs-index.md` and `apps/site/docs/` directory.**
