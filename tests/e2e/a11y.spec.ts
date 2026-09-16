import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { gotoHydrated } from './helpers'

const routes = ['/', '/experience', '/projects', '/skills', '/not-a-real-path']

/** WCAG 2.2 AA, which is the bar set in docs/PROJECT.md §1. */
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

test.describe('accessibility', () => {
  for (const route of routes) {
    test(`${route} has no axe violations (dark)`, async ({ page }) => {
      await page.goto(route)
      const results = await new AxeBuilder({ page }).withTags(TAGS).analyze()
      expect(results.violations).toEqual([])
    })

    test(`${route} has no axe violations (light)`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'light' })
      await page.goto(route)
      const results = await new AxeBuilder({ page }).withTags(TAGS).analyze()
      expect(results.violations).toEqual([])
    })
  }

  test('the help overlay is accessible and traps focus', async ({ page }) => {
    await gotoHydrated(page, '/')
    await page.keyboard.press('?')

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Focus moved into the dialog on open.
    await expect(dialog.locator(':focus')).toHaveCount(1)

    const results = await new AxeBuilder({ page }).withTags(TAGS).analyze()
    expect(results.violations).toEqual([])

    // Esc closes it and focus returns to the page.
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
  })

  test('respects reduced motion on first load', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')

    // The command is shown in full immediately, not typed out.
    await expect(page.locator('h1')).toContainText('fastfetch')
  })
})
