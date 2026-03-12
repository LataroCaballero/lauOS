---
phase: 03-finance-data
plan: 03
subsystem: finance-transactions-ui
tags: [transactions, server-actions, pocketbase, dolarapi, exchange-rate, transfer, shadcn, base-ui]

requires:
  - phase: 03-01
    provides: finance spec stubs, categories schema, PB migrations
  - phase: 03-02
    provides: accounts Server Actions, AccountCard, AccountForm, /finance/accounts page

provides:
  - transactions-crud-server-actions
  - fetch-dolar-rates-server-action
  - exchange-rate-picker-component
  - transaction-form-component
  - transaction-list-component
  - per-account-page

affects: [03-04]

tech-stack:
  added: []
  patterns: [server-action-rate-fetch, two-leg-transfer-with-rollback, client-island-dialog-management, useTransition-pending-state]

key-files:
  created:
    - lauos/src/lib/actions/transactions.ts
    - lauos/src/components/finance/exchange-rate-picker.tsx
    - lauos/src/components/finance/transaction-form.tsx
    - lauos/src/components/finance/transaction-list.tsx
    - lauos/src/app/(protected)/finance/accounts/[id]/page.tsx
    - lauos/src/app/(protected)/finance/accounts/[id]/account-detail-client.tsx
  modified: []

key-decisions:
  - "dolarapi.com fetch is ONLY in fetchDolarRatesAction (Server Action) — never from browser; ExchangeRatePicker calls it on mount via useEffect (valid for non-mutating actions in Next.js 15)"
  - "Transfer rollback pattern: outRecordId tracked as separate string variable (not the record object) to avoid TypeScript TS18047 null narrowing issue in catch block"
  - "ExchangeRatePicker never blocks form submission — fetch error shows warning text only; manual input always available"
  - "AccountDetailClient opens Dialog programmatically (no DialogTrigger wrapper) — Button onClick sets dialogState then Dialog open=isOpen reads it"
  - "Category type in transaction-list.tsx includes id: string to satisfy structural compatibility with account-detail-client.tsx Transaction.expand.category"

patterns-established:
  - "Server Action rate fetch: fetch() with next: { revalidate: 300 } in Server Action; component calls via useEffect on mount"
  - "Two-leg transfer: create out → create in (with out.id) → update out (with in.id) → rollback out on any failure"
  - "Per-account page as pure RSC: all PB fetches at render time, balance computed inline; client island receives fully-shaped props"

requirements-completed: [TRAN-01, TRAN-02, TRAN-03, TRAN-04, TRAN-05]

duration: 5min
completed: "2026-03-11"
---

# Phase 3 Plan 03: Transactions UI Summary

**Transactions CRUD Server Actions with atomic two-leg transfers, dolarapi.com server-side rate fetch, ExchangeRatePicker with Blue/Oficial/Tarjeta presets, TransactionForm with income/expense/transfer modes, and per-account page at /finance/accounts/[id].**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-11T01:41:03Z
- **Completed:** 2026-03-11T01:46:08Z
- **Tasks:** 2
- **Files created:** 6

## Accomplishments

- Five Server Actions in `transactions.ts`: fetchDolarRatesAction (server-side dolarapi.com with 5-min cache), createTransactionAction, createTransferAction (atomic two-leg with rollback), updateTransactionAction (blocks transfer edits), deleteTransactionAction (deletes both transfer legs)
- ExchangeRatePicker client component: fetches rates via Server Action on mount, shows Blue/Oficial/Tarjeta preset buttons + always-editable manual input, gracefully degrades on fetch failure without blocking form submission
- TransactionForm handles all three modes — income, expense, transfer — with conditional fields (category hidden for transfers, destination account shown for transfers, ExchangeRatePicker shown for USD accounts)
- Per-account page at `/finance/accounts/[id]` as pure Server Component: fetches account, transactions (expanded category), categories, and accounts; computes balance inline; passes everything to AccountDetailClient island

## Task Commits

1. **Task 1: Server Actions — transactions CRUD and dolarapi.com rate fetch** - `3a8d04d` (feat)
2. **Task 2: ExchangeRatePicker, TransactionForm, TransactionList, and per-account page** - `093e0da` (feat)

## Files Created/Modified

- `lauos/src/lib/actions/transactions.ts` — Five exported Server Actions for transactions CRUD + dolarapi.com rate fetch
- `lauos/src/components/finance/exchange-rate-picker.tsx` — Client component; fetches rates via Server Action, preset buttons + manual input
- `lauos/src/components/finance/transaction-form.tsx` — Client form with income/expense/transfer modes; integrates ExchangeRatePicker for USD accounts
- `lauos/src/components/finance/transaction-list.tsx` — Client list component; date-sorted rows, sign color coding, edit/delete actions
- `lauos/src/app/(protected)/finance/accounts/[id]/page.tsx` — Server Component; per-account page with balance header and transaction list
- `lauos/src/app/(protected)/finance/accounts/[id]/account-detail-client.tsx` — Client island; manages dialog state for create/edit transactions

## Decisions Made

1. `outRecordId` (string) used instead of `outRecord` (object | null) to track transfer rollback state — avoids TS18047 "possibly null" errors when accessing the id inside the catch block after the try block's assignment
2. `ExchangeRatePicker` calls `fetchDolarRatesAction()` directly from a `useEffect` — valid for non-mutating Server Actions in Next.js 15; pre-populates with blue rate when no value set yet
3. `AccountDetailClient` opens the Dialog programmatically via `open={isOpen}` controlled state rather than wrapping the Button in `DialogTrigger` — cleaner separation of trigger and dialog state
4. `Category` type in `transaction-list.tsx` includes `id: string` to maintain structural compatibility when `account-detail-client.tsx` passes its own `Category` type through `TransactionList.onEditTransaction`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript TS18047 null narrowing in createTransferAction rollback**
- **Found during:** Task 1 verification (TypeScript check)
- **Issue:** `let outRecord: { id: string } | null = null` — TypeScript flagged accesses to `outRecord.id` inside try block as "possibly null" since the variable starts as null
- **Fix:** Changed to track `let outRecordId: string | null = null` (primitive) and assign after the `create()` call; catch block checks `if (outRecordId)` for rollback
- **Files modified:** `lauos/src/lib/actions/transactions.ts`
- **Verification:** TypeScript check exits clean with no errors on transactions.ts
- **Committed in:** `3a8d04d` (Task 1 commit)

**2. [Rule 1 - Bug] Fixed Select onValueChange signature incompatibility**
- **Found during:** Task 2 verification (TypeScript check)
- **Issue:** base-ui Select's `onValueChange` passes `(value: string | null, eventDetails)` but `setState` dispatch expects `SetStateAction<string>` — null not assignable
- **Fix:** Wrapped with arrow function `(v) => setState(v ?? '')` on both Select instances in TransactionForm
- **Files modified:** `lauos/src/components/finance/transaction-form.tsx`
- **Verification:** TypeScript check exits clean
- **Committed in:** `093e0da` (Task 2 commit)

**3. [Rule 1 - Bug] Fixed Category type structural mismatch between TransactionList and AccountDetailClient**
- **Found during:** Task 2 verification (TypeScript check)
- **Issue:** TS2719 "Two different types with this name exist but are unrelated" — TransactionList's local `Category` type was missing `id`, causing incompatibility when `account-detail-client.tsx` passed its own `Category` (with `id: string`) through `onEditTransaction`
- **Fix:** Added `id: string` to the `Category` type in `transaction-list.tsx`
- **Files modified:** `lauos/src/components/finance/transaction-list.tsx`
- **Verification:** TypeScript check exits clean
- **Committed in:** `093e0da` (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (all Rule 1 — TypeScript type correctness bugs)
**Impact on plan:** All three fixes were TypeScript compilation errors discovered during verification. No scope creep or architectural changes.

## Issues Encountered

None beyond the TypeScript errors documented above, all resolved before committing.

## User Setup Required

None — no external service configuration required beyond dolarapi.com which is a public API (no key needed).

## Next Phase Readiness

- Transactions CRUD fully implemented: income, expense, and transfer types
- Exchange rate fetch isolated to Server Action as required
- Per-account page at `/finance/accounts/[id]` ready for navigation from AccountCard
- Phase 03-04 (categories UI or finance summary) can proceed with full transaction data available

## Self-Check: PASSED

Files created:
- lauos/src/lib/actions/transactions.ts: FOUND
- lauos/src/components/finance/exchange-rate-picker.tsx: FOUND
- lauos/src/components/finance/transaction-form.tsx: FOUND
- lauos/src/components/finance/transaction-list.tsx: FOUND
- lauos/src/app/(protected)/finance/accounts/[id]/page.tsx: FOUND
- lauos/src/app/(protected)/finance/accounts/[id]/account-detail-client.tsx: FOUND
- .planning/phases/03-finance-data/03-03-SUMMARY.md: FOUND

Commits: 3a8d04d, 093e0da — both present in git log.

---
*Phase: 03-finance-data*
*Completed: 2026-03-11*
