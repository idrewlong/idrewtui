import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

interface ChromeMemory { usedJSHeapSize: number, totalJSHeapSize: number }

/**
 * JS heap usage. Chromium only — Safari and Firefox do not expose it, and
 * `supported` stays false there so the panel can say so honestly.
 *
 * The denominator is `totalJSHeapSize` — what V8 has actually allocated so
 * far — not `jsHeapSizeLimit`, the ceiling: for any small SPA, used-against-
 * the-limit rounds to 0% forever and the bar never moves, which is decorative
 * even though it isn't fabricated. used/total is still a genuinely measured
 * ratio, it actually moves as the page allocates, and it's honestly labelled
 * as allocation pressure rather than distance to a ceiling.
 *
 * Polling pauses while the tab is hidden — there is no point spending a timer
 * on a value nobody can see — and, like the frame-rate meter, never starts at
 * all under `prefers-reduced-motion: reduce`, so it never ticks against a
 * stated preference. `supported` reflects only whether the API exists; when
 * reduced motion suppresses polling, `usedMb`/`totalMb` simply stay at their
 * pre-mount `null`, and the panel is expected to render that as "no reading"
 * rather than folding it into "unsupported".
 */
export function useMemoryMeter(intervalMs = 2000) {
  const usedMb = ref<number | null>(null)
  const totalMb = ref<number | null>(null)
  const supported = ref(false)
  let timer: ReturnType<typeof setInterval> | undefined

  const fraction = computed(() =>
    usedMb.value !== null && totalMb.value ? usedMb.value / totalMb.value : 0)

  function read() {
    const mem = (performance as Performance & { memory?: ChromeMemory }).memory
    if (!mem) return
    usedMb.value = Math.round(mem.usedJSHeapSize / 1048576)
    totalMb.value = Math.round(mem.totalJSHeapSize / 1048576)
  }

  function stopPolling() {
    clearInterval(timer)
    timer = undefined
  }

  function startPolling() {
    if (timer) return
    read()
    timer = setInterval(read, intervalMs)
  }

  function onVisibility() {
    if (document.hidden) stopPolling()
    else startPolling()
  }

  onMounted(() => {
    supported.value = 'memory' in performance
    if (!supported.value) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    document.addEventListener('visibilitychange', onVisibility)
    startPolling()
  })

  onBeforeUnmount(() => {
    document.removeEventListener('visibilitychange', onVisibility)
    stopPolling()
  })

  return { usedMb, totalMb, fraction, supported }
}
