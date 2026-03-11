---
phase: 3
slug: finance-data
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright (already installed) |
| **Config file** | `lauos/playwright.config.ts` |
| **Quick run command** | `cd lauos && npx playwright test tests/finance.spec.ts` |
| **Full suite command** | `cd lauos && npx playwright test` |
| **Estimated runtime** | ~45 seconds (finance suite) / ~90 seconds (full) |

---

## Sampling Rate

- **After every task commit:** Run `cd lauos && npx playwright test tests/finance.spec.ts`
- **After every plan wave:** Run `cd lauos && npx playwright test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 45 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 3-01-01 | 01 | 0 | ACCT-01,TRAN-01,CATG-01 | E2E stub | `npx playwright test tests/finance.spec.ts` | ❌ W0 | ⬜ pending |
| 3-01-02 | 01 | 1 | ACCT-01,ACCT-02 | E2E | `npx playwright test tests/finance.spec.ts --grep "ACCT-01\|ACCT-02"` | ❌ W0 | ⬜ pending |
| 3-01-03 | 01 | 1 | TRAN-01,TRAN-02,TRAN-03 | E2E | `npx playwright test tests/finance.spec.ts --grep "TRAN-01\|TRAN-02\|TRAN-03"` | ❌ W0 | ⬜ pending |
| 3-01-04 | 01 | 1 | CATG-01,CATG-02,CATG-03 | E2E | `npx playwright test tests/finance.spec.ts --grep "CATG"` | ❌ W0 | ⬜ pending |
| 3-02-01 | 02 | 2 | ACCT-01 | E2E | `npx playwright test tests/finance.spec.ts --grep "ACCT-01"` | ❌ W0 | ⬜ pending |
| 3-02-02 | 02 | 2 | ACCT-02 | E2E | `npx playwright test tests/finance.spec.ts --grep "ACCT-02"` | ❌ W0 | ⬜ pending |
| 3-02-03 | 02 | 2 | ACCT-03 | E2E | `npx playwright test tests/finance.spec.ts --grep "ACCT-03"` | ❌ W0 | ⬜ pending |
| 3-02-04 | 02 | 2 | ACCT-04 | E2E | `npx playwright test tests/finance.spec.ts --grep "ACCT-04"` | ❌ W0 | ⬜ pending |
| 3-03-01 | 03 | 3 | TRAN-01 | E2E | `npx playwright test tests/finance.spec.ts --grep "TRAN-01"` | ❌ W0 | ⬜ pending |
| 3-03-02 | 03 | 3 | TRAN-04 | E2E | `npx playwright test tests/finance.spec.ts --grep "TRAN-04"` | ❌ W0 | ⬜ pending |
| 3-03-03 | 03 | 3 | TRAN-02 | E2E | `npx playwright test tests/finance.spec.ts --grep "TRAN-02"` | ❌ W0 | ⬜ pending |
| 3-03-04 | 03 | 3 | TRAN-03 | E2E | `npx playwright test tests/finance.spec.ts --grep "TRAN-03"` | ❌ W0 | ⬜ pending |
| 3-03-05 | 03 | 3 | TRAN-05 | E2E | `npx playwright test tests/finance.spec.ts --grep "TRAN-05"` | ❌ W0 | ⬜ pending |
| 3-04-01 | 04 | 4 | CATG-01 | E2E | `npx playwright test tests/finance.spec.ts --grep "CATG-01"` | ❌ W0 | ⬜ pending |
| 3-04-02 | 04 | 4 | CATG-02 | E2E | `npx playwright test tests/finance.spec.ts --grep "CATG-02"` | ❌ W0 | ⬜ pending |
| 3-04-03 | 04 | 4 | CATG-03 | E2E | `npx playwright test tests/finance.spec.ts --grep "CATG-03"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `lauos/tests/finance.spec.ts` — stub file with test IDs for all ACCT-*, TRAN-*, CATG-* requirements (all skipped/todo initially)

*Note: Default categories seeding tests (CATG-03) require a test user created AFTER pb_hooks are deployed. Add a comment in the test setup.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| dolarhoy/dolarapi rate displayed in transaction form | TRAN-04 | Live external API call — varies by time | Open transaction form, select USD, verify rate field populates within 2s |
| Exchange rate stored immutably (not recalculated) | TRAN-03 | Requires creating a transaction, changing rate externally, re-checking stored value | Create USD transaction with rate X, update rate in DB to Y, verify transaction still shows X |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 45s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
