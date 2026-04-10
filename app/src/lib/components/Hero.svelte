<script>
  import { store } from '$lib/scheduleStore.svelte.js';
  import { tick, blockState } from '$lib/engine.svelte.js';
  import { getBlockColor, getBlockHex, getMinutesLeft, formatCountdown, timeToMinutes } from '$lib/schedule.js';

  let current = $derived(blockState.currentIdx >= 0 ? store.blocks[blockState.currentIdx] : null);
  let color = $derived(current ? getBlockColor(current.type) : 'work');
  let hex = $derived(current ? getBlockHex(current.type) : '#e8a844');

  let next = $derived(blockState.nextIdx >= 0 ? store.blocks[blockState.nextIdx] : null);
  let minsLeft = $derived(current ? getMinutesLeft(current, tick.nowMins) : 0);
  let minsToNext = $derived.by(() => {
    if (!next) return 0;
    const nextStart = timeToMinutes(next.start);
    let diff = nextStart - tick.nowMins;
    if (diff < 0) diff += 24 * 60;
    return diff;
  });
  let isUrgent = $derived(current ? minsLeft <= 5 : minsToNext <= 5);
</script>

{#if store.blocks.length > 0}
<div class="hero">
  <div class="clock-row">
    <div class="clock">
      <span>{tick.hours}:{tick.minutes}</span><span class="seconds">:{tick.seconds}</span>
    </div>
    {#if current}
      <div class="current-block-pill bg-{color}">
        <div class="block-dot" style="background: {hex}"></div>
        <span>{current.name}</span>
      </div>
    {:else}
      <div class="current-block-pill gap-pill">
        <span>Free time</span>
      </div>
    {/if}
  </div>

  {#if current && next}
    <div class="next-row">
      <span class="next-label">Next</span>
      <span class="next-block">{next.name}</span>
      <span class="countdown" class:urgent={isUrgent}>in {formatCountdown(minsLeft)}</span>
    </div>
  {:else if !current && next}
    <div class="next-row">
      <span class="next-label">Next</span>
      <span class="next-block">{next.name}</span>
      <span class="countdown" class:urgent={isUrgent}>in {formatCountdown(minsToNext)}</span>
    </div>
  {/if}
</div>
{/if}

<style>
  .hero {
    padding: 32px 40px 28px;
    border-bottom: 1px solid var(--border);
  }

  .clock-row {
    display: flex;
    align-items: baseline;
    gap: 20px;
    margin-bottom: 16px;
  }

  .clock {
    font-family: 'DM Mono', monospace;
    font-size: 72px;
    font-weight: 300;
    letter-spacing: -0.02em;
    color: var(--text);
    line-height: 1;
  }

  .clock .seconds {
    font-size: 36px;
    color: var(--text-dim);
    font-weight: 300;
  }

  .current-block-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 14px;
    border-radius: 100px;
    font-size: 15px;
    font-weight: 500;
    letter-spacing: 0.02em;
  }

  .gap-pill {
    background: var(--surface2);
    border: 1px solid var(--border);
    color: var(--text-dim);
  }

  .block-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
  }

  .next-row {
    display: flex;
    align-items: center;
    gap: 24px;
    margin-top: 12px;
  }

  .next-label {
    font-size: 13px;
    color: var(--text-dim);
    font-family: 'DM Mono', monospace;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .next-block {
    font-size: 16px;
    color: var(--text-mid);
  }

  .countdown {
    font-family: 'DM Mono', monospace;
    font-size: 15px;
    color: var(--amber);
    margin-left: auto;
  }

  .countdown.urgent {
    color: #e87a44;
    animation: pulse 1s ease-in-out infinite;
  }
</style>
