# Source Code Overview (`src/`)

This directory contains the core implementation of Grok One-Shot.

## Directory Structure

```
src/
├── agent/              # GrokAgent core logic
├── commands/           # CLI subcommands
├── hooks/              # React hooks for state management
├── mcp/                # Model Context Protocol integration
├── services/           # Business logic services
├── ui/                 # Terminal UI components (React/Ink)
├── utils/              # Utility functions
└── index.ts            # Application entry point
```

## Key Modules

### `agent/` - Core AI Agent

**`grok-agent.ts`**: Main AI agent implementation
- Streaming API communication with Grok
- Message history management
- Tool execution orchestration
- Session logging
- Context-aware processing

### `commands/` - CLI Subcommands

**`mcp.ts`**: MCP server management
- Add/remove/list MCP servers
- Server configuration
- Integration with settings

**`set-name.ts`**: User name configuration
**`toggle-confirmations.ts`**: Confirmation preferences

### `hooks/` - React Hooks

**State Management**:
- `use-input-handler.ts` - User input processing
- `use-streaming.ts` - Streaming response handling
- `use-confirmations.ts` - Approval gate management
- `use-context-info.ts` - Context banner information

**Lifecycle Hooks**:
- `use-claude-md.ts` - Documentation loading (GROK.md + docs-index.md)
- `use-introduction.ts` - First-time user setup
- `use-console-setup.ts` - Terminal initialization
- `use-session-logging.ts` - Session persistence
- `use-processing-timer.ts` - Processing time tracking

### `mcp/` - Model Context Protocol

**`mcp-client.ts`**: MCP client implementation
- Server connection management
- Tool discovery and registration
- Request/response handling

### `services/` - Business Logic

**Workflow Services**:
- `research-recommend-service.ts` - Research and recommendation workflows
- `auto-approve-service.ts` - Automatic approval logic

**Git Integration**:
- `git-service.ts` - Git operations
- `repository-service.ts` - Repository analysis

### `ui/` - Terminal UI

See `ui/CLAUDE.md` for detailed UI documentation.

### `utils/` - Utilities

**Configuration**:
- `settings-manager.ts` - User settings persistence
- `confirmation-service.ts` - Approval gate coordination

**System**:
- `logger.ts` - Logging infrastructure
- `error-handler.ts` - Error management
- `token-counter.ts` - Token usage tracking

### `index.ts` - Entry Point

Application initialization:
1. Load environment variables
2. Parse CLI arguments (commander.js)
3. Initialize GrokAgent
4. Launch React/Ink UI or process headless prompt
5. Setup cleanup handlers

## Key Design Patterns

### 1. React Hooks Pattern
State management via custom React hooks for clean separation of concerns.

### 2. Service Layer
Business logic isolated in services for testability and reusability.

### 3. Streaming Architecture
Real-time streaming responses via async iterators and React state updates.

### 4. Singleton Services
Settings and confirmation services use singleton pattern for global state.

### 5. Error Boundaries
Graceful error handling with user-friendly messages and recovery.

## Common Operations

### Adding a New Command
See `.agent/sop/adding-new-command.md`

### Adding a New Hook
1. Create in `hooks/` directory
2. Follow naming: `use-{feature}.ts`
3. Export single named function
4. Use in `chat-interface.tsx`

### Modifying GrokAgent
1. Core logic in `agent/grok-agent.ts`
2. Add methods for new capabilities
3. Update type definitions
4. Add tests

### Adding MCP Tools
1. Implement tool interface
2. Register with MCP client
3. Update tool documentation

## Code Style

- **Language**: TypeScript with strict mode
- **Formatting**: Prettier (on save)
- **Linting**: ESLint with recommended rules
- **Imports**: ES modules (`.js` extension for TS imports)
- **Naming**: camelCase for functions, PascalCase for classes

## Testing

```bash
# Run all tests
bun test

# Run specific test file
bun test src/agent/grok-agent.test.ts

# Watch mode
bun test --watch
```

## Development Workflow

1. **Setup**: `bun install`
2. **Dev Mode**: `bun run dev` (auto-reload)
3. **Build**: `bun run build`
4. **Test**: `bun test`
5. **Lint**: `bun run lint`

## Documentation References

- **Architecture**: `.agent/system/architecture.md`
- **Git Workflow**: `.agent/sop/git-workflow.md`
- **Contributing**: `.agent/README.md`
- **Full Index**: `docs-index.md`

---

For detailed architecture documentation, see `.agent/system/architecture.md`
