<script>
  import { store } from '$lib/scheduleStore.svelte.js';
  import { getCurrentBlockIndex, getBlockColor, getBlockHex, getMinutesLeft, formatCountdown } from '$lib/schedule.js';

  let now = $state(new Date());
  let nowMins = $derived(now.getHours() * 60 + now.getMinutes());

  let hours = $derived(String(now.getHours()).padStart(2, '0'));
  let minutes = $derived(String(now.getMinutes()).padStart(2, '0'));
  let seconds = $derived(String(now.getSeconds()).padStart(2, '0'));

  let currentIdx = $derived(store.blocks.length > 0 ? getCurrentBlockIndex(store.blocks, nowMins) : 0);
  let current = $derived(store.blocks[currentIdx]);
  let color = $derived(current ? getBlockColor(current.type) : 'work');
  let hex = $derived(current ? getBlockHex(current.type) : '#e8a844');

  let nextIdx = $derived(store.blocks.length > 0 ? (currentIdx + 1) % store.blocks.length : 0);
  let next = $derived(store.blocks[nextIdx]);
  let minsLeft = $derived(current ? getMinutesLeft(current, nowMins) : 0);
  let isUrgent = $derived(minsLeft <= 5);

  $effect(() => {
    const interval = setInterval(() => { now = new Date(); }, 1000);
    return () => clearInterval(interval);
  });
</script>

{#if current}
<div class="hero">
  <div class="clock-row">
    <div class="clock">
      <span>{hours}:{minutes}</span><span class="seconds">:{seconds}</span>
    </div>
    <div class="current-block-pill bg-{color}">
      <div class="block-dot" style="background: {hex}"></div>
      <span>{current.name}</span>
    </div>
  </div>

  <div class="next-row">
    <span class="next-label">Next</span>
    <span class="next-block">{next?.emoji} {next?.name}</span>
    <span class="countdown" class:urgent={isUrgent}>in {formatCountdown(minsLeft)}</span>
  </div>
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
