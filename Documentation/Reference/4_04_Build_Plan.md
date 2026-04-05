Context
Tempo currently has a hardcoded schedule baked into schedule.js. This means every user gets Warren's schedule — no customization, no persistence. Warren's mom wants to use the app with her own completely different schedule. To support this, we need

A database so schedules persist across app restarts
A template editor so users can define their own blocks
A first-launch onboarding flow so new users aren't staring at a blank screen

This also lays the groundwork for grading and daily reports (the next build after this).

Build Sequence (7 Phases)
Phase 1 Wire Up SQLite (RustConfig Plumbing)
Get the SQL plugin available to the frontend. No schema yet.
FileChangeappsrc-tauriCargo.tomlAdd tauri-plugin-sql = { version = 2, features = [sqlite] }appsrc-taurisrclib.rsAdd .plugin(tauri_plugin_sqlBuildernew().build()), remove dead greet commandappsrc-tauricapabilitiesdefault.jsonAdd sqldefault to permissionsapppackage.jsonAdd @tauri-appsplugin-sql ^2 to dependencies
Then npm install to pull the JS package.
Verify App compiles and launches.

Phase 2 Data Access Layer + Schema
Create the single module that owns all database queries.
New file appsrclibdb.js

initDatabase() — loads sqlitetempo.db, runs migrations, seeds default template if first launch
runMigrations() — CREATE TABLE IF NOT EXISTS for all 5 tables (schedule_templates, template_blocks, days, day_blocks, daily_reports)
seedDefaultTemplate() — if no templates exist, insert My Schedule template + the 9 blocks from the current hardcoded array
Query functions (all async, return plain JS objects)

hasAnyTemplates() → boolean
getActiveTemplate() → template object
getTemplateBlocks(templateId) → array shaped like current schedule items ({name, emoji, start, end, type, note, id})
createTemplate(name) → new template id
updateBlock(id, fields) — partial update
addBlock(templateId, block) — insert with auto sort_order
removeBlock(blockId) — delete



Key db.js maps DB column names (start_timeend_time) to the shape components already expect (startend). No other file touches SQL.
Verify After init, seeded data queryable from devtools.

Phase 3 Reactive Store
Replace the hardcoded const array with a Svelte 5 reactive store.
New file appsrclibscheduleStore.svelte.js (.svelte.js required for runes in plain JS)

blocks = $state([]) — the reactive schedule array
initialized = $state(false) — loading gate
isFirstLaunch = $state(false) — onboarding gate
loadSchedule() — async, reads from DB via db.js, populates blocks
saveBlock(), addBlock(), removeBlock() — write via db.js, then reload
completeOnboarding(templateId) — finishes onboarding, loads the new template

Modify appsrclibschedule.js

Refactor getCurrentBlockIndex(nowMins) → getCurrentBlockIndex(blocks, nowMins) (accept array as param)
Keep all other helper functions unchanged (they're pure)
Keep the hardcoded schedule array temporarily with a deprecation comment


Phase 4 Migrate Dashboard Components to Store
Switch all 3 components from hardcoded import to reactive store.
ComponentChangeHero.svelteImport blocks from store, helpers from schedule.js. Replace schedule[x] → blocks[x]. Guard for empty array.Timeline.svelteSame pattern. {#each schedule} → {#each blocks}Sidebar.svelteSame pattern. All schedule loops → blocks loops.BlockCard.svelteNo change — already uses props, never imported schedule.
Modify appsrcroutes+page.svelte

Import initDatabase from db.js, store values from scheduleStore
$effect on mount initDatabase().then(loadSchedule)
Conditional rendering loading → onboarding → dashboard
Add currentView state for dashboardsettings switching

Modify appsrclibcomponentsHeader.svelte

Add nav links Dashboard  Settings
Accept currentView prop and onNavigate callback
Move date display to accommodate nav

Verify App launches, loads from DB, dashboard looks identical to before.

Phase 5 Template Editor (Settings Screen)
New file appsrclibcomponentsTemplateEditor.svelte
The core editing component. Shared between Settings and Onboarding.

Lists all blocks as editable rows (name, emoji, type dropdown, startend time inputs, note)
Remove button per block
Add Block button at bottom (defaults name New Block, start = previous end, duration 1hr)
Save button persists to DB via store
Edits happen in local state (cloned array). Only Save writes to DB. Prevents partial-save corruption.

New file appsrclibcomponentsSettings.svelte
Wrapper page Settings header + TemplateEditor component.
Styling Dark theme inputs — var(--surface2) background, var(--border) borders, var(--amber) focus ring. Type dropdown uses the block color for the selected type.

Phase 6 First-Launch Onboarding
New file appsrclibcomponentsOnboarding.svelte
Multi-step wizard

Welcome — Welcome to Tempo. Let's set up your day.
Day boundaries — Wake time picker (default 0700), bed time picker (default 2300)
Meals — Optional. Lunch time + dinner time pickers (defaults 1230, 1800)
Review & Edit — Auto-generates starter blocks between bookends, shows TemplateEditor pre-populated
Save — Creates template in DB, calls completeOnboarding(), dashboard appears

Block generation logic wake→lunch = Morning Block (work), lunch = Lunch (open), lunch→dinner = Afternoon Block (work), dinner = Dinner (open), dinner→bed = Evening (open), bed→wake = Sleep (rest). If no meals, divides into 2-3hr blocks with a midday rest.

Phase 7 Wire Up Navigation
Trivial wiring phase. +page.svelte conditionally renders Dashboard or Settings based on currentView. Header nav triggers view switches.

New Files (5)
FilePurposeappsrclibdb.jsData access layer — all SQLappsrclibscheduleStore.svelte.jsReactive store — schedule stateappsrclibcomponentsTemplateEditor.svelteBlock editor (used by Settings + Onboarding)appsrclibcomponentsSettings.svelteSettings page wrapperappsrclibcomponentsOnboarding.svelteFirst-launch wizard
Modified Files (9)
FileChangeappsrc-tauriCargo.tomlAdd SQL plugin depappsrc-taurisrclib.rsRegister SQL plugin, remove greetappsrc-tauricapabilitiesdefault.jsonAdd sql permissionapppackage.jsonAdd SQL JS packageappsrclibschedule.jsRefactor getCurrentBlockIndex signatureappsrclibcomponentsHero.svelteUse storeappsrclibcomponentsTimeline.svelteUse storeappsrclibcomponentsSidebar.svelteUse storeappsrclibcomponentsHeader.svelteAdd navappsrcroutes+page.svelteInit, routing, onboarding gate
Unchanged Files
BlockCard.svelte, app.css, app.html, +layout.js, svelte.config.js, vite.config.js

Verification Plan
After each phase, launch the app with npm run tauri dev

Phase 1 — App compiles and opens (no visible change)
Phase 2 — Check devtools tempo.db exists with tables and seeded data
Phase 3+4 — Dashboard looks identical but data comes from SQLite
Phase 5 — Settings screen opens, blocks are editable, save persists, dashboard reflects changes
Phase 6 — Delete tempo.db, relaunch → onboarding flow appears, complete it → dashboard shows custom schedule
Phase 7 — Nav switches between dashboard and settings cleanly

Final test build installer (npm run tauri build), install on a clean path, verify first-launch onboarding works.

Edge Cases to Handle

Empty blocks array HeroTimelineSidebar must guard against blocks.length === 0 during loading and onboarding
Midnight-crossing blocks Block generation in onboarding must handle bed→wake wrapping midnight (existing helpers already support this)
Overlapping times in editor Validate that blocks don't overlap on save. If they do, flag the conflict visually but still allow save (user might be mid-edit)
SmartScreen warning When sending installer to mom, she'll need to click Run anyway (unsigned app). Not a code issue, just a heads-up.