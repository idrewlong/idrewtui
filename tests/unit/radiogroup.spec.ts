import { describe, expect, it } from 'vitest'
import { radioGroupTarget } from '../../app/utils/radiogroup'

describe('radioGroupTarget', () => {
  it('moves forward on ArrowDown and ArrowRight, wrapping at the end', () => {
    expect(radioGroupTarget('ArrowDown', 0, 3)).toBe(1)
    expect(radioGroupTarget('ArrowRight', 0, 3)).toBe(1)
    expect(radioGroupTarget('ArrowDown', 2, 3)).toBe(0)
  })

  it('moves backward on ArrowUp and ArrowLeft, wrapping at the start', () => {
    expect(radioGroupTarget('ArrowUp', 1, 3)).toBe(0)
    expect(radioGroupTarget('ArrowLeft', 1, 3)).toBe(0)
    expect(radioGroupTarget('ArrowUp', 0, 3)).toBe(2)
  })

  it('jumps to the first item on Home and the last on End', () => {
    expect(radioGroupTarget('Home', 2, 5)).toBe(0)
    expect(radioGroupTarget('End', 0, 5)).toBe(4)
  })

  it('leaves Enter, Space and Tab unhandled so native button/focus behaviour applies', () => {
    expect(radioGroupTarget('Enter', 1, 5)).toBeNull()
    expect(radioGroupTarget(' ', 1, 5)).toBeNull()
    expect(radioGroupTarget('Tab', 1, 5)).toBeNull()
  })

  it('ignores unrelated keys', () => {
    expect(radioGroupTarget('a', 1, 5)).toBeNull()
  })

  it('is a no-op on an empty group', () => {
    expect(radioGroupTarget('Home', 0, 0)).toBeNull()
    expect(radioGroupTarget('End', 0, 0)).toBeNull()
  })
})
