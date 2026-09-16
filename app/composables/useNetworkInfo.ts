import { onBeforeUnmount, onMounted, ref } from 'vue'

interface NetworkInformation extends EventTarget {
  effectiveType?: string
  downlink?: number
  rtt?: number
}

/** How often to re-probe latency when `navigator.connection.rtt` is unavailable. */
const PROBE_INTERVAL_MS = 30_000

/**
 * Connection quality from the Network Information API (Chromium) plus online
 * state, which every browser reports. Values update live as the connection
 * changes.
 *
 * Latency prefers `connection.rtt` — a round-trip estimate the browser already
 * tracks, at zero cost. Only when that is unavailable do we fall back to an
 * actual timed same-origin request, and even then infrequently (every 30s),
 * paused while the tab is hidden and cancelled on unmount, so this never
 * becomes a polling meter that hammers the network to draw one row.
 */
export function useNetworkInfo() {
  const effectiveType = ref<string | null>(null)
  const downlink = ref<number | null>(null)
  const rtt = ref<number | null>(null)
  const online = ref(true)
  const supported = ref(false)

  let connection: NetworkInformation | undefined
  let probeTimer: ReturnType<typeof setInterval> | undefined
  let controller: AbortController | undefined

  function read() {
    if (!connection) return
    effectiveType.value = connection.effectiveType ?? null
    downlink.value = connection.downlink ?? null
    rtt.value = connection.rtt ?? null
  }

  async function probeLatency() {
    // Only probe when the API gave us nothing to work with, never stack probes
    // on top of each other, and never spend a background tab's throttled cycles
    // on a request nobody can see the result of.
    if (rtt.value !== null || controller || document.hidden) return
    controller = new AbortController()
    const start = performance.now()
    try {
      await fetch(document.location.href, { method: 'HEAD', cache: 'no-store', signal: controller.signal })
      rtt.value = Math.round(performance.now() - start)
    }
    catch {
      // Offline, aborted, or blocked — leave rtt as unavailable rather than guessing.
    }
    finally {
      controller = undefined
    }
  }

  function onOnline() { online.value = navigator.onLine }

  // Coming back from a hidden tab shouldn't mean waiting up to 30s for the
  // next scheduled probe — try immediately (probeLatency is itself a no-op
  // once rtt is known, so this is free once a value has landed).
  function onVisibility() {
    if (!document.hidden) void probeLatency()
  }

  onMounted(() => {
    connection = (navigator as Navigator & { connection?: NetworkInformation }).connection
    supported.value = Boolean(connection)
    online.value = navigator.onLine
    read()
    connection?.addEventListener('change', read)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOnline)

    if (rtt.value === null) {
      document.addEventListener('visibilitychange', onVisibility)
      void probeLatency()
      probeTimer = setInterval(() => void probeLatency(), PROBE_INTERVAL_MS)
    }
  })

  onBeforeUnmount(() => {
    connection?.removeEventListener('change', read)
    window.removeEventListener('online', onOnline)
    window.removeEventListener('offline', onOnline)
    document.removeEventListener('visibilitychange', onVisibility)
    clearInterval(probeTimer)
    controller?.abort()
  })

  return { effectiveType, downlink, rtt, online, supported }
}
