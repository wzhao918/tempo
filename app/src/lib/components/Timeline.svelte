<script>
  import { store } from '$lib/scheduleStore.svelte.js';
  import { tick, blockState } from '$lib/engine.svelte.js';
  import BlockCard from './BlockCard.svelte';

  // Scroll active block into view on block change
  let lastBlock = $state(-1);
  $effect(() => {
    if (store.blocks.length > 0 && blockState.currentIdx !== lastBlock) {
      lastBlock = blockState.currentIdx;
      setTimeout(() => {
        const el = document.getElementById(`block-${blockState.currentIdx}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  });
</script>

{#if store.blocks.length > 0}
<div class="timeline-section">
  <div class="section-label">Today's Schedule</div>
  <div class="timeline">
    {#each store.blocks as block, i}
      <div id="block-{i}">
        <BlockCard {block} index={i} currentIdx={blockState.currentIdx} nowMins={tick.nowMins} blockStateValue={blockState.states[i]} />
      </div>
    {/each}
  </div>
</div>
{/if}

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
