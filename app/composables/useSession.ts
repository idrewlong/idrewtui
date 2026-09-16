import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

export interface LogEntry {
  method: 'GET'
  path: string
  status: number
  ms: number
}

/** Seconds to HH:MM:SS. Hours are not capped, so a long session reads honestly. */
export function formatUptime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return [h, m, s].map(n => String(n).padStart(2, '0')).join(':')
}

const MAX_LOG = 5

/**
 * Session telemetry: how long the visitor has been here, where they have been,
 * and a request log.
 *
 * The log is real — entries come from actual router navigations, and `ms` is
 * measured with performance.now(). The status is always 200 because a client
 * navigation that resolved is, by definition, a route we served.
 *
 * `route` is read from the router synchronously, not seeded with a fabricated
 * default and corrected on mount: this app prerenders every route, so the
 * router already knows the real path during SSR, and starting from it avoids
 * both a dishonest placeholder and a hydration mismatch.
 *
 * Only the uptime ticker is gated by `prefers-reduced-motion` (a per-second
 * timer counts as motion for this project, same ruling as the heap poller).
 * Route tracking and the navigation log are event-driven — they fire on
 * genuine navigations, not on a timer — so they are never gated: freezing
 * them under reduced motion would silently break a real feature rather than
 * just stop an animation.
 */
export function useSession() {
  const router = useRouter()

  const seconds = ref(0)
  const uptime = ref('00:00:00')
  const route = ref(router.currentRoute.value.path)
  const visited = ref(1)
  const log = ref<LogEntry[]>([])

  let timer: ReturnType<typeof setInterval> | undefined
  let navStart = 0
  let stopAfterEach: (() => void) | undefined
  let stopBeforeEach: (() => void) | undefined

  onMounted(() => {
    const start = performance.now()

    function readUptime() {
      seconds.value = (performance.now() - start) / 1000
      uptime.value = formatUptime(seconds.value)
    }

    readUptime()
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      timer = setInterval(readUptime, 1000)
    }

    stopBeforeEach = router.beforeEach(() => {
      navStart = performance.now()
      return true
    })

    stopAfterEach = router.afterEach((to) => {
      route.value = to.path
      visited.value++
      const entry: LogEntry = { method: 'GET', path: to.path, status: 200, ms: Math.round(performance.now() - navStart) }
      log.value = [...log.value, entry].slice(-MAX_LOG)
    })
  })

  onBeforeUnmount(() => {
    clearInterval(timer)
    stopBeforeEach?.()
    stopAfterEach?.()
  })

  return { uptime, seconds, route, log, visited }
}
