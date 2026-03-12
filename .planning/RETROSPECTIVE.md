# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — MVP

**Shipped:** 2026-03-12
**Phases:** 5 | **Plans:** 14 | **Timeline:** 3 days (2026-03-09 → 2026-03-11)

### What Was Built
- PocketBase on VPS with systemd + Nginx TLS — production backend live from day one
- Full auth flow: email/password login, 365-day session persistence, logout, profile editing
- Responsive dashboard shell: navbar, module card grid, mobile bottom nav, dark mode, accent colors
- Finance module: ARS/USD accounts, income/expense/transfer CRUD, category management with defaults
- USD exchange rate integration via dolarapi.com (blue/oficial/tarjeta + manual entry)
- 4 finance visualizations: monthly summary, category donut chart, balance timeline, filtered transactions

### What Worked
- **Sequential phase ordering was strict and correct** — schema-first (Phase 3 schema lock before Phase 4 visualizations) prevented costly retrofits
- **Server Actions pattern** simplified auth and data fetching significantly; no API routes needed
- **Centavo integer storage** worked perfectly — fromCentavos/toCentavos helpers eliminated all float issues
- **Milestone audit before completion** caught two real blockers (missing VERIFICATION.md, missing categories nav link) that Phase 5 closed cleanly
- **yolo mode + coarse granularity** moved fast without excessive approval gates

### What Was Inefficient
- **Playwright port mismatch** (3000 vs 3005) slipped through and is still unresolved — should have been caught in Phase 1 verification
- **SUMMARY.md frontmatter not populated with one_liner field** — gsd-tools milestone complete returned empty accomplishments, required manual fill
- **ACCT-01–04 absent from 03-01/03-02 SUMMARY.md frontmatter** — verification evidence existed in VERIFICATION.md but plan-level docs were incomplete; documentation debt
- **Phase 5 was a gap-closure phase** — audit revealed two blockers that should have been in the original roadmap (categories nav + VERIFICATION.md); added friction at the end

### Patterns Established
- PocketBase two-client factory: `createServerClient` (per-request, Server Actions) + `createBrowserClient` (client-side singleton, cookie sync)
- All monetary amounts as integer centavos in DB — never floats; enforced via `money.ts` helpers
- Client islands as sibling files (`accounts-client.tsx`, `categories-client.tsx`) — keeps RSC page.tsx clean, enables usePathname/useState
- FinanceSubNav as sibling client sub-component — keeps layout.tsx as Server Component while enabling active state
- `CategoryBadge` and accent colors use `style` inline hex (not Tailwind dynamic classes) — required by Tailwind v4 build-time scanning limitation
- PocketBase ID validation with `/^[a-z0-9]{15}$/i` before interpolating into filter strings — injection guard pattern

### Key Lessons
1. **Audit before milestone close is essential** — even a simple 5-phase MVP had two non-obvious gaps that only surfaced via structured audit
2. **Port/config mismatches are subtle** — the 3000 vs 3005 port difference lived undetected across Playwright config, PocketBase CORS, and dev setup; auditing config early catches these
3. **Plan SUMMARY.md frontmatter discipline matters** — gsd-tools relies on structured frontmatter for automatic stats; skipping fields creates documentation debt that surfaces at milestone time
4. **PocketBase schema lock is a hard constraint** — establishing it in Phase 1 and never changing it meant Phase 3 and 4 could build on a stable foundation without migration anxiety
5. **dolarapi.com vs dolarhoy.com** — spec said one thing, implementation used another that was functionally equivalent; document provider deviations explicitly in tech decisions to avoid confusion during audits

### Cost Observations
- Model mix: claude-sonnet-4-6 (balanced profile) throughout
- Sessions: multiple over 3 days
- Notable: 3 days from zero to fully functional finance dashboard with PocketBase infra — fast iteration enabled by yolo mode and coarse granularity

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Timeline | Key Change |
|-----------|--------|-------|----------|------------|
| v1.0 MVP | 5 | 14 | 3 days | First milestone — established all patterns |

### Cumulative Quality

| Milestone | Requirements | Audit Score | Tech Debt Items |
|-----------|-------------|-------------|-----------------|
| v1.0 MVP | 24/24 satisfied | tech_debt (1 medium, 4 low, 6 info) | 11 items |

### Top Lessons (Verified Across Milestones)

1. Run milestone audit before declaring complete — catches integration gaps not visible in phase-level verification
2. Keep SUMMARY.md frontmatter complete — automation depends on it
