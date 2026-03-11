# Phase 4: Finance — Insights - Research

**Researched:** 2026-03-11
**Domain:** shadcn Chart (recharts), Next.js URL state, PocketBase date filtering, running balance computation
**Confidence:** HIGH

## Summary

Phase 4 adds four visualization features on top of the existing Phase 3 finance data layer: monthly income/expense summaries per currency, a donut chart for category spending distribution, a line chart for account balance over time, and a filterable paginated transaction list. All decisions about layout, UX, and data modeling were locked in the CONTEXT.md session.

The shadcn Chart component (wrapping recharts) is **not yet installed** — `npx shadcn add chart` must happen in Wave 0 before any chart component can be built. Once installed, the pattern is: `ChartContainer` + `ChartConfig` + recharts primitives (`PieChart`/`Pie` for donut, `LineChart`/`Line` for timeline). The existing project patterns (RSC page + `*Client` island, server actions in `src/lib/actions/`, centavos everywhere, ARS/USD always separate) all apply unchanged.

The filterable transaction list introduces the one new pattern: URL search params via `useSearchParams` + `useRouter` in the client island. PocketBase `getList(page, perPage, { filter, sort })` handles paginated server-side fetching. Date range filtering uses PocketBase's `date >= '...' && date <= '...'` string comparison syntax with ISO datetime values.

**Primary recommendation:** Install `shadcn chart` in Wave 0 of Plan 04-01, then build data actions in `src/lib/actions/insights.ts` before wiring any UI component.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Monthly Summary Layout**
- Separate cards per currency: one card for ARS (income / expenses / net), one for USD — consistent with how the accounts page shows patrimony
- Month+year dropdown: user can navigate to any month, not just current
- One shared month selector at the top of the insights page controls both the monthly summary cards AND the category chart
- Cards show: total income, total expenses, and net balance (income minus expenses)
- Transfers excluded from summary (transfer_in and transfer_out are not real income/spending)

**Category Chart**
- Donut chart (via shadcn Chart / recharts) — ring with total in center, legend below/beside
- Separate tabs: Expenses / Income — user can switch to see spending breakdown or income breakdown per category
- Uncategorized transactions grouped as 'Sin categoría' (gray slice) — no data hidden
- Chart syncs to the same month selected by the shared month selector

**Balance Timeline**
- One account at a time with an account selector (dropdown) — clean per-account line chart
- Default date range: last 3 months — good balance of history
- Independent date range control — balance timeline has its own range picker, not tied to the shared month selector
- Running balance per day — plot account balance at end of each day; days with no transactions carry forward previous balance

**Transaction Filter List**
- New /finance/transactions page — dedicated page, added as a nav link in the Finance module navigation
- Collapsible filter panel — filters hidden behind a 'Filters' button, expand on click (saves vertical space)
- URL search params for filter state — ?account=x&category=y&from=z&to=z; shareable, survives refresh, back-button friendly
- 25 transactions per page with prev/next pagination buttons (VIZL-04 requirement)

### Claude's Discretion
- Exact shadcn Chart component variants (ChartContainer, ChartTooltip, etc.)
- Donut center label content (total expenses amount vs transaction count)
- Balance timeline date range picker UI (button group vs dropdown)
- Empty state designs for each chart/section
- Loading skeleton style for charts
- How the Finance module nav links are organized (tabs, sidebar, or top sub-nav)
- Whether the insights page is at /finance/insights or another route

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| VIZL-01 | Usuario puede ver resumen mensual con total de ingresos vs egresos | Monthly summary action fetching transactions filtered by month/year, grouped by type, excluding transfers; separate ARS/USD cards |
| VIZL-02 | Usuario puede ver gráfico de distribución de gastos por categoría del mes actual | Donut chart via shadcn Chart + recharts PieChart; data aggregated server-side by category; tabs switch Expenses/Income dataset |
| VIZL-03 | Usuario puede ver evolución de saldo en el tiempo como gráfico de línea | Line chart via shadcn Chart + recharts LineChart; running balance computed in JS by sorting transactions by date, carrying forward daily balance |
| VIZL-04 | Usuario puede ver listado de transacciones recientes con filtros por cuenta, categoría y rango de fechas | PocketBase getList(page, 25) with filter string built from URL search params; useSearchParams + useRouter for client-side URL state management |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| recharts | installed via `npx shadcn add chart` | Charting primitives (PieChart, LineChart) | Project already uses shadcn; chart component wraps recharts |
| shadcn Chart | added via CLI | ChartContainer, ChartTooltip, ChartLegend wrappers | Provides theme-aware styling on top of recharts |
| Next.js useSearchParams | built-in (Next.js 16) | URL filter state for transaction list | Locked decision; survives refresh, back-button compatible |
| PocketBase JS SDK | ^0.26.8 (already installed) | `getList` for paginated queries, `getFullList` for aggregations | Already the data layer for all finance queries |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | ^0.577.0 (already installed) | Icons for filter panel toggle, empty states, nav links | Consistent with existing icon usage |
| sonner | ^2.0.7 (already installed) | Toast for data errors | Consistent with existing error handling |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| shadcn Chart (recharts) | Chart.js, Victory, Nivo | All locked — project decided shadcn Chart; recharts already in shadcn ecosystem |
| URL search params | Zustand store | URL params chosen (locked) — survives refresh and is shareable |
| nuqs | useSearchParams + useRouter directly | nuqs not installed; the built-in hooks are sufficient for this use case and keep dependencies minimal |

**Installation (Wave 0 of Plan 04-01):**
```bash
cd lauos && npx shadcn add chart
```

---

## Architecture Patterns

### Recommended Project Structure

New files for this phase:

```
lauos/src/
├── lib/actions/
│   └── insights.ts                    # New — all insights data fetching
├── app/(protected)/finance/
│   ├── insights/
│   │   ├── page.tsx                   # RSC — fetches accounts + initial month data
│   │   └── insights-client.tsx        # Client island — month selector, charts
│   └── transactions/
│       ├── page.tsx                   # RSC — reads searchParams, fetches first page
│       └── transactions-client.tsx    # Client island — filter panel, pagination
└── components/finance/
    ├── monthly-summary-card.tsx       # Pure display component — income/expenses/net
    ├── category-donut-chart.tsx       # ChartContainer + PieChart wrapper
    └── balance-timeline-chart.tsx     # ChartContainer + LineChart wrapper
```

### Pattern 1: RSC + Client Island (established, same as Phase 3)

**What:** Page component is an async Server Component. It fetches initial data via server actions. It renders a `*Client` sibling component, passing data as props. Client component holds all interactive state.

**When to use:** Every new page in this phase.

**Example (insights page skeleton):**
```typescript
// src/app/(protected)/finance/insights/page.tsx
import { getInsightsSummaryAction } from '@/lib/actions/insights'
import { getAccountsWithBalancesAction } from '@/lib/actions/accounts'
import { InsightsClient } from './insights-client'

export default async function InsightsPage() {
  const [summaryResult, accountsResult] = await Promise.all([
    getInsightsSummaryAction({ year: currentYear, month: currentMonth }),
    getAccountsWithBalancesAction(),
  ])
  // pass to client island
  return <InsightsClient initialSummary={summaryResult} accounts={accountsResult.accounts ?? []} />
}
```

### Pattern 2: Server Action with Date Filter (new for insights)

**What:** PocketBase `getFullList` with filter string built from JS Date arithmetic. Month boundaries computed in JS, formatted as ISO strings.

**When to use:** Monthly summary (VIZL-01), category chart (VIZL-02), running balance (VIZL-03).

**PocketBase date filter syntax (HIGH confidence — verified with official docs):**
```typescript
// Source: https://pocketbase.io/docs/api-rules-and-filters/
// Date comparison uses string comparison; format: 'YYYY-MM-DD HH:mm:ss.sssZ'
// For month boundaries:
const start = `${year}-${String(month).padStart(2, '0')}-01 00:00:00.000Z`
const lastDay = new Date(year, month, 0).getDate()
const end = `${year}-${String(month).padStart(2, '0')}-${lastDay} 23:59:59.999Z`

const filter = `account = "${accountId}" && date >= "${start}" && date <= "${end}"`
```

**Important:** The `date` field in the transactions collection stores the transaction date (not `created`). Filter on `date` not `created`.

**Type exclusion for transfers:**
```typescript
// Exclude transfers from monthly summary
const filter = `user = "${userId}" && date >= "${start}" && date <= "${end}" && (type = "income" || type = "expense")`
```

### Pattern 3: Running Balance Computation in JS

**What:** Fetch all transactions for an account within a date range (sorted by date asc), compute cumulative balance per day. Days with no transactions carry forward the previous day's balance.

**When to use:** Balance timeline chart (VIZL-03).

**Algorithm:**
```typescript
// Source: adapted from existing accounts.ts balance calculation pattern
type DailyBalance = { date: string; balanceCentavos: number }

function computeDailyBalances(
  transactions: Array<{ date: string; type: string; amount_centavos: number }>,
  startDate: Date,
  endDate: Date,
  initialBalance: number = 0
): DailyBalance[] {
  // Sort transactions by date ascending
  const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date))

  // Group by date
  const byDate = new Map<string, number>()
  for (const tx of sorted) {
    const key = tx.date.slice(0, 10) // YYYY-MM-DD
    const prev = byDate.get(key) ?? 0
    const delta = (tx.type === 'income' || tx.type === 'transfer_in')
      ? tx.amount_centavos
      : -tx.amount_centavos
    byDate.set(key, prev + delta)
  }

  // Walk day by day, carry forward balance
  const result: DailyBalance[] = []
  let runningBalance = initialBalance
  const cursor = new Date(startDate)
  while (cursor <= endDate) {
    const key = cursor.toISOString().slice(0, 10)
    runningBalance += byDate.get(key) ?? 0
    result.push({ date: key, balanceCentavos: runningBalance })
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return result
}
```

**Key consideration:** To compute running balance correctly, you need the balance BEFORE the date range start. Fetch all transactions up to (but not including) the start date to get `initialBalance`, then fetch the range transactions for plotting.

### Pattern 4: URL Search Params for Filter State

**What:** Client island reads `useSearchParams()` for initial state, writes updates via `useRouter().push()` with a new URLSearchParams string. Page RSC receives `searchParams` prop and passes to server action for the initial SSR fetch.

**When to use:** Filterable transaction list (VIZL-04).

**Pattern (HIGH confidence — official Next.js docs):**
```typescript
// Source: https://nextjs.org/docs/app/api-reference/functions/use-search-params
'use client'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'

export function TransactionsClient({ initialData }: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  function setFilter(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    // Reset to page 1 whenever a filter changes
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }
  // ...
}
```

**CRITICAL:** Wrap any component using `useSearchParams` in a `<Suspense>` boundary if the route might be statically rendered. Since `/finance/transactions` always hits PocketBase (dynamic), it's safe, but still good practice.

### Pattern 5: PocketBase Paginated Fetch

**What:** `pb.collection('transactions').getList(page, perPage, { filter, sort, expand })` returns `{ items, page, perPage, totalItems, totalPages }`.

**When to use:** Transaction list page with 25-per-page pagination.

**Example:**
```typescript
// Source: https://pocketbase.io/docs/api-records/
const result = await pb.collection('transactions').getList(page, 25, {
  filter: buildFilterString({ accountId, categoryId, fromDate, toDate }),
  sort: '-date',
  expand: 'category,account',
})
// result.totalPages used to show/hide Next button
// result.page used to show/hide Prev button
```

### Pattern 6: shadcn Chart — Donut

**What:** `ChartContainer` wraps recharts `PieChart` + `Pie` with `innerRadius` prop. `ChartConfig` maps data keys to colors and labels.

**Installation required first:** `npx shadcn add chart`

**Donut chart structure (MEDIUM confidence — verified with official shadcn chart docs overview):**
```typescript
// Source: https://ui.shadcn.com/docs/components/chart
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { PieChart, Pie, Cell, Label } from 'recharts'

const chartConfig = {
  gastos: { label: 'Gastos', color: 'hsl(var(--chart-1))' },
  // per-category colors added dynamically
}

<ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[300px]">
  <PieChart>
    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
    <Pie
      data={data}
      dataKey="amount"
      nameKey="category"
      innerRadius={60}
      strokeWidth={5}
    >
      {/* Center label */}
      <Label
        content={({ viewBox }) => {
          if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
            return (
              <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                <tspan className="fill-foreground text-3xl font-bold">
                  {totalDisplay}
                </tspan>
                <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + 24} className="fill-muted-foreground text-sm">
                  Total
                </tspan>
              </text>
            )
          }
        }}
      />
    </Pie>
  </PieChart>
</ChartContainer>
```

**Known issue:** Recharts v3 has a bug where the `Label` center content may not render. The shadcn team is tracking this (GitHub issue #7669). If recharts v3 is installed, test the center label immediately and fall back to an overlay `<div>` approach if needed.

### Pattern 7: shadcn Chart — Line (Balance Timeline)

**What:** `ChartContainer` wraps recharts `LineChart` + `Line`. X-axis is date string, Y-axis is balance in centavos (formatted in tooltip).

**Line chart structure (MEDIUM confidence):**
```typescript
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts'

<ChartContainer config={chartConfig} className="h-[250px] w-full">
  <LineChart data={dailyBalances} margin={{ left: 12, right: 12 }}>
    <CartesianGrid vertical={false} />
    <XAxis
      dataKey="date"
      tickFormatter={(val) => val.slice(5)} // show MM-DD
      tickLine={false}
      axisLine={false}
    />
    <ChartTooltip
      content={
        <ChartTooltipContent
          formatter={(value) => fromCentavos(value as number, currency)}
        />
      }
    />
    <Line
      dataKey="balanceCentavos"
      type="monotone"
      stroke="var(--color-balance)"
      strokeWidth={2}
      dot={false}
    />
  </LineChart>
</ChartContainer>
```

### Anti-Patterns to Avoid

- **Fetching all transactions client-side for the filter list:** Use PocketBase `getList` server-side with filter string. Never send all transactions to the browser and filter in JS on the transaction list page.
- **Storing filter state in Zustand:** URL search params are locked. Don't use component state or Zustand for filter values — they don't survive refresh.
- **Mixing ARS and USD in the same summary card:** Always separate. Never compute a combined total.
- **Including transfer_in/transfer_out in monthly income/expense:** Transfers are internal movements. Always exclude with `type = "income" || type = "expense"` in filter.
- **Computing running balance without an initial balance offset:** If you only fetch within the date range, day 1 appears to start at 0. Always fetch pre-range transactions to get the starting balance.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Chart rendering | Custom SVG arc math for pie/donut | recharts via shadcn Chart | SVG arcs, animation, accessibility, tooltip positioning are deeply complex |
| Chart theming | Custom CSS variables wiring | ChartContainer + ChartConfig | shadcn Chart handles dark/light mode and CSS variable scoping automatically |
| URL state serialization | Custom encode/decode logic | `URLSearchParams` API (browser built-in) | URLSearchParams handles encoding edge cases; paired with useSearchParams |
| Pagination math | Custom total page count | PocketBase `getList` response `totalPages` | PocketBase returns `totalPages` and `totalItems` — no computation needed |
| Date range boundaries | Manual month-end calculation | `new Date(year, month, 0).getDate()` | JS Date handles month length including leap year for Feb |

**Key insight:** The charting domain has enormous hidden complexity in layout, accessibility, and interaction. recharts handles all of it; shadcn Chart adds theme wiring. The only custom logic is data transformation (aggregation, running balance), which belongs in server actions.

---

## Common Pitfalls

### Pitfall 1: Recharts v3 Center Label Bug
**What goes wrong:** After `npx shadcn add chart`, if recharts v3 is installed, the `<Label>` component inside `<Pie>` renders nothing — the center of the donut appears blank.
**Why it happens:** Recharts 3.0 broke the Label component in PieChart contexts (tracked in recharts/recharts#5985 and shadcn-ui/ui#7669).
**How to avoid:** After installing, immediately test a minimal donut chart with a center Label. If blank, use a positioned `<div>` overlay with `absolute` positioning over the chart instead of the recharts `Label` component.
**Warning signs:** Chart renders correctly (slices visible) but center is empty.

### Pitfall 2: Running Balance Starting at Zero
**What goes wrong:** Balance timeline shows a spike on day 1 as if the account started with zero balance at the beginning of the selected range.
**Why it happens:** Only transactions within the selected date range are fetched, so the balance computation starts at 0 instead of the actual account balance before the range.
**How to avoid:** Fetch all transactions BEFORE the range start date to compute `initialBalance`, then use that as the starting point when walking the range day by day.
**Warning signs:** Chart shows a sudden large jump on the first day of the range.

### Pitfall 3: PocketBase Filter String Injection
**What goes wrong:** User-supplied filter values (account ID, category ID, date strings) passed directly into PocketBase filter string allow injection of arbitrary filter logic.
**Why it happens:** Filter is a string; unsanitized values can close the current expression and add OR conditions.
**How to avoid:** Always use the PocketBase SDK's `pb.filter()` helper or validate/sanitize IDs (they are PocketBase record IDs — 15 alphanumeric chars) before interpolation. For date strings, parse with `new Date()` and re-format before injection.
**Warning signs:** Any place where URL params are directly string-interpolated into filter without validation.

### Pitfall 4: useSearchParams Without Suspense on Static Routes
**What goes wrong:** Build fails or page throws in production because `useSearchParams` on a statically analyzed route requires a Suspense boundary.
**Why it happens:** Next.js requires components using `useSearchParams` in Client Components to be wrapped in Suspense to allow static rendering of the surrounding tree.
**How to avoid:** Wrap `TransactionsClient` in `<Suspense fallback={<Loading />}>` in the RSC page component.
**Warning signs:** Build warning: "useSearchParams() should be wrapped in a suspense boundary."

### Pitfall 5: Finance Sub-Nav Route Mismatch
**What goes wrong:** The Finance module currently redirects `/finance` → `/finance/accounts`. Adding new pages without updating the sub-navigation means users have no way to reach `/finance/insights` or `/finance/transactions`.
**Why it happens:** `src/lib/modules.ts` only knows about the top-level `/finance` module. Sub-navigation is not yet implemented.
**How to avoid:** Plan 04-01 or 04-02 must explicitly add sub-nav component (tabs or link bar) to a finance layout, covering Accounts, Insights, and Transactions links. This is a prerequisite for all new pages to be reachable.
**Warning signs:** Pages render correctly when navigated to directly but are unreachable from the UI.

### Pitfall 6: Category Color in Donut Charts
**What goes wrong:** Category colors (stored as hex strings like `#FF6B35`) used as Tailwind classes fail silently in Tailwind v4 (dynamic class values not scanned at build time).
**Why it happens:** Known from Phase 3 (CategoryBadge uses inline hex alpha style, not Tailwind classes) — the same constraint applies to chart slice colors.
**How to avoid:** Pass category color as inline `fill` prop on recharts `Cell` component, or as a CSS variable set via `style` prop. Never use dynamic Tailwind color classes for chart fills.
**Warning signs:** All donut slices render as the same default color.

---

## Code Examples

### Monthly Summary Action (insights.ts)
```typescript
// src/lib/actions/insights.ts
'use server'
import { createServerClient } from '@/lib/pocketbase-server'

export type MonthlySummary = {
  currency: 'ARS' | 'USD'
  incomeCentavos: number
  expensesCentavos: number
  netCentavos: number
}

export async function getMonthlySummaryAction(params: {
  year: number
  month: number // 1-indexed
}): Promise<{ summaries: MonthlySummary[]; error?: never } | { error: string }> {
  const pb = await createServerClient()
  if (!pb.authStore.isValid) return { error: 'Not authenticated' }

  const userId = pb.authStore.record?.id
  const { year, month } = params

  // Month boundaries (UTC)
  const start = `${year}-${String(month).padStart(2, '0')}-01 00:00:00.000Z`
  const lastDay = new Date(year, month, 0).getDate()
  const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')} 23:59:59.999Z`

  try {
    const txs = await pb.collection('transactions').getFullList({
      filter: `user = "${userId}" && date >= "${start}" && date <= "${end}" && (type = "income" || type = "expense")`,
      fields: 'type,amount_centavos,account',
    })

    // Need account currency — fetch accounts map
    const accounts = await pb.collection('accounts').getFullList({ fields: 'id,currency' })
    const currencyMap = new Map(accounts.map((a) => [a.id as string, a.currency as 'ARS' | 'USD']))

    const summaryMap = new Map<'ARS' | 'USD', { income: number; expenses: number }>()
    for (const tx of txs) {
      const currency = currencyMap.get(tx.account as string)
      if (!currency) continue
      const entry = summaryMap.get(currency) ?? { income: 0, expenses: 0 }
      if (tx.type === 'income') entry.income += tx.amount_centavos as number
      else entry.expenses += tx.amount_centavos as number
      summaryMap.set(currency, entry)
    }

    const summaries: MonthlySummary[] = (['ARS', 'USD'] as const)
      .filter((c) => summaryMap.has(c))
      .map((currency) => {
        const { income, expenses } = summaryMap.get(currency)!
        return { currency, incomeCentavos: income, expensesCentavos: expenses, netCentavos: income - expenses }
      })

    return { summaries }
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Failed to fetch summary' }
  }
}
```

### Category Distribution Action
```typescript
export type CategorySlice = {
  categoryId: string | null // null = uncategorized
  categoryName: string
  categoryColor: string
  amountCentavos: number
}

export async function getCategoryDistributionAction(params: {
  year: number
  month: number
  type: 'income' | 'expense'
  currency: 'ARS' | 'USD'
}): Promise<{ slices: CategorySlice[] } | { error: string }> {
  // Fetch transactions of given type for month, expand category
  // Group by category, sum amounts
  // Return sorted by amount descending
  // Uncategorized (no category) → { categoryId: null, categoryName: 'Sin categoría', categoryColor: '#9ca3af' }
}
```

### Paginated Transaction Fetch
```typescript
export async function getFilteredTransactionsAction(params: {
  page: number
  accountId?: string
  categoryId?: string
  fromDate?: string // YYYY-MM-DD
  toDate?: string   // YYYY-MM-DD
}): Promise<{ items: TransactionRow[]; totalPages: number; totalItems: number } | { error: string }> {
  // Build filter string from non-null params
  // pb.collection('transactions').getList(page, 25, { filter, sort: '-date', expand: 'category,account' })
}
```

### URL Filter State (client island)
```typescript
// Source: https://nextjs.org/docs/app/api-reference/functions/use-search-params
'use client'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useCallback } from 'react'

export function TransactionsClient(props: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const setParam = useCallback((key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    params.delete('page') // reset pagination on filter change
    router.push(`${pathname}?${params.toString()}`)
  }, [searchParams, router, pathname])

  const page = Number(searchParams.get('page') ?? '1')
  const accountId = searchParams.get('account') ?? undefined
  const categoryId = searchParams.get('category') ?? undefined
  const fromDate = searchParams.get('from') ?? undefined
  const toDate = searchParams.get('to') ?? undefined
  // ...
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| recharts standalone | shadcn Chart wrapping recharts | shadcn Chart introduced ~2024 | Theming, dark mode, and tooltip handling done by shadcn; same recharts API underneath |
| Page-level state for filters | URL search params | Next.js App Router | Filters survive refresh, shareable URL, back-button works |
| `getFullList` for everything | `getList` for paginated views | Always existed in PocketBase SDK | `getFullList` would load all transactions — use `getList` for the filter page |

**Deprecated/outdated:**
- `query.page` router params (Next.js Pages Router): In App Router, paginated pages receive `searchParams` as a prop to the RSC page, not via router.

---

## Open Questions

1. **Recharts version installed by `npx shadcn add chart`**
   - What we know: shadcn chart wraps recharts; there is an active issue about v3 center label bug
   - What's unclear: Which exact recharts version `npx shadcn add chart` will install at time of execution
   - Recommendation: Install chart in Wave 0, immediately check `package.json` for recharts version, test center label behavior on a minimal donut — fall back to overlay div if Label is broken

2. **Finance sub-nav component location**
   - What we know: There is no finance layout.tsx yet; `/finance` currently redirects to `/finance/accounts`
   - What's unclear: Whether to add a `layout.tsx` in `/app/(protected)/finance/` with a sub-nav, or add a nav component within each page
   - Recommendation: Create `src/app/(protected)/finance/layout.tsx` with a tab-style sub-nav (Accounts | Insights | Transactions). This is cleaner than duplicating nav in each page. Claude's discretion applies here.

3. **Initial balance for balance timeline**
   - What we know: We need the account balance before the selected date range starts
   - What's unclear: Whether to fetch all pre-range transactions or reuse `getAccountsWithBalancesAction` which fetches all transactions
   - Recommendation: Create a dedicated `getAccountBalanceBeforeDateAction(accountId, beforeDate)` that fetches transactions with `date < "${startDate}"` and computes the sum. This is more efficient than loading all transactions.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright 1.58.2 |
| Config file | `lauos/playwright.config.ts` |
| Quick run command | `cd lauos && npx playwright test tests/finance.spec.ts --project=chromium` |
| Full suite command | `cd lauos && npx playwright test --project=chromium` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VIZL-01 | Monthly summary cards show income, expenses, net per currency; transfers excluded | E2E smoke | `cd lauos && npx playwright test tests/finance.spec.ts -g "VIZL-01" --project=chromium` | ❌ Wave 0 |
| VIZL-02 | Donut chart renders with category slices; tab switch changes dataset | E2E smoke | `cd lauos && npx playwright test tests/finance.spec.ts -g "VIZL-02" --project=chromium` | ❌ Wave 0 |
| VIZL-03 | Balance timeline chart renders for selected account; account selector works | E2E smoke | `cd lauos && npx playwright test tests/finance.spec.ts -g "VIZL-03" --project=chromium` | ❌ Wave 0 |
| VIZL-04 | Transaction list paginates at 25/page; account, category, date filters work simultaneously; URL updates on filter change | E2E smoke | `cd lauos && npx playwright test tests/finance.spec.ts -g "VIZL-04" --project=chromium` | ❌ Wave 0 |

**Note on chart testing:** Playwright can assert that chart SVG elements exist in the DOM (e.g., `expect(page.locator('svg')).toBeVisible()`), but pixel-level chart accuracy is not testable. Tests should focus on: page renders without error, key UI elements present, filter changes update URL, pagination controls work.

### Sampling Rate
- **Per task commit:** `cd lauos && npx playwright test tests/finance.spec.ts --project=chromium`
- **Per wave merge:** `cd lauos && npx playwright test --project=chromium`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `lauos/tests/finance.spec.ts` — add VIZL-01 through VIZL-04 stub tests (file exists but only has Phase 3 stubs)
- [ ] shadcn chart install: `cd lauos && npx shadcn add chart` — recharts not yet in package.json

---

## Sources

### Primary (HIGH confidence)
- PocketBase API docs (https://pocketbase.io/docs/api-rules-and-filters/) — date filter operators, macros, filter string syntax
- PocketBase API docs (https://pocketbase.io/docs/api-records/) — getList pagination response shape (totalItems, totalPages, page, perPage)
- Next.js docs (https://nextjs.org/docs/app/api-reference/functions/use-search-params) — useSearchParams hook, Suspense requirement
- Existing codebase (`src/lib/actions/accounts.ts`) — balance calculation pattern, centavos arithmetic, discriminated union return types

### Secondary (MEDIUM confidence)
- shadcn/ui chart docs overview (https://ui.shadcn.com/docs/components/chart) — ChartContainer, ChartConfig, ChartTooltip structure; verified that recharts is used underneath
- shadcn/ui charts page (https://ui.shadcn.com/charts/pie) — donut chart with innerRadius confirmed; center label pattern confirmed with Label component
- Next.js learn (https://nextjs.org/learn/dashboard-app/adding-search-and-pagination) — URL search param + pagination pattern in App Router

### Tertiary (LOW confidence — flag for validation)
- recharts center label bug in v3 (GitHub recharts/recharts#5985, shadcn-ui/ui#7669) — reported June 2025; verify actual recharts version installed by `npx shadcn add chart` before relying on Label component

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — recharts/shadcn chart is verified as the approach; PocketBase SDK pagination is verified; Next.js useSearchParams is official API
- Architecture: HIGH — all patterns are direct extensions of existing Phase 3 patterns (RSC + client island, server actions, centavos)
- Chart API specifics: MEDIUM — ChartContainer/ChartConfig structure verified; center label behavior LOW due to recharts v3 bug report
- Pitfalls: HIGH — running balance offset and transfer exclusion derived from codebase reading; recharts label bug from GitHub issues

**Research date:** 2026-03-11
**Valid until:** 2026-04-11 (shadcn and recharts versions may shift; verify before implementation)
