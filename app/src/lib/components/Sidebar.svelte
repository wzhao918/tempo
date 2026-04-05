<script>
  import { store } from '$lib/scheduleStore.svelte.js';
  import { getCurrentBlockIndex, getNowMinutes, getMinutesLeft, timeToMinutes } from '$lib/schedule.js';

  let now = $state(new Date());
  let nowMins = $derived(now.getHours() * 60 + now.getMinutes());
  let currentIdx = $derived(store.blocks.length > 0 ? getCurrentBlockIndex(store.blocks, nowMins) : 0);
  let current = $derived(store.blocks[currentIdx]);

  let blocksLeft = $derived.by(() => {
    if (store.blocks.length === 0) return 0;
    let count = 0;
    for (let i = currentIdx; i < store.blocks.length - 1; i++) {
      if (store.blocks[i].type !== 'rest') count++;
    }
    return Math.max(0, count);
  });

  let hoursLeft = $derived.by(() => {
    if (store.blocks.length === 0 || !current) return '0.0';
    let total = 0;
    for (let i = currentIdx; i < store.blocks.length - 1; i++) {
      const b = store.blocks[i];
      if (b.type !== 'rest') {
        const s = timeToMinutes(b.start);
        let e = timeToMinutes(b.end);
        if (e <= s) e += 24 * 60;
        total += (e - s) / 60;
      }
    }
    const minsLeft = getMinutesLeft(current, nowMins);
    const blockDuration = (() => {
      const s = timeToMinutes(current.start);
      let e = timeToMinutes(current.end);
      if (e <= s) e += 24 * 60;
      return e - s;
    })();
    const elapsed = blockDuration - minsLeft;
    total -= elapsed / 60;
    return Math.max(0, total).toFixed(1);
  });

  let dayProgress = $derived.by(() => {
    if (store.blocks.length === 0) return 0;
    const dayStart = timeToMinutes(store.blocks[0].start);
    const lastBlock = store.blocks[store.blocks.length - 1];
    const dayEnd = timeToMinutes(lastBlock.start);
    const dayTotal = dayEnd - dayStart;
    if (dayTotal <= 0) return 0;
    const elapsed = nowMins - dayStart;
    return Math.min(100, Math.max(0, Math.round((elapsed / dayTotal) * 100)));
  });

  let deepWorkHours = $derived.by(() => {
    let total = 0;
    for (const b of store.blocks) {
      if (b.type === 'work') {
        const s = timeToMinutes(b.start);
        let e = timeToMinutes(b.end);
        if (e <= s) e += 24 * 60;
        total += (e - s) / 60;
      }
    }
    return total.toFixed(1);
  });

  let transitionsOn = $state(true);
  let warningsOn = $state(true);

  $effect(() => {
    const interval = setInterval(() => { now = new Date(); }, 60000);
    return () => clearInterval(interval);
  });
</script>

{#if store.blocks.length > 0}
<div class="sidebar">
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
    gap: 28px;
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
