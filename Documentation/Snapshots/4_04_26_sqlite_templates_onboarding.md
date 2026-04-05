# 2026-04-04 — SQLite, Template Editor, and Onboarding

## Context
Third working block of the day. The app was running as a native desktop window with a hardcoded schedule. Goal was to add persistent storage, a template editor, and a first-launch onboarding flow — making the app usable by anyone, not just Warren.

## What Was Accomplished

### SQLite Integration
- Wired up `tauri-plugin-sql` (Rust crate + JS package + capability permissions).
- Created `db.js` — the single data access layer. All SQL queries live here. No other file touches the database.
- Schema: 5 tables created (`schedule_templates`, `template_blocks`, `days`, `day_blocks`, `daily_reports`). The `days`/`day_blocks`/`daily_reports` tables are empty — ready for grading and reports in the next build.
- On first launch, seeds the database with Warren's 9-block default schedule.

### Reactive Store
- Created `scheduleStore.svelte.js` — Svelte 5 reactive store wrapping the schedule data.
- All 3 dashboard components (Hero, Timeline, Sidebar) now read from the store instead of a hardcoded array.
- `schedule.js` refactored to pure utility functions only (no data). `getCurrentBlockIndex` now accepts a blocks array parameter.

### Template Editor (Settings Screen)
- `TemplateEditor.svelte` — reusable block editor. Each block is an editable row: name, emoji, type dropdown, start/end time pickers, note field. Add/remove blocks. Save persists to SQLite.
- `Settings.svelte` — wrapper page with the template editor.
- Edits happen in local state. Only "Save" writes to DB — prevents partial-save corruption.

### First-Launch Onboarding
- `Onboarding.svelte` — 4-step wizard:
  1. Welcome screen
  2. Wake time / bed time pickers
  3. Meal scheduling (optional lunch + dinner)
  4. Auto-generated blocks shown in the template editor for tweaking
- Generates sensible starter blocks between the user's bookends.
- On save, creates a new template in SQLite and transitions to the dashboard.

### Navigation
- Header now has Dashboard / Settings tab navigation.
- `+page.svelte` handles view switching, database initialization, loading gate, onboarding gate, and error display.

### Bug Fixes During Build
- Svelte 5 doesn't allow exporting reassigned `$state` variables from modules. Fixed by wrapping state in a single `store` object with mutable properties.
- `tauri-plugin-sql` requires explicit `sql:allow-execute` and `sql:allow-select` permissions beyond `sql:default`. Added to capabilities.

## Files Created (5)
| File | Purpose |
|------|---------|
| `app/src/lib/db.js` | Data access layer — all SQL queries |
| `app/src/lib/scheduleStore.svelte.js` | Reactive Svelte 5 store |
| `app/src/lib/components/TemplateEditor.svelte` | Block editor (Settings + Onboarding) |
| `app/src/lib/components/Settings.svelte` | Settings page |
| `app/src/lib/components/Onboarding.svelte` | First-launch wizard |

## Files Modified (9)
| File | Change |
|------|--------|
| `app/src-tauri/Cargo.toml` | Added `tauri-plugin-sql` |
| `app/src-tauri/src/lib.rs` | Registered SQL plugin, removed greet command |
| `app/src-tauri/capabilities/default.json` | Added sql:allow-execute, sql:allow-select |
| `app/package.json` | Added `@tauri-apps/plugin-sql` |
| `app/src/lib/schedule.js` | Removed hardcoded data, refactored getCurrentBlockIndex |
| `app/src/lib/components/Hero.svelte` | Uses store |
| `app/src/lib/components/Timeline.svelte` | Uses store |
| `app/src/lib/components/Sidebar.svelte` | Uses store |
| `app/src/lib/components/Header.svelte` | Added nav tabs |
| `app/src/routes/+page.svelte` | Init, routing, onboarding gate, error handling |

## Decisions Made
- **Store pattern:** Single exported `$state` object (`store.blocks`, `store.initialized`, etc.) rather than individual exported variables. Svelte 5 constraint.
- **Template editor = onboarding editor.** Same component, two entry points. No duplicate UI.
- **Block types are a fixed universal set for now:** work, exercise, rest, open, admin, novel. Users name their blocks; the type is the category/color bucket.

## Current State
App fully functional with SQLite persistence. Existing users see their dashboard. New users get onboarding. Template editing works via Settings. Not yet committed or pushed to GitHub.

## Open Items
- Commit and push today's work.
- Build and install on mom's Mac (tomorrow morning). Requires Xcode CLI tools, Homebrew, Node, Rust on her machine.
- Set up GitHub Actions for cross-platform builds (Windows + macOS) to automate this going forward.

## Next
Build the app on mom's Mac, walk her through the onboarding flow, and use her experience as the first real user test. Then: block grading (1-10 + notes) and daily report generation.
