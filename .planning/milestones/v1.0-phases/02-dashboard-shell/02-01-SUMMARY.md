---
phase: 02-dashboard-shell
plan: 01
subsystem: ui
tags: [next.js, pocketbase, tailwindcss, base-ui, lucide-react, playwright]

# Dependency graph
requires:
  - phase: 01-foundation-auth
    provides: createServerClient, logoutAction, pb_auth cookie, (protected) route group
provides:
  - Sticky top navbar with user name, avatar dropdown, and logout
  - Mobile bottom navigation bar (md:hidden, fixed bottom)
  - Protected layout wrapping all (protected) pages with auth guard
  - MODULES array as single source of truth for nav and card grid
  - Module card grid on /dashboard with Finanzas card linking to /finance
  - /finance placeholder route
  - Playwright E2E test stubs for SHLL-01 through SHLL-05
affects:
  - 02-02-theme-and-settings
  - 02-03-avatar-and-accent

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Protected layout with server-side auth guard using createServerClient
    - MODULES array as single source of truth (nav links + card grid share the same data)
    - Server Component layout + Client Component nav links pattern (NavLinks reads usePathname)
    - base-ui/react Menu for accessible dropdown menus

key-files:
  created:
    - lauos/src/lib/modules.ts
    - lauos/src/components/layout/navbar.tsx
    - lauos/src/components/layout/nav-links.tsx
    - lauos/src/components/layout/user-menu.tsx
    - lauos/src/components/layout/theme-toggle.tsx
    - lauos/src/components/layout/bottom-nav.tsx
    - lauos/src/components/dashboard/module-card.tsx
    - lauos/src/components/dashboard/module-grid.tsx
    - lauos/src/app/(protected)/layout.tsx
    - lauos/src/app/(protected)/dashboard/page.tsx
    - lauos/src/app/(protected)/finance/page.tsx
    - lauos/tests/shell.spec.ts
  modified:
    - lauos/playwright.config.ts
    - lauos/src/app/(protected)/settings/page.tsx

key-decisions:
  - "ThemeToggle is a stub — wired to no-op until Plan 02-02 creates the Zustand theme store"
  - "NavLinks extracted as a separate 'use client' component so Navbar stays a Server Component (usePathname not available in RSC)"
  - "Fixed nested <main> in settings page (Rule 1 auto-fix) — layout already provides <main> wrapper"
  - "navbar-username data-testid placed on the <span> inside UserMenu trigger for Playwright selector"

patterns-established:
  - "MODULES array pattern: add a Module object to src/lib/modules.ts to auto-populate both navbar nav links and the dashboard card grid"
  - "Protected layout auth guard: createServerClient in layout.tsx, redirect to /login if !pb.authStore.isValid"

requirements-completed:
  - SHLL-01
  - SHLL-02
  - SHLL-04

# Metrics
duration: 12min
completed: 2026-03-10
---

# Phase 2 Plan 01: Dashboard Shell Summary

**Sticky navbar with PocketBase user fetch, mobile bottom nav, MODULES-driven card grid, and Playwright test stubs for the full dashboard phase**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-03-10T20:51:53Z
- **Completed:** 2026-03-10T21:03:00Z
- **Tasks:** 3 (W0, 1, 2) + checkpoint pending human verification
- **Files modified:** 14

## Accomplishments
- Protected layout with sticky navbar, server-side user fetch (name + avatar URL), and auth redirect
- Mobile-responsive layout: module links in top navbar on desktop, fixed bottom nav on mobile (md:hidden)
- Module card grid using MODULES array as single source of truth — adding a new module to modules.ts automatically populates both nav and grid
- Playwright test stubs for all 5 shell requirements (SHLL-01 to SHLL-05) and playwright config updated to port 3005

## Task Commits

Each task was committed atomically:

1. **Task W0: Test scaffold and infrastructure setup** - `da7ead2` (chore)
2. **Task 1: Protected layout with navbar, user menu, and bottom navigation** - `b035a10` (feat)
3. **Task 2: Module card grid home page and placeholder routes** - `9f66ec8` (feat)

## Files Created/Modified
- `lauos/src/lib/modules.ts` - MODULES array (Module type + Finanzas entry)
- `lauos/src/app/(protected)/layout.tsx` - Async server component, fetches PocketBase user, renders Navbar + BottomNav
- `lauos/src/components/layout/navbar.tsx` - Server component sticky header with logo, NavLinks, ThemeToggle, UserMenu
- `lauos/src/components/layout/nav-links.tsx` - Client component, usePathname active state, hidden on mobile
- `lauos/src/components/layout/user-menu.tsx` - Client component, @base-ui/react Menu dropdown, logout action
- `lauos/src/components/layout/theme-toggle.tsx` - Stub button, wired in 02-02
- `lauos/src/components/layout/bottom-nav.tsx` - Client component, fixed bottom, md:hidden, safe-area inset
- `lauos/src/components/dashboard/module-card.tsx` - Client component, Link wrapper, hover scale, data-testid
- `lauos/src/components/dashboard/module-grid.tsx` - Server component, 2/3/4-col responsive grid
- `lauos/src/app/(protected)/dashboard/page.tsx` - Renders ModuleGrid with Inicio heading
- `lauos/src/app/(protected)/finance/page.tsx` - Placeholder page
- `lauos/tests/shell.spec.ts` - 5 Playwright test describe blocks
- `lauos/playwright.config.ts` - Updated to port 3005
- `lauos/src/app/(protected)/settings/page.tsx` - Removed nested main tag

## Decisions Made
- ThemeToggle stub pattern: renders Sun icon with no-op click — will be wired to Zustand store in Plan 02-02
- NavLinks as separate client sub-component: Navbar stays a Server Component (RSC can't call usePathname), NavLinks handles active state client-side
- navbar-username placed on span inside UserMenu trigger rather than a separate element — visible on sm+ screens

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed nested `<main>` in settings/page.tsx**
- **Found during:** Task 1 (protected layout creation)
- **Issue:** settings/page.tsx wrapped content in `<main>`, but the new (protected)/layout.tsx also renders a `<main>` wrapper — nested `<main>` is invalid HTML
- **Fix:** Replaced `<main>` with `<div>` in settings page; layout's `<main>` handles the semantic role
- **Files modified:** lauos/src/app/(protected)/settings/page.tsx
- **Verification:** Build passes, no HTML validation errors
- **Committed in:** b035a10 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - invalid HTML nested main)
**Impact on plan:** Necessary correctness fix. No scope creep.

## Issues Encountered
None beyond the nested main auto-fix.

## User Setup Required

**External services require manual configuration before Phase 2 checkpoint:**
- Open PocketBase Admin UI → Collections → users → Fields
- Add field: `accent` (Plain text, required=no)
- Add field: `avatar` (File, max files=1, allowed MIME=image/*, required=no)
- Save the collection

This is needed for Plan 02-02 (theme store) and 02-03 (avatar upload). The current plan (02-01) does not write to these fields.

## Self-Check: PASSED

All files and commits verified:
- All 14 files created/modified exist on disk
- Commits da7ead2, b035a10, 9f66ec8 all present in git log
- Build passes clean (all routes: /, /_not-found, /dashboard, /finance, /login, /settings)

## Next Phase Readiness
- Protected layout shell complete — all future module pages automatically inherit navbar + bottom nav
- MODULES array ready to accept new module entries
- ThemeToggle stub ready to be wired in 02-02
- Playwright test stubs ready — tests will remain red until 02-02 (dark mode) and 02-03 (accent color) are complete
- /finance placeholder route ready for Phase 3 Finance module
- Awaiting human verification checkpoint before proceeding to 02-02

---
*Phase: 02-dashboard-shell*
*Completed: 2026-03-10*
