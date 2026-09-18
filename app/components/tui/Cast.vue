<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import {
  duration,
  outputUpTo,
  parseCast,
  stripAnsi,
  type CastFile,
} from '~/utils/cast'

/**
 * Tiny asciinema v2 player. No dependency, no fake recordings — only renders
 * when a project actually ships a `.cast` file.
 */
const props = defineProps<{ src: string }>()

const cast = ref<CastFile | null>(null)
const failed = ref(false)
const playing = ref(false)
const output = ref('')
let raf = 0

const reduced = computed(() => {
  if (import.meta.server) return true
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
})

function show(file: CastFile, time: number) {
  output.value = stripAnsi(outputUpTo(file.events, time))
}

function stop() {
  playing.value = false
  if (raf) cancelAnimationFrame(raf)
  raf = 0
}

function play() {
  const file = cast.value
  if (!file) return

  const end = duration(file.events)
  if (reduced.value || end === 0) {
    show(file, end)
    return
  }

  stop()
  playing.value = true
  const started = performance.now()

  const tick = (now: number) => {
    if (!playing.value || !cast.value) return
    const time = Math.min(end, (now - started) / 1000)
    show(cast.value, time)
    if (time >= end) {
      playing.value = false
      return
    }
    raf = requestAnimationFrame(tick)
  }

  raf = requestAnimationFrame(tick)
}

watch(() => props.src, async (src) => {
  stop()
  cast.value = null
  failed.value = false
  output.value = ''
  if (!src) return

  try {
    const response = await fetch(src)
    if (!response.ok) throw new Error(String(response.status))
    const file = parseCast(await response.text())
    cast.value = file
    show(file, reduced.value ? duration(file.events) : 0)
  }
  catch {
    failed.value = true
  }
}, { immediate: true })

onBeforeUnmount(stop)
</script>

<template>
  <div v-if="cast && !failed" class="cast">
    <pre class="cast__out" aria-live="off">{{ output }}</pre>
    <button type="button" class="cast__play" :aria-pressed="playing" @click="playing ? stop() : play()">
      {{ playing ? '[ pause ]' : '[ play ]' }}
    </button>
  </div>
</template>

<style scoped>
.cast { margin-top: 0.75rem; }

.cast__out {
  margin: 0;
  padding: 0.5rem 1ch;
  border: 1px solid var(--line);
  background: var(--bg);
  color: var(--fg);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  min-height: 4rem;
  max-height: 16rem;
  overflow: auto;
  font: inherit;
}

.cast__play {
  margin-top: 0.35rem;
  color: var(--accent);
  border: 1px solid var(--line);
  padding: 0 0.6ch;
  min-height: 1.5rem;
}
.cast__play:hover { border-color: var(--accent); }
</style>
