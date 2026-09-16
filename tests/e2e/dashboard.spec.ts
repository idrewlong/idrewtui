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

  test('visitor specs are fully visible, not clipped, once hydrated', async ({ page }) => {
    await page.goto('/')
    const panel = page.getByRole('region', { name: 'visitor' })

    // Same fixed-height/CLS guard as the whoami test below: the panel must
    // not resize once real values replace the pre-hydration em-dashes.
    const before = (await panel.boundingBox())!.height
    await expect(page.locator('html')).toHaveAttribute('data-ready', 'true')
    const after = (await panel.boundingBox())!.height
    expect(after).toBe(before)

    // Rendered, not merely present: the fixed-height body must not clip its
    // content now that real values have populated it (a clipped element can
    // still pass a `toContainText` check). This is the same failure class
    // that WhoamiPanel's rows had to be corrected for in Task 4.
    const overflow = await panel.locator('.panel__body').evaluate(el => ({
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
    }))
    expect(overflow.scrollHeight, 'visitor body overflows vertically').toBeLessThanOrEqual(overflow.clientHeight)
    expect(overflow.scrollWidth, 'visitor body overflows horizontally').toBeLessThanOrEqual(overflow.clientWidth)
  })

  test('whoami certifications and stack are fully visible, not clipped', async ({ page }) => {
    await page.goto('/')
    const panel = page.getByRole('region', { name: 'whoami' })

    // Full text present — not just in the DOM, but rendered.
    const text = await panel.innerText()
    expect(text).toContain('CompTIA Security+ (SY0-701)')
    expect(text).toContain('AWS Solutions Architect')
    expect(text).toContain('Associate')
    expect(text).toContain('FAA Part 107 Remote Pilot')

    // Rendered, not merely present: the fixed-height body must not clip its
    // content (a clipped element can still pass a `toContainText` check).
    const overflow = await panel.locator('.panel__body').evaluate(el => ({
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
    }))
    expect(overflow.scrollHeight, 'whoami body overflows vertically').toBeLessThanOrEqual(overflow.clientHeight)
    expect(overflow.scrollWidth, 'whoami body overflows horizontally').toBeLessThanOrEqual(overflow.clientWidth)
  })

  test('meters panel is fully visible, not clipped, and does not resize on hydration', async ({ page }) => {
    await page.goto('/')
    const panel = page.getByRole('region', { name: 'meters' })

    // Same fixed-height/CLS guard as the visitor and whoami panels: the
    // meters panel ticks continuously after hydration (fps, heap, etc.), so
    // this is the one place on the page where a height change would be
    // easiest to miss — it must still hold across every subsequent tick.
    const before = (await panel.boundingBox())!.height
    await expect(page.locator('html')).toHaveAttribute('data-ready', 'true')
    await page.waitForTimeout(1200)
    const after = (await panel.boundingBox())!.height
    expect(after).toBe(before)

    // Rendered, not merely present: the fixed-height body must not clip its
    // content now that live values have populated it.
    const overflow = await panel.locator('.panel__body').evaluate(el => ({
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
    }))
    expect(overflow.scrollHeight, 'meters body overflows vertically').toBeLessThanOrEqual(overflow.clientHeight)
    expect(overflow.scrollWidth, 'meters body overflows horizontally').toBeLessThanOrEqual(overflow.clientWidth)
  })

  test('session panel is fully visible, not clipped, and does not resize on hydration', async ({ page }) => {
    await page.goto('/')
    const panel = page.getByRole('region', { name: 'session' })

    // Same fixed-height/CLS guard as meters: the clock and uptime tick every
    // second after hydration, so the height must hold across ticks too.
    const before = (await panel.boundingBox())!.height
    await expect(page.locator('html')).toHaveAttribute('data-ready', 'true')
    await page.waitForTimeout(1200)
    const after = (await panel.boundingBox())!.height
    expect(after).toBe(before)

    const overflow = await panel.locator('.panel__body').evaluate(el => ({
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
    }))
    expect(overflow.scrollHeight, 'session body overflows vertically').toBeLessThanOrEqual(overflow.clientHeight)
    expect(overflow.scrollWidth, 'session body overflows horizontally').toBeLessThanOrEqual(overflow.clientWidth)
  })

  test('session panel does not clip once the navigation log is full', async ({ page }) => {
    await page.goto('/')
    const panel = page.getByRole('region', { name: 'session' })
    const heightWithEmptyLog = (await panel.boundingBox())!.height

    // Drive real client-side navigations (past the log's cap of 5) so the
    // panel is measured in the state that is easiest to miss in review: a
    // fully grown log, not the pristine first-load one.
    for (const label of ['experience', 'projects', 'skills', 'info', 'experience', 'projects']) {
      await page.getByRole('link', { name: label, exact: true }).click()
      await page.waitForTimeout(50)
    }

    await expect(panel.locator('.log__row')).toHaveCount(5)

    const heightWithFullLog = (await panel.boundingBox())!.height
    expect(heightWithFullLog, 'session panel resized once the log filled up').toBe(heightWithEmptyLog)

    const overflow = await panel.locator('.panel__body').evaluate(el => ({
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
    }))
    expect(overflow.scrollHeight, 'session body overflows vertically once the log is full').toBeLessThanOrEqual(overflow.clientHeight)
    expect(overflow.scrollWidth, 'session body overflows horizontally once the log is full').toBeLessThanOrEqual(overflow.clientWidth)
  })

  test('whoami stack does not clip at the 768px (md) breakpoint', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/')
    const panel = page.getByRole('region', { name: 'whoami' })

    const text = await panel.innerText()
    expect(text).toContain('Laravel')
    expect(text).toContain('Go')

    const overflow = await panel.locator('.panel__body').evaluate(el => ({
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
    }))
    expect(overflow.scrollHeight).toBeLessThanOrEqual(overflow.clientHeight)
  })
})
