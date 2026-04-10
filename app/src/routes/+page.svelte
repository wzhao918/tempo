<script>
  import '../app.css';
  import { initDatabase } from '$lib/db.js';
  import { store, loadSchedule } from '$lib/scheduleStore.svelte.js';
  import { startTick, stopTick, initEngine, computeBlockStates } from '$lib/engine.js';
  import Header from '$lib/components/Header.svelte';
  import Hero from '$lib/components/Hero.svelte';
  import Timeline from '$lib/components/Timeline.svelte';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import Settings from '$lib/components/Settings.svelte';
  import Onboarding from '$lib/components/Onboarding.svelte';
  import SkyGradient from '$lib/components/SkyGradient.svelte';
  import TodayModal from '$lib/components/TodayModal.svelte';
  import TomorrowModal from '$lib/components/TomorrowModal.svelte';

  let currentView = $state('dashboard');
  let showTodayModal = $state(false);
  let showTomorrowModal = $state(false);
  let loadError = $state('');

  // Initialize database, load schedule, and start engine
  $effect(() => {
    initDatabase()
      .then(() => loadSchedule())
      .then(() => {
        // Start the centralized tick — components subscribe to engine state
        startTick(() => store.blocks);

        // Initialize day rollover detection
        initEngine(store.todayDate, store.templateBlocks, async (newDate) => {
          // Day boundary crossed while app is running — reload everything
          await loadSchedule();
          computeBlockStates(store.blocks);
        });
      })
      .catch((err) => {
        console.error('Failed to initialize:', err);
        loadError = String(err);
      });

    return () => stopTick();
  });
</script>

{#if loadError}
  <div class="loading">
    <div class="loading-text" style="color: #e87a44; max-width: 600px; text-align: center;">
      Error: {loadError}
    </div>
  </div>

{:else if !store.initialized}
  <div class="loading">
    <div class="loading-text">Loading...</div>
  </div>

{:else if store.isFirstLaunch}
  <Onboarding />

{:else if currentView === 'settings'}
  <SkyGradient />
  <Header {currentView} onNavigate={(v) => currentView = v} />
  <Settings />

{:else}
  <SkyGradient />
  <Header {currentView} onNavigate={(v) => currentView = v} />
  <Hero />
  <div class="main">
    <Timeline />
    <Sidebar
      onOpenToday={() => showTodayModal = true}
      onOpenTomorrow={() => showTomorrowModal = true}
    />
  </div>
  {#if showTodayModal}
    <TodayModal onClose={() => showTodayModal = false} />
  {/if}
  {#if showTomorrowModal}
    <TomorrowModal onClose={() => showTomorrowModal = false} />
  {/if}
{/if}

<style>
  .main {
    display: grid;
    grid-template-columns: 1fr 320px;
    flex: 1;
    gap: 0;
  }

  .loading {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
  }

  .loading-text {
    font-family: 'DM Mono', monospace;
    font-size: 14px;
    color: var(--text-dim);
  }
</style>
