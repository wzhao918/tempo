// ─── Reactive Schedule Store ───────────────────────────────────
// Wraps the schedule data in Svelte 5 reactive state.
// State lives in an object so properties can be mutated (Svelte 5
// doesn't allow re-exporting reassigned $state variables).

import { getActiveTemplate, getTemplateBlocks, hasAnyTemplates, updateBlock as dbUpdateBlock, addBlock as dbAddBlock, removeBlock as dbRemoveBlock } from './db.js';

// ─── Reactive State (single object, mutate properties) ─────────
export const store = $state({
  blocks: [],
  activeTemplateId: null,
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
  store.blocks = await getTemplateBlocks(template.id);
  store.initialized = true;
  store.isFirstLaunch = false;
}

export async function saveBlock(blockId, fields) {
  await dbUpdateBlock(blockId, fields);
  if (store.activeTemplateId) {
    store.blocks = await getTemplateBlocks(store.activeTemplateId);
  }
}

export async function addBlock(block) {
  if (!store.activeTemplateId) return;
  await dbAddBlock(store.activeTemplateId, block);
  store.blocks = await getTemplateBlocks(store.activeTemplateId);
}

export async function removeBlock(blockId) {
  await dbRemoveBlock(blockId);
  if (store.activeTemplateId) {
    store.blocks = await getTemplateBlocks(store.activeTemplateId);
  }
}

export async function completeOnboarding(templateId) {
  store.activeTemplateId = templateId;
  store.blocks = await getTemplateBlocks(templateId);
  store.isFirstLaunch = false;
}
