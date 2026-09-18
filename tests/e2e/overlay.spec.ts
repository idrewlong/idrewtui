import AxeBuilder from '@axe-core/playwright'
import { expect, gotoHydrated, test } from './helpers'

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

test.describe('overlay toolkit', () => {
  test(': opens the command palette and Enter jumps to a tab', async ({ page }) => {
    await gotoHydrated(page, '/')

    await page.keyboard.press(':')
    const dialog = page.getByRole('dialog', { name: ':' })
    await expect(dialog).toBeVisible()
    await expect(dialog.locator('#palette-input')).toBeFocused()

    await page.locator('#palette-input').fill('git log')
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/experience$/)
    await expect(dialog).toBeHidden()
  })

  test('status-line : button is the click equivalent', async ({ page }) => {
    await gotoHydrated(page, '/')
    await page.getByRole('button', { name: 'Command palette' }).click()
    await expect(page.getByRole('dialog', { name: ':' })).toBeVisible()
  })

  test('/ finds in the content pane and n cycles', async ({ page }) => {
    await gotoHydrated(page, '/')

    await page.keyboard.press('/')
    const input = page.locator('#find-input')
    await expect(input).toBeFocused()
    await input.fill('translate')

    await expect(page.getByText('1/1')).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(input).toHaveCount(0)
  })

  test('man and less pagers open from the info page', async ({ page }) => {
    await gotoHydrated(page, '/')

    await page.getByRole('button', { name: '[ man idrew ]' }).click()
    const man = page.getByRole('dialog', { name: 'man idrew' })
    await expect(man).toBeVisible()
    await expect(man).toContainText('Senior Full Stack Developer')
    await expect(man).toContainText('in progress')

    await page.keyboard.press('Escape')
    await expect(man).toBeHidden()

    await page.getByRole('button', { name: '[ Read resume ]' }).click()
    const resume = page.getByRole('dialog', { name: 'less ~/resume' })
    await expect(resume).toBeVisible()
    await expect(resume).toContainText('Mad Genius')
  })

  test('palette, find, and help are exclusive', async ({ page }) => {
    await gotoHydrated(page, '/')

    await page.keyboard.press(':')
    await expect(page.getByRole('dialog', { name: ':' })).toBeVisible()

    await page.keyboard.press('Escape')
    await page.keyboard.press('?')
    await expect(page.getByRole('dialog', { name: 'keyboard shortcuts' })).toBeVisible()
    await expect(page.getByRole('dialog', { name: ':' })).toHaveCount(0)
  })

  test('opened palette is axe-clean', async ({ page }) => {
    await gotoHydrated(page, '/')
    await page.keyboard.press(':')
    const results = await new AxeBuilder({ page }).withTags(TAGS).analyze()
    expect(results.violations).toEqual([])
  })

  test('m opens compose and send is a mailto link', async ({ page }) => {
    await gotoHydrated(page, '/')

    await page.keyboard.press('m')
    const dialog = page.getByRole('dialog', { name: 'aerc compose' })
    await expect(dialog).toBeVisible()
    await expect(dialog.locator('#compose-subject')).toBeFocused()

    await dialog.locator('#compose-subject').fill('hello')
    await expect(dialog.getByRole('link', { name: '[ send ]' })).toHaveAttribute(
      'href',
      /mailto:idrewlong@gmail\.com\?subject=hello/,
    )

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
  })

  test('write button is the click equivalent of compose', async ({ page }) => {
    await gotoHydrated(page, '/')
    await page.getByRole('button', { name: 'write an email' }).click()
    await expect(page.getByRole('dialog', { name: 'aerc compose' })).toBeVisible()
  })
})
