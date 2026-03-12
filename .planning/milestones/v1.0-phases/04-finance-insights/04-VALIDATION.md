---
phase: 4
slug: finance-insights
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright 1.58.2 |
| **Config file** | `lauos/playwright.config.ts` |
| **Quick run command** | `cd lauos && npx playwright test tests/finance.spec.ts --project=chromium` |
| **Full suite command** | `cd lauos && npx playwright test --project=chromium` |
| **Estimated runtime** | ~30 seconds (quick), ~60 seconds (full) |

---

## Sampling Rate

- **After every task commit:** Run `cd lauos && npx playwright test tests/finance.spec.ts --project=chromium`
- **After every plan wave:** Run `cd lauos && npx playwright test --project=chromium`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-W0-1 | 01 | 0 | VIZL-01..04 | setup | `cd lauos && npx shadcn add chart` | ❌ W0 | ⬜ pending |
| 04-01-W0-2 | 01 | 0 | VIZL-01..04 | setup | `cd lauos && npx playwright test tests/finance.spec.ts --project=chromium` | ❌ W0 | ⬜ pending |
| 04-01-1 | 01 | 1 | VIZL-01 | E2E smoke | `cd lauos && npx playwright test tests/finance.spec.ts -g "VIZL-01" --project=chromium` | ❌ W0 | ⬜ pending |
| 04-01-2 | 01 | 1 | VIZL-02 | E2E smoke | `cd lauos && npx playwright test tests/finance.spec.ts -g "VIZL-02" --project=chromium` | ❌ W0 | ⬜ pending |
| 04-02-1 | 02 | 1 | VIZL-03 | E2E smoke | `cd lauos && npx playwright test tests/finance.spec.ts -g "VIZL-03" --project=chromium` | ❌ W0 | ⬜ pending |
| 04-02-2 | 02 | 1 | VIZL-04 | E2E smoke | `cd lauos && npx playwright test tests/finance.spec.ts -g "VIZL-04" --project=chromium` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `lauos/tests/finance.spec.ts` — add VIZL-01 through VIZL-04 stub tests (file exists but only has Phase 3 stubs)
- [ ] `cd lauos && npx shadcn add chart` — install shadcn chart component (recharts not yet in package.json)

*Wave 0 must complete before any chart component can be built.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Donut chart center label renders correctly | VIZL-02 | Recharts v3 bug may cause blank center; pixel-level rendering not automatable | Navigate to /finance/insights, select a month with expenses, verify center shows total amount |
| Balance timeline shows correct running balance | VIZL-03 | Numerical accuracy of running balance calculation requires known test data | Add transactions for a known account, check chart day-by-day values match expected cumulative balance |
| URL filter state survives page refresh | VIZL-04 | Browser refresh behavior | Apply filters, copy URL, open in new tab, verify same filters applied |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
