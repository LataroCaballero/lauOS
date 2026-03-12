---
phase: 2
slug: dashboard-shell
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright 1.58.2 |
| **Config file** | `lauos/playwright.config.ts` |
| **Quick run command** | `cd lauos && npx playwright test tests/shell.spec.ts --reporter=line` |
| **Full suite command** | `cd lauos && npx playwright test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd lauos && npx playwright test tests/shell.spec.ts --reporter=line`
- **After every plan wave:** Run `cd lauos && npx playwright test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-W0-01 | 01 | 0 | SHLL-01 | E2E setup | `cd lauos && npx playwright test tests/shell.spec.ts` | ❌ W0 | ⬜ pending |
| 02-01-W0-02 | 01 | 0 | SHLL-01..05 | config fix | `cd lauos && npx playwright test` | ✅ exists | ⬜ pending |
| 02-01-01 | 01 | 1 | SHLL-01 | E2E | `cd lauos && npx playwright test tests/shell.spec.ts -g "navbar"` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | SHLL-02 | E2E | `cd lauos && npx playwright test tests/shell.spec.ts -g "module grid"` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 1 | SHLL-04 | E2E | `cd lauos && npx playwright test tests/shell.spec.ts -g "mobile layout"` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 1 | SHLL-03 | E2E | `cd lauos && npx playwright test tests/shell.spec.ts -g "dark mode"` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 1 | SHLL-05 | E2E | `cd lauos && npx playwright test tests/shell.spec.ts -g "accent color"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `lauos/tests/shell.spec.ts` — stubs for SHLL-01 through SHLL-05
- [ ] Update `lauos/playwright.config.ts` `baseURL` and `webServer.url` from port 3000 to port 3005
- [ ] PocketBase schema: add `accent` (Text) and `avatar` (File) fields to `users` collection (manual step — document in plan)

*Wave 0 must be complete before Wave 1 implementation tasks begin.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| PocketBase `accent` and `avatar` fields exist | SHLL-05 | Requires PocketBase Admin UI access | Log into PocketBase admin, open `users` collection, confirm `accent` (Text) and `avatar` (File) fields exist |
| Avatar crop UI renders with visible handles | SHLL-05 (avatar sub-feature) | Visual check for react-image-crop CSS import | Upload an avatar, verify crop handles are draggable and visible |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
