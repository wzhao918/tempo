# 2026-04-04 — Discovery & Architecture Sketch

## Context
First working session on Daily Companion. Warren left his office job yesterday, wants this app running by Monday as a personal wellness/productivity tool and a case study for startup mode. Starting from a single HTML file that Sonnet helped build — a dark-themed daily schedule dashboard with a live clock, timeline, browser notifications, and stats sidebar.

## What Was Accomplished

### Discovery
- Reviewed the existing HTML prototype — identified core nouns (Schedule, Block, Day, Tick, Transition, Grade, Report) and existing logic (clock loop, block detection, timeline rendering, browser notifications).
- Discussed and settled key architectural decisions (see below).
- Identified feature scope for v1 vs. parking lot.
- Audited the development machine: Git installed, WebView2 present. Node.js, Rust, and VS Build Tools all need installation.

### Decisions Settled
1. **Tauri v2** as the desktop framework (not Electron, not PWA).
2. **Svelte** for the frontend framework (not vanilla JS, not React).
3. **SQLite** for local data storage, accessed through a single data access layer.
4. **Blocks editable until graded**, then frozen. Grade = 1-10 + optional note.
5. **Schedule template** lives in settings, separate from daily instances. Editing your schedule is an intentional act, not casual.
6. **Daily report auto-generated** at midnight (or next app open). Separate tab.
7. **Business logic stays in JS/Svelte**, Rust is a thin OS-integration shell. This keeps the door open for web/mobile later.
8. **Quotes/companion personality** — parked. Not in scope until it has real design intent.
9. **Long-term metrics** — parked. Daily report is the atomic unit; aggregation comes later.

### Documentation Created
- `Documentation/Active/ARCHITECTURE.md` — full architecture draft including tech stack, data model, layer diagram, block state machine, view structure.
- `Documentation/Reference/FUTURE_IDEAS.md` — parking lot for all out-of-scope ideas.
- This snapshot.
- `CLAUDE.md` updated with project description and invariants.

## Open Items
- Install Node.js, Rust, and VS Build Tools on this machine.
- Scaffold the Tauri + Svelte project.
- Port the existing HTML/CSS into the Svelte app structure.
- Implement the data layer (SQLite schema, data access module).

## Next
Install dev tooling (Node.js, Rust, VS Build Tools), then scaffold the Tauri + Svelte project and verify it builds and opens a window.
