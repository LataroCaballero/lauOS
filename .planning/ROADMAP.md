# Roadmap: lauOS

## Overview

lauOS is built in four sequential phases, each delivering a coherent and verifiable capability. Infrastructure and authentication must be working before any module is built; the dashboard shell must exist before modules can be navigated to; and Finance data entry must be stable and schema-locked before visualizations are layered on top. The dependency order is strict and follows the critical pitfalls identified in research: PocketBase must be secured correctly from day one because schema and auth patterns cannot be safely retrofitted after data exists.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation + Auth** - PocketBase on VPS, Next.js scaffold, and working login with persistent session (completed 2026-03-10)
- [x] **Phase 2: Dashboard Shell** - Navbar, module grid, dark mode, and responsive layout (completed 2026-03-10)
- [x] **Phase 3: Finance — Data** - Accounts, transactions, and categories with full CRUD (completed 2026-03-11)
- [x] **Phase 4: Finance — Insights** - Monthly summaries, category charts, balance timeline, and filtered transaction list (completed 2026-03-11)
- [x] **Phase 5: Close Audit Gaps** - Add categories to finance sub-nav and create Phase 02 VERIFICATION.md (completed 2026-03-11)

## Phase Details

### Phase 1: Foundation + Auth
**Goal**: Lautaro can securely log into a running, production-grade infrastructure where the database, auth, and project scaffold are correctly configured and will not require breaking changes later.
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04
**Success Criteria** (what must be TRUE):
  1. Lautaro can log in with email and password from the live Vercel URL and land on the dashboard
  2. Refreshing the browser or opening a new tab keeps the session active — no re-login required
  3. Lautaro can log out from any page and is redirected to the login screen
  4. Lautaro can view and edit his display name and avatar from a profile page
  5. PocketBase is running under systemd on the VPS, bound to localhost behind Nginx TLS, and survives a reboot without intervention
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md — VPS + PocketBase infrastructure: systemd service, Nginx TLS via Certbot, CORS config, local Mac dev setup
- [ ] 01-02-PLAN.md — Next.js scaffold: App Router, TypeScript, Tailwind v4, shadcn/ui, PocketBase two-client factory, Playwright test infrastructure
- [ ] 01-03-PLAN.md — Auth flows: split-screen login page, middleware route protection + silent refresh, logout, /settings with display name + password change

### Phase 2: Dashboard Shell
**Goal**: Lautaro has a fully navigable dashboard shell where every module entry point is accessible, dark/light mode works, and the layout is usable on mobile.
**Depends on**: Phase 1
**Requirements**: SHLL-01, SHLL-02, SHLL-03, SHLL-04, SHLL-05
**Success Criteria** (what must be TRUE):
  1. Top navbar shows the active user's name, links to all available modules, and a logout option from every protected page
  2. The home page displays a clickable card grid — one card per module — that navigates to the correct module page
  3. Toggling dark/light mode applies immediately and persists across page refreshes and new tabs
  4. The dashboard layout is usable on a mobile screen (no horizontal scroll, no clipped content)
  5. Lautaro can change his accent color in settings and the change is reflected across the UI and persists after a refresh
**Plans**: 3 plans

Plans:
- [ ] 02-01-PLAN.md — Layout shell: test scaffold, protected layout, navbar, bottom nav, module card grid, placeholder routes
- [ ] 02-02-PLAN.md — Dark mode: Zustand theme store, ThemeProvider, flash-prevention script, wired toggle
- [ ] 02-03-PLAN.md — Settings: tabbed profile/appearance page, avatar crop-and-upload, accent color swatches + PocketBase persistence

### Phase 3: Finance — Data
**Goal**: Lautaro can create and manage accounts in ARS and USD, record every type of transaction (income, expense, transfer) with categories, and always see accurate balances per account.
**Depends on**: Phase 2
**Requirements**: ACCT-01, ACCT-02, ACCT-03, ACCT-04, TRAN-01, TRAN-02, TRAN-03, TRAN-04, TRAN-05, CATG-01, CATG-02, CATG-03
**Success Criteria** (what must be TRUE):
  1. Lautaro can create a new account with a name and currency (ARS or USD) and it appears immediately in his account list
  2. Each account displays its current balance, calculated correctly from all its transactions, with no float precision errors
  3. Lautaro can create an income or expense transaction by selecting an account, entering an amount, date, category, and an optional note
  4. Lautaro can record a transfer between two of his own accounts and both balances update correctly
  5. For USD transactions, Lautaro can enter the exchange rate used (fetched from dolarhoy.com or entered manually) and it is stored immutably at transaction time
  6. Lautaro can edit or delete any transaction or account, and categories come pre-populated with sensible defaults on first use
**Plans**: 4 plans

Plans:
- [ ] 03-01-PLAN.md — PocketBase schema + test stub: accounts/categories/transactions migrations, pb_hooks category seeder, money.ts helpers, finance.spec.ts Wave 0
- [ ] 03-02-PLAN.md — Accounts UI: account list, create/edit/archive, per-account balance, patrimony summary ARS/USD
- [ ] 03-03-PLAN.md — Transactions UI: income/expense/transfer form, dolarapi.com rate fetch via Server Action, transaction list, edit/delete
- [ ] 03-04-PLAN.md — Categories UI: category list, create/edit/delete with emoji icon and color swatch picker

### Phase 4: Finance — Insights
**Goal**: Lautaro can understand his financial health at a glance through monthly summaries, spending breakdowns by category, balance history over time, and a filterable transaction history.
**Depends on**: Phase 3
**Requirements**: VIZL-01, VIZL-02, VIZL-03, VIZL-04
**Success Criteria** (what must be TRUE):
  1. Lautaro can see total income vs. total expenses for the current month, updated as transactions are added
  2. Lautaro can see a chart showing how his spending is distributed across categories for the current month
  3. Lautaro can see a line chart showing the balance of any account over time
  4. Lautaro can see a paginated list of recent transactions filtered by account, category, and date range simultaneously
**Plans**: 2 plans

Plans:
- [x] 04-01-PLAN.md — Finance sub-nav layout, insights server actions, /finance/insights page with monthly summary cards and category donut chart (VIZL-01, VIZL-02)
- [x] 04-02-PLAN.md — Balance timeline chart and /finance/transactions page with collapsible filters, URL search params, and 25-per-page pagination (VIZL-03, VIZL-04)

### Phase 5: Close Audit Gaps
**Goal**: All v1.0 audit blockers resolved — categories page is navigable via finance sub-nav, and Phase 02 requirements are formally verified with a VERIFICATION.md.
**Depends on**: Phase 4
**Requirements**: CATG-01, CATG-02, SHLL-01, SHLL-02, SHLL-03, SHLL-04, SHLL-05
**Gap Closure**: Closes gaps from v1.0-MILESTONE-AUDIT.md
**Success Criteria** (what must be TRUE):
  1. `/finance/categories` appears as a link in the finance sub-nav and is reachable via normal navigation
  2. Phase 02 has a VERIFICATION.md with all 5 SHLL requirements formally verified
**Plans**: 2 plans

Plans:
- [ ] 05-01-PLAN.md — Add categories link to FinanceSubNav (CATG-01, CATG-02)
- [ ] 05-02-PLAN.md — Create Phase 02 VERIFICATION.md (SHLL-01 through SHLL-05)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation + Auth | 3/3 | Complete   | 2026-03-10 |
| 2. Dashboard Shell | 3/3 | Complete   | 2026-03-10 |
| 3. Finance — Data | 4/4 | Complete   | 2026-03-11 |
| 4. Finance — Insights | 2/2 | Complete   | 2026-03-11 |
| 5. Close Audit Gaps | 2/2 | Complete   | 2026-03-11 |
