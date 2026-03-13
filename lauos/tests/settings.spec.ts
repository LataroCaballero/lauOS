import { test, expect } from '@playwright/test'

// AUTH-04: User can view and edit profile (display name; avatar deferred to Phase 2)
test('display name update persists on settings page', async ({ page }) => {
  await page.goto('/settings')
  const nameInput = page.locator('#display-name')
  await nameInput.fill('Updated Name')
  await page.getByRole('button', { name: /guardar/i }).click()
  await expect(page.locator('[data-sonner-toast]')).toBeVisible()
  // Reload and verify persistence
  await page.reload()
  await expect(page.locator('#display-name')).toHaveValue('Updated Name')
})

// Skip: changes the real user password — run manually when needed
test.skip('password change works and re-login succeeds', async ({ page }) => {
  await page.goto('/settings')
  await page.locator('#current-password').fill(process.env.TEST_PASSWORD ?? '')
  await page.locator('#new-password').fill('newpassword456')
  await page.locator('#confirm-password').fill('newpassword456')
  await page.getByRole('button', { name: /cambiar contraseña/i }).click()
  await expect(page.locator('[data-sonner-toast]')).toBeVisible()
})
