// ─── Engine ────────────────────────────────────────────────────
// The business logic layer. Owns the centralized tick, day boundary,
// block state computation, and day rollover detection.
//
// Components subscribe to this module's reactive state instead of
// running their own timers or computing block state independently.
//
// This module has NO imports from Svelte component code.
// It imports from schedule.js (pure utils) and db.js (data access).

import { getCurrentBlockIndex, getNextBlockIndex, timeToMinutes } from './schedule.js';
import { getTodayDate } from './db.js';

// ─── Reactive Time State ──────────────────────────────────────
// Single source of truth for "what time is it?"
// All components read from here instead of creating their own Date().

export const tick = $state({
  now: new Date(),
  nowMins: 0,        // minutes since midnight (derived on each tick)
  hours: '00',
  minutes: '00',
  seconds: '00',
  hour: 0,           // fractional hour for SkyGradient (e.g., 7.5 = 7:30am)
});

// Initialize derived values
function updateTick() {
  const now = new Date();
  tick.now = now;
  tick.nowMins = now.getHours() * 60 + now.getMinutes();
  tick.hours = String(now.getHours()).padStart(2, '0');
  tick.minutes = String(now.getMinutes()).padStart(2, '0');
  tick.seconds = String(now.getSeconds()).padStart(2, '0');
  tick.hour = now.getHours() + now.getMinutes() / 60;
}

// ─── Block State ──────────────────────────────────────────────
// Computed once per tick from the store's blocks.
// Components read these instead of deriving state independently.

export const blockState = $state({
  currentIdx: -1,    // index of the currently active block (-1 = in a gap)
  nextIdx: -1,       // index of the next upcoming block
  states: [],        // per-block state: 'upcoming' | 'active' | 'completed' | 'graded'
});

/**
 * Recompute block states from a list of day_blocks and the current time.
 * Called by the tick loop and whenever blocks change.
 */
export function computeBlockStates(blocks) {
  if (!blocks || blocks.length === 0) {
    blockState.currentIdx = -1;
    blockState.nextIdx = -1;
    blockState.states = [];
    return;
  }

  const nowMins = tick.nowMins;
  const currentIdx = getCurrentBlockIndex(blocks, nowMins);
  blockState.currentIdx = currentIdx;

  // Next block: if we're in a block, next is currentIdx+1. If in a gap, find upcoming.
  if (currentIdx >= 0) {
    const n = currentIdx + 1;
    blockState.nextIdx = n < blocks.length ? n : -1;
  } else {
    blockState.nextIdx = getNextBlockIndex(blocks, nowMins);
  }

  // Compute per-block state
  blockState.states = blocks.map((block, i) => {
    // Graded overrides everything
    if (block.grade !== null && block.grade !== undefined) return 'graded';

    // Active = currently in this block
    if (i === currentIdx) return 'active';

    // Completed = end time has passed (and not graded)
    const startMins = timeToMinutes(block.start);
    let endMins = timeToMinutes(block.end);
    const crossesMidnight = endMins <= startMins;

    if (!crossesMidnight && endMins <= nowMins) return 'completed';

    // Everything else is upcoming
    return 'upcoming';
  });
}

// ─── Day Rollover Detection ──────────────────────────────────
// Checks if the day boundary has passed since we last loaded.
// If so, calls the provided reload callback.

let currentDayDate = null;         // the date string we're currently showing
let rolloverCallback = null;       // function to call when day rolls over
let templateBlocksRef = null;      // reference to template blocks for boundary calc

/**
 * Initialize the engine with the current day and a reload callback.
 * Called once during app startup after loadSchedule() completes.
 */
export function initEngine(todayDate, templateBlocks, onRollover) {
  currentDayDate = todayDate;
  templateBlocksRef = templateBlocks;
  rolloverCallback = onRollover;
}

/**
 * Update the template blocks reference (e.g., after template edits).
 */
export function updateTemplateRef(templateBlocks) {
  templateBlocksRef = templateBlocks;
}

function checkDayRollover() {
  if (!templateBlocksRef || !rolloverCallback) return;

  const computedDate = getTodayDate(templateBlocksRef);
  if (computedDate !== currentDayDate) {
    currentDayDate = computedDate;
    rolloverCallback(computedDate);
  }
}

// ─── Tick Loop ────────────────────────────────────────────────
// Single 1-second interval that drives everything.
// Components no longer need their own setInterval.

let tickInterval = null;
let blocksRef = null;    // reference to current blocks for state computation

/**
 * Start the engine tick. Call once on app mount.
 * @param {Function} getBlocks - function that returns current blocks array
 */
export function startTick(getBlocks) {
  blocksRef = getBlocks;

  // Initial computation
  updateTick();
  if (blocksRef) computeBlockStates(blocksRef());

  tickInterval = setInterval(() => {
    updateTick();
    if (blocksRef) computeBlockStates(blocksRef());
    checkDayRollover();
  }, 1000);
}

/**
 * Stop the engine tick. Call on app unmount.
 */
export function stopTick() {
  if (tickInterval) {
    clearInterval(tickInterval);
    tickInterval = null;
  }
}
