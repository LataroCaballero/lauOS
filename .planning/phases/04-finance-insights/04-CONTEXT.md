# Phase 4: Finance — Insights - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Display financial analytics for Lautaro: a monthly summary with income vs expenses per currency, a donut chart showing spending distribution by category, a line chart showing balance evolution per account over time, and a new dedicated page with a paginated, filterable transaction history. Does NOT include new transaction entry, account editing, or category management — those belong to Phase 3.

</domain>

<decisions>
## Implementation Decisions

### Monthly Summary Layout
- **Separate cards per currency**: one card for ARS (income / expenses / net), one for USD — consistent with how the accounts page shows patrimony
- **Month+year dropdown**: user can navigate to any month, not just current
- **One shared month selector** at the top of the insights page controls both the monthly summary cards AND the category chart
- Cards show: **total income, total expenses, and net balance** (income minus expenses)
- **Transfers excluded** from summary (transfer_in and transfer_out are not real income/spending)

### Category Chart
- **Donut chart** (via shadcn Chart / recharts) — ring with total in center, legend below/beside
- **Separate tabs: Expenses / Income** — user can switch to see spending breakdown or income breakdown per category
- **Uncategorized transactions** grouped as 'Sin categoría' (gray slice) — no data hidden
- Chart syncs to the same month selected by the shared month selector

### Balance Timeline
- **One account at a time** with an account selector (dropdown) — clean per-account line chart
- **Default date range: last 3 months** — good balance of history
- **Independent date range control** — balance timeline has its own range picker, not tied to the shared month selector (a line chart showing balance over time needs a range, not a single month)
- **Running balance per day** — plot account balance at end of each day; days with no transactions carry forward previous balance

### Transaction Filter List
- **New /finance/transactions page** — dedicated page, added as a nav link in the Finance module navigation
- **Collapsible filter panel** — filters hidden behind a 'Filters' button, expand on click (saves vertical space)
- **URL search params** for filter state — ?account=x&category=y&from=z&to=z; shareable, survives refresh, back-button friendly
- **25 transactions per page** with prev/next pagination buttons (VIZL-04 requirement)

### Claude's Discretion
- Exact shadcn Chart component variants (ChartContainer, ChartTooltip, etc.)
- Donut center label content (total expenses amount vs transaction count)
- Balance timeline date range picker UI (button group vs dropdown)
- Empty state designs for each chart/section
- Loading skeleton style for charts
- How the Finance module nav links are organized (tabs, sidebar, or top sub-nav)
- Whether the insights page is at /finance/insights or another route

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/ui/card.tsx`: Full Card component (rounded-xl, ring-1 shadow) — use for monthly summary cards and chart containers
- `src/components/ui/button.tsx`: Button component — use for filter toggle, pagination prev/next, donut tabs
- `src/components/ui/select.tsx`: Select component — use for account selector (timeline), month picker, filter dropdowns
- `src/lib/money.ts` (`fromCentavos`): Money formatter — use for all monetary displays in summaries and charts
- `src/lib/actions/accounts.ts` (`getAccountsWithBalancesAction`): Fetches accounts list and calculates balance from all transactions in JS — reuse the transaction-fetching approach for insights data
- `src/components/finance/transaction-list.tsx`: Existing transaction list component — may be adapted/extended for the filtered transaction page, though it's currently per-account without filter support
- `src/components/finance/category-badge.tsx`: CategoryBadge with inline hex alpha style — can be used in filter UI and transaction rows

### Established Patterns
- **Client island pattern**: RSC page fetches data server-side, exports a `*Client` component for interactivity (`AccountsClient`, `CategoriesClient`) — follow this for all new pages
- **Server Actions for data**: all PocketBase queries go through `'use server'` actions in `src/lib/actions/` — create new `insights.ts` action file for insights-specific queries
- **Balance calculation in JS**: transactions fetched with minimal fields, reduced in JS — same approach for running balance computation in timeline
- **centavos everywhere**: amounts always stored/passed as integer centavos; format at display layer with `fromCentavos()`
- **ARS/USD always separate**: never auto-convert currencies; show separate totals per currency

### Integration Points
- New `/finance/transactions` page needs a nav link added — `src/lib/modules.ts` or the finance sub-nav (wherever module links live)
- New `/finance/insights` (or similar) page also needs a nav link
- shadcn Chart component must be added via `npx shadcn add chart` before plans can use it — no chart library currently installed
- URL search params for filter state: use Next.js `useSearchParams` + `useRouter` in the client island

</code_context>

<specifics>
## Specific Ideas

- Donut chart with tabs (Expenses / Income) is a compact UI pattern — the tabs sit above or below the chart, switching the dataset without changing the chart's position on the page
- Month+year dropdown for the shared month selector — should feel like a clean popover or native select, not a full date picker calendar (month granularity only)
- Finance module will grow to have at least 3 nav sections: Accounts, Insights, Transactions — plan the sub-navigation structure accordingly

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-finance-insights*
*Context gathered: 2026-03-11*
