# 2026-04-05 & 04-06 — Grading, CI/CD, Drag-to-Reorder

## Context
Weekend sprint. Built grading system (Saturday evening code, Sunday morning test), set up GitHub Actions for cross-platform builds, tested with mom as first external user, added drag-to-reorder in template editor.

## What Was Accomplished

### Block Grading System — Working
- **`db.js`**: Day instance functions — `getTodayDate` (day boundary logic), `getDay`, `createDayFromTemplate`, `getDayBlocks`, `gradeBlock`, `generateDailyReport`, `getDailyReports`, `finalizePreviousDay`, `clearAllData`.
- **`scheduleStore.svelte.js`**: Rewritten to manage day instances. `loadSchedule()` determines today via day boundary, creates day instance from template if needed, finalizes previous day. Added `gradeBlock` and `resetToOnboarding` actions.
- **`BlockCard.svelte`**: Full grading UI — amber pulse for ungraded blocks, grade slider 1-10, optional notes, color-coded badge on graded blocks, sealed state.

### CI/CD Pipeline — Working
- GitHub Actions workflow (`build.yml`) builds Windows (.exe/.msi) and macOS (.dmg) installers.
- Targets: `x86_64-pc-windows-msvc`, `aarch64-apple-darwin`, `x86_64-apple-darwin`.
- Trigger: manual only (`workflow_dispatch`) to conserve free-tier minutes (macOS runners cost 10x).
- Successfully produced and installed on both Windows and Mac.

### First External User Test — Mom
- Installed on her Intel Mac via GitHub Actions artifact.
- Discovered bug: `seedDefaultTemplate()` bypassed onboarding for new users. Fixed by removing auto-seed.
- Discovered persistence issue: old database survives reinstall on macOS. Added "Reset & Re-run Onboarding" button in Settings as a proper solution.
- First user feedback: wants drag-to-reorder blocks. Built it same day.

### Drag-to-Reorder & Staged Block Creation — Working
- **TemplateEditor.svelte**: Complete rewrite.
  - Drag handle (⠿) on each block, amber drop indicator, smooth reorder.
  - Time auto-recalculation: durations preserved, start/end times recompute based on new position.
  - Staged "Add Block" form: name, emoji, type, duration picker, note. Inserts above last rest block, steals time from block above (Model A / "split" approach).
  - Block removal returns time to the block above it.
  - Time badge on each row showing range + duration.

### Settings — Reset Button
- "Danger Zone" section with "Reset & Re-run Onboarding" — confirmation step, wipes all data, returns to setup wizard.

## Key Decisions
- **Day boundary**: Day runs from first block's start time to next occurrence, not midnight. If it's 3am and your day starts at 6:30am, you're still in yesterday.
- **Drag = reorder only**: Dragging preserves durations and recalculates times. No half-built blocks in drag state.
- **New block = staged**: Fill form first, confirm to insert. Separation eliminates edge cases around incomplete blocks being dragged.
- **Time donation (Model A)**: New blocks steal time from the block above, not push everything down. Local effect, no cascading surprises.
- **CI trigger = manual**: Saves GitHub Actions minutes. Push code freely, only build installers when shipping.

## Files Modified
- `app/src/lib/db.js` — Day instance + report + clearAllData functions
- `app/src/lib/scheduleStore.svelte.js` — Day management, grading, reset
- `app/src/lib/components/BlockCard.svelte` — Grading UI
- `app/src/lib/components/TemplateEditor.svelte` — Drag-reorder + staged creation
- `app/src/lib/components/Settings.svelte` — Reset button
- `.github/workflows/build.yml` — CI/CD pipeline
- `Documentation/Active/ARCHITECTURE.md` — Updated to v0.4
- `Documentation/Reference/FUTURE_IDEAS.md` — Updated drag-reorder, marked onboarding shipped

## Next
Build the Reports viewing tab (daily report list UI — backend already in db.js), then native Windows notifications.
