// ─── Data Access Layer ─────────────────────────────────────────
// Single module for all database operations. No other file imports
// from @tauri-apps/plugin-sql directly.

import Database from '@tauri-apps/plugin-sql';

let db = null;

// ─── Default schedule (used to seed first template) ────────────
const DEFAULT_BLOCKS = [
  { name: "Deep Work",         emoji: "⚡", start: "06:30", end: "09:00", type: "work",     note: "Build / Code / Claude Code" },
  { name: "Exercise",          emoji: "🚴", start: "09:00", end: "10:00", type: "exercise", note: "Jog or bike ride + shower" },
  { name: "Second Work Block", emoji: "🔧", start: "10:00", end: "12:30", type: "work",     note: "Build / Design / Strategy" },
  { name: "Lunch",             emoji: "🍜", start: "12:30", end: "13:00", type: "open",     note: "Step away from the screen" },
  { name: "Rest & Recharge",   emoji: "🌙", start: "13:00", end: "15:00", type: "rest",     note: "Nap / Free time / Consume" },
  { name: "Busy Work & Admin", emoji: "📋", start: "15:00", end: "17:30", type: "admin",    note: "Email / Docs / Small tasks" },
  { name: "Open Time",         emoji: "🌅", start: "17:30", end: "21:00", type: "open",     note: "Dinner / Decompress / Social" },
  { name: "Novel",             emoji: "✍️",  start: "21:00", end: "23:00", type: "novel",    note: "Tokyo Syndrome" },
  { name: "Wind Down",         emoji: "🌙", start: "23:00", end: "06:30", type: "rest",     note: "Rest. You earned it." },
];

// ─── Initialization ────────────────────────────────────────────

export async function initDatabase() {
  db = await Database.load('sqlite:tempo.db');
  await runMigrations();
}

async function runMigrations() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS schedule_templates (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL,
      created_at  TEXT DEFAULT (datetime('now')),
      updated_at  TEXT DEFAULT (datetime('now'))
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS template_blocks (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      template_id INTEGER NOT NULL REFERENCES schedule_templates(id),
      sort_order  INTEGER NOT NULL,
      name        TEXT NOT NULL,
      emoji       TEXT DEFAULT '',
      type        TEXT DEFAULT 'work',
      start_time  TEXT NOT NULL,
      end_time    TEXT NOT NULL,
      note        TEXT DEFAULT ''
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS days (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      date        TEXT UNIQUE NOT NULL,
      template_id INTEGER REFERENCES schedule_templates(id),
      created_at  TEXT DEFAULT (datetime('now'))
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS day_blocks (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      day_id      INTEGER NOT NULL REFERENCES days(id),
      sort_order  INTEGER NOT NULL,
      name        TEXT NOT NULL,
      emoji       TEXT DEFAULT '',
      type        TEXT DEFAULT 'work',
      start_time  TEXT NOT NULL,
      end_time    TEXT NOT NULL,
      note        TEXT DEFAULT '',
      grade       INTEGER,
      grade_note  TEXT,
      graded_at   TEXT
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS daily_reports (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      day_id       INTEGER NOT NULL REFERENCES days(id),
      generated_at TEXT DEFAULT (datetime('now')),
      summary      TEXT DEFAULT ''
    )
  `);
}

async function seedDefaultTemplate() {
  const hasTemplates = await hasAnyTemplates();
  if (hasTemplates) return;

  const templateId = await createTemplate('My Schedule');
  for (let i = 0; i < DEFAULT_BLOCKS.length; i++) {
    const b = DEFAULT_BLOCKS[i];
    await db.execute(
      `INSERT INTO template_blocks (template_id, sort_order, name, emoji, type, start_time, end_time, note)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [templateId, i, b.name, b.emoji, b.type, b.start, b.end, b.note]
    );
  }
}

// ─── Query Functions ───────────────────────────────────────────

export async function hasAnyTemplates() {
  const result = await db.select('SELECT COUNT(*) as count FROM schedule_templates');
  return result[0].count > 0;
}

export async function getActiveTemplate() {
  const results = await db.select('SELECT id, name FROM schedule_templates ORDER BY id LIMIT 1');
  return results[0] || null;
}

export async function getTemplateBlocks(templateId) {
  const rows = await db.select(
    'SELECT id, sort_order, name, emoji, type, start_time, end_time, note FROM template_blocks WHERE template_id = $1 ORDER BY sort_order',
    [templateId]
  );
  // Map DB columns to the shape components expect
  return rows.map(row => ({
    id: row.id,
    sort_order: row.sort_order,
    name: row.name,
    emoji: row.emoji,
    type: row.type,
    start: row.start_time,
    end: row.end_time,
    note: row.note,
  }));
}

export async function createTemplate(name) {
  const result = await db.execute(
    'INSERT INTO schedule_templates (name) VALUES ($1)',
    [name]
  );
  return result.lastInsertId;
}

export async function updateBlock(blockId, fields) {
  const allowed = ['name', 'emoji', 'type', 'start_time', 'end_time', 'note'];
  // Map start/end back to DB column names
  if (fields.start !== undefined) { fields.start_time = fields.start; delete fields.start; }
  if (fields.end !== undefined) { fields.end_time = fields.end; delete fields.end; }

  const sets = [];
  const values = [];
  let paramIdx = 1;

  for (const key of allowed) {
    if (fields[key] !== undefined) {
      sets.push(`${key} = $${paramIdx}`);
      values.push(fields[key]);
      paramIdx++;
    }
  }

  if (sets.length === 0) return;
  values.push(blockId);
  await db.execute(
    `UPDATE template_blocks SET ${sets.join(', ')} WHERE id = $${paramIdx}`,
    values
  );
}

export async function addBlock(templateId, block) {
  // Get next sort_order
  const result = await db.select(
    'SELECT COALESCE(MAX(sort_order), -1) + 1 as next_order FROM template_blocks WHERE template_id = $1',
    [templateId]
  );
  const sortOrder = result[0].next_order;

  const insertResult = await db.execute(
    `INSERT INTO template_blocks (template_id, sort_order, name, emoji, type, start_time, end_time, note)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [templateId, sortOrder, block.name, block.emoji || '', block.type || 'work', block.start, block.end, block.note || '']
  );
  return insertResult.lastInsertId;
}

export async function removeBlock(blockId) {
  await db.execute('DELETE FROM template_blocks WHERE id = $1', [blockId]);
}

/** Update sort_order for template blocks based on array position */
export async function updateSortOrders(blockIds) {
  for (let i = 0; i < blockIds.length; i++) {
    await db.execute(
      'UPDATE template_blocks SET sort_order = $1 WHERE id = $2',
      [i, blockIds[i]]
    );
  }
}

export async function addBlocksToTemplate(templateId, blocks) {
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    await db.execute(
      `INSERT INTO template_blocks (template_id, sort_order, name, emoji, type, start_time, end_time, note)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [templateId, i, b.name, b.emoji || '', b.type || 'work', b.start, b.end, b.note || '']
    );
  }
}

// ─── Day Instance Functions ────────────────────────────────────

/** Get the date string for "today" based on the day boundary (first block's start time) */
export function getTodayDate(templateBlocks) {
  if (!templateBlocks || templateBlocks.length === 0) {
    return new Date().toISOString().split('T')[0];
  }

  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();

  // Day boundary = first block's start time
  const firstStart = templateBlocks[0].start || templateBlocks[0].start_time;
  const [bh, bm] = firstStart.split(':').map(Number);
  const boundaryMins = bh * 60 + bm;

  // If current time is before the boundary, we're still in "yesterday's" day
  if (nowMins < boundaryMins) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  }

  return now.toISOString().split('T')[0];
}

/** Check if a day instance exists for the given date */
export async function getDay(date) {
  const results = await db.select('SELECT * FROM days WHERE date = $1', [date]);
  return results[0] || null;
}

/** Create a day instance by copying blocks from the active template */
export async function createDayFromTemplate(date, templateId) {
  // Create the day record
  const dayResult = await db.execute(
    'INSERT INTO days (date, template_id) VALUES ($1, $2)',
    [date, templateId]
  );
  const dayId = dayResult.lastInsertId;

  // Copy template blocks into day_blocks
  const templateBlocks = await db.select(
    'SELECT sort_order, name, emoji, type, start_time, end_time, note FROM template_blocks WHERE template_id = $1 ORDER BY sort_order',
    [templateId]
  );

  for (const b of templateBlocks) {
    await db.execute(
      `INSERT INTO day_blocks (day_id, sort_order, name, emoji, type, start_time, end_time, note)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [dayId, b.sort_order, b.name, b.emoji, b.type, b.start_time, b.end_time, b.note]
    );
  }

  return dayId;
}

/** Get all blocks for a day, mapped to component shape */
export async function getDayBlocks(dayId) {
  const rows = await db.select(
    'SELECT id, sort_order, name, emoji, type, start_time, end_time, note, grade, grade_note, graded_at FROM day_blocks WHERE day_id = $1 ORDER BY sort_order',
    [dayId]
  );
  return rows.map(row => ({
    id: row.id,
    sort_order: row.sort_order,
    name: row.name,
    emoji: row.emoji,
    type: row.type,
    start: row.start_time,
    end: row.end_time,
    note: row.note,
    grade: row.grade,
    gradeNote: row.grade_note,
    gradedAt: row.graded_at,
  }));
}

/** Grade a day block (seals it permanently) */
export async function gradeBlock(blockId, grade, gradeNote) {
  await db.execute(
    `UPDATE day_blocks SET grade = $1, grade_note = $2, graded_at = datetime('now') WHERE id = $3`,
    [grade, gradeNote || '', blockId]
  );
}

// ─── Daily Report Functions ────────────────────────────────────

/** Generate a daily report for a given day */
export async function generateDailyReport(dayId) {
  // Check if report already exists
  const existing = await db.select('SELECT id FROM daily_reports WHERE day_id = $1', [dayId]);
  if (existing.length > 0) return existing[0].id;

  const blocks = await getDayBlocks(dayId);
  const day = await db.select('SELECT date FROM days WHERE id = $1', [dayId]);
  const date = day[0]?.date || 'Unknown';

  // Calculate summary stats
  const totalBlocks = blocks.filter(b => b.type !== 'rest').length;
  const gradedBlocks = blocks.filter(b => b.grade !== null && b.grade !== undefined);
  const ungradedBlocks = totalBlocks - gradedBlocks.length;
  const avgGrade = gradedBlocks.length > 0
    ? (gradedBlocks.reduce((sum, b) => sum + b.grade, 0) / gradedBlocks.length).toFixed(1)
    : null;

  // Hours by type
  const hoursByType = {};
  for (const b of blocks) {
    const [sh, sm] = b.start.split(':').map(Number);
    const [eh, em] = b.end.split(':').map(Number);
    let startMins = sh * 60 + sm;
    let endMins = eh * 60 + em;
    if (endMins <= startMins) endMins += 24 * 60;
    const hours = (endMins - startMins) / 60;
    hoursByType[b.type] = (hoursByType[b.type] || 0) + hours;
  }

  const summary = JSON.stringify({
    date,
    totalBlocks,
    gradedCount: gradedBlocks.length,
    ungradedCount: ungradedBlocks,
    averageGrade: avgGrade,
    hoursByType,
    blocks: blocks.map(b => ({
      name: b.name,
      type: b.type,
      grade: b.grade,
      gradeNote: b.gradeNote,
    })),
  });

  const result = await db.execute(
    'INSERT INTO daily_reports (day_id, summary) VALUES ($1, $2)',
    [dayId, summary]
  );
  return result.lastInsertId;
}

/** Finalize a previous day: generate its report if it has any grades */
export async function finalizePreviousDay(previousDate) {
  const day = await getDay(previousDate);
  if (!day) return;

  const blocks = await getDayBlocks(day.id);
  const hasAnyGrades = blocks.some(b => b.grade !== null && b.grade !== undefined);

  // Generate report if there are any grades (or even if not — ungraded is signal)
  if (blocks.length > 0) {
    await generateDailyReport(day.id);
  }
}

/** Wipe all data — used by "Reset to Onboarding" */
export async function clearAllData() {
  await db.execute('DELETE FROM daily_reports');
  await db.execute('DELETE FROM day_blocks');
  await db.execute('DELETE FROM days');
  await db.execute('DELETE FROM template_blocks');
  await db.execute('DELETE FROM schedule_templates');
}
