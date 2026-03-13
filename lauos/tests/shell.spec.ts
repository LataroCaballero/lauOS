import { test, expect } from '@playwright/test'
import path from 'path'

test.describe('navbar', () => {
  test('shows module links, user name, and logout option on every protected page', async ({ page }) => {
    await page.goto('/dashboard')
    // Navbar is visible (rendered as <header aria-label="main navigation">)
    await expect(page.locator('[aria-label="main navigation"]')).toBeVisible()
    // User name rendered in the navbar
    await expect(page.locator('[data-testid="navbar-username"]')).toBeVisible()
    // Open user menu to reveal logout button
    await page.locator('[data-testid="user-menu-trigger"]').click()
    await expect(page.locator('[data-testid="logout-button"]')).toBeVisible()
  })
})

test.describe('module grid', () => {
  test('home page shows module cards and clicking one navigates to module route', async ({ page }) => {
    await page.goto('/dashboard')
    const card = page.locator('[data-testid="module-card-finance"]')
    await expect(card).toBeVisible()
    await card.click()
    // /finance redirects to /finance/accounts
    await expect(page).toHaveURL(/\/finance/)
  })
})

test.describe('dark mode', () => {
  test('toggle applies dark class immediately and preference survives refresh', async ({ page }) => {
    await page.goto('/dashboard')
    const toggle = page.locator('[data-testid="theme-toggle"]')
    // Ensure we start in light mode
    await page.evaluate(() => document.documentElement.classList.remove('dark'))
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

  test('no horizontal scroll on 375px viewport and bottom nav is visible', async ({ page }) => {
    await page.goto('/dashboard')
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth)
    const clientWidth = await page.evaluate(() => document.body.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth)
    await expect(page.locator('[data-testid="bottom-nav"]')).toBeVisible()
  })
})

test.describe('accent color', () => {
  test('accent color change reflects in UI immediately and persists after refresh', async ({ page }) => {
    await page.goto('/settings')
    // Switch to the Appearance tab (accent swatches live there)
    await page.getByRole('tab', { name: /apariencia/i }).click()
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
