---
phase: 03-finance-data
plan: 01
subsystem: finance-schema
tags: [pocketbase, migrations, schema, playwright, money-helpers]
dependency_graph:
  requires: []
  provides: [finance-schema, accounts-collection, categories-collection, transactions-collection, category-seeder, money-helpers, finance-test-stubs]
  affects: [03-02, 03-03, 03-04]
tech_stack:
  added: [pocketbase-migrations, pocketbase-pb_hooks]
  patterns: [integer-centavos-storage, rate-stored-10000x, user-scoped-access-rules, onRecordAfterCreateSuccess-hook]
key_files:
  created:
    - lauos/tests/finance.spec.ts
    - lauos/src/lib/money.ts
    - pocketbase/pb_migrations/1773191962_create_accounts.js
    - pocketbase/pb_migrations/1773191963_create_categories.js
    - pocketbase/pb_migrations/1773191964_create_transactions.js
    - pocketbase/pb_hooks/seed_categories.pb.js
  modified: []
decisions:
  - "test.todo not available in Playwright 1.58 — used test.skip with empty async body as stub pattern instead"
  - "pocketbase/ directory created at repo root (not inside lauos/) to separate backend config from Next.js app"
metrics:
  duration_seconds: 162
  completed_date: "2026-03-11"
  tasks_completed: 3
  files_created: 6
---

# Phase 3 Plan 01: Finance Schema and Test Stubs Summary

**One-liner:** PocketBase Finance schema (accounts, categories, transactions collections) with integer centavos enforcement, user-scoped access rules, category seeder hook, and money.ts conversion helpers.

## What Was Built

### Task 1: Playwright finance.spec.ts test stubs
- Created `lauos/tests/finance.spec.ts` with 19 `test.skip` stubs covering all 12 Finance requirement IDs
- Stubs use `test.skip(title, async ({ page }) => {})` pattern (test.todo not available in Playwright 1.58)
- All 19 tests reported as skipped with 0 failures on `npx playwright test tests/finance.spec.ts`

### Task 2: money.ts helpers and PocketBase migrations
- `lauos/src/lib/money.ts`: Four exported helpers — `toCentavos`, `fromCentavos`, `toRateStored`, `fromRateStored`
- `1773191962_create_accounts.js`: accounts collection — user relation, name (text, max 100), currency select (ARS/USD), archived bool
- `1773191963_create_categories.js`: categories collection — user relation, name (text, max 60), icon (text, max 10), color (text, max 7)
- `1773191964_create_transactions.js`: transactions collection — user, account relation, type select (income/expense/transfer_in/transfer_out), amount_centavos (number, onlyInt, min 1), date, category relation (optional), note, exchange_rate_stored (number, onlyInt, optional), transfer_pair_id (text, max 30, optional)
- All three collections share identical user-scoped access rules

### Task 3: pb_hooks category seeder
- `pocketbase/pb_hooks/seed_categories.pb.js`: `onRecordAfterCreateSuccess` hook scoped to "users" collection
- Creates 10 default categories (Vivienda, Alimentación, Transporte, Salud, Sueldo, Entretenimiento, Educación, Ropa, Servicios, Otros) on user creation
- Wrapped in try/catch to guard against missing categories collection during migration edge cases
- Calls `e.next()` to preserve PocketBase event chain

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] test.todo not available in Playwright 1.58**
- **Found during:** Task 1
- **Issue:** `test.todo` is not a function in `@playwright/test@1.58.2`; the plan specified `test.todo()` stubs
- **Fix:** Used `test.skip(title, async ({ page }) => {})` as the stub pattern — semantically equivalent (tests are registered but skipped), all tagged with requirement IDs in the test name
- **Files modified:** `lauos/tests/finance.spec.ts`
- **Commit:** fa66433

## Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | finance.spec.ts test stubs | fa66433 | lauos/tests/finance.spec.ts |
| 2 | money.ts and PocketBase migrations | ae37624 | lauos/src/lib/money.ts, pocketbase/pb_migrations/*(3 files) |
| 3 | pb_hooks category seeder | ee94d46 | pocketbase/pb_hooks/seed_categories.pb.js |

## Key Decisions

1. `test.todo` not available in Playwright 1.58 — used `test.skip` with empty async body as stub pattern
2. `pocketbase/` directory created at repo root (not inside `lauos/`) to separate backend config from Next.js app

## PocketBase Deployment Note

Migrations in `pocketbase/pb_migrations/` and hooks in `pocketbase/pb_hooks/` must be copied to the VPS PocketBase instance directories and the service restarted. Migrations are auto-applied on PocketBase startup. The category seeder hook is active immediately after restart.

To apply locally:
1. Copy migration files to your local PocketBase `pb_migrations/` directory
2. Copy hook file to your local PocketBase `pb_hooks/` directory
3. Restart local PocketBase — the three collections will be created automatically

## Self-Check: PASSED

All 6 files exist on disk. All 3 task commits verified in git log (fa66433, ae37624, ee94d46).
