import { expect, test } from '@playwright/test'

/** Never hit the live API from CI. */
const PAYLOAD = {
  current: { temperature_2m: 74.1, weather_code: 2 },
  hourly: {
    time: Array.from({ length: 24 }, (_, i) => `2026-09-15T${String(i).padStart(2, '0')}:00`),
    temperature_2m: Array.from({ length: 24 }, (_, i) => 65 + Math.round(10 * Math.sin(i / 3))),
  },
}

test.beforeEach(async ({ page }) => {
  await page.route('**/api.open-meteo.com/**', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(PAYLOAD) }))
})

test.describe('weather panel', () => {
  test('falls back silently when geolocation is denied', async ({ page, context }) => {
    await context.clearPermissions()
    await page.goto('/')

    const panel = page.getByRole('region', { name: /^wx/ })
    await expect(panel).toContainText('Long Beach, MS')
    await expect(panel).toContainText('74°F')
    // Denial is a non-event: no error text anywhere in the panel.
    await expect(panel).not.toContainText('unavailable')
  })

  test('uses the visitor location when geolocation is granted', async ({ page, context }) => {
    await context.grantPermissions(['geolocation'])
    await context.setGeolocation({ latitude: 34.73, longitude: -86.58 })
    await page.goto('/')

    await expect(page.getByRole('region', { name: /^wx/ })).toContainText('your location')
  })

  test('still shows sun and moon when the forecast request fails', async ({ page }) => {
    await page.route('**/api.open-meteo.com/**', route => route.abort())
    await page.goto('/')

    const panel = page.getByRole('region', { name: /^wx/ })
    await expect(panel).toContainText('forecast unavailable')
    // Sun/moon are computed locally, so they survive.
    await expect(panel).toContainText(/waxing|waning|full|new|quarter/)
  })

  test('the temperature chart carries a text summary', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText(/Hourly temperature: .*°F/)).toBeAttached()
  })
})
