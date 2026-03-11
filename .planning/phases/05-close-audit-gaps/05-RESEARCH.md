# Phase 5: Close Audit Gaps - Research

**Researched:** 2026-03-11
**Domain:** Navigation patch + documentation verification
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CATG-01 | Usuario puede crear categorías personalizadas con nombre e ícono/color | Categories page is fully implemented. Gap is navigation-only: add link to FinanceSubNav. |
| CATG-02 | Usuario puede editar y eliminar categorías | Same navigation gap as CATG-01. Feature is built and verified in 03-VERIFICATION.md. |
| SHLL-01 | Top navbar muestra links a módulos, nombre de usuario y opción de logout | Implementation verified by audit (wired). VERIFICATION.md must document evidence from code + shell.spec.ts. |
| SHLL-02 | Página home con grid de widgets clickeables (una card por módulo disponible) | Implementation verified by audit (wired). VERIFICATION.md must document evidence from code. |
| SHLL-03 | Toggle dark/light mode con preferencia persistente | Implementation verified by audit (wired). VERIFICATION.md must document evidence from Zustand store + flash-prevention script. |
| SHLL-04 | Layout responsive usable en mobile | Implementation verified by audit (wired). VERIFICATION.md must document evidence from bottom-nav + mobile viewport test. |
| SHLL-05 | Color de acento personalizable desde configuración, persistido en perfil de usuario | Implementation verified by audit (wired). VERIFICATION.md must document evidence from ThemeProvider + PocketBase accent field. |
</phase_requirements>

---

## Summary

Phase 5 closes two distinct gaps identified in the v1.0-MILESTONE-AUDIT.md. Both gaps are purely administrative or navigational — no new backend logic is required.

**Gap 1 — CATG-01/CATG-02 (navigation):** The `/finance/categories` page is fully built and all CRUD actions verified in 03-VERIFICATION.md (12/12 passed). The only gap is that `FinanceSubNav` (`finance-sub-nav.tsx`) has three links (Cuentas, Insights, Transacciones) and is missing a fourth link for Categorías. The fix is a single-object addition to the `FINANCE_NAV_LINKS` array.

**Gap 2 — SHLL-01 through SHLL-05 (verification documentation):** Phase 02 (dashboard-shell) was completed and all five SHLL requirements are confirmed wired by the integration checker. However, no `02-VERIFICATION.md` file was ever created — every other phase has one. The fix is to write the verification document, following the established format used in `01-VERIFICATION.md`, `03-VERIFICATION.md`, and `04-VERIFICATION.md`, drawing evidence directly from the code artifacts and plan SUMMARYs.

**Primary recommendation:** Plan 05-01 as a single-task code change (add one object to `FINANCE_NAV_LINKS`). Plan 05-02 as a documentation-only task (write `02-VERIFICATION.md` by inspecting existing Phase 02 artifacts and compiling the Observable Truths table).

---

## Standard Stack

### Core (no new dependencies)

This phase introduces zero new libraries. All work uses the existing project stack.

| Component | Version | Purpose |
|-----------|---------|---------|
| Next.js (App Router) | 16.1.6 | Navigation link rendering |
| `finance-sub-nav.tsx` | existing | The `FINANCE_NAV_LINKS` array to patch |
| `usePathname` | next/navigation | Active-state detection already in place |
| Playwright | 1.58.2 | E2E test already written in `shell.spec.ts` |
| Markdown | — | VERIFICATION.md is a plain markdown document |

**Installation:** none required.

---

## Architecture Patterns

### Pattern 1: FinanceSubNav link array (CATG fix)

**What:** `FINANCE_NAV_LINKS` is a typed array of `{ href, label }` objects in `finance-sub-nav.tsx`. Adding a new entry automatically renders a new tab with active-state highlighting — no other files need changes.

**Current state of `FINANCE_NAV_LINKS`:**
```typescript
// Source: lauos/src/app/(protected)/finance/finance-sub-nav.tsx
const FINANCE_NAV_LINKS = [
  { href: '/finance/accounts', label: 'Cuentas' },
  { href: '/finance/insights', label: 'Insights' },
  { href: '/finance/transactions', label: 'Transacciones' },
]
```

**Fix:** Add one object:
```typescript
{ href: '/finance/categories', label: 'Categorías' }
```

**Active-state logic** (`pathname.startsWith(link.href)`) already handles the new link correctly — no changes to the rendering loop or CSS.

**File to modify:** `lauos/src/app/(protected)/finance/finance-sub-nav.tsx` (line 7-11)

### Pattern 2: VERIFICATION.md format (SHLL documentation)

**What:** Every completed phase has a `XX-VERIFICATION.md` in `.planning/phases/`. The format is consistent across phases 01, 03, and 04. Phase 02 is the only one missing this document.

**Established format (from 01-VERIFICATION.md, 03-VERIFICATION.md, 04-VERIFICATION.md):**

```markdown
---
phase: 02-dashboard-shell
verified: [timestamp]
status: passed | human_needed
score: N/N must-haves verified
re_verification: false
human_verification:
  - test: "..."
    expected: "..."
    why_human: "..."
---

# Phase 2: Dashboard Shell Verification Report

**Phase Goal:** ...
**Verified:** [timestamp]
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| N | [truth] | VERIFIED | [code artifact + location] |

**Score:** N/N truths verified

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|---------|--------|---------|
| [file path] | [what it provides] | VERIFIED | [details] |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|

---

## Requirements Coverage

| Requirement | Plans | Status | Evidence |
|-------------|-------|--------|---------|

---

## Anti-Patterns Found

(none or list)

---

## Human Verification Required

### N. [Behavior]

**Test:** [step-by-step]
**Expected:** [outcome]
**Why human:** [reason]

---

## Gaps Summary

[narrative]
```

### Evidence Sources for 02-VERIFICATION.md

The verifier for Plan 05-02 must draw from these existing sources (all confirmed by the audit):

**SHLL-01 (Navbar):**
- `lauos/src/components/layout/navbar.tsx` — renders `<NavLinks />`, `<ThemeToggle />`, `<UserMenu userName avatarUrl />`
- `lauos/src/components/layout/nav-links.tsx` — `use client`, `usePathname`, iterates `MODULES` array for nav links
- `lauos/src/components/layout/user-menu.tsx` — `@base-ui/react Menu`, logout button via `logoutAction`, `data-testid="user-menu-trigger"` and `data-testid="logout-button"`
- `lauos/tests/shell.spec.ts` — `describe('navbar')` test checks `[aria-label="main navigation"]`, `[data-testid="navbar-username"]`, and logout button visibility

**SHLL-02 (Module grid):**
- `lauos/src/lib/modules.ts` — `MODULES` array with Finanzas entry linking to `/finance`
- `lauos/src/components/dashboard/module-card.tsx` — `Link` wrapper with `data-testid="module-card-{id}"`
- `lauos/src/components/dashboard/module-grid.tsx` — responsive 2/3/4-col grid, iterates `MODULES`
- `lauos/src/app/(protected)/dashboard/page.tsx` — renders `<ModuleGrid />`
- `lauos/tests/shell.spec.ts` — `describe('module grid')` test clicks `[data-testid="module-card-finance"]` and asserts `/finance` URL

**SHLL-03 (Dark mode):**
- `lauos/src/lib/store/theme-store.ts` — Zustand store with `isDark`, `toggleDark`, `persist` middleware; `lauos-theme` localStorage key
- `lauos/src/components/layout/theme-provider.tsx` — applies `.dark` class to `<html>` and `--primary` CSS variable via `useEffect`
- `lauos/src/app/layout.tsx` — flash-prevention inline `<script>` reads `lauos-theme.state.isDark` before React hydrates
- `lauos/src/components/layout/theme-toggle.tsx` — wired to `useThemeStore`, shows Moon/Sun icon, `data-testid="theme-toggle"`
- `lauos/tests/shell.spec.ts` — `describe('dark mode')` test clicks toggle, asserts `html.dark` class, reloads, re-asserts

**SHLL-04 (Responsive layout):**
- `lauos/src/components/layout/bottom-nav.tsx` — fixed bottom, `md:hidden`, `safe-area-inset`, `data-testid="bottom-nav"`
- `lauos/src/components/layout/nav-links.tsx` — hidden on mobile (`hidden md:flex`)
- `lauos/src/app/(protected)/layout.tsx` — renders `<Navbar />` + `<BottomNav />`
- `lauos/tests/shell.spec.ts` — `describe('mobile layout')` test at 375px viewport checks no horizontal scroll and bottom nav visible

**SHLL-05 (Accent color):**
- `lauos/src/lib/store/theme-store.ts` — `setAccent(color: AccentColor)` action; `AccentColor` union type
- `lauos/src/components/settings/appearance-tab.tsx` — 6 accent swatches with `data-testid="accent-swatch-{color}"`, calls `setAccent()` optimistically + `updateAccentAction` for PocketBase persistence
- `lauos/src/lib/actions/profile.ts` — `updateAccentAction` updates PocketBase users collection `accent` field; `revalidatePath('/', 'layout')`
- `lauos/src/app/(protected)/layout.tsx` — reads `pb.authStore.record` to extract accent, passes as `initialAccent` to `<ThemeProvider>`
- `lauos/tests/shell.spec.ts` — `describe('accent color')` test clicks Apariencia tab, clicks blue swatch, checks `--primary` CSS variable set

### Anti-Patterns to Avoid

- **Inventing evidence:** All evidence must cite actual file paths and line-level verification. Do not state "wired" without the specific import or prop that proves it.
- **Marking things VERIFIED that cannot be verified from code alone:** Dark mode persistence and accent persistence require a live browser; those are `? HUMAN` entries like Phase 01's infrastructure items.
- **Skipping the human verification section:** shell.spec.ts tests require a running Next.js + PocketBase — those are human-verified behaviors, not automated-in-CI verified.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Categories nav link | A new component or separate nav system | Add one object to `FINANCE_NAV_LINKS` array | Array-driven nav is the established pattern; adding a link is a one-line data change |
| SHLL verification | A new verification format | Copy the format from `01-VERIFICATION.md` verbatim | Consistency matters; all phases follow the same structure |
| Evidence gathering | Guessing at what code exists | Read the actual source files and SUMMARYs | Accuracy is critical; the verifier must cite real evidence |

---

## Common Pitfalls

### Pitfall 1: Wrong link ordering in FinanceSubNav

**What goes wrong:** Placing Categorías at position 3 (between Insights and Transacciones) when it logically belongs as a supporting management page after Transacciones, or vice versa — inconsistent with user mental model.
**Why it happens:** No explicit spec on ordering.
**How to avoid:** Recommended order: Cuentas | Insights | Transacciones | Categorías. Categories is a management/config page, not a primary view. Placing it last is consistent with how settings/config appear at the end of navigation patterns.
**Warning signs:** N/A — either ordering works functionally.

### Pitfall 2: VERIFICATION.md scope creep for Phase 02

**What goes wrong:** Attempting to re-run or update tests as part of writing the verification document. The task is to document what was already built, not to implement new tests.
**Why it happens:** The distinction between "verify" (document existing state) vs "fix" (change code) is easy to blur.
**How to avoid:** 05-02 is documentation only. If a SHLL requirement has an implementation gap, that would be a new bug fix task — but the audit confirms all 5 are wired. Write what the code shows.

### Pitfall 3: Missing human verification items in 02-VERIFICATION.md

**What goes wrong:** Marking dark mode persistence and accent color persistence as VERIFIED when they require a live browser to confirm.
**Why it happens:** Code inspection confirms the mechanism is in place, but runtime behavior (localStorage read before hydrate, PocketBase roundtrip) cannot be proven from static analysis.
**How to avoid:** Follow Phase 01's pattern — `? HUMAN` for runtime-dependent behaviors with clear test instructions.

### Pitfall 4: `pathname.startsWith` collision for categories link

**What goes wrong:** If categories link is `/finance/categories`, and another path like `/finance/categories/new` exists in the future, `startsWith('/finance/categories')` would correctly highlight the tab. No issue currently — but verify there is no existing `/finance/categories/[id]` sub-route that could confuse active state.
**How to avoid:** Check that the categories page has no sub-routes (confirmed: only `categories/page.tsx` and `categories/categories-client.tsx` exist — no `[id]` sub-route).
**Warning signs:** N/A — current structure is safe.

---

## Code Examples

### Example 1: Updated FINANCE_NAV_LINKS (the complete fix for CATG-01/CATG-02)

```typescript
// File: lauos/src/app/(protected)/finance/finance-sub-nav.tsx
// Change: add one object at the end of the array

const FINANCE_NAV_LINKS = [
  { href: '/finance/accounts', label: 'Cuentas' },
  { href: '/finance/insights', label: 'Insights' },
  { href: '/finance/transactions', label: 'Transacciones' },
  { href: '/finance/categories', label: 'Categorías' },   // ADD THIS LINE
]
```

No other files require changes. The existing render loop, active-state logic, and CSS classes handle the new entry automatically.

### Example 2: Observable Truth format for 02-VERIFICATION.md

```markdown
| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Top navbar renders module links, logged-in user's name, and a logout option | VERIFIED | `navbar.tsx` renders `<NavLinks />` (MODULES-driven), `<UserMenu userName={userName} />` (name from PocketBase), and `logoutAction` in UserMenu dropdown with `data-testid="logout-button"` |
| 2 | Module card grid on /dashboard shows one card per MODULES entry | VERIFIED | `module-grid.tsx` maps `MODULES` to `<ModuleCard>`; `dashboard/page.tsx` renders `<ModuleGrid>`; `modules.ts` has Finanzas entry with `data-testid="module-card-finance"` |
| 3 | Dark/light toggle applies .dark class immediately and persists on refresh | ? HUMAN | `theme-toggle.tsx` calls `toggleDark()` from Zustand store; `theme-provider.tsx` applies `.dark` via `useEffect`; `layout.tsx` has flash-prevention script; runtime persistence requires browser |
| 4 | Layout is usable on 375px mobile with no horizontal scroll | VERIFIED | `bottom-nav.tsx` is `fixed bottom-0 md:hidden`; `nav-links.tsx` is `hidden md:flex`; shell.spec.ts `mobile layout` test uses viewport 375x812 and asserts scrollWidth <= clientWidth |
| 5 | Accent color change applies to UI and persists after refresh | ? HUMAN | `setAccent()` optimistically updates store; `updateAccentAction` persists to PocketBase; `layout.tsx` reads `accent` from PocketBase user record on each server render; persistence through refresh requires browser |
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Manual nav link list (each link hardcoded) | `FINANCE_NAV_LINKS` array drives rendering | Add a link = add one object to array |
| Each phase verified inline in SUMMARY.md | Dedicated `XX-VERIFICATION.md` per phase | Formal phase-level audit trail (Phase 02 is missing this) |

---

## Open Questions

1. **Link ordering in FinanceSubNav**
   - What we know: No explicit ordering requirement in REQUIREMENTS.md or ROADMAP.md
   - What's unclear: Should Categorías be position 3 (before Transacciones) or position 4 (after)?
   - Recommendation: Position 4 (end) — categories is a management/config page, not a primary view; users go there less frequently than transactions

2. **SHLL-01 through SHLL-05 final status in REQUIREMENTS.md**
   - What we know: REQUIREMENTS.md shows all 5 SHLL as `[ ]` (unchecked) pending Phase 5 completion
   - What's unclear: After writing 02-VERIFICATION.md, should REQUIREMENTS.md be updated to `[x]`?
   - Recommendation: Yes, update REQUIREMENTS.md traceability table to mark SHLL-01 through SHLL-05 as complete after 05-02 is done

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Playwright 1.58.2 |
| Config file | `lauos/playwright.config.ts` |
| Quick run command | `cd lauos && npx playwright test tests/shell.spec.ts --reporter=line` |
| Full suite command | `cd lauos && npx playwright test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CATG-01 | `/finance/categories` reachable via FinanceSubNav | E2E smoke | `cd lauos && npx playwright test tests/shell.spec.ts` (nav renders; categories link visible) | ✅ shell.spec.ts exists (no categories-specific test; nav visibility tested in navbar describe) |
| CATG-02 | Same navigation entry covers edit/delete discovery | E2E smoke | Same as CATG-01 | ✅ |
| SHLL-01 | Navbar shows module links, user name, logout | E2E | `cd lauos && npx playwright test tests/shell.spec.ts -g "navbar"` | ✅ shell.spec.ts exists |
| SHLL-02 | Module grid on /dashboard with clickable cards | E2E | `cd lauos && npx playwright test tests/shell.spec.ts -g "module grid"` | ✅ shell.spec.ts exists |
| SHLL-03 | Dark/light toggle + persistence | E2E | `cd lauos && npx playwright test tests/shell.spec.ts -g "dark mode"` | ✅ shell.spec.ts exists |
| SHLL-04 | No horizontal scroll at 375px, bottom nav visible | E2E | `cd lauos && npx playwright test tests/shell.spec.ts -g "mobile layout"` | ✅ shell.spec.ts exists |
| SHLL-05 | Accent swatch change + persistence | E2E | `cd lauos && npx playwright test tests/shell.spec.ts -g "accent color"` | ✅ shell.spec.ts exists |

### Sampling Rate

- **Per task commit:** `cd lauos && npx playwright test tests/shell.spec.ts --reporter=line`
- **Per wave merge:** `cd lauos && npx playwright test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

None — existing test infrastructure (`tests/shell.spec.ts`) covers all phase requirements. The shell.spec.ts file was created in Plan 02-01 and contains substantive (non-stub) tests for all 5 SHLL requirements plus module grid. No new test files are needed.

Note: `shell.spec.ts` tests require a running Next.js dev server + PocketBase — they cannot run in a pure static analysis environment. Playwright is the correct framework for this. The tests are well-written and non-flaky by design.

---

## Sources

### Primary (HIGH confidence)

- Direct file reads — `lauos/src/app/(protected)/finance/finance-sub-nav.tsx` — confirmed current FINANCE_NAV_LINKS array
- Direct file reads — `.planning/phases/02-dashboard-shell/02-01-SUMMARY.md`, `02-02-SUMMARY.md`, `02-03-SUMMARY.md` — confirmed which requirements each plan completed and which artifacts were created
- Direct file reads — `.planning/v1.0-MILESTONE-AUDIT.md` — confirmed exact gap descriptions and that CATG-01/CATG-02 are navigation-only gaps (feature is built)
- Direct file reads — `.planning/phases/01-foundation-auth/01-VERIFICATION.md`, `04-finance-insights/04-VERIFICATION.md` — confirmed VERIFICATION.md format and conventions
- Direct file reads — `lauos/tests/shell.spec.ts` — confirmed tests are substantive (not stubs) and cover all 5 SHLL requirements
- Direct file reads — `lauos/src/lib/modules.ts`, `navbar.tsx`, `nav-links.tsx`, `user-menu.tsx`, `theme-store.ts`, `bottom-nav.tsx` — confirmed Phase 02 implementation artifacts exist and are wired

### Secondary (MEDIUM confidence)

- `.planning/REQUIREMENTS.md` traceability table — confirmed SHLL-01 through SHLL-05 and CATG-01/CATG-02 all mapped to Phase 5 with Pending status

### Tertiary (LOW confidence)

- None — all findings are grounded in direct file inspection.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; existing patterns fully understood from direct code inspection
- Architecture: HIGH — both fixes are trivially scoped: one array entry + one markdown document
- Pitfalls: HIGH — identified from audit findings and established project patterns

**Research date:** 2026-03-11
**Valid until:** Indefinite — Phase 5 is a gap-closure phase; nothing in the codebase is changing underneath it
