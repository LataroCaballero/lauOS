---
phase: 1
slug: foundation-auth
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright (e2e) — Wave 0 installs |
| **Config file** | `playwright.config.ts` — Wave 0 creates |
| **Quick run command** | `npx playwright test --reporter=list` |
| **Full suite command** | `npx playwright test --reporter=list` |
| **Estimated runtime** | ~60 seconds |

---

## Sampling Rate

- **After every task commit:** Manual browser check (local dev server + local PocketBase)
- **After every plan wave:** Run `npx playwright test --reporter=list` against local PocketBase
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| Login with valid creds | 01-03 | 2 | AUTH-01 | e2e | `npx playwright test tests/auth.spec.ts` | ❌ W0 | ⬜ pending |
| Login with invalid creds shows error | 01-03 | 2 | AUTH-01 | e2e | `npx playwright test tests/auth.spec.ts` | ❌ W0 | ⬜ pending |
| Refresh keeps session | 01-03 | 2 | AUTH-02 | e2e | `npx playwright test tests/session.spec.ts` | ❌ W0 | ⬜ pending |
| New tab keeps session | 01-03 | 2 | AUTH-02 | e2e | `npx playwright test tests/session.spec.ts` | ❌ W0 | ⬜ pending |
| Logout redirects to /login | 01-03 | 2 | AUTH-03 | e2e | `npx playwright test tests/auth.spec.ts` | ❌ W0 | ⬜ pending |
| Display name update persists | 01-03 | 2 | AUTH-04 | e2e | `npx playwright test tests/settings.spec.ts` | ❌ W0 | ⬜ pending |
| Password change + re-login | 01-03 | 2 | AUTH-04 | e2e | `npx playwright test tests/settings.spec.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/auth.spec.ts` — stubs for AUTH-01, AUTH-03
- [ ] `tests/session.spec.ts` — stubs for AUTH-02
- [ ] `tests/settings.spec.ts` — stubs for AUTH-04
- [ ] `playwright.config.ts` — Playwright configuration pointing to local dev server
- [ ] Framework install: `npm install -D @playwright/test && npx playwright install chromium`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| PocketBase survives VPS reboot | AUTH-01 | Requires SSH + server reboot | SSH to VPS, run `sudo reboot`, wait 2 min, verify `systemctl status pocketbase` is active |
| Nginx TLS serving HTTPS correctly | AUTH-01 | Requires DNS + live cert | Visit `https://pb.yourdomain.com/_/` in browser, confirm valid TLS cert |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
