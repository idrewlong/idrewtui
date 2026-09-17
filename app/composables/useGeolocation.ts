import { onMounted, ref } from 'vue'
import { profile } from '~/data/profile'

export interface Coords {
  lat: number
  lon: number
  label: string
}

/**
 * Where the weather panel points when we have nothing better: Andrew's own
 * location. Never an empty panel, and it incidentally tells a recruiter his
 * timezone.
 */
export const FALLBACK_COORDS: Coords = {
  lat: profile.coords.lat,
  lon: profile.coords.lon,
  label: profile.location,
}

/** Coarsen before anything leaves the browser — ~1km is plenty for weather. */
function round(n: number): number {
  return Math.round(n * 100) / 100
}

/**
 * Requests geolocation on load, per the spec.
 *
 * Denial, timeout and error are all non-events: we stay on the fallback with no
 * error state and no nagging. A visitor who says no should not be punished with
 * a broken-looking panel.
 *
 * A crosshairs control plus manual zip/city entry is a planned follow-up
 * (spec §9); it will replace the on-load prompt.
 */
export function useGeolocation() {
  const coords = ref<Coords>(FALLBACK_COORDS)
  const source = ref<'default' | 'geolocation'>('default')

  onMounted(() => {
    if (!navigator.geolocation) return

    navigator.geolocation.getCurrentPosition(
      (position) => {
        coords.value = {
          lat: round(position.coords.latitude),
          lon: round(position.coords.longitude),
          label: 'your location',
        }
        source.value = 'geolocation'
      },
      () => {
        // Denied, timed out or unavailable. Stay on the fallback, silently.
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600_000 },
    )
  })

  return { coords, source }
}
