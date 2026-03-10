# lauOS

## What This Is

lauOS es un dashboard personal modular tipo web-app, diseñado para centralizar las herramientas del día a día de Lautaro en un solo lugar. Arranca con un shell base y módulos de finanzas personales y métricas de Claude Code, con una arquitectura preparada para crecer con nuevos módulos progresivamente.

## Core Value

El usuario puede ver y gestionar los aspectos clave de su día a día desde un único lugar, sin depender de apps de terceros.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Usuario puede iniciar sesión y mantener su sesión activa
- [ ] Dashboard home con top navbar + grid de widgets clickeables por módulo
- [ ] Módulo de Finanzas: registrar cuentas en ARS y USD, cargar transacciones con categorías, ver saldo por cuenta
- [ ] Módulo de Claude Code Stats: ver métricas de uso y costos vía Anthropic usage API
- [ ] Diseño consistente con estilo referencia (clean/moderno, acento amarillo, cards con peso visual)

### Out of Scope

- Notas personales — deferido a v2
- Agenda / Calendar — deferido a v2
- Proyectos / Pomodoro — deferido a v2
- Habit tracker — deferido a v2
- Links / Bookmarks — deferido a v2
- Métricas de salud — deferido a v2
- Mobile app nativa — web-first, responsive después
- Integración bancaria automática (Fintoc, etc.) — entrada manual en v1, posible v2

## Context

- Usuario único (Lautaro), no multiusuario por ahora
- Experiencia con Next.js y ecosistema React
- Primera vez usando PocketBase — oportunidad de aprender la herramienta
- Finanzas: parte desde cero, sin sistema previo; maneja ARS y USD
- Claude Code Stats: datos desde la Anthropic usage API

## Constraints

- **Stack Frontend**: Next.js — deploy en Vercel
- **Stack Backend**: Servidor custom en VPS propio de Lautaro
- **Base de datos / Auth / Storage**: PocketBase — herramienta nueva a explorar
- **Emails**: Resend para envíos automáticos (alertas, notificaciones futuras)
- **Multi-moneda**: ARS y USD como monedas base del módulo financiero

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| PocketBase como DB/Auth/Storage | Primera vez usándolo, buena oportunidad; evita manejar auth custom y storage por separado | — Pending |
| Backend en VPS propio | Control total sobre el backend; PocketBase corre en el mismo VPS | — Pending |
| Next.js para frontend | Estándar para Vercel; soporte SSR/SSG útil para futuras optimizaciones | — Pending |
| Entrada manual de transacciones en v1 | Simplicidad > integración bancaria automática para arrancar | — Pending |
| Módulo Claude Stats vía API Anthropic | Fuente de datos confiable y oficial sobre usage/costos | — Pending |

---
*Last updated: 2026-03-09 after initialization*
