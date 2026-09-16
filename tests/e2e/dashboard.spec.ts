import { expect, test } from '@playwright/test'

test.describe('dashboard shell', () => {
  test('renders the named panels around the content region', async ({ page }) => {
    await page.goto('/')
    for (const title of ['whoami', 'visitor', 'meters', 'wx', 'session']) {
      await expect(page.getByRole('region', { name: title })).toBeVisible()
    }
    await expect(page.locator('#main')).toBeVisible()
  })

  test('keeps the recruiter panel above the fold at 1366x768', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 })
    await page.goto('/')

    const box = await page.getByRole('region', { name: 'whoami' }).boundingBox()
    expect(box).not.toBeNull()
    expect(box!.y + box!.height).toBeLessThanOrEqual(768)
  })

  test('panel heights do not change when values populate', async ({ page }) => {
    await page.goto('/')
    const panel = page.getByRole('region', { name: 'visitor' })
    const before = (await panel.boundingBox())!.height
    await expect(page.locator('html')).toHaveAttribute('data-ready', 'true')
    const after = (await panel.boundingBox())!.height
    expect(after).toBe(before)
  })
})
