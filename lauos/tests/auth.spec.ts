import { test, expect } from '@playwright/test'

// AUTH-01: User can log in with email and password
test('login with valid credentials redirects to /dashboard', async ({ page }) => {
  await page.goto('/login')
  await page.locator('#email').fill(process.env.TEST_EMAIL ?? '')
  await page.locator('#password').fill(process.env.TEST_PASSWORD ?? '')
  await page.locator('button[type="submit"]').click()
  await expect(page).toHaveURL('/dashboard')
})

test('login with invalid credentials shows inline error and toast', async ({ page }) => {
  await page.goto('/login')
  await page.locator('#email').fill('wrong@example.com')
  await page.locator('#password').fill('wrongpassword')
  await page.locator('button[type="submit"]').click()
  // Inline error below form
  await expect(page.getByRole('alert')).toBeVisible()
  // Toast notification (sonner)
  await expect(page.locator('[data-sonner-toast]')).toBeVisible()
})

// AUTH-03: User can log out from any page
test('logout from dashboard redirects to /login', async ({ page }) => {
  await page.goto('/dashboard')
  // Open the user menu dropdown
  await page.locator('[data-testid="user-menu-trigger"]').click()
  // Click the logout item inside the dropdown
  await page.locator('[data-testid="logout-button"]').click()
  await expect(page).toHaveURL('/login')
})
