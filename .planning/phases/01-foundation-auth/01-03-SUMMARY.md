---
phase: 01-foundation-auth
plan: 03
subsystem: auth
tags: [nextjs, pocketbase, middleware, server-actions, tailwind, shadcn, playwright, typescript, sonner, inter-font]

# Dependency graph
requires:
  - phase: 01-foundation-auth plan 02
    provides: PocketBase browser/server clients, Next.js app scaffold, shadcn/ui components

provides:
  - middleware.ts: route protection + silent PocketBase token refresh on every request
  - loginAction and logoutAction server actions (auth.ts)
  - updateDisplayNameAction and updatePasswordAction server actions (profile.ts)
  - LoginForm: split-screen login page with toast + inline error on failed login
  - SettingsForm: display name change + password change + logout
  - Protected routes: /dashboard, /settings
  - Auth route: /login
  - Inter font applied as app-wide typography

affects: [all future phases — auth system is the foundation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "PocketBase cookie serialization: store exportToCookie() JSON payload (URL-encoded) not raw JWT token"
    - "Middleware loadFromCookie('pb_auth=<encoded-value>') reconstructs full auth state with model+token"
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
  modified:
    - "lauos/src/app/layout.tsx"

key-decisions:
  - "Store exportToCookie() JSON payload (not raw JWT) in pb_auth cookie — loadFromCookie requires full PocketBase model+token JSON to reconstruct isValid auth state"
  - "Inter font replaces Geist/Geist_Mono defaults in layout.tsx for lauOS typography"
  - "Both toast AND inline error on failed login — locked user decision from planning"
  - "Middleware uses authRefresh() for silent token renewal — no maxAge on cookie, session lives indefinitely with daily use"
  - "Route groups (auth)/ and (protected)/ for clean Next.js App Router organization"

patterns-established:
  - "PocketBase cookie auth: loginAction calls exportToCookie(), strips 'pb_auth=' prefix to store URL-encoded JSON; middleware calls loadFromCookie('pb_auth=' + value) to reconstruct isValid state"
  - "Route groups: (auth)/ for public routes, (protected)/ for authenticated routes — middleware enforces boundary"
  - "Server Actions in src/lib/actions/ — auth.ts and profile.ts — imported by client components"

requirements-completed: [AUTH-01, AUTH-02, AUTH-03, AUTH-04]

# Metrics
duration: ~35min (Tasks 1+2+3 including bug fixes)
completed: 2026-03-10
---

# Phase 1 Plan 03: Auth Implementation Summary

**Cookie-based PocketBase auth with exportToCookie JSON serialization, Next.js middleware route protection, split-screen login UI with Inter font, and /settings profile management — all 10 manual verification checks pass**

## Performance

- **Duration:** ~35 min (Tasks 1+2 implementation + Task 3 verification + bug fixes)
- **Started:** 2026-03-10T13:56:38Z
- **Completed:** 2026-03-10T14:30:00Z
- **Tasks:** 3 of 3 complete
- **Files created/modified:** 9

## Accomplishments

- Complete cookie-based auth with correct PocketBase JSON serialization — middleware reconstructs full auth state (token + model) from cookie on every request
- Route protection working: unauthenticated visits to / and /dashboard redirect to /login; authenticated visits to /login redirect to /dashboard
- Split-screen login UI with Inter font, toast + inline error on failed credentials, and smooth form state via useActionState
- /settings page with display name update, password change, and logout
- Build passes cleanly (TypeScript zero errors, Next.js 16.1.6)
- All 10 manual verification checks pass

## Task Commits

1. **Task 1: Middleware, Server Actions, and route structure** - `4834c68` (feat)
2. **Task 2: Login page UI and Settings page UI** - `fe7e74d` (feat)
3. **Task 3: Bug fixes (cookie serialization + Inter font)** - `45427b6` (fix)

## Manual Verification Results

All 10 checks completed successfully after bug fixes:

| # | Check | Status |
|---|-------|--------|
| 1 | Visit / — redirects to /login | Pass (fixed) |
| 2 | Visit /dashboard unauthenticated — redirects to /login | Pass (fixed) |
| 3 | /login shows split-screen layout (left decorative, right form) | Pass |
| 4 | Wrong credentials: toast + inline error both appear | Pass |
| 5 | Correct credentials: redirect to /dashboard | Pass |
| 6 | Refresh /dashboard: session persists | Pass |
| 7 | Authenticated visit to /login: redirect to /dashboard | Pass |
| 8 | Navigate to /settings | Pass |
| 9 | Update display name: success feedback + persists on reload | Pass |
| 10 | Logout: redirect to /login | Pass |

**Note for user:** PocketBase test user must be created manually via admin UI at http://127.0.0.1:8090/_/ (Collections -> users -> New record). This is a one-time setup step, not a code issue.

## Build Verification

```
✓ Compiled successfully in 1355.1ms

Route (app)
├ ○ /
├ ○ /_not-found
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

## Files Created/Modified

- `lauos/middleware.ts` - Route protection + silent authRefresh on every request; matcher covers all non-static routes
- `lauos/src/lib/actions/auth.ts` - loginAction (stores exportToCookie JSON payload), logoutAction (deletes cookie)
- `lauos/src/lib/actions/profile.ts` - updateDisplayNameAction, updatePasswordAction Server Actions
- `lauos/src/app/(auth)/login/page.tsx` - Login page with lauOS metadata, imports LoginForm
- `lauos/src/components/login-form.tsx` - Split-screen layout, useActionState, toast + inline error
- `lauos/src/app/(protected)/dashboard/page.tsx` - Protected stub page (Phase 2 will fill content)
- `lauos/src/app/(protected)/settings/page.tsx` - Passes user record to SettingsForm
- `lauos/src/components/settings-form.tsx` - Display name + password change + logout button
- `lauos/src/app/layout.tsx` - Inter font applied, lauOS metadata, Toaster configured

## Decisions Made

- **exportToCookie vs raw token:** loginAction originally stored `pb.authStore.token` (raw JWT). This caused middleware's `loadFromCookie` to fail because PocketBase's format requires the full JSON object `{token, model}`. Fixed to use `exportToCookie()` value (URL-encoded JSON) so middleware can reconstruct `isValid = true`.
- **Inter font:** Replaced Geist/Geist_Mono defaults from create-next-app with Inter as required by plan.

## Deviations from Plan

### Auto-fixed Issues (from Task 1+2 execution — from previous checkpoint)

**1. [Rule 2 - Missing Critical] Stub components required for Task 1 build**
- **Found during:** Task 1 (build verification)
- **Issue:** `(auth)/login/page.tsx` imports `LoginForm` and `(protected)/settings/page.tsx` imports `SettingsForm`, but these components were not created until Task 2. Build would fail without them.
- **Fix:** Created minimal stub versions of `login-form.tsx` and `settings-form.tsx` in Task 1 commit; replaced with real implementations in Task 2 commit.
- **Files modified:** `lauos/src/components/login-form.tsx`, `lauos/src/components/settings-form.tsx`
- **Committed in:** `4834c68` (stubs), `fe7e74d` (real implementations)

### Auto-fixed Issues (from Task 3 verification)

**2. [Rule 1 - Bug] Middleware auth cookie stored raw JWT instead of PocketBase JSON payload**
- **Found during:** Task 3 (end-to-end verification — / and /dashboard not redirecting to /login)
- **Issue:** `loginAction` stored `pb.authStore.token` (raw JWT string) as cookie value. `middleware.ts` called `loadFromCookie('pb_auth=<raw-jwt>')` which PocketBase could not parse — `isValid` always returned false, causing every route to redirect to `/login` (redirect loop for unauthenticated, no auth for authenticated)
- **Fix:** Changed `loginAction` to call `pb.authStore.exportToCookie()`, extract the value portion (URL-encoded JSON with both token and model), and store that. Middleware's `loadFromCookie` can now reconstruct full auth state
- **Files modified:** `lauos/src/lib/actions/auth.ts`
- **Verification:** Build passes; / and /dashboard redirect correctly; session persists across requests
- **Committed in:** `45427b6`

**3. [Rule 1 - Bug] Wrong font — Geist instead of Inter**
- **Found during:** Task 3 (visual verification — browser showing default/Geist font)
- **Issue:** layout.tsx used Geist/Geist_Mono (create-next-app defaults); plan requires Inter font
- **Fix:** Replaced Geist imports with Inter from next/font/google, applied `inter.className` to body, updated metadata to lauOS branding
- **Files modified:** `lauos/src/app/layout.tsx`
- **Verification:** Build passes; Inter font loads correctly in browser
- **Committed in:** `45427b6`

---

**Total deviations:** 3 auto-fixed (1 missing critical from Task 1, 2 bugs found during Task 3 verification)
**Impact on plan:** Cookie serialization fix was critical for auth to work at all. Font fix corrects visual requirement. Stub fix was a build dependency order issue. No scope creep.

## Issues Encountered

- PocketBase `exportToCookie()` API returns a full cookie header string (`pb_auth=<value>; Path=/; ...`). To extract just the value for `cookieStore.set()`, we split on `;` and strip the `pb_auth=` prefix. This is consistent — middleware receives just the value via `request.cookies.get('pb_auth')?.value` and reconstructs the full cookie string before passing to `loadFromCookie`.

## User Setup Required

**Create a test user in PocketBase before testing login:**
1. Ensure PocketBase is running: `~/pb/pocketbase serve`
2. Visit http://127.0.0.1:8090/_/
3. Go to Collections -> users -> click "New record"
4. Enter email + password, save
5. Use those credentials on http://localhost:3005/login

Dev server: `PATH="/Users/laucaballero/.nvm/versions/node/v20.19.6/bin:$PATH" npm run dev -- -p 3005`

No new environment variables — `.env.local` already has `NEXT_PUBLIC_PB_URL` from plan 01-01.

## Next Phase Readiness

- Auth system complete and verified end-to-end (all 10 manual checks pass)
- Session persistence working via middleware authRefresh — token stays valid indefinitely with daily use
- /dashboard placeholder ready for Phase 2 Finance module content
- /settings functional for profile management throughout all phases
- No blockers for Phase 2

## Self-Check: PASSED

- FOUND: lauos/middleware.ts
- FOUND: lauos/src/lib/actions/auth.ts
- FOUND: lauos/src/lib/actions/profile.ts
- FOUND: lauos/src/app/(auth)/login/page.tsx
- FOUND: lauos/src/app/(protected)/dashboard/page.tsx
- FOUND: lauos/src/app/(protected)/settings/page.tsx
- FOUND: lauos/src/components/login-form.tsx
- FOUND: lauos/src/components/settings-form.tsx
- FOUND: lauos/src/app/layout.tsx
- FOUND commit: 4834c68 (Task 1)
- FOUND commit: fe7e74d (Task 2)
- FOUND commit: 45427b6 (Task 3 bug fixes)

---
*Phase: 01-foundation-auth*
*Plan: 03*
*Status: COMPLETE — all 10 verification checks pass*
*Completed: 2026-03-10*
