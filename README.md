# Daily Companion

A personal daily schedule companion for Windows. Shows your day as a timeline of time blocks, tracks what you're doing right now, nudges you at transitions, and lets you self-grade each block when it's done. Generates a daily report at midnight.

Built for personal use, but architected so the frontend logic is portable to web or mobile later.

---

<img width="2558" height="1247" alt="image" src="https://github.com/user-attachments/assets/23739fed-0652-4f89-9c9a-cea6fc2c3f6c" />

<img width="2559" height="1203" alt="image" src="https://github.com/user-attachments/assets/f965c1a2-87cd-478c-80a7-765be2b5e156" />



---

## What It Does

- **Timeline view** — See your whole day at a glance. The current block is highlighted; past blocks show their grade.
- **Live clock** — A 1-second heartbeat drives real-time progress bars and transition detection.
- **Native notifications** — Windows toast notifications 5 minutes before a transition, and again at the moment it happens.
- **Block grading** — When a block ends, a grading prompt appears. Rate it 1–10, add a note, and it's sealed permanently.
- **Daily report** — Auto-generated at midnight (or next app open) summarizing the day's blocks and grades.
- **Schedule templates** — Edit your default daily schedule in settings. Each day gets its own copy — editing your template never changes history.

---

## Stack

| Layer | Technology |
|---|---|
| Desktop shell | Tauri v2 (Rust) |
| Frontend | Svelte |
| Data | SQLite via `tauri-plugin-sql` |
| Notifications | Tauri notification plugin |
| Styling | Custom CSS (dark theme) |

The Rust layer is intentionally thin — OS integration only. All schedule logic lives in the Svelte frontend.

---

## Architecture in One Picture

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

## Key Concepts

**Block** — A named time slot in your day (e.g., "Deep Work 🧠", "Exercise 🏋️"). Has a type (work, exercise, rest, admin, open, novel), start/end time, and an optional note.

**Block state:** `UPCOMING → ACTIVE → COMPLETED → GRADED`

Blocks are editable until graded. Once you submit a grade, the block is frozen permanently — it becomes a historical record.

**Schedule Template** — Your default daily schedule. Editing it only affects future days; past days are never touched.

**Day** — A specific calendar date. Gets its own copy of your template when it's first opened. The day is the atomic unit everything else hangs off.

---

## Status

**v1 in active development.** Core infrastructure is complete: SQLite, reactive store, template editor, and onboarding flow. Grading, daily reports, and notifications are next.

v1 scope: app runs, shows today's schedule, tracks the current block, fires notifications, lets you grade blocks, generates a daily report, has a settings screen for template editing.

---

## Development

Requires [Rust](https://rustup.rs/) and [Node.js](https://nodejs.org/).

```bash
npm install
npm run tauri dev
```

Build for production:

```bash
npm run tauri build
```

Full architecture details are in [`Documentation/Active/ARCHITECTURE.md`](Documentation/Active/ARCHITECTURE.md).
