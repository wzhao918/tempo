<script>
  import { timeToMinutes, minutesToDisplay, formatDuration, getBlockColor, getBlockDuration, getBlockProgress } from '$lib/schedule.js';
  import { gradeBlock } from '$lib/scheduleStore.svelte.js';

  let { block, index, currentIdx, nowMins } = $props();

  let startMins = $derived(timeToMinutes(block.start));
  let endMins = $derived(timeToMinutes(block.end));
  let duration = $derived(getBlockDuration(block));
  let color = $derived(getBlockColor(block.type));

  let crossesMidnight = $derived(endMins <= startMins);
  let isActive = $derived(currentIdx >= 0 && index === currentIdx);
  let isPast = $derived(!crossesMidnight && endMins <= nowMins && !isActive);
  let distance = $derived(currentIdx >= 0 ? Math.abs(index - currentIdx) : 999);
  let isCollapsed = $derived(currentIdx >= 0 && distance > 2);
  let isGraded = $derived(block.grade !== null && block.grade !== undefined);
  let needsGrading = $derived(isPast && !isGraded && block.type !== 'rest');

  let progress = $derived(isActive ? getBlockProgress(block, nowMins) : 0);

  // Grading state
  let showGradeForm = $state(false);
  let selectedGrade = $state(5);
  let gradeNote = $state('');
  let saving = $state(false);

  async function submitGrade() {
    saving = true;
    try {
      await gradeBlock(block.id, selectedGrade, gradeNote);
      showGradeForm = false;
      gradeNote = '';
    } finally {
      saving = false;
    }
  }
</script>

<div class="block-item" class:active={isActive} class:past={isPast} class:collapsed={isCollapsed} class:needs-grading={needsGrading} class:graded={isGraded}>
  <div class="block-card">
    <div class="block-header">
      <div class="block-name">{block.name}</div>
      <div class="block-header-right">
        {#if isGraded}
          <div class="grade-badge" class:grade-high={block.grade >= 8} class:grade-mid={block.grade >= 5 && block.grade < 8} class:grade-low={block.grade < 5}>
            {block.grade}/10
          </div>
        {/if}
        <div class="block-time">{minutesToDisplay(startMins % (24*60))} – {minutesToDisplay(endMins % (24*60))}</div>
      </div>
    </div>
    <div class="block-duration color-{color}">
      {formatDuration(duration)} · <span class="block-note">{block.note}</span>
    </div>

    {#if isActive}
      <div class="block-progress">
        <div class="block-progress-fill" style="width: {progress}%"></div>
      </div>
    {/if}

    {#if isGraded && block.gradeNote}
      <div class="grade-note-display">{block.gradeNote}</div>
    {/if}

    {#if needsGrading && !showGradeForm}
      <button class="grade-prompt" onclick={() => showGradeForm = true}>
        Rate this block
      </button>
    {/if}

    {#if showGradeForm}
      <div class="grade-form">
        <div class="grade-slider-row">
          <span class="grade-label">Grade</span>
          <input
            type="range"
            min="1"
            max="10"
            bind:value={selectedGrade}
            class="grade-slider"
          />
          <span class="grade-value" class:grade-high={selectedGrade >= 8} class:grade-mid={selectedGrade >= 5 && selectedGrade < 8} class:grade-low={selectedGrade < 5}>
            {selectedGrade}
          </span>
        </div>
        <input
          type="text"
          class="grade-note-input"
          placeholder="How did it go? (optional)"
          bind:value={gradeNote}
          onkeydown={(e) => e.key === 'Enter' && submitGrade()}
        />
        <div class="grade-actions">
          <button class="grade-cancel" onclick={() => showGradeForm = false}>Cancel</button>
          <button class="grade-submit" onclick={submitGrade} disabled={saving}>
            {saving ? '...' : 'Submit'}
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .block-item {
    position: relative;
    padding: 0 0 4px 24px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .block-item::before {
    content: '';
    position: absolute;
    left: -4px;
    top: 10px;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: var(--border);
    border: 2px solid var(--bg);
    transition: all 0.2s;
  }

  .block-item.active::before {
    background: var(--amber);
    box-shadow: 0 0 12px var(--amber);
    width: 11px;
    height: 11px;
    left: -5px;
  }

  .block-item.past::before {
    background: var(--green);
  }

  .block-item.needs-grading::before {
    background: var(--amber);
    animation: pulse 2s ease-in-out infinite;
  }

  .block-item.graded::before {
    background: var(--green);
  }

  .block-item.past .block-card {
    opacity: 0.45;
  }

  .block-item.needs-grading .block-card {
    opacity: 0.85;
    border-color: var(--amber-dim);
  }

  .block-item.graded .block-card {
    opacity: 0.55;
  }

  .block-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 16px 18px;
    margin-bottom: 8px;
    transition: all 0.2s;
    position: relative;
    overflow: hidden;
  }

  .block-card:hover {
    border-color: var(--text-dim);
    background: var(--surface2);
  }

  .block-item.active .block-card {
    border-color: var(--amber-dim);
    background: var(--surface2);
  }

  .block-item.active .block-card::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: var(--amber);
    border-radius: 3px 0 0 3px;
  }

  .block-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }

  .block-header-right {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .block-name {
    font-size: 16px;
    font-weight: 500;
    color: var(--text);
  }

  .block-time {
    font-family: 'DM Mono', monospace;
    font-size: 13px;
    color: var(--text-dim);
  }

  .block-duration {
    font-size: 13px;
    margin-top: 2px;
  }

  .block-note {
    color: var(--text-dim);
  }

  .block-progress {
    margin-top: 10px;
    height: 2px;
    background: var(--border);
    border-radius: 2px;
    overflow: hidden;
  }

  .block-progress-fill {
    height: 100%;
    background: var(--amber);
    border-radius: 2px;
    transition: width 1s linear;
  }

  /* ─── Grade Badge ─────────────────────────────────────────── */
  .grade-badge {
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    font-weight: 500;
    padding: 2px 8px;
    border-radius: 4px;
    background: var(--surface2);
    border: 1px solid var(--border);
  }

  .grade-badge.grade-high { color: var(--green); border-color: rgba(92, 184, 122, 0.3); }
  .grade-badge.grade-mid { color: var(--amber); border-color: var(--amber-dim); }
  .grade-badge.grade-low { color: #e87a44; border-color: rgba(232, 122, 68, 0.3); }

  /* ─── Grade Prompt ────────────────────────────────────────── */
  .grade-prompt {
    margin-top: 10px;
    width: 100%;
    padding: 8px;
    background: var(--amber-glow);
    border: 1px dashed var(--amber-dim);
    border-radius: 6px;
    color: var(--amber);
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .grade-prompt:hover {
    background: rgba(232, 168, 68, 0.2);
    border-style: solid;
  }

  /* ─── Grade Form ──────────────────────────────────────────── */
  .grade-form {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--border);
  }

  .grade-slider-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 10px;
  }

  .grade-label {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: var(--text-dim);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    min-width: 40px;
  }

  .grade-slider {
    flex: 1;
    -webkit-appearance: none;
    appearance: none;
    height: 4px;
    background: var(--border);
    border-radius: 2px;
    outline: none;
  }

  .grade-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--amber);
    cursor: pointer;
    border: 2px solid var(--bg);
    box-shadow: 0 0 6px rgba(232, 168, 68, 0.4);
  }

  .grade-value {
    font-family: 'DM Mono', monospace;
    font-size: 20px;
    font-weight: 500;
    min-width: 28px;
    text-align: center;
  }

  .grade-value.grade-high { color: var(--green); }
  .grade-value.grade-mid { color: var(--amber); }
  .grade-value.grade-low { color: #e87a44; }

  .grade-note-input {
    width: 100%;
    padding: 8px 10px;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 6px;
    color: var(--text);
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    outline: none;
    margin-bottom: 10px;
  }

  .grade-note-input:focus {
    border-color: var(--amber);
  }

  .grade-note-input::placeholder {
    color: var(--text-dim);
  }

  .grade-actions {
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

  .grade-submit {
    font-family: 'DM Sans', sans-serif;
    font-size: 12px;
    font-weight: 500;
    color: var(--bg);
    background: var(--amber);
    border: none;
    border-radius: 6px;
    padding: 6px 14px;
    cursor: pointer;
  }

  .grade-submit:hover:not(:disabled) {
    filter: brightness(1.1);
  }

  .grade-submit:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* ─── Grade Note Display (after grading) ──────────────────── */
  .grade-note-display {
    font-size: 12px;
    color: var(--text-dim);
    font-style: italic;
    margin-top: 6px;
    padding-left: 2px;
  }

  /* ─── Collapsed blocks ────────────────────────────────────── */
  .block-item.collapsed .block-card {
    padding: 8px 18px;
    display: flex;
    align-items: center;
    gap: 0;
  }

  .block-item.collapsed .block-header {
    margin-bottom: 0;
    flex: 1;
  }

  .block-item.collapsed .block-name {
    font-size: 14px;
    color: var(--text-dim);
  }

  .block-item.collapsed .block-time {
    font-size: 12px;
  }

  .block-item.collapsed .block-duration,
  .block-item.collapsed .block-progress,
  .block-item.collapsed .grade-prompt,
  .block-item.collapsed .grade-form,
  .block-item.collapsed .grade-note-display {
    display: none;
  }
</style>
