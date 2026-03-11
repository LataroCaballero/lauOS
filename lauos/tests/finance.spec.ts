import { test, expect } from '@playwright/test'

/**
 * Finance module E2E tests — Phase 3
 *
 * NOTE (CATG-03): Default category seeding tests require the test user to have been
 * created AFTER pocketbase/pb_hooks/seed_categories.pb.js was deployed and PocketBase
 * was restarted. If running against a pre-existing test user, seed manually or recreate.
 *
 * All tests are stubs (test.skip) — implementations land in Plans 03-02, 03-03, 03-04.
 */

// ACCT-01: User can create accounts with name and currency (ARS or USD)
test.skip('[ACCT-01] create ARS account appears in account list', async ({ page }) => {})
test.skip('[ACCT-01] create USD account appears in account list', async ({ page }) => {})

// ACCT-02: Account displays correct balance computed from transactions
test.skip('[ACCT-02] account balance reflects income transactions', async ({ page }) => {})
test.skip('[ACCT-02] account balance reflects expense transactions', async ({ page }) => {})

// ACCT-03: User can edit or archive accounts
test.skip('[ACCT-03] edit account name updates display', async ({ page }) => {})
test.skip('[ACCT-03] archive account removes it from list', async ({ page }) => {})

// ACCT-04: Patrimony summary shows ARS total and USD total separately
test.skip('[ACCT-04] patrimony summary shows ARS and USD totals separately', async ({ page }) => {})

// TRAN-01: User can record income/expense with amount, date, category, note
test.skip('[TRAN-01] create income transaction visible in account transaction list', async ({ page }) => {})
test.skip('[TRAN-01] create expense transaction visible in account transaction list', async ({ page }) => {})

// TRAN-02: User can record transfer between own accounts
test.skip('[TRAN-02] transfer updates both account balances correctly', async ({ page }) => {})

// TRAN-03: USD transaction stores exchange rate immutably
test.skip('[TRAN-03] USD transaction stores exchange rate at creation time', async ({ page }) => {})

// TRAN-04: Rate fetched from dolarapi.com or entered manually
test.skip('[TRAN-04] rate field pre-populates from dolarapi.com when USD selected', async ({ page }) => {})
test.skip('[TRAN-04] manual rate override accepted and stored', async ({ page }) => {})

// TRAN-05: User can edit and delete transactions
test.skip('[TRAN-05] edit transaction amount updates account balance', async ({ page }) => {})
test.skip('[TRAN-05] delete transaction updates account balance', async ({ page }) => {})

// CATG-01: User can create custom categories with icon and color
test.skip('[CATG-01] create category with emoji icon and hex color appears in list', async ({ page }) => {})

// CATG-02: User can edit and delete categories
test.skip('[CATG-02] edit category name and icon updates display', async ({ page }) => {})
test.skip('[CATG-02] delete category with no linked transactions removes it', async ({ page }) => {})

// CATG-03: System provides default categories on account creation (see NOTE above)
test.skip('[CATG-03] default categories exist after new user is created', async ({ page }) => {})
