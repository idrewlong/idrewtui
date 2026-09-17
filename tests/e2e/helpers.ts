import { test as base, expect, type Page } from '@playwright/test'

/**
 * Wait until the app is actually interactive.
 *
 * `#__nuxt.__vue_app__` is set before `onMounted` hooks flush, so it is too
 * early to press keys against: the keydown listener is registered on mount.
 * The layout sets `data-ready` from its own `onMounted`, which is the first
 * moment shortcuts can fire.
 */
export async function waitForHydration(page: Page) {
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true')
}

/** Navigate and wait for the page to become interactive. */
export async function gotoHydrated(page: Page, path: string) {
  await page.goto(path)
  await waitForHydration(page)
}

/**
 * Fixed Open-Meteo payload used to stub every e2e test's page by default.
 * Exported so a spec that needs a different shape (denied/failed forecast,
 * a taller panel state, etc.) can build its own `route.fulfill` body without
 * duplicating these arrays.
 */
export const DEFAULT_FORECAST_PAYLOAD = {
  current: { temperature_2m: 74.1, weather_code: 2 },
  hourly: {
    time: Array.from({ length: 24 }, (_, i) => `2026-09-15T${String(i).padStart(2, '0')}:00`),
    temperature_2m: Array.from({ length: 24 }, (_, i) => 65 + Math.round(10 * Math.sin(i / 3))),
    precipitation_probability: Array.from({ length: 24 }, (_, i) => Math.round(50 + 40 * Math.sin(i / 5))),
  },
}

/**
 * Fixed RainViewer index payload used to stub every e2e test's radar frame
 * lookup by default. `latestRadarFrame` (`~/utils/radar`) takes the LAST
 * entry of `past`, so this deliberately has two so a bad "just take past[0]"
 * regression would be caught.
 */
export const DEFAULT_RADAR_INDEX_PAYLOAD = {
  host: 'https://tilecache.rainviewer.com',
  radar: {
    past: [
      { time: 1_757_900_000, path: '/v2/radar/1757900000' },
      { time: 1_757_900_600, path: '/v2/radar/1757900600' },
    ],
  },
}

/**
 * An 8x8 RGBA PNG, left half opaque (simulated precipitation) and right
 * half fully transparent — enough for `alphaGridFromPixels` to produce a
 * non-uniform density grid, so a radar test can assert the rendered braille
 * grid is not blank. Generated once with Node's zlib + a minimal hand-rolled
 * PNG encoder (no image library dependency); not meant to resemble a real
 * radar tile's shape, only to exercise the alpha-threshold pipeline.
 */
export const RADAR_TILE_PNG_BASE64
  = 'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAE0lEQVR4nGNgOMHwHwVjgBGhAAD5+jjhuY5wawAAAABJRU5ErkJggg=='

/**
 * Every spec in this directory must import `test`/`expect` from here rather
 * than `@playwright/test` directly. The weather panel is the site's only
 * source of network requests (Open-Meteo for the forecast, RainViewer for
 * the radar), but they fire on every page load — without a project-wide
 * stub, every a11y/routing/keyboard test (which never mention weather or
 * radar) would silently depend on live third-party APIs being up and fast,
 * and would leak real requests to them from CI.
 *
 * Both fixtures are `auto: true`: they run for every test, before that
 * test's own hooks and body, with no test needing to request them by name.
 * A test that wants a different response (denied geolocation, a failed
 * request, a taller panel state) can still call `page.route(...)` itself
 * afterwards — Playwright resolves overlapping route handlers
 * last-registered-first, so the test's own handler wins.
 */
export const test = base.extend<{ stubWeather: true, stubRadar: true }>({
  stubWeather: [async ({ page }, use) => {
    await page.route('**/api.open-meteo.com/**', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(DEFAULT_FORECAST_PAYLOAD),
      }))
    await use(true)
  }, { auto: true }],

  stubRadar: [async ({ page }, use) => {
    await page.route('**/api.rainviewer.com/**', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(DEFAULT_RADAR_INDEX_PAYLOAD),
      }))
    await page.route('**/tilecache.rainviewer.com/**', route =>
      route.fulfill({
        status: 200,
        contentType: 'image/png',
        // Mirrors the real tiles' header (confirmed separately) so a test
        // that inspects response headers sees the same CORS shape.
        headers: { 'access-control-allow-origin': '*' },
        body: Buffer.from(RADAR_TILE_PNG_BASE64, 'base64'),
      }))
    await use(true)
  }, { auto: true }],
})

export { expect }
