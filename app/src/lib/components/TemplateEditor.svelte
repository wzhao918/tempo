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

  // Local editing state — cloned from props, only saved on explicit action
  let editingBlocks = $state([]);
  let removedIds = $state([]);
  let saving = $state(false);
  let hasChanges = $state(false);

  // Initialize editing state from props
  $effect(() => {
    if (initialBlocks.length > 0 && editingBlocks.length === 0) {
      editingBlocks = initialBlocks.map(b => ({ ...b, isNew: false }));
    }
  });

  // Also allow external reset (e.g., onboarding generating blocks)
  export function setBlocks(newBlocks) {
    editingBlocks = newBlocks.map(b => ({ ...b, isNew: !b.id }));
    hasChanges = true;
  }

  function updateField(index, field, value) {
    editingBlocks[index] = { ...editingBlocks[index], [field]: value };
    hasChanges = true;
  }

  function addBlock() {
    const lastBlock = editingBlocks[editingBlocks.length - 1];
    const newStart = lastBlock ? lastBlock.end : '09:00';
    // Parse start time and add 1 hour for end
    const [h, m] = newStart.split(':').map(Number);
    const endH = (h + 1) % 24;
    const newEnd = `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

    editingBlocks = [...editingBlocks, {
      name: 'New Block',
      emoji: '📌',
      type: 'work',
      start: newStart,
      end: newEnd,
      note: '',
      isNew: true,
    }];
    hasChanges = true;
  }

  function removeBlockAt(index) {
    const block = editingBlocks[index];
    if (block.id) {
      removedIds = [...removedIds, block.id];
    }
    editingBlocks = editingBlocks.filter((_, i) => i !== index);
    hasChanges = true;
  }

  async function handleSave() {
    saving = true;
    try {
      await onSave(editingBlocks, removedIds);
      removedIds = [];
      hasChanges = false;
      // Refresh editing state with new IDs from DB
      editingBlocks = editingBlocks.map(b => ({ ...b, isNew: false }));
    } finally {
      saving = false;
    }
  }
</script>

<div class="editor">
  <div class="block-list">
    {#each editingBlocks as block, i}
      <div class="block-row" style="border-left: 3px solid {getBlockHex(block.type)}">
        <div class="block-row-header">
          <div class="block-row-number">{i + 1}</div>
          <button class="remove-btn" onclick={() => removeBlockAt(i)} title="Remove block">x</button>
        </div>

        <div class="field-grid">
          <div class="field">
            <label>Name</label>
            <input
              type="text"
              value={block.name}
              oninput={(e) => updateField(i, 'name', e.target.value)}
            />
          </div>

          <div class="field field-small">
            <label>Emoji</label>
            <input
              type="text"
              value={block.emoji}
              oninput={(e) => updateField(i, 'emoji', e.target.value)}
              maxlength="4"
              class="emoji-input"
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

  <div class="editor-actions">
    <button class="add-btn" onclick={addBlock}>+ Add Block</button>
    <button
      class="save-btn"
      onclick={handleSave}
      disabled={saving || !hasChanges}
    >
      {saving ? 'Saving...' : saveLabel}
    </button>
  </div>
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
  }

  .block-row-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
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
    grid-template-columns: 1fr auto 1fr auto auto;
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

  .emoji-input {
    text-align: center;
    font-size: 18px !important;
  }

  .field-small {
    min-width: 80px;
  }

  .field-small input[type="time"] {
    font-family: 'DM Mono', monospace;
    font-size: 13px;
  }

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
    .field-grid {
      grid-template-columns: 1fr 1fr;
    }
    .field-wide {
      grid-column: 1 / -1;
    }
  }
</style>
