# UX Feedback System - Maintenance SOP

## Overview
Standard Operating Procedures for maintaining and extending the Claude Code-style UX feedback system.

## Core Files (DO NOT MODIFY without testing)
- `src/ui/colors.ts` - Color palette and consistency
- `src/services/ui-state.ts` - Event bus and state coordination
- `src/ui/components/banner.tsx` - Welcome banner system
- `src/ui/components/loading-spinner.tsx` - Contextual spinners
- `src/ui/components/progress-indicator.tsx` - Progress tracking
- `src/ui/components/background-activity.tsx` - Activity monitoring

## Integration Points
- `src/ui/components/chat-interface.tsx` - Main UI
- `src/hooks/use-enhanced-feedback.ts` - React hooks

## Color System

**DO:**
```typescript
import { inkColors } from '../colors.js';
<Text color={inkColors.success}>Success message</Text>
const spinnerColor = getSpinnerColor('search');
```

**DON'T:**
```typescript
<Text color="green">Success message</Text>  // ❌ Hard-coded
<Text color="#00FF00">Success message</Text> // ❌ Bypasses system
```

**Color Standards:**
- Blue/Cyan (info): Search, indexing, system info
- Green (success): File operations, completed
- Yellow (warning): Processing, work in progress
- Red (error): Failures, error states
- Magenta (accent): Special states, compaction
- Gray (muted): Secondary info, timestamps

## Spinner System

**Adding New Operations:**
```typescript
// 1. Add to operationConfig in loading-spinner.tsx
newOperation: {
  icon: '🔧',
  spinner: '⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏',
  messages: ['Processing...', 'Working...']
}

// 2. Update type: 'thinking' | 'search' | 'newOperation'

// 3. Add color mapping in colors.ts
case 'newoperation': return 'warning';
```

**Usage:**
```typescript
uiState.startSpinner({ operation: 'search', message: 'Scanning...' });
uiState.updateSpinner({ progress: 75, message: 'Almost done...' });
uiState.stopSpinner();
```

## Progress Indicators

**Standards:**
- Length: 25 characters
- Fill: `█` filled, `░` empty
- Update: Max 10Hz (100ms)
- ETA: Show for operations >30s

**Usage:**
```typescript
<ProgressIndicator
  operation="indexing"
  current={47}
  total={150}
  message="Indexing files..."
  showETA={true}
/>
```

## Background Activity

**Lifecycle:**
```typescript
// Start
uiState.startBackgroundActivity('indexing', { details: '0/150' });

// Update
uiState.updateBackgroundActivity('indexing', { details: '47/150' });

// Complete
uiState.stopBackgroundActivity('indexing');
```

**Guidelines:**
- Position: corner for non-intrusive display
- Frequency: Max 1 update/second
- Content: ≤20 characters
- Auto-dismiss on completion

## UI State Management

**Event Naming:**
```
[category]:[component]:[action]
'spinner:start'
'progress:update'
'background:indexing:complete'
```

**Coordination:**
```typescript
// Listen
const unsubscribe = uiState.on('spinner:start', handler);
return unsubscribe; // Cleanup
```

## Animation Standards

**Timing:**
- Spinner: 120ms (8.33 FPS)
- Pulse: 1.5s breathing rhythm
- Progress: 50ms minimum interval
- Transitions: 200ms ease-in-out

**Performance:**
```typescript
// ✅ Use appropriate intervals
setInterval(updateSpinner, 120); // 8.33 FPS

// ❌ Don't over-animate
setInterval(updateSpinner, 16); // 60 FPS unnecessary
```

## Testing

**Visual Checklist:**
- [ ] Color consistency
- [ ] Animation smoothness
- [ ] Terminal compatibility
- [ ] <1% CPU impact
- [ ] Accessibility (icons + colors)

**Commands:**
```bash
# Test spinner system
npm run build && echo "exit" | node dist/index.js

# Debug mode
GROK_UX_DEBUG=true npm run dev

# Minimal mode
GROK_UX_MINIMAL=true npm run dev
```

## Troubleshooting

**Spinner Not Appearing:**
```typescript
console.log(uiState.getCurrentSpinner());
uiState.listenerCount('spinner:start'); // Should be > 0
```

**Color Issues:**
```typescript
import { inkColors } from '../colors.js';
console.log(inkColors.success); // 'green'
```

**Performance:**
```typescript
const ANIMATION_INTERVAL = 120; // ≥100ms
const PULSE_CYCLE = 1500; // ≥1000ms
```

**Debug Flags:**
```bash
export GROK_UX_DEBUG=true      # Debug logging
export GROK_UX_ENHANCED=false  # Disable enhancements
export GROK_UX_MINIMAL=true    # Performance mode
```

## Extension Guidelines

**Adding Feedback Types:**
1. Define in UI state service
2. Create component following patterns
3. Add color mapping
4. Update integration hooks
5. Test scenarios and edge cases
6. Document in this SOP

**Backwards Compatibility:**
- UX enhancements optional by default
- Graceful degradation for limited terminals
- Maintain existing API compatibility
- Use feature flags for experiments

## Quality Gates

**Before Committing:**
- [ ] TypeScript compilation passes
- [ ] Tests pass
- [ ] Manual terminal testing
- [ ] <1% CPU impact
- [ ] Color consistency verified
- [ ] Animation smoothness confirmed
- [ ] Documentation updated

**Code Review:**
- [ ] Uses centralized colors
- [ ] Follows animation guidelines
- [ ] Proper event cleanup
- [ ] Error handling
- [ ] Accessibility standards
- [ ] Debug/testing support

---

This SOP ensures the UX system remains professional, performant, and maintainable.
