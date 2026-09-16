import { describe, expect, it } from 'vitest'
import { formatScreen, parseUserAgent } from '../../app/composables/useVisitorSpecs'

describe('parseUserAgent', () => {
  const cases: Array<[string, string, string, string]> = [
    ['macOS Safari', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15', 'macOS', 'Safari 17'],
    ['Windows Chrome', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36', 'Windows', 'Chrome 124'],
    ['Windows Edge', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.2478.67', 'Windows', 'Edge 124'],
    ['Linux Firefox', 'Mozilla/5.0 (X11; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0', 'Linux', 'Firefox 125'],
    ['Android Chrome', 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36', 'Android', 'Chrome 124'],
    ['iOS Safari', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1', 'iOS', 'Safari 17'],
  ]

  it.each(cases)('parses %s', (_label, ua, os, browser) => {
    expect(parseUserAgent(ua)).toEqual({ os, browser })
  })

  it('degrades to unknown rather than guessing', () => {
    expect(parseUserAgent('some-crawler/1.0')).toEqual({ os: 'unknown', browser: 'unknown' })
    expect(parseUserAgent('')).toEqual({ os: 'unknown', browser: 'unknown' })
  })
})

describe('formatScreen', () => {
  it('includes the pixel ratio only when it is not 1', () => {
    expect(formatScreen(1512, 982, 2)).toBe('1512x982 @2x')
    expect(formatScreen(1920, 1080, 1)).toBe('1920x1080')
  })

  it('rounds fractional ratios', () => {
    expect(formatScreen(1280, 800, 1.5)).toBe('1280x800 @1.5x')
  })
})
