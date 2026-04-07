// ─── Time Helpers ──────────────────────────────────────────────
// Pure utility functions. No data, no state. Import from anywhere.

/** Convert "HH:MM" string to minutes since midnight */
export function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

/** Convert minutes since midnight to display string like "9:00am" */
export function minutesToDisplay(mins) {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  const ampm = h >= 12 ? 'pm' : 'am';
  const display = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${display}:${String(m).padStart(2, '0')}${ampm}`;
}

/** Format a duration in minutes to "Xh Ym" */
export function formatDuration(mins) {
  if (mins >= 60) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${mins}m`;
}

/** Format a countdown in minutes to compact string */
export function formatCountdown(mins) {
  if (mins <= 0) return "now";
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/** Get current time as minutes since midnight */
export function getNowMinutes() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

/** Find the index of the currently active block */
export function getCurrentBlockIndex(blockList, nowMins) {
  for (let i = 0; i < blockList.length; i++) {
    const b = blockList[i];
    const s = timeToMinutes(b.start);
    let e = timeToMinutes(b.end);
    if (e <= s) e += 24 * 60; // crosses midnight
    let n = nowMins;
    if (n < s && e > 24 * 60) n += 24 * 60;
    if (n >= s && n < e) return i;
  }
  return -1; // not inside any block (in a gap)
}

/** Find the index of the next upcoming block (useful when in a gap) */
export function getNextBlockIndex(blockList, nowMins) {
  for (let i = 0; i < blockList.length; i++) {
    const s = timeToMinutes(blockList[i].start);
    if (s > nowMins) return i;
  }
  return -1; // no upcoming blocks
}

/** Get the duration of a block in minutes */
export function getBlockDuration(block) {
  const s = timeToMinutes(block.start);
  let e = timeToMinutes(block.end);
  if (e <= s) e += 24 * 60;
  return e - s;
}

/** Get progress percentage through a block (0-100) */
export function getBlockProgress(block, nowMins) {
  const s = timeToMinutes(block.start);
  let e = timeToMinutes(block.end);
  if (e <= s) e += 24 * 60;
  let n = nowMins;
  if (n < s && e > 24 * 60) n += 24 * 60;
  const elapsed = n - s;
  const duration = e - s;
  return Math.min(100, Math.max(0, (elapsed / duration) * 100));
}

/** Get minutes remaining in a block */
export function getMinutesLeft(block, nowMins) {
  let end = timeToMinutes(block.end);
  const start = timeToMinutes(block.start);
  if (end <= start) end += 24 * 60;
  let left = end - nowMins;
  if (left < 0) left += 24 * 60;
  return left;
}

/** Map block type to CSS color class name */
export function getBlockColor(type) {
  return type || 'work';
}

/** Map block type to hex color for inline styles */
export function getBlockHex(type) {
  const map = {
    work: '#e8a844',
    exercise: '#5cb87a',
    rest: '#6b8cba',
    novel: '#b87cc4',
    open: '#7a9e8a',
    admin: '#c4a87c',
  };
  return map[type] || '#e8a844';
}
