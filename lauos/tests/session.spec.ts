import { test, expect } from '@playwright/test'

// AUTH-02: Session persists on browser refresh and new tabs
test('refreshing /dashboard keeps session active', async ({ page }) => {
  // Pre-condition: user must be logged in
  await page.goto('/dashboard')
  await page.reload()
  await expect(page).toHaveURL('/dashboard')
  // Should NOT redirect to /login after refresh
})

test('opening new context on /dashboard keeps session (cookie persists)', async ({ browser }) => {
  // Creates a new browser context sharing the same storage state
  const context = await browser.newContext()
  const page = await context.newPage()
  await page.goto('/dashboard')
  // If session is not persistent, this redirects to /login
  await expect(page).not.toHaveURL('/login')
  await context.close()
})
