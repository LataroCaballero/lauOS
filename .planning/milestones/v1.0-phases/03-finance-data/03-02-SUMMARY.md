---
phase: 03-finance-data
plan: 02
subsystem: finance-accounts-ui
tags: [accounts, server-actions, pocketbase, shadcn, base-ui, dialog, select]
dependency_graph:
  requires: [03-01]
  provides: [accounts-crud-actions, account-card, account-form, accounts-page, finance-redirect]
  affects: [03-03, 03-04]
tech_stack:
  added: [shadcn-dialog, shadcn-select, base-ui-dialog, base-ui-select]
  patterns: [server-actions, discriminated-union-return, client-island, useTransition-pending-state]
key_files:
  created:
    - lauos/src/lib/actions/accounts.ts
    - lauos/src/components/finance/account-card.tsx
    - lauos/src/components/finance/account-form.tsx
    - lauos/src/components/ui/dialog.tsx
    - lauos/src/components/ui/select.tsx
    - lauos/src/app/(protected)/finance/accounts/page.tsx
    - lauos/src/app/(protected)/finance/accounts/accounts-client.tsx
  modified:
    - lauos/src/app/(protected)/finance/page.tsx
decisions:
  - "AccountsWithBalancesResult uses discriminated union type — 'error' field presence distinguishes error from success; page uses 'error' in result guard"
  - "AccountsClient extracted as sibling client-island file (accounts-client.tsx) rather than inline in server page — keeps page.tsx clean and RSC-only"
  - "Dialog state managed as tagged union (closed | create | edit) — single useState handles all three modes safely"
  - "shadcn add dialog/select installs base-nova base-ui variants (not Radix) — matches existing button/card pattern"
metrics:
  duration_seconds: 211
  completed_date: "2026-03-10"
  tasks_completed: 2
  files_created: 7
  files_modified: 1
---

# Phase 3 Plan 02: Accounts UI Summary

**One-liner:** Accounts CRUD Server Actions with balance computation from transactions, AccountCard and AccountForm components with base-ui Dialog/Select, and /finance/accounts page with patrimony summary.

## What Was Built

### Task 1: Server Actions — accounts CRUD and balance computation

Created `lauos/src/lib/actions/accounts.ts` with four exported Server Actions:

- **createAccountAction**: Creates account with user, name, currency, archived=false. Returns `{ id }` or `{ error }`.
- **updateAccountAction**: Updates name only — currency is immutable after creation. Returns `{ error? }`.
- **archiveAccountAction**: Sets `archived: true` without deleting or touching transactions. Returns `{ error? }`.
- **getAccountsWithBalancesAction**: Fetches all non-archived accounts + all user transactions in one query, builds balance map (income/transfer_in add, expense/transfer_out subtract), returns `AccountWithBalance[]` and `PatrimonySummary` (`totalArsCentavos`, `totalUsdCentavos`).

All actions follow the established pattern: `'use server'`, `createServerClient()`, `isValid` guard, `revalidatePath('/finance')` after mutations.

Also added `shadcn dialog.tsx` and `shadcn select.tsx` (base-nova/base-ui variants) via `npx shadcn add`.

### Task 2: AccountCard, AccountForm, accounts page route

- **AccountCard** (`account-card.tsx`): Shows account name, currency badge, balance via `fromCentavos`. Edit button calls `onEdit`. Archive button shows `window.confirm` then calls `archiveAccountAction` with `useTransition` for pending state.
- **AccountForm** (`account-form.tsx`): Create and edit modes. Name field (maxLength 100). Currency Select disabled on edit mode. `useTransition` on submit. Inline error display on action failure.
- **AccountsClient** (`accounts-client.tsx`): `'use client'` island managing dialog open state as tagged union `{ mode: 'closed' | 'create' | 'edit', account? }`. Opens Dialog for create or edit, passes appropriate AccountForm.
- **accounts/page.tsx** (Server Component): Calls `getAccountsWithBalancesAction`, shows patrimony summary (ARS and USD totals side-by-side on sm+), renders AccountsClient with account data.
- **finance/page.tsx**: Replaced placeholder with `redirect('/finance/accounts')`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Discriminated union TypeScript narrowing in accounts page**
- **Found during:** Task 2 TypeScript check
- **Issue:** The `AccountsWithBalancesResult` discriminated union wasn't being narrowed by TypeScript after the `result.error` check — `accounts` and `patrimony` remained `undefined` in the type system
- **Fix:** Changed the page guard to `'error' in result && result.error` and used `result.accounts ?? []` / `result.patrimony ?? { ... }` for safe access
- **Files modified:** `lauos/src/app/(protected)/finance/accounts/page.tsx`
- **Commit:** daaa8b4

## Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | accounts Server Actions + shadcn dialog/select | 2a8ba03 | lauos/src/lib/actions/accounts.ts, dialog.tsx, select.tsx |
| 2 | AccountCard, AccountForm, accounts page route | daaa8b4 | 5 files created/modified |

## Key Decisions

1. `AccountsWithBalancesResult` uses discriminated union — `error` field presence distinguishes error from success; page uses `'error' in result` guard for TypeScript narrowing
2. `AccountsClient` extracted as sibling client-island file (`accounts-client.tsx`) rather than inline in server page — keeps `page.tsx` clean and RSC-only
3. Dialog state managed as tagged union (`closed | create | edit`) — single `useState` handles all three modes safely
4. `shadcn add dialog/select` installs base-nova/base-ui variants (not Radix) — consistent with existing button/card/input components

## Self-Check: PASSED

Files created/modified:
- lauos/src/lib/actions/accounts.ts: FOUND
- lauos/src/components/finance/account-card.tsx: FOUND
- lauos/src/components/finance/account-form.tsx: FOUND
- lauos/src/components/ui/dialog.tsx: FOUND
- lauos/src/components/ui/select.tsx: FOUND
- lauos/src/app/(protected)/finance/accounts/page.tsx: FOUND
- lauos/src/app/(protected)/finance/accounts/accounts-client.tsx: FOUND
- lauos/src/app/(protected)/finance/page.tsx: FOUND (modified)

Commits: 2a8ba03, daaa8b4 — both present in git log.
