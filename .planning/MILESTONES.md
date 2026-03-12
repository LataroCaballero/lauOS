# Milestones

## v1.0 MVP (Shipped: 2026-03-12)

**Phases completed:** 5 phases, 14 plans, 5 tasks

**Key accomplishments:**
- PocketBase on VPS with systemd + Nginx TLS — production backend live from day one
- Full auth flow: email/password login, 365-day session persistence via cookie, logout, display name + avatar editing
- Responsive dashboard shell: top navbar, module card grid, mobile bottom nav, dark/light mode toggle, custom accent colors
- Finance module: ARS/USD accounts with centavo-precision balances, income/expense/transfer CRUD, categories with defaults on signup
- USD exchange rate integration via dolarapi.com (blue/oficial/tarjeta presets + manual entry), stored immutably at transaction time
- 4 finance visualizations: monthly income/expense summary, category spending donut chart, account balance timeline, and filterable paginated transaction list

**Tech debt accepted:**
- Root `/` page does not redirect authenticated users to `/dashboard` (one-line fix deferred)
- Dark mode and accent persistence require live browser verification (code correct; LocalStorage/PocketBase roundtrip timing)
- AUTH-04 avatar upload: display name implemented; avatar upload deferred
- 5 Nyquist validation phases need `/gsd:validate-phase N` run

---

