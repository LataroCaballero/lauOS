# Phase 1: Foundation + Auth - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Set up PocketBase on VPS, scaffold the Next.js project, and implement working login with persistent session. Covers AUTH-01, AUTH-02, AUTH-03, AUTH-04 (partial — avatar deferred). Does NOT include dashboard shell, navigation, or any finance functionality.

**Development approach:** App is developed locally on Mac (PocketBase runs locally for dev), then deployed to VPS for production. Plans must account for both tracks: local dev setup and VPS production config.

</domain>

<decisions>
## Implementation Decisions

### Session lifetime
- Session persists indefinitely — never expires unless user explicitly logs out
- PocketBase token expiry: handled via silent background auto-refresh (middleware attempts refresh before redirecting to login)
- Token stored in persistent httpOnly cookie — survives browser restarts and new tabs (satisfies AUTH-02)
- No secondary protection or auto-lock — personal device, single user

### Login UX
- Full-screen split layout: left panel (branding) + right panel (form)
- Left panel: background image or abstract pattern with app name overlay
- Error handling: both a toast notification AND an inline error message below the form on failed login
- Redirect after successful login: always goes to `/dashboard` (home)
- No "remember me" toggle needed — session is always persistent

### Profile page (Settings)
- Accessible at `/settings` route
- Editable fields in Phase 1: **display name** and **password change** only
- Avatar upload deferred — will be added in Phase 2 when the UI shell and navbar are ready
- Note: AUTH-04 mentions avatar, but it is explicitly deferred from Phase 1 to keep scope minimal

### Infrastructure
- VPS: already provisioned and hardened (non-root user, SSH key auth done — skip those steps)
- OS: unknown/unspecified — plan should use commands compatible with Debian/Ubuntu-based systems where possible
- Domain: owned, but subdomain not yet configured — plan must include DNS A-record step for PocketBase subdomain
- TLS: Nginx reverse proxy + Let's Encrypt via Certbot
- PocketBase binding: localhost only, Nginx proxies HTTPS externally
- Backups: deferred — manual for now, no automated backup in Phase 1
- Local dev: PocketBase runs locally on Mac for development; VPS config is the production track

### Claude's Discretion
- Exact Nginx config structure and Certbot renewal setup
- PocketBase systemd unit file specifics
- CORS configuration details for PocketBase
- Loading/pending states on the login form
- Exact image/pattern used on the login page left panel
- `/settings` page visual layout and component structure

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — project is a fresh scaffold. No components, hooks, or utilities exist yet.

### Established Patterns
- None yet — this phase establishes the foundational patterns all subsequent phases will follow:
  - PocketBase client factory pattern (required from day one per STATE.md decisions)
  - Cookie-based auth sync between Next.js middleware and PocketBase
  - App Router route structure

### Integration Points
- PocketBase client factory must be established in this phase — Phase 2+ will import it
- `/settings` route created in this phase will be linked from the navbar in Phase 2
- Auth middleware gate created here will protect all future module routes

</code_context>

<specifics>
## Specific Ideas

- Login left panel: background image or abstract pattern (not a solid color) — user specifically chose this over simpler options
- Error feedback: both toast AND inline error on failed login — user explicitly chose both, not one or the other
- Profile lives at `/settings`, not `/profile` — user specifically chose settings-style page for extensibility
- Development is local-first: the planner should include a "local dev" section in plan 01-01 covering how to run PocketBase locally during development

</specifics>

<deferred>
## Deferred Ideas

- Avatar upload — moves to Phase 2 (AUTH-04 partial deferral, cosmetic feature)
- Automated backups (cron + local or S3) — future phase
- VPS OS-specific hardening details — already done by user

</deferred>

---

*Phase: 01-foundation-auth*
*Context gathered: 2026-03-09*
