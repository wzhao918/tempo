# Tempo — Architecture

**Status:** v0.9 — Sleep block type, centralized engine, day rollover detection implemented.

---

## What This System Is

A personal daily schedule companion. You design a day shape (a template of time blocks), live against it with real-time tracking, and grade each block when it's done. Over time, the feedback loop — plan, execute, evaluate — helps you refine how you spend your days.

Built as a native desktop app (Tauri + Svelte). Architected so the frontend logic is portable to web/mobile without a rewrite.

### The Core Loop

```
Template (scaffold) → Day Instance (plan) → Live Tracking (execute) → Grades (evaluate)
         ↑                                                                      │
         └──────────────────── refine over time ────────────────────────────────┘
```

This feedback loop is the product. Calendar apps plan but don't evaluate. Time trackers evaluate but don't plan. Tempo does both on the same object (the block).

---

## Scheduling Model: Path B (Template-Driven)

Tempo currently follows a **template-driven** model: most days have the same shape.

- The **template** is a reusable scaffold — your ideal day structure.
- Each morning (at the day boundary), the template is automatically copied into a fresh **day instance** with its own editable blocks.
- One-off changes are made by editing today's instance. The template stays untouched.
- The "Tomorrow" modal edits the template (affecting all future days), not a specific future day.

This is an explicit design choice, not an accident. It optimizes for people whose days are roughly the same shape with occasional adjustments.

### Path A Compatibility (Future)

An alternative model — **day-specific planning** — would let users design each day individually, using the template as a starting point rather than an auto-copy source. The data model already supports this:

- `createDayFromTemplate()` would be called at planning time (evening before) instead of at the day boundary
- The Tomorrow modal would edit `day_blocks` for a specific date instead of `template_blocks`
- Template becomes a "start from this" scaffold rather than "auto-copy this"

**What would change:** When day instances are created, and what the Tomorrow modal points at.
**What would NOT change:** Tables, block lifecycle, grading, reports, day boundary, Sleep block.

A future user preference toggle could select between these models. For now, all code assumes Path B.

---

## Core Principles

1. **The day is the atomic unit.** Every feature hangs off a single day's schedule.
2. **Blocks are independent time slots.** They have start and end times. Gaps and overlaps are allowed. No contiguous chain requirement.
3. **Blocks are immutable once graded.** Edit freely until you submit a rating. After that, frozen forever. Enforced at the DB level (`WHERE grade IS NULL`).
4. **Sleep is the day boundary.** The Sleep block's end time defines when one day ends and the next begins. Sleep is a distinct block type — one per template, always present.
5. **Business logic lives in JS, not Rust.** Tauri's Rust layer is a thin shell for OS integration. All schedule logic stays in the Svelte frontend. This keeps the app portable.
6. **One data access layer.** All reads/writes go through `db.js`. Swap SQLite for a cloud API later without touching UI code.
7. **Template is separate from day instance.** Edit the template to change your default day shape. Each day gets a copy that becomes its own independent record.

---

## System Nouns

| Noun | Definition | Lifecycle |
|------|-----------|-----------|
| **Template** | The default daily schedule scaffold. An ordered list of block definitions. | User edits intentionally via Tomorrow modal. |
| **Day** | A specific calendar date with its own copy of blocks. | Created at day boundary from template. Never duplicated. |
| **Block** | A time slot within a Day. Has: name, emoji, type, start, end, note. | Editable until graded → then frozen. |
| **Block Type** | Category: `work`, `exercise`, `rest`, `open`, `admin`, `novel`, `sleep`. Determines color and behavior. | Defined in template. |
| **Sleep Block** | Special block type that spans midnight. Its end time IS the day boundary. One per template, required. | Created during onboarding. Can be edited but not deleted or duplicated. |
| **Grade** | A 1–10 self-assessment + optional text note, attached to a completed block. | Created once per block, immutable after. |
| **Quest** | A to-do item scoped to a specific date. | Created for tomorrow, carried into today, cleaned up after. |
| **Daily Report** | Auto-generated summary of a Day's blocks and grades. | Generated at day finalization. Read-only. |

### Implemented in engine.svelte.js

| Concept | Status |
|---------|--------|
| **Tick** (centralized heartbeat) | Built. Single 1-second interval in `engine.svelte.js`. All components subscribe to `tick` state instead of running their own timers. |
| **Block State** (per-block state computation) | Built. `computeBlockStates()` runs once per tick, exposes `blockState.states[]` with values: `upcoming`, `active`, `completed`, `graded`. Components read from this instead of deriving independently. |
| **Day Rollover Detection** | Built. `checkDayRollover()` runs each tick, compares current boundary date to loaded date, calls reload callback when they diverge. |

### Not Yet Implemented

| Concept | Status | What's needed |
|---------|--------|--------------|
| **Transition** (block state change event) | Not built. Block state is computed but change detection (previous tick vs. current tick) isn't tracked yet. | Compare `blockState.states` across ticks to detect the moment a block changes state. |
| **Notification** (Windows toast at transitions) | Not built. Settings toggles exist but are unwired. | Transition detection + Tauri notification plugin. |

---

## Data Model (SQLite)

```
schedule_templates
  id          INTEGER PRIMARY KEY
  name        TEXT
  created_at  TIMESTAMP
  updated_at  TIMESTAMP

template_blocks
  id          INTEGER PRIMARY KEY
  template_id INTEGER FK → schedule_templates.id
  sort_order  INTEGER
  name        TEXT
  emoji       TEXT
  type        TEXT            -- work | exercise | rest | open | admin | novel | sleep
  start_time  TEXT            -- "HH:MM"
  end_time    TEXT            -- "HH:MM"
  note        TEXT

days
  id          INTEGER PRIMARY KEY
  date        TEXT UNIQUE     -- "YYYY-MM-DD" (ISO 8601)
  template_id INTEGER FK → schedule_templates.id
  created_at  TIMESTAMP

day_blocks
  id          INTEGER PRIMARY KEY
  day_id      INTEGER FK → days.id
  sort_order  INTEGER
  name        TEXT
  emoji       TEXT
  type        TEXT
  start_time  TEXT
  end_time    TEXT
  note        TEXT
  grade       INTEGER NULL    -- 1-10, null = not yet graded
  grade_note  TEXT NULL
  graded_at   TIMESTAMP NULL

daily_reports
  id          INTEGER PRIMARY KEY
  day_id      INTEGER FK → days.id
  generated_at TIMESTAMP
  summary     TEXT            -- JSON blob

quests
  id          INTEGER PRIMARY KEY
  text        TEXT
  done        BOOLEAN DEFAULT FALSE
  target_date TEXT            -- "YYYY-MM-DD"
  created_at  TIMESTAMP
```

### Day Boundary Contract

The **Sleep block** defines the day boundary:

- Sleep block has `type: "sleep"` (distinct from `rest`)
- Sleep spans midnight (e.g., 23:00 → 07:00)
- Sleep's `end_time` = the moment the new day begins
- When the current time passes Sleep's end_time, the previous day is finalized and a new day instance is created from the template

**Implementation:** `getTodayDate()` in db.js finds the block with `type: "sleep"` and uses its `end_time` as the boundary. Falls back to first block's start time if no sleep block exists. A migration in `runMigrations()` converts existing "Sleep" blocks from `type: "rest"` to `type: "sleep"`.

---

## Application Layers

```
┌─────────────────────────────────────────────────┐
│                   Svelte UI                      │
│  Components, modals, reactive display            │
│  (Hero, Timeline, BlockCard, Sidebar, etc.)      │
│  Subscribe to engine.svelte.js for time and state.      │
│                                                  │
│  ┌──────────────────────────────────────────┐    │
│  │      scheduleStore.svelte.js             │    │
│  │      Reactive state + action dispatch    │    │
│  │      (day creation, grade submission,    │    │
│  │       quest lifecycle, editing actions)  │    │
│  └──────────────────┬───────────────────────┘    │
│                     │                            │
│  ┌──────────────────┴───────────────────────┐    │
│  │           engine.svelte.js (Business Logic)     │    │
│  │  Centralized tick (1s heartbeat)         │    │
│  │  Block state computation                 │    │
│  │  Day rollover detection                  │    │
│  └──────────────────┬───────────────────────┘    │
│                     │                            │
│  ┌──────────────────┴───────────────────────┐    │
│  │           db.js (Data Access)            │    │
│  │  All SQL queries                         │    │
│  │  Day boundary computation (getTodayDate) │    │
│  │  Report generation, day finalization     │    │
│  └──────────────────┬───────────────────────┘    │
├─────────────────────┼────────────────────────────┤
│         Tauri (thin Rust shell)                   │
│  SQLite file I/O, system tray, notifications     │
└─────────────────────────────────────────────────┘
```

### Remaining Structural Gaps

**Report generation and day finalization** still live in `db.js`. These are business logic, not data access. A future cleanup would move them into `engine.svelte.js` or a dedicated reporting module. Not urgent — they work correctly where they are.

**Settings notification toggles** are still component-local state (not persisted, not wired to anything). This will matter when notifications are implemented.

---

## Module Map (What Each File Does Today)

### JavaScript

| File | Role | Responsibility |
|------|------|---------------|
| `src/lib/engine.svelte.js` | Business Logic | Centralized tick (1s), block state computation, day rollover detection. Single time authority — components subscribe instead of running own timers. |
| `src/lib/db.js` | Data Access | All SQLite queries. Also contains day boundary computation (`getTodayDate`), report generation, day finalization. |
| `src/lib/scheduleStore.svelte.js` | Reactive Store | App state (`$state`), action dispatch (load, grade, save edits, quests). Orchestrates day creation. |
| `src/lib/schedule.js` | Pure Utilities | Time math, block color maps, `buildBarSegments()`. No state, no side effects. |

### Svelte Components

| Component | Purpose | Notes |
|-----------|---------|-------|
| `+page.svelte` | App shell | Routes between dashboard/settings, mounts modals, initializes engine. |
| `Header.svelte` | Top nav | Dashboard/Settings toggle, date display. Reads from `tick`. |
| `Hero.svelte` | Clock + current block | Large clock, active block pill, next-block countdown. Reads from `tick` + `blockState`. |
| `Timeline.svelte` | Block list | Renders BlockCards, scroll-to-active. Reads from `tick` + `blockState`. |
| `BlockCard.svelte` | Single block | Display + grading UI. Receives pre-computed state from engine via props. |
| `Sidebar.svelte` | Day overview + stats | Color bars (today/tomorrow), stats grid. Reads from `tick` + `blockState`. |
| `TodayModal.svelte` | Edit today's blocks | Edits `day_blocks`. Graded blocks locked. Uses shared `buildBarSegments()`. |
| `TomorrowModal.svelte` | Edit template + quests | Edits `template_blocks` (Path B). Quest CRUD. Uses shared `buildBarSegments()`. |
| `TemplateEditor.svelte` | Reusable block editor | Accordion layout, drag-to-reorder, sleep block anchored at bottom. Used by both modals + onboarding. |
| `Settings.svelte` | App preferences | Notification toggles (unwired), danger zone (reset). |
| `Onboarding.svelte` | First-launch wizard | Wake/bed/meal times → generate template with `type: "sleep"` block. |
| `SkyGradient.svelte` | Ambient background | Time-of-day gradient. Reads `tick.hour` from engine. |

### Rust (Tauri)

| File | Role |
|------|------|
| `src-tauri/src/main.rs` | Entry point. Just calls `lib::run()`. |
| `src-tauri/src/lib.rs` | Plugin setup: SQL, notification (registered but unused), opener. |

### Shared Utilities

`buildBarSegments()` — extracted to `schedule.js`. Used by Sidebar, TodayModal, and TomorrowModal.

---

## Views & Modals

| View | Status | Description |
|------|--------|-------------|
| **Dashboard** | Built | Clock, current block, timeline, sidebar, grading. Main view. |
| **Settings** | Built | Notification toggles (unwired), danger zone. Minimal. |
| **Today Modal** | Built | Edit today's day_blocks. Graded blocks locked. Triggered from sidebar. |
| **Tomorrow Modal** | Built | Edit template_blocks + quests. Triggered from sidebar. |
| **Reports** | Not built | DB functions exist (`generateDailyReport`, `finalizePreviousDay`). No UI. |
| **Onboarding** | Built | First-launch wizard. Generates initial template. |

---

## Block Lifecycle

```
UPCOMING ──(start time)──→ ACTIVE ──(end time)──→ COMPLETED ──(user grades)──→ GRADED
   │                          │                        │                          │
   │  editable: yes           │  editable: yes         │  editable: yes           │  editable: no
   │  deletable: yes          │  deletable: yes        │  deletable: yes          │  deletable: no
   │                          │                        │  shows grade prompt      │  sealed forever
```

**Implementation status:** These states are not tracked explicitly. Each component re-derives them from time comparison on every render. There is no transition detection — the system knows "this block looks completed right now" but cannot detect "this block just became completed."

---

## What's Not Built Yet (v1 Gaps)

| Feature | Dependency | Notes |
|---------|-----------|-------|
| Transition detection | Block state tracking (done) | Compare states across ticks to detect the moment a block changes. Foundation for notifications. |
| Notifications | Transition detection + Tauri plugin | Windows toast at block transitions. Settings toggles exist but are unwired. |
| Reports UI | None | Display `daily_reports` data. Generation logic exists in db.js. |
| Settings persistence | None | Notification toggles are component-local state, not persisted to DB. |
| Quest panel on dashboard | None | Quests currently only visible in Tomorrow modal. Should show on main sidebar. |
| Report/finalization extraction | None | `generateDailyReport()` and `finalizePreviousDay()` still in db.js. Could move to engine.svelte.js. Not urgent. |

---

## What's Not In Scope (v1)

See `Documentation/Reference/FUTURE_IDEAS.md` for the full parking lot.

v1 is: app runs, shows today's schedule from template, tracks current block in real-time, lets you grade blocks, has quests, has today/tomorrow editing modals.

---

_Last verified against codebase: 2026-04-09 (sleep block type, engine.svelte.js, component rewiring complete)_
