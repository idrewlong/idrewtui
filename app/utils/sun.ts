/**
 * Sunrise, sunset and moon phase, computed locally.
 *
 * Open-Meteo would return sunrise/sunset, but this needs no network call and
 * works for any date, which keeps the weather panel useful even when the
 * forecast request fails. Uses the standard simplified sunrise equation —
 * accurate to a few minutes, which is all a dashboard needs.
 */

const RAD = Math.PI / 180
const J1970 = 2440588
const J2000 = 2451545

const toJulian = (date: Date) => date.valueOf() / 86_400_000 - 0.5 + J1970
const fromJulian = (j: number) => new Date((j + 0.5 - J1970) * 86_400_000)

/**
 * Sunrise and sunset in UTC. Returns nulls when the sun never crosses the
 * horizon that day (polar day or polar night), which is a real condition and
 * not an error.
 */
export function sunTimes(date: Date, lat: number, lon: number): {
  sunrise: Date | null
  sunset: Date | null
} {
  // Work from midnight UTC so the result does not depend on the time passed in.
  const midnight = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  const n = Math.round(toJulian(new Date(midnight)) - J2000 - 0.0009 + lon / 360)

  const meanSolarNoon = 0.0009 - lon / 360 + n
  const M = (357.5291 + 0.98560028 * meanSolarNoon) % 360
  const C = 1.9148 * Math.sin(M * RAD) + 0.02 * Math.sin(2 * M * RAD) + 0.0003 * Math.sin(3 * M * RAD)
  const lambda = (M + C + 180 + 102.9372) % 360
  const transit = J2000 + meanSolarNoon + 0.0053 * Math.sin(M * RAD) - 0.0069 * Math.sin(2 * lambda * RAD)

  const declination = Math.asin(Math.sin(lambda * RAD) * Math.sin(23.44 * RAD))

  // -0.833 degrees accounts for refraction and the solar disc's radius.
  const cosOmega = (Math.sin(-0.833 * RAD) - Math.sin(lat * RAD) * Math.sin(declination))
    / (Math.cos(lat * RAD) * Math.cos(declination))

  if (cosOmega > 1 || cosOmega < -1) return { sunrise: null, sunset: null }

  const omega = Math.acos(cosOmega) / RAD
  return {
    sunrise: fromJulian(transit - omega / 360),
    sunset: fromJulian(transit + omega / 360),
  }
}

const SYNODIC = 29.530588853
/** A known new moon: 2000-01-06 18:14 UTC. */
const KNOWN_NEW_MOON = 2451550.26

const PHASE_NAMES = [
  'new', 'waxing crescent', 'first quarter', 'waxing gibbous',
  'full', 'waning gibbous', 'last quarter', 'waning crescent',
] as const

/**
 * Moon phase as a 0..1 fraction through the synodic month, plus a name.
 * 0 is new, 0.5 is full.
 */
export function moonPhase(date: Date): { fraction: number, name: string } {
  const age = (((toJulian(date) - KNOWN_NEW_MOON) % SYNODIC) + SYNODIC) % SYNODIC
  const fraction = age / SYNODIC

  // Eight equal arcs centred on the named phases.
  const index = Math.floor((fraction + 1 / 16) * 8) % 8
  return { fraction, name: PHASE_NAMES[index]! }
}
