import { onBeforeUnmount, onMounted, ref } from 'vue'

/** Append `value`, keeping at most `max` samples. Pure; never mutates. */
export function pushSample(history: number[], value: number, max: number): number[] {
  return [...history, value].slice(-max)
}

/**
 * Real frame rate, measured by counting requestAnimationFrame callbacks over a
 * one-second window. This is one of the few genuinely live signals the browser
 * offers, which is why it earns a place in the meters panel.
 *
 * Pauses when the tab is hidden (a backgrounded tab is throttled to ~1fps and
 * would otherwise show a misleading crash) and freezes under reduced motion —
 * in that case it never starts, so `fps`/`history` stay at their zero/empty
 * initial values and the panel renders `—`.
 */
export function useFrameRate(samples = 24) {
  const fps = ref(0)
  const history = ref<number[]>([])

  let raf = 0
  let frames = 0
  let windowStart = 0
  let running = false

  function tick(now: number) {
    if (!running) return
    frames++
    if (now - windowStart >= 1000) {
      fps.value = Math.round((frames * 1000) / (now - windowStart))
      history.value = pushSample(history.value, fps.value, samples)
      frames = 0
      windowStart = now
    }
    raf = requestAnimationFrame(tick)
  }

  function start() {
    if (running) return
    running = true
    frames = 0
    windowStart = performance.now()
    raf = requestAnimationFrame(tick)
  }

  function stop() {
    running = false
    cancelAnimationFrame(raf)
  }

  function onVisibility() {
    if (document.hidden) stop()
    else start()
  }

  onMounted(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    document.addEventListener('visibilitychange', onVisibility)
    start()
  })

  onBeforeUnmount(() => {
    document.removeEventListener('visibilitychange', onVisibility)
    stop()
  })

  return { fps, history, supported: true }
}
