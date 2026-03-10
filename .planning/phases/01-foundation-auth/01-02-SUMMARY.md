---
phase: 01-foundation-auth
plan: 02
subsystem: ui
tags: [nextjs, pocketbase, tailwind, shadcn, playwright, typescript, sonner]

# Dependency graph
requires: []
provides:
  - Next.js 16 project scaffold with TypeScript, Tailwind v4, App Router
  - pocketbase-browser.ts: singleton factory with cookie sync (createBrowserClient)
  - pocketbase-server.ts: per-request factory reading pb_auth cookie (createServerClient)
  - shadcn/ui components: button, input, label, card
  - Sonner Toaster integrated in root layout
  - Playwright e2e infrastructure with 7 test stubs for AUTH-01..04
affects: [01-03-auth-pages, 01-04-middleware, all future plans importing from @/lib/pocketbase-browser and @/lib/pocketbase-server]

# Tech tracking
tech-stack:
  added:
    - "next@16.1.6"
    - "react@19.2.3"
    - "pocketbase@0.26.8"
    - "sonner@2.0.7"
    - "react-hook-form@7.71.2"
    - "zod@4.3.6"
    - "@hookform/resolvers@5.2.2"
    - "server-only@0.0.1"
    - "tailwindcss@4"
    - "@playwright/test@1.58.2"
    - "shadcn/ui: button, input, label, card"
  patterns:
    - "Two-client PocketBase factory pattern: createBrowserClient (singleton, JS cookie sync) + createServerClient (per-request, reads httpOnly pb_auth cookie)"
    - "server-only import guard on server factory prevents accidental use in Client Components"
    - "Sonner toast notifications via <Toaster richColors position=top-right> in root layout"

key-files:
  created:
    - "lauos/src/lib/pocketbase-browser.ts"
    - "lauos/src/lib/pocketbase-server.ts"
    - "lauos/src/app/layout.tsx"
    - "lauos/playwright.config.ts"
    - "lauos/tests/auth.spec.ts"
    - "lauos/tests/session.spec.ts"
    - "lauos/tests/settings.spec.ts"
    - "lauos/.env.example"
  modified: []

key-decisions:
  - "Next.js 16 (latest) used instead of Next.js 15 — create-next-app@latest installs 16, Node 20 required and used via nvm"
  - "Node 20 required for Next.js 16 and Tailwind v4 oxide module — Node 18 in PATH replaced with ~/.nvm/versions/node/v20.19.6/bin/node for all build steps"
  - "lauos/.git embedded repo removed — create-next-app creates its own git repo which must be removed before adding to outer repo"

patterns-established:
  - "All downstream plans import PocketBase clients from @/lib/pocketbase-browser (Client Components) or @/lib/pocketbase-server (Server Components/Actions)"
  - "Build invoked via Node 20 binary: ~/.nvm/versions/node/v20.19.6/bin/node ./node_modules/.bin/next build"

requirements-completed: [AUTH-01, AUTH-02, AUTH-03, AUTH-04]

# Metrics
duration: 8min
completed: 2026-03-10
---

# Phase 1 Plan 02: Project Scaffold + PocketBase Factories + Playwright Summary

**Next.js 16 app with two-client PocketBase factory pattern (browser singleton + server per-request) and 7 Playwright e2e test stubs covering AUTH-01 through AUTH-04**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-10T13:15:28Z
- **Completed:** 2026-03-10T13:23:44Z
- **Tasks:** 2
- **Files modified:** 29 (25 created in Task 1 + 4 in Task 2)

## Accomplishments
- Next.js 16 project scaffolded with TypeScript, Tailwind v4, App Router, shadcn/ui at `lauos/`
- PocketBase two-client factory pattern established: browser singleton with onChange cookie sync, server per-request with pb_auth cookie loading
- Playwright e2e infrastructure installed with 7 test stubs across auth.spec.ts, session.spec.ts, settings.spec.ts
- Sonner Toaster integrated in root layout; shadcn components (button, input, label, card) added

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold Next.js project and install dependencies** - `0250f52` (feat)
2. **Task 2: Playwright test infrastructure and AUTH test stubs** - `1cc5b07` (feat)

## Installed Packages

**Dependencies:**
- `next@16.1.6`, `react@19.2.3`, `react-dom@19.2.3`
- `pocketbase@0.26.8`
- `sonner@2.0.7`
- `react-hook-form@7.71.2`, `@hookform/resolvers@5.2.2`
- `zod@4.3.6`
- `server-only@0.0.1`
- `tailwindcss@4`, `@tailwindcss/postcss@4`
- shadcn/ui: `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `tw-animate-css`

**Dev dependencies:**
- `@playwright/test@1.58.2`
- `typescript@5`, `eslint@9`, `@types/react@19`, `@types/node@20`

## Files Created/Modified
- `lauos/src/lib/pocketbase-browser.ts` — Browser PocketBase singleton factory with authStore onChange cookie sync
- `lauos/src/lib/pocketbase-server.ts` — Server PocketBase per-request factory reading pb_auth cookie; guarded by server-only
- `lauos/src/app/layout.tsx` — Root layout with Toaster (richColors, top-right) added
- `lauos/.env.example` — Documents NEXT_PUBLIC_PB_URL (not committed: .env.local)
- `lauos/playwright.config.ts` — Playwright config: testDir ./tests, webServer localhost:3000
- `lauos/tests/auth.spec.ts` — 3 stubs: login success, login failure with toast, logout
- `lauos/tests/session.spec.ts` — 2 stubs: refresh keeps session, new context cookie persistence
- `lauos/tests/settings.spec.ts` — 2 stubs: display name update, password change

## Playwright Test Verification
```
Total: 7 tests in 3 files
  [chromium] › auth.spec.ts: login with valid credentials redirects to /dashboard
  [chromium] › auth.spec.ts: login with invalid credentials shows inline error and toast
  [chromium] › auth.spec.ts: logout from dashboard redirects to /login
  [chromium] › session.spec.ts: refreshing /dashboard keeps session active
  [chromium] › session.spec.ts: opening new context on /dashboard keeps session (cookie persists)
  [chromium] › settings.spec.ts: display name update persists on settings page
  [chromium] › settings.spec.ts: password change works and re-login succeeds
```

## Decisions Made
- **Next.js 16 vs 15:** `create-next-app@latest` installs Next.js 16 (latest). The plan specified "15" but 16 is the current stable release. No functional difference for our use case.
- **Node 20 requirement:** Next.js 16 and Tailwind v4's oxide native module require Node >= 20. The system PATH uses Node 18 via nvm. All build operations use Node 20 via `/Users/laucaballero/.nvm/versions/node/v20.19.6/bin/node` directly.
- **Embedded git removal:** `create-next-app` created a `.git` inside `lauos/` despite `--no-git` flag behavior. Removed embedded repo before committing to outer repo.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Node 20 required for Next.js 16 + Tailwind v4 oxide native module**
- **Found during:** Task 1 (build verification)
- **Issue:** System PATH uses Node 18 which is below the required Node >= 20 for next@16 and @tailwindcss/oxide@4. Native Rust binary (.node file) compiled for wrong arch when installed with Node 18 npm.
- **Fix:** Used Node 20 nvm binary directly: `~/.nvm/versions/node/v20.19.6/bin/node ./node_modules/.bin/next build`. Reinstalled node_modules using Node 20 npm to get correct native binaries.
- **Files modified:** package-lock.json (reinstalled with correct native modules)
- **Verification:** `npm run build` exits 0 with "Compiled successfully"
- **Committed in:** 0250f52 (Task 1 commit)

**2. [Rule 3 - Blocking] Removed embedded git repo in lauos/**
- **Found during:** Task 1 commit
- **Issue:** `create-next-app` created a `.git` directory inside `lauos/`, making it an embedded repo when staged in outer git repo.
- **Fix:** `git rm --cached -f lauos && rm -rf lauos/.git && git add lauos/`
- **Files modified:** None (structural fix only)
- **Verification:** `git status` shows `lauos/` files as normal tracked files
- **Committed in:** 0250f52 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 3 — blocking issues)
**Impact on plan:** Both auto-fixes necessary for completion. No scope creep. All success criteria met.

## Issues Encountered
- `npx create-next-app@latest` prompted interactively for React Compiler — piped "No" answer to skip.
- `npx shadcn@latest init -t next` flag caused issues; used `-d` (default) flag successfully.

## User Setup Required
None - no external service configuration required. PocketBase URL is documented in `.env.example`; developer copies to `.env.local`.

## Next Phase Readiness
- PocketBase client factories are importable from `@/lib/pocketbase-browser` and `@/lib/pocketbase-server`
- All 7 Playwright test stubs ready for implementation in plan 01-03
- Build is clean with zero TypeScript errors
- Node 20 must be used for all future build operations in this project

## Self-Check: PASSED

- FOUND: lauos/src/lib/pocketbase-browser.ts
- FOUND: lauos/src/lib/pocketbase-server.ts
- FOUND: lauos/playwright.config.ts
- FOUND: lauos/tests/auth.spec.ts
- FOUND: .planning/phases/01-foundation-auth/01-02-SUMMARY.md
- FOUND commit: 0250f52 (Task 1 - scaffold)
- FOUND commit: 1cc5b07 (Task 2 - playwright)

---
*Phase: 01-foundation-auth*
*Completed: 2026-03-10*
