import { onBeforeUnmount, onMounted, ref } from 'vue'
import { pushSample } from './useFrameRate'

interface ChromeMemory { usedJSHeapSize: number }

/** Bytes to whole megabytes, rounded. */
export function bytesToMb(bytes: number): number {
  return Math.round(bytes / 1048576)
}

/**
 * JS heap usage, sampled over time. Chromium only — Safari and Firefox do not
 * expose `performance.memory`, and `supported` stays false there so the panel
 * can say so honestly.
 *
 * This deliberately isn't a percentage bar. There is no meaningful "capacity"
 * for a JS heap to be a fraction of: against `jsHeapSizeLimit` (the ceiling,
 * ~4000MB) a small SPA's usage rounds to 0% forever, and against
 * `totalJSHeapSize` (what's allocated) usage tracks allocation so closely
 * that it pins near 100% instead — both are decorative, and a bar that always
 * reads full is worse than one that always reads empty, because it implies
 * memory pressure that isn't there. What's actually informative is how the
 * absolute used-heap figure *moves* — growth, and the sawtooth of garbage
 * collection — so this samples `usedJSHeapSize` into a rolling window exactly
 * like `useFrameRate` samples fps, and the panel renders it as a sparkline.
 *
 * Polling pauses while the tab is hidden — there is no point spending a timer
 * on a value nobody can see — and, like the frame-rate meter, never starts at
 * all under `prefers-reduced-motion: reduce`. `supported` reflects only
 * whether the API exists; when reduced motion suppresses polling, `usedMb`
 * and `history` simply stay at their pre-mount `null`/empty values, and the
 * panel is expected to render that as "no reading" rather than folding it
 * into "unsupported".
 */
export function useMemoryMeter(intervalMs = 2000, samples = 24) {
  const usedMb = ref<number | null>(null)
  const history = ref<number[]>([])
  const supported = ref(false)
  let timer: ReturnType<typeof setInterval> | undefined

  function read() {
    const mem = (performance as Performance & { memory?: ChromeMemory }).memory
    if (!mem) return
    usedMb.value = bytesToMb(mem.usedJSHeapSize)
    history.value = pushSample(history.value, usedMb.value, samples)
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

  return { usedMb, history, supported }
}
