---
phase: 03-finance-data
verified: 2026-03-10T12:00:00Z
status: gaps_found
score: 11/12 must-haves verified
gaps:
  - truth: "Lautaro can create a transfer between two accounts — both accounts' balances update correctly"
    status: failed
    reason: "transaction-form.tsx hardcodes userId: '' when calling createTransferAction. The server action uses data.userId as the user field for both transfer records. PocketBase rejects the create because user is a required relation field — transfers always fail at the DB level."
    artifacts:
      - path: "lauos/src/components/finance/transaction-form.tsx"
        issue: "Line 101 passes userId: '' to createTransferAction instead of passing the authenticated user's ID from the server action's own authStore"
      - path: "lauos/src/lib/actions/transactions.ts"
        issue: "createTransferAction signature accepts userId: string and uses data.userId directly — the caller is responsible for passing the correct ID, but the caller always sends an empty string"
    missing:
      - "Fix createTransferAction to ignore the userId parameter and use pb.authStore.record?.id internally (consistent with createTransactionAction which already does this correctly)"
      - "OR: remove userId from the createTransferAction signature and derive it from authStore inside the action, then update the call in transaction-form.tsx accordingly"
---

# Phase 3: Finance Data Verification Report

**Phase Goal:** Build the complete Finance data layer and UI — PocketBase schema (accounts, categories, transactions), Server Actions, and UI components so users can track income, expenses, and transfers across multiple accounts with automatic ARS/USD exchange-rate support.
**Verified:** 2026-03-10T12:00:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | PocketBase has accounts, categories, and transactions collections with correct field types and access rules | VERIFIED | Three migration files exist with user-scoped access rules; transactions has onlyInt:true on amount_centavos, correct relation fields, and transfer_pair_id |
| 2 | Monetary amounts are rejected if non-integer (onlyInt: true enforced at API level) | VERIFIED | 1773191964_create_transactions.js line 44: `onlyInt: true, min: 1` on amount_centavos field |
| 3 | A new user automatically gets 10 default categories created by the pb_hooks seed | VERIFIED | seed_categories.pb.js exists with onRecordAfterCreateSuccess hook scoped to "users", creates all 10 named categories, calls e.next() |
| 4 | Balance math is sign-correct: income/transfer_in add, expense/transfer_out subtract | VERIFIED | accounts.ts getAccountsWithBalancesAction lines 116-120; per-account page.tsx lines 56-61 — both use identical correct formula |
| 5 | Every Finance collection rejects reads/writes from unauthenticated callers | VERIFIED | All three migrations share identical rules with `@request.auth.id != ''`; all Server Actions check `!pb.authStore.isValid` |
| 6 | Lautaro can create a new account by filling a form with name and currency (ARS or USD) | VERIFIED | AccountForm creates via createAccountAction; currency Select has ARS/USD options; AccountsClient wires Dialog |
| 7 | Each account card displays its current balance computed from all its transactions | VERIFIED | AccountCard uses fromCentavos(account.balanceCentavos, account.currency); balance computed in getAccountsWithBalancesAction |
| 8 | The accounts page shows a patrimony summary: total ARS balance, total USD balance | VERIFIED | accounts/page.tsx renders Total ARS and Total USD from patrimony.totalArsCentavos/totalUsdCentavos |
| 9 | Lautaro can create an income or expense transaction with amount, date, category, and optional note | VERIFIED | TransactionForm creates via createTransactionAction; all fields present; ExchangeRatePicker shown for USD accounts |
| 10 | Lautaro can create a transfer between two accounts — both accounts' balances update correctly | FAILED | transaction-form.tsx passes `userId: ''` to createTransferAction; server action uses data.userId directly for the user field on both records — PocketBase will reject with validation error (required relation field) |
| 11 | Deleting a category that has linked transactions is blocked with a user-facing error message | VERIFIED | deleteCategoryAction uses getList(1,1) guard; returns Spanish error message; categories-client.tsx displays per-category inline error |
| 12 | The 10 default seeded categories are visible on /finance/categories after first login | VERIFIED | pb_hooks seeder confirmed; CategoriesPage calls getCategoriesAction which fetches all user categories |

**Score:** 11/12 truths verified

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `lauos/tests/finance.spec.ts` | Playwright stubs for all 12 Finance req IDs | VERIFIED | 17 test.skip stubs (test.todo unavailable in Playwright 1.58), all 12 req IDs present |
| `lauos/src/lib/money.ts` | toCentavos, fromCentavos, toRateStored, fromRateStored | VERIFIED | All 4 exports confirmed, correct Math.round() usage |
| `pocketbase/pb_migrations/1773191962_create_accounts.js` | accounts collection — user, name, currency, archived | VERIFIED | Correct field types and access rules |
| `pocketbase/pb_migrations/1773191963_create_categories.js` | categories collection — user, name, icon, color | VERIFIED | Correct field types and access rules |
| `pocketbase/pb_migrations/1773191964_create_transactions.js` | transactions collection with all fields | VERIFIED | onlyInt:true on amount_centavos, all relations, transfer_pair_id, exchange_rate_stored |
| `pocketbase/pb_hooks/seed_categories.pb.js` | onRecordAfterCreateSuccess hook, 10 categories | VERIFIED | Hook scoped to "users", try/catch present, e.next() called |
| `lauos/src/lib/actions/accounts.ts` | createAccountAction, updateAccountAction, archiveAccountAction, getAccountsWithBalancesAction | VERIFIED | All 4 exports, correct auth guard, revalidatePath, balance formula |
| `lauos/src/components/finance/account-card.tsx` | AccountCard with name, currency, balance, edit/archive | VERIFIED | fromCentavos used, useTransition on archive, window.confirm guard |
| `lauos/src/components/finance/account-form.tsx` | AccountForm for create/edit, currency disabled on edit | VERIFIED | Currency Select disabled when mode === 'edit', both actions called correctly |
| `lauos/src/app/(protected)/finance/accounts/page.tsx` | Accounts page — patrimony + account list + create button | VERIFIED | Server Component, calls getAccountsWithBalancesAction, renders AccountsClient |
| `lauos/src/lib/actions/transactions.ts` | 5 Server Actions including fetchDolarRatesAction | VERIFIED | All 5 exports confirmed; transfer rollback pattern correct; deleteTransactionAction deletes both legs |
| `lauos/src/components/finance/exchange-rate-picker.tsx` | Rates from dolarapi.com, preset buttons, manual input | VERIFIED | Calls fetchDolarRatesAction via useEffect, Blue/Oficial/Tarjeta buttons, always-editable manual input, graceful error |
| `lauos/src/components/finance/transaction-form.tsx` | Income/expense/transfer modes; ExchangeRatePicker for USD | STUB/GAP | All modes present and correctly wired EXCEPT transfer: userId: '' passed to createTransferAction — transfers always fail at PocketBase |
| `lauos/src/components/finance/transaction-list.tsx` | Transaction list with edit/delete, sign color coding | VERIFIED | Date-sorted, +/- color coding, edit disabled for transfers, deleteTransactionAction wired |
| `lauos/src/app/(protected)/finance/accounts/[id]/page.tsx` | Per-account page: balance, transaction list, new tx button | VERIFIED | Server Component fetches account/transactions/categories/allAccounts; balance computed inline; AccountDetailClient wired |
| `lauos/src/lib/actions/categories.ts` | getCategoriesAction, createCategoryAction, updateCategoryAction, deleteCategoryAction | VERIFIED | All 4 exports, delete guard with linked-transaction check, Spanish error message |
| `lauos/src/components/finance/category-badge.tsx` | CategoryBadge pill with inline hex colors | VERIFIED | Inline style with color+'22' and color+'44' alpha hex pattern; sm/md size variants |
| `lauos/src/components/finance/category-form.tsx` | CategoryForm with emoji input and color swatches | VERIFIED | 8 preset swatches, native color input, live CategoryBadge preview |
| `lauos/src/app/(protected)/finance/categories/page.tsx` | Categories page with list, create button, edit/delete | VERIFIED | Server Component calls getCategoriesAction; CategoriesClient handles dialog and delete |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| accounts/page.tsx | accounts.ts | getAccountsWithBalancesAction | WIRED | Imported and called at render time |
| account-form.tsx | accounts.ts | createAccountAction / updateAccountAction | WIRED | Both actions imported and called in handleSubmit |
| accounts.ts | accounts migration | pb.collection('accounts') | WIRED | Lines 37, 61, 81, 101 |
| exchange-rate-picker.tsx | transactions.ts | fetchDolarRatesAction | WIRED | Imported and called in useEffect on mount |
| transaction-form.tsx | transactions.ts | createTransactionAction / createTransferAction | PARTIAL | createTransactionAction: correctly wired. createTransferAction: wired but broken — userId:'' causes PocketBase rejection |
| transactions.ts | transactions migration | pb.collection('transactions') | WIRED | Lines 75, 103, 114, 162, 178, 198 |
| seed_categories.pb.js | categories migration | findCollectionByNameOrId('categories') | WIRED | Line 5 |
| transactions migration | accounts migration | collectionId: accountsCollection.id | WIRED | accountsCollection fetched via findCollectionByNameOrId("accounts") |
| transactions migration | categories migration | collectionId: categoriesCollection.id | WIRED | categoriesCollection fetched via findCollectionByNameOrId("categories") |
| categories/page.tsx | categories.ts | getCategoriesAction | WIRED | Imported and called at render time |
| categories.ts | categories migration | pb.collection('categories') | WIRED | Lines 17, 52, 84, 103 |
| categories.ts | transactions migration | pb.collection('transactions') | WIRED | deleteCategoryAction line 102 — linked-transaction guard |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| ACCT-01 | 03-01, 03-02 | Usuario puede crear cuentas con nombre y moneda (ARS o USD) | SATISFIED | AccountForm + createAccountAction create accounts with name and ARS/USD currency select |
| ACCT-02 | 03-02 | Usuario puede ver el saldo actual de cada cuenta (calculado desde transacciones) | SATISFIED | getAccountsWithBalancesAction computes balance from all transactions; AccountCard displays it |
| ACCT-03 | 03-02 | Usuario puede editar o archivar cuentas existentes | SATISFIED | updateAccountAction edits name; archiveAccountAction sets archived:true; both wired in UI |
| ACCT-04 | 03-02 | Usuario puede ver resumen de patrimonio total | SATISFIED | PatrimonySummary computed by getAccountsWithBalancesAction; displayed as Total ARS / Total USD on accounts page |
| TRAN-01 | 03-03 | Usuario puede registrar ingresos y egresos con monto, fecha, categoría y nota | SATISFIED | TransactionForm income/expense modes; createTransactionAction stores all fields |
| TRAN-02 | 03-03 | Usuario puede registrar transferencias entre sus propias cuentas | BLOCKED | createTransferAction implementation is correct but transaction-form.tsx passes userId:'' — transfer records fail PocketBase required-relation validation |
| TRAN-03 | 03-03 | USD transaction stores exchange rate immutably | SATISFIED | exchangeRateStored stored as integer via toRateStored(); schema has onlyInt:true; never recalculated |
| TRAN-04 | 03-03 | TC para transacciones USD puede obtenerse desde dolarhoy.com (blue, oficial o tarjeta) o manualmente | SATISFIED | fetchDolarRatesAction fetches dolarapi.com server-side; ExchangeRatePicker shows preset buttons; manual input always available |
| TRAN-05 | 03-03 | Usuario puede editar y eliminar transacciones existentes | SATISFIED | updateTransactionAction (income/expense only); deleteTransactionAction deletes both transfer legs |
| CATG-01 | 03-04 | Usuario puede crear categorías personalizadas con nombre e ícono/color | SATISFIED | CategoryForm + createCategoryAction with validation; emoji input + color swatches |
| CATG-02 | 03-04 | Usuario puede editar y eliminar categorías | SATISFIED | updateCategoryAction + deleteCategoryAction with linked-transaction guard; fully wired in CategoriesClient |
| CATG-03 | 03-04 | El sistema provee un set de categorías por defecto al crear la cuenta | SATISFIED | seed_categories.pb.js hook confirmed; 10 default categories created on user creation |

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `lauos/src/components/finance/transaction-form.tsx` | 100-101 | `userId: ''` hardcoded empty string passed to createTransferAction | BLOCKER | Transfers always fail: PocketBase rejects the create because user is a required relation field. TRAN-02 is blocked. |

Note: All `placeholder="..."` matches in the grep scan are legitimate HTML input placeholder attributes — not code stubs.

---

## Human Verification Required

### 1. Exchange rate fetch from dolarapi.com

**Test:** Open /finance/accounts/[id] for a USD account and click "Nueva transacción". Observe whether the ExchangeRatePicker pre-populates with the blue rate and shows Blue/Oficial/Tarjeta preset buttons.
**Expected:** Three preset buttons appear with current rates from dolarapi.com; manual input is editable; if API is unavailable, warning text shows but form can still submit.
**Why human:** External API availability and real-time behavior cannot be verified programmatically.

### 2. PocketBase access rule enforcement

**Test:** Make direct API calls to /api/collections/accounts/records without an auth token, and with another user's auth token.
**Expected:** Unauthenticated requests return 403. Cross-user record access returns empty results or 403 — not another user's data.
**Why human:** Cannot verify live PocketBase enforcement without a running instance.

### 3. Category seeder on new user creation

**Test:** Create a fresh user via PocketBase Admin UI (after pb_hooks are deployed and PocketBase restarted). Check the categories collection.
**Expected:** Exactly 10 category records appear owned by the new user's ID.
**Why human:** Requires a live PocketBase instance with the hook deployed.

### 4. Transfer balance update (blocked until gap is fixed)

**Test:** After the userId:'' gap is fixed, create a transfer from Account A ($100 ARS) to Account B. Check both account balances.
**Expected:** Account A balance decreases by $100; Account B balance increases by $100.
**Why human:** Requires live PocketBase and UI interaction; also currently blocked by the gap.

---

## Gaps Summary

**1 gap blocks TRAN-02 (transfers).**

The `createTransferAction` server action was correctly implemented — it validates `pb.authStore.isValid`, creates both transfer legs with a rollback pattern, and updates `transfer_pair_id` cross-references. However, the action signature accepts a `userId: string` parameter and uses it directly as the `user` field for both records. The caller (`TransactionForm`) passes `userId: ''` with a comment acknowledging the issue ("actions validates authStore internally") but never actually fixes it. The server action ignores `pb.authStore.record?.id` for transfers while using it correctly in `createTransactionAction`.

The fix is straightforward: either remove the `userId` parameter from `createTransferAction` and derive it from `pb.authStore.record?.id` internally (consistent with every other action in the codebase), or replace the empty string with the actual user ID from an accessible source.

All other 11 observable truths are fully verified. The schema, money helpers, Server Actions for accounts/categories/transactions, all UI components, and the categories seeder are all substantive and correctly wired.

---

_Verified: 2026-03-10T12:00:00Z_
_Verifier: Claude (gsd-verifier)_
