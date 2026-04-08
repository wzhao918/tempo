<script>
  import { store, saveDayEdits } from '$lib/scheduleStore.svelte.js';
  import { getBlockHex, getBlockDuration, timeToMinutes, getCurrentBlockIndex } from '$lib/schedule.js';
  import TemplateEditor from './TemplateEditor.svelte';

  let { onClose = () => {} } = $props();

  let showSaveToast = $state(false);
  let toastTimeout = null;

  $effect(() => {
    return () => { if (toastTimeout) clearTimeout(toastTimeout); };
  });

  // ─── Color bar ──────────────────────────────────────────────
  function buildBarSegments(blocks) {
    if (blocks.length === 0) return [];
    const firstStart = timeToMinutes(blocks[0].start);
    let lastEnd = timeToMinutes(blocks[blocks.length - 1].end);
    if (lastEnd <= firstStart) lastEnd += 24 * 60;
    const totalMins = lastEnd - firstStart;
    if (totalMins <= 0) return [];

    const segments = [];
    let cursor = firstStart;

    for (const block of blocks) {
      const bStart = timeToMinutes(block.start);
      let bEnd = timeToMinutes(block.end);
      if (bEnd <= bStart) bEnd += 24 * 60;

      if (bStart > cursor) {
        segments.push({ type: 'gap', pct: ((bStart - cursor) / totalMins) * 100 });
      }

      segments.push({
        type: block.type,
        color: getBlockHex(block.type),
        pct: ((bEnd - bStart) / totalMins) * 100,
        name: block.name,
      });
      cursor = bEnd;
    }

    return segments;
  }

  let segments = $derived(buildBarSegments(store.blocks));

  // ─── Stats ──────────────────────────────────────────────────
  let totalBlocks = $derived(store.blocks.length);
  let gradedCount = $derived(store.blocks.filter(b => b.grade != null).length);
  let totalHours = $derived.by(() => {
    let mins = 0;
    for (const b of store.blocks) mins += getBlockDuration(b);
    return (mins / 60).toFixed(1);
  });
  let deepWorkHours = $derived.by(() => {
    let mins = 0;
    for (const b of store.blocks) {
      if (b.type === 'work') mins += getBlockDuration(b);
    }
    return (mins / 60).toFixed(1);
  });

  // ─── Save ───────────────────────────────────────────────────
  async function handleSave(editedBlocks, removedIds) {
    await saveDayEdits(editedBlocks, removedIds);
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
        <h2 class="modal-title">Today</h2>
        <p class="modal-subtitle">Edit today's schedule. Graded blocks are locked.</p>
      </div>
      <button class="modal-close" onclick={onClose}>&#x2715;</button>
    </div>

    {#if showSaveToast}
      <div class="save-toast">Schedule updated.</div>
    {/if}

    <!-- Color bar + stats strip -->
    <div class="today-overview">
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
        <span class="overview-dot"></span>
        <span class="overview-stat">{gradedCount}/{totalBlocks} graded</span>
      </div>
    </div>

    <!-- Editor -->
    <div class="modal-body">
      <TemplateEditor initialBlocks={store.blocks} onSave={handleSave} saveLabel="Save Changes" />
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
    max-width: 800px;
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
  .today-overview {
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

  /* ─── Body ─────────────────────────────────────────────────── */
  .modal-body {
    min-width: 0;
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
    .modal-content {
      width: 95vw;
      padding: 20px;
    }
  }
</style>
