import { expect, test } from './helpers'

/**
 * The radar only renders at the >=75rem (1200px) breakpoint — the one
 * width at which the weather panel is actually wide enough to have unused
 * space beside its temperature chart. Every test here sets an explicit
 * viewport well above that so radar visibility does not depend on which
 * Playwright project (desktop/mobile) happens to run it.
 */
const WIDE_VIEWPORT = { width: 1366, height: 900 }

test.describe('radar', () => {
  test('renders a non-blank grid from the stubbed frame index + tile', async ({ page }) => {
    await page.setViewportSize(WIDE_VIEWPORT)
    await page.goto('/')
    await expect(page.locator('html')).toHaveAttribute('data-ready', 'true')

    const panel = page.getByRole('region', { name: /^wx/ })
    const radar = panel.locator('.radar')
    await expect(radar).toBeVisible()

    // Rendered, not merely present: the stubbed 8x8 tile is half opaque
    // (simulated precipitation) and half transparent, so the resulting
    // braille grid must include at least one non-blank glyph — a flat
    // "all blank" grid here would mean the alpha pipeline never ran.
    const rowsEl = radar.locator('.radar__rows')
    await expect(rowsEl).toBeVisible()
    const text = await rowsEl.innerText()
    const nonBlankGlyphs = [...text].filter(ch => ch !== '⠀' && ch !== '\n')
    expect(nonBlankGlyphs.length, 'expected at least one non-blank braille glyph').toBeGreaterThan(0)

    // Label + timestamp are visible (not just in the hidden summary) —
    // stale radar presented as current would be misleading.
    await expect(radar).toContainText(/radar · \d{2}:\d{2}/)

    // The visually-hidden summary carries the coverage figure and names
    // what is being shown, for anyone who cannot see the glyphs.
    await expect(panel.getByText(/radar-detected precipitation/)).toBeAttached()
  })

  test('renders an honest "unavailable" state when the frame index fails — distinct from a real zero reading', async ({ page }) => {
    // Overrides the auto stubRadar fixture: last-registered route handler
    // wins, so this replaces the default success response.
    await page.route('**/api.rainviewer.com/**', route => route.abort())
    await page.setViewportSize(WIDE_VIEWPORT)
    await page.goto('/')
    await expect(page.locator('html')).toHaveAttribute('data-ready', 'true')

    const panel = page.getByRole('region', { name: /^wx/ })
    const radar = panel.locator('.radar')
    await expect(radar).toContainText('unavailable')

    // No grid was attempted at all, and no fabricated coverage percentage —
    // "could not load" must not render like a legitimate "0% precipitation"
    // reading.
    await expect(radar.locator('.radar__rows')).toHaveCount(0)
    await expect(panel).not.toContainText('radar-detected precipitation')
  })

  test('renders an honest "unavailable" state when the tile itself fails to load', async ({ page }) => {
    await page.route('**/tilecache.rainviewer.com/**', route => route.abort())
    await page.setViewportSize(WIDE_VIEWPORT)
    await page.goto('/')
    await expect(page.locator('html')).toHaveAttribute('data-ready', 'true')

    const panel = page.getByRole('region', { name: /^wx/ })
    const radar = panel.locator('.radar')
    await expect(radar).toContainText('unavailable')
    await expect(radar.locator('.radar__rows')).toHaveCount(0)
  })
})
