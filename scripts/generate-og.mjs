/**
 * Generates `public/og.png`: a real screenshot of the rendered dashboard,
 * at the standard Open Graph size (1200x630), for the social-preview meta
 * tags every page sets (`ogImage: '/og.png'`).
 *
 * Builds the static site fresh, serves it with `nuxt preview` (the same
 * command `tests/e2e` uses against the real static output), and drives
 * Chromium — the `@playwright/test` browser already installed for e2e — to
 * capture it at the default theme (tokyo-night, dark).
 *
 * The weather panel makes the site's one live network call
 * (`app/composables/useWeather.ts`); it is stubbed here with a canned
 * forecast so the image is reproducible and never captures a "forecast
 * unavailable" state, which would look broken in a social preview.
 *
 * Deliberate, not automatic: run with `pnpm generate-og` whenever the design
 * changes. Not wired into `pnpm generate` — a build should not depend on a
 * screenshot of itself.
 */
import { spawn, spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const PORT = Number(process.env.OG_PORT ?? 4173)
const BASE_URL = `http://localhost:${PORT}`
const OUT = join(ROOT, 'public', 'og.png')

function run(command, args) {
  const result = spawnSync(command, args, { cwd: ROOT, stdio: 'inherit' })
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} exited with ${result.status}`)
  }
}

async function waitForServer(url, timeoutMs = 60_000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url)
      if (response.ok) return
    }
    catch {
      // Server not accepting connections yet.
    }
    await new Promise(resolve => setTimeout(resolve, 250))
  }
  throw new Error(`timed out waiting for ${url}`)
}

/**
 * A structurally real Open-Meteo payload (see `toForecast` in
 * `useWeather.ts`) with frozen values, so the panel always renders the same
 * "ready" state instead of depending on the actual weather or on network
 * access being available in whatever environment runs this script.
 */
function forecastPayload() {
  const hours = Array.from({ length: 24 }, (_, i) => i)
  return {
    current: { temperature_2m: 68, weather_code: 1 },
    hourly: {
      time: hours.map(h => `2026-06-01T${String(h).padStart(2, '0')}:00`),
      temperature_2m: hours.map(h => Math.round(64 + 8 * Math.sin(((h - 6) / 24) * Math.PI * 2))),
      precipitation_probability: hours.map(() => 10),
    },
  }
}

console.log('[generate-og] building the static site (pnpm generate)...')
run('pnpm', ['generate'])

console.log('[generate-og] starting nuxt preview...')
// The static Nitro preset's `nuxt preview` shells out to `npx serve`, which
// does not read the `--port` CLI flag — only the `PORT` env var picks a
// non-default port (see `tests/e2e`'s webServer, which never exercises this
// because its port already matches serve's own default of 3000).
const preview = spawn('pnpm', ['exec', 'nuxt', 'preview'], {
  cwd: ROOT,
  stdio: 'inherit',
  detached: true,
  env: { ...process.env, PORT: String(PORT) },
})

let browser
try {
  await waitForServer(BASE_URL)

  browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: 1200, height: 630 },
    colorScheme: 'dark',
    reducedMotion: 'reduce',
  })

  // The only live network request the site makes — stub it so the render is
  // deterministic and never shows the "forecast unavailable" failure state.
  await context.route('https://api.open-meteo.com/**', async route => {
    await route.fulfill({ json: forecastPayload() })
  })

  const page = await context.newPage()
  console.log(`[generate-og] loading ${BASE_URL}/ ...`)
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' })

  // `default.vue` flips this on mount, after the pre-paint theme script has
  // already run — the real signal that the default dark theme is stamped
  // and hydration has finished, not an arbitrary timeout.
  await page.waitForFunction(() => document.documentElement.dataset.ready === 'true')
  await page.evaluate(() => document.fonts.ready)
  // One tick for the stubbed weather response to repaint the wx panel.
  await page.waitForTimeout(300)

  const theme = await page.evaluate(() => document.documentElement.dataset.theme)
  if (theme !== 'tokyo-night') {
    throw new Error(`expected the default tokyo-night theme, got "${theme}"`)
  }

  console.log(`[generate-og] writing ${OUT}...`)
  await page.screenshot({ path: OUT })

  console.log('[generate-og] done')
}
finally {
  await browser?.close()
  if (preview.pid) {
    try {
      process.kill(-preview.pid, 'SIGTERM')
    }
    catch {
      // Already gone.
    }
  }
}
