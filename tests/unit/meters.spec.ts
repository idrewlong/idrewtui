import { describe, expect, it } from 'vitest'
import { formatFps, formatFrameTime, pushSample } from '../../app/composables/useFrameRate'
import { bytesToMb } from '../../app/composables/useMemoryMeter'
import { formatRtt } from '../../app/composables/useNetworkInfo'

describe('bytesToMb', () => {
  it('converts bytes to whole megabytes', () => {
    expect(bytesToMb(10 * 1048576)).toBe(10)
  })

  it('rounds to the nearest whole megabyte', () => {
    expect(bytesToMb(10.6 * 1048576)).toBe(11)
    expect(bytesToMb(10.4 * 1048576)).toBe(10)
  })
})

describe('formatRtt', () => {
  it('renders "<25ms" for a 0 reading rather than claiming false precision', () => {
    // navigator.connection.rtt is quantised to 25ms steps, so 0 means
    // "under 25ms", not "zero latency".
    expect(formatRtt(0)).toBe('<25ms')
  })

  it('renders an ordinary reading as-is', () => {
    expect(formatRtt(75)).toBe('75ms')
  })

  it('renders an em dash when genuinely unavailable', () => {
    expect(formatRtt(null)).toBe('—')
  })
})

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

describe('formatFrameTime', () => {
  it('shows an em dash before any sample has landed', () => {
    expect(formatFrameTime(null)).toBe('—')
  })

  it('renders a genuine reading with a unit suffix', () => {
    expect(formatFrameTime(16.7)).toBe('16.7ms')
  })

  it('shows a genuine zero reading rather than masking it', () => {
    expect(formatFrameTime(0)).toBe('0ms')
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
