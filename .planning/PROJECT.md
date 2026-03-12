# lauOS

## What This Is

lauOS es un dashboard personal modular tipo web-app, diseñado para centralizar las herramientas del día a día de Lautaro en un solo lugar. v1.0 entregó un shell base completo y un módulo de finanzas personales con CRUD completo, visualizaciones y soporte ARS/USD. La arquitectura está preparada para crecer con nuevos módulos progresivamente.

## Core Value

El usuario puede ver y gestionar los aspectos clave de su día a día desde un único lugar, sin depender de apps de terceros.

## Requirements

### Validated

- ✓ Usuario puede iniciar sesión con email/contraseña y mantener su sesión activa — v1.0 (AUTH-01, AUTH-02, AUTH-03, AUTH-04)
- ✓ Dashboard home con top navbar, bottom nav mobile y grid de widgets clickeables por módulo — v1.0 (SHLL-01, SHLL-02, SHLL-04)
- ✓ Toggle dark/light mode con preferencia persistente, y color de acento personalizable — v1.0 (SHLL-03, SHLL-05)
- ✓ Módulo de Finanzas: cuentas ARS/USD, transacciones con categorías, saldos calculados con precisión centavo — v1.0 (ACCT-01–04, TRAN-01–05, CATG-01–03)
- ✓ Visualizaciones financieras: resumen mensual, donut de categorías, timeline de saldo, transacciones filtradas — v1.0 (VIZL-01–04)

### Active

- [ ] Módulo de Claude Code Stats: ver métricas de uso y costos (requiere confirmar acceso Anthropic Admin API)
- [ ] Root `/` redirige a `/dashboard` para usuarios autenticados (fix de una línea, tech debt v1.0)
- [ ] Verificación browser de dark mode + accent persistence (localStorage timing + PocketBase roundtrip)
- [ ] AUTH-04: Avatar upload (display name implementado; avatar deferido)
- [ ] Nyquist validation sign-off: `/gsd:validate-phase 1-5`

### Out of Scope

| Feature | Reason |
|---------|--------|
| Integración bancaria automática (Fintoc) | Alta complejidad; entrada manual suficiente para v1 |
| Soporte multi-usuario | Dashboard personal, solo para el dueño |
| App mobile nativa | Web-first; responsive cubre el caso básico |
| Insights con AI | Scope creep; posible v3+ |
| Conversión automática ARS/USD | Multi-tasa argentina hace que la auto-conversión sea imprecisa; TC manual por transacción |
| Real-time polling de APIs externas | On-demand fetch es suficiente para v1 |
| Notas personales | Deferido a v2 |
| Agenda / Calendar | Deferido a v2 |
| Proyectos / Pomodoro | Deferido a v2 |
| Habit tracker | Deferido a v2 |
| Links / Bookmarks | Deferido a v2 |
| Métricas de salud | Deferido a v2 |

## Context

- Usuario único (Lautaro), no multiusuario
- Shipped v1.0 with ~5,659 LOC TypeScript/TSX in 3 days (2026-03-09 → 2026-03-11)
- Tech stack: Next.js 16, PocketBase v0.36.6, Tailwind v4, shadcn/ui, Zustand, recharts, Playwright
- PocketBase runs on VPS behind Nginx TLS (pb.<domain>), Next.js deployed to Vercel
- Finanzas: usuario parte desde cero; maneja ARS y USD; exchange rates via dolarapi.com
- Claude Code Stats: Anthropic Admin API requires org account — must confirm before scoping v1.1

## Constraints

- **Stack Frontend**: Next.js — deploy en Vercel
- **Stack Backend**: Servidor custom en VPS propio de Lautaro
- **Base de datos / Auth / Storage**: PocketBase v0.36.6 — schema immutable after data exists
- **Emails**: Resend para envíos automáticos (alertas, notificaciones futuras)
- **Multi-moneda**: ARS y USD como monedas base del módulo financiero
- **Dev port**: Next.js dev en puerto 3005 (puerto 3000 ocupado en VPS); CORS PocketBase configurado para ese puerto

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| PocketBase como DB/Auth/Storage | Primera vez usándolo; evita auth custom y storage por separado | ✓ Good — trabajó bien; schema migrations simples; hooks JS potentes |
| Backend en VPS propio | Control total; PocketBase corre en el mismo VPS | ✓ Good — sin vendor lock-in; systemd + Nginx TLS estable |
| Next.js para frontend | Estándar para Vercel; SSR útil para Server Actions | ✓ Good — Server Actions simplifican auth y data fetching |
| Entrada manual de transacciones en v1 | Simplicidad > integración bancaria automática | ✓ Good — reduce complejidad; suficiente para uso diario |
| Módulo Claude Stats vía API Anthropic | Fuente de datos oficial sobre usage/costos | — Pending — requiere confirmar acceso Admin API |
| Dinero en centavos enteros en DB | Evitar errores de punto flotante | ✓ Good — fromCentavos/toCentavos helpers funcionan correctamente |
| Exchange rate inmutable al momento de transacción | Historial preciso; no recalcular con TC actual | ✓ Good — semántica clara; dolarapi.com devuelve blue/oficial/tarjeta |
| recharts 2.x (no 3.x) | Label center en PieChart funciona en v2; v3 tenía regresión | ✓ Good — evitó bug en donut chart |
| dolarapi.com (no dolarhoy.com como decía el spec) | Datos equivalentes, API más estable | ✓ Good — blue/oficial/tarjeta presets funcionan |
| Tailwind v4 con valores dinámicos via style="" | Tailwind v4 no puede escanear clases dinámicas en build | ✓ Good — CategoryBadge y accents usan style inline correctamente |
| dev port 3005 (no 3000) | Puerto 3000 ocupado en VPS por otro proyecto | ⚠️ Revisit — playwright.config.ts todavía apunta a 3000; necesita actualización |

---
*Last updated: 2026-03-12 after v1.0 milestone*
