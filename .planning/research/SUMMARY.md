# Project Research Summary

**Project:** lauOS — Personal Life OS Dashboard
**Domain:** Single-user personal dashboard web app (modular: Finance + Claude Stats)
**Researched:** 2026-03-09
**Confidence:** HIGH (stack + pitfalls), MEDIUM (architecture integration patterns), MEDIUM-HIGH (features with one critical external constraint)

## Executive Summary

lauOS is a single-user personal dashboard — a "Life OS" — that combines a multi-currency finance tracker (ARS + USD) with a Claude API usage stats module. The established pattern for this type of project is a Next.js App Router frontend deployed on Vercel, backed by a self-hosted PocketBase instance on a VPS. PocketBase acts as the single backend for auth, database (SQLite), and file storage — eliminating the need for a separate auth system, ORM, or external database. TanStack Query handles server state from PocketBase; Zustand manages UI state; shadcn/ui on Tailwind v4 delivers the design system. This stack is mature, well-documented for this use case, and avoids unnecessary complexity for a single-user product.

The recommended build approach is strictly sequential: infrastructure and auth must be working before any module is built, and the Finance module schema must be finalized before any data is entered. The project has two modules with distinct data sources — PocketBase (Finance) and the Anthropic Admin API (Claude Stats) — and they must remain architecturally isolated. The Claude Stats module has a hard external prerequisite: the Anthropic Admin API (`sk-ant-admin` key) is only available to organization accounts, not individual API accounts. This must be verified before that module enters development.

The primary risks cluster around infrastructure decisions that are painful to retrofit: using a shared PocketBase instance on the server (causes auth token bleed-over), storing monetary values as floats (causes permanent precision drift in balances), and omitting PocketBase systemd configuration and backups (causes data loss and unrecoverable downtime). All three must be addressed in the foundation phase — none can be deferred. The ARS/USD multi-currency context adds a domain-specific risk: Argentina's multiple simultaneous exchange rates (official vs. blue market) mean the app must store the rate used at transaction time rather than auto-fetching a current rate.

## Key Findings

### Recommended Stack

The stack is cohesive and opinionated. Next.js 15 (App Router, not Pages Router) is the correct choice — Next.js 16 has documented production stability issues as of early 2026. shadcn/ui has completed its Tailwind v4 migration; new projects should start on v4 (`@theme` CSS variables, OKLCH colors). PocketBase 0.26.x serves as the all-in-one backend; the JS SDK manages auth tokens and should never be bypassed with raw `fetch` calls. TanStack Query v5 handles all PocketBase data fetching (the 2025 community consensus over SWR); Zustand handles pure UI state. React Hook Form + Zod + `@hookform/resolvers` is the validated forms stack. Charts go through shadcn's Chart components (Recharts wrapper), not Recharts directly.

See `.planning/research/STACK.md` for full version table, installation commands, and alternatives analysis.

**Core technologies:**
- **Next.js 15 (App Router):** Frontend, routing, SSR auth gate, API route proxies — battle-tested, v16 has known production issues
- **PocketBase 0.26.x + JS SDK:** Auth, database, file storage — single binary, zero external dependencies
- **TypeScript 5.x:** Type safety across the entire codebase — non-optional with shadcn/ui + TanStack Query + Zod
- **Tailwind CSS 4.x + shadcn/ui:** Design system — shadcn components are copied into the repo (owned, not dependency-locked)
- **TanStack Query v5:** All PocketBase data fetching, caching, revalidation
- **Zustand 5.x:** Client UI state (sidebar, active currency, preferences) — not for PocketBase data
- **React Hook Form 7.x + Zod 4.x:** Forms and validation — pairs natively with shadcn Form component
- **Recharts 3.x via shadcn Chart:** Visualizations — use shadcn wrappers, not Recharts directly
- **Resend + React Email:** Transactional email (alerts, v1.x) — called server-side only, never client-side
- **`Intl.NumberFormat` (native):** ARS/USD formatting — no external currency library needed for two currencies

### Expected Features

See `.planning/research/FEATURES.md` for full prioritization matrix, dependency map, and competitor analysis.

**Must have (v1 table stakes):**
- PocketBase auth — login, persistent session, redirect on expiry
- Dashboard home with module card grid (Finance + Claude Stats)
- Finance: account creation with ARS/USD currency designation and initial balance
- Finance: manual transaction entry (date, amount, description, category, account)
- Finance: transaction list with account and date range filters
- Finance: account balance display per currency (ARS and USD not mixed)
- Finance: total net worth summary (separate per currency)
- Claude Stats: daily/weekly token usage and USD cost from Usage API
- Claude Stats: cost breakdown by model (Opus / Sonnet / Haiku)
- Claude Stats: time series chart (daily tokens/cost)
- Dark mode with persistent preference
- Consistent design system (clean/modern, yellow accent, card-heavy)

**Should have (v1.x after core is stable):**
- Finance: edit/delete transactions
- Finance: category spending view
- Finance: manual FX rate field on transactions
- Finance: CSV import
- Claude Stats: cache efficiency metric (cache_read ratio)
- Claude Stats: Claude Code Analytics (tool acceptance rates, LOC, commits) — gated on Admin API access
- Monthly finance summary widget on home dashboard
- Empty state design for both modules

**Defer (v2+):**
- Budget/envelope planning — needs multi-month transaction history first
- Notes, Habit tracker, Pomodoro, Bookmarks modules
- Recurring transaction automation
- AI-powered spending insights
- Notification/alert system via Resend
- Mobile PWA/native
- Automatic bank integration (out of scope for Argentina context)
- Automatic ARS/USD conversion via live FX API (blue dollar reality makes this misleading)

**Critical external constraint — Anthropic Admin API:** The Usage API and Claude Code Analytics API both require an `sk-ant-admin` key, which is only available on organization accounts. If Lautaro's Anthropic account is individual-only, the Claude Stats module cannot be built as specified. Creating an organization in the Anthropic Console (free, single-member is valid) resolves this. This must be confirmed before the Claude Stats phase begins.

### Architecture Approach

The architecture splits cleanly into two deployment zones: Vercel (Next.js App) and a VPS (PocketBase binary). Communication between the two zones goes through the PocketBase JS SDK for authenticated data operations and through Next.js API route proxies for the Anthropic Admin API (the key must never reach the browser). The application is organized into route groups — `(auth)/` for login, `(dashboard)/` for protected pages — with a `middleware.ts` auth gate that runs before any page renders. Each module (finance, claude-stats) owns its components, hooks, types, and API helpers; modules do not import from each other.

See `.planning/research/ARCHITECTURE.md` for the full system diagram, project file structure, data flow diagrams, and implementation patterns.

**Major components:**
1. **Next.js Middleware** — auth gate; reads `pb_auth` cookie, redirects to `/login` if invalid; runs before any page render
2. **PocketBase Browser Client (singleton)** — used in client components; syncs auth token to cookie on change via `authStore.onChange`
3. **PocketBase Server Client (factory function)** — creates a fresh instance per request in server components and API routes; loads auth from incoming cookie; never a shared singleton
4. **Next.js API Routes (`/api/anthropic/*`)** — server-side proxy for Anthropic Admin API; holds `ANTHROPIC_ADMIN_KEY`; client components never touch Anthropic directly
5. **Finance Module** — account and transaction management; reads/writes PocketBase collections `accounts`, `transactions`, `categories`
6. **Claude Stats Module** — usage and cost visualization; data sourced from Anthropic API via Next.js proxy, cached in PocketBase

### Critical Pitfalls

See `.planning/research/PITFALLS.md` for the full list of 10 pitfalls, recovery strategies, and the "looks done but isn't" checklist.

1. **Shared PocketBase SDK instance on the server** — Always use a factory function (`createServerClient()`) that creates a fresh instance per request. A module-level singleton leaks auth tokens across requests. Must be the correct pattern from day one; retrofitting is expensive. Severity: CRITICAL.

2. **Storing monetary values as floats** — Store all amounts as integers in centavos (multiply by 100 before storage, divide by 100 at display). PocketBase `number` fields map to SQLite REAL (IEEE 754 float); rounding errors compound across transactions. Schema cannot be changed after data exists without a migration. Severity: CRITICAL.

3. **Open PocketBase collection API rules** — Every collection must require `@request.auth.id != ""` at minimum. Default new collections are admin-only, but first-time users often set rules to empty string `""` ("allow all") to debug access issues, inadvertently opening data to the public internet. Verify with unauthenticated curl after every collection creation. Severity: CRITICAL.

4. **PocketBase process not surviving VPS reboots** — Configure systemd immediately after first successful VPS test. Run PocketBase bound to `127.0.0.1:8090` (not `0.0.0.0`) with Nginx for TLS and the `--encryptionEnv` flag set. Severity: HIGH.

5. **Anthropic API called uncached on every page load** — Claude Stats page must cache usage data (1-hour `revalidate` or PocketBase-stored snapshots). Uncached calls add 500-2000ms to every load and can crash the full dashboard on a 429 from Anthropic. Wrap in try/catch with module-level error boundary so the Finance module still renders when Anthropic is unavailable. Severity: HIGH.

6. **ARS/USD exchange rate policy undefined** — Argentina's blue dollar vs. official rate divergence (often 30-100%+) makes auto-fetched FX rates actively harmful. Store the exchange rate as a user-entered field at transaction time; never recalculate historical conversions with a current rate. Severity: HIGH for domain accuracy.

7. **Modular dashboard becoming a god component** — Enforce feature-folder structure from day one: `src/modules/finance/` and `src/modules/claude-stats/` each own their components, hooks, types, and API calls. The `(dashboard)/page.tsx` is thin orchestration only. Severity: MEDIUM (architectural debt that compounds fast).

## Implications for Roadmap

Based on the combined research, the dependency structure is strict and drives the phase order. Auth cannot be skipped. Finance schema cannot be changed after data exists. Claude Stats has an external prerequisite (Admin API key) that must be confirmed before that phase starts.

### Phase 1: Infrastructure and Foundation

**Rationale:** PocketBase must be running, secured, and persistent before any application code can function. The server-side PocketBase client pattern must be established correctly here — it cannot be retrofitted. The systemd unit, backup strategy, CORS configuration, and collection access rules are all infrastructure decisions that protect against the CRITICAL pitfalls identified in research.

**Delivers:** A VPS running PocketBase under systemd with TLS, CORS configured for the Vercel domain, encryption key set, backup strategy in place, and the Next.js project scaffolded with the correct PocketBase client factory functions.

**Addresses:** Dashboard shell foundation, TypeScript project structure, environment variable setup.

**Avoids:** Shared PocketBase singleton (Pitfall 1), open collection rules (Pitfall 3), no systemd (Pitfall 5), no backups (Pitfall 6), CORS misconfiguration (Pitfall 9).

**Research flag:** Standard patterns — no additional research needed. PocketBase VPS setup is well-documented.

### Phase 2: Authentication

**Rationale:** Every module requires auth. Login → cookie → middleware → session persistence is a strict prerequisite for all other work. Must be fully verified (cookie-based persistence, middleware redirect, logout) before building any feature that reads protected data.

**Delivers:** Working login page, persistent session via `pb_auth` cookie, middleware auth gate on `(dashboard)/` routes, logout action.

**Uses:** PocketBase `authWithPassword`, cookie sync via `authStore.onChange`, `middleware.ts`.

**Avoids:** `localStorage`-based auth (breaks SSR), NextAuth (duplicate auth layer), per-page auth checks (flash of content).

**Research flag:** Standard patterns — well-documented in PocketBase + Next.js community.

### Phase 3: Dashboard Shell

**Rationale:** The shell (navbar, module grid layout, routing to modules) must exist before any module can be navigated to. Building it as an explicit phase ensures the modular architecture is enforced structurally before module code is written.

**Delivers:** `(dashboard)/layout.tsx` with navbar, home page with module card grid, routing to `/finances` and `/claude-stats` (placeholder pages), dark mode with persistent preference.

**Implements:** Route group layout, `ModuleGrid` component, Zustand store for UI preferences.

**Avoids:** God component (Pitfall 8) — the shell phase forces separation of layout from module logic.

**Research flag:** Standard patterns — shadcn/ui + Tailwind v4 layout is well-documented.

### Phase 4: Finance Module

**Rationale:** Finance is the higher-confidence module (no external API gating). Schema must be finalized and verified before any data is entered — field type changes in PocketBase after data exists are permanent and painful.

**Delivers:** PocketBase collections (`accounts`, `transactions`, `categories`) with correct integer-centavo schema and access rules; account creation with ARS/USD designation; transaction entry form; transaction list with filters; balance display per currency.

**Uses:** TanStack Query for PocketBase data, React Hook Form + Zod for transaction form, shadcn Card/Chart components, `Intl.NumberFormat` for display.

**Avoids:** Float monetary storage (Pitfall 4), ARS/USD rate confusion (Pitfall 7), stale data from Next.js fetch caching (Pitfall 2), N+1 PocketBase queries.

**Research flag:** Needs schema design validation before coding — finalize `transactions` collection fields (amount in centavos, currency, exchange_rate_at_entry, category_id, account_id, date, description) before writing any UI.

### Phase 5: Claude Stats Module

**Rationale:** Depends on confirmed Anthropic Admin API access (org account prerequisite). Should not begin until that is verified. The server-side proxy pattern for the Anthropic API must be in place before any client-side chart work.

**Delivers:** Next.js API routes at `/api/anthropic/usage` and `/api/anthropic/costs`; usage chart with daily token breakdown; cost breakdown by model; time series chart with date range selector; 1-hour caching of Anthropic responses.

**Uses:** Anthropic Admin API via server-side proxy, TanStack Query from client to `/api/anthropic/*`, shadcn Chart (Recharts AreaChart/BarChart), error boundary per module.

**Avoids:** Anthropic Admin key in client-side code (Pitfall 3 variant), uncached API calls (Pitfall 10), full-page crash when Anthropic is unavailable.

**Research flag:** NEEDS RESEARCH — confirm Anthropic Admin API access (org account) before this phase is planned in detail. If Admin API is inaccessible, module scope changes substantially. Also verify which Claude Code Analytics API endpoints are available under the org account.

### Phase 6: Polish and Hardening

**Rationale:** After both modules are functional as a daily driver, invest in the UX and reliability layer. This phase addresses the items that make the product feel complete without being blockers to initial use.

**Delivers:** Loading skeletons per module, error boundaries isolating module failures, responsive layout pass, empty state designs for both modules, "looks done but isn't" checklist verification (auth persistence, CORS, float precision, backup restore test, module isolation under API failure).

**Avoids:** Dashboard failure cascade when one module errors, raw centavo integers exposed in UI, missing currency labels.

**Research flag:** Standard patterns — no research needed.

### Phase Ordering Rationale

- **Infrastructure before auth:** PocketBase must be running and secured before login can be tested.
- **Auth before everything else:** All module routes are protected; middleware depends on the cookie auth pattern being established.
- **Shell before modules:** Enforces the feature-folder boundary architecturally before module code is written — prevents the god component pitfall.
- **Finance before Claude Stats:** Finance has no external prerequisites; Claude Stats has a hard prerequisite (Admin API key confirmation) that could block or reshape the module.
- **Schema design is explicit within Phase 4:** PocketBase collection field types are immutable after data exists; schema decisions are called out as a pre-coding step within the Finance phase.
- **Polish last, not deferred indefinitely:** Phase 6 is an explicit verification phase — it forces the "looks done but isn't" checklist to be worked through before the project is considered launched.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 5 (Claude Stats):** BLOCKED on Anthropic Admin API access confirmation. Before planning this phase in detail, Lautaro must verify org account status in the Anthropic Console and confirm that his Claude Code usage is attributed to that org's API key. If confirmed, the API endpoints are well-documented; if not, module scope must be redesigned.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Infrastructure):** PocketBase VPS setup, systemd, Nginx TLS — well-documented operational patterns.
- **Phase 2 (Auth):** PocketBase `authWithPassword` + cookie sync + Next.js middleware — multiple verified community implementations.
- **Phase 3 (Shell):** Next.js App Router layout + shadcn/ui — official documentation is comprehensive.
- **Phase 6 (Polish):** Error boundaries, loading states, responsive layout — established React/Next.js patterns.

Phases needing schema pre-work before coding:
- **Phase 4 (Finance):** Finalize PocketBase collection schema (especially integer centavos for amounts, exchange rate field policy) before writing any component code.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Core stack verified via official docs and npm; version compatibility table verified 2026-03-09; patterns verified via PocketBase maintainer's own guidance |
| Features | HIGH (auth/finance), MEDIUM (Claude Stats) | Finance module features are well-understood. Claude Stats has a hard prerequisite (Admin API org requirement) that is confirmed per official docs but creates a project-specific unknown |
| Architecture | MEDIUM | Core patterns (factory function, cookie sync, API proxy) verified via official and community sources. SSR + PocketBase integration is an evolving area without an official Next.js-specific PocketBase guide |
| Pitfalls | HIGH | Most pitfalls directly documented in official PocketBase discussions or are well-established JavaScript behavior (float precision). The ARS/USD pitfall is domain knowledge specific to the Argentina context |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **Anthropic Admin API access:** Must be confirmed before Phase 5 planning. If Lautaro's Anthropic account is individual (not org), the entire Claude Stats module scope changes. Action: check `console.anthropic.com/settings/organization` and verify that Claude Code sessions are attributed to the org's API key, not a personal subscription.

- **PocketBase collection schema validation:** The `transactions` collection schema (particularly the integer centavo representation and the exchange rate field) should be designed on paper and reviewed before Phase 4 begins. Schema changes after data is stored are painful.

- **VPS details:** PocketBase VPS hosting, domain, and TLS setup specifics are not covered in the research. The architecture assumes these exist; Phase 1 will need to address them concretely (VPS provider, domain/subdomain for PocketBase, Nginx TLS configuration).

- **Vercel preview deployment CORS:** The CORS configuration recommends an explicit origin allowlist. Vercel preview deployment URLs are dynamic (not predictable). For development workflows, consider routing all PocketBase requests through Next.js API routes as a same-origin proxy, which sidesteps CORS entirely.

## Sources

### Primary (HIGH confidence)
- Next.js 15.5 official blog — https://nextjs.org/blog/next-15-5
- Next.js 16 stable release — https://nextjs.org/blog/next-16
- PocketBase JS SDK GitHub releases — https://github.com/pocketbase/js-sdk/releases
- PocketBase maintainer SSR guidance — https://github.com/pocketbase/pocketbase/discussions/4973
- PocketBase Going to Production — https://pocketbase.io/docs/going-to-production/
- PocketBase API Rules — https://pocketbase.io/docs/api-rules-and-filters/
- shadcn/ui Tailwind v4 migration — https://ui.shadcn.com/docs/tailwind-v4
- shadcn/ui Chart component — https://ui.shadcn.com/docs/components/radix/chart
- React Hook Form + shadcn/ui — https://ui.shadcn.com/docs/forms/react-hook-form
- Resend + Next.js — https://resend.com/docs/send-with-nextjs
- Anthropic Usage and Cost API — https://platform.claude.com/docs/en/api/usage-cost-api
- Anthropic Claude Code Analytics API — https://platform.claude.com/docs/en/api/claude-code-analytics-api
- Anthropic Admin API org requirement — https://platform.claude.com/docs (confirmed org-only 2026-03-09)

### Secondary (MEDIUM confidence)
- PocketBase Next.js 15 auth discussion — https://github.com/pocketbase/pocketbase/discussions/6930
- PocketBase Next.js App Router SSR — https://github.com/pocketbase/pocketbase/discussions/4065
- PocketBase best practices for Next.js — https://github.com/pocketbase/pocketbase/discussions/5359
- PocketBase CORS configuration — https://github.com/pocketbase/pocketbase/discussions/6266
- DEV Community — NextJS App Router with PocketBase SSR — https://dev.to/tsensei/nextjs-app-router-with-pocketbase-ssr-setup-1m9k
- TanStack Query + Zustand 2025 consensus — https://www.bugragulculer.com/blog/good-bye-redux-how-react-query-and-zustand-re-wired-state-management-in-25
- Financial precision in JavaScript — https://dev.to/benjamin_renoux/financial-precision-in-javascript-handle-money-without-losing-a-cent-1chc
- Recharts npm trends vs Tremor — https://npmtrends.com/@tremor/react-vs-chart.js-vs-d3-vs-echarts-vs-plotly.js-vs-recharts

### Tertiary (LOW confidence)
- Life OS dashboard design patterns — https://grokipedia.com/page/Personal_Life_OS_Dashboard (pattern identification only)
- Dashboard UI/UX principles 2025 — https://medium.com/@allclonescript/20-best-dashboard-ui-ux-design-principles-you-need-in-2025-30b661f2f795 (pattern identification only)

---
*Research completed: 2026-03-09*
*Ready for roadmap: yes — with one prerequisite: confirm Anthropic Admin API org account access before Phase 5 is planned*
