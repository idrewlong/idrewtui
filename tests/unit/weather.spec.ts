import { describe, expect, it } from 'vitest'
import { toForecast } from '../../app/composables/useWeather'

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
})
