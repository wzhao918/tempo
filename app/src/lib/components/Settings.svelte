<script>
  import { store, loadTemplateBlocks, saveTemplateEdits, resetToOnboarding } from '$lib/scheduleStore.svelte.js';
  import TemplateEditor from './TemplateEditor.svelte';

  let showResetConfirm = $state(false);
  let showSaveToast = $state(false);
  let toastTimeout = null;

  // Load template blocks when Settings mounts
  $effect(() => {
    loadTemplateBlocks();
    return () => { if (toastTimeout) clearTimeout(toastTimeout); };
  });

  async function handleReset() {
    await resetToOnboarding();
  }

  async function handleSave(editedBlocks, removedIds) {
    await saveTemplateEdits(editedBlocks, removedIds);
    showSaveToast = true;
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => { showSaveToast = false; }, 3000);
  }
</script>

<div class="settings-page">
  <div class="settings-header">
    <h2 class="settings-title">Settings</h2>
    <p class="settings-subtitle">Edit your daily schedule template. Changes apply to future days.</p>
  </div>

  <div class="settings-section">
    <div class="section-label">Schedule Template</div>
    <TemplateEditor initialBlocks={store.templateBlocks} onSave={handleSave} />
  </div>

  {#if showSaveToast}
    <div class="save-toast">
      Template saved. Changes will appear in tomorrow's schedule.
    </div>
  {/if}

  <div class="settings-section">
    <div class="section-label">Danger Zone</div>
    {#if !showResetConfirm}
      <button class="reset-btn" onclick={() => showResetConfirm = true}>
        Reset &amp; Re-run Onboarding
      </button>
    {:else}
      <div class="reset-confirm">
        <p class="reset-warning">This will erase all schedule data, grades, and reports. You'll set up a new schedule from scratch.</p>
        <div class="reset-actions">
          <button class="grade-cancel" onclick={() => showResetConfirm = false}>Cancel</button>
          <button class="reset-confirm-btn" onclick={handleReset}>Yes, reset everything</button>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .settings-page {
    padding: 32px 40px;
    max-width: 800px;
    overflow-y: auto;
    flex: 1;
  }

  .settings-header {
    margin-bottom: 32px;
  }

  .settings-title {
    font-family: 'Instrument Serif', serif;
    font-size: 28px;
    font-weight: 400;
    color: var(--text);
    margin-bottom: 8px;
  }

  .settings-subtitle {
    font-size: 14px;
    color: var(--text-dim);
  }

  .settings-section {
    margin-bottom: 32px;
  }

  .section-label {
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-dim);
    margin-bottom: 16px;
  }

  .reset-btn {
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    color: #e87a44;
    background: none;
    border: 1px solid rgba(232, 122, 68, 0.3);
    border-radius: 6px;
    padding: 8px 16px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .reset-btn:hover {
    background: rgba(232, 122, 68, 0.1);
    border-color: #e87a44;
  }

  .reset-confirm {
    border: 1px solid rgba(232, 122, 68, 0.3);
    border-radius: 8px;
    padding: 16px;
    background: rgba(232, 122, 68, 0.05);
  }

  .reset-warning {
    font-size: 13px;
    color: var(--text-mid);
    margin-bottom: 12px;
  }

  .reset-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  .reset-confirm-btn {
    font-family: 'DM Sans', sans-serif;
    font-size: 12px;
    font-weight: 500;
    color: white;
    background: #e87a44;
    border: none;
    border-radius: 6px;
    padding: 6px 14px;
    cursor: pointer;
  }

  .reset-confirm-btn:hover {
    filter: brightness(1.1);
  }

  .save-toast {
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    color: var(--green);
    background: var(--green-dim);
    border: 1px solid rgba(92, 184, 122, 0.3);
    border-radius: 8px;
    padding: 10px 16px;
    margin-bottom: 20px;
    animation: toast-in 0.3s ease-out;
  }

  @keyframes toast-in {
    from { opacity: 0; transform: translateY(-8px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>
