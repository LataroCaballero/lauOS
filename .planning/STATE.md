---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
stopped_at: "Checkpoint:human-verify in 01-03-PLAN.md (Task 3 — awaiting manual auth verification)"
last_updated: "2026-03-10T14:00:06.088Z"
last_activity: 2026-03-10 — Plan 01-01 complete (VPS + PocketBase infra)
progress:
  total_phases: 4
  completed_phases: 1
  total_plans: 3
  completed_plans: 3
  percent: 8
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-09)

**Core value:** El usuario puede ver y gestionar los aspectos clave de su día a día desde un único lugar, sin depender de apps de terceros.
**Current focus:** Phase 1 — Foundation + Auth

## Current Position

Phase: 1 of 4 (Foundation + Auth)
Plan: 1 of 3 in current phase (01-01 complete)
Status: In progress
Last activity: 2026-03-10 — Plan 01-01 complete (VPS + PocketBase infra)

Progress: [█░░░░░░░░░] 8%

## Performance Metrics

**Velocity:**
- Total plans completed: 0
- Average duration: —
- Total execution time: —

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**
- Last 5 plans: —
- Trend: —

*Updated after each plan completion*
| Phase 01-foundation-auth P02 | 8 | 2 tasks | 29 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: PocketBase runs as a single binary on the VPS under systemd, never as a shared singleton — factory function pattern required from day one
- [Roadmap]: All monetary amounts stored as integer centavos (×100) in PocketBase — never floats; schema is immutable after data exists
- [Roadmap]: Exchange rates for USD transactions stored immutably at transaction time — no auto-recalculation with current rates
- [Roadmap]: Claude Stats module moved to v2 — Anthropic Admin API requires org account confirmation before scoping; Finance is the safer first module
- [Phase 01-foundation-auth]: Next.js 16 (latest) used; create-next-app@latest installs 16, Node 20 required and used via nvm
- [Phase 01-foundation-auth]: Two-client PocketBase pattern established: createBrowserClient (singleton + onChange cookie sync) and createServerClient (per-request, reads pb_auth, server-only guard)
- [01-01]: CORS configured for http://localhost:3005 (not 3000 — port 3000 taken by another project on VPS); Next.js dev server must run on port 3005
- [01-01]: PocketBase token duration set to 365 days (31536000s) — single-user "always logged in" UX, no auto-expiry
- [01-01]: PocketBase v0.36.6 pinned on VPS and Mac — do not upgrade without reviewing breaking changes
- [Phase 01-foundation-auth]: Both toast AND inline error on failed login — locked user decision; middleware uses authRefresh() for silent token renewal without maxAge

### Pending Todos

None yet.

### Blockers/Concerns

- [RESOLVED 01-01]: VPS provider, domain/subdomain for PocketBase, and Nginx TLS specifics — resolved; infrastructure complete
- [Future]: Anthropic Admin API requires org account (not individual). Must confirm `console.anthropic.com/settings/organization` before Claude Stats module can be scoped for v2

## Session Continuity

Last session: 2026-03-10T14:00:06.049Z
Stopped at: Checkpoint:human-verify in 01-03-PLAN.md (Task 3 — awaiting manual auth verification)
Resume file: None
