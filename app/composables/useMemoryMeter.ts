import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

interface ChromeMemory { usedJSHeapSize: number, jsHeapSizeLimit: number }

/**
 * JS heap usage. Chromium only — Safari and Firefox do not expose it, and
 * `supported` stays false there so the panel can say so honestly.
 *
 * Polling pauses while the tab is hidden — there is no point spending a timer
 * on a value nobody can see — and resumes with a fresh read the moment it
 * becomes visible again, so the number is never stale-looking on return.
 */
export function useMemoryMeter(intervalMs = 2000) {
  const usedMb = ref<number | null>(null)
  const limitMb = ref<number | null>(null)
  const supported = ref(false)
  let timer: ReturnType<typeof setInterval> | undefined

  const fraction = computed(() =>
    usedMb.value !== null && limitMb.value ? usedMb.value / limitMb.value : 0)

  function read() {
    const mem = (performance as Performance & { memory?: ChromeMemory }).memory
    if (!mem) return
    usedMb.value = Math.round(mem.usedJSHeapSize / 1048576)
    limitMb.value = Math.round(mem.jsHeapSizeLimit / 1048576)
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
    document.addEventListener('visibilitychange', onVisibility)
    startPolling()
  })

  onBeforeUnmount(() => {
    document.removeEventListener('visibilitychange', onVisibility)
    stopPolling()
  })

  return { usedMb, limitMb, fraction, supported }
}
