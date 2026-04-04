<script>
  import { schedule, getCurrentBlockIndex, getNowMinutes } from '$lib/schedule.js';
  import BlockCard from './BlockCard.svelte';

  let now = $state(new Date());
  let nowMins = $derived(now.getHours() * 60 + now.getMinutes());
  let currentIdx = $derived(getCurrentBlockIndex(nowMins));

  $effect(() => {
    const interval = setInterval(() => { now = new Date(); }, 1000);
    return () => clearInterval(interval);
  });

  // Scroll active block into view on block change
  let lastBlock = $state(-1);
  $effect(() => {
    if (currentIdx !== lastBlock) {
      lastBlock = currentIdx;
      // Small delay to let DOM update
      setTimeout(() => {
        const el = document.getElementById(`block-${currentIdx}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  });
</script>

<div class="timeline-section">
  <div class="section-label">Today's Schedule</div>
  <div class="timeline">
    {#each schedule as block, i}
      <div id="block-{i}">
        <BlockCard {block} index={i} {currentIdx} {nowMins} />
      </div>
    {/each}
  </div>
</div>

<style>
  .timeline-section {
    padding: 32px 40px;
    border-right: 1px solid var(--border);
    overflow-y: auto;
  }

  .section-label {
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-dim);
    margin-bottom: 20px;
  }

  .timeline {
    position: relative;
    padding-left: 20px;
  }

  .timeline::before {
    content: '';
    position: absolute;
    left: 0;
    top: 8px;
    bottom: 8px;
    width: 1px;
    background: var(--border);
  }
</style>
