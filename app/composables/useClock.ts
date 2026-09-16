import { onBeforeUnmount, onMounted, ref } from 'vue'

/**
 * Wall clock, HH:MM:SS, in the visitor's own timezone.
 *
 * Reads once on mount regardless of motion preference — a static clock is a
 * genuine, honest reading, just not a live one. The per-second interval that
 * keeps it ticking is skipped under `prefers-reduced-motion: reduce`, the same
 * ruling applied to the heap poller and the uptime ticker: a 1s timer counts
 * as motion for this project.
 */
export function useClock() {
  const time = ref('--:--:--')
  let timer: ReturnType<typeof setInterval> | undefined

  function read() {
    time.value = new Date().toLocaleTimeString('en-GB', { hour12: false })
  }

  onMounted(() => {
    read()
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      timer = setInterval(read, 1000)
    }
  })

  onBeforeUnmount(() => clearInterval(timer))

  return { time }
}
