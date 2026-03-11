---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
stopped_at: Completed 03-04-PLAN.md (Categories UI — Server Actions, CategoryBadge, CategoryForm, /finance/categories page)
last_updated: "2026-03-11T12:35:38.128Z"
last_activity: 2026-03-10 — Plan 02-01 complete (protected shell — navbar, bottom nav, module grid)
progress:
  total_phases: 4
  completed_phases: 3
  total_plans: 10
  completed_plans: 10
  percent: 14
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-09)

**Core value:** El usuario puede ver y gestionar los aspectos clave de su día a día desde un único lugar, sin depender de apps de terceros.
**Current focus:** Phase 2 — Dashboard Shell

## Current Position

Phase: 2 of 4 (Dashboard Shell)
Plan: 2 of 3 in current phase (02-01 complete — checkpoint approved, ready for 02-02)
Status: In progress
Last activity: 2026-03-10 — Plan 02-01 complete (protected shell — navbar, bottom nav, module grid)

Progress: [██░░░░░░░░] 14%

## Performance Metrics

**Velocity:**
- Total plans completed: 0
- Average duration: —
- Total execution time: —

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**
- Last 5 plans: —
- Trend: —

*Updated after each plan completion*
| Phase 01-foundation-auth P02 | 8 | 2 tasks | 29 files |
| Phase 01-foundation-auth P03 | 35 | 3 tasks | 9 files |
| Phase 02-dashboard-shell P02 | 15 | 2 tasks | 5 files |
| Phase 02-dashboard-shell P03 | 4 | 2 tasks | 5 files |
| Phase 03-finance-data P01 | 162 | 3 tasks | 6 files |
| Phase 03-finance-data P02 | 211 | 2 tasks | 8 files |
| Phase 03-finance-data P03 | 305 | 2 tasks | 6 files |
| Phase 03-finance-data P04 | 545 | 2 tasks | 5 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: PocketBase runs as a single binary on the VPS under systemd, never as a shared singleton — factory function pattern required from day one
- [Roadmap]: All monetary amounts stored as integer centavos (×100) in PocketBase — never floats; schema is immutable after data exists
- [Roadmap]: Exchange rates for USD transactions stored immutably at transaction time — no auto-recalculation with current rates
- [Roadmap]: Claude Stats module moved to v2 — Anthropic Admin API requires org account confirmation before scoping; Finance is the safer first module
- [Phase 01-foundation-auth]: Next.js 16 (latest) used; create-next-app@latest installs 16, Node 20 required and used via nvm
- [Phase 01-foundation-auth]: Two-client PocketBase pattern established: createBrowserClient (singleton + onChange cookie sync) and createServerClient (per-request, reads pb_auth, server-only guard)
- [01-01]: CORS configured for http://localhost:3005 (not 3000 — port 3000 taken by another project on VPS); Next.js dev server must run on port 3005
- [01-01]: PocketBase token duration set to 365 days (31536000s) — single-user "always logged in" UX, no auto-expiry
- [01-01]: PocketBase v0.36.6 pinned on VPS and Mac — do not upgrade without reviewing breaking changes
- [Phase 01-foundation-auth]: Both toast AND inline error on failed login — locked user decision; middleware uses authRefresh() for silent token renewal without maxAge
- [Phase 01-foundation-auth]: Store exportToCookie() JSON payload (not raw JWT) in pb_auth cookie — loadFromCookie requires full PocketBase model+token JSON to reconstruct isValid auth state
- [Phase 01-foundation-auth]: Inter font replaces Geist/Geist_Mono defaults in layout.tsx for lauOS typography
- [02-01]: MODULES array in src/lib/modules.ts is single source of truth for nav links and card grid — add a Module object to populate both
- [02-01]: NavLinks extracted as separate 'use client' sub-component so Navbar stays a Server Component (usePathname not available in RSC)
- [02-01]: ThemeToggle is a stub (renders Sun icon, no-op) — will be wired to Zustand theme store in Plan 02-02
- [02-01]: PocketBase users collection requires accent (Text) and avatar (File) fields — must be added manually before Plans 02-02/02-03
- [Phase 02-dashboard-shell]: Zustand persist partialize: only isDark persisted to localStorage — accent always sourced from PocketBase
- [Phase 02-dashboard-shell]: Flash-prevention inline script in <head> reads lauos-theme.state.isDark before React hydrates
- [Phase 02-dashboard-shell]: AccentColor locked to yellow|blue|green|purple|red|orange, default yellow
- [Phase 02-dashboard-shell]: base-ui import pattern: import { Tabs } from '@base-ui/react' not sub-path imports — consistent with user-menu.tsx Menu pattern
- [Phase 02-dashboard-shell]: Avatar upload: canvas crops to 256x256 JPEG before FormData upload; setAccent() called optimistically before awaiting PocketBase action
- [Phase 03-finance-data]: test.todo not in Playwright 1.58 — test.skip used as stub pattern for finance.spec.ts
- [Phase 03-finance-data]: pocketbase/ directory at repo root, separate from lauos/ Next.js app
- [Phase 03-finance-data]: AccountsWithBalancesResult discriminated union — 'error' in result guard for TypeScript narrowing in accounts page
- [Phase 03-finance-data]: AccountsClient extracted as sibling client-island file — keeps accounts page.tsx as pure RSC
- [Phase 03-finance-data]: dolarapi.com fetch isolated to fetchDolarRatesAction Server Action — never called from browser; ExchangeRatePicker calls it on mount via useEffect (valid for non-mutating actions in Next.js 15)
- [Phase 03-finance-data]: Two-leg transfer pattern: create transfer_out → create transfer_in (with out.id) → update out (with in.id); track outRecordId as string primitive (not object | null) to avoid TS18047 null narrowing in catch block
- [Phase 03-finance-data]: CategoryBadge uses inline hex alpha style (color + '22'/'44') — Tailwind v4 cannot scan dynamic class values at build time
- [Phase 03-finance-data]: CategoriesClient extracted as sibling client island — consistent with AccountsClient pattern from 03-02

### Pending Todos

None yet.

### Blockers/Concerns

- [RESOLVED 01-01]: VPS provider, domain/subdomain for PocketBase, and Nginx TLS specifics — resolved; infrastructure complete
- [Future]: Anthropic Admin API requires org account (not individual). Must confirm `console.anthropic.com/settings/organization` before Claude Stats module can be scoped for v2

## Session Continuity

Last session: 2026-03-11T01:59:48.903Z
Stopped at: Completed 03-04-PLAN.md (Categories UI — Server Actions, CategoryBadge, CategoryForm, /finance/categories page)
Resume file: None
