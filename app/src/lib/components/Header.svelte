<script>
  import { tick } from '$lib/engine.js';

  let { currentView = 'dashboard', onNavigate = () => {} } = $props();

  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  let dateLine1 = $derived(days[tick.now.getDay()]);
  let dateLine2 = $derived(`${months[tick.now.getMonth()]} ${tick.now.getDate()}, ${tick.now.getFullYear()}`);
</script>

<div class="header">
  <div class="left">
    <div class="wordmark">tempo</div>
  </div>

  <div class="nav">
    <button
      class="nav-item"
      class:active={currentView === 'dashboard'}
      onclick={() => onNavigate('dashboard')}
    >
      Dashboard
    </button>
    <button
      class="nav-item"
      class:active={currentView === 'settings'}
      onclick={() => onNavigate('settings')}
    >
      Settings
    </button>
  </div>

  <div class="date-display">
    {dateLine1}<br>{dateLine2}
  </div>
</div>

<style>
  .header {
    padding: 28px 40px 0;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .left {
    flex: 1;
  }

  .wordmark {
    font-family: 'Instrument Serif', serif;
    font-style: italic;
    font-size: 20px;
    color: var(--text-dim);
    letter-spacing: 0.01em;
  }

  .nav {
    display: flex;
    gap: 4px;
  }

  .nav-item {
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    letter-spacing: 0.06em;
    color: var(--text-dim);
    background: none;
    border: 1px solid transparent;
    border-radius: 6px;
    padding: 6px 14px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .nav-item:hover {
    color: var(--text-mid);
    background: var(--surface);
  }

  .nav-item.active {
    color: var(--amber);
    background: var(--amber-glow);
    border-color: var(--amber-dim);
  }

  .date-display {
    flex: 1;
    font-family: 'DM Mono', monospace;
    font-size: 14px;
    color: var(--text-dim);
    text-align: right;
    line-height: 1.6;
  }
</style>
