<script>
  import { resetToOnboarding } from '$lib/scheduleStore.svelte.js';

  let showResetConfirm = $state(false);

  // Notification preferences (placeholder for future Windows toast integration)
  let transitionsOn = $state(true);
  let warningsOn = $state(true);

  async function handleReset() {
    await resetToOnboarding();
  }
</script>

<div class="settings-page">
  <div class="settings-header">
    <h2 class="settings-title">Settings</h2>
    <p class="settings-subtitle">App preferences and configuration.</p>
  </div>

  <!-- Notifications -->
  <div class="settings-section">
    <div class="section-label">Notifications</div>
    <div class="settings-card">
      <div class="notif-option">
        <span>Block transitions</span>
        <div class="toggle" class:on={transitionsOn} onclick={() => transitionsOn = !transitionsOn}></div>
      </div>
      <div class="notif-option">
        <span>5-min warnings</span>
        <div class="toggle" class:on={warningsOn} onclick={() => warningsOn = !warningsOn}></div>
      </div>
    </div>
  </div>

  <!-- Danger Zone -->
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
    max-width: 600px;
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

  /* ─── Card ─────────────────────────────────────────────────── */
  .settings-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  /* ─── Notifications ─────────────────────────────────────────── */
  .notif-option {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 15px;
    color: var(--text-mid);
  }

  .toggle {
    width: 36px;
    height: 20px;
    background: var(--border);
    border-radius: 100px;
    position: relative;
    cursor: pointer;
    transition: background 0.2s;
  }

  .toggle.on {
    background: var(--amber);
  }

  .toggle::after {
    content: '';
    position: absolute;
    width: 14px;
    height: 14px;
    background: white;
    border-radius: 50%;
    top: 3px;
    left: 3px;
    transition: transform 0.2s;
  }

  .toggle.on::after {
    transform: translateX(16px);
  }

  /* ─── Danger Zone ──────────────────────────────────────────── */
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

  .grade-cancel {
    font-family: 'DM Sans', sans-serif;
    font-size: 12px;
    color: var(--text-dim);
    background: none;
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 6px 14px;
    cursor: pointer;
  }

  .grade-cancel:hover {
    color: var(--text-mid);
    border-color: var(--text-dim);
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
</style>
