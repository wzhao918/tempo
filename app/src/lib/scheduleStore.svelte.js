// ─── Reactive Schedule Store ───────────────────────────────────
// Manages today's schedule (day_blocks) and grading state.
// On load: ensures today's day instance exists (copies from template if needed).

import {
  getActiveTemplate, getTemplateBlocks, hasAnyTemplates,
  updateBlock as dbUpdateBlock, addBlock as dbAddBlock, removeBlock as dbRemoveBlock,
  updateSortOrders,
  getTodayDate, getDay, createDayFromTemplate, getDayBlocks, gradeBlock as dbGradeBlock,
  finalizePreviousDay, clearAllData,
} from './db.js';

// ─── Reactive State ────────────────────────────────────────────
export const store = $state({
  blocks: [],            // today's day_blocks (with grade fields)
  templateBlocks: [],    // template_blocks for settings editor
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

/** Load template blocks into store for the settings editor */
export async function loadTemplateBlocks() {
  if (!store.activeTemplateId) return;
  store.templateBlocks = await getTemplateBlocks(store.activeTemplateId);
}

/** Save all template edits: removals, updates, inserts, and sort order */
export async function saveTemplateEdits(editedBlocks, removedIds) {
  if (!store.activeTemplateId) return;

  // Remove deleted blocks
  for (const id of removedIds) {
    await dbRemoveBlock(id);
  }

  // Update existing and add new blocks
  for (let i = 0; i < editedBlocks.length; i++) {
    const block = editedBlocks[i];
    if (block.isNew) {
      const newId = await dbAddBlock(store.activeTemplateId, {
        name: block.name,
        emoji: block.emoji || '',
        type: block.type,
        start: block.start,
        end: block.end,
        note: block.note,
      });
      editedBlocks[i] = { ...block, id: newId, isNew: false };
    } else if (block.id) {
      await dbUpdateBlock(block.id, {
        name: block.name,
        emoji: block.emoji || '',
        type: block.type,
        start: block.start,
        end: block.end,
        note: block.note,
      });
    }
  }

  // Update sort_order for all blocks based on their array position
  const ids = editedBlocks.map(b => b.id).filter(Boolean);
  await updateSortOrders(ids);

  // Reload template blocks from DB so store is in sync
  store.templateBlocks = await getTemplateBlocks(store.activeTemplateId);
}

export async function completeOnboarding(templateId) {
  store.activeTemplateId = templateId;
  store.isFirstLaunch = false;
  // Load schedule will create the day instance
  await loadSchedule();
}

/** Wipe everything and return to onboarding */
export async function resetToOnboarding() {
  await clearAllData();
  store.blocks = [];
  store.templateBlocks = [];
  store.activeTemplateId = null;
  store.todayDayId = null;
  store.todayDate = null;
  store.isFirstLaunch = true;
}
