import { describe, expect, it } from 'vitest'
import { barMeter, brailleChart, describeSeries, sparkline } from '../../app/utils/graph'

describe('sparkline', () => {
  it('maps a ramp across the full block range', () => {
    expect(sparkline([0, 1, 2, 3, 4, 5, 6, 7])).toBe('▁▂▃▄▅▆▇█')
  })

  it('renders a flat series on the baseline rather than dividing by zero', () => {
    expect(sparkline([5, 5, 5])).toBe('▁▁▁')
  })

  it('honours an explicit range so meters do not rescale every tick', () => {
    expect(sparkline([0, 30, 60], { min: 0, max: 60 })).toBe('▁▄█')
  })

  it('ignores non-finite values instead of emitting NaN glyphs', () => {
    expect(sparkline([0, Number.NaN, 7])).toBe('▁▁█')
  })

  it('returns an empty string for an empty series', () => {
    expect(sparkline([])).toBe('')
  })
})

describe('barMeter', () => {
  it('fills proportionally', () => {
    expect(barMeter(0.5, 8)).toBe('████░░░░')
    expect(barMeter(0, 4)).toBe('░░░░')
    expect(barMeter(1, 4)).toBe('████')
  })

  it('clamps out-of-range fractions', () => {
    expect(barMeter(-3, 4)).toBe('░░░░')
    expect(barMeter(9, 4)).toBe('████')
  })
})

describe('brailleChart', () => {
  it('returns the requested number of rows', () => {
    const rows = brailleChart([0, 1, 2, 3, 4, 5, 6, 7], { width: 4, height: 2 })
    expect(rows).toHaveLength(2)
  })

  it('emits only braille characters', () => {
    const rows = brailleChart([0, 5, 2, 8, 3], { width: 6, height: 3 })
    for (const row of rows.join('')) {
      expect(row.codePointAt(0)).toBeGreaterThanOrEqual(0x2800)
      expect(row.codePointAt(0)).toBeLessThanOrEqual(0x28FF)
    }
  })

  it('pads every row to the requested width so the panel cannot jitter', () => {
    const rows = brailleChart([1, 2], { width: 10, height: 2 })
    for (const row of rows) expect([...row]).toHaveLength(10)
  })

  it('returns blank rows for an empty series', () => {
    const rows = brailleChart([], { width: 3, height: 2 })
    expect(rows).toEqual(['⠀⠀⠀', '⠀⠀⠀'])
  })
})

describe('describeSeries', () => {
  it('summarises a series for screen readers', () => {
    expect(describeSeries([10, 20, 30], '°F')).toBe('10°F to 30°F, now 30°F')
  })

  it('handles a single reading', () => {
    expect(describeSeries([42], 'fps')).toBe('42fps')
  })

  it('says so when there is no data', () => {
    expect(describeSeries([], '°F')).toBe('no data')
  })
})
