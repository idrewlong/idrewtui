<script setup lang="ts">
import { computed, ref } from 'vue'
import { useOverlay } from '~/composables/useOverlay'

const overlay = useOverlay()
const body = ref<HTMLElement | null>(null)

const open = computed(() => overlay.mode.value === 'pager')
const title = computed(() => overlay.pager.value === 'man' ? 'man idrew' : 'less ~/resume')

function scroll(position: 'top' | 'bottom' | number) {
  const el = body.value
  if (!el) return
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const behavior = reduced ? 'auto' : 'smooth'
  if (position === 'top') {
    el.scrollTo({ top: 0, behavior })
    return
  }
  if (position === 'bottom') {
    el.scrollTo({ top: el.scrollHeight, behavior })
    return
  }
  el.scrollBy({ top: position, behavior })
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'q') {
    event.preventDefault()
    overlay.close()
    return
  }
  if (event.key === 'j' || event.key === 'ArrowDown') {
    event.preventDefault()
    scroll(48)
    return
  }
  if (event.key === 'k' || event.key === 'ArrowUp') {
    event.preventDefault()
    scroll(-48)
    return
  }
  if (event.key === 'g') {
    event.preventDefault()
    scroll('top')
    return
  }
  if (event.key === 'G') {
    event.preventDefault()
    scroll('bottom')
  }
}
</script>

<template>
  <TuiOverlay
    :open="open"
    :title="title"
    title-id="pager-title"
    size="pager"
    @close="overlay.close()"
  >
    <div ref="body" class="pager" tabindex="0" data-overlay-focus @keydown="onKeydown">
      <ViewsManPage v-if="overlay.pager.value === 'man'" />
      <ViewsResumeDoc v-else />
    </div>
  </TuiOverlay>
</template>

<style scoped>
.pager {
  max-height: 70vh;
  overflow-y: auto;
  outline: none;
}
</style>
