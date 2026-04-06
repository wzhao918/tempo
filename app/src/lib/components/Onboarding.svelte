<script>
  import { completeOnboarding } from '$lib/scheduleStore.svelte.js';
  import { createTemplate, addBlocksToTemplate } from '$lib/db.js';
  import TemplateEditor from './TemplateEditor.svelte';

  let step = $state(1);
  let wakeTime = $state('07:00');
  let bedTime = $state('23:00');
  let includeMeals = $state(true);
  let lunchTime = $state('12:30');
  let dinnerTime = $state('18:00');
  let saving = $state(false);

  let generatedBlocks = $state([]);
  let editorRef = $state(null);

  function addMins(timeStr, mins) {
    const [h, m] = timeStr.split(':').map(Number);
    const total = (h * 60 + m + mins) % (24 * 60);
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  }

  function generateBlocks() {
    const blocks = [];

    // Morning focus block: starts at wake time, 2 hours
    blocks.push({
      name: 'Morning Focus',
      emoji: '',
      type: 'work',
      start: wakeTime,
      end: addMins(wakeTime, 120),
      note: '',
    });

    if (includeMeals) {
      // Lunch: 1 hour at the specified time
      blocks.push({
        name: 'Lunch',
        emoji: '',
        type: 'open',
        start: lunchTime,
        end: addMins(lunchTime, 60),
        note: '',
      });

      // Afternoon focus: starts 1hr after lunch, 2 hours
      const afternoonStart = addMins(lunchTime, 120);
      blocks.push({
        name: 'Afternoon Focus',
        emoji: '',
        type: 'work',
        start: afternoonStart,
        end: addMins(afternoonStart, 120),
        note: '',
      });

      // Dinner: 1 hour at the specified time
      blocks.push({
        name: 'Dinner',
        emoji: '',
        type: 'open',
        start: dinnerTime,
        end: addMins(dinnerTime, 60),
        note: '',
      });
    } else {
      // No meals — just add an afternoon block
      const [wh] = wakeTime.split(':').map(Number);
      const afternoonStart = `${String(wh + 4).padStart(2, '0')}:00`;
      blocks.push({
        name: 'Afternoon Focus',
        emoji: '',
        type: 'work',
        start: afternoonStart,
        end: addMins(afternoonStart, 120),
        note: '',
      });
    }

    // Wind down: 2 hours before bed
    blocks.push({
      name: 'Wind Down',
      emoji: '',
      type: 'rest',
      start: addMins(bedTime, -120),
      end: bedTime,
      note: '',
    });

    // Sleep block (bed → wake, crosses midnight)
    blocks.push({
      name: 'Sleep',
      emoji: '',
      type: 'rest',
      start: bedTime,
      end: wakeTime,
      note: '',
    });

    return blocks;
  }

  function goToEditor() {
    generatedBlocks = generateBlocks();
    step = 4;
    // After DOM update, push blocks into the editor
    setTimeout(() => {
      if (editorRef) {
        editorRef.setBlocks(generatedBlocks);
      }
    }, 50);
  }

  async function handleSave(editedBlocks) {
    saving = true;
    try {
      const templateId = await createTemplate('My Schedule');
      // Map editing format to DB format
      const dbBlocks = editedBlocks.map(b => ({
        name: b.name,
        emoji: b.emoji,
        type: b.type,
        start: b.start,
        end: b.end,
        note: b.note,
      }));
      await addBlocksToTemplate(templateId, dbBlocks);
      await completeOnboarding(templateId);
    } finally {
      saving = false;
    }
  }
</script>

<div class="onboarding">
  {#if step === 1}
    <div class="onboarding-card">
      <div class="welcome-icon">🎯</div>
      <h1 class="welcome-title">Welcome to Tempo</h1>
      <p class="welcome-text">
        Your day, structured. Set up your daily schedule and Tempo will
        keep you on track with live progress and gentle nudges.
      </p>
      <button class="primary-btn" onclick={() => step = 2}>
        Get Started
      </button>
    </div>

  {:else if step === 2}
    <div class="onboarding-card">
      <h2 class="step-title">When does your day start and end?</h2>
      <p class="step-text">We'll build your schedule between these bookends.</p>

      <div class="time-fields">
        <div class="time-field">
          <label>Wake up</label>
          <input type="time" bind:value={wakeTime} />
        </div>
        <div class="time-divider">to</div>
        <div class="time-field">
          <label>Wind down</label>
          <input type="time" bind:value={bedTime} />
        </div>
      </div>

      <div class="step-actions">
        <button class="secondary-btn" onclick={() => step = 1}>Back</button>
        <button class="primary-btn" onclick={() => step = 3}>Next</button>
      </div>
    </div>

  {:else if step === 3}
    <div class="onboarding-card">
      <h2 class="step-title">Do you want to schedule meals?</h2>
      <p class="step-text">We can add lunch and dinner breaks to your day.</p>

      <div class="meal-toggle">
        <button
          class="toggle-btn"
          class:active={includeMeals}
          onclick={() => includeMeals = true}
        >Yes, add meals</button>
        <button
          class="toggle-btn"
          class:active={!includeMeals}
          onclick={() => includeMeals = false}
        >Skip meals</button>
      </div>

      {#if includeMeals}
        <div class="time-fields">
          <div class="time-field">
            <label>Lunch</label>
            <input type="time" bind:value={lunchTime} />
          </div>
          <div class="time-field">
            <label>Dinner</label>
            <input type="time" bind:value={dinnerTime} />
          </div>
        </div>
      {/if}

      <div class="step-actions">
        <button class="secondary-btn" onclick={() => step = 2}>Back</button>
        <button class="primary-btn" onclick={goToEditor}>Generate Schedule</button>
      </div>
    </div>

  {:else if step === 4}
    <div class="onboarding-editor">
      <h2 class="step-title">Review your schedule</h2>
      <p class="step-text">Tweak the blocks below, then save to start using Tempo.</p>

      <TemplateEditor
        bind:this={editorRef}
        initialBlocks={generatedBlocks}
        onSave={handleSave}
        saveLabel="Save & Start"
      />

      <div class="back-link">
        <button class="secondary-btn" onclick={() => step = 3}>Back to setup</button>
      </div>
    </div>
  {/if}
</div>

<style>
  .onboarding {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 80vh;
    padding: 40px;
  }

  .onboarding-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 48px;
    max-width: 480px;
    width: 100%;
    text-align: center;
  }

  .onboarding-editor {
    max-width: 760px;
    width: 100%;
  }

  .welcome-icon {
    font-size: 48px;
    margin-bottom: 20px;
  }

  .welcome-title {
    font-family: 'Instrument Serif', serif;
    font-size: 36px;
    font-weight: 400;
    color: var(--text);
    margin-bottom: 16px;
  }

  .welcome-text {
    font-size: 15px;
    color: var(--text-mid);
    line-height: 1.6;
    margin-bottom: 32px;
  }

  .step-title {
    font-family: 'Instrument Serif', serif;
    font-size: 24px;
    font-weight: 400;
    color: var(--text);
    margin-bottom: 8px;
  }

  .step-text {
    font-size: 14px;
    color: var(--text-dim);
    margin-bottom: 28px;
  }

  .time-fields {
    display: flex;
    align-items: end;
    gap: 16px;
    justify-content: center;
    margin-bottom: 32px;
  }

  .time-field label {
    display: block;
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-dim);
    margin-bottom: 6px;
    text-align: left;
  }

  .time-field input[type="time"] {
    padding: 10px 14px;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--text);
    font-family: 'DM Mono', monospace;
    font-size: 16px;
    outline: none;
    transition: border-color 0.2s;
  }

  .time-field input[type="time"]:focus {
    border-color: var(--amber);
  }

  .time-divider {
    font-size: 14px;
    color: var(--text-dim);
    padding-bottom: 12px;
  }

  .meal-toggle {
    display: flex;
    gap: 8px;
    justify-content: center;
    margin-bottom: 24px;
  }

  .toggle-btn {
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    color: var(--text-dim);
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 8px 20px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .toggle-btn.active {
    color: var(--amber);
    border-color: var(--amber-dim);
    background: var(--amber-glow);
  }

  .step-actions {
    display: flex;
    justify-content: center;
    gap: 12px;
  }

  .primary-btn {
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    font-weight: 500;
    color: var(--bg);
    background: var(--amber);
    border: none;
    border-radius: 8px;
    padding: 12px 32px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .primary-btn:hover {
    filter: brightness(1.1);
  }

  .secondary-btn {
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    color: var(--text-dim);
    background: none;
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 10px 24px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .secondary-btn:hover {
    color: var(--text-mid);
    border-color: var(--text-dim);
  }

  .back-link {
    margin-top: 20px;
    text-align: center;
  }
</style>
