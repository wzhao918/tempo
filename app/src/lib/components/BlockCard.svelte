<script>
  import { timeToMinutes, minutesToDisplay, formatDuration, getBlockColor, getBlockDuration, getBlockProgress } from '$lib/schedule.js';

  let { block, index, currentIdx, nowMins } = $props();

  let startMins = $derived(timeToMinutes(block.start));
  let endMins = $derived(timeToMinutes(block.end));
  let duration = $derived(getBlockDuration(block));
  let color = $derived(getBlockColor(block.type));

  let isActive = $derived(index === currentIdx);
  let isPast = $derived(endMins <= nowMins && index < currentIdx);
  let distance = $derived(Math.abs(index - currentIdx));
  let isCollapsed = $derived(distance > 2);

  let progress = $derived(isActive ? getBlockProgress(block, nowMins) : 0);
</script>

<div class="block-item" class:active={isActive} class:past={isPast} class:collapsed={isCollapsed}>
  <div class="block-card">
    <div class="block-header">
      <div class="block-name"><span class="block-emoji">{block.emoji}</span>{block.name}</div>
      <div class="block-time">{minutesToDisplay(startMins % (24*60))} – {minutesToDisplay(endMins % (24*60))}</div>
    </div>
    <div class="block-duration color-{color}">
      {formatDuration(duration)} · <span class="block-note">{block.note}</span>
    </div>
    {#if isActive}
      <div class="block-progress">
        <div class="block-progress-fill" style="width: {progress}%"></div>
      </div>
    {/if}
  </div>
</div>

<style>
  .block-item {
    position: relative;
    padding: 0 0 4px 24px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .block-item::before {
    content: '';
    position: absolute;
    left: -4px;
    top: 10px;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: var(--border);
    border: 2px solid var(--bg);
    transition: all 0.2s;
  }

  .block-item.active::before {
    background: var(--amber);
    box-shadow: 0 0 12px var(--amber);
    width: 11px;
    height: 11px;
    left: -5px;
  }

  .block-item.past::before {
    background: var(--green);
  }

  .block-item.past .block-card {
    opacity: 0.45;
  }

  .block-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 16px 18px;
    margin-bottom: 8px;
    transition: all 0.2s;
    position: relative;
    overflow: hidden;
  }

  .block-item.active .block-card {
    border-color: var(--amber-dim);
    background: var(--surface2);
  }

  .block-item.active .block-card::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: var(--amber);
    border-radius: 3px 0 0 3px;
  }

  .block-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }

  .block-name {
    font-size: 16px;
    font-weight: 500;
    color: var(--text);
  }

  .block-time {
    font-family: 'DM Mono', monospace;
    font-size: 13px;
    color: var(--text-dim);
  }

  .block-emoji {
    font-size: 18px;
    margin-right: 8px;
  }

  .block-duration {
    font-size: 13px;
    margin-top: 2px;
  }

  .block-note {
    color: var(--text-dim);
  }

  .block-progress {
    margin-top: 10px;
    height: 2px;
    background: var(--border);
    border-radius: 2px;
    overflow: hidden;
  }

  .block-progress-fill {
    height: 100%;
    background: var(--amber);
    border-radius: 2px;
    transition: width 1s linear;
  }

  /* Collapsed blocks far from current */
  .block-item.collapsed .block-card {
    padding: 8px 18px;
    display: flex;
    align-items: center;
    gap: 0;
  }

  .block-item.collapsed .block-header {
    margin-bottom: 0;
    flex: 1;
  }

  .block-item.collapsed .block-name {
    font-size: 14px;
    color: var(--text-dim);
  }

  .block-item.collapsed .block-emoji {
    font-size: 15px;
  }

  .block-item.collapsed .block-time {
    font-size: 12px;
  }

  .block-item.collapsed .block-duration,
  .block-item.collapsed .block-progress {
    display: none;
  }
</style>
