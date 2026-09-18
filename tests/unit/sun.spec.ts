import { describe, expect, it } from 'vitest'
import { moonPhase, sunTimes } from '../../app/utils/sun'
import { asciiWeather, describeWeatherCode } from '../../app/utils/weather-codes'

/** Long Beach, Mississippi. */
const LAT = 30.35
const LON = -89.15

function hhmmUtc(d: Date): string {
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`
}

describe('sunTimes', () => {
  // NOAA gives 2026-06-21 sunrise 10:57 UTC, sunset 01:04 UTC (next day) for
  // Long Beach MS. Allow a few minutes: this is the simplified sunrise equation.
  it('computes summer solstice sunrise within a few minutes of NOAA', () => {
    const { sunrise } = sunTimes(new Date(Date.UTC(2026, 5, 21, 12)), LAT, LON)
    expect(sunrise).not.toBeNull()
    const minutes = sunrise!.getUTCHours() * 60 + sunrise!.getUTCMinutes()
    expect(Math.abs(minutes - (10 * 60 + 57))).toBeLessThanOrEqual(6)
  })

  it('puts sunset after sunrise on the same day', () => {
    const { sunrise, sunset } = sunTimes(new Date(Date.UTC(2026, 2, 21, 12)), LAT, LON)
    expect(sunrise).not.toBeNull()
    expect(sunset).not.toBeNull()
    expect(sunset!.getTime()).toBeGreaterThan(sunrise!.getTime())
  })

  it('gives roughly twelve hours of daylight at the equinox', () => {
    const { sunrise, sunset } = sunTimes(new Date(Date.UTC(2026, 2, 21, 12)), LAT, LON)
    const hours = (sunset!.getTime() - sunrise!.getTime()) / 3_600_000
    expect(hours).toBeGreaterThan(11.7)
    expect(hours).toBeLessThan(12.5)
  })

  it('returns null inside the Arctic circle during polar night', () => {
    const { sunrise, sunset } = sunTimes(new Date(Date.UTC(2026, 11, 21, 12)), 78.2, 15.6)
    expect(sunrise).toBeNull()
    expect(sunset).toBeNull()
  })

  it('returns null inside the Arctic circle during polar day', () => {
    const { sunrise, sunset } = sunTimes(new Date(Date.UTC(2026, 5, 21, 12)), 78.2, 15.6)
    expect(sunrise).toBeNull()
    expect(sunset).toBeNull()
  })

  it('is stable regardless of the time of day passed in', () => {
    const a = sunTimes(new Date(Date.UTC(2026, 5, 21, 0)), LAT, LON)
    const b = sunTimes(new Date(Date.UTC(2026, 5, 21, 23)), LAT, LON)
    expect(hhmmUtc(a.sunrise!)).toBe(hhmmUtc(b.sunrise!))
  })
})

describe('moonPhase', () => {
  it('reports a new moon on a known new moon', () => {
    // 2026-01-18 was a new moon.
    const { name, fraction } = moonPhase(new Date(Date.UTC(2026, 0, 18, 19, 52)))
    expect(name).toBe('new')
    expect(fraction).toBeLessThan(0.05)
  })

  it('reports a full moon about half a synodic month later', () => {
    const { name } = moonPhase(new Date(Date.UTC(2026, 1, 2, 7, 9)))
    expect(name).toBe('full')
  })

  it('always returns a fraction in range', () => {
    for (let day = 0; day < 40; day++) {
      const { fraction } = moonPhase(new Date(Date.UTC(2026, 0, 1 + day)))
      expect(fraction).toBeGreaterThanOrEqual(0)
      expect(fraction).toBeLessThanOrEqual(1)
    }
  })
})

describe('describeWeatherCode', () => {
  it('maps the common WMO codes', () => {
    expect(describeWeatherCode(0)).toBe('clear')
    expect(describeWeatherCode(3)).toBe('overcast')
    expect(describeWeatherCode(61)).toBe('light rain')
    expect(describeWeatherCode(95)).toBe('thunderstorm')
  })

  it('falls back rather than throwing on an unknown code', () => {
    expect(describeWeatherCode(999)).toBe('unknown')
  })
})

describe('asciiWeather', () => {
  it('is four lines for every family of code', () => {
    for (const code of [0, 2, 63, 73, 95]) {
      expect(asciiWeather(code).split('\n')).toHaveLength(4)
    }
  })

  it('uses a distinct glyph for clear, rain, snow, and storms', () => {
    const clear = asciiWeather(0)
    const rain = asciiWeather(63)
    const snow = asciiWeather(73)
    const storm = asciiWeather(95)
    expect(new Set([clear, rain, snow, storm]).size).toBe(4)
  })
})
