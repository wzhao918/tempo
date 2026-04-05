<script>
  import { store, saveBlock, addBlock, removeBlock } from '$lib/scheduleStore.svelte.js';
  import TemplateEditor from './TemplateEditor.svelte';

  async function handleSave(editedBlocks, removedIds) {
    // Remove deleted blocks
    for (const id of removedIds) {
      await removeBlock(id);
    }

    // Update existing blocks and add new ones
    for (let i = 0; i < editedBlocks.length; i++) {
      const block = editedBlocks[i];
      if (block.isNew) {
        await addBlock({
          name: block.name,
          emoji: block.emoji,
          type: block.type,
          start: block.start,
          end: block.end,
          note: block.note,
        });
      } else if (block.id) {
        await saveBlock(block.id, {
          name: block.name,
          emoji: block.emoji,
          type: block.type,
          start: block.start,
          end: block.end,
          note: block.note,
        });
      }
    }
  }
</script>

<div class="settings-page">
  <div class="settings-header">
    <h2 class="settings-title">Settings</h2>
    <p class="settings-subtitle">Edit your daily schedule template. Changes apply to future days.</p>
  </div>

  <div class="settings-section">
    <div class="section-label">Schedule Template</div>
    <TemplateEditor initialBlocks={store.blocks} onSave={handleSave} />
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
</style>
