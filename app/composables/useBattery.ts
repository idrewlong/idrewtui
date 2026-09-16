import { onBeforeUnmount, onMounted, ref } from 'vue'

interface BatteryManager extends EventTarget {
  level: number
  charging: boolean
}

/** Battery level and charging state. Chromium only; `supported` gates the row. */
export function useBattery() {
  const level = ref<number | null>(null)
  const charging = ref<boolean | null>(null)
  const supported = ref(false)
  let battery: BatteryManager | undefined

  function read() {
    if (!battery) return
    level.value = battery.level
    charging.value = battery.charging
  }

  onMounted(async () => {
    const getBattery = (navigator as Navigator & {
      getBattery?: () => Promise<BatteryManager>
    }).getBattery
    if (!getBattery) return

    try {
      battery = await getBattery.call(navigator)
      supported.value = true
      read()
      battery.addEventListener('levelchange', read)
      battery.addEventListener('chargingchange', read)
    }
    catch {
      supported.value = false
    }
  })

  onBeforeUnmount(() => {
    battery?.removeEventListener('levelchange', read)
    battery?.removeEventListener('chargingchange', read)
  })

  return { level, charging, supported }
}
