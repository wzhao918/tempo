<script>
  import { store, addNewQuest, toggleQuestDone, clearAllQuests } from '$lib/scheduleStore.svelte.js';
  import { getCurrentBlockIndex, getNextBlockIndex, getBlockDuration, getBlockHex, getMinutesLeft, timeToMinutes } from '$lib/schedule.js';

  let now = $state(new Date());
  let nowMins = $derived(now.getHours() * 60 + now.getMinutes());
  let currentIdx = $derived(store.blocks.length > 0 ? getCurrentBlockIndex(store.blocks, nowMins) : -1);
  let current = $derived(currentIdx >= 0 ? store.blocks[currentIdx] : null);

  // ─── Stats ──────────────────────────────────────────────────
  let blocksLeft = $derived.by(() => {
    if (store.blocks.length === 0) return 0;
    const startFrom = currentIdx >= 0 ? currentIdx : getNextBlockIndex(store.blocks, nowMins);
    if (startFrom < 0) return 0;
    let count = 0;
    for (let i = startFrom; i < store.blocks.length; i++) {
      if (store.blocks[i].type !== 'rest') count++;
    }
    return count;
  });

  let hoursLeft = $derived.by(() => {
    if (store.blocks.length === 0) return '0.0';
    const startFrom = currentIdx >= 0 ? currentIdx : getNextBlockIndex(store.blocks, nowMins);
    if (startFrom < 0) return '0.0';
    let total = 0;
    for (let i = startFrom; i < store.blocks.length; i++) {
      if (store.blocks[i].type !== 'rest') {
        total += getBlockDuration(store.blocks[i]) / 60;
      }
    }
    if (current && current.type !== 'rest') {
      const elapsed = getBlockDuration(current) - getMinutesLeft(current, nowMins);
      total -= elapsed / 60;
    }
    return Math.max(0, total).toFixed(1);
  });

  let dayProgress = $derived.by(() => {
    if (store.blocks.length === 0) return 0;
    const dayStart = timeToMinutes(store.blocks[0].start);
    const lastBlock = store.blocks[store.blocks.length - 1];
    let dayEnd = timeToMinutes(lastBlock.end);
    if (dayEnd <= dayStart) dayEnd += 24 * 60;
    const dayTotal = dayEnd - dayStart;
    if (dayTotal <= 0) return 0;
    const elapsed = nowMins - dayStart;
    return Math.min(100, Math.max(0, Math.round((elapsed / dayTotal) * 100)));
  });

  let deepWorkHours = $derived.by(() => {
    let total = 0;
    for (const b of store.blocks) {
      if (b.type === 'work') total += getBlockDuration(b) / 60;
    }
    return total.toFixed(1);
  });

  // ─── Color bar helpers ──────────────────────────────────────
  function buildBarSegments(blocks) {
    if (blocks.length === 0) return [];
    // Find total time span from first start to last end
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

      // Gap before this block
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

  let todaySegments = $derived(buildBarSegments(store.blocks));
  let tomorrowSegments = $derived(buildBarSegments(store.templateBlocks));

  // ─── Quests ─────────────────────────────────────────────────
  let questInput = $state('');
  let confirmClear = $state(false);

  // Split quests into today's and tomorrow's
  let todayQuests = $derived(store.quests.filter(q => q.target_date === store.todayDate));
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

  // ─── Notifications (placeholder for future Windows toast) ───
  let transitionsOn = $state(true);
  let warningsOn = $state(true);

  $effect(() => {
    const interval = setInterval(() => { now = new Date(); }, 60000);
    return () => clearInterval(interval);
  });
</script>

{#if store.blocks.length > 0}
<div class="sidebar">

  <!-- Day Bars -->
  <div class="sidebar-card">
    <div class="sidebar-card-title">Day Overview</div>
    <div class="day-bars">
      <div class="bar-col">
        <div class="bar-label">Today</div>
        <div class="bar-track">
          {#each todaySegments as seg}
            {#if seg.type === 'gap'}
              <div class="bar-gap" style="height: {seg.pct}%"></div>
            {:else}
              <div class="bar-segment" style="height: {seg.pct}%; background: {seg.color}" title={seg.name}></div>
            {/if}
          {/each}
        </div>
      </div>
      <div class="bar-col">
        <div class="bar-label">Tomorrow</div>
        <div class="bar-track">
          {#each tomorrowSegments as seg}
            {#if seg.type === 'gap'}
              <div class="bar-gap" style="height: {seg.pct}%"></div>
            {:else}
              <div class="bar-segment" style="height: {seg.pct}%; background: {seg.color}" title={seg.name}></div>
            {/if}
          {/each}
        </div>
      </div>
    </div>
  </div>

  <!-- Stats -->
  <div class="sidebar-card">
    <div class="sidebar-card-title">Today at a Glance</div>
    <div class="stats-grid">
      <div class="stat-item">
        <div class="stat-value">{blocksLeft}</div>
        <div class="stat-label">blocks left</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{hoursLeft}h</div>
        <div class="stat-label">hours left</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{deepWorkHours}h</div>
        <div class="stat-label">deep work today</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{dayProgress}%</div>
        <div class="stat-label">day complete</div>
      </div>
    </div>
  </div>

  <!-- Quests -->
  <div class="sidebar-card">
    <div class="sidebar-card-header">
      <div class="sidebar-card-title" style="margin-bottom: 0">Quests</div>
      {#if store.quests.length > 0}
        {#if confirmClear}
          <button class="clear-confirm-btn" onclick={handleClearAll}>confirm</button>
        {:else}
          <button class="clear-btn" onclick={() => confirmClear = true} title="Clear all quests">&#x2715;</button>
        {/if}
      {/if}
    </div>

    {#if todayQuests.length > 0}
      <div class="quest-section-label">Today</div>
      {#each todayQuests as quest}
        <label class="quest-row" class:done={quest.done}>
          <input type="checkbox" checked={quest.done} onchange={() => toggleQuestDone(quest.id)} />
          <span class="quest-text">{quest.text}</span>
        </label>
      {/each}
    {/if}

    {#if tomorrowQuests.length > 0}
      <div class="quest-section-label">Tomorrow</div>
      {#each tomorrowQuests as quest}
        <label class="quest-row" class:done={quest.done}>
          <input type="checkbox" checked={quest.done} onchange={() => toggleQuestDone(quest.id)} />
          <span class="quest-text">{quest.text}</span>
        </label>
      {/each}
    {/if}

    <div class="quest-input-row">
      <input
        type="text"
        class="quest-input"
        placeholder="Add a quest for tomorrow..."
        bind:value={questInput}
        onkeydown={(e) => e.key === 'Enter' && handleAddQuest()}
      />
      <button class="quest-add-btn" onclick={handleAddQuest} disabled={!questInput.trim()}>+</button>
    </div>
  </div>

  <!-- Notifications -->
  <div class="sidebar-card">
    <div class="sidebar-card-title">Notifications</div>
    <div class="notif-options">
      <div class="notif-option">
        <span>Block transitions</span>
        <div class="toggle" class:on={transitionsOn} onclick={() => transitionsOn = !transitionsOn}></div>
      </div>
      <div class="notif-option">
        <span>5-min warnings</span>
        <div class="toggle" class:on={warningsOn} onclick={() => warningsOn = !warningsOn}></div>
      </div>
    </div>
  </div>
</div>
{/if}

<style>
  .sidebar {
    padding: 32px 28px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    overflow-y: auto;
  }

  .sidebar-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 20px;
  }

  .sidebar-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14px;
  }

  .sidebar-card-title {
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-dim);
    margin-bottom: 14px;
  }

  /* ─── Day Bars ──────────────────────────────────────────────── */
  .day-bars {
    display: flex;
    gap: 16px;
    justify-content: center;
  }

  .bar-col {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    flex: 1;
  }

  .bar-label {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-dim);
  }

  .bar-track {
    width: 100%;
    max-width: 40px;
    height: 180px;
    background: var(--surface2);
    border-radius: 6px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .bar-segment {
    width: 100%;
    min-height: 2px;
    transition: background 0.3s;
    opacity: 0.85;
  }

  .bar-segment:hover {
    opacity: 1;
  }

  .bar-gap {
    width: 100%;
    min-height: 1px;
    background: transparent;
  }

  /* ─── Stats ─────────────────────────────────────────────────── */
  .stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .stat-item {
    background: var(--surface2);
    border-radius: 8px;
    padding: 14px;
  }

  .stat-value {
    font-family: 'DM Mono', monospace;
    font-size: 24px;
    font-weight: 400;
    color: var(--text);
    line-height: 1;
    margin-bottom: 4px;
  }

  .stat-label {
    font-size: 13px;
    color: var(--text-dim);
  }

  /* ─── Quests ────────────────────────────────────────────────── */
  .quest-section-label {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-dim);
    margin-bottom: 6px;
    margin-top: 4px;
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

  /* ─── Notifications ─────────────────────────────────────────── */
  .notif-options {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .notif-option {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 15px;
    color: var(--text-mid);
  }

  .toggle {
    width: 36px;
    height: 20px;
    background: var(--border);
    border-radius: 100px;
    position: relative;
    cursor: pointer;
    transition: background 0.2s;
  }

  .toggle.on {
    background: var(--amber);
  }

  .toggle::after {
    content: '';
    position: absolute;
    width: 14px;
    height: 14px;
    background: white;
    border-radius: 50%;
    top: 3px;
    left: 3px;
    transition: transform 0.2s;
  }

  .toggle.on::after {
    transform: translateX(16px);
  }
</style>
