# 2026-04-09 — Full Codebase Audit & Documentation Rewrite

## Context

The app had accumulated several recurring bugs (yesterday's grades bleeding into today, quest panel placement) and a growing sense that surface-level fixes kept exposing deeper structural issues. Rather than fixing symptoms, we audited the entire codebase against CLAUDE.md and ARCHITECTURE.md to find root causes.

The core finding: the documentation described a system that didn't exist. A three-layer architecture with a business logic layer, a centralized tick, a block state machine, transition detection, and notifications — none of which were built. This mismatch meant any coding agent working on the codebase was operating from a false map.

## What Was Accomplished

### Full Codebase Audit

Read every file in the project. Cross-referenced ARCHITECTURE.md and CLAUDE.md claims against code reality. Findings organized into three categories:

**What's true and clean:**
- db.js as single SQL entry point (no other file touches SQLite)
- TemplateEditor as reusable component (both modals + onboarding)
- Graded = sealed at DB level (WHERE grade IS NULL guards)
- schedule.js as pure utilities (no state, no side effects)
- Template/day separation in data model
- Rust layer genuinely thin

**What was documented but doesn't exist:**
- Business Logic Layer (described in architecture diagram — never built)
- Block State Machine (documented UPCOMING → ACTIVE → COMPLETED → GRADED — not implemented)
- Centralized Tick (documented as system noun — five independent timers exist instead)
- Transition detection (documented — never built)
- Notifications (documented flow — no code, no Tauri plugin import)
- Reports UI (listed as v1 — not built, DB functions exist)

**Structural root causes of recurring bugs:**
1. No centralized time authority — 5 independent setIntervals across components
2. No day lifecycle management — day boundary computed once at startup, never rechecked
3. Block state re-derived independently per component — no single source of truth
4. Business logic split between db.js and scheduleStore without clear boundaries
5. buildBarSegments() duplicated in 3 components
6. Settings notification toggles are unwired component-local state

### Scheduling Model Analysis

Identified that the app was straddling two design models without committing to either:
- **Path A (day-specific):** Each day is independently planned. Template is a starting scaffold.
- **Path B (template-driven):** Most days are the same shape. Template auto-copies to each new day.

The UI said "Tomorrow" (Path A language) but the mechanics were Path B. Decision: **commit to Path B explicitly**, with architectural decisions that keep Path A viable as a future user toggle. The data model already supports both — the only difference is when `createDayFromTemplate()` is called and what the Tomorrow modal points at.

### Sleep Block as Day Boundary

Established that the Sleep block should be the explicit day boundary contract:
- `type: "sleep"` (distinct from `rest`)
- Spans midnight (e.g., 23:00 → 07:00)
- Sleep's end_time = when the new day begins
- One per template, required, not deletable
- Replaces the fragile "first block's start time" derivation

### Documentation Rewrite

**ARCHITECTURE.md** — rewritten from scratch:
- Honest description of current state (what's built, what's not)
- Core Loop diagram (template → instance → tracking → grades → refine)
- Path B scheduling model with Path A compatibility notes
- Updated system nouns (Sleep as distinct concept, unbuilt concepts marked)
- Accurate application layer diagram showing the tangled state
- Module map (what each file actually does)
- Known structural gaps listed explicitly
- "What's Not Built Yet" table with dependencies

**CLAUDE.md** — updated:
- Version bumped to v1.1, renamed from "Daily Companion" to "Tempo"
- System description updated with feedback loop framing
- Path B scheduling model declared
- Sleep block added to core invariants
- "Known Gaps" section added — architectural commitments not yet in code
- Architecture section expanded with agent guidance (what to read, what to watch out for)

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Path B first, Path A later | Current user (n=1) is Path B. Data model supports both. Path A is a UI routing change, not an architectural one. |
| Sleep as day boundary | Explicit, semantic, user-visible. Replaces fragile sort-order derivation. |
| Known Gaps as commitments | Listed in CLAUDE.md so agents treat them as things to fix, not things to work around. |
| Honest docs over aspirational docs | Previous architecture doc described what we wanted, not what we had. Agents were building on false assumptions. |

## Files Modified
- `Documentation/Active/ARCHITECTURE.md` — Full rewrite (v0.8)
- `CLAUDE.md` — Updated invariants, scheduling model, known gaps (v1.1)

## Next

Implement the `sleep` block type and day boundary contract — this is the smallest change that fixes the most visible bug (yesterday's grades bleeding into today) and establishes the foundation for day rollover detection and the centralized tick.
