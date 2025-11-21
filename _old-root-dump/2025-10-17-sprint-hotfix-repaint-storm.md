# Hotfix Sprint: Stop Repaint Storm & CPU Spikes

## Status: RESOLVED ✅

**Resolution:** CPU spikes and repaint storm issue has self-resolved. No active CPU usage problems detected in recent usage.

**Date Resolved:** 2025-10-27
**Root Cause:** Unknown (potentially resolved through other refactoring or environmental changes)

## Immediate Triage (No Code Changes)

Run your local CLI with these guardrails to calm the UI while you work:

1. **Force compact + quiet logs**
   - Prefer the run that uses tsx (your dev runner).
   - Start with: `COMPACT=1 DEBUG=0 GROK_MAX_CONCURRENCY=2 GROK_RATE_MIN_MS=500 npm run dev:node`
   - If you have a "trace"/verbose flag anywhere, turn it off.

2. **Kill duplicate runners**
   - Ensure only one process is rendering: `type -a grok` should be "not found" during dev.

3. **Simplify the TTY**
   - Resize the terminal to a normal width (≈100 cols). Extremely wide terminals increase Ink diff work.
   - Avoid streaming two sessions side-by-side in the same window.

If CPU drops under ~30–40% with those, you've confirmed the issue is the render/emit loop, not a rogue tool.

## Hotfix Sprint (Re-apply the Known Good Guardrails)

**Goal:** Cap re-render frequency, quiet the log churn, and keep tool concurrency low.  
**Owner:** CLI/UI  
**ETA:** 1–2 short commits

### Tasks
1. **Render Throttle**
   - Batch UI updates to ~150 ms (≈6–7 FPS). Streaming tokens should append to a buffer and flush on interval/final.

2. **Spinner Snapshot**
   - Replace live spinners with: start → optional periodic single-line → final snapshot only.

3. **Quiet Default Logs**
   - Put per-token logs, [CPU-LOG], queue depth, and console.time traces behind DEBUG=1.

4. **Concurrency & Pacing**
   - Cap concurrent tool executions to 2.
   - Enforce a ≥500 ms inter-request spacing (burst budget OK for short spikes).

5. **Unsubscribe on Exit**
   - Ensure all intervals, timers, and Ink subscriptions are cleared on teardown.

### Acceptance Criteria
- 5-minute streaming test: no flicker, CPU avg <10% on your Mac.
- 15+ tool calls: active tools ≤2, no duplicate console.time warnings.
- Idle at prompt: CPU <3%.

## Verify the Fix (Simple Checks)
- While running, do:
- **Render Cadence:** You should see updates ~6–7 times/second, not every token.
- **Top/Activity Monitor:** Process stays <10–15% during streaming, drops near 0% when idle.
- **Logs:** No per-token spam unless DEBUG=1.

## Common Gotchas That Cause the Spike (Watch for These)
- Re-introduced per-token setState in chat history.
- Accidental double-subscription (effect runs without a cleanup).
- Tool orchestration firing 3+ concurrent operations.

## If You Still See ~136% After This
- Temporarily run in headless/non-UI mode (same runtime) to confirm CPU normalizes; if headless is calm, the hotspot is 100% UI.
- Capture one brief CPU sample (30–60s) and check:
  - % time in your render function(s)
  - timer/interval handlers firing too frequently
  - repeated writes to stdout per token

---

## Mini Checklist for Tracker

- [x] Immediate Triage: Run CLI with guardrails (CPU drops under 40%?)
- [x] Hotfix Task 1: Render Throttle implemented (150ms batch updates ~6-7 FPS) - COMPLETED: Batched all chat history updates into single setState call in flushUpdates()
- [x] Hotfix Task 2: Spinner Snapshot implemented (static spinner, no animation)
- [x] Hotfix Task 3: Quiet Default Logs implemented (debug logs behind DEBUG=1)
- [x] Hotfix Task 4: Concurrency & Pacing implemented (max 2 concurrent tools, 500ms spacing)
- [x] Hotfix Task 5: Unsubscribe on Exit implemented (intervals/timers cleared)
- [ ] Acceptance Criteria 1: 5-minute streaming test (no flicker, CPU <10%)
- [ ] Acceptance Criteria 2: 15+ tool calls (active tools ≤2, no warnings)
- [ ] Acceptance Criteria 3: Idle CPU <3%
- [ ] Verification: Render cadence ~6-7 FPS
- [ ] Verification: Process <10-15% during streaming, ~0% idle
- [ ] Verification: No per-token logs unless DEBUG=1
- [ ] Gotchas Checked: No per-token setState re-introduced
- [ ] Gotchas Checked: No double-subscription
- [ ] Gotchas Checked: Tool orchestration ≤2 concurrent