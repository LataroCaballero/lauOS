# Phase 2: Dashboard Shell - Research

**Researched:** 2026-03-10
**Domain:** Next.js 16 App Router layout, Zustand state management, CSS variable theming, PocketBase file upload, Playwright E2E testing
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Navbar layout:** Sticky top navbar on all screen sizes. Desktop: horizontal nav links + logo left + user avatar/name dropdown right. Mobile: navbar stays top but module links move to fixed bottom navigation bar (icons only). Dark/light toggle icon in navbar.
- **Dark/light mode:** Toggle in navbar AND Settings > Appearance tab. Mechanism: Zustand store + toggle `.dark` class on `<html>`. Persist in `localStorage`.
- **Module card grid:** Icon + name + short description per card. 2-col mobile / 3-4 col desktop CSS grid. Hover scale ~103%. Reuse `src/components/ui/card.tsx`. Active module highlighted with accent color border.
- **Accent color system:** Preset palette of 5-6 colors only (no free picker). Default yellow. Palette: yellow, blue, green, purple, red, orange. Affects primary buttons, active nav indicator, card hover border. Persisted to PocketBase user profile field. Applied via CSS variable on `:root` on load.
- **Settings page:** Two tabs — Profile | Appearance. Profile: display name, avatar upload, password change. Appearance: dark/light toggle, accent color swatches. Avatar: select → crop to square → upload to PocketBase file storage.

### Claude's Discretion
- Exact icon set for module cards (lucide-react already available)
- Specific Zustand store structure for theme state
- Exact CSS variable name for dynamic accent (`--accent` or custom `--color-accent`)
- Loading/skeleton state for accent color fetch on initial page load
- Navbar dropdown animation style
- Bottom nav icon labels vs icons-only on mobile

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SHLL-01 | Top navbar muestra links a módulos, nombre de usuario y opción de logout | Protected layout with `(protected)/layout.tsx`, user data from `createServerClient()`, logout via existing `logoutAction` |
| SHLL-02 | Página home con grid de widgets clickeables (una card por módulo disponible) | Module card grid component using existing `Card` component, CSS grid, `next/link` routing |
| SHLL-03 | Toggle dark/light mode con preferencia persistente | Zustand store + `.dark` on `<html>` + `localStorage`; `@custom-variant dark` already configured in globals.css |
| SHLL-04 | Layout responsive usable en mobile | Tailwind responsive prefixes, bottom nav bar pattern, `overflow-x-hidden` on body |
| SHLL-05 | Color de acento personalizable desde configuración, persistido en perfil de usuario | CSS variable injection on `:root`, PocketBase `users` collection field, `updateAccentAction` server action |
</phase_requirements>

---

## Summary

Phase 2 builds the navigable shell around all future modules. The codebase is Next.js 16 App Router with Tailwind CSS v4, shadcn components, and PocketBase as the backend. Phase 1 established the `(protected)` route group but left it without a shared layout — adding `(protected)/layout.tsx` is the single most important structural step in this phase.

The theme system requires Zustand (not yet installed) to manage dark/light mode and accent color as client state. Dark mode works by toggling `.dark` on `<html>` — the CSS custom variant is already wired in `globals.css`. Accent color requires injecting a CSS variable override at runtime into `:root`. Both must be hydrated from storage on mount (localStorage for theme, PocketBase for accent) without causing hydration mismatch.

Avatar upload requires image cropping to a square before sending to PocketBase. The project already has `@base-ui/react` installed which provides `Dialog`, `Tabs`, and `Menu` primitives. A dedicated crop library (`react-image-crop`) is not installed and will need to be added. The Settings page must be reorganized from its current flat form into a two-tab layout using `@base-ui/react` `Tabs`.

**Primary recommendation:** Install Zustand first. Create `(protected)/layout.tsx` with the navbar before building any other component. Wire CSS variable injection in a client `ThemeProvider` that mounts inside that layout.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.1.6 (pinned) | App Router, Server Components, layouts | Already installed; pinned — do not upgrade |
| zustand | ^5.0 | Client-side theme state (dark/light + accent) | Required by locked decision; not yet installed |
| lucide-react | ^0.577.0 | Icons in navbar, module cards, bottom nav | Already installed via shadcn |
| @base-ui/react | ^1.2.0 | Tabs (Settings), Menu/Dropdown (navbar avatar), NavigationMenu | Already installed; replaces radix-ui |
| tailwindcss | ^4 | Responsive layout, CSS grid, dark class variant | Already installed |
| react-image-crop | ^11.x | Square avatar crop before upload | Not installed; needed for avatar flow |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| sonner | ^2.0.7 | Toast notifications | Already wired in root layout; use for save confirmations |
| pocketbase | ^0.26.8 | Avatar file upload, accent color persistence | Already installed; two-client pattern established |
| tw-animate-css | ^1.4.0 | Card hover scale, dropdown animations | Already installed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @base-ui/react Tabs | Radix UI Tabs | Radix not installed; @base-ui already present — no new dep needed |
| @base-ui/react Menu | Radix Dropdown | Same as above |
| react-image-crop | browser Canvas API | Canvas approach requires custom code; react-image-crop handles cross-browser edge cases |
| Zustand | React Context + useReducer | Context causes full tree re-renders on theme change; Zustand is lighter and supports localStorage middleware |

**Installation (new packages only):**
```bash
cd lauos && npm install zustand react-image-crop
```

---

## Architecture Patterns

### Recommended Project Structure
```
lauos/src/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx               # unchanged
│   ├── (protected)/
│   │   ├── layout.tsx                   # NEW — shared navbar + ThemeProvider
│   │   ├── dashboard/
│   │   │   └── page.tsx                 # Replace stub with ModuleGrid
│   │   ├── settings/
│   │   │   └── page.tsx                 # Reorganize into tabs
│   │   ├── finance/
│   │   │   └── page.tsx                 # NEW — placeholder for Phase 3
│   │   └── [future-modules]/
│   │       └── page.tsx                 # Placeholder stubs
│   ├── layout.tsx                        # Root layout — no navbar here
│   └── globals.css                       # Add accent CSS variable + dark overrides
├── components/
│   ├── layout/
│   │   ├── navbar.tsx                   # NEW — sticky top navbar (server or client)
│   │   ├── bottom-nav.tsx               # NEW — mobile fixed bottom nav (client)
│   │   ├── user-menu.tsx                # NEW — avatar dropdown (client)
│   │   └── theme-toggle.tsx             # NEW — sun/moon toggle button (client)
│   ├── dashboard/
│   │   ├── module-card.tsx              # NEW — single card component
│   │   └── module-grid.tsx              # NEW — grid layout
│   ├── settings/
│   │   ├── profile-tab.tsx              # NEW — display name + avatar + password
│   │   ├── appearance-tab.tsx           # NEW — dark/light toggle + accent swatches
│   │   └── avatar-upload.tsx            # NEW — crop + upload flow
│   └── ui/                              # existing shadcn components
├── lib/
│   ├── store/
│   │   └── theme-store.ts               # NEW — Zustand store
│   ├── actions/
│   │   └── profile.ts                   # EXTEND — add updateAccentAction, updateAvatarAction
│   ├── pocketbase-browser.ts            # unchanged
│   └── pocketbase-server.ts             # unchanged
└── middleware.ts                         # unchanged
```

### Pattern 1: Protected Layout with Server-side User Fetch

The `(protected)/layout.tsx` must be async (Server Component) to read the authenticated user from PocketBase and pass data to the navbar. The navbar receives `user` as a prop and renders the avatar/name. The `ThemeProvider` client wrapper mounts inside the layout to inject CSS variables.

```tsx
// src/app/(protected)/layout.tsx
import { createServerClient } from '@/lib/pocketbase-server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/navbar'
import BottomNav from '@/components/layout/bottom-nav'
import ThemeProvider from '@/components/layout/theme-provider'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const pb = await createServerClient()
  if (!pb.authStore.isValid) redirect('/login')
  const user = pb.authStore.record!

  return (
    <ThemeProvider initialAccent={user.accent ?? 'yellow'}>
      <div className="min-h-screen flex flex-col">
        <Navbar userName={user.name} avatarUrl={user.avatar ? pb.files.getURL(user, user.avatar) : null} />
        <main className="flex-1 overflow-x-hidden">{children}</main>
        <BottomNav />  {/* hidden on md+ via Tailwind */}
      </div>
    </ThemeProvider>
  )
}
```

### Pattern 2: Zustand Theme Store

Theme store manages dark/light mode and accent color. It persists dark mode to localStorage. Accent is loaded from PocketBase via the layout but can be updated client-side after a settings save.

```ts
// src/lib/store/theme-store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type AccentColor = 'yellow' | 'blue' | 'green' | 'purple' | 'red' | 'orange'

interface ThemeState {
  isDark: boolean
  accent: AccentColor
  toggleDark: () => void
  setAccent: (color: AccentColor) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      isDark: false,
      accent: 'yellow',
      toggleDark: () => set((s) => ({ isDark: !s.isDark })),
      setAccent: (accent) => set({ accent }),
    }),
    {
      name: 'lauos-theme',
      // Only persist isDark — accent comes from PocketBase
      partialize: (state) => ({ isDark: state.isDark }),
    }
  )
)
```

### Pattern 3: CSS Variable Accent Injection

Accent color is applied by injecting a CSS variable override on `:root`. The `ThemeProvider` client component handles both dark class toggle and accent variable injection on mount and on store change.

```tsx
// src/components/layout/theme-provider.tsx
'use client'
import { useEffect } from 'react'
import { useThemeStore } from '@/lib/store/theme-store'

const ACCENT_VARS: Record<string, string> = {
  yellow:  'oklch(0.85 0.18 95)',
  blue:    'oklch(0.60 0.22 240)',
  green:   'oklch(0.65 0.20 150)',
  purple:  'oklch(0.60 0.22 290)',
  red:     'oklch(0.60 0.22 25)',
  orange:  'oklch(0.72 0.20 60)',
}

export default function ThemeProvider({
  children,
  initialAccent,
}: {
  children: React.ReactNode
  initialAccent: string
}) {
  const { isDark, accent, setAccent } = useThemeStore()

  // Sync initial accent from PocketBase into store
  useEffect(() => {
    setAccent(initialAccent as any)
  }, [initialAccent, setAccent])

  // Apply dark class
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark])

  // Apply accent CSS variable
  useEffect(() => {
    document.documentElement.style.setProperty('--primary', ACCENT_VARS[accent] ?? ACCENT_VARS.yellow)
  }, [accent])

  return <>{children}</>
}
```

**Key insight on hydration:** Because `ThemeProvider` is client-only and uses `useEffect`, the initial server render will always output without `.dark` class and without accent override. This is acceptable — there will be a brief flash on first paint. To suppress it, add an inline script in `layout.tsx` `<head>` that reads localStorage synchronously before React hydrates. This is the industry-standard pattern (next-themes uses the same approach).

### Pattern 4: Avatar Upload with Square Crop

Avatar upload uses `react-image-crop` in a modal (using `@base-ui/react` Dialog). The flow is: file input → show cropper → confirm → convert to Blob → send to PocketBase as FormData.

```ts
// src/lib/actions/profile.ts (new action)
export async function updateAvatarAction(userId: string, formData: FormData) {
  const pb = await createServerClient()
  await pb.collection('users').update(userId, formData)
  revalidatePath('/settings')
  return { success: true }
}
```

PocketBase file field name must match what's configured in the `users` collection schema. The field name should be `avatar` (single file). The `pb.files.getURL(record, record.avatar)` pattern retrieves the URL for display.

### Anti-Patterns to Avoid
- **Sharing the navbar user fetch with middleware:** Middleware already validates auth. The layout's `createServerClient()` call is a second independent PocketBase instance — this is expected and correct per the two-client pattern.
- **Putting ThemeProvider in root layout:** The root layout is a Server Component. ThemeProvider must live inside `(protected)/layout.tsx` where it can co-exist with client components. Alternatively, wrap in a thin client boundary.
- **Setting `.dark` class via Tailwind utilities:** The `.dark` class must be toggled on `<html>` (the `documentElement`), not on `<body>` or any child. The `@custom-variant dark (&:is(.dark *))` in globals.css scopes to `html.dark` descendants.
- **Persisting accent to both localStorage and PocketBase:** Accent comes from PocketBase on load (so it's cross-device). Only dark/light mode preference lives in localStorage. Do not double-persist accent to localStorage.
- **Using `<img>` for PocketBase avatars without size params:** PocketBase's file API supports thumbnail generation via query params (`?thumb=100x100`). Always request sized thumbnails in the navbar to avoid loading full-resolution images.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tabs UI | Custom tab state + panels | `@base-ui/react` Tabs | Already installed; handles keyboard nav, ARIA roles, focus management |
| Avatar dropdown | Custom positioned div | `@base-ui/react` Menu | Already installed; handles portal, click-outside, keyboard navigation |
| Image cropping | Canvas API crop logic | `react-image-crop` | Handles aspect ratio enforcement, touch/mobile crop handles, pixel ratio |
| Dark mode SSR flash | Manual inline script | Standard inline script pattern (below) | One-liner; avoid re-inventing next-themes behavior |
| Responsive hiding | JS window.width checks | Tailwind `md:hidden` / `md:flex` | Zero JS, no layout shift |

**Inline script to prevent dark mode flash (add to `<head>` in root layout):**
```html
<script dangerouslySetInnerHTML={{ __html: `
  try {
    const t = JSON.parse(localStorage.getItem('lauos-theme') || '{}')
    if (t.state?.isDark) document.documentElement.classList.add('dark')
  } catch {}
` }} />
```

---

## Common Pitfalls

### Pitfall 1: Zustand Hydration Mismatch
**What goes wrong:** Zustand `persist` middleware reads localStorage during hydration. On the server, localStorage is undefined — the store initializes with defaults. On the client, localStorage may have `isDark: true`. This causes React to throw a hydration mismatch error on elements that change based on `isDark`.
**Why it happens:** Server renders with `isDark: false`, client immediately applies `isDark: true` from localStorage. The DOM tree differs.
**How to avoid:** Keep theme application in `useEffect` (never in render). Never conditionally render different elements based on `isDark`. Use CSS class toggling only. The inline script in `<head>` (above) sets the class before React mounts, so the first paint matches what React expects.
**Warning signs:** React console error "Hydration failed because the server rendered HTML didn't match the client."

### Pitfall 2: PocketBase `files.getURL` Returns Empty String Before Auth
**What goes wrong:** `pb.files.getURL(user, user.avatar)` is called server-side in the layout, but if `user.avatar` is an empty string or undefined (no avatar uploaded yet), the result is an empty URL that gets passed to `<img src="">` causing a browser request to the current page.
**How to avoid:** Always guard: `user.avatar ? pb.files.getURL(user, user.avatar, { thumb: '64x64' }) : null` and conditionally render `<img>` vs a fallback initials avatar.
**Warning signs:** Extra 404 requests in network tab when no avatar is set.

### Pitfall 3: Bottom Nav Overlaps Content on Mobile
**What goes wrong:** Fixed bottom nav (`position: fixed; bottom: 0`) overlaps the last content on the page on mobile browsers, especially with safe-area insets on iOS.
**How to avoid:** Add `pb-16 md:pb-0` to `<main>` — 4rem bottom padding on mobile, none on desktop. Also add `padding-bottom: env(safe-area-inset-bottom)` to the bottom nav container for notched phones.
**Warning signs:** Last card in module grid is partially hidden behind bottom nav on iPhone.

### Pitfall 4: `(protected)/layout.tsx` Re-fetching User on Every Navigation
**What goes wrong:** Server Component layouts re-run on every navigation, causing a PocketBase request per page visit.
**Why it's acceptable:** This is expected behavior for Server Components. The auth cookie is already set by middleware. PocketBase `createServerClient()` is lightweight (no network call — just reads cookie). `authRefresh()` is only done in middleware, not in the layout.
**How to verify:** The layout's `createServerClient()` does NOT call `authRefresh()` — it only reads the existing cookie. Keep it that way.

### Pitfall 5: Accent Color Not Updating Immediately After Settings Save
**What goes wrong:** The settings page saves accent to PocketBase via Server Action. But the ThemeProvider reads accent from the Zustand store. If the store isn't updated after save, the UI won't reflect the change until the next page load.
**How to avoid:** In the Appearance tab component, after a successful `updateAccentAction`, call `setAccent(newColor)` from `useThemeStore()` directly — this triggers the `useEffect` that updates the CSS variable immediately.
**Warning signs:** User changes accent, clicks save, color doesn't change until refresh.

### Pitfall 6: `react-image-crop` Requires CSS Import
**What goes wrong:** `react-image-crop` ships its own CSS for the crop handles. Without importing it, the crop UI renders without visual handles.
**How to avoid:** Add `import 'react-image-crop/dist/ReactCrop.css'` in the avatar upload component.
**Warning signs:** Crop overlay appears but drag handles are invisible.

---

## Code Examples

### Module Definition Array (source for card grid and nav)
```ts
// src/lib/modules.ts
export const MODULES = [
  { id: 'finance', name: 'Finanzas', description: 'Track accounts and transactions', icon: 'Wallet', href: '/finance' },
  // Phase 3+ modules (placeholders for now):
  // { id: 'notes', name: 'Notas', description: 'Personal notes with tags', icon: 'FileText', href: '/notes' },
] as const
```

A single source of truth drives both the navbar links and the module card grid. Adding a new module to this array propagates everywhere.

### PocketBase Avatar URL with Thumbnail
```ts
// Usage in server component
const avatarUrl = user.avatar
  ? pb.files.getURL(user, user.avatar, { thumb: '64x64' })
  : null
```

### Zustand Store with Persist (partial)
```ts
// Only isDark is persisted to localStorage; accent is driven by PocketBase
partialize: (state) => ({ isDark: state.isDark })
```

### Tailwind Responsive Visibility Pattern
```tsx
{/* Desktop nav links — hidden on mobile */}
<nav className="hidden md:flex gap-4">...</nav>

{/* Bottom nav — visible only on mobile */}
<nav className="fixed bottom-0 left-0 right-0 md:hidden flex justify-around ...">...</nav>
```

### PocketBase Update User Field (accent + avatar)
```ts
// Accent color (string field — add to users collection schema)
await pb.collection('users').update(userId, { accent: 'blue' })

// Avatar (file field — multipart)
const formData = new FormData()
formData.append('avatar', blob, 'avatar.jpg')
await pb.collection('users').update(userId, formData)
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Radix UI primitives | @base-ui/react (MUI team's next-gen) | ~2024 | Already installed in this project; prefer over adding new radix deps |
| next-themes for dark mode | Zustand + manual class toggle | Locked decision | Simpler; avoids next-themes overhead; project already uses Zustand for auth |
| Tailwind v3 `dark:` | Tailwind v4 `@custom-variant dark` | Tailwind v4 (installed) | Already configured; `dark:` variant works through `@custom-variant dark (&:is(.dark *))` |
| `pages/` router layouts | App Router `layout.tsx` nesting | Next.js 13+ | Already using App Router; nested layouts are the correct pattern |

**Deprecated/outdated:**
- `next-themes`: Do not add. The locked decision explicitly specifies Zustand + manual `.dark` toggle.
- Radix UI packages (`@radix-ui/react-*`): Do not add new ones. `@base-ui/react` is already installed and provides the same primitives.

---

## PocketBase Schema Changes Required

Phase 2 requires two new fields on the `users` collection in PocketBase (must be added manually via PocketBase Admin UI or migration script before implementation):

| Field Name | Type | Notes |
|------------|------|-------|
| `accent` | Text (plain) | Stores color key string: `'yellow'`, `'blue'`, etc. Default: `'yellow'` |
| `avatar` | File (single, image types only) | Profile photo; max recommended 2MB |

These fields must exist before `updateAccentAction` and `updateAvatarAction` server actions can write to them. The PocketBase URL is the VPS instance at the configured `NEXT_PUBLIC_PB_URL`.

---

## Open Questions

1. **Playwright `baseURL` is `localhost:3000` but dev server runs on port 3005**
   - What we know: `playwright.config.ts` has `baseURL: 'http://localhost:3000'` and `webServer.url: 'http://localhost:3000'`. STATE.md records port 3005 as the active dev port (port 3000 is taken on the VPS).
   - What's unclear: Whether tests run locally (port 3005) or on VPS (where port 3000 may be free). The `reuseExistingServer: !process.env.CI` flag suggests tests run locally in dev.
   - Recommendation: Update `playwright.config.ts` `baseURL` and `webServer.url` to `http://localhost:3005` for local development. Document this in Wave 0.

2. **PocketBase `users` schema extensibility**
   - What we know: Phase 1 used `name` and password fields. No `accent` or `avatar` field confirmed to exist.
   - What's unclear: Whether the admin has already added these fields (the Phase 1 plans may have created them).
   - Recommendation: Wave 0 of Plan 02-01 should verify field existence and add if missing. The planner should include a PocketBase schema check step.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright 1.58.2 |
| Config file | `lauos/playwright.config.ts` |
| Quick run command | `cd lauos && npx playwright test tests/shell.spec.ts` |
| Full suite command | `cd lauos && npx playwright test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SHLL-01 | Navbar shows module links, user name, logout option on every protected page | E2E (Playwright) | `npx playwright test tests/shell.spec.ts -g "navbar"` | ❌ Wave 0 |
| SHLL-02 | Home page shows module card grid; clicking a card navigates to module route | E2E (Playwright) | `npx playwright test tests/shell.spec.ts -g "module grid"` | ❌ Wave 0 |
| SHLL-03 | Dark/light toggle applies `.dark` class immediately; preference survives refresh | E2E (Playwright) | `npx playwright test tests/shell.spec.ts -g "dark mode"` | ❌ Wave 0 |
| SHLL-04 | No horizontal scroll on 375px viewport; no clipped content | E2E (Playwright) | `npx playwright test tests/shell.spec.ts -g "mobile layout"` | ❌ Wave 0 |
| SHLL-05 | Accent color change reflects in UI immediately; persists after refresh | E2E (Playwright) | `npx playwright test tests/shell.spec.ts -g "accent color"` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `cd lauos && npx playwright test tests/shell.spec.ts --reporter=line`
- **Per wave merge:** `cd lauos && npx playwright test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `lauos/tests/shell.spec.ts` — covers SHLL-01 through SHLL-05
- [ ] Update `lauos/playwright.config.ts` `baseURL` and `webServer.url` from port 3000 to port 3005
- [ ] PocketBase schema: add `accent` (Text) and `avatar` (File) fields to `users` collection

---

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection (`lauos/src/**`) — current state of all Phase 1 files
- `lauos/package.json` — verified installed packages and versions
- `lauos/src/app/globals.css` — confirmed `@custom-variant dark` and CSS variable structure
- `lauos/playwright.config.ts` + `lauos/tests/*.spec.ts` — confirmed Playwright as test framework

### Secondary (MEDIUM confidence)
- Zustand docs (zustand.pmnd.rs) — `persist` middleware `partialize` pattern; store structure
- react-image-crop GitHub (v11) — CSS import requirement, aspect ratio enforcement
- @base-ui/react package inspection — confirmed Tabs, Menu, Dialog, Switch components available

### Tertiary (LOW confidence)
- PocketBase file URL pattern with `thumb` param — based on PocketBase v0.26.x docs pattern; verify against actual installed version (0.26.8)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified from package.json and node_modules inspection
- Architecture: HIGH — derived directly from existing codebase patterns
- Pitfalls: HIGH — based on known Next.js/Zustand/Tailwind v4 behaviors, verified against codebase
- PocketBase schema: MEDIUM — fields inferred as needed; actual schema state not inspected (admin UI required)

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (stable stack; Zustand/Next.js APIs unlikely to change)
