import { beforeEach, describe, expect, it } from 'vitest'
import { cacheKey, isForecast, readCache, toForecast, writeCache, type Forecast } from '../../app/composables/useWeather'
import type { Coords } from '../../app/composables/useGeolocation'

const valid = {
  current: { temperature_2m: 74.1, weather_code: 2 },
  hourly: {
    time: ['2026-09-15T00:00', '2026-09-15T01:00', '2026-09-15T02:00'],
    temperature_2m: [70.2, 69.4, 68.8],
  },
}

describe('toForecast', () => {
  it('maps a valid Open-Meteo payload', () => {
    const f = toForecast(valid)!
    expect(f.tempNow).toBe(74)
    expect(f.code).toBe(2)
    expect(f.hourly).toEqual([70, 69, 69])
    expect(f.hourStart).toBe(0)
  })

  it('reads the starting hour so the axis can be labelled', () => {
    const f = toForecast({
      ...valid,
      hourly: { time: ['2026-09-15T13:00'], temperature_2m: [80] },
    })!
    expect(f.hourStart).toBe(13)
  })

  // A malformed payload must not blank the panel with NaN.
  it.each([
    ['null', null],
    ['a string', 'nope'],
    ['an empty object', {}],
    ['missing current', { hourly: valid.hourly }],
    ['missing hourly', { current: valid.current }],
    ['non-numeric temperature', { current: { temperature_2m: 'warm', weather_code: 0 }, hourly: valid.hourly }],
    ['mismatched hourly arrays', { current: valid.current, hourly: { time: ['2026-09-15T00:00'], temperature_2m: [] } }],
  ])('returns null for %s', (_label, payload) => {
    expect(toForecast(payload)).toBeNull()
  })

  describe('precipChance', () => {
    it('is the day\'s peak precipitation_probability, rounded', () => {
      const f = toForecast({
        ...valid,
        hourly: { ...valid.hourly, precipitation_probability: [10, 42.6, 30] },
      })!
      expect(f.precipChance).toBe(43)
    })

    // Never fabricated as 0: an empty bar would claim a known zero rather
    // than "we don't know". Every case here must produce null, not 0.
    it('is null, not 0, when the field is absent', () => {
      const f = toForecast(valid)!
      expect(f.precipChance).toBeNull()
    })

    it('is null, not 0, when the array length does not match hourly', () => {
      const f = toForecast({
        ...valid,
        hourly: { ...valid.hourly, precipitation_probability: [10, 20] },
      })!
      expect(f.precipChance).toBeNull()
    })

    it('is null, not 0, when the array contains non-numeric entries', () => {
      const f = toForecast({
        ...valid,
        hourly: { ...valid.hourly, precipitation_probability: [10, 'a lot', 30] },
      })!
      expect(f.precipChance).toBeNull()
    })
  })
})

describe('isForecast', () => {
  const good: Forecast = { tempNow: 74, code: 2, hourly: [70, 69, 69], hourStart: 0, precipChance: null }

  it('accepts a well-formed forecast, including a null precipChance', () => {
    expect(isForecast(good)).toBe(true)
    expect(isForecast({ ...good, precipChance: 43 })).toBe(true)
  })

  it('rejects a forecast missing precipChance entirely', () => {
    // The exact shape a cache entry written before this field existed would
    // have: valid JSON, just missing the key. `undefined !== null`, so a
    // naive `!== null` guard would let this through as a "known unknown"
    // instead of catching the real problem: the object doesn't match the
    // current Forecast shape at all.
    const { precipChance, ...withoutPrecip } = good
    expect(isForecast(withoutPrecip)).toBe(false)
  })

  it.each([
    ['null', null],
    ['a string', 'nope'],
    ['missing hourly', { tempNow: 74, code: 2, hourStart: 0, precipChance: null }],
    ['non-numeric hourly entries', { ...good, hourly: [70, 'x', 69] }],
    ['non-numeric tempNow', { ...good, tempNow: 'warm' }],
  ])('rejects %s', (_label, value) => {
    expect(isForecast(value)).toBe(false)
  })
})

describe('weather cache', () => {
  const coords: Coords = { lat: 30.35, lon: -89.15, label: 'Long Beach, MS' }

  beforeEach(() => {
    localStorage.clear()
  })

  it('is a hit for a freshly written, well-formed entry', () => {
    const forecast: Forecast = { tempNow: 74, code: 2, hourly: [70, 69, 69], hourStart: 0, precipChance: 43 }
    writeCache(coords, forecast)
    expect(readCache(coords)).toEqual(forecast)
  })

  // The exact bug the reviewer reproduced: a cache entry from before
  // `precipChance` existed is valid JSON, just missing the field. Reading it
  // back used to hand the panel `{ ..., precipChance: undefined }`, which
  // the template's `!== null` guard let through as a "known" chance and
  // rendered "chance of rain NaN%". It must be a miss, not a NaN-producing
  // hit.
  it('is a miss for an entry shaped like a pre-precipChance forecast', () => {
    const legacyShape = { tempNow: 74, code: 2, hourly: [70, 69, 69], hourStart: 0 }
    localStorage.setItem(cacheKey(coords), JSON.stringify({ at: Date.now(), forecast: legacyShape }))
    expect(readCache(coords)).toBeNull()
  })

  it('is a miss once the entry is older than the TTL', () => {
    const forecast: Forecast = { tempNow: 74, code: 2, hourly: [70, 69, 69], hourStart: 0, precipChance: null }
    const THIRTY_ONE_MINUTES_AGO = Date.now() - 31 * 60 * 1000
    localStorage.setItem(cacheKey(coords), JSON.stringify({ at: THIRTY_ONE_MINUTES_AGO, forecast }))
    expect(readCache(coords)).toBeNull()
  })

  it('is a miss for corrupted JSON rather than throwing', () => {
    localStorage.setItem(cacheKey(coords), '{not valid json')
    expect(readCache(coords)).toBeNull()
  })
})
