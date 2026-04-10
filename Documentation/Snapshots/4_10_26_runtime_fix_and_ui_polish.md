# 4/10/26 — Runtime fix + first-install UI polish

## Context

Yesterday's session ended with a clean build but the installer wasn't run. This session picked up at that point. The first thing that happened was a runtime regression, followed by three UX polish items caught on first real use of the installed app.

## 1. The 500 error on launch

**Symptom:** Installer built fine, app launched, webview showed "500 Internal Error".

**Cause:** `engine.js` was named with a plain `.js` extension. Svelte 5's compiler only transforms runes (`$state`, `$derived`, etc.) in files named `.svelte`, `.svelte.js`, or `.svelte.ts`. In plain `.js`, `$state(...)` is a call to an undefined identifier. Vite's build pipeline doesn't lint rune usage outside Svelte-recognized files, so the build passed silently and the app failed the moment `engine.js` was imported.

**Fix:** Renamed `app/src/lib/engine.js` → `app/src/lib/engine.svelte.js` and updated all seven import sites (`+page.svelte`, `scheduleStore.svelte.js`, `Hero.svelte`, `Timeline.svelte`, `Sidebar.svelte`, `Header.svelte`, `SkyGradient.svelte`). Doc references in `ARCHITECTURE.md` and `CLAUDE.md` updated to match — the `.svelte.js` extension is architecturally meaningful (signals rune usage) so the docs should reflect it.

**Lesson:** Vite build is not a safety net for rune-using files. The MEMORY.md entry on this Svelte 5 footgun was already present at session start — I still missed it. Re-saved the memory with stronger emphasis. The reflex to check for should be: *"any new reactive module → is it named `.svelte.js`?"* before committing.

Commit: `3d999da`

## 2. Git repository recovery

Not a bug, but worth recording. The project directory on this PC was copied from another PC without the `.git` directory, so at session start there was no git repo to push to. The recovery path was:

1. `git init` locally
2. `git remote add origin https://github.com/wzhao918/tempo.git`
3. `git fetch origin` (downloaded history without touching files)
4. `git reset --mixed origin/master` (pointed HEAD at remote master, working tree untouched)
5. Reviewed the diff — session changes + one leftover file move (`daily-companion.html` archival) that rode along from the other PC
6. Committed + pushed

No destructive operations used. Working tree preserved throughout. Also set `core.autocrlf input` on the local repo config to keep line endings consistent with master.

## 3. First-install UI polish — three items

Feedback came from the first real launch of the working app. All three were approved as proposals before implementation, per the CLAUDE.md workflow.

### 3a. Home sidebar quest panel

**Before:** Quests only existed inside the Tomorrow modal. The sidebar on the main dashboard had no surface for them.

**After:** New `.sidebar-card` between "Day Overview" and "Today at a Glance" titled "Quests". Filters `store.quests` by `target_date === store.todayDate`. Three render states:

- Empty: italic dim text "No quests today. Create your own for tomorrow →" (text-only, no button)
- Populated: checkbox rows, toggleable via existing `toggleQuestDone` action
- All done: small "all done" indicator at the bottom of the list

**Design call:** The sidebar is read-mostly. Add/remove still happens in the Tomorrow modal, which is where quest creation semantically belongs ("quests for tomorrow's self"). Only toggle-complete works from the home. This keeps the surface simple and avoids duplicating the add/remove/clear UI in two places.

**Code touched:** `Sidebar.svelte` only. The store and DB already had everything needed — this was purely a new UI surface over existing state.

### 3b. Template editor grid compression

**Before:** `TemplateEditor.svelte`'s `.field-grid` was a single row of `2fr 1fr auto auto` (Name / Type / Start / End). Inside the Tomorrow modal, which shares width with the Quests panel, the editor column was narrow enough that the Type dropdown's `1fr` shrank to ~80px — not enough room for "⚡ Work / Focus" without truncation.

**After:** Reshaped to three rows:

```
Row 1: [      Name (full width)      ]
Row 2: [    Type    ][ Start ][ End  ]
Row 3: [      Note (full width)      ]
```

Grid is now `1fr auto auto`. `.field-name` spans all columns (`grid-column: 1 / -1`). Applied to both `.field-grid` (expanded block edit, sleep block edit) and `.stage-grid` (new block staging form). Mobile media query updated to stack everything into a single column on narrow screens.

**Alternative considered:** Shrinking the Type field to a 56px emoji-only square with a custom dropdown. Rejected because native `<select>` dropdowns often size their option lists to match the select width, so the open list would also be 56px and clip the labels. Making this work properly required a custom dropdown component — too much surface area for a pretty minor visual win. The grid reshape is boring and solves the problem.

**Code touched:** `TemplateEditor.svelte` CSS only. No template changes — the row reshape happens purely through grid-template-columns + grid-column overrides.

### 3c. Sky gradient rework + stars

**Before:** `SkyGradient.svelte` ran warm gold/amber tones across the whole day (midday at `[160, 130, 55]` gold). This was the original design intent ("warm companion feel") but felt disconnected from the natural sense of time passing.

**After:** Cool sky-blue daytime palette with warm sunrise/sunset bookends:

| Hour | Phase | Color |
|---|---|---|
| 0–5 | Deep night | `[6, 8, 20]` |
| 5–6 | Pre-dawn | `[40, 25, 55]` purple |
| 6–7 | Dawn | `[180, 85, 50]` orange |
| 7–9 | Early morning | `[150, 160, 180]` pale blue |
| 9–12 | Late morning | `[60, 120, 200]` **deep sky blue** |
| 12–15 | Afternoon | `[140, 180, 220]` **near-white sky blue** |
| 15–17 | Late afternoon | `[180, 160, 140]` warming |
| 17–18 | Golden hour | `[200, 120, 60]` amber |
| 18–19 | Sunset | `[180, 70, 80]` orange/pink |
| 19–20 | Dusk | `[70, 40, 90]` purple |
| 20–22 | Evening | `[25, 20, 55]` deep purple |
| 22–24 | Night | `[6, 8, 20]` deep navy |

Opacity also pushed up from ~0.2 at noon to ~0.35–0.45 — the sky is now a present visual element, not a subtle tint.

**Stars:** New layer inside `SkyGradient.svelte`. 80 pre-placed dots with individual twinkle animations:

- Positions generated once at module load via `Math.random()`. Random per launch, stable within a session. The "fresh sky each launch" feels intentional.
- Each star has its own `left`, `top` (within the top 38% of viewport), `size` (0.8–2.4px), `baseOpacity` (0.35–0.9), animation `delay` (0–8s), and `duration` (3–8s). Distributed so the field doesn't pulse in sync.
- CSS `@keyframes twinkle` modulates opacity between `--base-opacity` × 1 and × 0.25. No JS animation loop.
- Layer opacity driven by `tick.hour`: full 0–5, fade-out 5–6, hidden 6–19, fade-in 19–21, full 21–24.
- Concentrated in the top 45vh to match the gradient's reach. White (`#f5f5ff`) with a 2px soft box-shadow glow.

**Code touched:** `SkyGradient.svelte` (full rewrite — roughly doubled in size).

## What's different now

The dashboard feels like a *place* rather than a UI. The sky drifts through real phases, the stars come out at dusk, the quest panel is visible at all times so quest-setting feels like part of the daily loop rather than a modal-only ritual, and the template editor doesn't feel cramped inside the Tomorrow modal anymore.

## Parking lot additions

Moved four environment/ambient ideas into `FUTURE_IDEAS.md` under a new "Ambient / Environment" section:

- Weather-aware sky gradient (pull local weather, tint accordingly)
- Real sunrise/sunset times from geolocation (fix seasonal drift)
- Seasonal palette shifts (winter vs. summer biasing)
- Moon phase in night sky (no API needed, pure astronomy)

## Commits this session

- `3d999da` — Rename engine.js → engine.svelte.js to enable Svelte 5 runes
- `1987e50` — Add home quest panel, fix type compression, rework sky gradient

## Next

The four remaining Known Gaps in CLAUDE.md are: transition detection (engine knows states but not the *moment* of change, needed for notifications), notification toggles (settings UI is unwired), report generation location (still in `db.js`, should move to engine layer), and — now resolved — quest panel on the dashboard. Of the three remaining, **transition detection is the natural next step** because it unlocks notifications, which is the highest-leverage missing feature. Start by adding a `previousStates` comparison inside engine's tick loop and emitting transition events when `blockState.states[i]` flips.
