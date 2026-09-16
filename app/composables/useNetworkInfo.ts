import { onBeforeUnmount, onMounted, ref } from 'vue'

interface NetworkInformation extends EventTarget {
  effectiveType?: string
  downlink?: number
  rtt?: number
}

/**
 * Render helper for `rtt`. `navigator.connection.rtt` is quantised to 25ms
 * steps, so a reading of `0` doesn't mean zero latency — it means "under
 * 25ms" — and rendering it as a bare `0ms` would claim a precision the API
 * doesn't provide.
 */
export function formatRtt(rtt: number | null): string {
  if (rtt === null) return '—'
  if (rtt === 0) return '<25ms'
  return `${rtt}ms`
}

/**
 * Connection quality from the Network Information API (Chromium) plus online
 * state, which every browser reports. Values update live as the connection
 * changes.
 *
 * Latency is `connection.rtt` only — a round-trip estimate the browser
 * already tracks, at zero cost. There is deliberately no request-based
 * fallback here: the design spec reserves network requests to the weather
 * panel alone ("only this panel makes a network request"), and a probe fired
 * from here would land precisely on the browsers that lack
 * `navigator.connection` (Safari, Firefox) — exactly the users who should get
 * an honest `—` instead of extra background traffic. When `rtt` is
 * unavailable it just stays `null`, and the panel renders `—`.
 */
export function useNetworkInfo() {
  const effectiveType = ref<string | null>(null)
  const downlink = ref<number | null>(null)
  const rtt = ref<number | null>(null)
  const online = ref(true)
  const supported = ref(false)

  let connection: NetworkInformation | undefined

  function read() {
    if (!connection) return
    effectiveType.value = connection.effectiveType ?? null
    downlink.value = connection.downlink ?? null
    rtt.value = connection.rtt ?? null
  }

  function onOnline() { online.value = navigator.onLine }

  onMounted(() => {
    connection = (navigator as Navigator & { connection?: NetworkInformation }).connection
    supported.value = Boolean(connection)
    online.value = navigator.onLine
    read()
    connection?.addEventListener('change', read)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOnline)
  })

  onBeforeUnmount(() => {
    connection?.removeEventListener('change', read)
    window.removeEventListener('online', onOnline)
    window.removeEventListener('offline', onOnline)
  })

  return { effectiveType, downlink, rtt, online, supported }
}
