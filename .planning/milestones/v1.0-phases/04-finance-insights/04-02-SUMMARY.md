---
phase: 04-finance-insights
plan: 02
subsystem: ui
tags: [recharts, shadcn-chart, nextjs, pocketbase, url-search-params, pagination, finance]

# Dependency graph
requires:
  - phase: 04-finance-insights/04-01
    provides: finance sub-nav, InsightsClient skeleton, getMonthlySummaryAction, getCategoryDistributionAction, accounts/categories server actions
  - phase: 03-finance-data
    provides: transactions PocketBase collection, transfer pattern, centavos storage

provides:
  - getBalanceTimelineAction: fetches pre-range balance + day-by-day DailyBalance[] for a given account and date range
  - getFilteredTransactionsAction: paginated 25/page transaction fetch with account/category/date filters and PocketBase ID validation
  - BalanceTimelineChart: recharts LineChart wrapped in shadcn ChartContainer
  - InsightsClient updated with balance timeline section (account selector + 1M/3M/6M range toggle)
  - /finance/transactions RSC page + TransactionsClient island with collapsible filter panel, URL state, and pagination

affects: [any future finance phase that adds transaction views or account-level analytics]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Running balance with pre-range fetch: always fetch all transactions before range start date to compute initialBalance before walking day-by-day
    - PocketBase ID injection guard: /^[a-z0-9]{15}$/i.test(id) before interpolating into filter string
    - URL filter state pattern: setParam helper resets page on filter change, setPage keeps all other filters; useEffect on searchParams.toString() re-fetches
    - React useEffect for derived async state: timeline re-fetches on [selectedAccountId, timelineRange] dependency array

key-files:
  created:
    - lauos/src/components/finance/balance-timeline-chart.tsx
    - lauos/src/app/(protected)/finance/transactions/page.tsx
    - lauos/src/app/(protected)/finance/transactions/transactions-client.tsx
  modified:
    - lauos/src/lib/actions/insights.ts
    - lauos/src/app/(protected)/finance/insights/insights-client.tsx
    - lauos/src/app/(protected)/finance/insights/page.tsx

key-decisions:
  - "Running balance algorithm uses pre-range transaction fetch for initialBalance — avoids day-1 spike artifact"
  - "PocketBase ID validation with /^[a-z0-9]{15}$/i before filter string interpolation — injection guard"
  - "Date input uses plain HTML <input type=date> — no date picker library to keep dependencies minimal"
  - "setParam resets page param on filter change; pagination uses separate setPage helper that preserves filter params"

patterns-established:
  - "Pattern: RSC page fetches initial timeline for default account (first ARS account) and passes as props — avoids waterfall on client mount"
  - "Pattern: URL filter state with useSearchParams + useRouter.push; re-fetch via useEffect watching searchParams.toString()"

requirements-completed: [VIZL-03, VIZL-04]

# Metrics
duration: 11min
completed: 2026-03-11
---

# Phase 4 Plan 02: Finance Insights — Balance Timeline + Transactions Summary

**Running-balance line chart (shadcn LineChart) per account and paginated transaction list with URL-persisted combinable filters (account, category, date range, page)**

## Performance

- **Duration:** 11 min
- **Started:** 2026-03-11T13:37:15Z
- **Completed:** 2026-03-11T13:48:20Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments

- `getBalanceTimelineAction` fetches pre-range transactions for initial balance offset then builds DailyBalance[] walking day-by-day — avoids the classic day-1 spike artifact
- `getFilteredTransactionsAction` paginates at 25/page with simultaneous account, category, and date range filters; PocketBase record IDs validated with regex before filter string interpolation
- `BalanceTimelineChart` (recharts LineChart via shadcn `ChartContainer`) added below category chart in InsightsClient with account selector and 1M/3M/6M range buttons; RSC page pre-fetches 3-month timeline for default account
- `/finance/transactions` page: collapsible filter panel (hidden behind Filtros button), transaction rows with type-based green/red coloring, prev/next pagination — all filter state in URL search params, survives refresh and back-button

## Task Commits

Each task was committed atomically:

1. **Task 1: Add getBalanceTimelineAction + getFilteredTransactionsAction** - `b45ad97` (feat)
2. **Task 2: BalanceTimelineChart + timeline section in InsightsClient** - `3d9d757` (feat)
3. **Task 3: /finance/transactions page with URL filters and pagination** - `daf2d5a` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified

- `lauos/src/lib/actions/insights.ts` — Added DailyBalance, TransactionRow types; getBalanceTimelineAction; getFilteredTransactionsAction; computeDailyBalances helper
- `lauos/src/components/finance/balance-timeline-chart.tsx` — recharts LineChart wrapped in shadcn ChartContainer; empty state when no data
- `lauos/src/app/(protected)/finance/insights/insights-client.tsx` — Added timeline section: account Select, range buttons (1M/3M/6M), BalanceTimelineChart; useEffect on [selectedAccountId, timelineRange]
- `lauos/src/app/(protected)/finance/insights/page.tsx` — Fetches initial 3-month timeline for first ARS account; passes initialTimelinePoints + initialTimelineCurrency props
- `lauos/src/app/(protected)/finance/transactions/page.tsx` — RSC: awaits searchParams Promise, parallel-fetches transactions + accounts + categories, renders TransactionsClient in Suspense
- `lauos/src/app/(protected)/finance/transactions/transactions-client.tsx` — URL filter state, collapsible panel, transaction rows, prev/next pagination

## Decisions Made

- Pre-range balance fetch: fetch all transactions with `date < startDate` to compute initialBalance — ensures day 1 of chart shows real balance, not zero
- PocketBase ID injection guard: `/^[a-z0-9]{15}$/i.test(id)` before interpolating accountId/categoryId into filter string; invalid IDs silently skipped
- Plain HTML `<input type="date">` for date filters — no extra library, consistent styling with Tailwind
- `setParam` helper resets `page` param on any filter change; separate `setPage` helper keeps all filter params intact when paginating

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript cast for RecordModel[] to custom type**
- **Found during:** Task 1 (getBalanceTimelineAction)
- **Issue:** `rangeTxs as Array<{ date: string; type: string; amount_centavos: number }>` failed TS because RecordModel doesn't overlap sufficiently
- **Fix:** Added `as unknown as Array<...>` double cast
- **Files modified:** lauos/src/lib/actions/insights.ts
- **Verification:** `npx tsc --noEmit` exits clean
- **Committed in:** b45ad97 (Task 1 commit)

**2. [Rule 1 - Bug] Fixed Select onValueChange null type mismatch**
- **Found during:** Task 2 (InsightsClient account selector)
- **Issue:** `onValueChange={setSelectedAccountId}` failed TS because Select passes `string | null` but setState expects `string`
- **Fix:** Changed to `onValueChange={(v) => { if (v) setSelectedAccountId(v) }}`
- **Files modified:** lauos/src/app/(protected)/finance/insights/insights-client.tsx
- **Verification:** `npx tsc --noEmit` exits clean
- **Committed in:** 3d9d757 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 1 TypeScript bugs)
**Impact on plan:** Minor TS strictness fixes, no behavior change. No scope creep.

## Issues Encountered

None — all tasks completed within first attempt, TypeScript passed clean on each task after the auto-fixes above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Phase 4 complete. VIZL-01 through VIZL-04 all delivered:
- VIZL-01: Monthly summary cards per currency (Plan 04-01)
- VIZL-02: Category donut chart with income/expense tab (Plan 04-01)
- VIZL-03: Balance timeline line chart per account with range controls (this plan)
- VIZL-04: /finance/transactions with collapsible filters, URL state, 25/page pagination (this plan)

No blockers for v1.0 milestone completion.

## Self-Check: PASSED

- FOUND: lauos/src/lib/actions/insights.ts
- FOUND: lauos/src/components/finance/balance-timeline-chart.tsx
- FOUND: lauos/src/app/(protected)/finance/transactions/page.tsx
- FOUND: lauos/src/app/(protected)/finance/transactions/transactions-client.tsx
- FOUND: .planning/phases/04-finance-insights/04-02-SUMMARY.md
- FOUND: commit b45ad97 (Task 1)
- FOUND: commit 3d9d757 (Task 2)
- FOUND: commit daf2d5a (Task 3)

---
*Phase: 04-finance-insights*
*Completed: 2026-03-11*
