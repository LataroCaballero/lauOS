import { test as setup } from '@playwright/test'
import path from 'path'
import fs from 'fs'

export const authFile = path.join(__dirname, '../.auth/user.json')

setup('authenticate', async ({ page }) => {
  const email = process.env.TEST_EMAIL
  const password = process.env.TEST_PASSWORD

  if (!email || !password) {
    throw new Error(
      'TEST_EMAIL and TEST_PASSWORD must be set in .env.local to run tests.\n' +
      'Add them to lauos/.env.local:\n' +
      '  TEST_EMAIL=your@email.com\n' +
      '  TEST_PASSWORD=yourpassword'
    )
  }

  fs.mkdirSync(path.dirname(authFile), { recursive: true })

  await page.goto('/login')
  await page.locator('#email').fill(email)
  await page.locator('#password').fill(password)
  await page.locator('button[type="submit"]').click()
  await page.waitForURL('/dashboard')

  await page.context().storageState({ path: authFile })
})
