<script>
  import { getBlockColor, getBlockHex } from '$lib/schedule.js';

  let { initialBlocks = [], onSave = async () => {}, saveLabel = 'Save Changes' } = $props();

  // Block type options
  const BLOCK_TYPES = [
    { value: 'work',     label: 'Work / Focus',  emoji: '⚡' },
    { value: 'exercise', label: 'Active',         emoji: '🚴' },
    { value: 'rest',     label: 'Rest',           emoji: '🌙' },
    { value: 'open',     label: 'Open',           emoji: '🌅' },
    { value: 'admin',    label: 'Admin',          emoji: '📋' },
    { value: 'novel',    label: 'Creative',       emoji: '✍️' },
  ];

  // ─── Local editing state ─────────────────────────────────────
  let editingBlocks = $state([]);
  let removedIds = $state([]);
  let saving = $state(false);
  let hasChanges = $state(false);

  // ─── Drag state ──────────────────────────────────────────────
  let dragIndex = $state(null);       // index of block being dragged
  let dragOverIndex = $state(null);   // index of the drop target gap
  let isDragging = $state(false);

  // ─── New block staging ───────────────────────────────────────
  let showNewBlockForm = $state(false);
  let newBlock = $state({ name: '', type: 'work', startTime: '09:00', duration: 60, note: '' });

  // Initialize editing state from props (re-sync when initialBlocks changes)
  let lastInitKey = $state('');
  $effect(() => {
    const key = initialBlocks.map(b => b.id || b.name).join(',');
    if (initialBlocks.length > 0 && key !== lastInitKey) {
      lastInitKey = key;
      editingBlocks = initialBlocks.map(b => ({ ...b, isNew: false }));
      hasChanges = false;
      removedIds = [];
    }
  });

  // Also allow external reset (e.g., onboarding generating blocks)
  export function setBlocks(newBlocks) {
    editingBlocks = newBlocks.map(b => ({ ...b, isNew: !b.id }));
    hasChanges = true;
  }

  // ─── Time helpers ────────────────────────────────────────────
  function addMinutes(timeStr, mins) {
    const [h, m] = timeStr.split(':').map(Number);
    const total = (h * 60 + m + mins) % (24 * 60);
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  }

  function getMinutesBetween(start, end) {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    let startMins = sh * 60 + sm;
    let endMins = eh * 60 + em;
    if (endMins <= startMins) endMins += 24 * 60; // crosses midnight
    return endMins - startMins;
  }

  function formatDuration(mins) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  }

  // ─── Field editing ───────────────────────────────────────────
  function updateField(index, field, value) {
    editingBlocks[index] = { ...editingBlocks[index], [field]: value };
    hasChanges = true;
  }

  // ─── Staged new block ───────────────────────────────────────
  function openNewBlockForm() {
    // Default start time: end of the last block, or 09:00
    let defaultStart = '09:00';
    if (editingBlocks.length > 0) {
      const lastBlock = editingBlocks[editingBlocks.length - 1];
      // If last block is sleep/rest crossing midnight, don't use its end
      if (lastBlock.type !== 'rest' || lastBlock.end > lastBlock.start) {
        defaultStart = lastBlock.end;
      }
    }
    newBlock = { name: '', type: 'work', startTime: defaultStart, duration: 60, note: '' };
    showNewBlockForm = true;
  }

  function cancelNewBlock() {
    showNewBlockForm = false;
  }

  function confirmNewBlock() {
    if (!newBlock.name.trim()) return;

    const endTime = addMinutes(newBlock.startTime, newBlock.duration);

    const created = {
      name: newBlock.name,
      emoji: '',
      type: newBlock.type,
      start: newBlock.startTime,
      end: endTime,
      note: newBlock.note,
      isNew: true,
    };

    editingBlocks = [...editingBlocks, created];
    hasChanges = true;
    showNewBlockForm = false;
  }

  // ─── Remove block ────────────────────────────────────────────
  function removeBlockAt(index) {
    const block = editingBlocks[index];
    if (block.id) {
      removedIds = [...removedIds, block.id];
    }
    editingBlocks = editingBlocks.filter((_, i) => i !== index);
    hasChanges = true;
  }

  // ─── Drag-to-reorder ────────────────────────────────────────
  function onDragStart(e, index) {
    e.preventDefault();
    dragIndex = index;
    isDragging = true;

    window.addEventListener('mousemove', onDragMove);
    window.addEventListener('mouseup', onDragEnd);
  }

  function onDragMove(e) {
    if (!isDragging) return;

    const container = document.querySelector('.block-list');
    if (!container) return;

    const rows = container.querySelectorAll('.block-row');
    let newOverIndex = null;

    for (let i = 0; i < rows.length; i++) {
      if (i === dragIndex) continue;
      const rect = rows[i].getBoundingClientRect();
      const midY = rect.top + rect.height / 2;

      if (e.clientY < midY) {
        newOverIndex = i;
        break;
      }
    }

    if (newOverIndex === null) {
      newOverIndex = editingBlocks.length;
    }

    dragOverIndex = newOverIndex;
  }

  function onDragEnd() {
    window.removeEventListener('mousemove', onDragMove);
    window.removeEventListener('mouseup', onDragEnd);

    if (dragIndex !== null && dragOverIndex !== null && dragOverIndex !== dragIndex) {
      const moved = editingBlocks[dragIndex];
      let newBlocks = editingBlocks.filter((_, i) => i !== dragIndex);

      let insertAt = dragOverIndex;
      if (dragOverIndex > dragIndex) {
        insertAt = dragOverIndex - 1;
      }

      newBlocks = [
        ...newBlocks.slice(0, insertAt),
        moved,
        ...newBlocks.slice(insertAt),
      ];

      editingBlocks = newBlocks;
      hasChanges = true;
    }

    dragIndex = null;
    dragOverIndex = null;
    isDragging = false;
  }

  // ─── Save ────────────────────────────────────────────────────
  async function handleSave() {
    saving = true;
    try {
      await onSave(editingBlocks, removedIds);
      removedIds = [];
      hasChanges = false;
      editingBlocks = editingBlocks.map(b => ({ ...b, isNew: false }));
    } finally {
      saving = false;
    }
  }
</script>

<div class="editor">
  <div class="block-list">
    {#each editingBlocks as block, i}
      <div
        class="block-row"
        class:dragging={dragIndex === i}
        class:drag-above={dragOverIndex === i && dragIndex !== null && dragIndex !== i}
        class:drag-below={dragOverIndex === editingBlocks.length && i === editingBlocks.length - 1 && dragIndex !== null && dragIndex !== i}
        style="border-left: 3px solid {getBlockHex(block.type)}"
      >
        <div class="block-row-header">
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div
            class="drag-handle"
            onmousedown={(e) => onDragStart(e, i)}
            title="Drag to reorder"
          >
            <span class="drag-dots">⠿</span>
            <span class="block-row-number">{i + 1}</span>
          </div>

          <div class="block-time-badge">
            {block.start} – {block.end}
            <span class="block-duration-badge">{formatDuration(getMinutesBetween(block.start, block.end))}</span>
          </div>

          <button class="remove-btn" onclick={() => removeBlockAt(i)} title="Remove block">x</button>
        </div>

        <div class="field-grid">
          <div class="field field-name">
            <label>Name</label>
            <input
              type="text"
              value={block.name}
              oninput={(e) => updateField(i, 'name', e.target.value)}
            />
          </div>

          <div class="field">
            <label>Type</label>
            <select
              value={block.type}
              onchange={(e) => updateField(i, 'type', e.target.value)}
              class="color-{getBlockColor(block.type)}"
            >
              {#each BLOCK_TYPES as t}
                <option value={t.value}>{t.emoji} {t.label}</option>
              {/each}
            </select>
          </div>

          <div class="field field-small">
            <label>Start</label>
            <input
              type="time"
              value={block.start}
              oninput={(e) => updateField(i, 'start', e.target.value)}
            />
          </div>

          <div class="field field-small">
            <label>End</label>
            <input
              type="time"
              value={block.end}
              oninput={(e) => updateField(i, 'end', e.target.value)}
            />
          </div>

          <div class="field field-wide">
            <label>Note</label>
            <input
              type="text"
              value={block.note}
              oninput={(e) => updateField(i, 'note', e.target.value)}
              placeholder="What's this block for?"
            />
          </div>
        </div>
      </div>
    {/each}
  </div>

  {#if showNewBlockForm}
    <div class="new-block-stage">
      <div class="stage-header">New Block</div>
      <div class="stage-grid">
        <div class="field field-name">
          <label>Name</label>
          <input type="text" bind:value={newBlock.name} placeholder="Block name" />
        </div>
        <div class="field">
          <label>Type</label>
          <select bind:value={newBlock.type}>
            {#each BLOCK_TYPES as t}
              <option value={t.value}>{t.emoji} {t.label}</option>
            {/each}
          </select>
        </div>
        <div class="field field-small">
          <label>Start</label>
          <input type="time" bind:value={newBlock.startTime} />
        </div>
        <div class="field field-small">
          <label>Duration</label>
          <select bind:value={newBlock.duration}>
            <option value={15}>15m</option>
            <option value={30}>30m</option>
            <option value={45}>45m</option>
            <option value={60}>1h</option>
            <option value={90}>1.5h</option>
            <option value={120}>2h</option>
            <option value={180}>3h</option>
          </select>
        </div>
        <div class="field field-wide">
          <label>Note</label>
          <input type="text" bind:value={newBlock.note} placeholder="What's this block for?" />
        </div>
      </div>
      <div class="stage-actions">
        <button class="grade-cancel" onclick={cancelNewBlock}>Cancel</button>
        <button class="stage-confirm" onclick={confirmNewBlock} disabled={!newBlock.name.trim()}>Add to Schedule</button>
      </div>
    </div>
  {:else}
    <div class="editor-actions">
      <button class="add-btn" onclick={openNewBlockForm}>+ Add Block</button>
      <button
        class="save-btn"
        onclick={handleSave}
        disabled={saving || !hasChanges}
      >
        {saving ? 'Saving...' : saveLabel}
      </button>
    </div>
  {/if}
</div>

<style>
  .editor {
    max-width: 720px;
  }

  .block-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .block-row {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 16px 18px;
    transition: transform 0.3s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.3s ease, opacity 0.3s ease;
    position: relative;
  }

  /* Drag feedback */
  .block-row.dragging {
    opacity: 0.4;
    transform: scale(0.96);
    box-shadow: 0 0 0 1px var(--amber-dim);
  }

  .block-row.drag-above::before {
    content: '';
    position: absolute;
    top: -8px;
    left: -4px;
    right: -4px;
    height: 4px;
    background: var(--amber);
    border-radius: 4px;
    box-shadow: 0 0 12px var(--amber), 0 0 4px var(--amber);
  }

  .block-row.drag-below::after {
    content: '';
    position: absolute;
    bottom: -8px;
    left: -4px;
    right: -4px;
    height: 4px;
    background: var(--amber);
    border-radius: 4px;
    box-shadow: 0 0 12px var(--amber), 0 0 4px var(--amber);
  }

  .block-row-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  /* ─── Drag handle ─────────────────────────────────────────── */
  .drag-handle {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: grab;
    padding: 4px 8px;
    border-radius: 6px;
    transition: background 0.15s, box-shadow 0.15s;
    user-select: none;
  }

  .drag-handle:hover {
    background: var(--surface2);
    box-shadow: 0 0 0 1px var(--border);
  }

  .drag-handle:active {
    cursor: grabbing;
    background: var(--amber-glow);
  }

  .drag-dots {
    font-size: 18px;
    color: var(--text-dim);
    line-height: 1;
    letter-spacing: -1px;
    transition: color 0.15s;
  }

  .drag-handle:hover .drag-dots {
    color: var(--amber);
  }

  .block-row-number {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: var(--text-dim);
    background: var(--surface2);
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* ─── Time badge ──────────────────────────────────────────── */
  .block-time-badge {
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    color: var(--text-dim);
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .block-duration-badge {
    font-size: 10px;
    background: var(--surface2);
    padding: 2px 6px;
    border-radius: 4px;
    color: var(--text-mid);
  }

  .remove-btn {
    font-family: 'DM Mono', monospace;
    font-size: 14px;
    color: var(--text-dim);
    background: none;
    border: 1px solid transparent;
    border-radius: 4px;
    padding: 2px 8px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .remove-btn:hover {
    color: #e87a44;
    border-color: #e87a44;
    background: rgba(232, 122, 68, 0.1);
  }

  .field-grid {
    display: grid;
    grid-template-columns: 2fr 1fr auto auto;
    gap: 10px;
    align-items: end;
  }

  .field-wide {
    grid-column: 1 / -1;
  }

  .field label {
    display: block;
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-dim);
    margin-bottom: 4px;
  }

  .field input,
  .field select {
    width: 100%;
    padding: 8px 10px;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 6px;
    color: var(--text);
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s;
  }

  .field input:focus,
  .field select:focus {
    border-color: var(--amber);
  }

  .field select {
    cursor: pointer;
    appearance: none;
    padding-right: 24px;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%237a7870' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 8px center;
  }

  .field select option {
    background: var(--surface);
    color: var(--text);
  }

  .field-small {
    min-width: 80px;
  }

  .field-small input[type="time"] {
    font-family: 'DM Mono', monospace;
    font-size: 13px;
  }

  /* ─── New block staging area ──────────────────────────────── */
  .new-block-stage {
    margin-top: 20px;
    padding: 20px;
    border: 1px dashed var(--amber-dim);
    border-radius: 10px;
    background: var(--amber-glow);
  }

  .stage-header {
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--amber);
    margin-bottom: 16px;
  }

  .stage-grid {
    display: grid;
    grid-template-columns: 2fr 1fr auto auto;
    gap: 10px;
    align-items: end;
  }

  .stage-grid .field-wide {
    grid-column: 1 / -1;
  }

  .stage-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 14px;
  }

  .stage-confirm {
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 500;
    color: var(--bg);
    background: var(--amber);
    border: none;
    border-radius: 6px;
    padding: 8px 16px;
    cursor: pointer;
  }

  .stage-confirm:hover:not(:disabled) {
    filter: brightness(1.1);
  }

  .stage-confirm:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .grade-cancel {
    font-family: 'DM Sans', sans-serif;
    font-size: 12px;
    color: var(--text-dim);
    background: none;
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 6px 14px;
    cursor: pointer;
  }

  .grade-cancel:hover {
    color: var(--text-mid);
    border-color: var(--text-dim);
  }

  /* ─── Editor actions ──────────────────────────────────────── */
  .editor-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid var(--border);
  }

  .add-btn {
    font-family: 'DM Mono', monospace;
    font-size: 13px;
    color: var(--text-mid);
    background: var(--surface);
    border: 1px dashed var(--border);
    border-radius: 8px;
    padding: 10px 20px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .add-btn:hover {
    border-color: var(--amber-dim);
    color: var(--amber);
    background: var(--amber-glow);
  }

  .save-btn {
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 500;
    color: var(--bg);
    background: var(--amber);
    border: none;
    border-radius: 8px;
    padding: 10px 28px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .save-btn:hover:not(:disabled) {
    filter: brightness(1.1);
  }

  .save-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  /* Responsive stacking */
  @media (max-width: 600px) {
    .field-grid,
    .stage-grid {
      grid-template-columns: 1fr 1fr;
    }
    .field-wide {
      grid-column: 1 / -1;
    }
  }
</style>
