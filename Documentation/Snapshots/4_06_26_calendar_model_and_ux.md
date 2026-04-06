# 2026-04-06 — Calendar Model & UX Cleanup

## Context
Pulled repo to main machine. Identified fundamental UX problem: the "train schedule" model (blocks chained end-to-end, no gaps allowed) created friction that doesn't exist in familiar tools like iOS Calendar. Decided to uproot and simplify.

## What Was Accomplished

### Calendar Model — Blocks Are Independent Time Slots
- **TemplateEditor.svelte**: Complete rewrite of block management.
  - Removed time donation system (new blocks no longer "steal" time from adjacent blocks).
  - Removed `recalculateTimes()` — blocks don't chain. Each block has its own start/end, independent of neighbors.
  - Removed contiguous constraint — gaps between blocks are normal, not an error.
  - Removed "Not enough time" error — no longer possible since blocks don't compete for time.
  - Adding a block: user picks name, type, start time, and duration. Block appears. No insertion-point stress.
  - Removing a block: just removes it. No time redistribution.
  - Drag-to-reorder preserved for manual visual ordering.

### Onboarding Redesign — Sparse Starter Blocks
- **Onboarding.svelte**: `generateBlocks()` rewritten.
  - Old: filled entire day edge-to-edge with huge blocks (5+ hour "Morning Block").
  - New: generates ~6 sensible blocks with gaps between them.
    - Morning Focus (2h work), Lunch (1h), Afternoon Focus (2h), Dinner (1h), Wind Down (2h rest), Sleep.
  - Remaining time is simply unscheduled — not filled with placeholder blocks.

### Emoji Removal
- Removed emoji input field from TemplateEditor (both existing block grid and new block form).
- Removed emoji display from BlockCard on the dashboard timeline.
- Emoji column in DB schema preserved (no migration needed), just not exposed in UI.
- Block type dropdown still shows emoji labels for visual context.

### Drag-and-Drop Visibility
- Drop indicator: 4px thick with amber glow (was 3px, no glow).
- Indicator extends slightly beyond block edges for visibility.
- Drag handle: larger hit target (4px/8px padding), hover shows border, active state shows amber glow.
- Drag dots enlarged to 18px.

### Name Field Width
- Grid changed from `1fr auto 1fr auto auto` (5 columns with emoji) to `2fr 1fr auto auto` (4 columns, name gets double width).

### Dashboard Updates
- `getCurrentBlockIndex()` now returns -1 when current time is in a gap (not inside any block).
- BlockCard handles `currentIdx === -1`: no block highlighted as active, past detection works independently.
- Blocks no longer collapse when no block is active (avoids confusing state).

## Key Decisions
- **Calendar model over train-schedule model**: Blocks are independent. This is a permanent architectural shift. The contiguous model was fighting user expectations set by every calendar app they've ever used.
- **Gaps are features, not bugs**: Unscheduled time is normal. No filler blocks needed.
- **Emoji removed, not hidden**: Clean removal from UI. Data column stays for potential future use (toggle on/off).
- **Sort order is manual**: Blocks display in array order (sort_order), not auto-sorted by start_time. User controls visual order via drag. Timeline could auto-sort by time in the future if needed.

## Files Modified
- `app/src/lib/components/TemplateEditor.svelte` — Calendar model rewrite
- `app/src/lib/components/Onboarding.svelte` — Sparse block generation
- `app/src/lib/components/BlockCard.svelte` — Emoji removal, gap-aware state
- `app/src/lib/components/Timeline.svelte` — Handle no-active-block state
- `app/src/lib/schedule.js` — getCurrentBlockIndex returns -1 for gaps
- `Documentation/Active/ARCHITECTURE.md` — Updated to v0.5, calendar model principles

## Next
Build the Reports viewing tab — the backend functions already exist in db.js, just needs UI.
