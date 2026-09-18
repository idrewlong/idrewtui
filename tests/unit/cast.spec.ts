import { describe, expect, it } from 'vitest'
import { duration, outputUpTo, parseCast, stripAnsi } from '../../app/utils/cast'

const sample = [
  JSON.stringify({ version: 2, width: 80, height: 24 }),
  JSON.stringify([0, 'o', 'hello']),
  JSON.stringify([0.5, 'i', 'ignored']),
  JSON.stringify([1, 'o', ' world']),
].join('\n')

describe('parseCast', () => {
  it('reads an asciicast v2 file', () => {
    const cast = parseCast(sample)
    expect(cast.header).toEqual({ version: 2, width: 80, height: 24 })
    expect(cast.events).toHaveLength(3)
  })

  it('rejects anything that is not v2', () => {
    expect(() => parseCast('{"version":1}\n')).toThrow(/v2/i)
  })
})

describe('outputUpTo', () => {
  it('concatenates output events up to a timestamp and skips input', () => {
    const { events } = parseCast(sample)
    expect(outputUpTo(events, 0)).toBe('hello')
    expect(outputUpTo(events, 1)).toBe('hello world')
    expect(duration(events)).toBe(1)
  })
})

describe('stripAnsi', () => {
  it('drops CSI sequences so a pre can show the recording without a terminal emulator', () => {
    expect(stripAnsi('\x1b[32mok\x1b[0m')).toBe('ok')
  })
})
