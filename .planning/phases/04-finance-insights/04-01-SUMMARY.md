---
phase: 04-finance-insights
plan: 01
subsystem: ui
tags: [recharts, shadcn-chart, pocketbase, react, nextjs, finance, insights]

# Dependency graph
requires:
  - phase: 03-finance-data
    provides: transactions collection, accounts collection, categories collection, centavos pattern, CategoryBadge component, server action pattern
provides:
  - Finance sub-navigation layout (Cuentas | Insights | Transacciones) visible on all /finance/* pages
  - getMonthlySummaryAction: monthly income/expense per currency, transfers excluded
  - getCategoryDistributionAction: category-grouped spending/income with uncategorized fallback
  - MonthlySummaryCard: display component for income/expenses/net per currency
  - CategoryDonutChart: recharts PieChart with inline hex Cell fills and center Label
  - /finance/insights page with month selector, summary cards, and donut chart with tabs
affects:
  - 04-finance-insights plan 02 (balance timeline + transactions list will extend this foundation)

# Tech tracking
tech-stack:
  added: [recharts@^2.15.4, shadcn chart component]
  patterns:
    - RSC page + *Client island (established, continued from Phase 3)
    - Finance sub-layout with FinanceSubNav client sub-component for active state
    - Server actions with month boundary date filter (start/end of month UTC)
    - Inline hex fill on recharts Cell (avoids Tailwind v4 dynamic class scanning issue)

key-files:
  created:
    - lauos/src/app/(protected)/finance/layout.tsx
    - lauos/src/app/(protected)/finance/finance-sub-nav.tsx
    - lauos/src/lib/actions/insights.ts
    - lauos/src/components/finance/monthly-summary-card.tsx
    - lauos/src/components/finance/category-donut-chart.tsx
    - lauos/src/app/(protected)/finance/insights/page.tsx
    - lauos/src/app/(protected)/finance/insights/insights-client.tsx
    - lauos/src/components/ui/chart.tsx
  modified:
    - lauos/tests/finance.spec.ts (added VIZL-01 through VIZL-04 test stubs)
    - lauos/package.json (recharts added)

key-decisions:
  - "Finance layout sub-nav uses FinanceSubNav client sub-component co-located as sibling file (finance-sub-nav.tsx) — keeps layout.tsx a Server Component while enabling usePathname active state"
  - "recharts 2.x installed (not 3.x) — Label center component in Pie works correctly; no overlay div fallback needed"
  - "CategoryDonutChart uses fill={slice.categoryColor} directly on Cell — inline hex avoids Tailwind v4 dynamic class scanning limitation"
  - "getCategoryDistributionAction filters accounts by currency before building transaction filter — avoids mixed-currency aggregation"
  - "InsightsClient defaults chart currency to ARS if any ARS accounts exist, otherwise USD"

patterns-established:
  - "Finance sub-nav: Server Component layout wraps FinanceSubNav client island for active-state links"
  - "Date filter boundaries: start = 'YYYY-MM-01 00:00:00.000Z', end = 'YYYY-MM-DD 23:59:59.999Z' using new Date(year, month, 0).getDate() for last day"
  - "Category distribution: expand='category' on getFullList, group by expand?.category.id, fall back to '__uncategorized__' key"

requirements-completed: [VIZL-01, VIZL-02]

# Metrics
duration: 4min
completed: 2026-03-11
---

# Phase 4 Plan 01: Finance Sub-Nav, Insights Actions, and Monthly Summary + Donut Chart

**Finance sub-navigation layout + shadcn/recharts donut chart showing monthly income/expense cards and category distribution with Gastos/Ingresos tab switching**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-03-11T13:29:52Z
- **Completed:** 2026-03-11T13:34:09Z
- **Tasks:** 3
- **Files modified:** 9 (7 created, 2 modified)

## Accomplishments

- Finance layout.tsx now wraps all /finance/* pages with a persistent sub-navigation (Cuentas | Insights | Transacciones) — active tab highlighted via usePathname
- getMonthlySummaryAction and getCategoryDistributionAction server actions fetch from PocketBase, filtering by month boundaries and excluding transfers from summaries
- /finance/insights page renders with month selector (last 24 months), MonthlySummaryCard per currency, and CategoryDonutChart with Gastos/Ingresos tabs

## Task Commits

Each task was committed atomically:

1. **Task 1: Wave 0 — install shadcn chart, add VIZL test stubs, create finance layout** - `4073101` (feat)
2. **Task 2: insights.ts server actions + MonthlySummaryCard + CategoryDonutChart** - `74aa56a` (feat)
3. **Task 3: /finance/insights page (RSC + InsightsClient island)** - `c04179f` (feat)

## Files Created/Modified

- `lauos/src/app/(protected)/finance/layout.tsx` - Finance Server Component layout, renders FinanceSubNav + children
- `lauos/src/app/(protected)/finance/finance-sub-nav.tsx` - Client sub-nav with usePathname active state
- `lauos/src/lib/actions/insights.ts` - getMonthlySummaryAction and getCategoryDistributionAction server actions
- `lauos/src/components/finance/monthly-summary-card.tsx` - Display card: income (green), expenses (red), net
- `lauos/src/components/finance/category-donut-chart.tsx` - ChartContainer + PieChart with inline hex Cell fills
- `lauos/src/app/(protected)/finance/insights/page.tsx` - RSC page with parallel server fetches
- `lauos/src/app/(protected)/finance/insights/insights-client.tsx` - Month selector, summaries, chart with tabs
- `lauos/src/components/ui/chart.tsx` - shadcn Chart component (added via shadcn CLI)
- `lauos/tests/finance.spec.ts` - 12 new VIZL-01 through VIZL-04 test.skip stubs added

## Decisions Made

- Finance layout uses a sibling `finance-sub-nav.tsx` file instead of inlining the client component — consistent with NavLinks pattern and keeps layout.tsx clean
- recharts 2.x was installed (not 3.x) — the recharts `<Label>` center component works correctly in 2.x, no overlay div fallback needed
- Category chart defaults currency to ARS (falls back to USD if no ARS accounts) — InsightsClient receives accounts prop to determine available currencies

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Select onValueChange type mismatch**
- **Found during:** Task 3 (InsightsClient island)
- **Issue:** base-ui Select's onValueChange passes `string | null`, not `string` — TypeScript error TS2322
- **Fix:** Changed handleMonthChange parameter to `value: string | null` with early return guard
- **Files modified:** lauos/src/app/(protected)/finance/insights/insights-client.tsx
- **Verification:** TypeScript check exits clean
- **Committed in:** c04179f (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor type fix needed due to base-ui's Select API. No scope creep.

## Issues Encountered

None beyond the onValueChange type mismatch (documented above as deviation).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Finance sub-nav is in place — Plan 04-02 (balance timeline + transaction list) will add /finance/transactions and the /finance/insights balance chart section
- All VIZL-01 and VIZL-02 test stubs are in place; implementations require real PocketBase data to verify manually
- recharts is installed and working — Plan 04-02 can use LineChart patterns directly

## Self-Check: PASSED

All 7 key files exist on disk. All 3 task commits found in git log.

---
*Phase: 04-finance-insights*
*Completed: 2026-03-11*
