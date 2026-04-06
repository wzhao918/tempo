# Daily Companion — Architecture

**Status:** v0.4 — Block grading system working (day instances, grade form, sealed records). Template editor now supports drag-to-reorder with auto time recalculation and staged block creation. CI/CD pipeline produces Windows + macOS installers via GitHub Actions (manual trigger). Daily report viewing UI and notifications remain.

---

## What This System Is

A personal daily schedule manager that runs as a native desktop app. Shows your day as a timeline of blocks, tracks what you're doing right now, nudges you at transitions, and lets you self-grade each block when it's done. Generates a daily report at midnight.

Built for personal use, but architected so the door stays open for a multi-user product (mobile, cloud) without a rewrite. Onboarding flow supports any new user out of the box.

---

## Core Principles

1. **The day is the atomic unit.** Every feature hangs off a single day's schedule.
2. **Blocks are immutable once graded.** You can edit a block until you submit a rating. After that, it's history.
3. **Business logic lives in JS, not Rust.** Tauri's Rust layer is a thin shell for OS integration. All schedule logic, grading, reporting stays in the Svelte frontend. This makes the app portable to web/mobile later.
4. **One data access layer.** All reads/writes go through a single module. Swap SQLite for a cloud API later without touching UI code.
5. **The schedule template is separate from the day's instance.** Edit your template in settings. Each day gets a *copy* of the template that becomes its own record.

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Desktop shell | **Tauri v2** | Native Windows app, tiny footprint (~10MB), system tray, notifications, auto-start. Uses system WebView2 (already installed). |
| Frontend | **Svelte** | Compiles to vanilla JS (no runtime). Closest to plain HTML/CSS/JS but with reactive state. Default Tauri template. Portable to Capacitor/web later. |
| Data storage | **SQLite** (via `tauri-plugin-sql`) | Single file in AppData. Clean schema → portable to Postgres if needed. |
| Notifications | **Tauri notification plugin** | Native Windows toast notifications. |
| Styling | **CSS (custom)** | Existing dark theme with block-type color system. Ports directly from current HTML. |

---

## System Nouns

| Noun | Definition | Lifecycle |
|------|-----------|-----------|
| **Schedule Template** | The default daily schedule. An ordered list of block definitions with times, types, names, notes. Lives in settings/config. | User edits intentionally via settings screen. |
| **Day** | A specific calendar date. Gets a *copy* of the active template when the day begins (or when the app first opens that day). | Created once, never duplicated. |
| **Block** | A time slot within a Day. Has: name, emoji, type, start, end, note. Becomes ratable once its end time passes. | Editable until graded → then frozen. |
| **Block Type** | Category: work, exercise, rest, admin, open, novel. Determines color and possibly future behavior rules. | Defined in template config. |
| **Grade** | A 1–10 self-assessment + optional text note, attached to a completed block. | Created once per block, immutable after. |
| **Daily Report** | Auto-generated summary of a Day's blocks and grades. | Generated at midnight (or next app open). Read-only. |
| **Tick** | The 1-second heartbeat driving the clock, progress bars, and transition detection. | Runs while app is open. |
| **Transition** | The moment one block ends and the next begins. Triggers a notification. | Ephemeral event. |

---

## Data Model (SQLite)

```
schedule_templates
  id          INTEGER PRIMARY KEY
  name        TEXT            -- e.g., "Default Weekday"
  created_at  TIMESTAMP
  updated_at  TIMESTAMP

template_blocks
  id          INTEGER PRIMARY KEY
  template_id INTEGER FK → schedule_templates.id
  sort_order  INTEGER
  name        TEXT
  emoji       TEXT
  type        TEXT            -- work | exercise | rest | admin | open | novel
  start_time  TEXT            -- "06:30" (HH:MM)
  end_time    TEXT            -- "09:00"
  note        TEXT

days
  id          INTEGER PRIMARY KEY
  date        TEXT UNIQUE     -- "2026-04-04" (ISO 8601)
  template_id INTEGER FK → schedule_templates.id  -- which template was used
  skipped     BOOLEAN DEFAULT FALSE
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
  summary     TEXT            -- JSON blob or structured text
```

**Key relationships:**
- A template has many template_blocks.
- A day is created from a template. Its day_blocks are *copies* (not references) — so editing the template doesn't retroactively change past days.
- A daily_report is generated from a day's blocks + grades.

---

## Application Layers

```
┌─────────────────────────────────────────────────┐
│                   Svelte UI                      │
│  ┌───────────┐ ┌──────────┐ ┌────────────────┐  │
│  │ Dashboard  │ │ Reports  │ │   Settings     │  │
│  │ (timeline, │ │ (daily   │ │ (template      │  │
│  │  clock,    │ │  report  │ │  editor,       │  │
│  │  grades)   │ │  list)   │ │  preferences)  │  │
│  └─────┬─────┘ └────┬─────┘ └──────┬─────────┘  │
│        │             │              │             │
│  ┌─────┴─────────────┴──────────────┴─────────┐  │
│  │           Business Logic Layer              │  │
│  │  schedule engine, grading, report gen,      │  │
│  │  block state machine, transition detection  │  │
│  └──────────────────┬──────────────────────────┘  │
│                     │                             │
│  ┌──────────────────┴──────────────────────────┐  │
│  │           Data Access Layer                  │  │
│  │  single module: all SQL queries              │  │
│  │  (swap for API client later)                 │  │
│  └──────────────────┬──────────────────────────┘  │
├─────────────────────┼─────────────────────────────┤
│         Tauri (thin Rust shell)                   │
│  ┌──────────┐ ┌────┴─────┐ ┌──────────────────┐  │
│  │ System   │ │  SQLite  │ │  Notifications   │  │
│  │ Tray     │ │  File IO │ │  (toast plugin)  │  │
│  └──────────┘ └──────────┘ └──────────────────┘  │
└─────────────────────────────────────────────────┘
```

---

## Views (Tabs)

1. **Dashboard** — The main view. Clock, current block, timeline, stats sidebar, grading prompt.
2. **Reports** — Scrollable list of daily reports, most recent first.
3. **Settings** — Schedule template editor, notification preferences, app preferences.

---

## Block State Machine

```
UPCOMING ──(start time arrives)──→ ACTIVE ──(end time arrives)──→ COMPLETED ──(user submits grade)──→ GRADED
   │                                  │                               │
   │  editable: name, note,           │  editable: name, note,        │  editable: nothing
   │  type, times                     │  type (not times)             │  (frozen)
   │                                  │                               │
   └──────────────────────────────────┴───────────────────────────────┘
                              deletable: NO (part of the day record)
```

Note: ACTIVE blocks can't have their times edited — the block has already started. But name/note/type can still be adjusted until grading.

---

## Notification Flow

1. **Tick** (1s interval) detects: are we within 5 minutes of a transition?
2. If yes and 5-min warning enabled → fire Windows toast notification via Tauri plugin.
3. At exact transition → fire transition notification.
4. After transition, if previous block is COMPLETED and ungraded → show grading prompt in the UI (not a notification — a UI element).

---

## What's NOT In Scope (v1)

See `Documentation/Reference/FUTURE_IDEAS.md` for the parking lot.

v1 is: app runs, shows today's schedule from template, tracks current block, fires notifications, lets you grade blocks, generates daily report, has a settings screen for template editing.

---

_Last verified against codebase: 2026-04-06 (grading, drag-reorder, CI/CD)_
