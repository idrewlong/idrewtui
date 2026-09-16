import { describe, expect, it } from 'vitest'
import { pushSample } from '../../app/composables/useFrameRate'

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
