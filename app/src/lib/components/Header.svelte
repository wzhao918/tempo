<script>
  let now = $state(new Date());

  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  let dateLine1 = $derived(days[now.getDay()]);
  let dateLine2 = $derived(`${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`);

  $effect(() => {
    const interval = setInterval(() => { now = new Date(); }, 60000);
    return () => clearInterval(interval);
  });
</script>

<div class="header">
  <div class="wordmark">tempo</div>
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

  .wordmark {
    font-family: 'Instrument Serif', serif;
    font-style: italic;
    font-size: 20px;
    color: var(--text-dim);
    letter-spacing: 0.01em;
  }

  .date-display {
    font-family: 'DM Mono', monospace;
    font-size: 14px;
    color: var(--text-dim);
    text-align: right;
    line-height: 1.6;
  }
</style>
