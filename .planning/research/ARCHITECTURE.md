# Architecture Research

**Domain:** Personal dashboard web app (Next.js + PocketBase)
**Researched:** 2026-03-09
**Confidence:** MEDIUM — Core patterns verified via official docs and community sources; SSR+PocketBase integration is an evolving area without official Next.js-specific guides from PocketBase.

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    VERCEL (Next.js App)                          │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │  Next.js     │  │  Next.js     │  │   Next.js             │  │
│  │  Middleware  │  │  Server      │  │   API Route           │  │
│  │  (auth gate) │  │  Components  │  │   /api/anthropic-*    │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬────────────┘  │
│         │                 │                      │               │
│         │    Client Components (React)           │               │
│         │    ┌─────────────────────────┐         │               │
│         │    │  PocketBase JS SDK      │         │               │
│         │    │  (browser singleton)    │         │               │
│         │    └────────────┬────────────┘         │               │
└─────────┼─────────────────┼──────────────────────┼───────────────┘
          │                 │                      │
          │ cookie auth     │ REST/SDK calls        │ server-only
          │                 │                      │
┌─────────┼─────────────────┼──────────────────────┼───────────────┐
│         ↓                 ↓          VPS          │               │
│  ┌─────────────────────────────────────┐          │               │
│  │          PocketBase                 │          │               │
│  │  ┌──────────┐  ┌──────────────────┐ │          │               │
│  │  │  Auth    │  │  Collections      │ │          │               │
│  │  │  Users   │  │  accounts         │ │          │               │
│  │  │          │  │  transactions     │ │          │               │
│  │  └──────────┘  │  categories       │ │          │               │
│  │                └──────────────────┘ │          │               │
│  │         SQLite (embedded)           │          │               │
│  └─────────────────────────────────────┘          │               │
└───────────────────────────────────────────────────┼───────────────┘
                                                    │
                                          ┌─────────▼─────────────┐
                                          │  Anthropic Admin API   │
                                          │  /v1/organizations/    │
                                          │  usage_report/messages │
                                          │  /v1/organizations/    │
                                          │  cost_report           │
                                          └────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Next.js Middleware | Auth gate — redirects unauthenticated users before page renders | `middleware.ts` reads PocketBase token from cookie, validates, redirects to `/login` if missing |
| Next.js Server Components | Data-heavy renders with SSR, pass data to client components | `createServerClient()` with cookie store, fetch PocketBase records server-side |
| Next.js Client Components | Interactive UI, real-time subscriptions, form mutations | PocketBase browser SDK singleton, `"use client"` directive |
| Next.js API Routes (`/api/`) | Server-only operations — Anthropic Admin API proxy, secret key protection | `route.ts` files that call Anthropic with `ANTHROPIC_ADMIN_KEY` env var, never exposed to browser |
| PocketBase (VPS) | Auth, database, file storage, REST API | Single binary on VPS, exposes REST API on port 8090 |
| Anthropic Usage API | Source of Claude Code usage + cost data | External REST API, requires Admin API key, called server-side only |

## Recommended Project Structure

```
src/
├── app/                          # App Router — all routes here
│   ├── layout.tsx                # Root layout: fonts, global providers
│   ├── page.tsx                  # Root redirect → /dashboard
│   ├── (auth)/                   # Route group: unauthenticated pages
│   │   └── login/
│   │       └── page.tsx
│   ├── (dashboard)/              # Route group: authenticated pages, shared layout
│   │   ├── layout.tsx            # Dashboard shell: navbar + sidebar
│   │   ├── page.tsx              # Dashboard home: widget grid
│   │   ├── finances/             # Finance module
│   │   │   ├── page.tsx          # Account list + summary
│   │   │   ├── [accountId]/
│   │   │   │   └── page.tsx      # Account detail + transactions
│   │   │   └── _components/      # Finance-specific components
│   │   │       ├── TransactionForm.tsx
│   │   │       ├── AccountCard.tsx
│   │   │       └── BalanceSummary.tsx
│   │   └── claude-stats/         # Claude Code Stats module
│   │       ├── page.tsx          # Usage + cost charts
│   │       └── _components/
│   │           ├── UsageChart.tsx
│   │           └── CostBreakdown.tsx
│   └── api/                      # Server-only API routes
│       └── anthropic/
│           ├── usage/
│           │   └── route.ts      # GET → proxies Anthropic usage API
│           └── costs/
│               └── route.ts      # GET → proxies Anthropic cost API
├── lib/                          # Shared utilities + external client setup
│   ├── pocketbase/
│   │   ├── client.ts             # createBrowserClient() singleton
│   │   ├── server.ts             # createServerClient(cookieStore)
│   │   └── types.ts              # Generated/manual PocketBase collection types
│   └── anthropic/
│       └── client.ts             # Thin fetch wrapper for Anthropic Admin API
├── components/                   # Shared UI components
│   ├── ui/                       # Primitive components (shadcn/ui or custom)
│   └── layout/
│       ├── Navbar.tsx
│       └── ModuleGrid.tsx
├── hooks/                        # Custom React hooks
│   ├── usePocketBase.ts          # Access browser PocketBase instance
│   └── useAuth.ts                # Current user from auth store
└── middleware.ts                 # Auth gate for (dashboard) routes
```

### Structure Rationale

- **`(auth)/` and `(dashboard)/` route groups:** Route groups let us apply a different layout to authenticated vs unauthenticated pages without affecting the URL. The dashboard layout (navbar, sidebar) wraps only the protected section.
- **`_components/` inside route folders:** Private, route-scoped components that are not routable. Finance components stay with the finance route — no cross-module imports needed.
- **`app/api/anthropic/`:** Anthropic Admin API requires a secret key (`sk-ant-admin...`). This key must never reach the browser. An API route acts as a thin server-side proxy that receives requests from client components and forwards them to Anthropic.
- **`lib/pocketbase/client.ts` vs `server.ts`:** Two separate factory functions — one for browser use (singleton, syncs auth to cookies), one for server components (creates fresh instance per request with cookie store).

## Architectural Patterns

### Pattern 1: Cookie-Synced PocketBase Auth (Browser Client)

**What:** The PocketBase JS SDK stores auth tokens in `localStorage` by default, which is inaccessible in server components or middleware. Syncing tokens to an HTTP-only cookie makes them available everywhere.

**When to use:** Always — this is the baseline for making PocketBase work with Next.js SSR.

**Trade-offs:** Slightly more setup than default SDK usage. Cookie must be configured with `httpOnly: false` if PocketBase browser SDK needs to read it back, or use two cookies (readable + httpOnly). Keep the cookie `SameSite=Strict` for CSRF protection.

**Example:**
```typescript
// lib/pocketbase/client.ts
import PocketBase from 'pocketbase'

let _pb: PocketBase | null = null

export function createBrowserClient(): PocketBase {
  if (_pb) return _pb

  _pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL)

  // Sync auth token to cookie whenever it changes
  _pb.authStore.onChange(() => {
    document.cookie = `pb_auth=${encodeURIComponent(
      JSON.stringify({ token: _pb!.authStore.token, record: _pb!.authStore.record })
    )}; path=/; SameSite=Strict`
  })

  return _pb
}
```

### Pattern 2: Server PocketBase Client (Per-Request)

**What:** For server components and API routes, create a fresh PocketBase instance per request that reads auth from the incoming cookie store. Never share a single PocketBase instance across requests on the server (security risk in long-running Node contexts).

**When to use:** Server Components that need authenticated data, API routes that need to act on behalf of the user.

**Trade-offs:** A new instance per request has negligible cost. The risk of sharing instances (leaking one user's auth to another) far outweighs the minor overhead.

**Example:**
```typescript
// lib/pocketbase/server.ts
import PocketBase from 'pocketbase'
import { cookies } from 'next/headers'

export async function createServerClient(): Promise<PocketBase> {
  const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL)

  const cookieStore = await cookies()
  const authCookie = cookieStore.get('pb_auth')

  if (authCookie) {
    const { token, record } = JSON.parse(decodeURIComponent(authCookie.value))
    pb.authStore.save(token, record)
  }

  return pb
}
```

### Pattern 3: Anthropic API Server-Side Proxy

**What:** Never call the Anthropic Admin API from the browser. Create a Next.js API route that holds the `ANTHROPIC_ADMIN_KEY` env var and proxies requests to Anthropic. The client component calls `/api/anthropic/usage` instead of Anthropic directly.

**When to use:** Any call to Anthropic's Admin API (usage stats, cost data).

**Trade-offs:** One extra network hop (browser → Vercel → Anthropic). Acceptable for a dashboard that isn't real-time. The security tradeoff (keeping Admin key server-only) is non-negotiable.

**Example:**
```typescript
// app/api/anthropic/usage/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const startingAt = searchParams.get('starting_at') ?? ''
  const endingAt = searchParams.get('ending_at') ?? ''

  const res = await fetch(
    `https://api.anthropic.com/v1/organizations/usage_report/messages?starting_at=${startingAt}&ending_at=${endingAt}&bucket_width=1d`,
    {
      headers: {
        'anthropic-version': '2023-06-01',
        'x-api-key': process.env.ANTHROPIC_ADMIN_KEY!,
      },
    }
  )

  const data = await res.json()
  return NextResponse.json(data)
}
```

## Data Flow

### Auth Flow

```
User submits login form (client component)
    ↓
pb.collection('users').authWithPassword(email, password)
    ↓
PocketBase returns { token, record }
    ↓
authStore.onChange fires → token written to cookie
    ↓
Next request to any (dashboard) route:
    middleware.ts reads pb_auth cookie → validates token
    ↓
If invalid: redirect /login
If valid: continue to page
```

### Finance Data Flow (Read)

```
User navigates to /finances
    ↓
Server Component: createServerClient() with cookie auth
    ↓
pb.collection('accounts').getList() — server-side
    ↓
Data passed as props to AccountCard (client component)
    ↓
Client renders without loading spinner (SSR pre-populated)
```

### Finance Data Flow (Write)

```
User submits TransactionForm
    ↓
Client component calls pb.collection('transactions').create(data)
    ↓
PocketBase validates, writes to SQLite
    ↓
Client invalidates query / updates local state
    ↓
UI reflects new transaction immediately
```

### Claude Stats Data Flow

```
User navigates to /claude-stats
    ↓
Client component mounts, calls fetch('/api/anthropic/usage?starting_at=...&ending_at=...')
    ↓
Next.js API route (server) calls Anthropic Admin API with ANTHROPIC_ADMIN_KEY
    ↓
Anthropic returns token usage buckets by model + day
    ↓
API route forwards JSON to client
    ↓
Client renders UsageChart + CostBreakdown
```

### Key Data Flows Summary

1. **Auth:** PocketBase token cookie → middleware → server client → user context
2. **Finance reads:** PocketBase SDK (server) → server component props → client render
3. **Finance writes:** PocketBase SDK (browser) → PocketBase SQLite → UI update
4. **Claude stats:** Client → Next.js API route (proxy) → Anthropic Admin API → chart render

## Scaling Considerations

This is a single-user personal dashboard. Scaling is not a concern. These notes capture what breaks first if the project ever expanded.

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 1 user (current) | Monolith is ideal — no complexity needed. PocketBase handles auth, DB, and storage in one process. |
| 10-100 users | PocketBase SQLite handles this fine. Auth collection already supports multiple users. Main concern: VPS size. |
| 1000+ users | SQLite starts showing write contention. Would need to evaluate PocketBase's Litestream replication or migrate DB. Anthropic API proxy would need rate limiting. |

### Scaling Priorities

1. **First bottleneck:** VPS RAM/CPU — PocketBase is lightweight but the VPS itself is the single point of failure. Add a simple health check.
2. **Second bottleneck:** Anthropic API rate limits on the Admin API — cache usage data in PocketBase for 5–15 minutes rather than fetching on every page load.

## Anti-Patterns

### Anti-Pattern 1: Shared PocketBase Instance on Server

**What people do:** Create a module-level `const pb = new PocketBase(...)` and import it in server components.

**Why it's wrong:** Next.js server is a long-running Node process. Module-level state is shared across requests. User A's auth token could leak to User B's request.

**Do this instead:** Always use `createServerClient()` (a factory function) that creates a new instance per request and loads auth from the incoming cookie.

### Anti-Pattern 2: Calling Anthropic Admin API from the Browser

**What people do:** Store the Admin API key in a `NEXT_PUBLIC_` env var and fetch Anthropic directly from client components.

**Why it's wrong:** `NEXT_PUBLIC_` variables are bundled into the client-side JavaScript and visible to anyone who opens DevTools. An Admin API key gives full read access to your organization's usage and cost data.

**Do this instead:** Keep the key in `ANTHROPIC_ADMIN_KEY` (no `NEXT_PUBLIC_` prefix) and call it only from `app/api/` route handlers.

### Anti-Pattern 3: Direct PocketBase Calls for External API Data

**What people do:** Store Anthropic credentials in PocketBase and build PocketBase hooks to fetch external APIs.

**Why it's wrong:** PocketBase's JS hooks run inside the PocketBase process. Mixing application logic (external API fetching) into the database backend tightly couples concerns and makes the PocketBase instance harder to replace or upgrade.

**Do this instead:** External API calls belong in Next.js API routes (or Server Actions). PocketBase stays as pure data store and auth provider.

### Anti-Pattern 4: Skipping Middleware Auth Gate

**What people do:** Check `pb.authStore.isValid` inside each page component instead of in middleware.

**Why it's wrong:** Each page does a redundant auth check. Unauthenticated users briefly see the dashboard before being redirected (flash of content). Server components may attempt PocketBase queries with an invalid token.

**Do this instead:** Put all auth logic in `middleware.ts`. One place, runs before any rendering, zero flash.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| PocketBase on VPS | PocketBase JS SDK (`pocketbase` npm package) — direct HTTP calls to VPS URL | Requires `NEXT_PUBLIC_POCKETBASE_URL` env var. In local dev, PocketBase runs on `http://localhost:8090`. In prod, use full VPS URL or domain. |
| Anthropic Usage API | Server-side fetch via Next.js API route proxy | Requires `ANTHROPIC_ADMIN_KEY` (Admin API key starting with `sk-ant-admin...`). Available endpoints: `/v1/organizations/usage_report/messages` and `/v1/organizations/cost_report`. Data lags ~5 min. |
| Vercel (Next.js hosting) | Standard Next.js deploy — `vercel deploy` or GitHub integration | Environment variables set in Vercel dashboard. `NEXT_PUBLIC_POCKETBASE_URL` must point to VPS. CORS on PocketBase must allow Vercel's domain. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Next.js client ↔ PocketBase | PocketBase JS SDK (HTTP REST + WebSocket for realtime) | Browser SDK is a singleton. Manages auth token in cookie via `authStore.onChange`. |
| Next.js server ↔ PocketBase | PocketBase JS SDK (HTTP REST only) | Fresh instance per request. Auth loaded from cookie. No realtime subscriptions server-side. |
| Next.js client ↔ Anthropic | Via `/api/anthropic/*` route (HTTP fetch) | Client never touches Anthropic directly. API route is the only contact point. |
| Finance module ↔ Claude Stats module | None (fully isolated) | Each module only reads its own PocketBase collections or external data. No cross-module data sharing in v1. |
| Middleware ↔ PocketBase | Cookie read + optional token validation | Middleware reads the `pb_auth` cookie. For strict validation, it can call PocketBase's `/api/collections/users/auth-refresh`. For performance on a single-user app, trusting cookie presence is acceptable. |

## Suggested Build Order

Dependencies drive the order — each layer must exist before the next can be built.

```
Phase 1: Foundation
├── PocketBase setup on VPS (binary install, admin account, CORS config)
├── Next.js project scaffold (App Router, TypeScript, Tailwind)
├── PocketBase client factory (browser + server)
└── middleware.ts auth gate skeleton

Phase 2: Auth
├── PocketBase users collection (Auth collection)
├── Login page → authWithPassword → cookie sync
├── Logout action → authStore.clear + cookie clear
└── Middleware redirects validated + tested

Phase 3: Dashboard Shell
├── (dashboard)/layout.tsx with navbar
├── Home page with module grid (static widgets)
└── Routing to /finances and /claude-stats placeholders

Phase 4: Finance Module
├── PocketBase collections: accounts, transactions, categories
├── Account list + create
├── Transaction form + list per account
└── Balance calculations (by currency: ARS + USD)

Phase 5: Claude Stats Module
├── Next.js API routes: /api/anthropic/usage + /api/anthropic/costs
├── Anthropic Admin API key configured in Vercel env
└── Usage + cost charts in /claude-stats

Phase 6: Polish
├── Error boundaries per module
├── Loading skeletons
└── Responsive layout
```

**Key dependency constraint:** Auth must be fully working before any module is built. PocketBase collections for finance must be designed before the Finance module UI — schema changes after data exists are painful in PocketBase (field type changes are permanent).

## Sources

- PocketBase official docs — Client-Side SDKs: https://pocketbase.io/docs/client-side-sdks/
- PocketBase official docs — Collections: https://pocketbase.io/docs/collections/
- GitHub Discussion — Best Practices for Initializing PocketBase Instance (Next.js): https://github.com/pocketbase/pocketbase/discussions/5359
- GitHub Discussion — Next.js App Router SSR Integration: https://github.com/pocketbase/pocketbase/discussions/4065
- DEV Community — NextJS App Router with Pocketbase SSR setup: https://dev.to/tsensei/nextjs-app-router-with-pocketbase-ssr-setup-1m9k
- Next.js official docs — Project Structure: https://nextjs.org/docs/app/getting-started/project-structure
- Anthropic official docs — Usage and Cost API: https://platform.claude.com/docs/en/build-with-claude/usage-cost-api
- Auth0 Blog — Using Next.js Server Actions to Call External APIs: https://auth0.com/blog/using-nextjs-server-actions-to-call-external-apis/

---
*Architecture research for: Personal dashboard web app (lauOS)*
*Researched: 2026-03-09*
