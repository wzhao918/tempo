# 2026-04-08 — Tomorrow & Today Modals, Schedule/Settings Separation

## Context
Big session covering multiple arcs: sidebar rebuild, settings accordion, then a design insight that crystallized mid-session — "building tomorrow's schedule" is a daily ritual, not a settings change. This led to separating schedule editing from settings entirely, creating modal editors for both today and tomorrow, triggered from the sidebar color bars.

## Arc 1: Sidebar Rebuild & Settings Accordion

### Sidebar — 4 Cards → 2 Cards
- Rebuilt sidebar with Day Overview (color bars), Stats, Quests, Notifications.
- Later in the session, Quests moved to Tomorrow modal and Notifications moved to Settings.
- Final sidebar: **Day Overview** (today + tomorrow color bars, both clickable) and **Stats** (blocks left, hours left, deep work, day progress).

### Settings — Accordion Cards
- TemplateEditor converted from always-expanded grid to collapsed-by-default accordion.
- `expandedIndex` state, only one card open at a time.
- Summary row: drag handle | name | time range | duration badge | type | chevron.
- Note: drag handle visual accents (hover glow) were lost in the accordion conversion — parked in FUTURE_IDEAS.md.

### Quests Module
- New `quests` table in SQLite: `id, text, done, target_date, created_at`.
- Date-scoped (not block-scoped). Tomorrow's quests are what you're planning next.
- Full CRUD: add, toggle, clear with click-to-arm confirmation, auto-cleanup of expired quests.

### Other Polish
- Hover highlighting on BlockCard and TemplateEditor rows.
- Time-of-day sky gradient background (SkyGradient.svelte).
- Save confirmation toast in settings.
- Bug fixes: gap crash, settings persistence, dayProgress calculation, off-by-one in sidebar stats.

## Arc 2: Tomorrow Modal — Schedule Editing Leaves Settings

### The Insight
User observed: "building tomorrow's schedule" and "app configuration" are conflated in the Settings screen. Building tomorrow's schedule is a *workflow* (using the app), not a *configuration* (setting up the app). The day overview color bars made this feel tangible — you see today and tomorrow side by side, and want to shape tomorrow.

### What Changed
- **TomorrowModal.svelte** (NEW): Dashboard overlay triggered by clicking the Tomorrow color bar in the sidebar.
  - Horizontal color bar at top showing tomorrow's schedule shape.
  - Stats strip: block count, total hours, deep work hours.
  - TemplateEditor accordion (same component, re-parented from Settings).
  - Quests panel in right column (moved from Sidebar).
  - Click-outside or X to close. Slide-up animation with backdrop dimming.
- **Settings.svelte**: Stripped to app preferences only — notification toggles + danger zone. Subtitle changed to "App preferences and configuration."
- **Sidebar.svelte**: Tomorrow color bar made clickable. Hover: subtle scale + amber border + "edit" label fades in.

### Net Effect
- Settings is now a low-traffic utility screen (things you rarely touch).
- Schedule building is a first-class interaction on the dashboard.

## Arc 3: Today Modal — Editing Today with Graded Block Locking

### The Rule
**Graded = sealed.** Once you grade a block, it's permanent, uneditable, unmovable. Ungraded blocks remain fully malleable. This one rule cleans up the entire model — no ambiguity about "original plan vs edited plan," no conflict with daily reports.

### What Changed
- **TodayModal.svelte** (NEW): Same pattern as TomorrowModal, triggered by clicking the Today color bar.
  - Edits `store.blocks` (day_blocks) instead of template_blocks.
  - Stats strip includes "X/Y graded" counter.
  - Save handler writes to day_blocks via new `saveDayEdits` store action.
- **TemplateEditor.svelte**: Now supports locked blocks.
  - If a block has a `grade` field, it renders as a dimmed, non-interactive row.
  - No drag handle, no expand chevron. Shows a green grade badge (`8/10`) instead.
  - Ungraded blocks work exactly as before.
- **db.js**: New day_block CRUD functions:
  - `updateDayBlock(blockId, fields)` — includes `WHERE grade IS NULL` guard.
  - `addDayBlock(dayId, block)` — inserts new block into today's instance.
  - `removeDayBlock(blockId)` — deletes only if ungraded.
  - `updateDayBlockSortOrders(blockIds)` — reorder persistence.
- **scheduleStore.svelte.js**: New `saveDayEdits()` action — mirrors `saveTemplateEdits` but targets day_blocks, skips graded blocks on update.
- **Sidebar.svelte**: Both Today and Tomorrow bars are now clickable with identical hover affordance.

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Schedule editing is a modal, not inline | TemplateEditor already works as a drop-in component. Inline timeline editing would require rebuilding BlockCard into an edit/display hybrid — future upgrade, not needed now. |
| Both modals triggered from color bars | Consistent interaction: click a bar, get an editor. Visually discoverable (hover hint). |
| Graded blocks locked at DB level | `WHERE grade IS NULL` in SQL guards means even UI bugs can't corrupt graded data. Defense in depth. |
| Quests live in Tomorrow modal, not Sidebar | Quests are part of "planning tomorrow." Keeping them in the sidebar made the sidebar do too many things. |
| Settings is just preferences | Clean separation: workflow (modals) vs configuration (settings). |

## Files Modified
- `app/src/lib/components/TomorrowModal.svelte` — NEW: tomorrow schedule editor modal
- `app/src/lib/components/TodayModal.svelte` — NEW: today schedule editor modal with graded block locking
- `app/src/lib/components/Sidebar.svelte` — Rebuilt twice: first with 4 cards, then slimmed to 2 cards with both bars clickable
- `app/src/lib/components/TemplateEditor.svelte` — Accordion layout + locked block rendering
- `app/src/lib/components/BlockCard.svelte` — Hover highlighting
- `app/src/lib/components/Settings.svelte` — Stripped to app preferences only
- `app/src/lib/db.js` — Quests table + CRUD, day_block CRUD with grade guards
- `app/src/lib/scheduleStore.svelte.js` — Quest actions, template editing actions, day editing actions
- `app/src/routes/+page.svelte` — Both modals wired in
- `Documentation/Active/ARCHITECTURE.md` — Updated to v0.7
- `Documentation/Reference/FUTURE_IDEAS.md` — Parked "Build Tomorrow" separation idea + drag accent regression note

## Next
Build the Reports viewing tab — the `daily_reports` table, `generateDailyReport()`, and `finalizePreviousDay()` all exist in db.js. Just needs a UI component wired to a Reports view.
