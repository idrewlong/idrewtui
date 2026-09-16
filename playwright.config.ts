import { defineConfig, devices } from '@playwright/test'

const PORT = 3000
const baseURL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 768 } } },
    { name: 'mobile', use: { ...devices['Pixel 5'] } },
  ],
  // Test the real static output, which is what ships.
  webServer: {
    command: 'pnpm generate && pnpm preview',
    url: baseURL,
    // Never reuse: the command rebuilds, so an already-running preview server
    // would silently serve a stale build and the run would pass or fail against
    // code that is no longer on disk.
    reuseExistingServer: false,
    timeout: 180_000,
  },
})
