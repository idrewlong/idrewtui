<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'

/**
 * Shared dialog chrome for help, the command palette, and the pager.
 * Focus is trapped while open and restored to the trigger on close.
 */
const props = withDefaults(defineProps<{
  open: boolean
  title: string
  titleId: string
  closeLabel?: string
  size?: 'default' | 'wide' | 'pager'
}>(), { size: 'default', closeLabel: '' })

const emit = defineEmits<{ close: [] }>()

const dialog = ref<HTMLElement | null>(null)
const closeButton = ref<HTMLButtonElement | null>(null)
let lastFocused: HTMLElement | null = null

watch(() => props.open, async (isOpen) => {
  if (isOpen) {
    lastFocused = document.activeElement as HTMLElement | null
    await nextTick()
    const preferred = dialog.value?.querySelector<HTMLElement>('[data-overlay-focus]')
    ;(preferred ?? closeButton.value)?.focus()
  }
  else {
    lastFocused?.focus()
    lastFocused = null
  }
})

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.stopPropagation()
    event.preventDefault()
    emit('close')
    return
  }

  if (event.key !== 'Tab' || !dialog.value) return

  const focusable = dialog.value.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
  )
  if (focusable.length === 0) return

  const first = focusable[0]!
  const last = focusable[focusable.length - 1]!
  const active = document.activeElement

  if (event.shiftKey && active === first) {
    event.preventDefault()
    last.focus()
  }
  else if (!event.shiftKey && active === last) {
    event.preventDefault()
    first.focus()
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="backdrop"
      @click.self="emit('close')"
      @keydown="onKeydown"
    >
      <div
        ref="dialog"
        class="dialog"
        :class="`dialog--${size}`"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
      >
        <div class="dialog__head">
          <h2 :id="titleId" class="dialog__title">{{ title }}</h2>
          <button ref="closeButton" type="button" class="dialog__close" @click="emit('close')">
            <span aria-hidden="true">esc</span>
            <span class="visually-hidden">Close {{ closeLabel || title }}</span>
          </button>
        </div>
        <slot />
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: color-mix(in srgb, var(--bg) 82%, transparent);
  z-index: 50;
}

.dialog {
  width: min(44ch, 100%);
  max-height: 85vh;
  overflow-y: auto;
  border: 1px solid var(--line);
  background: var(--surface);
  padding: 1.25rem;
}

.dialog--wide { width: min(56ch, 100%); }
.dialog--pager { width: min(72ch, 100%); }

.dialog__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.dialog__title { color: var(--accent); }

.dialog__close {
  color: var(--muted);
  border: 1px solid var(--line);
  padding: 0 0.5ch;
  min-width: 1.5rem;
  min-height: 1.5rem;
}
.dialog__close:hover { color: var(--fg); }
</style>
