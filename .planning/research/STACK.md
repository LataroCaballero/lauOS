# Stack Research

**Domain:** Personal dashboard web app (modular, single-user)
**Researched:** 2026-03-09
**Confidence:** HIGH (core stack verified via npm + official docs; patterns verified via official PocketBase discussions and Next.js blog)

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | 15.x (15.5.x) | Frontend framework, routing, SSR/SSG | Next.js 16 is newly stable (Dec 2025) but has documented production breakages around middleware. v15 is the battle-tested line. App Router is now the standard; Pages Router is legacy. Use 15 until v16.1 stabilizes. |
| PocketBase JS SDK | 0.26.8 | Backend client — auth, DB, file storage | Official SDK for PocketBase. All auth, CRUD, and realtime operations go through this. Do NOT use fetch directly — the SDK manages auth token refreshes and SSE streams. |
| TypeScript | 5.x (bundled with Next.js) | Type safety across the entire codebase | shadcn/ui, TanStack Query, and Zod all have first-class TS support. Not optional for a modular dashboard that will grow. |
| Tailwind CSS | 4.2.1 | Utility-first styling | shadcn/ui fully migrated to Tailwind v4 as of Feb 2025. v4 uses `@theme` CSS variables (no config JS file), OKLCH colors, and faster compilation. New projects should start on v4. |
| shadcn/ui | latest (CLI-based, not versioned) | UI component library | Not a dependency — components are copied into your repo. Built on Radix UI primitives. Ships accessible, composable components that own the design system. The reference design (clean/modern, accent color, card-heavy) maps perfectly to shadcn's defaults. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| TanStack Query (React Query) | 5.90.21 | Server state management — fetching, caching, revalidation | All PocketBase API calls: transactions, accounts, Claude stats. Handles loading/error states, background refresh, stale-while-revalidate. Replaces manual useEffect+fetch patterns. |
| Zustand | 5.0.11 | Client state management — UI state, user preferences | Global state that is NOT server data: sidebar open/close, active currency display, selected module. Do NOT use for data fetched from PocketBase. |
| React Hook Form | 7.71.2 | Form state management | Transaction entry forms, account creation, settings. Uncontrolled-component model = fast re-render. Pairs natively with shadcn/ui Form component. |
| Zod | 4.3.6 | Schema validation | Validate form inputs (transaction amounts, account names, categories). Shared schemas work for both client-side validation and server-side type safety. Use `zodResolver` from `@hookform/resolvers`. |
| @hookform/resolvers | 5.2.2 | Bridge between React Hook Form and Zod | Required glue package. Use `zodResolver(schema)` as the `resolver` in `useForm`. |
| Recharts | 3.8.0 | Charts for finance/stats visualization | shadcn/ui's `Chart` component wraps Recharts. Use shadcn chart primitives (AreaChart, BarChart, LineChart) — they add consistent theming and tooltip styling on top of Recharts. Do NOT import Recharts directly; go through shadcn's chart system. |
| lucide-react | 0.577.0 | Icon library | Ships as shadcn/ui's default icon set. Consistent icon style across the dashboard. 1500+ icons. Already installed when you init shadcn. |
| Resend SDK | 6.9.3 | Transactional email sending | Budget alerts, auth emails, future notification system. Call only from Next.js Server Actions or API routes — never client-side (exposes API key). |
| @react-email/components | 1.0.8 | Email templates in React | Compose email bodies as React components. Used together with Resend: `resend.emails.send({ react: <MyEmailTemplate /> })`. The Resend co-founder also created React Email — they are designed as a pair. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| ESLint (explicit config) | Linting | Next.js 15.5 deprecated `next lint`; generate an explicit `eslint.config.mjs` at project init. `next lint` is removed in v16. |
| Turbopack | Dev server bundler | Default dev bundler since Next.js 15. Enable for builds in v16: `next build --turbopack` (beta in 15.5, default in 16). |
| `next typegen` | Route type generation | New in Next.js 15.5. Run before `tsc --noEmit` in CI to validate typed routes. Enable `typedRoutes: true` in `next.config.ts`. |

---

## PocketBase + Next.js Auth Pattern

PocketBase's own maintainer explicitly warns that SSR + PocketBase requires careful implementation. The safe pattern for Next.js App Router:

**Rule: Create a new PocketBase instance per request on the server. Never share a singleton server-side.**

```
// lib/pocketbase.ts
import PocketBase from 'pocketbase'

// Client components: single instance (safe, browser lifecycle)
export const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL)

// Server components / middleware: factory function (safe, request-scoped)
export function createServerPocketBase() {
  return new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL)
}
```

Auth token lives in a cookie (`pb_auth`). Middleware reads the cookie, loads it into the instance, refreshes if needed, and writes changes back to response cookies. This enables SSR route protection without shared-state bugs.

**For this project (single-user dashboard):** Most data fetching will be client-side via TanStack Query. SSR is used only for the initial auth check and redirects. This is the safest and simplest approach.

---

## Multi-Currency Display (ARS + USD)

No external currency library needed. Use the native `Intl.NumberFormat` API:

```typescript
// utils/currency.ts
export function formatCurrency(amount: number, currency: 'ARS' | 'USD'): string {
  const locale = currency === 'ARS' ? 'es-AR' : 'en-US'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}
// formatCurrency(1500.5, 'ARS') → '$1.500,50'
// formatCurrency(1500.5, 'USD') → '$1,500.50'
```

Store amounts as integers in cents in PocketBase to avoid floating-point errors. Store currency as a string field (`ARS` | `USD`).

---

## Installation

```bash
# Bootstrap Next.js 15 with App Router + TypeScript + Tailwind v4
npx create-next-app@15 lauOS --typescript --tailwind --eslint --app

# PocketBase client
npm install pocketbase

# State management
npm install @tanstack/react-query zustand

# Forms + validation
npm install react-hook-form zod @hookform/resolvers

# Charts (via shadcn — add recharts as peer dep)
npm install recharts

# Email
npm install resend @react-email/components react-email

# shadcn/ui (interactive CLI — run after bootstrap)
npx shadcn@latest init
# Then add components as needed:
npx shadcn@latest add card button input form chart sidebar
```

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Next.js version | 15.x (pin to 15.5) | 16.x (latest) | Next.js 16 broke production for some teams (middleware runtime issues documented). Wait until 16.2+ for greenfield projects. |
| UI components | shadcn/ui | Mantine, Ant Design, MUI | Those are full libraries — harder to customize per a specific design system. shadcn gives you the source; you own the components. |
| Charts | shadcn/ui Chart (Recharts) | Tremor | Tremor is built on top of Recharts too, adds another abstraction layer, and its download count is 68x lower than Recharts. shadcn's chart integration is the cleaner path since we're already using shadcn for everything else. |
| Charts | shadcn/ui Chart (Recharts) | Chart.js / Victory | Recharts is React-native (JSX API, SVG). Chart.js is imperative canvas; worse DX in React. |
| State (server) | TanStack Query | SWR | TanStack Query v5 has better Suspense streaming support with Next.js App Router, richer devtools, and is the current community consensus. |
| State (client) | Zustand | Jotai, Redux | Zustand is the 2025 standard for lightweight client state. Redux is overkill for a single-user personal dashboard. |
| Forms | React Hook Form + Zod | Conform (server actions) | For a dashboard with mostly client-side CRUD (PocketBase direct calls), RHF + Zod is the right level. Conform is optimized for Server Actions — not needed here. |
| Email templates | React Email | Handlebars / MJML | React Email is authored by the Resend team and is the idiomatic pair. Components render consistently across email clients. |
| Currency formatting | `Intl.NumberFormat` (native) | `dinero.js`, `currency.js` | Native API handles ARS and USD perfectly. No extra dependency justified for two currencies. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Redux / Redux Toolkit | Massive boilerplate for a single-user dashboard. 2025 consensus: use TanStack Query + Zustand. | TanStack Query (server state) + Zustand (client state) |
| NextAuth.js / Auth.js | PocketBase provides auth out of the box. Adding NextAuth creates a duplicate auth layer with no benefit. | PocketBase SDK auth (`pb.authStore`) |
| Prisma / Drizzle ORM | PocketBase IS the database. Using an ORM to talk to PocketBase's SQLite directly would bypass PocketBase's access rules and real-time features. | PocketBase JS SDK |
| Axios | Redundant when PocketBase SDK handles all API requests internally. | PocketBase SDK for PocketBase calls; native `fetch` for the Anthropic usage API. |
| Tremor | Built on Recharts, adds abstraction without meaningful upside when you already have shadcn/ui's chart system. 68x fewer downloads than Recharts. | shadcn/ui Chart components |
| `pages/` directory (Pages Router) | Legacy Next.js routing model. App Router is the standard for all new Next.js projects. | App Router (`app/` directory) |
| Shared PocketBase singleton on the server | Leads to user auth token bleed-over between requests (security bug). This is PocketBase's #1 reported SSR pitfall. | Factory function that creates a new instance per server request. |
| `localStorage` for auth token in SSR context | Not available server-side; causes hydration errors. | Cookie-based auth via PocketBase's `loadAuthCookie` / middleware pattern. |

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| Next.js 15.x | React 18 or 19 | Both supported. React 19 is default with `create-next-app@15`. No breaking changes for this stack. |
| shadcn/ui (Tailwind v4 path) | Tailwind CSS 4.x, React 18+ | Feb 2025 migration completed. `npx shadcn@latest init` picks v4 automatically on new projects. |
| TanStack Query v5 | React 18+ | v5 dropped the deprecated `useQuery` callback APIs. Use object-form query options. |
| React Hook Form v7 | React 18+ | Compatible with React 19. Works with shadcn/ui's `<Form>` component wrapper. |
| recharts v3 | React 18+ | shadcn chart components target recharts v3 (current). Shadcn was working on upgrading from v2 during 2024; v3 is now the correct target. |
| pocketbase 0.26.x | Node.js 18+, all modern browsers | SSR: create new instance per request. Client: single global instance. |

---

## Stack Patterns by Scenario

**For PocketBase data fetching (transactions, accounts, stats):**
- Use TanStack Query `useQuery` / `useMutation`
- Call `pb.collection('transactions').getList()` inside query functions
- Mutations call `pb.collection('transactions').create()` then `queryClient.invalidateQueries()`

**For auth state (is user logged in, who are they):**
- Use Zustand store that wraps `pb.authStore`
- Subscribe to `pb.authStore.onChange` to keep store in sync
- Middleware reads `pb_auth` cookie, creates server-scoped pb instance, redirects if not authenticated

**For charts (Finance module — account balances, transaction history):**
- Use shadcn `<ChartContainer>` wrapping Recharts components
- AreaChart for balance over time; BarChart for spending by category; PieChart for account distribution

**For email (alerts, future notifications):**
- Next.js Server Action calls `resend.emails.send({ react: <AlertEmail /> })`
- Never import `resend` in a client component

---

## Sources

- Next.js 15.5 official blog — https://nextjs.org/blog/next-15-5 (HIGH confidence — official)
- Next.js 16 stable release — https://nextjs.org/blog/next-16 (HIGH confidence — official)
- PocketBase JS SDK GitHub releases — https://github.com/pocketbase/js-sdk/releases (HIGH confidence — official)
- PocketBase official SSR caution — https://github.com/pocketbase/pocketbase/discussions/4973 (HIGH confidence — from PocketBase maintainer)
- PocketBase Next.js 15 auth discussion — https://github.com/pocketbase/pocketbase/discussions/6930 (MEDIUM confidence — community)
- shadcn/ui Tailwind v4 migration — https://ui.shadcn.com/docs/tailwind-v4 (HIGH confidence — official)
- shadcn/ui Chart component — https://ui.shadcn.com/docs/components/radix/chart (HIGH confidence — official)
- TanStack Query + Zustand 2025 consensus — https://www.bugragulculer.com/blog/good-bye-redux-how-react-query-and-zustand-re-wired-state-management-in-25 (MEDIUM confidence — WebSearch verified against multiple sources)
- React Hook Form + shadcn/ui — https://ui.shadcn.com/docs/forms/react-hook-form (HIGH confidence — official)
- Resend + Next.js — https://resend.com/docs/send-with-nextjs (HIGH confidence — official)
- Recharts npm trends vs Tremor — https://npmtrends.com/@tremor/react-vs-chart.js-vs-d3-vs-echarts-vs-plotly.js-vs-recharts (MEDIUM confidence — empirical download data)
- npm package versions verified 2026-03-09 via `npm show [package] version`

---
*Stack research for: lauOS — personal dashboard web app (Next.js + PocketBase + Vercel)*
*Researched: 2026-03-09*
