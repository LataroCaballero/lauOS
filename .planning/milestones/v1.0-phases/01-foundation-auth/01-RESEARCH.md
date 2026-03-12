# Phase 1: Foundation + Auth - Research

**Researched:** 2026-03-09
**Domain:** Next.js 15 App Router + PocketBase auth + VPS infrastructure (systemd + Nginx + TLS)
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Session lifetime:** Never expires unless user explicitly logs out. PocketBase token expiry handled via silent background auto-refresh in middleware. Token stored in persistent httpOnly cookie. No secondary protection or auto-lock.
- **Login UX:** Full-screen split layout — left panel (branding/pattern) + right panel (form). Error handling: both a toast notification AND an inline error message on failed login. Redirect after login: always `/dashboard`. No "remember me" toggle.
- **Profile page:** Accessible at `/settings`. Editable in Phase 1: display name and password change only. Avatar upload deferred to Phase 2.
- **Infrastructure:** VPS already provisioned and hardened (skip SSH/non-root setup). OS: Debian/Ubuntu-based assumed. Domain owned but subdomain not yet configured — plan must include DNS A-record step for PocketBase subdomain. TLS via Nginx + Certbot/Let's Encrypt. PocketBase bound to localhost only.
- **Local dev track:** PocketBase runs locally on Mac for development. VPS config is the production track. Plans must include "local dev" setup section.

### Claude's Discretion

- Exact Nginx config structure and Certbot renewal setup
- PocketBase systemd unit file specifics
- CORS configuration details for PocketBase
- Loading/pending states on the login form
- Exact image/pattern used on the login page left panel
- `/settings` page visual layout and component structure

### Deferred Ideas (OUT OF SCOPE)

- Avatar upload — moves to Phase 2 (AUTH-04 partial deferral)
- Automated backups (cron + local or S3) — future phase
- VPS OS-specific hardening details — already done by user
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | User can log in with email and password | PocketBase `collection('users').authWithPassword()` + Server Action pattern documented |
| AUTH-02 | Session persists on browser refresh and new tabs | httpOnly cookie via `pb.authStore.exportToCookie()` + middleware `loadFromCookie()` pattern verified |
| AUTH-03 | User can log out from any page | `pb.authStore.clear()` + Server Action that deletes `pb_auth` cookie, then redirects to `/login` |
| AUTH-04 | User can view and edit profile (display name; avatar deferred) | PocketBase `collection('users').update(id, data)` — display name + password change only in Phase 1 |
</phase_requirements>

---

## Summary

This phase bootstraps the entire project from scratch: Next.js 15 scaffold, PocketBase running locally for development and on a VPS under systemd + Nginx TLS for production, and a working cookie-based auth flow that satisfies all four AUTH requirements.

The core technical challenge is bridging PocketBase's stateless JWT tokens with Next.js App Router's server/client boundary. The standard pattern uses two PocketBase client factories (one for the browser, one for the server) that share state via an `httpOnly` cookie named `pb_auth`. Middleware reads this cookie on every request, attempts a silent token refresh with `authRefresh()`, and either updates the cookie or clears the auth state and redirects to `/login`. This gives effectively infinite sessions with no user friction.

On the infrastructure side, PocketBase is a single binary — no Docker, no Node.js, no dependencies. It runs under systemd, bound to `127.0.0.1:8090`, proxied via Nginx with Certbot-managed TLS. The setup is mature and well-documented; the main execution risk is DNS propagation timing for the new subdomain.

**Primary recommendation:** Scaffold with `create-next-app`, install `pocketbase` + `shadcn/ui` + `sonner`, implement the two-client factory pattern with middleware auth refresh, and configure PocketBase on VPS under systemd behind Nginx/TLS.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 15.x (latest) | App framework + SSR + middleware | Project constraint; Vercel-native |
| PocketBase JS SDK | 0.26.8 (npm) | Auth client, DB access | Official SDK for PocketBase |
| PocketBase binary | 0.36.6 | Backend DB + auth + storage | Single binary, zero deps |
| TypeScript | 5.x (bundled) | Type safety | Default with `create-next-app` |
| Tailwind CSS | 4.x | Styling | Default with `create-next-app` + shadcn |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn/ui | latest | Accessible UI components (Button, Input, Card, Form) | Login form, settings form |
| sonner | latest | Toast notifications | Failed login toast (user requirement) |
| react-hook-form | latest | Form state management | Login form, settings form |
| zod | latest | Schema validation (server + client) | Form validation on Server Actions |
| server-only | latest | Prevent server modules leaking to client | lib/pocketbase-server.ts |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| sonner | react-hot-toast | sonner is the shadcn/ui default and has RSC-compatible API |
| react-hook-form | useActionState only | react-hook-form gives better field-level UX; useActionState alone is sufficient but verbose |
| shadcn/ui | plain Tailwind | shadcn gives accessible primitives without lock-in; components are copied into the project |

### Installation

```bash
# 1. Scaffold the project
npx create-next-app@latest lauos --typescript --eslint --tailwind --src-dir --app --import-alias "@/*"
cd lauos

# 2. Core dependencies
npm install pocketbase sonner react-hook-form zod @hookform/resolvers server-only

# 3. shadcn/ui
npx shadcn@latest init -t next
npx shadcn@latest add button input label card form toast

# 4. Local PocketBase (Mac dev)
# Download from https://github.com/pocketbase/pocketbase/releases
# Extract to ~/pb/ and run: ./pocketbase serve
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx          # Split-screen login page
│   ├── (protected)/
│   │   ├── dashboard/
│   │   │   └── page.tsx          # Post-login landing (stub for Phase 1)
│   │   └── settings/
│   │       └── page.tsx          # Display name + password change
│   └── layout.tsx                # Root layout with <Toaster />
├── lib/
│   ├── pocketbase-browser.ts     # Browser client factory (singleton + cookie sync)
│   ├── pocketbase-server.ts      # Server client factory (reads cookie store)
│   └── actions/
│       ├── auth.ts               # login, logout Server Actions
│       └── profile.ts            # updateDisplayName, updatePassword Server Actions
├── components/
│   ├── login-form.tsx            # Client component: form + toast + inline error
│   └── settings-form.tsx         # Client component: display name + password fields
└── middleware.ts                 # Route protection + silent token refresh
```

### Pattern 1: Two-Client PocketBase Factory

**What:** Separate PocketBase instances for browser and server contexts that share auth state via a `pb_auth` cookie.
**When to use:** Always — global singleton causes auth state bleed between SSR requests.

**Browser client** (`lib/pocketbase-browser.ts`):
```typescript
// Source: https://dev.to/tsensei/nextjs-app-router-with-pocketbase-ssr-setup-1m9k
import PocketBase from 'pocketbase'

let browserClient: PocketBase | undefined

export function createBrowserClient(): PocketBase {
  if (!browserClient) {
    browserClient = new PocketBase(process.env.NEXT_PUBLIC_PB_URL)
  }
  // Sync authStore changes to cookie (readable by server)
  browserClient.authStore.onChange(() => {
    document.cookie = browserClient!.authStore.exportToCookie({ httpOnly: false })
  })
  return browserClient
}
```

**Server client** (`lib/pocketbase-server.ts`):
```typescript
// Source: https://dev.to/tsensei/nextjs-app-router-with-pocketbase-ssr-setup-1m9k
import 'server-only'
import PocketBase from 'pocketbase'
import { cookies } from 'next/headers'

export async function createServerClient(): Promise<PocketBase> {
  const pb = new PocketBase(process.env.NEXT_PUBLIC_PB_URL)
  const cookieStore = await cookies()
  const authCookie = cookieStore.get('pb_auth')
  if (authCookie) {
    pb.authStore.loadFromCookie(`${authCookie.name}=${authCookie.value}`)
  }
  return pb
}
```

### Pattern 2: Middleware with Silent Token Refresh

**What:** Next.js middleware creates a PocketBase instance per request, loads the auth cookie, attempts `authRefresh()`, and updates or clears the cookie.
**When to use:** Every request. This is the session persistence mechanism (AUTH-02).

```typescript
// Source: https://github.com/pocketbase/pocketbase/discussions/2939
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import PocketBase from 'pocketbase'

const PUBLIC_ROUTES = ['/login']

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const pb = new PocketBase(process.env.NEXT_PUBLIC_PB_URL)

  // Load auth state from cookie
  const cookieHeader = request.cookies.get('pb_auth')?.value ?? ''
  if (cookieHeader) {
    pb.authStore.loadFromCookie(`pb_auth=${cookieHeader}`)
  }

  // Silent refresh — extend token lifetime on every request
  try {
    if (pb.authStore.isValid) {
      await pb.collection('users').authRefresh()
      // Write refreshed token back to response cookie
      response.headers.append(
        'set-cookie',
        pb.authStore.exportToCookie({ httpOnly: true, secure: true, sameSite: 'Lax' })
      )
    }
  } catch {
    pb.authStore.clear()
  }

  const isPublicRoute = PUBLIC_ROUTES.some(r =>
    request.nextUrl.pathname.startsWith(r)
  )

  if (!pb.authStore.isValid && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (pb.authStore.isValid && request.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
```

### Pattern 3: Login Server Action

**What:** Server Action authenticates with PocketBase, sets the `pb_auth` cookie, redirects to `/dashboard`.
**When to use:** Login form submission (AUTH-01).

```typescript
// lib/actions/auth.ts
'use server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/pocketbase-server'

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const pb = await createServerClient()
  try {
    await pb.collection('users').authWithPassword(email, password)
  } catch {
    return { error: 'Invalid email or password.' }
  }

  const cookieStore = await cookies()
  const cookieString = pb.authStore.exportToCookie({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
  })
  // exportToCookie returns "pb_auth=...; Path=/; ..."
  // Parse and set via Next.js cookies API
  cookieStore.set('pb_auth', pb.authStore.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    // No maxAge — session cookie that survives browser restart via middleware refresh
  })

  redirect('/dashboard')
}

export async function logoutAction() {
  const cookieStore = await cookies()
  cookieStore.delete('pb_auth')
  redirect('/login')
}
```

### Pattern 4: PocketBase systemd + Nginx + TLS (Production)

**What:** PocketBase runs as a systemd service on the VPS, bound to localhost:8090, proxied by Nginx with Certbot-managed TLS.

**Systemd unit** (`/lib/systemd/system/pocketbase.service`):
```ini
# Source: https://pocketbase.io/docs/going-to-production/
[Unit]
Description=PocketBase

[Service]
Type=simple
User=www-data
Group=www-data
LimitNOFILE=4096
Restart=always
RestartSec=5s
StandardOutput=append:/home/deploy/pb/pb.log
StandardError=append:/home/deploy/pb/pb.log
WorkingDirectory=/home/deploy/pb
ExecStart=/home/deploy/pb/pocketbase serve --http="127.0.0.1:8090"

[Install]
WantedBy=multi-user.target
```

Note: Use a non-root user (e.g., `www-data` or `deploy`) rather than root. The `--http` flag binds to localhost only; Nginx provides the public TLS endpoint.

**Nginx config** (`/etc/nginx/sites-available/pb.yourdomain.com`):
```nginx
# Source: https://pocketbase.io/docs/going-to-production/ (adapted for TLS via Certbot)
server {
    listen 80;
    server_name pb.yourdomain.com;
    # Certbot will add SSL block and redirect here
}

# After certbot --nginx:
server {
    listen 443 ssl;
    server_name pb.yourdomain.com;
    client_max_body_size 10M;

    ssl_certificate /etc/letsencrypt/live/pb.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pb.yourdomain.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;

    location / {
        proxy_set_header Connection '';
        proxy_http_version 1.1;
        proxy_read_timeout 360s;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_pass http://127.0.0.1:8090;
    }
}
```

Run `sudo certbot --nginx -d pb.yourdomain.com` — Certbot automatically edits the config and sets up auto-renewal via a systemd timer or cron.

### Anti-Patterns to Avoid

- **Global PocketBase singleton on the server:** Import and share a single `pb` instance across requests. In SSR, concurrent requests will overwrite each other's auth state. Always create a new instance per request on the server.
- **Relying solely on middleware for auth:** Middleware is an optimistic check. Sensitive Server Actions and Route Handlers must call `verifySession()` independently. CVE-2025-29927 shows middleware can be bypassed in some Next.js configurations.
- **Storing the raw PocketBase token in a non-httpOnly cookie:** Client-accessible cookies expose the token to XSS. Use `httpOnly: true` for the server-side `pb_auth` cookie. The browser client uses a separate, non-httpOnly cookie only for browser-to-browser sync.
- **Running PocketBase as root on the VPS:** Create a dedicated service user. The systemd unit should not use `User=root`.
- **Not configuring `--http` flag on `pocketbase serve`:** Without it, PocketBase binds to `0.0.0.0:8090` and is publicly accessible without TLS.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Toast notifications | Custom portal/overlay | sonner | Stacking, accessibility, dismissal timing are non-trivial |
| Form validation | Manual field checking | zod + react-hook-form | Schema reuse server/client, field-level errors, async validation |
| Cookie serialization | Manual `Set-Cookie` string | `pb.authStore.exportToCookie()` | Handles Secure/HttpOnly/SameSite/Expires/size limit (4096 bytes) |
| Token expiry check | JWT decode + manual comparison | `pb.authStore.isValid` | PocketBase SDK handles expiry check internally |
| Password hashing | bcrypt manual implementation | PocketBase handles it | PocketBase stores and verifies passwords; never touch raw passwords |
| TLS certificate management | Manual cert renewal cron | Certbot (`--nginx` flag + systemd timer) | Auto-renewal, OCSP stapling, cipher config handled automatically |
| Accessible form components | Custom inputs from scratch | shadcn/ui | ARIA attributes, keyboard nav, screen reader labels already correct |

**Key insight:** PocketBase handles auth persistence (password hashing, token issuance, user record storage). The app's job is only to move the token between PocketBase and the browser cookie — don't build session management infrastructure, just wire the SDK.

---

## Common Pitfalls

### Pitfall 1: Auth State Bleeding Between SSR Requests

**What goes wrong:** A shared PocketBase instance holds User A's token; User B's request reads it.
**Why it happens:** Module-level singletons persist across requests in Node.js server.
**How to avoid:** Always `new PocketBase(url)` inside the server function/Server Action/middleware. Only use the singleton pattern in the browser client.
**Warning signs:** Users randomly see each other's data; auth works in dev but breaks in production under load.

### Pitfall 2: Middleware Making Every Page Slow (authRefresh on Every Request)

**What goes wrong:** Every page load incurs a round-trip to PocketBase for `authRefresh()`, adding 50-200ms.
**Why it happens:** Middleware runs on every matching route, including static assets.
**How to avoid:** The `matcher` in `middleware.ts` must exclude `_next/static`, `_next/image`, `favicon.ico`, and any public asset paths. Also consider refreshing only when the token is close to expiry rather than on every request (check `pb.authStore.token` decode for `exp` claim).
**Warning signs:** Pages feel sluggish; Vercel function invocation counts are unexpectedly high.

### Pitfall 3: PocketBase Token Default Expiry Is 14 Days

**What goes wrong:** After 14 days of inactivity, the user gets logged out unexpectedly.
**Why it happens:** PocketBase default auth token duration is 14 days. If the middleware refresh wasn't called within 14 days, the token is permanently expired.
**How to avoid:** Two options — (a) extend the default token duration in PocketBase Admin UI > Settings > Token options (up to ~2 years), or (b) ensure middleware refresh runs on every visit before expiry. For a personal app with daily use, option (b) is sufficient. Document the setting location so it can be adjusted.
**Warning signs:** User reports being logged out after a vacation.

### Pitfall 4: DNS Propagation Blocks TLS Issuance

**What goes wrong:** `certbot --nginx -d pb.yourdomain.com` fails because the DNS A record hasn't propagated.
**Why it happens:** Let's Encrypt verifies domain ownership via HTTP-01 challenge — requires the domain to resolve to the VPS IP.
**How to avoid:** Create the DNS A record pointing `pb.yourdomain.com` → VPS IP first. Wait for propagation (check with `dig pb.yourdomain.com` or `nslookup`). Typical propagation: 5 minutes to 1 hour depending on registrar. Run certbot only after `dig` confirms the correct IP.
**Warning signs:** `certbot` error: "No valid IP addresses found" or "Challenge failed."

### Pitfall 5: PocketBase CORS Blocking Vercel Frontend

**What goes wrong:** The Vercel-deployed Next.js app cannot reach PocketBase because PocketBase rejects cross-origin requests from the Vercel domain.
**Why it happens:** PocketBase's default allowed origins may not include the Vercel URL.
**How to avoid:** In PocketBase Admin UI > Settings > Application, set the Allowed Origins to include both `https://your-vercel-app.vercel.app` and the production domain. During development, add `http://localhost:3000`.
**Warning signs:** Browser console shows `CORS policy` errors; API calls return blocked or no response.

### Pitfall 6: httpOnly Cookie Not Sent on Cross-Origin Requests

**What goes wrong:** The `pb_auth` cookie is set with `SameSite=Strict` but Vercel frontend is on a different domain than the PocketBase API subdomain. Cookies are never sent.
**Why it happens:** `SameSite=Strict` blocks cookies on cross-site requests. But in this architecture, Next.js Server Actions call PocketBase server-to-server (not browser-to-PocketBase), so the browser cookie only needs to reach the Next.js server.
**How to avoid:** The browser never calls PocketBase directly — all PocketBase calls are made from Next.js Server Actions and middleware. The cookie (`SameSite=Lax` or `Strict`) travels from browser to Vercel Next.js server, which is the same origin. `SameSite=Lax` is the correct setting. Ensure `NEXT_PUBLIC_PB_URL` is the public HTTPS PocketBase URL for server-side calls.

---

## Code Examples

### PocketBase authWithPassword (login)

```typescript
// Source: https://pocketbase.io/docs/authentication/
const authData = await pb.collection('users').authWithPassword(email, password)
// authData.token — JWT
// authData.record — user record
```

### PocketBase authRefresh (silent refresh)

```typescript
// Source: deepwiki.com/pocketbase/js-sdk/3.2-authentication-and-authstore
const authData = await pb.collection('users').authRefresh()
// Returns fresh token + updated user record
// On failure (expired/invalid): throws ClientResponseError
```

### PocketBase update user record (settings)

```typescript
// Source: https://pocketbase.io/docs/api-records/
const updatedUser = await pb.collection('users').update(userId, {
  name: 'New Display Name',
})

// Change password (requires oldPassword field)
await pb.collection('users').update(userId, {
  oldPassword: currentPassword,
  password: newPassword,
  passwordConfirm: newPassword,
})
```

### exportToCookie / loadFromCookie

```typescript
// Source: deepwiki.com/pocketbase/js-sdk/3.2-authentication-and-authstore
// Export (server → Set-Cookie header)
const cookieStr = pb.authStore.exportToCookie({
  httpOnly: true,
  secure: true,
  sameSite: 'Lax',
})
// Returns: "pb_auth=eyJ...; Path=/; HttpOnly; Secure; SameSite=Lax; Expires=..."

// Load (from request cookie header)
pb.authStore.loadFromCookie(`pb_auth=${cookieValue}`)
// Internally calls: save(token, record)
```

### isValid check

```typescript
// Source: deepwiki.com/pocketbase/js-sdk/3.2-authentication-and-authstore
pb.authStore.isValid  // true if token exists and is not expired (checks JWT exp claim)
pb.authStore.token    // raw JWT string
pb.authStore.record   // user record object
pb.authStore.clear()  // clears token + record (logout)
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| PocketBase `model` field in authStore | `record` field (backward compat for `model`) | PocketBase v0.20+ | Use `pb.authStore.record`, not `.model` |
| Pages Router middleware in Next.js | App Router middleware.ts at root | Next.js 13+ | middleware.ts must be at `src/` root or project root, not inside `app/` |
| `useFormStatus` for pending state | `useActionState` (React 19+) | React 19 / Next.js 15 | `useActionState` returns `[state, action, pending]`; use `pending` for button disabled state |
| Tailwind config file (`tailwind.config.ts`) | Inline Tailwind v4 CSS-first config | Tailwind v4 / 2025 | No `tailwind.config.ts` needed with shadcn init; configured in `globals.css` |
| `shadcn-ui` npm package | `shadcn` CLI package | 2024 | Use `npx shadcn@latest`, not `npx shadcn-ui@latest` |

**Deprecated/outdated:**
- `pb.authStore.model`: Still works (backward compat) but deprecated. Use `pb.authStore.record`.
- `shadcn-ui` CLI name: Renamed to `shadcn`. Old package name gives deprecation warning.

---

## Open Questions

1. **PocketBase subdomain name**
   - What we know: Domain is owned; subdomain not yet configured.
   - What's unclear: Exact subdomain (e.g., `pb.`, `api.`, `backend.`).
   - Recommendation: Plan should include a placeholder `pb.yourdomain.com` with a note to substitute the real value. The DNS A-record step is the first production task.

2. **PocketBase token duration configuration**
   - What we know: Default is 14 days. Can be extended up to ~2 years in Admin UI.
   - What's unclear: Whether the user wants to extend it during Phase 1 setup.
   - Recommendation: Plan should include a step to set token duration to 365 days in PocketBase Admin UI > Settings > Token options, ensuring the "never expires unless logout" UX intent is met even without daily visits.

3. **VPS user for PocketBase service**
   - What we know: VPS is already hardened, non-root SSH established.
   - What's unclear: Whether a `deploy` or `www-data` user exists and should own PocketBase.
   - Recommendation: Plan creates a dedicated `pocketbase` system user to own the binary and data directory.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None yet — Wave 0 must establish |
| Config file | None — create `jest.config.ts` or use Playwright for e2e |
| Quick run command | `npm test` (unit); `npx playwright test` (e2e) |
| Full suite command | `npx playwright test --reporter=list` |

**Recommendation:** For this phase, automated unit tests have limited value (PocketBase calls require a running server). Use Playwright for e2e smoke tests that verify the full auth flow against a local PocketBase instance.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | Login with valid credentials lands on /dashboard | e2e | `npx playwright test tests/auth.spec.ts` | Wave 0 |
| AUTH-01 | Login with invalid credentials shows inline error + toast | e2e | `npx playwright test tests/auth.spec.ts` | Wave 0 |
| AUTH-02 | Refreshing browser on /dashboard keeps session | e2e | `npx playwright test tests/session.spec.ts` | Wave 0 |
| AUTH-02 | Opening new tab on /dashboard keeps session | e2e | `npx playwright test tests/session.spec.ts` | Wave 0 |
| AUTH-03 | Logout from any page redirects to /login | e2e | `npx playwright test tests/auth.spec.ts` | Wave 0 |
| AUTH-04 | Display name update persists on settings page | e2e | `npx playwright test tests/settings.spec.ts` | Wave 0 |
| AUTH-04 | Password change works and re-login succeeds | e2e | `npx playwright test tests/settings.spec.ts` | Wave 0 |

### Sampling Rate

- **Per task commit:** Manual browser check (local dev)
- **Per wave merge:** `npx playwright test` full suite against local PocketBase
- **Phase gate:** All e2e tests green against local PocketBase before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `tests/auth.spec.ts` — covers AUTH-01, AUTH-03
- [ ] `tests/session.spec.ts` — covers AUTH-02
- [ ] `tests/settings.spec.ts` — covers AUTH-04
- [ ] `playwright.config.ts` — Playwright configuration
- [ ] Framework install: `npm install -D @playwright/test && npx playwright install chromium`

---

## Sources

### Primary (HIGH confidence)

- PocketBase Official Docs (going-to-production) — https://pocketbase.io/docs/going-to-production/
  - Verified: systemd unit file, Nginx config, security recommendations
- PocketBase Official Docs (authentication) — https://pocketbase.io/docs/authentication/
  - Verified: authWithPassword, authRefresh, authStore API
- DeepWiki pocketbase/js-sdk — https://deepwiki.com/pocketbase/js-sdk/3.2-authentication-and-authstore
  - Verified: exportToCookie, loadFromCookie implementation, isValid, authRefresh integration
- Next.js Official Docs (authentication guide) — https://nextjs.org/docs/app/guides/authentication
  - Verified: Session cookie patterns, middleware pattern, DAL pattern, cookie security flags
- shadcn/ui Official Docs — https://ui.shadcn.com/docs/installation/next
  - Verified: Install command `npx shadcn@latest init -t next`

### Secondary (MEDIUM confidence)

- DEV.to: NextJS App Router with PocketBase SSR setup — https://dev.to/tsensei/nextjs-app-router-with-pocketbase-ssr-setup-1m9k
  - Two-client factory pattern (browser + server). Verified core pattern against official SDK docs.
- GitHub Discussion #2939 (NextJS 13, Pocketbase Auth and middleware) — https://github.com/pocketbase/pocketbase/discussions/2939
  - Complete middleware implementation with authRefresh. Pattern consistent with official docs.
- PocketBase v0.36.6 release — https://github.com/pocketbase/pocketbase/releases
  - Latest stable binary version confirmed.
- pocketbase npm v0.26.8 — https://www.npmjs.com/package/pocketbase
  - Latest SDK version confirmed.

### Tertiary (LOW confidence)

- Token default duration "14 days" — multiple community sources agree; not found in official docs page reviewed. Flag for validation in PocketBase Admin UI during setup.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions verified from npm + GitHub releases
- Architecture (two-client pattern): HIGH — consistent with official SDK README and community implementations
- Middleware auth refresh pattern: HIGH — verified against multiple PocketBase discussions and official SDK docs
- VPS/systemd/Nginx: HIGH — directly from official PocketBase production docs
- Pitfalls: MEDIUM-HIGH — most verified by official docs or multiple credible sources; pitfall 3 (14-day token) is MEDIUM (community-sourced)
- Validation architecture: MEDIUM — Playwright recommendation based on nature of the problem (e2e better than unit for auth flows)

**Research date:** 2026-03-09
**Valid until:** 2026-06-09 (stable libraries; PocketBase releases frequently but API is stable)
