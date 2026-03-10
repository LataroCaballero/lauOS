import { test, expect } from '@playwright/test'

// AUTH-01: User can log in with email and password
test('login with valid credentials redirects to /dashboard', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill(process.env.TEST_EMAIL ?? 'test@example.com')
  await page.getByLabel('Password').fill(process.env.TEST_PASSWORD ?? 'testpassword123')
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page).toHaveURL('/dashboard')
})

test('login with invalid credentials shows inline error and toast', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill('wrong@example.com')
  await page.getByLabel('Password').fill('wrongpassword')
  await page.getByRole('button', { name: /sign in/i }).click()
  // Inline error below form
  await expect(page.getByText(/invalid email or password/i)).toBeVisible()
  // Toast notification (sonner)
  await expect(page.locator('[data-sonner-toast]')).toBeVisible()
})

// AUTH-03: User can log out from any page
test('logout from dashboard redirects to /login', async ({ page }) => {
  // Pre-condition: user must be logged in
  // This test depends on auth state from a login fixture (add in plan 01-03)
  await page.goto('/dashboard')
  await page.getByRole('button', { name: /logout/i }).click()
  await expect(page).toHaveURL('/login')
})
