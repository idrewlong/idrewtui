import { describe, expect, it } from 'vitest'
import { formatFps, pushSample } from '../../app/composables/useFrameRate'

describe('formatFps', () => {
  it('shows an em dash before any sample has landed, not a fabricated number', () => {
    expect(formatFps(null)).toBe('—')
  })

  it('shows a genuine zero reading rather than masking it as "no data"', () => {
    // e.g. the main thread was blocked for a whole measurement window — a
    // real, measured 0, and hiding it would be worse than showing it.
    expect(formatFps(0)).toBe('0')
  })

  it('shows an ordinary measured rate', () => {
    expect(formatFps(60)).toBe('60')
  })
})

describe('pushSample', () => {
  it('appends while under the cap', () => {
    expect(pushSample([1, 2], 3, 5)).toEqual([1, 2, 3])
  })

  it('drops the oldest sample once full, so the window never grows', () => {
    expect(pushSample([1, 2, 3], 4, 3)).toEqual([2, 3, 4])
  })

  it('does not mutate the input array', () => {
    const history = [1, 2, 3]
    pushSample(history, 4, 3)
    expect(history).toEqual([1, 2, 3])
  })

  it('handles an empty history', () => {
    expect(pushSample([], 1, 3)).toEqual([1])
  })

  it('trims a history that is already over the cap', () => {
    expect(pushSample([1, 2, 3, 4, 5], 6, 3)).toEqual([4, 5, 6])
  })
})
