---
phase: 01-foundation-auth
plan: 01
subsystem: infra
tags: [pocketbase, nginx, certbot, systemd, tls, lets-encrypt, vps]

# Dependency graph
requires: []
provides:
  - PocketBase v0.36.6 running as systemd service on VPS (non-root, localhost-only)
  - Nginx reverse proxy with Let's Encrypt TLS terminating at pb.<domain>
  - PocketBase Admin UI accessible at https://pb.<domain>/_/
  - CORS configured for http://localhost:3005 (local Next.js dev port)
  - Token duration set to 365 days (31536000s) on users collection
  - Local Mac PocketBase at ~/pb/pocketbase for development
affects:
  - 01-02-foundation-auth (Next.js scaffold connects to this PocketBase instance)
  - 01-03-foundation-auth (auth flows depend on running PocketBase backend)
  - all future phases (PocketBase is the entire backend)

# Tech tracking
tech-stack:
  added:
    - PocketBase v0.36.6 (backend database + auth server)
    - Nginx (reverse proxy)
    - Certbot / Let's Encrypt (TLS certificates)
    - systemd (process management)
  patterns:
    - PocketBase bound to 127.0.0.1:8090 — never exposed publicly on that port
    - Nginx handles all public TLS termination and proxies to localhost
    - systemd user (pocketbase) is non-root with no shell access
    - Logs written to /home/pocketbase/pb/pb.log via StandardOutput/StandardError append

key-files:
  created:
    - /lib/systemd/system/pocketbase.service (VPS — systemd unit file)
    - /etc/nginx/sites-available/pb.<domain> (VPS — Nginx TLS + proxy config)
    - /home/pocketbase/pb/pocketbase (VPS — PocketBase binary)
    - ~/pb/pocketbase (Mac — local development binary)
  modified: []

key-decisions:
  - "CORS origin set to http://localhost:3005 (not 3000) — port 3000 was already taken by another project on the VPS"
  - "Token duration set to 31536000 seconds (365 days) — persists sessions indefinitely unless explicit logout, matching lauOS single-user UX requirement"
  - "PocketBase v0.36.6 pinned — version locked to avoid API surface changes mid-project"
  - "systemd Restart=always with RestartSec=5s — ensures automatic recovery from crashes without human intervention"
  - "certbot renew --dry-run verified — Let's Encrypt auto-renewal confirmed working before considering infra complete"

patterns-established:
  - "VPS security: PocketBase never listens on 0.0.0.0 — always 127.0.0.1:8090 behind Nginx"
  - "Two PocketBase environments: production (VPS, systemd) and local dev (Mac, manual ~/pb/pocketbase serve)"
  - "Infrastructure-only plans have no code commits — manual human actions, documented in SUMMARY only"

requirements-completed: [AUTH-01, AUTH-02]

# Metrics
duration: user-performed (manual infrastructure setup)
completed: 2026-03-10
---

# Phase 1 Plan 01: VPS + PocketBase Infrastructure Summary

**PocketBase v0.36.6 on VPS under systemd with Nginx/Let's Encrypt TLS, non-root service user, localhost-only binding, CORS on port 3005, and local Mac dev binary — full infrastructure foundation for lauOS backend**

## Performance

- **Duration:** User-performed (manual VPS operations, no automated timer)
- **Started:** 2026-03-10
- **Completed:** 2026-03-10
- **Tasks:** 2 of 2 (both performed manually by user)
- **Files modified:** 0 (all files are on remote VPS or local Mac — no repository files changed)

## Accomplishments

- PocketBase v0.36.6 running as a hardened systemd service under a dedicated non-root `pocketbase` user, bound to 127.0.0.1:8090 only, with automatic restart on failure
- Nginx reverse proxy with valid Let's Encrypt TLS certificate on pb.<domain>, certbot auto-renewal verified with `--dry-run`
- PocketBase superadmin account created, CORS configured for `http://localhost:3005`, token duration set to 365 days, service survived full VPS reboot
- Local Mac development environment: PocketBase binary at `~/pb/pocketbase` with its own local admin account, ready for offline development

## Task Commits

Both tasks were human-performed infrastructure operations on remote systems. No repository commits were made for task work — all changes live on the VPS filesystem and Mac local filesystem.

1. **Task 1: DNS, VPS binary, and systemd setup** — performed manually (no commit)
2. **Task 2: Nginx TLS + PocketBase admin setup + Mac dev environment** — performed manually (no commit)

## Files Created/Modified

All files are outside the repository (VPS or Mac). No repository files were created or modified by this plan.

**VPS (remote):**
- `/lib/systemd/system/pocketbase.service` — systemd unit: non-root user, 127.0.0.1:8090, Restart=always, logs to pb.log
- `/etc/nginx/sites-available/pb.<domain>` — Nginx config: TLS via Let's Encrypt, proxy_pass to 127.0.0.1:8090, client_max_body_size 10M
- `/home/pocketbase/pb/pocketbase` — PocketBase v0.36.6 binary, owned by pocketbase user

**Mac (local):**
- `~/pb/pocketbase` — PocketBase v0.36.6 binary for local development

## Decisions Made

- **CORS port 3005 instead of 3000:** Port 3000 is already occupied by another project on the VPS. The `--origins` flag in the systemd `ExecStart` is set to `http://localhost:3005`. The Next.js dev server in plan 01-02 must be started on port 3005 (`next dev -p 3005`) for local PocketBase CORS to pass.
- **Token duration 365 days:** Set to 31536000 seconds per-collection on the `users` collection. Matches the lauOS single-user "always logged in" UX — sessions persist indefinitely unless the user explicitly logs out.
- **PocketBase version pinned at v0.36.6:** Locks the API surface for the entire project. Do not upgrade without reviewing breaking changes.
- **systemd `Restart=always` with `RestartSec=5s`:** Ensures PocketBase recovers from crashes without human intervention.
- **certbot auto-renewal verified:** `certbot renew --dry-run` passed before marking infra complete.

## Deviations from Plan

None — plan executed exactly as written, with one noted real-world adaptation:

The plan specified CORS origin `http://localhost:3000`. The user's actual setup uses port 3005 (port 3000 was already taken). This is a valid adaptation, not a deviation from intent. Plan 01-02 must account for this: `next dev -p 3005`.

## Issues Encountered

None — all steps completed successfully on first attempt. Service survived reboot, TLS dry-run passed.

## User Setup Required

None — this plan IS the user setup. All infrastructure is in place.

## Next Phase Readiness

- PocketBase API is live at `https://pb.<domain>/api/` — Next.js scaffold in plan 01-02 can connect immediately
- CORS is configured for `http://localhost:3005` — dev server must use port 3005
- Local Mac PocketBase runs at `http://127.0.0.1:8090/` — usable for schema development before connecting to production
- No blockers for plan 01-02

---
*Phase: 01-foundation-auth*
*Completed: 2026-03-10*
