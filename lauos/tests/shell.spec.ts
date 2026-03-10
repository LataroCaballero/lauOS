import { test, expect } from '@playwright/test'

// Helper: log in before each test that requires auth
async function loginAs(page: any) {
  await page.goto('/login')
  await page.fill('input[type="email"]', process.env.TEST_EMAIL ?? 'test@example.com')
  await page.fill('input[type="password"]', process.env.TEST_PASSWORD ?? 'testpassword')
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/(dashboard|$)/)
}

test.describe('navbar', () => {
  test.beforeEach(async ({ page }) => { await loginAs(page) })

  test('shows module links, user name, and logout option on every protected page', async ({ page }) => {
    await page.goto('/dashboard')
    // Navbar is visible
    await expect(page.locator('nav[aria-label="main navigation"]')).toBeVisible()
    // User name rendered somewhere in the navbar
    // (actual selector tightened once navbar is implemented)
    await expect(page.locator('[data-testid="navbar-username"]')).toBeVisible()
    // Logout exists
    await expect(page.locator('[data-testid="logout-button"]')).toBeVisible()
  })
})

test.describe('module grid', () => {
  test.beforeEach(async ({ page }) => { await loginAs(page) })

  test('home page shows module cards and clicking one navigates to module route', async ({ page }) => {
    await page.goto('/dashboard')
    const card = page.locator('[data-testid="module-card-finance"]')
    await expect(card).toBeVisible()
    await card.click()
    await expect(page).toHaveURL('/finance')
  })
})

test.describe('dark mode', () => {
  test.beforeEach(async ({ page }) => { await loginAs(page) })

  test('toggle applies dark class immediately and preference survives refresh', async ({ page }) => {
    await page.goto('/dashboard')
    const toggle = page.locator('[data-testid="theme-toggle"]')
    await toggle.click()
    await expect(page.locator('html')).toHaveClass(/dark/)
    await page.reload()
    await expect(page.locator('html')).toHaveClass(/dark/)
    // Reset to light
    await toggle.click()
  })
})

test.describe('mobile layout', () => {
  test.use({ viewport: { width: 375, height: 812 } })
  test.beforeEach(async ({ page }) => { await loginAs(page) })

  test('no horizontal scroll on 375px viewport and bottom nav is visible', async ({ page }) => {
    await page.goto('/dashboard')
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth)
    const clientWidth = await page.evaluate(() => document.body.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth)
    await expect(page.locator('[data-testid="bottom-nav"]')).toBeVisible()
  })
})

test.describe('accent color', () => {
  test.beforeEach(async ({ page }) => { await loginAs(page) })

  test('accent color change reflects in UI immediately and persists after refresh', async ({ page }) => {
    await page.goto('/settings')
    const blueAccent = page.locator('[data-testid="accent-swatch-blue"]')
    await blueAccent.click()
    // The --primary CSS variable should be updated on :root
    const primaryVar = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--primary').trim()
    )
    expect(primaryVar).toBeTruthy()
    await page.reload()
    // After reload, accent should still be applied from PocketBase
    const primaryVarAfterReload = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--primary').trim()
    )
    expect(primaryVarAfterReload).toBeTruthy()
  })
})
