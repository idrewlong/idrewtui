import { expect, gotoHydrated, test } from './helpers'

test.describe('keyboard navigation', () => {
  test('1-4 switch tabs', async ({ page }) => {
    await gotoHydrated(page, '/')

    await page.keyboard.press('2')
    await expect(page).toHaveURL(/\/experience$/)

    await page.keyboard.press('3')
    await expect(page).toHaveURL(/\/projects$/)

    await page.keyboard.press('4')
    await expect(page).toHaveURL(/\/skills$/)

    await page.keyboard.press('1')
    await expect(page).toHaveURL(/\/$/)
  })

  test('h and l step between tabs and wrap', async ({ page }) => {
    await gotoHydrated(page, '/')

    await page.keyboard.press('l')
    await expect(page).toHaveURL(/\/experience$/)

    await page.keyboard.press('h')
    await expect(page).toHaveURL(/\/$/)

    // Wrapping backwards from the first tab lands on the last.
    await page.keyboard.press('h')
    await expect(page).toHaveURL(/\/skills$/)
  })

  test('? opens help and Esc closes it', async ({ page }) => {
    await gotoHydrated(page, '/')

    await page.keyboard.press('?')
    await expect(page.getByRole('dialog')).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toBeHidden()
  })

  test('t cycles the theme and persists it', async ({ page }) => {
    await gotoHydrated(page, '/')
    const before = await page.locator('html').getAttribute('data-theme')
    expect(before).toBeTruthy()

    await page.keyboard.press('t')
    const after = await page.locator('html').getAttribute('data-theme')
    expect(after).not.toBe(before)

    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('data-theme', after!)
  })

  test('f cycles the project filter', async ({ page }) => {
    await gotoHydrated(page, '/projects')

    await expect(page.getByRole('button', { name: '[all]' })).toHaveAttribute('aria-pressed', 'true')
    await page.keyboard.press('f')
    await expect(page.getByRole('button', { name: '[client]' })).toHaveAttribute('aria-pressed', 'true')
  })

  test('shortcuts are ignored while typing in a field', async ({ page }) => {
    await gotoHydrated(page, '/')

    // Inject a field to prove the guard works on a real input.
    await page.evaluate(() => {
      const input = document.createElement('input')
      input.id = 'probe'
      document.querySelector('main')?.appendChild(input)
    })

    await page.locator('#probe').fill('2')
    await expect(page).toHaveURL(/\/$/)
    await expect(page.locator('#probe')).toHaveValue('2')
  })

  test('every interactive element shows a focus ring', async ({ page }) => {
    await gotoHydrated(page, '/')
    await page.keyboard.press('Tab')

    const outline = await page.evaluate(() => {
      const el = document.activeElement
      return el ? getComputedStyle(el).outlineStyle : 'none'
    })
    expect(outline).not.toBe('none')
  })
})
