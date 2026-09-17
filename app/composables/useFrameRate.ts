import { onBeforeUnmount, onMounted, ref } from 'vue'

/** Append `value`, keeping at most `max` samples. Pure; never mutates. */
export function pushSample(history: number[], value: number, max: number): number[] {
  return [...history, value].slice(-max)
}

/**
 * Render helper: distinguishes "no sample has landed yet" (`null`) from a
 * genuine 0fps reading. A main thread blocked for a full measurement window
 * produces a real, measured `0` — that's the no-fabrication rule running
 * backwards: hiding a real bad reading would be worse than showing it.
 */
export function formatFps(fps: number | null): string {
  return fps === null ? '—' : String(fps)
}

/**
 * Same "no fabrication, no fake precision" rule as `formatFps`, for the
 * per-window worst-frame-time reading.
 */
export function formatFrameTime(ms: number | null): string {
  return ms === null ? '—' : `${ms}ms`
}

/**
 * Real frame rate, measured by counting requestAnimationFrame callbacks over a
 * one-second window. This is one of the few genuinely live signals the browser
 * offers, which is why it earns a place in the meters panel.
 *
 * Pauses when the tab is hidden (a backgrounded tab is throttled to ~1fps and
 * would otherwise show a misleading crash) and freezes under reduced motion —
 * in that case it never starts, so `fps` stays `null` (no sample yet — see
 * `formatFps`) and `history` stays empty.
 *
 * `frameTime`/`frameTimeHistory` are derived from the exact same rAF
 * callbacks — no second loop. fps is nearly always pinned at the display's
 * refresh rate, so it graphs as a flat line; the gap between one rAF
 * callback and the next (in milliseconds) sits near 16.7ms at 60Hz and
 * spikes visibly when the main thread stalls, which makes it the more
 * useful shape to plot. Each one-second window keeps the *worst* (largest)
 * gap seen, not an average: averaging would smooth a real stall away, which
 * is exactly the fabrication-by-omission this project forbids. An idle page
 * legitimately renders a flat ~16.7ms line — that is an honest reading, not
 * missing jitter.
 */
export function useFrameRate(samples = 24) {
  const fps = ref<number | null>(null)
  const history = ref<number[]>([])
  const frameTime = ref<number | null>(null)
  const frameTimeHistory = ref<number[]>([])

  let raf = 0
  let frames = 0
  let windowStart = 0
  let lastFrameAt = 0
  let worstGap = 0
  let running = false

  function tick(now: number) {
    if (!running) return
    frames++
    worstGap = Math.max(worstGap, now - lastFrameAt)
    lastFrameAt = now

    if (now - windowStart >= 1000) {
      fps.value = Math.round((frames * 1000) / (now - windowStart))
      history.value = pushSample(history.value, fps.value, samples)

      frameTime.value = Math.round(worstGap * 10) / 10
      frameTimeHistory.value = pushSample(frameTimeHistory.value, frameTime.value, samples)

      frames = 0
      windowStart = now
      worstGap = 0
    }
    raf = requestAnimationFrame(tick)
  }

  function start() {
    if (running) return
    running = true
    frames = 0
    worstGap = 0
    windowStart = performance.now()
    lastFrameAt = windowStart
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

  return { fps, history, frameTime, frameTimeHistory, supported: true }
}
