---
phase: 02-dashboard-shell
plan: 03
subsystem: ui
tags: [react-image-crop, zustand, pocketbase, base-ui, tabs, avatar, accent-color, settings]

# Dependency graph
requires:
  - phase: 02-dashboard-shell plan 01
    provides: Protected shell, navbar with user-menu showing avatar, PocketBase users collection with accent and avatar fields
  - phase: 02-dashboard-shell plan 02
    provides: Zustand theme store (useThemeStore, setAccent), ThemeProvider applying --primary CSS variable, AccentColor type
  - phase: 01-foundation-auth
    provides: createServerClient, profile.ts updateDisplayNameAction and updatePasswordAction
provides:
  - Tabbed Settings page (Perfil / Apariencia) using @base-ui/react Tabs
  - Avatar upload with square crop via react-image-crop and canvas API, stored in PocketBase
  - updateAccentAction and updateAvatarAction server actions in profile.ts
  - Accent color swatches with immediate UI update + PocketBase persistence
  - Profile tab with avatar upload, display name, and password change forms
affects: [navbar avatar display, theme system, all pages using accent color]

# Tech tracking
tech-stack:
  added: [react-image-crop@latest]
  patterns:
    - Avatar crop: FileReader API → ReactCrop dialog → canvas.drawImage → canvas.toBlob → FormData → Server Action
    - Accent persistence: setAccent() (immediate store update) before awaiting updateAccentAction (background PocketBase save)
    - base-ui import pattern: import { Tabs } from '@base-ui/react' (not sub-path @base-ui/react/tabs)

key-files:
  created:
    - lauos/src/components/settings/avatar-upload.tsx
    - lauos/src/components/settings/profile-tab.tsx
    - lauos/src/components/settings/appearance-tab.tsx
  modified:
    - lauos/src/app/(protected)/settings/page.tsx
    - lauos/src/lib/actions/profile.ts

key-decisions:
  - "base-ui import pattern is import { Tabs } from '@base-ui/react' not import * as Tabs from '@base-ui/react/tabs' — matches existing project patterns (user-menu uses Menu the same way)"
  - "Avatar cropped to 256x256px JPEG (0.9 quality) via canvas API before FormData upload — reduces file size while maintaining quality"
  - "setAccent() called synchronously before updateAccentAction awaited — ensures immediate UI response without waiting for PocketBase roundtrip"

patterns-established:
  - "Pattern: Immediate optimistic update (setAccent) before background server action (updateAccentAction) in startTransition"
  - "Pattern: Canvas-based image crop for avatar: canvas.drawImage with natural/displayed pixel ratio correction"

requirements-completed: [SHLL-05]

# Metrics
duration: 4min
completed: 2026-03-10
---

# Phase 2 Plan 03: Settings Tabs, Avatar Upload, and Accent Persistence Summary

**Tabbed Settings page (Perfil/Apariencia) with react-image-crop square avatar upload, 6 accent swatches for immediate CSS variable update, and PocketBase persistence for both avatar and accent**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-03-10T21:12:29Z
- **Completed:** 2026-03-10T21:16:00Z
- **Tasks:** 2 auto tasks complete (checkpoint pending human verification)
- **Files modified:** 5 (3 created, 2 modified)

## Accomplishments
- Settings page rewritten as async Server Component with @base-ui/react Tabs (Perfil / Apariencia), client-side tab switching without reload
- Profile tab: avatar upload with react-image-crop square crop dialog, display name form, password change form — all calling existing server actions
- Appearance tab: dark mode toggle wired to useThemeStore, 6 accent color swatches with immediate setAccent() + background PocketBase persistence via updateAccentAction
- Extended profile.ts with updateAccentAction (persists accent field to PocketBase users collection) and updateAvatarAction (multipart FormData upload to PocketBase)

## Task Commits

Each task was committed atomically:

1. **Task 1: Settings tabs shell, Profile tab, and server actions** - `deac9c6` (feat)
2. **Task 2: Appearance tab with accent swatches and dark mode toggle** - `3b83930` (feat)

## Files Created/Modified
- `lauos/src/app/(protected)/settings/page.tsx` - Async Server Component with @base-ui/react Tabs.Root, fetches user and avatar URL from PocketBase
- `lauos/src/lib/actions/profile.ts` - Extended with updateAccentAction and updateAvatarAction (revalidatePath('/', 'layout') on both)
- `lauos/src/components/settings/avatar-upload.tsx` - File input + ReactCrop dialog + canvas crop to 256x256 JPEG + FormData upload
- `lauos/src/components/settings/profile-tab.tsx` - Avatar section, display name form, password change form
- `lauos/src/components/settings/appearance-tab.tsx` - Dark mode toggle + 6 accent swatches with data-testid attributes

## Decisions Made
- `@base-ui/react` import pattern confirmed: `import { Tabs } from '@base-ui/react'` — not sub-path imports (consistent with user-menu.tsx using Menu the same way)
- Canvas crops avatar to 256x256 JPEG before upload — standardized avatar size for navbar display
- `setAccent()` called before awaiting action — optimistic update pattern for responsive UX

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed wrong base-ui package import path**
- **Found during:** Task 1 (build verification)
- **Issue:** Plan specified `@base-ui-components/react/tabs` and `@base-ui-components/react/dialog` but installed package is `@base-ui/react`
- **Fix:** Changed to `import { Tabs } from '@base-ui/react'` and `import { Dialog } from '@base-ui/react'` matching existing project patterns
- **Files modified:** settings/page.tsx, avatar-upload.tsx
- **Verification:** Build passes cleanly
- **Committed in:** deac9c6 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking import path)
**Impact on plan:** Required fix — plan used wrong package name. No scope changes.

## Issues Encountered
- Playwright accent color test (`npx playwright test tests/shell.spec.ts -g "accent color"`) not run — no running dev server with real PocketBase credentials in this execution environment. Build passes with zero TypeScript errors. Manual verification via checkpoint will confirm swatch behavior.

## User Setup Required
None — PocketBase `accent` and `avatar` fields were already noted as requirements in 02-01 decisions (must be added manually to users collection via PocketBase Admin UI before running).

## Next Phase Readiness
- Settings page fully functional: tabbed layout, avatar upload, accent swatches, password change
- SHLL-05 (accent color persistence) complete: immediate CSS variable update + PocketBase save
- Navbar avatar will update after upload due to `revalidatePath('/', 'layout')` in updateAvatarAction
- Phase 2 (Dashboard Shell) fully complete after checkpoint approval

---
*Phase: 02-dashboard-shell*
*Completed: 2026-03-10*

## Self-Check: PASSED

- lauos/src/components/settings/avatar-upload.tsx — FOUND
- lauos/src/components/settings/profile-tab.tsx — FOUND
- lauos/src/components/settings/appearance-tab.tsx — FOUND
- lauos/src/app/(protected)/settings/page.tsx — FOUND (modified)
- lauos/src/lib/actions/profile.ts — FOUND (modified)
- .planning/phases/02-dashboard-shell/02-03-SUMMARY.md — FOUND
- Commit deac9c6 (Task 1) — FOUND
- Commit 3b83930 (Task 2) — FOUND
