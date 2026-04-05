// ─── Reactive Schedule Store ───────────────────────────────────
// Manages today's schedule (day_blocks) and grading state.
// On load: ensures today's day instance exists (copies from template if needed).

import {
  getActiveTemplate, getTemplateBlocks, hasAnyTemplates,
  updateBlock as dbUpdateBlock, addBlock as dbAddBlock, removeBlock as dbRemoveBlock,
  getTodayDate, getDay, createDayFromTemplate, getDayBlocks, gradeBlock as dbGradeBlock,
  finalizePreviousDay,
} from './db.js';

// ─── Reactive State ────────────────────────────────────────────
export const store = $state({
  blocks: [],            // today's day_blocks (with grade fields)
  activeTemplateId: null,
  todayDayId: null,      // the day record ID for today
  todayDate: null,       // "YYYY-MM-DD"
  initialized: false,
  isFirstLaunch: false,
});

// ─── Actions ───────────────────────────────────────────────────

export async function loadSchedule() {
  const hasTemplates = await hasAnyTemplates();

  if (!hasTemplates) {
    store.isFirstLaunch = true;
    store.initialized = true;
    return;
  }

  const template = await getActiveTemplate();
  if (!template) {
    store.isFirstLaunch = true;
    store.initialized = true;
    return;
  }

  store.activeTemplateId = template.id;

  // Get template blocks to determine day boundary
  const templateBlocks = await getTemplateBlocks(template.id);
  const todayDate = getTodayDate(templateBlocks);
  store.todayDate = todayDate;

  // Check if today's day instance exists
  let day = await getDay(todayDate);

  if (!day) {
    // Finalize the previous day (generate report) before creating new day
    const yesterday = new Date(todayDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDate = yesterday.toISOString().split('T')[0];
    await finalizePreviousDay(yesterdayDate);

    // Create today from template
    const dayId = await createDayFromTemplate(todayDate, template.id);
    day = { id: dayId };
  }

  store.todayDayId = day.id;
  store.blocks = await getDayBlocks(day.id);
  store.initialized = true;
  store.isFirstLaunch = false;
}

/** Grade a completed block */
export async function gradeBlock(blockId, grade, gradeNote) {
  await dbGradeBlock(blockId, grade, gradeNote);
  if (store.todayDayId) {
    store.blocks = await getDayBlocks(store.todayDayId);
  }
}

// ─── Template Editing Actions (Settings screen) ────────────────

export async function saveBlock(blockId, fields) {
  await dbUpdateBlock(blockId, fields);
  if (store.activeTemplateId) {
    // Reload template blocks for settings view
    // (day blocks are separate — template edits don't affect today)
  }
}

export async function addBlock(block) {
  if (!store.activeTemplateId) return;
  await dbAddBlock(store.activeTemplateId, block);
}

export async function removeBlock(blockId) {
  await dbRemoveBlock(blockId);
}

export async function completeOnboarding(templateId) {
  store.activeTemplateId = templateId;
  store.isFirstLaunch = false;
  // Load schedule will create the day instance
  await loadSchedule();
}
