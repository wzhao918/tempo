<script>
  import '../app.css';
  import { initDatabase } from '$lib/db.js';
  import { store, loadSchedule } from '$lib/scheduleStore.svelte.js';
  import Header from '$lib/components/Header.svelte';
  import Hero from '$lib/components/Hero.svelte';
  import Timeline from '$lib/components/Timeline.svelte';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import Settings from '$lib/components/Settings.svelte';
  import Onboarding from '$lib/components/Onboarding.svelte';
  import SkyGradient from '$lib/components/SkyGradient.svelte';
  import TomorrowModal from '$lib/components/TomorrowModal.svelte';

  let currentView = $state('dashboard');
  let showTomorrowModal = $state(false);
  let loadError = $state('');

  // Initialize database and load schedule on mount
  $effect(() => {
    initDatabase()
      .then(() => loadSchedule())
      .catch((err) => {
        console.error('Failed to initialize:', err);
        loadError = String(err);
      });
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
    <Sidebar onOpenTomorrow={() => showTomorrowModal = true} />
  </div>
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
