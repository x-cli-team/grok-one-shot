# Sprint: Paste Text Summary Enhancement

**Sprint Duration**: 1 week  
**Sprint Goal**: Implement Claude Code-style paste text summarization for cleaner terminal UI  
**Priority**: P2 (UX Enhancement)  
**Status**: Planning  

## 🎯 Sprint Objectives

### Primary Goals
1. **Paste Detection**: Automatically detect when large amounts of text are pasted into the input
2. **Smart Summarization**: Replace large pastes with compact summaries (e.g., `[Pasted text #1 +11 lines]`)
3. **Full Content Preservation**: Ensure AI still receives complete pasted content while UI shows summary
4. **Session Tracking**: Track paste counter per session for consistent numbering

### Success Criteria
- [ ] Large pastes (>3 lines or >200 chars) are automatically summarized in UI
- [ ] AI receives full pasted content without truncation
- [ ] Paste counter increments correctly per session
- [ ] Terminal remains clean and scrollable with large text inputs
- [ ] User can still see paste context without overwhelming the interface

## 📖 User Stories

### Story 1: Large Text Paste Summarization
**As a** developer  
**I want** large pasted text to be summarized in the chat history  
**So that** my terminal stays clean and readable  

**Acceptance Criteria:**
- [ ] Text pastes longer than 3 lines are detected automatically
- [ ] UI shows summary format: `[Pasted text #N +X lines]`
- [ ] Paste counter increments sequentially (#1, #2, #3...)
- [ ] AI receives the complete original pasted text
- [ ] Summary appears in user message display instead of full content

### Story 2: Configurable Paste Threshold
**As a** user  
**I want** to configure when paste summarization triggers  
**So that** I can control the behavior based on my preferences  

**Acceptance Criteria:**
- [ ] Configurable line threshold (default: 3 lines)
- [ ] Configurable character threshold (default: 200 characters)
- [ ] Settings can be adjusted via environment variables or config file
- [ ] Option to disable paste summarization entirely

### Story 3: Visual Paste Indicators
**As a** user  
**I want** clear visual indicators when text has been summarized  
**So that** I understand what happened to my pasted content  

**Acceptance Criteria:**
- [ ] Distinct styling for paste summaries (different color/formatting)
- [ ] Clear indication that content was pasted vs typed
- [ ] Consistent formatting across all paste summaries
- [ ] Easy to distinguish from regular user input

## 🏗️ Technical Architecture

### Component Changes

#### Enhanced Input Handler
```typescript
interface PasteDetectionService {
  detectPaste(oldValue: string, newValue: string): PasteEvent | null;
  createPasteSummary(content: string, pasteNumber: number): string;
  shouldSummarize(content: string): boolean;
}

interface PasteEvent {
  content: string;
  lineCount: number;
  charCount: number;
  pasteNumber: number;
  summary: string;
}
```

#### Updated Chat Entry Types
```typescript
interface ChatEntry {
  // ... existing properties
  originalContent?: string; // Store full content when summarized
  displayContent: string;   // What to show in UI
  isPasteSummary?: boolean; // Flag for styling
  pasteMetadata?: {
    pasteNumber: number;
    lineCount: number;
    charCount: number;
  };
}
```

#### Paste Detection Logic
```typescript
class PasteDetectionService {
  private pasteCounter = 0;
  private readonly LINE_THRESHOLD = 3;
  private readonly CHAR_THRESHOLD = 200;

  detectPaste(oldValue: string, newValue: string): PasteEvent | null {
    const added = newValue.slice(oldValue.length);
    
    // Detect if this was likely a paste (large sudden addition)
    if (this.shouldSummarize(added)) {
      this.pasteCounter++;
      return {
        content: added,
        lineCount: added.split('\n').length,
        charCount: added.length,
        pasteNumber: this.pasteCounter,
        summary: this.createPasteSummary(added, this.pasteCounter)
      };
    }
    
    return null;
  }

  shouldSummarize(content: string): boolean {
    const lines = content.split('\n');
    return lines.length > this.LINE_THRESHOLD || 
           content.length > this.CHAR_THRESHOLD;
  }

  createPasteSummary(content: string, pasteNumber: number): string {
    const lineCount = content.split('\n').length;
    return `[Pasted text #${pasteNumber} +${lineCount} lines]`;
  }
}
```

### UI Component Updates

#### Chat History Display
```typescript
// In ChatHistory component
const renderUserMessage = (entry: ChatEntry) => {
  const displayText = entry.isPasteSummary 
    ? entry.displayContent 
    : entry.content;
    
  const textColor = entry.isPasteSummary ? "cyan" : "gray";
  
  return (
    <Text color={textColor}>
      {">"} {displayText}
    </Text>
  );
};
```

#### Input Processing
```typescript
// In input handler
const handleInputChange = (newValue: string) => {
  const pasteEvent = pasteDetectionService.detectPaste(currentValue, newValue);
  
  if (pasteEvent) {
    // Create message with paste summary for display
    const summaryMessage = {
      type: "user",
      content: pasteEvent.content,           // Full content for AI
      displayContent: pasteEvent.summary,    // Summary for UI
      isPasteSummary: true,
      pasteMetadata: {
        pasteNumber: pasteEvent.pasteNumber,
        lineCount: pasteEvent.lineCount,
        charCount: pasteEvent.charCount
      }
    };
    
    // Send full content to AI, but show summary in UI
    await processMessage(pasteEvent.content);
    addChatEntry(summaryMessage);
  } else {
    // Normal input processing
    setCurrentValue(newValue);
  }
};
```

## 📅 Implementation Timeline

### Day 1-2: Core Paste Detection
- [ ] Implement `PasteDetectionService` class
- [ ] Add paste detection logic to input handler
- [ ] Create configurable thresholds (lines/characters)
- [ ] Add session-based paste counter

### Day 3-4: UI Integration  
- [ ] Update `ChatEntry` interface to support paste summaries
- [ ] Modify chat history display to show summaries
- [ ] Add distinct styling for paste summaries
- [ ] Ensure full content still reaches AI processing

### Day 5-6: Enhancement & Configuration
- [ ] Add configuration options for thresholds
- [ ] Implement environment variable/config file support
- [ ] Add option to disable paste summarization
- [ ] Test with various paste sizes and content types

### Day 7: Testing & Polish
- [ ] Comprehensive testing with different paste scenarios
- [ ] Edge case handling (empty pastes, single character, etc.)
- [ ] Performance testing with very large pastes
- [ ] Documentation and user guide updates

## 🧪 Testing Strategy

### Unit Testing
- **Paste Detection**: Test threshold detection with various input sizes
- **Summary Generation**: Verify correct format and numbering
- **Content Preservation**: Ensure AI receives full original content
- **Counter Management**: Test session-based paste numbering

### Integration Testing
- **UI Flow**: Test complete paste → summary → AI processing flow
- **Multiple Pastes**: Test sequential paste handling in same session
- **Mixed Input**: Test combination of typed and pasted content
- **Configuration**: Test different threshold settings

### User Experience Testing
- **Large Files**: Test pasting entire file contents
- **Code Blocks**: Test pasting multi-line code snippets
- **Mixed Content**: Test pasting formatted text with newlines
- **Performance**: Test UI responsiveness with very large pastes

## ⚙️ Configuration Options

### Environment Variables
```bash
# Paste detection thresholds
GROK_PASTE_LINE_THRESHOLD=3        # Lines to trigger summarization
GROK_PASTE_CHAR_THRESHOLD=200      # Characters to trigger summarization
GROK_PASTE_SUMMARY_ENABLED=true    # Enable/disable feature
```

### User Settings
```json
// ~/.grok/user-settings.json
{
  "pasteHandling": {
    "enabled": true,
    "lineThreshold": 3,
    "charThreshold": 200,
    "showMetadata": true
  }
}
```

### Project Settings
```json
// .grok/settings.json
{
  "ui": {
    "pasteSummary": {
      "enabled": true,
      "lineThreshold": 5,      // Project-specific threshold
      "charThreshold": 500
    }
  }
}
```

## 🎨 Visual Design

### Paste Summary Formatting
```
> [Pasted text #1 +11 lines]        # Cyan color, italic
> [Pasted text #2 +3 lines]         # Sequential numbering
> Regular typed message              # Gray color, normal
```

### Alternative Formats (Future Enhancement)
```
> [📋 Paste #1: 11 lines, 450 chars]
> [🔗 Pasted content #2 +5 lines]
> [💾 Large text #3 +25 lines]
```

## ⚠️ Risk Assessment & Considerations

### Low Risk
- **Performance Impact**: Paste detection is minimal overhead
- **Memory Usage**: Storing original content for large pastes
- **User Confusion**: Clear visual indicators should prevent confusion

### Mitigation Strategies
- **Large Content**: Set reasonable maximum paste size limits
- **Memory Management**: Consider content compression for very large pastes
- **User Education**: Document the feature clearly in help text

### Edge Cases
- **Very Large Pastes**: Handle >10MB pastes gracefully
- **Binary Content**: Detect and handle non-text pastes
- **Rapid Pastes**: Handle multiple quick pastes in succession
- **Undo Behavior**: Ensure paste summaries work with input undo

## 📊 Success Metrics

### User Experience
- **Terminal Cleanliness**: Reduced visual clutter with large pastes
- **Scrollback Usability**: Easier navigation through chat history
- **Context Preservation**: Users still understand what was pasted

### Technical Performance
- **Detection Accuracy**: >99% accurate paste detection
- **Response Time**: <50ms paste processing overhead
- **Memory Efficiency**: Minimal additional memory usage

### Feature Adoption
- **Usage Analytics**: Track paste summary usage patterns
- **User Feedback**: Monitor Discord/GitHub for user responses
- **Configuration Usage**: Track which thresholds users prefer

## 🔗 Integration Points

### Existing Components
- **Input Handler**: Enhanced to detect paste events
- **Chat History**: Modified to display summaries
- **Settings Manager**: Extended for paste configuration
- **Agent Processing**: Unchanged (receives full content)

### Future Enhancements
- **Paste History**: View recent paste contents
- **Paste Templates**: Save frequently pasted text
- **Smart Paste**: AI-powered paste content analysis
- **Collaborative Paste**: Share paste summaries in team settings

## 📋 Definition of Done

### Feature Completion
- [ ] Paste detection working for all input scenarios
- [ ] UI displays summaries correctly with proper styling
- [ ] AI receives complete pasted content without modification
- [ ] Configuration options are functional and documented

### Code Quality
- [ ] TypeScript coverage for all new components
- [ ] ESLint compliance for new code
- [ ] Unit tests covering all paste scenarios
- [ ] Integration tests for UI flow

### Documentation
- [ ] User documentation updated with paste feature
- [ ] Configuration options documented
- [ ] Developer documentation for paste detection service
- [ ] Examples and troubleshooting guide

### User Experience
- [ ] Feature works intuitively without user configuration
- [ ] Clear visual feedback for paste summarization
- [ ] No negative impact on typing or normal input experience
- [ ] Graceful handling of edge cases and errors

---

**Related Documents:**
- **UI Components**: `src/ui/components/chat-history.tsx`
- **Input Handling**: `src/hooks/use-enhanced-input.ts`
- **Settings**: `src/utils/settings-manager.ts`

**Status**: Draft - Ready for implementation  
**Next Review**: 2025-10-24  
**Estimated Effort**: 1 week (7 days)