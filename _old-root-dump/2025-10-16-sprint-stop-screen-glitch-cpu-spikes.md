# Mini-Sprint to stop screen glitch + CPU spikes (KISS, no code pasted)

## Goals
- Smooth terminal rendering (no flicker)
- Keep CPU <10% during idle/streaming
- No loss of logs or UX

## Tasks
1. **Render Throttle (150ms)**
   - Batch Ink renders (chat history + spinners) to ~6–7 FPS.
   - Coalesce token events into a buffered frame; flush on interval or on final token.

2. **Quiet Logs by Default**
   - Gate [CPU-LOG], per-token, and tool-queue logs behind DEBUG=1.
   - Collapse repetitive lines (e.g., duplicate console.time labels).

3. **Outbound Rate Limit**
   - Cap concurrent tool calls to 2; queue overflow defers.
   - Global limit: ≥500ms between requests; burst budget allows short spikes but throttles on sustain.

4. **Spinner Snapshot**
   - Replace live spinners with: start → (optional) periodic single-line update → final snapshot only.
   - Ensure spinners don't keep the render loop alive.

5. **Cleanup on Exit**
   - Unsubscribe Ink/intervals/timeouts on teardown.
   - Verify no pending timers with process._getActiveHandles() in a dev flag.

## Acceptance Criteria
- 5-minute streaming test: no flicker; CPU avg <10%.
- 15+ tool calls: queue never exceeds 2 concurrent; no "duplicate console.time" warnings.
- Logs quiet unless DEBUG=1.
- Guardrails trigger throttle/pause correctly and recover.

## Test Plan
- Scripted "token firehose" (simulated) + 3 bursts of tool calls (15 ops).
- Measure CPU before/after; capture render cadence.
- Manual TTY resize and quick keypress stress—no redraw storms.