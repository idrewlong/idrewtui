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
 * The weather panel is the site's only source of network requests
 * (Open-Meteo). They fire on every page load — without a project-wide stub,
 * every a11y/routing/keyboard test would silently depend on a live API.
 *
 * Fixtures are `auto: true`: they run for every test, before that test's own
 * hooks and body. A test that wants a different response can still call
 * `page.route(...)` afterwards — Playwright resolves overlapping route
 * handlers last-registered-first, so the test's own handler wins.
 */
export const test = base.extend<{ stubWeather: true }>({
  stubWeather: [async ({ page }, use) => {
    await page.route('**/api.open-meteo.com/**', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(DEFAULT_FORECAST_PAYLOAD),
      }))
    await use(true)
  }, { auto: true }],
})

export { expect }
