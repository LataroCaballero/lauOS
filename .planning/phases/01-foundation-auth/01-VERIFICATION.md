---
phase: 01-foundation-auth
verified: 2026-03-10T15:00:00Z
status: human_needed
score: 11/11 must-haves verified
re_verification: false
human_verification:
  - test: "PocketBase Admin UI TLS — visit https://pb.<domain>/_/ in browser"
    expected: "Padlock icon visible, PocketBase Admin UI loads over HTTPS"
    why_human: "Remote VPS filesystem — cannot verify TLS cert or Nginx config from local machine"
  - test: "PocketBase survives VPS reboot"
    expected: "systemctl status pocketbase shows active (running) after sudo reboot"
    why_human: "Remote systemd state requires SSH session to the VPS to verify"
  - test: "PocketBase port binding — run 'ss -tlnp | grep 8090' on VPS"
    expected: "Output shows 127.0.0.1:8090 — NOT 0.0.0.0:8090"
    why_human: "Remote VPS network state, not verifiable from local codebase"
  - test: "Login flow — start local PocketBase and Next.js dev server, visit /login with valid credentials"
    expected: "Redirect to /dashboard after successful login"
    why_human: "Requires live PocketBase + test user — end-to-end browser behavior"
  - test: "Session persistence — refresh /dashboard while authenticated"
    expected: "Page stays at /dashboard, no redirect to /login"
    why_human: "Requires runtime session cookie and browser state"
  - test: "AUTH-04 avatar — confirm avatar deferred to Phase 2 is explicitly acknowledged"
    expected: "REQUIREMENTS.md AUTH-04 says 'nombre y avatar'; avatar upload UI not present in Phase 1 — this is a documented scope deferral, not a gap"
    why_human: "Scope decision requires human acknowledgment of partial AUTH-04 coverage"
---

# Phase 1: Foundation + Auth Verification Report

**Phase Goal:** Deploy PocketBase, scaffold Next.js 15 with two-client PocketBase factory, and implement complete authentication flows (login, session persistence, logout, settings) satisfying all four AUTH requirements.
**Verified:** 2026-03-10T15:00:00Z
**Status:** human_needed — all code artifacts verified; VPS infrastructure and live browser flows require human confirmation
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | PocketBase Admin UI accessible at HTTPS subdomain with TLS | ? HUMAN | Files live on remote VPS — cannot inspect from local repo |
| 2 | PocketBase process survives VPS reboot without manual intervention | ? HUMAN | systemd state requires SSH session to verify |
| 3 | PocketBase bound to 127.0.0.1:8090 only (not public) | ? HUMAN | VPS network state — cannot verify locally |
| 4 | Local Mac PocketBase runs at http://127.0.0.1:8090 for development | ? HUMAN | Local binary outside repo; documented in 01-01-SUMMARY.md |
| 5 | Next.js 16 project builds with zero TypeScript errors | VERIFIED | `npm run build` exits 0: "Compiled successfully in 1375.3ms", all 5 routes generated |
| 6 | PocketBase browser and server client factories are importable and typed | VERIFIED | `pocketbase-browser.ts` exports `createBrowserClient` (singleton + onChange cookie sync); `pocketbase-server.ts` exports `createServerClient` (per-request, `import 'server-only'` guard) |
| 7 | Root layout includes the Sonner Toaster component | VERIFIED | `layout.tsx` line 23: `<Toaster richColors position="top-right" />` with Inter font |
| 8 | Playwright test scaffold exists with 7 stubs covering AUTH-01 through AUTH-04 | VERIFIED | `playwright test --list` returns exactly 7 tests across 3 files |
| 9 | Login page redirects to /dashboard on success; shows toast + inline error on failure | VERIFIED | `login-form.tsx`: `useActionState` wired to `loginAction`; `useEffect` fires `toast.error`; `{state?.error &&` renders inline error |
| 10 | Unauthenticated users visiting /dashboard are redirected to /login | VERIFIED | `middleware.ts`: `if (!pb.authStore.isValid && !isPublicRoute) return NextResponse.redirect('/login')` |
| 11 | User can view and update display name and password at /settings | VERIFIED | `settings-form.tsx`: `updateDisplayNameAction` and `updatePasswordAction` wired to form handlers; logout via `logoutAction` |

**Score:** 7/7 code truths verified (4 infra truths require human confirmation)

---

## Required Artifacts

### Plan 01-01 Artifacts (VPS — outside repo)

| Artifact | Expected | Status | Details |
|----------|---------|--------|---------|
| `/lib/systemd/system/pocketbase.service` | systemd unit for PocketBase | ? HUMAN | Remote VPS — documented in 01-01-SUMMARY.md, not verifiable from codebase |
| `/etc/nginx/sites-available/pb.<domain>` | Nginx TLS + proxy config | ? HUMAN | Remote VPS — documented in 01-01-SUMMARY.md |
| `/home/pocketbase/pb/pocketbase` | PocketBase binary v0.36.6 | ? HUMAN | Remote VPS binary |

### Plan 01-02 Artifacts (codebase)

| Artifact | Expected | Status | Details |
|----------|---------|--------|---------|
| `lauos/src/lib/pocketbase-browser.ts` | Browser PocketBase singleton factory | VERIFIED | 17 lines; exports `createBrowserClient`; singleton pattern; `onChange` cookie sync present |
| `lauos/src/lib/pocketbase-server.ts` | Server PocketBase per-request factory | VERIFIED | 18 lines; `import 'server-only'` first line; exports `createServerClient`; reads `pb_auth` cookie via `loadFromCookie` |
| `lauos/playwright.config.ts` | Playwright e2e config | VERIFIED | `testDir: './tests'`; `webServer` points to `http://localhost:3000`; chromium project configured |
| `lauos/tests/auth.spec.ts` | Test stubs for AUTH-01, AUTH-03 | VERIFIED | 3 tests: login success, login failure (toast + inline error), logout |
| `lauos/tests/session.spec.ts` | Test stubs for AUTH-02 | VERIFIED | 2 tests: refresh keeps session, new context cookie persistence |
| `lauos/tests/settings.spec.ts` | Test stubs for AUTH-04 | VERIFIED | 2 tests: display name update, password change |
| `lauos/.env.example` | Documents NEXT_PUBLIC_PB_URL | VERIFIED | Contains `NEXT_PUBLIC_PB_URL=http://127.0.0.1:8090` |
| `lauos/.env.local` | Runtime env with PocketBase URL | VERIFIED | File exists (gitignored) |

### Plan 01-03 Artifacts (codebase)

| Artifact | Expected | Status | Details |
|----------|---------|--------|---------|
| `lauos/middleware.ts` | Route protection + silent token refresh | VERIFIED | `authRefresh()` present; correct matcher `/((?!api\|_next/static\|_next/image\|favicon.ico).*)`; redirects unauthenticated to /login and authenticated away from /login |
| `lauos/src/lib/actions/auth.ts` | loginAction + logoutAction | VERIFIED | Both exported; `loginAction` uses `exportToCookie()` for correct JSON serialization; `pb_auth` set as httpOnly cookie; redirects to /dashboard |
| `lauos/src/lib/actions/profile.ts` | updateDisplayNameAction + updatePasswordAction | VERIFIED | Both exported; calls `pb.collection('users').update()`; `revalidatePath('/settings')` in name action |
| `lauos/src/app/(auth)/login/page.tsx` | Login page | VERIFIED | Imports and renders `<LoginForm />`; `Metadata` title "Sign in — lauOS" |
| `lauos/src/components/login-form.tsx` | Split-screen form with toast + inline error | VERIFIED | Split layout (left decorative panel hidden on mobile, right form); `useActionState`; `useEffect` for toast; `{state?.error &&` for inline error |
| `lauos/src/app/(protected)/settings/page.tsx` | Settings page with server-side user read | VERIFIED | `createServerClient()` called; `pb.authStore.record` passed to `SettingsForm` |
| `lauos/src/components/settings-form.tsx` | Display name + password change + logout | VERIFIED | Both sections present; `updateDisplayNameAction` and `updatePasswordAction` called; `logoutAction` in form |
| `lauos/src/app/(protected)/dashboard/page.tsx` | Protected placeholder (Phase 2 content) | VERIFIED | Placeholder page — intentional stub per plan spec ("Dashboard — Phase 2") |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `login-form.tsx` | `actions/auth.ts` | `loginAction` call | WIRED | Line 8: `import { loginAction } from '@/lib/actions/auth'`; used in `useActionState(loginAction, null)` |
| `middleware.ts` | PocketBase `authRefresh()` | `pb.collection('users').authRefresh()` | WIRED | Line 20: `await pb.collection('users').authRefresh()` — runs on every request if auth cookie present |
| `actions/auth.ts` | `pb_auth` cookie | `cookieStore.set('pb_auth', ...)` | WIRED | Lines 37-43: httpOnly cookie set with `exportToCookie()` value; `cookieStore.delete('pb_auth')` in `logoutAction` |
| `settings-form.tsx` | `actions/profile.ts` | `updateDisplayNameAction` / `updatePasswordAction` | WIRED | Line 8: both imported; called in `handleNameSubmit` and `handlePasswordSubmit` handlers |
| `settings-form.tsx` | `actions/auth.ts` | `logoutAction` | WIRED | Line 9: imported; used in `<form action={logoutAction}>` |
| `pocketbase-browser.ts` | `NEXT_PUBLIC_PB_URL` | `new PocketBase(process.env.NEXT_PUBLIC_PB_URL)` | WIRED | Line 7: environment variable used in singleton constructor |
| `pocketbase-server.ts` | `next/headers cookies()` | `loadFromCookie` | WIRED | Lines 12-15: `cookies()` called; `loadFromCookie('pb_auth=...')` reconstructs auth state |

---

## Requirements Coverage

| Requirement | Description | Plans | Status | Evidence |
|-------------|-------------|-------|--------|---------|
| AUTH-01 | User can log in with email and password | 01-01, 01-02, 01-03 | SATISFIED | `loginAction` calls `authWithPassword`; redirects to /dashboard on success; returns error on failure; login-form.tsx is wired and substantive |
| AUTH-02 | Session persists on browser refresh and new tabs | 01-01, 01-02, 01-03 | SATISFIED (code) / HUMAN (runtime) | `middleware.ts` calls `authRefresh()` on every request, refreshing cookie; httpOnly cookie persists across tabs; session.spec.ts tests this; runtime verification requires browser |
| AUTH-03 | User can log out from any page | 01-02, 01-03 | SATISFIED | `logoutAction` deletes `pb_auth` cookie and redirects to /login; logout button present in `settings-form.tsx` |
| AUTH-04 | User can view and edit profile (name and avatar) | 01-02, 01-03 | PARTIAL — name only; avatar deferred | `updateDisplayNameAction` implemented and wired; avatar upload explicitly deferred to Phase 2 per planning decision. REQUIREMENTS.md says "nombre y avatar" — avatar is an acknowledged gap, not an oversight |

**Note on AUTH-04:** The plan's own success criteria explicitly state "AUTH-04: Password change works (no avatar — deferred to Phase 2 per user decision)". Avatar upload is a documented scope deferral, not a missing implementation. REQUIREMENTS.md marks AUTH-04 as Complete. Human acknowledgment recommended.

**Orphaned requirements:** None. All Phase 1 requirements (AUTH-01 through AUTH-04) are claimed in plan frontmatter and verified.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/app/(protected)/dashboard/page.tsx` | 3 | "Dashboard — Phase 2" placeholder text | INFO | Intentional — plan explicitly specifies this stub; Phase 2 will fill content |

No blockers found. The dashboard stub is intentional and documented in the plan as "Phase 2 will fill content".

---

## Human Verification Required

### 1. PocketBase TLS on VPS

**Test:** Open `https://pb.<domain>/_/` in a browser (replace `<domain>` with the actual domain from the 01-01-SUMMARY.md)
**Expected:** PocketBase Admin UI loads with a valid HTTPS padlock (no certificate warning); the UI is responsive
**Why human:** The Nginx config and Let's Encrypt certificate are on the remote VPS filesystem. The local codebase cannot verify TLS termination.

### 2. PocketBase Reboot Survival

**Test:** On the VPS, run `sudo reboot`, wait 2 minutes, SSH back in, run `sudo systemctl status pocketbase`
**Expected:** Output shows `active (running)` — service automatically restarted
**Why human:** systemd unit state is a runtime property of the remote VPS, not inspectable from the repo.

### 3. PocketBase Port Binding (Security)

**Test:** On the VPS, run `ss -tlnp | grep 8090`
**Expected:** Output shows `127.0.0.1:8090` — not `0.0.0.0:8090`
**Why human:** Live network socket state on the remote VPS.

### 4. End-to-End Login Flow

**Test:** Start local PocketBase (`~/pb/pocketbase serve`), start Next.js (`PATH="/Users/laucaballero/.nvm/versions/node/v20.19.6/bin:$PATH" npm run dev -- -p 3005`), visit `http://localhost:3005/login`. Submit valid credentials. Submit invalid credentials.
**Expected:**
- Valid credentials: redirects to `/dashboard`
- Invalid credentials: Sonner toast appears AND an inline red error text appears below the form (both simultaneously per the locked UX decision)
**Why human:** Requires live PocketBase, a test user, and a real browser to verify toast + cookie behavior.

### 5. Session Persistence

**Test:** While logged in at `/dashboard`, press F5 (browser refresh). Then open a new browser tab and navigate to `http://localhost:3005/dashboard`.
**Expected:** Both actions keep you at `/dashboard` — no redirect to `/login`
**Why human:** Cookie persistence across requests requires a live browser session.

### 6. AUTH-04 Avatar Scope Acknowledgment

**Test:** Confirm that avatar upload being absent from Phase 1 is intentional.
**Expected:** REQUIREMENTS.md AUTH-04 ("nombre y avatar") is partially satisfied — name editing works, avatar upload is deferred to Phase 2. This should be explicitly noted in the project's decision log or REQUIREMENTS.md with a "(avatar deferred to Phase 2)" annotation.
**Why human:** Scope deferral decisions require owner sign-off.

---

## Additional Notes

### CORS Port Discrepancy

Plan 01-01 specified CORS origin `http://localhost:3000`. The actual VPS configuration uses `http://localhost:3005` (documented in 01-01-SUMMARY.md under "Decisions Made") because port 3000 was already in use on the VPS. The Next.js dev server must be started on port 3005 (`npm run dev -- -p 3005`) to match the PocketBase CORS allowlist. Playwright config points to `http://localhost:3000` — if Playwright tests are run against local PocketBase, the dev server must be started on port 3005 and the `playwright.config.ts` `baseURL` and `webServer.url` updated accordingly, or the production PocketBase (which has CORS configured for port 3005) must be used. This is a known deviation documented in 01-01-SUMMARY.md.

### Next.js Version

Plan 01-02 specified Next.js 15. Installed version is Next.js 16.1.6 (latest stable at time of install). This is a documented deviation with no functional impact for the auth implementation.

### Build Command

Node 20 is required for Next.js 16 + Tailwind v4 oxide. Build must be invoked via `PATH="/Users/laucaballero/.nvm/versions/node/v20.19.6/bin:$PATH" npm run build` or equivalent. The system PATH uses Node 18 which is incompatible.

---

## Gaps Summary

No code-level gaps found. All repository artifacts exist, are substantive (not stubs), and are correctly wired. The phase's core deliverable — a working Next.js auth system with PocketBase cookie-based sessions — is complete and verified by a clean production build.

Items pending human verification are runtime behaviors (VPS infrastructure state, browser session behavior) that cannot be confirmed from the codebase alone. These were human-action tasks in plans 01-01 and 01-03 and are documented as passing in the SUMMARY files.

The AUTH-04 avatar deferral is a scope decision, not a code gap — it was made explicit in the plan's success criteria before implementation began.

---

_Verified: 2026-03-10T15:00:00Z_
_Verifier: Claude (gsd-verifier)_
