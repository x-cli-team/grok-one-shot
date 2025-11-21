# 🏗️ Grok CLI Architecture

## Project Type

**CLI Application** - Conversational AI tool with terminal interface

## Technology Stack

- **Language**: TypeScript (ES Modules)
- **Runtime**: Node.js (Bun optimized for development)
- **UI**: Ink (React for terminal)
- **Build**: TypeScript compiler + tsup for dual builds
- **Package Manager**: Bun (development), NPM (distribution/CI)
- **Linting**: ESLint with TypeScript support and auto-fix
- **Performance**: 4x faster dependency installs via Bun

## Core Architecture

### 🧠 Agent System (`src/agent/`)

- **GrokAgent**: Central orchestration with streaming, tool execution
- **Conversation Management**: Chat history and context handling
- **Model Integration**: X.AI Grok models via OpenAI-compatible API

### 🛠️ Tool System (`src/tools/`)

- **Modular Design**: Independent tools for specific operations
- **Core Tools**: Read, Write, Edit, Bash, Grep, Glob, LS
- **Advanced Tools**: MultiEdit, WebFetch, WebSearch, Task, TodoWrite
- **Documentation Tools**: NEW - Agent system generation and maintenance

### 🖥️ UI Components (`src/ui/`)

#### Component Architecture

- **Modular Design**: Single Responsibility Principle with focused components
- **Entry-Based Rendering**: Chat entries routed through specialized renderers
- **Content Renderers**: Dedicated components for different content types
- **Router Pattern**: ChatEntryRouter for type-based component selection

#### Core Components

- **ChatInterface** (180 lines): Main chat orchestration with agent integration
- **ChatHistory** (74 lines): Entry list management with filtering and pagination
- **ChatInterfaceRenderer**: Pure UI component for chat display logic

#### Entry Renderers (`components/chat-entries/`)

- **UserMessageEntry**: User input display with paste summary handling
- **AssistantMessageEntry**: AI response rendering with markdown support
- **ToolCallEntry**: Tool execution display with explanations and content rendering

#### Content Renderers (`components/content-renderers/`)

- **FileContentRenderer**: Syntax-aware file content display with indentation
- **MarkdownRenderer**: Rich text formatting for assistant responses

#### Supporting Components

- **Input Handling**: Enhanced terminal input with history and shortcuts
- **Component Library**: Reusable Ink components for consistent UX
- **Visual Feedback System**: Claude Code-style UX with contextual spinners and progress indicators
- **Color System**: Unified palette for consistent visual hierarchy
- **Background Activity**: Non-intrusive workspace awareness monitoring

### 🔌 MCP Integration (`src/mcp/`)

- **Model Context Protocol**: Extensible server integration
- **Supported Servers**: Linear, GitHub, custom servers
- **Transport Types**: stdio, HTTP, SSE

### ⚙️ Configuration (`src/utils/`)

- **Settings Management**: User and project-level config
- **Model Configuration**: Support for multiple AI models
- **File Locations**: ~/.grok/ for user, .grok/ for project

### 🎯 Services (`src/services/`)

- **UI State Management**: Central event bus for coordinating visual feedback
- **Paste Detection**: Claude Code-style paste summarization system
- **Context Management**: Session memory and workspace indexing coordination

## Build & Distribution

- **Development**: `bun run dev` for live reload (4x faster than npm)
- **Production**: `bun run build` → dist/ directory (optimized TypeScript compilation)
- **Linting**: `bun run lint` with auto-fix support (ESLint + TypeScript)
- **Installation**: NPM global package (universal compatibility)
- **CI/CD**: GitHub Actions with npm (stable workflow, proven reliability)
- **Migration**: Seamless switch from npm to Bun for development (Nov 2025)

## Extension Points

- **Tool System**: Add new tools in src/tools/
- **MCP Servers**: Configure external service integration
- **UI Components**: Extend terminal interface capabilities
- **Commands**: Add slash commands in input handler

## Current Capabilities

✅ Core file operations (Read, Write, Edit, MultiEdit)
✅ Shell integration (Bash, BashOutput, KillBash)
✅ Search and discovery (Grep, Glob, LS)
✅ Web capabilities (WebFetch, WebSearch)
✅ Task management (Task, TodoWrite)
✅ IDE integration (NotebookEdit, mcp**ide**)
✅ MCP server ecosystem
✅ Project-specific configuration
✅ **Claude Code-style UX** (Enhanced visual feedback system)
✅ **Professional UI** (ASCII art banner, contextual spinners, progress bars)
✅ **Real-time feedback** (Background activity monitoring, state coordination)
✅ **Consistent design** (Unified color system, motion design principles)
✅ **Context awareness** (Ctrl+I tooltip, workspace intelligence, memory pressure monitoring)
✅ **Dynamic status** (Real-time project stats, git branch detection, session tracking)
✅ **Keyboard workflow** (Global shortcuts for enhanced productivity)

## Implemented Features (P1-P3 Complete)

✅ **Documentation generation system** - Full .agent docs with 15+ commands
✅ **Subagent framework** - Token-optimized processing
✅ **Self-healing guardrails** - /heal command and incident tracking  
✅ **Advanced code intelligence** - CodeAwareEditor with syntax understanding
✅ **CI/CD integration** - Automated NPM publishing workflow
✅ **Multi-file operations** - Atomic editing with transaction support
✅ **Operation history** - Comprehensive undo/redo system
✅ **Advanced search** - Regex patterns with file filtering
✅ **File tree operations** - Directory management and organization

## Automation Infrastructure

✅ **GitHub Actions** - Combined release + publish workflow
✅ **Version Management** - Auto-bump with README synchronization
✅ **Protection System** - Safeguards against workflow breakage
✅ **Error Recovery** - Self-healing with guardrails
✅ **Documentation** - Comprehensive troubleshooting guides

## Documentation Architecture

### Internal Documentation System (`.agent/`)

- **Source of Truth**: All internal docs stored in `.agent/` directory
- **Organized Structure**: system/, sop/, tasks/, incidents/, parity/, sessions/
- **Git Integration**: Husky pre-commit hook auto-syncs to public docs
- **Session Logging**: `.agent/sessions/` captures agent-assisted development learnings

### Public Documentation System

- **Docusaurus Site**: `apps/site/` with comprehensive documentation
- **Auto-Sync**: `apps/site/src/scripts/sync-agent-docs.js` maps internal to public docs
- **OG Tags System**: Custom meta tags for social media branding
- **Build Validation**: Post-build checks prevent Docusaurus branding regressions

## Future Roadmap (2025)

🔲 **Git Integration** - Advanced operations, PR management
🔲 **Testing Framework** - Jest/Pytest integration
🔲 **IDE Integration** - VS Code extension, Vim plugin
🔲 **Database Tools** - SQL/NoSQL operation assistance
🔲 **Cloud Integration** - AWS, Docker, Kubernetes support

_Updated: 2025-10-28_
