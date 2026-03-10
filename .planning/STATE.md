# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-09)

**Core value:** El usuario puede ver y gestionar los aspectos clave de su día a día desde un único lugar, sin depender de apps de terceros.
**Current focus:** Phase 1 — Foundation + Auth

## Current Position

Phase: 1 of 4 (Foundation + Auth)
Plan: 0 of 3 in current phase
Status: Ready to plan
Last activity: 2026-03-09 — Roadmap created

Progress: [░░░░░░░░░░] 0%

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

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: PocketBase runs as a single binary on the VPS under systemd, never as a shared singleton — factory function pattern required from day one
- [Roadmap]: All monetary amounts stored as integer centavos (×100) in PocketBase — never floats; schema is immutable after data exists
- [Roadmap]: Exchange rates for USD transactions stored immutably at transaction time — no auto-recalculation with current rates
- [Roadmap]: Claude Stats module moved to v2 — Anthropic Admin API requires org account confirmation before scoping; Finance is the safer first module

### Pending Todos

None yet.

### Blockers/Concerns

- [Phase 1]: VPS provider, domain/subdomain for PocketBase, and Nginx TLS specifics must be determined before plan execution — not covered in research
- [Future]: Anthropic Admin API requires org account (not individual). Must confirm `console.anthropic.com/settings/organization` before Claude Stats module can be scoped for v2

## Session Continuity

Last session: 2026-03-09
Stopped at: Roadmap created — ready to plan Phase 1
Resume file: None
