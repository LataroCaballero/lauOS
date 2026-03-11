---
phase: 5
slug: close-audit-gaps
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 5 — Validation Strategy

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
- **Max feedback latency:** ~30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 5-01-01 | 01 | 1 | CATG-01, CATG-02 | E2E smoke | `cd lauos && npx playwright test tests/shell.spec.ts --reporter=line` | ✅ | ⬜ pending |
| 5-02-01 | 02 | 1 | SHLL-01 | E2E | `cd lauos && npx playwright test tests/shell.spec.ts -g "navbar" --reporter=line` | ✅ | ⬜ pending |
| 5-02-02 | 02 | 1 | SHLL-02 | E2E | `cd lauos && npx playwright test tests/shell.spec.ts -g "module grid" --reporter=line` | ✅ | ⬜ pending |
| 5-02-03 | 02 | 1 | SHLL-03 | E2E | `cd lauos && npx playwright test tests/shell.spec.ts -g "dark mode" --reporter=line` | ✅ | ⬜ pending |
| 5-02-04 | 02 | 1 | SHLL-04 | E2E | `cd lauos && npx playwright test tests/shell.spec.ts -g "mobile layout" --reporter=line` | ✅ | ⬜ pending |
| 5-02-05 | 02 | 1 | SHLL-05 | E2E | `cd lauos && npx playwright test tests/shell.spec.ts -g "accent color" --reporter=line` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

`lauos/tests/shell.spec.ts` was created in Plan 02-01 and contains substantive (non-stub) tests for all 5 SHLL requirements. No new test files are needed.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Dark mode persists on page refresh | SHLL-03 | localStorage read happens before React hydration; cannot be confirmed from static analysis | 1. Open app in browser. 2. Click theme toggle to dark. 3. Reload page. 4. Verify `.dark` class still on `<html>` and UI remains dark. |
| Accent color persists after refresh | SHLL-05 | PocketBase roundtrip (write accent field, re-read on server render) requires live browser + running PocketBase | 1. Open Settings → Apariencia. 2. Click a non-default accent swatch. 3. Reload page. 4. Verify `--primary` CSS variable matches selected accent color. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
