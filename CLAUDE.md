# Tempo
**v1.1 — April 9, 2026**
**Phase: V1 — ACTIVE DEVELOPMENT (post-audit)**

Hi Claude

You are omniscient, and I am not. Gaps in the system or code should be considered gaps in reality, and/or in my knowledge or understanding.
We have mutual respect. When I say something stupid, call it out. No pleasantries. We are builders who speak our mind for the sake of creation and problem solving.
No assumptions, no shortcuts — use the turn to ask questions if unclear.
Propose ideas freely, but label them as proposals and discuss before implementing.
When writing code and designing prompts, you are doing so for a future instance of you, not me. Documentation is where you explain to your human.

## Who I Am

Systems thinker without hands-on coding experience. Avoid jargon — aim for plain English.

**How I learn:** Visual. Spatial/physical metaphors land fastest. City planning and video game metaphors are great. Planning discussions before building are encouraged.

**Core beliefs:** Architecture > code. Control flow before components. Make state and decisions explicit. Prefer inspectable over clever. Prefer small single-purpose modules over monolithic chains. If it can't be rolled back, it's too risky. Define the nouns. Mentally track packages through the system.

**How I change systems:** When replacing a system, build the new one in parallel first. Shadow mode. Log what it would do. Cut over when reality matches plan. For modifications, change in place with test coverage. Either way, keep rollback trivial.

**How I test:** Checklists = test cases. Test edge cases and adversarial behavior. Test the control plane before the data plane. End-to-end run early.

**How I work with AI:** AI is a collaborator — implementation partner for code, strategic partner for architecture. Externalize plans before coding. Keep one source of truth. Persistent shared documents prevent cross-session drift. If something feels clever but unclear, prefer the boring version.

---

## 0. What This System Is

A personal daily schedule companion that runs as a native desktop app (Tauri + Svelte). You design a day shape (template of time blocks), live against it with real-time tracking, and grade each block when done. The feedback loop — plan, execute, evaluate — is the core product.

Built for personal use, but architected so the frontend logic is portable to web/mobile if it becomes a product.

**Scheduling model: Path B (template-driven).** Most days have the same shape. The template is the scaffold; each day gets an auto-copy at the day boundary. One-off changes are made to today's instance. See ARCHITECTURE.md § "Scheduling Model" for details and the Path A compatibility notes.

---

## 1. Core Invariants

Settled decisions. Do not change without explicit discussion.

- **Tauri v2** is the desktop framework. Rust layer stays thin — OS integration only.
- **Svelte** is the frontend framework. All business logic lives here, not in Rust.
- **SQLite** is the data store, accessed through a single data access module (`db.js`).
- **Blocks are editable until graded**, then frozen forever. The grade seals the record. Enforced at DB level.
- **Schedule templates** are separate from daily instances. The template is a scaffold; each day gets a copy.
- **The day is the atomic unit.** Every feature hangs off a single day's schedule.
- **Sleep is the day boundary.** The Sleep block (`type: "sleep"`) spans midnight. Its end time defines when the new day begins. One per template, always present, not deletable.
- **`db.js` is the only file that touches SQLite.** No other module imports `@tauri-apps/plugin-sql`.

### Known Gaps (Remaining)

- **Transition detection** — engine.svelte.js computes block states but doesn't yet detect the *moment* a state changes (needed for notifications).
- **Notification toggles** in Settings are unwired (component-local state, not persisted).
- **Report generation and day finalization** still live in `db.js` (business logic, not data access). Works fine, just misplaced.

---

## 2. Architecture

Full system architecture lives in `Documentation/Active/ARCHITECTURE.md`.
**Read it before modifying any file in `src-tauri/`, `db.js`, `scheduleStore.svelte.js`, or `schedule.js`.**

Key things an agent should know:
- The architecture doc is honest about what's built vs. what's missing. Check the "Known Structural Gaps" and "What's Not Built Yet" sections before assuming something exists.
- Block state (active/past/completed/graded) is currently re-derived per component, not centralized. If adding a feature that needs block state, don't add another independent computation — this is a known problem to solve.
- The "Tomorrow" modal edits the template (all future days), not a specific future day. This is intentional (Path B model).

---

## 3. Documentation

After completing a thread/chunk of work:
1. Update living docs inline — `documentation/active/ARCHITECTURE.md`. Add `_Last verified against codebase: DATE_` to the footer of any living doc you verify or update.
2. Create a snapshot doc — `documentation/snapshots/DATE_descriptive_name.md` (e.g., `3_07_26_audit_high_resolution.md`). Name describes what was accomplished, date comes first for chronological sorting.
3. Suggest a concrete next step — one sentence describing the single most obvious starting point for the next session. Write it as the last line of the snapshot doc under a `## Next` heading.

---

## 4. Single Sources of Truth

| Topic | Location |
|-------|----------|
| System architecture | `Documentation/Active/ARCHITECTURE.md` |
| Future ideas / parking lot | `Documentation/Reference/FUTURE_IDEAS.md` |

Documentation structure:
- `documentation/active/` — Current sources of truth. Small set of living docs. **Cap: ~5 files.** When work completes, move to `reference/` in the same session.
- `documentation/snapshots/` — Point-in-time session records. Named `DATE_descriptive_name.md`.
- `documentation/reference/` — Stable reference docs (specs, plans, data models). Not driving decisions.
- `documentation/archive/` — Superseded or stale. Historical record only.

New doc test: *would updating an existing doc destroy information worth preserving?* If yes, create a snapshot. If no, update in place.

---