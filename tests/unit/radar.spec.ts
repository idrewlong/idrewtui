import { describe, expect, it } from 'vitest'
import {
  alphaGridFromPixels,
  averageDensity,
  densityToBraille,
  latestRadarFrame,
  latLonToTile,
  radarTileUrl,
} from '../../app/utils/radar'

describe('latestRadarFrame', () => {
  const valid = {
    host: 'https://tilecache.rainviewer.com',
    radar: {
      past: [
        { time: 1_700_000_000, path: '/v2/radar/1700000000' },
        { time: 1_700_000_600, path: '/v2/radar/1700000600' },
      ],
    },
  }

  it('picks the LAST entry of past as the most recent frame', () => {
    expect(latestRadarFrame(valid)).toEqual({
      host: 'https://tilecache.rainviewer.com',
      path: '/v2/radar/1700000600',
      time: 1_700_000_600,
    })
  })

  it.each([
    ['null', null],
    ['a string', 'nope'],
    ['an empty object', {}],
    ['missing host', { radar: valid.radar }],
    ['non-string host', { host: 42, radar: valid.radar }],
    ['missing radar', { host: valid.host }],
    ['missing past', { host: valid.host, radar: {} }],
    ['empty past array', { host: valid.host, radar: { past: [] } }],
    ['past entry missing time', { host: valid.host, radar: { past: [{ path: '/x' }] } }],
    ['past entry missing path', { host: valid.host, radar: { past: [{ time: 1 }] } }],
  ])('returns null for %s', (_label, payload) => {
    expect(latestRadarFrame(payload)).toBeNull()
  })
})

describe('radarTileUrl', () => {
  it('builds the documented tile URL shape', () => {
    const url = radarTileUrl(
      { host: 'https://tilecache.rainviewer.com', path: '/v2/radar/1700000600' },
      5, 10, 12,
    )
    expect(url).toBe('https://tilecache.rainviewer.com/v2/radar/1700000600/256/5/10/12/2/1_1.png')
  })
})

describe('latLonToTile', () => {
  it('maps the origin (0,0) to the center tile at a given zoom', () => {
    // At z=1, n=2: lon 0 -> x = floor(0.5*2) = 1; lat 0 -> y = floor(0.5*2) = 1.
    expect(latLonToTile(0, 0, 1)).toEqual({ x: 1, y: 1 })
  })

  it('maps the northwest corner to tile (0,0)', () => {
    expect(latLonToTile(85, -179.9, 2)).toEqual({ x: 0, y: 0 })
  })

  it('clamps to valid tile indices at the extremes', () => {
    const { x, y } = latLonToTile(89.9, 179.9, 3)
    expect(x).toBeGreaterThanOrEqual(0)
    expect(x).toBeLessThan(2 ** 3)
    expect(y).toBeGreaterThanOrEqual(0)
    expect(y).toBeLessThan(2 ** 3)
  })
})

/** Build a flat RGBA buffer where every pixel has the same alpha. */
function solidAlpha(width: number, height: number, alpha: number): Uint8ClampedArray {
  const data = new Uint8ClampedArray(width * height * 4)
  for (let i = 0; i < width * height; i++) data[i * 4 + 3] = alpha
  return data
}

describe('alphaGridFromPixels', () => {
  it('reports full density for a fully opaque tile', () => {
    const grid = alphaGridFromPixels(solidAlpha(4, 4, 255), 4, 4, 2, 2)
    expect(grid).toEqual([[1, 1], [1, 1]])
  })

  it('reports zero density for a fully transparent tile — a real, legitimate reading', () => {
    const grid = alphaGridFromPixels(solidAlpha(4, 4, 0), 4, 4, 2, 2)
    expect(grid).toEqual([[0, 0], [0, 0]])
  })

  it('isolates density to the cell that actually has precipitation', () => {
    // 4x4 image, left half opaque, right half transparent.
    const data = new Uint8ClampedArray(4 * 4 * 4)
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        const alpha = x < 2 ? 255 : 0
        data[(y * 4 + x) * 4 + 3] = alpha
      }
    }
    const grid = alphaGridFromPixels(data, 4, 4, 2, 2)
    expect(grid).toEqual([[1, 0], [1, 0]])
  })

  it('respects a custom alpha threshold', () => {
    const grid = alphaGridFromPixels(solidAlpha(2, 2, 5), 2, 2, 1, 1, 10)
    expect(grid).toEqual([[0]])
  })
})

describe('densityToBraille', () => {
  it('emits a fully blank cell for zero density', () => {
    expect(densityToBraille([[0]])).toEqual(['⠀'])
  })

  it('emits a fully filled cell for full density', () => {
    expect(densityToBraille([[1]])[0]!.codePointAt(0)).toBe(0x28FF)
  })

  it('lights more dots for higher density, so heavier returns read denser', () => {
    const low = densityToBraille([[0.25]])[0]!.codePointAt(0)! - 0x2800
    const high = densityToBraille([[0.75]])[0]!.codePointAt(0)! - 0x2800
    const countBits = (n: number) => n.toString(2).split('').filter(b => b === '1').length
    expect(countBits(high)).toBeGreaterThan(countBits(low))
  })

  it('produces only braille glyphs, one per grid cell, preserving row/column shape', () => {
    const rows = densityToBraille([[0, 0.5, 1], [1, 0, 0.5]])
    expect(rows).toHaveLength(2)
    for (const row of rows) {
      expect([...row]).toHaveLength(3)
      for (const glyph of row) {
        expect(glyph.codePointAt(0)).toBeGreaterThanOrEqual(0x2800)
        expect(glyph.codePointAt(0)).toBeLessThanOrEqual(0x28FF)
      }
    }
  })

  it('clamps out-of-range or non-finite density rather than emitting garbage', () => {
    const [row] = densityToBraille([[Number.NaN, -1, 2]])
    const glyphs = [...row!]
    expect(glyphs[0]).toBe('⠀') // NaN -> 0
    expect(glyphs[1]).toBe('⠀') // -1 clamps to 0
    expect(glyphs[2]!.codePointAt(0)).toBe(0x28FF) // 2 clamps to 1 -> full
  })
})

describe('averageDensity', () => {
  it('averages every cell in the grid', () => {
    expect(averageDensity([[0, 1], [0.5, 0.5]])).toBe(0.5)
  })

  it('returns 0 for an empty grid rather than NaN', () => {
    expect(averageDensity([])).toBe(0)
  })
})
