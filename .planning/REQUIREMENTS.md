# Requirements: lauOS

**Defined:** 2026-03-09
**Core Value:** El usuario puede ver y gestionar los aspectos clave de su día a día desde un único lugar, sin depender de apps de terceros.

## v1 Requirements

### Authentication

- [x] **AUTH-01**: Usuario puede iniciar sesión con email y contraseña
- [x] **AUTH-02**: La sesión persiste al refrescar el browser o abrir nuevas pestañas
- [x] **AUTH-03**: Usuario puede cerrar sesión desde cualquier página
- [x] **AUTH-04**: Usuario puede ver y editar su perfil (nombre y avatar)

### Shell

- [ ] **SHLL-01**: Top navbar muestra links a módulos, nombre de usuario y opción de logout
- [ ] **SHLL-02**: Página home con grid de widgets clickeables (una card por módulo disponible)
- [ ] **SHLL-03**: Toggle dark/light mode con preferencia persistente
- [ ] **SHLL-04**: Layout responsive usable en mobile
- [ ] **SHLL-05**: Color de acento personalizable desde configuración, persistido en perfil de usuario

### Finance — Accounts

- [ ] **ACCT-01**: Usuario puede crear cuentas con nombre y moneda (ARS o USD)
- [ ] **ACCT-02**: Usuario puede ver el saldo actual de cada cuenta (calculado desde transacciones)
- [ ] **ACCT-03**: Usuario puede editar o archivar cuentas existentes
- [ ] **ACCT-04**: Usuario puede ver resumen de patrimonio total (ARS por un lado, USD por otro)

### Finance — Transactions

- [ ] **TRAN-01**: Usuario puede registrar ingresos y egresos con monto, fecha, categoría y nota opcional
- [ ] **TRAN-02**: Usuario puede registrar transferencias entre sus propias cuentas
- [ ] **TRAN-03**: Usuario puede indicar que una transacción fue en USD y registrar el tipo de cambio usado
- [ ] **TRAN-04**: El tipo de cambio para transacciones USD puede obtenerse desde dolarhoy.com (blue, oficial o tarjeta) o ingresarse manualmente
- [ ] **TRAN-05**: Usuario puede editar y eliminar transacciones existentes

### Finance — Categories

- [ ] **CATG-01**: Usuario puede crear categorías personalizadas con nombre e ícono/color
- [ ] **CATG-02**: Usuario puede editar y eliminar categorías
- [ ] **CATG-03**: El sistema provee un set de categorías por defecto al crear la cuenta

### Finance — Visualizations

- [ ] **VIZL-01**: Usuario puede ver resumen mensual con total de ingresos vs egresos
- [ ] **VIZL-02**: Usuario puede ver gráfico de distribución de gastos por categoría del mes actual
- [ ] **VIZL-03**: Usuario puede ver evolución de saldo en el tiempo como gráfico de línea
- [ ] **VIZL-04**: Usuario puede ver listado de transacciones recientes con filtros por cuenta, categoría y rango de fechas

## v2 Requirements

### Claude Code Stats

- **CLAU-01**: Usuario puede ver estadísticas de uso de Claude Code desde logs locales (~/.claude/)
- **CLAU-02**: Usuario puede ver actividad por día/semana/proyecto
- **CLAU-03**: Módulo requiere definir approach técnico antes de planificar (logs locales vs. alternativa)

### Notes

- **NOTE-01**: Usuario puede crear y editar notas personales con texto libre
- **NOTE-02**: Usuario puede organizar notas con tags

### Agenda

- **AGND-01**: Usuario puede crear y ver eventos en un calendario
- **AGND-02**: Vista semanal y mensual

### Productivity

- **PROD-01**: Tracker de tiempo por proyecto con técnica Pomodoro
- **PROD-02**: Habit tracker diario con racha y visualización

### Tools

- **TOOL-01**: Guardar links con tags (bookmarks propios)
- **TOOL-02**: Métricas de salud con entrada manual (pasos, sueño, agua)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Integración bancaria automática (Fintoc) | Alta complejidad, entrada manual suficiente para v1 |
| Soporte multi-usuario | Dashboard personal, solo para el dueño |
| App mobile nativa | Web-first; responsive cubre el caso básico |
| Insights con AI | Scope creep para v1; posible v3+ |
| Conversión automática ARS/USD | Multi-tasa argentina hace que la auto-conversión sea imprecisa; TC manual por transacción |
| Real-time polling de APIs externas | On-demand fetch es suficiente para v1 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 1 | Complete |
| AUTH-03 | Phase 1 | Complete |
| AUTH-04 | Phase 1 | Complete |
| SHLL-01 | Phase 2 | Pending |
| SHLL-02 | Phase 2 | Pending |
| SHLL-03 | Phase 2 | Pending |
| SHLL-04 | Phase 2 | Pending |
| SHLL-05 | Phase 2 | Pending |
| ACCT-01 | Phase 3 | Pending |
| ACCT-02 | Phase 3 | Pending |
| ACCT-03 | Phase 3 | Pending |
| ACCT-04 | Phase 3 | Pending |
| TRAN-01 | Phase 3 | Pending |
| TRAN-02 | Phase 3 | Pending |
| TRAN-03 | Phase 3 | Pending |
| TRAN-04 | Phase 3 | Pending |
| TRAN-05 | Phase 3 | Pending |
| CATG-01 | Phase 3 | Pending |
| CATG-02 | Phase 3 | Pending |
| CATG-03 | Phase 3 | Pending |
| VIZL-01 | Phase 4 | Pending |
| VIZL-02 | Phase 4 | Pending |
| VIZL-03 | Phase 4 | Pending |
| VIZL-04 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 24 total
- Mapped to phases: 24
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-09*
*Last updated: 2026-03-09 after roadmap creation*
