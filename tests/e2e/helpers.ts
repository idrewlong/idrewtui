import { expect, type Page } from '@playwright/test'

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
