<script>
  import { store } from '$lib/scheduleStore.svelte.js';
  import { tick, blockState } from '$lib/engine.svelte.js';
  import { getBlockDuration, getBlockHex, getMinutesLeft, getNextBlockIndex, timeToMinutes, buildBarSegments } from '$lib/schedule.js';

  let { onOpenToday = () => {}, onOpenTomorrow = () => {} } = $props();

  let current = $derived(blockState.currentIdx >= 0 ? store.blocks[blockState.currentIdx] : null);

  // ─── Stats ──────────────────────────────────────────────────
  let blocksLeft = $derived.by(() => {
    if (store.blocks.length === 0) return 0;
    const startFrom = blockState.currentIdx >= 0 ? blockState.currentIdx : getNextBlockIndex(store.blocks, tick.nowMins);
    if (startFrom < 0) return 0;
    let count = 0;
    for (let i = startFrom; i < store.blocks.length; i++) {
      if (store.blocks[i].type !== 'rest' && store.blocks[i].type !== 'sleep') count++;
    }
    return count;
  });

  let hoursLeft = $derived.by(() => {
    if (store.blocks.length === 0) return '0.0';
    const startFrom = blockState.currentIdx >= 0 ? blockState.currentIdx : getNextBlockIndex(store.blocks, tick.nowMins);
    if (startFrom < 0) return '0.0';
    let total = 0;
    for (let i = startFrom; i < store.blocks.length; i++) {
      if (store.blocks[i].type !== 'rest' && store.blocks[i].type !== 'sleep') {
        total += getBlockDuration(store.blocks[i]) / 60;
      }
    }
    if (current && current.type !== 'rest' && current.type !== 'sleep') {
      const elapsed = getBlockDuration(current) - getMinutesLeft(current, tick.nowMins);
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
    const elapsed = tick.nowMins - dayStart;
    return Math.min(100, Math.max(0, Math.round((elapsed / dayTotal) * 100)));
  });

  let deepWorkHours = $derived.by(() => {
    let total = 0;
    for (const b of store.blocks) {
      if (b.type === 'work') total += getBlockDuration(b) / 60;
    }
    return total.toFixed(1);
  });

  let todaySegments = $derived(buildBarSegments(store.blocks));
  let tomorrowSegments = $derived(buildBarSegments(store.templateBlocks));


</script>

{#if store.blocks.length > 0}
<div class="sidebar">

  <!-- Day Bars -->
  <div class="sidebar-card">
    <div class="sidebar-card-title">Day Overview</div>
    <div class="day-bars">
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <div class="bar-col bar-col-clickable" onclick={onOpenToday} title="Click to edit today">
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
        <div class="bar-edit-hint">edit</div>
      </div>
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <div class="bar-col bar-col-clickable" onclick={onOpenTomorrow} title="Click to plan tomorrow">
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
        <div class="bar-edit-hint">edit</div>
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

  .bar-col-clickable {
    cursor: pointer;
    transition: transform 0.15s;
  }

  .bar-col-clickable:hover {
    transform: scale(1.05);
  }

  .bar-col-clickable:hover .bar-track {
    border: 1px solid var(--amber-dim);
  }

  .bar-edit-hint {
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.08em;
    color: var(--text-dim);
    opacity: 0;
    transition: opacity 0.15s;
  }

  .bar-col-clickable:hover .bar-edit-hint {
    opacity: 1;
    color: var(--amber);
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

</style>
