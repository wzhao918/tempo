<script>
  import { store, loadTemplateBlocks, saveTemplateEdits, addNewQuest, toggleQuestDone, clearAllQuests } from '$lib/scheduleStore.svelte.js';
  import { getBlockHex, getBlockDuration, timeToMinutes, buildBarSegments } from '$lib/schedule.js';
  import TemplateEditor from './TemplateEditor.svelte';

  let { onClose = () => {} } = $props();

  let showSaveToast = $state(false);
  let toastTimeout = null;

  // Load template blocks when modal opens
  $effect(() => {
    loadTemplateBlocks();
    return () => { if (toastTimeout) clearTimeout(toastTimeout); };
  });

  let segments = $derived(buildBarSegments(store.templateBlocks));

  // ─── Stats ──────────────────────────────────────────────────
  let totalBlocks = $derived(store.templateBlocks.length);
  let totalHours = $derived.by(() => {
    let mins = 0;
    for (const b of store.templateBlocks) mins += getBlockDuration(b);
    return (mins / 60).toFixed(1);
  });
  let deepWorkHours = $derived.by(() => {
    let mins = 0;
    for (const b of store.templateBlocks) {
      if (b.type === 'work') mins += getBlockDuration(b);
    }
    return (mins / 60).toFixed(1);
  });

  // ─── Quests ─────────────────────────────────────────────────
  let questInput = $state('');
  let confirmClear = $state(false);

  let tomorrowDate = $derived.by(() => {
    if (!store.todayDate) return '';
    const d = new Date(store.todayDate);
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  let tomorrowQuests = $derived(store.quests.filter(q => q.target_date === tomorrowDate));

  async function handleAddQuest() {
    const text = questInput.trim();
    if (!text) return;
    await addNewQuest(text);
    questInput = '';
  }

  async function handleClearAll() {
    await clearAllQuests();
    confirmClear = false;
  }

  // ─── Save ───────────────────────────────────────────────────
  async function handleSave(editedBlocks, removedIds) {
    await saveTemplateEdits(editedBlocks, removedIds);
    showSaveToast = true;
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => { showSaveToast = false; }, 3000);
  }

  // ─── Backdrop click ─────────────────────────────────────────
  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) onClose();
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div class="modal-backdrop" onclick={handleBackdropClick}>
  <div class="modal-content">
    <!-- Header -->
    <div class="modal-header">
      <div class="modal-header-left">
        <h2 class="modal-title">Tomorrow</h2>
        <p class="modal-subtitle">Build your schedule for tomorrow</p>
      </div>
      <button class="modal-close" onclick={onClose}>&#x2715;</button>
    </div>

    {#if showSaveToast}
      <div class="save-toast">Template saved.</div>
    {/if}

    <!-- Color bar + stats strip -->
    <div class="tomorrow-overview">
      <div class="overview-bar">
        {#each segments as seg}
          {#if seg.type === 'gap'}
            <div class="bar-gap" style="flex: {seg.pct}"></div>
          {:else}
            <div class="bar-segment" style="flex: {seg.pct}; background: {seg.color}" title={seg.name}></div>
          {/if}
        {/each}
      </div>
      <div class="overview-stats">
        <span class="overview-stat">{totalBlocks} blocks</span>
        <span class="overview-dot"></span>
        <span class="overview-stat">{totalHours}h scheduled</span>
        <span class="overview-dot"></span>
        <span class="overview-stat">{deepWorkHours}h deep work</span>
      </div>
    </div>

    <!-- Two-column body: editor + quests -->
    <div class="modal-body">
      <div class="modal-editor">
        <TemplateEditor initialBlocks={store.templateBlocks} onSave={handleSave} saveLabel="Save Template" />
      </div>

      <div class="modal-quests">
        <div class="quests-header">
          <div class="quests-title">Quests</div>
          {#if tomorrowQuests.length > 0}
            {#if confirmClear}
              <button class="clear-confirm-btn" onclick={handleClearAll}>confirm</button>
            {:else}
              <button class="clear-btn" onclick={() => confirmClear = true} title="Clear all quests">&#x2715;</button>
            {/if}
          {/if}
        </div>

        {#each tomorrowQuests as quest}
          <label class="quest-row" class:done={quest.done}>
            <input type="checkbox" checked={quest.done} onchange={() => toggleQuestDone(quest.id)} />
            <span class="quest-text">{quest.text}</span>
          </label>
        {/each}

        <div class="quest-input-row">
          <input
            type="text"
            class="quest-input"
            placeholder="Add a quest..."
            bind:value={questInput}
            onkeydown={(e) => e.key === 'Enter' && handleAddQuest()}
          />
          <button class="quest-add-btn" onclick={handleAddQuest} disabled={!questInput.trim()}>+</button>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  /* ─── Backdrop ──────────────────────────────────────────────── */
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.65);
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fade-in 0.2s ease-out;
  }

  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  /* ─── Modal ────────────────────────────────────────────────── */
  .modal-content {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 16px;
    width: 90vw;
    max-width: 900px;
    max-height: 85vh;
    overflow-y: auto;
    padding: 32px;
    animation: slide-up 0.25s ease-out;
  }

  @keyframes slide-up {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* ─── Header ───────────────────────────────────────────────── */
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;
  }

  .modal-title {
    font-family: 'Instrument Serif', serif;
    font-size: 28px;
    font-weight: 400;
    color: var(--text);
    margin-bottom: 4px;
  }

  .modal-subtitle {
    font-size: 14px;
    color: var(--text-dim);
  }

  .modal-close {
    font-size: 16px;
    color: var(--text-dim);
    background: none;
    border: 1px solid transparent;
    border-radius: 6px;
    padding: 4px 8px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .modal-close:hover {
    color: var(--text);
    background: var(--surface);
    border-color: var(--border);
  }

  /* ─── Overview strip ───────────────────────────────────────── */
  .tomorrow-overview {
    margin-bottom: 28px;
  }

  .overview-bar {
    display: flex;
    height: 12px;
    border-radius: 6px;
    overflow: hidden;
    background: var(--surface2);
    gap: 1px;
    margin-bottom: 10px;
  }

  .bar-segment {
    min-width: 3px;
    border-radius: 2px;
    opacity: 0.85;
    transition: opacity 0.2s;
  }

  .bar-segment:hover {
    opacity: 1;
  }

  .bar-gap {
    background: transparent;
    min-width: 1px;
  }

  .overview-stats {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .overview-stat {
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    color: var(--text-dim);
  }

  .overview-dot {
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: var(--border);
  }

  /* ─── Body layout ──────────────────────────────────────────── */
  .modal-body {
    display: grid;
    grid-template-columns: 1fr 260px;
    gap: 28px;
    align-items: start;
  }

  .modal-editor {
    min-width: 0;
  }

  /* ─── Quests panel ─────────────────────────────────────────── */
  .modal-quests {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 20px;
  }

  .quests-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14px;
  }

  .quests-title {
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-dim);
  }

  .quest-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 0;
    cursor: pointer;
  }

  .quest-row input[type="checkbox"] {
    accent-color: var(--amber);
    width: 14px;
    height: 14px;
    cursor: pointer;
  }

  .quest-text {
    font-size: 13px;
    color: var(--text);
    line-height: 1.3;
  }

  .quest-row.done .quest-text {
    text-decoration: line-through;
    color: var(--text-dim);
  }

  .quest-input-row {
    display: flex;
    gap: 6px;
    margin-top: 10px;
  }

  .quest-input {
    flex: 1;
    padding: 6px 10px;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 6px;
    color: var(--text);
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    outline: none;
  }

  .quest-input:focus {
    border-color: var(--amber);
  }

  .quest-input::placeholder {
    color: var(--text-dim);
  }

  .quest-add-btn {
    width: 32px;
    height: 32px;
    background: var(--amber);
    color: var(--bg);
    border: none;
    border-radius: 6px;
    font-size: 18px;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: filter 0.2s;
  }

  .quest-add-btn:hover:not(:disabled) {
    filter: brightness(1.1);
  }

  .quest-add-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .clear-btn {
    font-size: 12px;
    color: var(--text-dim);
    background: none;
    border: none;
    cursor: pointer;
    padding: 2px 6px;
    border-radius: 4px;
    transition: all 0.2s;
  }

  .clear-btn:hover {
    color: #e87a44;
    background: rgba(232, 122, 68, 0.1);
  }

  .clear-confirm-btn {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    color: #e87a44;
    background: rgba(232, 122, 68, 0.1);
    border: 1px solid rgba(232, 122, 68, 0.3);
    border-radius: 4px;
    padding: 2px 8px;
    cursor: pointer;
    letter-spacing: 0.05em;
  }

  /* ─── Save toast ───────────────────────────────────────────── */
  .save-toast {
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    color: var(--green);
    background: var(--green-dim);
    border: 1px solid rgba(92, 184, 122, 0.3);
    border-radius: 8px;
    padding: 10px 16px;
    margin-bottom: 20px;
    animation: toast-in 0.3s ease-out;
  }

  @keyframes toast-in {
    from { opacity: 0; transform: translateY(-8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* ─── Responsive ───────────────────────────────────────────── */
  @media (max-width: 700px) {
    .modal-body {
      grid-template-columns: 1fr;
    }
    .modal-content {
      width: 95vw;
      padding: 20px;
    }
  }
</style>
