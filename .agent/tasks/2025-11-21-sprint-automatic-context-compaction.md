# Sprint: Automatic Context Compaction

## Goal

Implement automatic context compaction to prevent token limit rejections, triggered when usage exceeds 90% of max context window.

## Background

- Previous session hit 1M+ tokens, causing Grok API rejection
- Manual `/compact` command exists but requires user intervention
- UI feedback infrastructure already in place (`uiState.showTokenCompaction()`)
- Subagent framework supports summarization

## Research Findings

### Existing Codebase Analysis

**Manual Compact Command** (`src/hooks/use-input-handler.ts`):

- `/compact` command implemented with `--dry-run` and `--force` options
- Uses SubagentFramework with 'summarizer' type for compression
- Currently shows preview/summary but doesn't actually modify chat history
- Comment indicates real implementation pending

**Token Counting**:

- Approximate: `text.length / 4` tokens
- No precise counting using tiktoken or similar
- Used in ContextIndicator for display

**UI Feedback** (`src/services/ui-state.ts`):

- `showTokenCompaction()`, `updateTokenCompaction()`, `completeTokenCompaction()`
- Progress tracking and notifications already implemented
- Spinner and progress bar support

**Subagent Framework** (`src/subagents/subagent-framework.ts`):

- Supports 'summarizer' type for content compression
- Performance metrics available
- Used in manual compact command

**Context Management**:

- No automatic monitoring of token usage
- No threshold-based triggers
- Future enhancement listed in docs

## Implementation Plan

### Phase 1: Token Monitoring & Detection ✅

- [x] Integrate precise token counting (consider tiktoken library)
- [x] Add token usage monitoring in conversation flow
- [x] Define compaction thresholds (90% default, configurable)

### Phase 2: Automatic Trigger Logic ✅

- [x] Hook into message sending pipeline
- [x] Check token usage before API calls
- [x] Trigger compaction when threshold exceeded

### Phase 3: Context Compaction Algorithm ✅

- [x] Implement actual chat history modification (not just preview)
- [x] Preserve system prompts and recent messages
- [x] Use subagent summarizer for compression
- [x] Maintain conversation coherence

### Phase 4: Integration & UX ✅

- [x] Connect with existing UI feedback system
- [x] Add user notifications and progress indicators
- [x] Update context indicator to show compaction status

## Success Criteria

- Automatic compaction triggers at 90% token usage
- Prevents API rejections from oversized prompts
- Preserves conversation quality and context
- Seamless user experience with progress feedback

## Risks & Mitigations

- **Context Loss**: Careful preservation of critical information
- **Performance**: Subagent calls add latency - optimize summarization
- **Quality**: Test summarization effectiveness across scenarios

## Dependencies

- Subagent framework (✅ exists)
- UI feedback system (✅ exists)
- Token counting (⚠️ approximate, needs improvement)

## Estimated Effort: 2-3 days

- Token monitoring: 0.5 days
- Trigger logic: 0.5 days
- Compaction algorithm: 1 day
- Integration & testing: 1 day

## Status: ✅ COMPLETED

All phases implemented and tested. Automatic context compaction is now active.

## Next Steps

1. ✅ Improve token counting accuracy (tiktoken integrated)
2. ✅ Implement threshold monitoring (90% default, configurable)
3. ✅ Build automatic trigger system (hooks into message pipeline)
4. Monitor in production for edge cases
