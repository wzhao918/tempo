# 2026-04-04 — App Scaffold & Port

## Context
Second working block of the day. Architecture and decisions were locked in the previous session. Goal was to go from "HTML file in a browser" to "native desktop app running on Windows."

## What Was Accomplished

### Toolchain Installation
All dev dependencies installed from scratch on a clean Windows 11 machine:
- Node.js v24.14.1 + npm v11.11.0 (via winget)
- Rust 1.94.1 + Cargo (via rustup/winget)
- Visual Studio 2022 Build Tools with MSVC C++ workload (via winget)
- GitHub CLI v2.89.0 (via winget)
- WebView2 and Git were already present.

### Tauri + Svelte Scaffold
- Scaffolded a Tauri v2 + SvelteKit project in `app/`.
- Fixed auto-generated naming (ugly path-derived names → "Tempo").
- Verified full Rust compilation (391 crates) and native window launch.

### UI Port
Ported the single HTML file into a component-based Svelte architecture:

```
src/
  app.css                    ← global design tokens + color utilities
  app.html                   ← shell HTML with font imports
  lib/
    schedule.js              ← schedule data + all time helper functions
    components/
      Header.svelte          ← wordmark + date display
      Hero.svelte            ← live clock + current block pill + countdown
      Timeline.svelte        ← schedule list container + scroll behavior
      BlockCard.svelte       ← individual block card (active/past/collapsed states)
      Sidebar.svelte         ← stats grid + notification toggles
  routes/
    +page.svelte             ← page layout composing all components
```

- All font sizes bumped ~20% from the original for better readability.
- Quotes/quote card removed (parked — needs intentional companion design).
- Pomodoro button removed (parked — see FUTURE_IDEAS.md).
- Svelte reactivity replaces manual DOM manipulation (`setInterval` + `getElementById` → reactive `$state` and `$derived`).

### Naming
- App renamed from "Daily Companion" to **Tempo**.
- Product family concept: Tempo (internal rhythm) alongside Pulse (external signal).

### GitHub
- Repo created: https://github.com/wzhao918/tempo (public)
- Two commits pushed: initial scaffold + rename.

## Decisions Made
- **Public repo for now.** No proprietary logic yet. Flip to private before product launch or when IP-sensitive features land.
- **Sub-product naming:** Tempo sits alongside Pulse under Warren's startup umbrella. Asian spirituality concept names (Kata, Sati, Ma, Ritsu, Koku) noted as potential sub-discipline branding.

## Emerging Thread
Warren's mom wants to use Tempo. This surfaces the **multi-user question** earlier than expected: the app currently has a hardcoded schedule for one person. Supporting a second user means the schedule template system (already designed in ARCHITECTURE.md) becomes the immediate next priority — not a future feature.

## Next
Brainstorm what "another user with a different schedule" requires — at minimum: a settings/config screen for template editing, and possibly a first-run onboarding flow.
