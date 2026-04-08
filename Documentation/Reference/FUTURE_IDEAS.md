# Future Ideas — Parking Lot

Ideas that came up during discovery but are out of scope for v1. Preserved here so they don't get lost.

---

## Schedule & Blocks
- **Separate "Build Tomorrow" from Settings** — the template editor currently lives in Settings, but "building tomorrow's schedule" is a first-class daily ritual, not a settings change. The day overview color bars made this click: you do your schedule today, build tomorrow's, then tomorrow comes around and you do it again. Options: dedicated "Tomorrow" screen, inline editing on the dashboard, or a standalone planning view. The key insight is that schedule-building is a *workflow*, not a *configuration*. (Parked 2026-04-08)
- **Day-by-day custom scheduling** — fully custom schedule per day, not just templates. Requires a calendar/planning UI.
- **Weekday/weekend templates** — multiple templates, auto-select based on day of week.
- **Block splitting** — break a block into sub-blocks mid-day (e.g., "Deep Work" → two 75-min focus sessions with a break).
- **Drag-and-drop block reordering** — visual block rearrangement in the template editor. First user-requested feature (mom). Pure frontend — sort_order column already supports it.
- **Recurring vs. one-off blocks** — some blocks repeat daily, some are one-time (e.g., "dentist appointment").

## Focus & Productivity
- **Pomodoro timer** — focus timer within work blocks. The HTML had a placeholder button for this.
- **Block-internal task lists** — attach specific tasks/goals to a block before it starts, check them off during.

## Grading & Reflection
- **Grade dimensions** — instead of a single 1-10, rate on multiple axes (focus, energy, output quality).
- **Daily reflection prompt** — free-text reflection at end of day, attached to the daily report.
- **Weekly/monthly summaries** — aggregate daily reports into trend views.

## Metrics & Telemetry
- **Long-term trends** — charts showing grade averages over time, by block type.
- **Deep work hours tracking** — cumulative deep work hours per week/month.
- **Pattern detection** — "you consistently grade your 3pm admin block low" type insights.
- **Export** — CSV/JSON export of all data for external analysis.

## Companion / Personality
- **Character/persona** — a companion with an intentional personality, not generic quotes. If introduced, needs real design work on voice, tone, and when it speaks.
- **Context-aware messages** — companion reacts to grades, streaks, time of day.
- **Motivational quotes** — the current quote rotation. Parked until companion has a real identity.

## Product / Scale
- **iOS / Android app** — Capacitor wrapper around the Svelte frontend, or native rebuild.
- **Cloud sync** — move from local SQLite to cloud DB, user accounts, cross-device sync.
- **Multi-user** — shared schedules, team visibility (very different product).
- **Web app** — ship the Svelte frontend as a hosted web app alongside the desktop version.

## UX
- **Day-off / skip-day mode** — mark a day as skipped, no blocks to grade.
- **Calendar view for reports** — visual calendar with color-coded days by overall grade.
- ~~**Onboarding flow**~~ — SHIPPED. First-run wizard with wake/bed/meals steps.
- **Themes** — light mode, custom color schemes.
- **Sound notifications** — audio cues at transitions (the HTML had this as "coming soon").

- **Color schemes** - user selects from templates
- **Animations** - e.g. mouse hover animations, grading and completion animations (little "dopamine hits"), etc.
- **Drag UX in accordion cards** — the settings accordion (collapsed-by-default) lost the drag handle visual accents (hover border, amber glow on active) that existed in the old always-expanded layout. Worth restoring when the template editor gets its next pass. (Noted 2026-04-08)

---

_This is a living document. Add ideas freely. Move items to active scope when they're being built._
