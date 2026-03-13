import { test, expect } from '@playwright/test'
import path from 'path'

// AUTH-02: Session persists on browser refresh and new tabs
test('refreshing /dashboard keeps session active', async ({ page }) => {
  await page.goto('/dashboard')
  await page.reload()
  await expect(page).toHaveURL('/dashboard')
  // Should NOT redirect to /login after refresh
})

test('opening new context on /dashboard keeps session (cookie persists)', async ({ browser }) => {
  // Load the saved auth cookies into a fresh context to simulate a returning user
  const context = await browser.newContext({
    storageState: path.join(__dirname, '../.auth/user.json'),
  })
  const page = await context.newPage()
  await page.goto('/dashboard')
  await expect(page).not.toHaveURL('/login')
  await context.close()
})
