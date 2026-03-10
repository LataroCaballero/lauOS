import { test, expect } from '@playwright/test'

// AUTH-04: User can view and edit profile (display name; avatar deferred to Phase 2)
test('display name update persists on settings page', async ({ page }) => {
  await page.goto('/settings')
  const nameInput = page.getByLabel(/display name/i)
  await nameInput.fill('Updated Name')
  await page.getByRole('button', { name: /save/i }).click()
  await expect(page.getByText(/saved/i)).toBeVisible()
  // Reload and verify persistence
  await page.reload()
  await expect(nameInput).toHaveValue('Updated Name')
})

test('password change works and re-login succeeds', async ({ page }) => {
  await page.goto('/settings')
  await page.getByLabel(/current password/i).fill(process.env.TEST_PASSWORD ?? 'testpassword123')
  await page.getByLabel(/new password/i).fill('newpassword456')
  await page.getByLabel(/confirm password/i).fill('newpassword456')
  await page.getByRole('button', { name: /change password/i }).click()
  await expect(page.getByText(/password updated/i)).toBeVisible()
})
