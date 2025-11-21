# UI Components Overview (`src/ui/`)

React/Ink-based terminal user interface for Grok One-Shot.

## Directory Structure

```
src/ui/
├── components/
│   ├── chat-interface.tsx           # Main chat component
│   ├── chat-interface-renderer.tsx  # Rendering logic
│   ├── api-key-input.tsx            # API key setup
│   └── ...
└── styles/
    └── ...                           # Terminal styling
```

## Core Components

### `chat-interface.tsx` - Main Chat Interface

**Purpose**: Orchestrates the entire UI lifecycle

**Key Responsibilities**:
- State management (chat history, processing, confirmations)
- Hook integration (input handler, streaming, confirmations)
- API key validation and setup
- Context loading and display
- Global keyboard shortcuts

**Key State**:
```typescript
- chatHistory: ChatEntry[]        # Conversation history
- isProcessing: boolean            # AI is thinking
- isStreaming: boolean             # Streaming response
- processingTime: number           # Response time
- tokenCount: number               # Token usage
- confirmationOptions: Options     # Active approval gate
- showContextTooltip: boolean      # Context info visibility
```

**Key Hooks Used**:
- `useConsoleSetup()` - Terminal initialization
- `useCLAUDEmd()` - Documentation loading
- `useSessionLogging()` - Session persistence
- `useContextInfo()` - Context banner
- `useInputHandler()` - Input processing
- `useStreaming()` - Response streaming
- `useConfirmations()` - Approval gates
- `useIntroduction()` - First-time setup
- `useProcessingTimer()` - Time tracking

### `chat-interface-renderer.tsx` - Pure Rendering

**Purpose**: Stateless rendering logic separated from business logic

**Key Features**:
- Chat message rendering
- Confirmation dialogs
- Context tooltip
- Command suggestions
- Model selection UI
- Status indicators
- Input prompt

**Props Interface**:
```typescript
interface ChatInterfaceRendererProps {
  chatHistory: ChatEntry[]
  confirmationOptions: ConfirmationOptions | null
  showContextTooltip: boolean
  contextInfo: ContextInfo
  verbosityLevel: number
  explainLevel: number
  isProcessing: boolean
  isStreaming: boolean
  processingTime: number
  tokenCount: number
  planMode: PlanMode
  input: string
  cursorPosition: number
  autoEditEnabled: boolean
  agent: GrokAgent
  commandSuggestions: string[]
  selectedCommandIndex: number
  showCommandSuggestions: boolean
  availableModels: string[]
  selectedModelIndex: number
  showModelSelection: boolean
  handleConfirmation: () => void
  handleRejection: () => void
  toggleContextTooltip: () => void
}
```

### `api-key-input.tsx` - API Key Setup

**Purpose**: First-run API key collection

**Features**:
- Secure input (masked characters)
- Validation
- Persistence to settings
- Error handling

## UI Architecture

### Rendering Flow

1. **Initialization**: `chat-interface.tsx` mounts
2. **Setup**: `useConsoleSetup()` prepares terminal
3. **Load Context**: `useCLAUDEmd()` loads documentation
4. **Render**: Pass state to `chat-interface-renderer.tsx`
5. **User Input**: `useInputHandler()` processes keystrokes
6. **API Call**: `useStreaming()` handles AI communication
7. **Update**: State changes trigger re-render

### State Flow

```
User Input → useInputHandler → GrokAgent → API Call
     ↓                                         ↓
  Validation                            Streaming Response
     ↓                                         ↓
  Chat History ← useStreaming ← Token Updates
     ↓
 Re-render via chat-interface-renderer
```

## Key Features

### 1. Streaming UI

Real-time token-by-token display:
- Token buffering for smooth rendering
- Markdown parsing during stream
- Progress indicators

### 2. Confirmation System

Interactive approval gates:
- Operation-level confirmations
- Session-level overrides (Ctrl+Y)
- Visual dialogs with context

### 3. Context Awareness

Visual indicators for:
- Current working directory
- Git repository status
- Loaded documentation
- Available MCP tools

### 4. Command System

Slash command autocomplete:
- `/` triggers suggestion dropdown
- Arrow keys for navigation
- Tab/Enter to select

### 5. Model Selection

Quick model switching:
- `Ctrl+M` opens model selector
- Arrow keys for navigation
- Persists to settings

## Keyboard Shortcuts

### Global Shortcuts

- `Ctrl+I` - Toggle context tooltip
- `Ctrl+M` - Open model selector
- `Ctrl+Y` - Approve all (session-level)
- `Ctrl+C` - Interrupt/Exit

### Input Shortcuts

- `Tab` - Accept command suggestion
- `Up/Down` - Navigate suggestions
- `Enter` - Submit input

### Confirmation Shortcuts

- `Y` - Approve operation
- `N` - Reject operation
- `A` - Approve all (session)

## Styling

Terminal styling via Ink components:
- `<Text>` - Styled text output
- `<Box>` - Layout containers
- `<Newline>` - Spacing
- Chalk colors for semantic highlighting

## Performance Considerations

### Efficient Rendering

1. **Debouncing**: Input debounced to prevent excessive renders
2. **Memoization**: Heavy computations memoized
3. **Lazy Loading**: Components loaded on-demand
4. **Token Buffering**: Stream tokens batched for display

### Memory Management

1. **History Limits**: Old messages trimmed after threshold
2. **Session Persistence**: Large sessions saved to disk
3. **Context Cleanup**: Unused context released

## Common UI Operations

### Adding a New Keyboard Shortcut

1. Add to `handleGlobalShortcuts()` in `chat-interface.tsx`
2. Update keyboard shortcuts section
3. Test across platforms

### Adding a New Chat Message Type

1. Extend `ChatEntry` type
2. Add rendering logic to `chat-interface-renderer.tsx`
3. Update message history handling

### Adding a New Confirmation Type

1. Define in `confirmation-service.ts`
2. Add rendering in `chat-interface-renderer.tsx`
3. Update confirmation handling

## Testing UI Components

```bash
# Run UI tests
bun test src/ui/

# Visual testing (manual)
bun run dev

# Test specific component
bun test src/ui/components/chat-interface.test.tsx
```

## Accessibility

Terminal UI considerations:
- Clear visual hierarchy
- Keyboard-only navigation
- Screen reader friendly output
- High contrast color schemes

## Documentation References

- **Architecture**: `.agent/system/architecture.md`
- **Hooks**: `src/CLAUDE.md` (hooks section)
- **Input Handling**: `src/hooks/use-input-handler.ts`
- **Full Index**: `docs-index.md`

---

For general source code documentation, see `src/CLAUDE.md`
