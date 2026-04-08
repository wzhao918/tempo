# 2026-04-08 — Sidebar Rebuild, Quests, Settings Accordion, Hover Polish

## Context
Continuing from the calendar model shift and simplification audit. This session focused on the sidebar (was minimal stats only), the settings UX (cards didn't collapse, changes vanished), and general polish. Also fixed several bugs discovered during the simplification pass.

## What Was Accomplished

### Sidebar — Full Rebuild (4 Cards)
- **Sidebar.svelte**: Rebuilt from scratch with four self-contained modules.

**1. Day Overview (Color Bars)**
- Two vertical bar charts side by side: Today and Tomorrow.
- Each bar is proportionally segmented by block type, colored via `getBlockHex()`.
- Gaps between blocks render as transparent spacers.
- Today's bar uses `store.blocks` (day instance), Tomorrow's uses `store.templateBlocks` (template preview).
- `buildBarSegments(blocks)` helper: computes percentage widths from first-start to last-end, handles midnight crossings.

**2. Today at a Glance (Stats)**
- 2x2 grid: blocks left, hours left, deep work today, day complete %.
- Fixed `dayProgress`: was using `lastBlock.start` instead of `.end`.
- Fixed off-by-one: loops now iterate all blocks (was `length - 1`, assuming last block is sleep).
- Uses `getBlockDuration()` helper instead of inline minute arithmetic.

**3. Quests Module**
- New `quests` table in SQLite: `id, text, done, target_date, created_at`.
- Quests are date-scoped — sidebar shows today's quests (carried from yesterday's "tomorrow" entries) + tomorrow's quests.
- Add quest: text input + Enter/button, always targets tomorrow.
- Toggle done: checkbox per quest, strikes through text.
- Clear all: click-to-arm confirmation ("x" button → "confirm" button).
- Expired quest cleanup: quests older than today are deleted on load.
- New DB functions: `getQuests()`, `addQuest()`, `toggleQuest()`, `clearQuests()`, `cleanupExpiredQuests()`.
- New store actions: `addNewQuest()`, `toggleQuestDone()`, `clearAllQuests()`, `reloadQuests()`.

**4. Notifications (Placeholder)**
- Toggle switches for "Block transitions" and "5-min warnings".
- State is local only — these will wire to Tauri's notification plugin later.

### Settings — Collapsed-by-Default Accordion
- **TemplateEditor.svelte**: Converted from always-expanded grid to accordion cards.
- Each block is a row that expands/collapses on click. Only one expanded at a time.
- `expandedIndex` state: `-1` = all collapsed (default).
- **Summary row** (collapsed): drag handle (⠿) | name | time range | duration badge | type color dot | chevron (▸/▾).
- **Expanded view**: full field grid (name, type, start, end, note) + remove button.
- Clicking a different card collapses the previous one.
- `lastInitKey` pattern: detects when `initialBlocks` prop changes from store and re-syncs local editing state.

### Hover Highlighting
- **BlockCard.svelte**: `.block-card:hover` → lighter border + surface2 background.
- **TemplateEditor.svelte**: `.block-summary:hover` → surface2 background. `.block-row:hover` → border highlight.
- Smooth 0.2s transitions on both.

### Bug Fixes (from simplification audit)
- **Gap crash**: App crashed when no block is active (current time in gap between blocks). `getCurrentBlockIndex()` now returns -1 for gaps. Hero shows "Free time" pill with countdown to next block. Added `getNextBlockIndex()` helper.
- **Settings persistence**: Was loading `store.blocks` (day_blocks) not `store.templateBlocks`. Complete rewrite of Settings save flow with dedicated store actions (`loadTemplateBlocks`, `saveTemplateEdits`).
- **Save toast**: Green banner "Template saved. Changes will appear in tomorrow's schedule." auto-dismisses after 3s.
- **Unicode artifacts**: `\u2837` and `\u2013` rendered as literal text in Svelte templates. Replaced with actual Unicode characters.

### Dead Code Removed
- `getTemplates()`, `getDailyReports()` from db.js (unused).
- `getNowMinutes()` from schedule.js (unused import).
- `skipped` column from days table creation.
- Duplicate `addMinutes` helpers — consolidated into schedule.js, imported everywhere.

### CI/CD
- GitHub Actions build workflow: split into `build-windows` and `build-macos` jobs.
- `workflow_dispatch` input with choice picker: windows / macos / all.
- macOS build only runs when explicitly selected (10x runner cost).

## Key Decisions
- **Quests are date-scoped, not block-scoped**: A quest belongs to a date, not a specific block. Simpler model, matches how people think about to-do lists.
- **Sidebar shows template as "tomorrow" preview**: Since today's schedule is already instantiated, the template represents what tomorrow will look like. This gives the color bar comparison meaning.
- **Accordion over always-expanded**: With 6+ blocks, the settings screen was overwhelming. Collapsed-by-default with summary rows keeps it scannable.
- **Hover highlighting is universal**: Applied to both dashboard block cards and settings template cards for consistency.
- **Notification toggles are placeholders**: Wired to local state only. Windows toast integration is future work.

## Files Modified
- `app/src/lib/components/Sidebar.svelte` — Full rebuild (color bars, stats, quests, notifications)
- `app/src/lib/components/TemplateEditor.svelte` — Accordion layout, hover highlighting
- `app/src/lib/components/BlockCard.svelte` — Hover highlighting
- `app/src/lib/db.js` — Quests table + CRUD functions
- `app/src/lib/scheduleStore.svelte.js` — Quest actions, template editing actions
- `Documentation/Active/ARCHITECTURE.md` — Updated to v0.6, added quests table

## Next
Build the Reports viewing tab — the daily_reports table and generation logic exist in db.js, just needs a UI component wired to the Reports tab.
