<script setup lang="ts">
import { computed, watch } from 'vue'
import { useOverlay } from '~/composables/useOverlay'
import { useFind } from '~/composables/useFind'

const overlay = useOverlay()
const find = useFind()

const open = computed(() => overlay.mode.value === 'find')

watch(open, (isOpen) => {
  if (isOpen) find.focusInput()
})

function onInput(event: Event) {
  const value = (event.target as HTMLInputElement).value
  find.run(value)
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    find.close()
    return
  }
  if (event.key === 'Enter') {
    event.preventDefault()
    if (!find.query.value.trim()) {
      find.close()
      return
    }
    if (event.shiftKey) find.prev()
    else find.next()
  }
}
</script>

<template>
  <div v-if="open" data-find-bar class="find js-only">
    <label class="visually-hidden" for="find-input">Find in page</label>
    <span class="find__prompt" aria-hidden="true">/</span>
    <input
      id="find-input"
      :value="find.query.value"
      type="search"
      class="find__input"
      autocomplete="off"
      spellcheck="false"
      placeholder="find"
      @input="onInput"
      @keydown="onKeydown"
    >
    <span class="find__count" aria-hidden="true">
      <template v-if="find.query.value.trim()">
        {{ find.count.value === 0 ? '0/0' : `${find.current.value + 1}/${find.count.value}` }}
      </template>
    </span>
    <button type="button" class="find__btn" @click="find.next()">
      <span aria-hidden="true">n</span>
      <span class="visually-hidden">Next match</span>
    </button>
    <button type="button" class="find__btn" @click="find.prev()">
      <span aria-hidden="true">N</span>
      <span class="visually-hidden">Previous match</span>
    </button>
    <button type="button" class="find__btn" @click="find.close()">
      esc<span class="visually-hidden"> close find</span>
    </button>
    <span class="visually-hidden" role="status" aria-live="polite">{{ find.announcement.value }}</span>
  </div>
</template>

<style scoped>
.find {
  display: flex;
  align-items: center;
  gap: 0.5ch;
  margin-bottom: 0.75rem;
  border: 1px solid var(--line);
  padding: 0.25rem 0.5ch;
  background: var(--bg);
}

.find__prompt { color: var(--accent); font-weight: 600; }

.find__input {
  flex: 1;
  min-width: 0;
  font: inherit;
  color: var(--fg);
  background: transparent;
  border: 0;
  padding: 0.15rem 0;
}

.find__count {
  color: var(--muted);
  font-size: var(--text-status);
  min-width: 6ch;
  text-align: right;
}

.find__btn {
  color: var(--muted);
  border: 1px solid var(--line);
  padding: 0 0.5ch;
  min-width: 1.5rem;
  min-height: 1.5rem;
}
.find__btn:hover { color: var(--fg); }
</style>
