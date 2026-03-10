---
phase: 01-foundation-auth
plan: 03
subsystem: auth
tags: [nextjs, pocketbase, middleware, server-actions, tailwind, shadcn, playwright, typescript, sonner]

# Dependency graph
requires: [01-02]
provides:
  - middleware.ts: route protection + silent PocketBase token refresh on every request
  - loginAction and logoutAction server actions (auth.ts)
  - updateDisplayNameAction and updatePasswordAction server actions (profile.ts)
  - LoginForm: split-screen login page with toast + inline error on failed login
  - SettingsForm: display name change + password change + logout
  - Protected routes: /dashboard, /settings
  - Auth route: /login
affects: [all future phases — auth system is the foundation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Server Actions (auth.ts, profile.ts) with 'use server' directive — loginAction uses useActionState pattern"
    - "Middleware token refresh: authRefresh() on every request, cookie updated via response.headers.append"
    - "Route groups: (auth)/ for public routes, (protected)/ for guarded routes"
    - "Both sonner toast AND inline error on failed login — explicit user decision"

key-files:
  created:
    - "lauos/middleware.ts"
    - "lauos/src/lib/actions/auth.ts"
    - "lauos/src/lib/actions/profile.ts"
    - "lauos/src/app/(auth)/login/page.tsx"
    - "lauos/src/app/(protected)/dashboard/page.tsx"
    - "lauos/src/app/(protected)/settings/page.tsx"
    - "lauos/src/components/login-form.tsx"
    - "lauos/src/components/settings-form.tsx"
  modified: []

key-decisions:
  - "Both toast AND inline error on failed login — locked user decision from planning"
  - "Middleware uses authRefresh() for silent token renewal — no maxAge on cookie, session lives indefinitely with daily use"
  - "Route groups (auth)/ and (protected)/ for clean Next.js App Router organization"
  - "Stub components created in Task 1 commit, replaced in Task 2 — build verified at each step"

# Metrics
duration: ~3min (Tasks 1+2; awaiting human verification at checkpoint Task 3)
completed: 2026-03-10
---

# Phase 1 Plan 03: Auth Implementation Summary

**Cookie-based PocketBase auth with middleware route protection, server actions, split-screen login UI, and settings page — awaiting human end-to-end verification**

## Status

Tasks 1 and 2 complete. Paused at Task 3 (checkpoint:human-verify) awaiting manual end-to-end verification.

## Performance

- **Duration:** ~3 min (Tasks 1+2)
- **Started:** 2026-03-10T13:56:38Z
- **Checkpoint reached:** 2026-03-10T13:58:59Z
- **Tasks:** 2 of 3 complete (Task 3 is manual verification checkpoint)
- **Files created:** 8

## Task Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Middleware, Server Actions, and route structure | 4834c68 | middleware.ts, auth.ts, profile.ts, 3x page.tsx stubs |
| 2 | Login page UI and Settings page UI | fe7e74d | login-form.tsx, settings-form.tsx, login/page.tsx (updated) |

## Accomplishments

- `lauos/middleware.ts` at project root with `authRefresh()`, route protection, and correct matcher excluding `_next/*`, `favicon.ico`
- `loginAction` and `logoutAction` server actions — `loginAction` uses `useActionState` pattern with `FormData`
- `updateDisplayNameAction` and `updatePasswordAction` server actions
- LoginForm: full-screen split layout (left: abstract radial gradient + "lauOS" branding, right: form)
- LoginForm: both sonner toast AND inline `role="alert"` error on failed login (per locked user decision)
- SettingsForm: display name section, password change section, logout button
- `/dashboard` protected stub page, `/settings` reads user from `createServerClient()` and passes to SettingsForm
- `npm run build` exits 0 with zero TypeScript errors (verified after both tasks)
- Playwright lists 7 tests in 3 files without errors

## Build Verification

```
✓ Compiled successfully in 1447.2ms
Route (app)
├ ○ /dashboard
├ ○ /login
└ ƒ /settings
ƒ Proxy (Middleware)
```

## Playwright Test List (7 stubs)

```
[chromium] › auth.spec.ts: login with valid credentials redirects to /dashboard
[chromium] › auth.spec.ts: login with invalid credentials shows inline error and toast
[chromium] › auth.spec.ts: logout from dashboard redirects to /login
[chromium] › session.spec.ts: refreshing /dashboard keeps session active
[chromium] › session.spec.ts: opening new context on /dashboard keeps session (cookie persists)
[chromium] › settings.spec.ts: display name update persists on settings page
[chromium] › settings.spec.ts: password change works and re-login succeeds
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Stub components required for Task 1 build**
- **Found during:** Task 1 (build verification)
- **Issue:** `(auth)/login/page.tsx` imports `LoginForm` and `(protected)/settings/page.tsx` imports `SettingsForm`, but these components were not created until Task 2. Build would fail without them.
- **Fix:** Created minimal stub versions of `login-form.tsx` and `settings-form.tsx` in Task 1 commit; replaced with real implementations in Task 2 commit.
- **Files modified:** `lauos/src/components/login-form.tsx`, `lauos/src/components/settings-form.tsx`
- **Commit:** 4834c68 (stubs in Task 1), fe7e74d (real implementations in Task 2)

## Awaiting: Human Verification (Task 3)

Manual verification checklist (requires local PocketBase running at http://127.0.0.1:8090):

1. Visit http://localhost:3005 — should redirect to /login
2. Visit http://localhost:3005/dashboard — should redirect to /login (unauthenticated)
3. On /login page: verify split-screen layout (left decorative panel visible on wide screen)
4. Submit wrong credentials — verify BOTH a toast notification appears AND an inline error below the form
5. Submit correct credentials — verify redirect to /dashboard
6. On /dashboard: refresh the page — verify session persists (no redirect to /login)
7. Visit http://localhost:3005/login while authenticated — verify redirect to /dashboard
8. Navigate to http://localhost:3005/settings
9. Update display name — verify success feedback, reload page, verify name persists
10. Click Logout — verify redirect to /login

**Note:** Dev server runs on port 3005 (not 3000 — port 3000 is taken on VPS).

Start commands:
```bash
~/pb/pocketbase serve
```
```bash
cd /Users/laucaballero/Desktop/Lautaro/AndesCode/lauOS/lauos
PATH="/Users/laucaballero/.nvm/versions/node/v20.19.6/bin:$PATH" npm run dev -- -p 3005
```

**Resume signal:** Type "auth-verified" if all 10 manual checks pass.

## Self-Check: PASSED

- FOUND: lauos/middleware.ts
- FOUND: lauos/src/lib/actions/auth.ts
- FOUND: lauos/src/lib/actions/profile.ts
- FOUND: lauos/src/app/(auth)/login/page.tsx
- FOUND: lauos/src/app/(protected)/dashboard/page.tsx
- FOUND: lauos/src/app/(protected)/settings/page.tsx
- FOUND: lauos/src/components/login-form.tsx
- FOUND: lauos/src/components/settings-form.tsx
- FOUND commit: 4834c68 (Task 1)
- FOUND commit: fe7e74d (Task 2)

---
*Phase: 01-foundation-auth*
*Plan: 03*
*Status: Awaiting checkpoint:human-verify (Task 3)*
*Date: 2026-03-10*
