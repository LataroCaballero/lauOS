# Phase 2: Dashboard Shell - Context

**Gathered:** 2026-03-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the navigable shell that wraps all future modules: a sticky top navbar, a home page with a clickable module card grid, dark/light mode toggle, responsive mobile layout with bottom navigation, and accent color customization persisted to PocketBase. Also includes avatar upload (explicitly deferred from Phase 1). Does NOT include any module content — cards link to placeholder module pages.

</domain>

<decisions>
## Implementation Decisions

### Navbar layout
- Sticky top navbar on all screen sizes — always visible
- Desktop: horizontal nav links to modules, app logo/name on left, user avatar + name on right
- User avatar + name opens a dropdown with Settings link and Logout action
- Dark/light mode toggle icon (sun/moon) in the navbar — accessible from every page
- Mobile: navbar stays at top but module links move to a **bottom navigation bar** (fixed at bottom, icons only)

### Dark/light mode
- Toggle available in **both** the navbar (quick access) and the Settings page (Appearance tab)
- Mechanism: Zustand store + toggle class on `<html>` (`.dark`) — matches existing `@custom-variant dark` in globals.css
- Preference persisted in `localStorage` — survives refresh and new tabs

### Module card grid (home page)
- Each card shows: **icon + module name + short description** (e.g., 💰 Finanzas / "Track accounts and transactions")
- Layout: 2 columns on mobile, 3–4 columns on desktop (responsive CSS grid)
- Hover/tap interaction: card scales up slightly (~103%) — bouncy, tactile feedback
- Reuses the existing `Card` component (`src/components/ui/card.tsx`) — rounded-xl, ring shadow style
- Active/current module highlighted with accent color border

### Accent color system
- **Preset palette of 5–6 colors** — no free color picker
- Default accent: **yellow** (matches PROJECT.md "acento amarillo" reference style)
- Suggested palette: yellow (default), blue, green, purple, red, orange
- Accent affects: primary buttons, active nav item indicator, card hover border highlight
- Selected accent persisted to PocketBase user profile field — survives cross-device/session
- On load: fetch user profile, apply accent CSS variable to `:root`

### Settings page
- **Two tabs: Profile | Appearance**
  - Profile tab: display name, avatar upload, password change
  - Appearance tab: dark/light mode toggle, accent color picker (preset swatches)
- Avatar upload included in Phase 2 (deferred from Phase 1)
- Avatar flow: select file → **crop to square preview** before confirming upload → store in PocketBase file storage
- No free crop — enforce square aspect ratio only
- Uploaded avatar displays in navbar dropdown next to user name

### Claude's Discretion
- Exact icon set for module cards (lucide-react already available via shadcn)
- Specific Zustand store structure for theme state
- Exact CSS variable name for dynamic accent (`--accent` or custom `--color-accent`)
- Loading/skeleton state for accent color fetch on initial page load
- Navbar dropdown animation style
- Bottom nav icon labels vs icons-only on mobile

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/ui/card.tsx`: Full Card component (Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter) — rounded-xl, ring-1 shadow, size variants. Use directly for module grid cards.
- `src/components/ui/button.tsx`: Button component — will need accent color wired to `--primary` CSS variable
- `src/lib/pocketbase-browser.ts` + `pocketbase-server.ts`: Two-client pattern established — use for fetching/updating user profile (accent color field)
- `src/lib/actions/profile.ts`: Server action for profile updates — extend to include accent color field

### Established Patterns
- Route groups: `(auth)` for public, `(protected)` for authenticated pages — navbar belongs in `(protected)` layout
- CSS variables in `globals.css`: `--primary`, `--accent`, etc. mapped via `@theme inline` — accent color injection goes here at runtime
- `.dark` class on `<html>` for dark mode — `@custom-variant dark (&:is(.dark *))` already configured
- Inter font locked from Phase 1 (layout.tsx) — note: visual references show Urbanist/Outfit fonts, but Inter is the established font for this project
- sonner `<Toaster>` already in root layout

### Integration Points
- `(protected)` group needs a shared layout file (`layout.tsx`) with navbar — currently has none (Phase 1 pages use their own `<main>` wrappers)
- `/settings` page exists — needs to be reorganized into tabs and extended with Appearance section
- Accent CSS variable must be injected into `:root` on the client — needs a client component wrapper or `useEffect` in the protected layout
- Module card links point to future routes (`/finance`, etc.) — use placeholder pages for now

</code_context>

<specifics>
## Specific Ideas

- Visual references show a clean top horizontal navbar with module links as pill/underline active indicators — not a sidebar
- Multiple references use a **glassmorphism / frosted card** aesthetic for certain highlight elements — can be used sparingly for hero/header areas
- One reference shows a left sidebar layout (darker theme) — user is NOT going for this; top navbar confirmed
- Card hover scale (~103%) matches the "bouncy" feel seen in the mobile app reference (Payrix-style)
- Mobile reference shows bottom nav with icon tabs at the bottom — matches user's choice exactly
- Accent yellow should feel warm/energetic — reference style uses #76FB91 (green) in one palette and orange/yellow in another; calibrate yellow to be readable on both light and dark backgrounds
- Settings with tabs (Profile | Appearance) is the cleaner organization for future extensibility — user confirmed tabs explicitly

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-dashboard-shell*
*Context gathered: 2026-03-10*
