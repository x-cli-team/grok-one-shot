# Context Management

How Grok One-Shot manages conversation context and documentation loading.

## Overview

Grok One-Shot uses an efficient on-demand context loading system that balances comprehensive documentation access with token efficiency.

## Context Loading Strategy

### Traditional Approach (Old System)

**Problem with auto-loading everything:**
```
Startup context:
- GROK.md: ~6,400 bytes
- docs-index.md: ~7,600 bytes
- All 49 docs: ~65,000-85,000 tokens

Result: 65k-85k tokens consumed before user sends first message
```

**Issues:**
- Massive token waste on unused documentation
- Slower startup
- Higher API costs
- Context limit reached quickly

### Current Approach (Efficient System)

**On-demand loading:**
```
Startup context:
- GROK.md: ~6,400 bytes (1,600 tokens)
- docs-index.md: ~7,600 bytes (1,900 tokens)
Total: ~3,500 tokens (95% reduction!)

Runtime:
- AI reads specific docs as needed via Read tool
- Only loads relevant documentation
- User queries load minimal context
```

**Benefits:**
- ✅ 94.6-95.8% token reduction at startup
- ✅ Faster startup
- ✅ Lower initial costs
- ✅ Context budget available for actual work

## How It Works

### Startup Phase

**What's loaded:**
```typescript
// src/hooks/use-claude-md.ts
export function useClaudeMd() {
  const claudeMd = readFileSync('GROK.md', 'utf-8');
  const docsIndex = readFileSync('docs-index.md', 'utf-8');

  return {
    systemPrompt: `${claudeMd}\n\n${docsIndex}`,
    tokenCount: ~3500
  };
}
```

**Result:**
- AI knows project structure (GROK.md)
- AI knows available documentation (docs-index.md)
- AI can read specific docs when needed

### Runtime Phase

**When AI needs specific information:**

1. **User asks question:**
   ```
   > How do I configure MCP servers?
   ```

2. **AI checks docs-index.md:**
   ```
   AI sees:
   - configuration/settings.md (covers MCP configuration)
   - build-with-claude-code/mcp.md (detailed MCP guide)
   ```

3. **AI uses Read tool:**
   ```typescript
   await Read({
     file_path: '.agent/docs/claude-code/configuration/settings.md'
   });
   ```

4. **AI responds with accurate info:**
   ```
   To configure MCP servers, edit ~/.grok/settings.json...
   [provides information from settings.md]
   ```

## Context in Sessions

### Session Context Accumulation

**Each message adds context:**
```
User message: +tokens (your prompt)
AI response: +tokens (AI's reply)
Tool calls: +tokens (file contents, command outputs)
```

**Example session growth:**
```
Initial: 3,500 tokens (GROK.md + docs-index.md)
After message 1: 5,000 tokens (+1,500)
After message 5: 12,000 tokens
After message 20: 45,000 tokens
After message 50: 90,000 tokens (approaching limit)
```

### Context Limits

**Model context window: 128,000 tokens**

**Practical considerations:**
```
✅ Good session: 10,000-50,000 tokens
   - Enough context for coherent conversation
   - Room for file reading and analysis

⚠️ Large session: 50,000-100,000 tokens
   - Still functional but getting expensive
   - Consider if all context is needed

❌ Excessive: >100,000 tokens
   - Approaching model limit
   - Very expensive
   - Should start new session
```

### Monitoring Context

**Check token usage:**
```
# During session
Press Ctrl+I

Output:
Token Usage:
  Input: 45,230 tokens
  Output: 12,450 tokens
  Total: 57,680 tokens
```

**From session files:**
```bash
cat ~/.grok/sessions/latest-session.json | jq '.tokenUsage'
```

## Context Optimization

### Start New Sessions

**When to start fresh:**
- ✅ Unrelated task
- ✅ Context > 50k tokens and slowing down
- ✅ No longer need old conversation
- ✅ Want clean slate

**How:**
```bash
# Exit current session
/exit

# Start new
grok
```

### Headless Mode for Simple Queries

**Avoid session accumulation:**
```bash
# Each query is independent
grok -p "list TypeScript files"
grok -p "find TODO comments"
grok -p "check for console.log"

# No context carries over between queries
```

### Be Specific

**Bad (loads lots of context):**
```
> Tell me everything about this codebase
[AI reads many files, context explodes]
```

**Good (targeted context):**
```
> Explain how authentication works in src/auth/
[AI reads specific files, context stays manageable]
```

## Advanced Context Techniques

### Incremental Exploration

**Build context gradually:**
```
Step 1: "What is the overall architecture?"
[AI reads GROK.md, provides overview]

Step 2: "How does the agent system work?"
[AI reads specific agent docs]

Step 3: "Show me the GrokAgent implementation"
[AI reads src/agent/grok-agent.ts]
```

**Benefits:**
- Only loads what's needed
- Builds understanding progressively
- Avoids context explosion

### Context Pruning (Manual)

**Current state: Manual**
- No automatic context pruning yet
- User must start new session when context is large
- Future enhancement: automatic context compression

**How to prune manually:**
```
# Save important findings
> Summarize what we've learned so far
[Copy summary]

# Start new session
/exit
grok

# Resume with summary
> Continuing from previous session:
  [Paste summary]
  Now let's...
```

## Context-Related Features

### ✅ Implemented

**Efficient startup:**
- On-demand doc loading
- Minimal initial context
- Fast session start

**Context monitoring:**
- Ctrl+I shows token usage
- Session files track usage
- Manual inspection available

**Session management:**
- Save/restore sessions
- Session history in `~/.grok/sessions/`
- Manual session control

### 🚧 Partially Implemented

**Context awareness:**
- AI understands when context is large
- Manual pruning via new session
- ⚠️ No automatic warnings at thresholds

**Multi-session workflows:**
- Can start multiple sessions
- ⚠️ No session linking or merging
- ⚠️ No cross-session context sharing

### 🔮 Planned Features

**Automatic context management:**
- Auto-prune old messages when threshold reached
- Intelligent context summarization
- Keep most relevant parts, summarize old parts

**Context caching:**
- Cache common docs (settings, quickstart)
- Reduce repeated API calls
- Faster responses for frequent questions

**Smart context loading:**
- Predict which docs user will need
- Pre-load related documentation
- Balance prediction vs token cost

## Best Practices

### DO

**✅ Monitor token usage:**
```
Press Ctrl+I regularly to check context size
```

**✅ Start new sessions for unrelated tasks:**
```bash
/exit  # End current task
grok  # Fresh start for new task
```

**✅ Use headless mode for simple queries:**
```bash
grok -p "quick query"  # No session accumulation
```

**✅ Be specific in prompts:**
```
"Analyze authentication in src/auth/"
vs
"Analyze everything"
```

### DON'T

**❌ Let sessions grow indefinitely:**
```
# Check tokens
Ctrl+I
# If >50k, consider new session
```

**❌ Load unnecessary files:**
```
# Avoid: "Read all files"
# Better: "Read src/auth/middleware.ts"
```

**❌ Repeat context unnecessarily:**
```
# Session remembers previous messages
# No need to re-explain context
```

## Troubleshooting

### High Token Usage

**Symptom:** Ctrl+I shows >50k tokens

**Causes:**
- Long conversation
- AI read many files
- Repeated context

**Solutions:**
```bash
# Start new session
/exit
grok

# Or use summary technique
> Summarize findings, then start new session
```

### Slow Responses

**Symptom:** AI takes long to respond

**Possible cause:** Large context

**Check:**
```
Ctrl+I to see token count
If >80k tokens, context is likely cause
```

**Solution:**
```bash
# Start fresh session
/exit
grok
```

### Context Confusion

**Symptom:** AI confuses current task with earlier messages

**Cause:** Too much context mixing different topics

**Solution:**
```bash
# Start new session for new topic
/exit
grok

# Be explicit
> Focusing on [NEW TOPIC], ignoring previous discussion about [OLD TOPIC]
```

## Real-Time Status Indicators

Grok One-Shot displays real-time context metrics below the input prompt to help users monitor context usage and system state.

### Display Format

The status line shows three key metrics in compact format:

```
🧠 1.3k/128.0k (1%) │ 📁 0 files │ 💬 2 msgs
```

### Metric Details

- **🧠 Token Usage**: Current tokens used / maximum context window (percentage)
  - Current: Formatted as 1.3k (1300 tokens)
  - Max: 128.0k (128,000 tokens, Grok's context window)
  - Percent: Current usage as percentage of max
  - Color-coded: Green (less than 60%), Blue (60-80%), Yellow (80-90%), Red (more than 90%)

- **📁 Files**: Number of files currently loaded in workspace context
  - Shows files actively referenced in conversation
  - Helps monitor context breadth

- **💬 Messages**: Total number of messages in current conversation session
  - Includes system prompt, user messages, and AI responses
  - Indicates conversation length and context depth

### Additional Indicators

When memory pressure is high, additional indicators may appear:
- **⚠️ Memory Pressure**: Shows when system is under memory stress (medium/high/critical)

### Usage Tips

- Monitor token usage to avoid hitting context limits
- Start new sessions (/exit) when approaching 80% token usage
- Use Ctrl+I for detailed context information and tooltip
- Files count helps gauge context specificity

### Implementation

These metrics are rendered by the `ContextIndicator` component in compact mode, providing constant visibility without cluttering the interface.

## Technical Details

### Implementation

**Context loading hook:**
```typescript
// src/hooks/use-claude-md.ts
export function useClaudeMd(): string {
  const grokMd = readFileSync(path.join(cwd, 'GROK.md'), 'utf-8');
  const docsIndex = readFileSync(path.join(cwd, 'docs-index.md'), 'utf-8');
  return `${grokMd}\n\n${docsIndex}`;
}
```

**Session context:**
```typescript
// src/agent/grok-agent.ts
const messages = [
  { role: 'system', content: systemPrompt },  // GROK.md + docs-index.md
  ...conversationHistory,                      // Previous messages
  { role: 'user', content: userMessage }       // Current message
];
```

**Token counting:**
```typescript
// Approximate: 1 token ≈ 4 characters
const estimatedTokens = text.length / 4;
```

### Future Enhancements

**Automatic compaction:**
```typescript
// Planned
if (totalTokens > COMPACTION_THRESHOLD) {
  const summary = await compactOldMessages(messages);
  messages = [systemPrompt, summary, ...recentMessages];
}
```

**Context caching:**
```typescript
// Planned
const cachedDocs = cache.get('common-docs');
if (!cachedDocs) {
  cachedDocs = await loadDocs();
  cache.set('common-docs', cachedDocs, TTL);
}
```

## See Also

- [Session Management](./session-management.md) - Session handling
- [Settings](../configuration/settings.md) - Configuration options
- [Interactive Mode](../reference/interactive-mode.md) - Session features
- [Data Usage](../administration/data-usage.md) - Privacy and data

---

**Status:** ✅ Core functionality implemented, 🚧 Advanced features in progress

Efficient context management ensures fast, cost-effective AI interactions.
