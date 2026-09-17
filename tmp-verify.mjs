import { readFileSync } from 'node:fs'
import { chromium } from '@playwright/test'

const RADAR_BLOB_PNG = readFileSync('/tmp/radar-blob.png')

const browser = await chromium.launch()

async function run(width) {
  const page = await browser.newPage({ viewport: { width, height: 1000 } })
  await page.route('**/api.open-meteo.com/**', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
      current: { temperature_2m: 74.1, weather_code: 2 },
      hourly: { time: ['2026-09-15T00:00'], temperature_2m: [70] },
    }) }))
  await page.route('**/api.rainviewer.com/**', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
      host: 'https://tilecache.rainviewer.com',
      radar: { past: [{ time: 1757900000, path: '/v2/radar/1757900000' }] },
    }) }))
  await page.route('**/tilecache.rainviewer.com/**', route =>
    route.fulfill({ status: 200, contentType: 'image/png', headers: { 'access-control-allow-origin': '*' }, body: RADAR_BLOB_PNG }))

  await page.goto('http://localhost:3000/')
  await page.waitForSelector('html[data-ready="true"]')
  await page.waitForTimeout(800)

  const panel = page.locator('section[aria-label*="wx"]')
  const box = await panel.boundingBox()
  const chartRow = panel.locator('.chart-row')
  const chartRowBox = await chartRow.boundingBox()
  const radar = panel.locator('.radar')
  const radarVisible = await radar.isVisible().catch(() => false)
  const radarBox = radarVisible ? await radar.boundingBox() : null
  const tempChartBox = await panel.locator('.chart').boundingBox().catch(() => null)
  const rowsText = radarVisible ? await radar.locator('.radar__rows').innerText().catch(() => '(none)') : '(hidden)'
  const overflow = await panel.locator('.panel__body').evaluate(el => ({
    scrollHeight: el.scrollHeight, clientHeight: el.clientHeight,
    scrollWidth: el.scrollWidth, clientWidth: el.clientWidth,
  }))

  console.log(`\n=== width ${width} ===`)
  console.log('panel height:', box?.height, 'panel width:', box?.width)
  console.log('overflow:', JSON.stringify(overflow))
  console.log('chart-row box:', JSON.stringify(chartRowBox))
  console.log('temp chart box:', JSON.stringify(tempChartBox))
  console.log('radar visible:', radarVisible, 'radar box:', JSON.stringify(radarBox))
  console.log('radar rows:\n' + rowsText)

  await panel.screenshot({ path: `/tmp/wx-${width}.png` })
  await page.close()
}

for (const w of [1000, 1200, 1366, 1500, 2000]) await run(w)

await browser.close()
