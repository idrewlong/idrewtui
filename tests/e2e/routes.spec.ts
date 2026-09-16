import { expect, test } from '@playwright/test'

const routes = [
  { path: '/', heading: /Andrew Long/, tab: 'info' },
  { path: '/experience', heading: /Experience/, tab: 'experience' },
  { path: '/projects', heading: /Projects/, tab: 'projects' },
  { path: '/skills', heading: /Skills/, tab: 'skills' },
]

test.describe('routes', () => {
  for (const route of routes) {
    test(`${route.path} renders with exactly one h1`, async ({ page }) => {
      await page.goto(route.path)

      const h1 = page.locator('h1')
      await expect(h1).toHaveCount(1)
      await expect(h1).toContainText(route.heading)

      // The tab for this route is the current one.
      await expect(page.locator('nav a[aria-current="page"]')).toContainText(route.tab)
    })

    test(`${route.path} sets a title, description and canonical`, async ({ page }) => {
      await page.goto(route.path)

      await expect(page).toHaveTitle(/\S/)
      const description = page.locator('meta[name="description"]')
      await expect(description).toHaveAttribute('content', /\S/)
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /^https:\/\//)
    })
  }

  test('the resume link is reachable from every view', async ({ page }) => {
    for (const route of routes) {
      await page.goto(route.path)
      await expect(page.locator('nav a[href$="resume.pdf"]')).toBeVisible()
    }
  })

  test('an unknown path renders the 404 view with links back', async ({ page }) => {
    const response = await page.goto('/not-a-real-path')
    expect(response?.status()).toBe(404)

    await expect(page.locator('h1')).toContainText('Page not found')
    await expect(page.locator('a[href="/"]').first()).toBeVisible()
  })

  test('the tab bar fits inside the frame at narrow widths', async ({ page }) => {
    // The four labels plus the resume link are the tightest thing on the page;
    // at 13px they overflow a 360px screen and "skills" gets clipped.
    for (const width of [320, 360, 768]) {
      await page.setViewportSize({ width, height: 700 })
      await page.goto('/')

      const clipped = await page.locator('.tabbar__list').evaluate(
        el => el.scrollWidth > el.clientWidth + 1,
      )
      expect(clipped, `tab bar clipped at ${width}px`).toBe(false)

      const overflows = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      )
      expect(overflows, `page scrolls horizontally at ${width}px`).toBe(false)
    }
  })

  test('Person JSON-LD is present on the home page', async ({ page }) => {
    await page.goto('/')
    const raw = await page.locator('script[type="application/ld+json"]').textContent()
    const data = JSON.parse(raw ?? '{}')

    expect(data['@type']).toBe('Person')
    expect(data.name).toBeTruthy()
    expect(data.jobTitle).toBeTruthy()
  })
})

test.describe('content without JavaScript', () => {
  test.use({ javaScriptEnabled: false })

  for (const route of routes) {
    test(`${route.path} is readable with JS disabled`, async ({ page }) => {
      await page.goto(route.path)
      await expect(page.locator('h1')).toHaveCount(1)
      await expect(page.locator('main')).not.toBeEmpty()
    })
  }

  test('experience entries expand without JS', async ({ page }) => {
    await page.goto('/experience')
    // <details> works natively, so a collapsed role can still be opened.
    // Pin the element by index: a `:not([open])` locator is live and would
    // re-resolve to the next still-closed entry after this one opens.
    const roles = page.locator('details.role')
    const collapsed = roles.nth(2)
    await expect(collapsed).not.toHaveAttribute('open', '')

    await collapsed.locator('summary').click()
    await expect(collapsed).toHaveAttribute('open', '')
  })
})
