# Phase 3: Finance — Data - Research

**Researched:** 2026-03-10
**Domain:** PocketBase schema design, financial data modeling, Next.js Server Actions CRUD, Argentine exchange rate API
**Confidence:** HIGH (core PocketBase patterns from official docs; dolarapi.com verified via live endpoint)

---

## Summary

Phase 3 builds the entire data layer for the Finance module: three PocketBase collections (accounts, transactions, categories), full CRUD via Server Actions, and a USD exchange rate fetch from dolarapi.com. The most critical decisions are already locked from the Roadmap: integer centavos storage (no floats), immutable exchange rates at transaction time, and user-scoped access rules on every collection.

The two biggest architectural questions this research answers: (1) how to model transfers — the answer is two linked transaction records sharing a `transfer_pair_id` field, both created atomically; (2) how to calculate balances — the answer is compute on the fly from transactions in a Server Action, not a stored field, because PocketBase View collections with per-account SUM + owner filtering are awkward and the data volume for a single-user app is trivially small.

Category seeding for new users is handled by a `pb_hooks/seed_categories.pb.js` file using the `onRecordAfterCreateSuccess` hook on the `users` collection, which creates ~10 default category records immediately after a user is persisted.

**Primary recommendation:** Follow the two-linked-records transfer pattern, compute balances server-side on fetch, use `onlyInt: true` on all amount fields, and proxy all dolarapi.com calls through a Server Action to avoid any CORS exposure.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ACCT-01 | User can create accounts with name and currency (ARS or USD) | Accounts collection schema; currency select field with values ["ARS","USD"]; Server Action createAccount |
| ACCT-02 | User can see current balance per account (computed from transactions) | Balance computed in Server Action via filtered transaction sum; no stored balance field needed |
| ACCT-03 | User can edit or archive accounts | update/soft-delete (archived bool field) via Server Action updateAccount; archive hides from list but preserves transaction history |
| ACCT-04 | User can see total patrimony summary (ARS separate, USD separate) | Server Action aggregates balances by currency; no cross-currency conversion |
| TRAN-01 | User can record income/expense with amount, date, category, optional note | Transactions collection with type select ["income","expense","transfer"], amount_centavos number (onlyInt), date, category relation, note text |
| TRAN-02 | User can record transfer between own accounts | Two linked transaction records (debit + credit) sharing transfer_pair_id; both created atomically in one Server Action |
| TRAN-03 | User can indicate USD transaction and record exchange rate | exchange_rate_centavos number field on transaction (rate × 10000 for 4-decimal precision); populated when account currency = USD |
| TRAN-04 | Exchange rate fetchable from dolarapi.com (blue/oficial/tarjeta) or manually | GET https://dolarapi.com/api/dolares — no auth, CORS-enabled; fetch from Server Action and return to client |
| TRAN-05 | User can edit and delete transactions | updateTransaction / deleteTransaction Server Actions; deleting a transfer deletes both pair records atomically |
| CATG-01 | User can create custom categories with name and icon/color | Categories collection with name, icon (text/emoji), color (text hex); user relation for ownership |
| CATG-02 | User can edit and delete categories | updateCategory / deleteCategory Server Actions; soft-check if category has transactions before delete |
| CATG-03 | System provides default categories on account creation | pb_hooks/seed_categories.pb.js — onRecordAfterCreateSuccess on "users" collection creates ~10 default records |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| pocketbase (JS SDK) | 0.36.x (pinned) | Collection CRUD from Server Actions | Already established in Phase 1; two-client factory pattern in place |
| Next.js Server Actions | 15 (App Router) | All data mutations | Pattern established in Phase 2 (profile.ts, auth.ts) |
| PocketBase pb_hooks | Built-in (0.36.6) | Server-side hooks for category seeding | Only way to trigger server-side logic on user creation without a separate service |
| PocketBase pb_migrations | Built-in (0.36.6) | Schema definition as code | Allows schema to be versioned and reproducible |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| dolarapi.com REST API | N/A (free, no auth) | Fetch live USD/ARS rates | Called from Server Action only; not from client |
| shadcn/ui | Latest | Form inputs, selects, dialogs | Already installed; use for all Finance UI forms |
| base-ui/react | Latest | Tabs (established in Phase 2) | Use for Finance sub-navigation tabs if needed |
| Zustand | Latest | Client-side optimistic UI state | Already installed; use sparingly — server state drives truth |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Compute balance in Server Action | PocketBase View collection with SUM | View collections require a static SQL query; per-user filtering inside a view is possible but cumbersome. For a single-user app, computing in a Server Action over <1000 records is instant and simpler. |
| Two linked transfer records | One transfer record referencing both accounts | One record means both `from_account` and `to_account` fields on every transaction, most of which are null. Two linked records are cleaner and keep balance calculation logic uniform (sum by account). |
| dolarapi.com | dolarhoy.com direct scrape | dolarhoy.com has no documented public API; dolarapi.com wraps public data with a proper JSON REST endpoint, no auth required. |

**No additional npm installs required.** All stack components are already in the project.

---

## Architecture Patterns

### Recommended Project Structure
```
lauos/src/
├── app/(protected)/finance/
│   ├── page.tsx                  # Finance overview / account list
│   ├── accounts/
│   │   ├── page.tsx              # Account list + patrimony summary
│   │   └── [id]/page.tsx         # Per-account transaction list
│   ├── transactions/
│   │   └── new/page.tsx          # Transaction entry form (or modal)
│   └── categories/
│       └── page.tsx              # Category management
├── components/finance/
│   ├── account-card.tsx          # Single account with balance
│   ├── account-form.tsx          # Create/edit account
│   ├── transaction-form.tsx      # Create/edit transaction (income/expense/transfer)
│   ├── transaction-list.tsx      # Table/list of transactions
│   ├── category-badge.tsx        # Icon + color chip
│   ├── category-form.tsx         # Create/edit category
│   └── exchange-rate-picker.tsx  # dolarapi.com fetch + manual override
├── lib/actions/
│   ├── accounts.ts               # createAccount, updateAccount, archiveAccount, getAccounts, getBalance
│   ├── transactions.ts           # createTransaction, createTransfer, updateTransaction, deleteTransaction
│   └── categories.ts             # createCategory, updateCategory, deleteCategory, getCategories
└── lib/
    └── money.ts                  # centavos <-> display conversion helpers
```

```
pocketbase/
├── pb_migrations/
│   ├── 1_create_accounts.js
│   ├── 2_create_categories.js
│   └── 3_create_transactions.js
└── pb_hooks/
    └── seed_categories.pb.js     # Default category seeding on user create
```

### Pattern 1: PocketBase Collection Schema (JavaScript Migration)

**What:** Define collections, fields, and access rules as JS migration files in `pb_migrations/`. Applied automatically on server start.

**When to use:** Any time schema changes — never edit schema through the Admin UI without also writing the migration file.

**Example:**
```javascript
// pb_migrations/1_create_accounts.js
migrate((app) => {
  const collection = new Collection({
    type: "base",
    name: "accounts",
    listRule: "@request.auth.id != '' && user = @request.auth.id",
    viewRule: "@request.auth.id != '' && user = @request.auth.id",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != '' && user = @request.auth.id",
    deleteRule: "@request.auth.id != '' && user = @request.auth.id",
    fields: [
      { type: "relation", name: "user", collectionId: "_pb_users_auth_", required: true, maxSelect: 1 },
      { type: "text",     name: "name", required: true, max: 100 },
      { type: "select",   name: "currency", values: ["ARS", "USD"], required: true, maxSelect: 1 },
      { type: "bool",     name: "archived", required: false },
    ],
  })
  app.save(collection)
}, (app) => {
  app.delete(app.findCollectionByNameOrId("accounts"))
})
```

### Pattern 2: User-Scoped Access Rules

**What:** Every Finance collection carries `user` as a required relation field pointing to `_pb_users_auth_`. All rules reference `@request.auth.id`.

**When to use:** All Finance collections — accounts, transactions, categories.

**The five rules (copy for every collection):**
```
listRule:   "@request.auth.id != '' && user = @request.auth.id"
viewRule:   "@request.auth.id != '' && user = @request.auth.id"
createRule: "@request.auth.id != ''"
updateRule: "@request.auth.id != '' && user = @request.auth.id"
deleteRule: "@request.auth.id != '' && user = @request.auth.id"
```

For `createRule`, the `user` field must be set to `@request.auth.id` in the request body — the rule does not enforce this automatically. The Server Action must always set `user: pb.authStore.record?.id` when creating records.

### Pattern 3: Integer Centavos Storage

**What:** All monetary amounts stored as whole integers representing centavos (ARS) or cents (USD), multiplied by 100. Exchange rates stored multiplied by 10000 to preserve 4 decimal places (e.g., 1,420.5 ARS/USD = 14205000).

**When to use:** `amount_centavos` on transactions; `exchange_rate_stored` on USD transactions.

**Why:** PocketBase NumberField stores float64 internally, but with `onlyInt: true` the field rejects decimals at the API level. Storing as integer centavos means 0.1 + 0.2 = 0.3 is never a problem — math stays integer-only until display time.

```typescript
// Source: project convention — money.ts
// Store: user inputs "1234.56" → store 123456
export const toCentavos = (display: string): number =>
  Math.round(parseFloat(display) * 100)

// Display: 123456 → "1.234,56" (AR locale)
export const fromCentavos = (centavos: number): string =>
  (centavos / 100).toLocaleString('es-AR', { minimumFractionDigits: 2 })

// Exchange rate: "1420.50" → 14205000 (×10000, onlyInt)
export const toRateCentavos = (rate: string): number =>
  Math.round(parseFloat(rate) * 10000)

export const fromRateCentavos = (stored: number): number =>
  stored / 10000
```

**NumberField migration config:**
```javascript
{ type: "number", name: "amount_centavos", required: true, onlyInt: true, min: 1 }
{ type: "number", name: "exchange_rate_stored", required: false, onlyInt: true, min: 0 }
```

### Pattern 4: Transfer — Two Linked Records

**What:** A transfer creates two transaction records atomically. Both share a `transfer_pair_id` (text field, set to the first record's generated ID or a UUID). The `from` side has `type = "transfer_out"`, the `to` side has `type = "transfer_in"`.

**When to use:** Any time Lautaro moves money between two of his own accounts.

**Balance calculation consequence:** Balance = SUM of all transactions for an account where `type = "income"` or `type = "transfer_in"` MINUS SUM where `type = "expense"` or `type = "transfer_out"`. Uniform arithmetic — no special transfer handling.

```typescript
// Source: Server Action pattern — transactions.ts
export async function createTransferAction(data: {
  fromAccountId: string
  toAccountId: string
  amountCentavos: number
  date: string
  note?: string
  userId: string
}): Promise<{ error?: string }> {
  const pb = await createServerClient()
  if (!pb.authStore.isValid) return { error: 'Not authenticated' }

  // Generate a shared pair ID (use the "out" record's ID after first save)
  const outRecord = await pb.collection('transactions').create({
    user: data.userId,
    account: data.fromAccountId,
    type: 'transfer_out',
    amount_centavos: data.amountCentavos,
    date: data.date,
    note: data.note ?? '',
    transfer_pair_id: '',   // will backfill below
  })

  const inRecord = await pb.collection('transactions').create({
    user: data.userId,
    account: data.toAccountId,
    type: 'transfer_in',
    amount_centavos: data.amountCentavos,
    date: data.date,
    note: data.note ?? '',
    transfer_pair_id: outRecord.id,
  })

  // Backfill pair ID on the out record
  await pb.collection('transactions').update(outRecord.id, {
    transfer_pair_id: inRecord.id,  // cross-reference
  })

  revalidatePath('/finance')
  return {}
}
```

**Deletion:** When deleting either half of a transfer, look up `transfer_pair_id` and delete both records. The Server Action must enforce this.

### Pattern 5: Balance Computation in Server Action

**What:** Balance is never stored. It is computed fresh each time the accounts page loads or after any mutation.

```typescript
// Source: Server Action pattern — accounts.ts
export async function getAccountBalanceAction(
  accountId: string
): Promise<{ balanceCentavos: number; error?: string }> {
  const pb = await createServerClient()
  if (!pb.authStore.isValid) return { balanceCentavos: 0, error: 'Not authenticated' }

  const transactions = await pb.collection('transactions').getFullList({
    filter: `account = "${accountId}"`,
    fields: 'type,amount_centavos',
  })

  let balance = 0
  for (const tx of transactions) {
    if (tx.type === 'income' || tx.type === 'transfer_in') {
      balance += tx.amount_centavos
    } else {
      balance -= tx.amount_centavos
    }
  }

  return { balanceCentavos: balance }
}
```

### Pattern 6: dolarapi.com Rate Fetch (Server Action)

**What:** Exchange rates fetched server-side only, returned to the client as a plain object.

**Endpoint:** `GET https://dolarapi.com/api/dolares` — returns array of all rate types.

**Key rate types:** `casa: "blue"`, `casa: "oficial"`, `casa: "tarjeta"`.

**Response shape (confirmed via live endpoint):**
```json
[
  { "moneda": "USD", "casa": "blue",    "nombre": "Blue",    "compra": 1380, "venta": 1400, "fechaActualizacion": "2026-03-10T..." },
  { "moneda": "USD", "casa": "oficial", "nombre": "Oficial", "compra": 1370, "venta": 1375, "fechaActualizacion": "2026-03-10T..." },
  { "moneda": "USD", "casa": "tarjeta", "nombre": "Tarjeta", "compra": null, "venta": 1846, "fechaActualizacion": "2026-03-10T..." }
]
```

```typescript
// Source: Server Action pattern — transactions.ts
export async function fetchDolarRatesAction(): Promise<{
  rates?: { blue: number; oficial: number; tarjeta: number }
  error?: string
}> {
  try {
    const res = await fetch('https://dolarapi.com/api/dolares', {
      next: { revalidate: 300 }, // cache 5 min — Next.js fetch cache
    })
    if (!res.ok) throw new Error('fetch failed')
    const data = await res.json()
    const find = (casa: string) =>
      data.find((r: { casa: string }) => r.casa === casa)?.venta ?? null
    return {
      rates: {
        blue:    find('blue'),
        oficial: find('oficial'),
        tarjeta: find('tarjeta'),
      },
    }
  } catch {
    return { error: 'No se pudo obtener la cotización. Ingresala manualmente.' }
  }
}
```

**CORS:** dolarapi.com has CORS enabled — but fetching from a Server Action means the browser never makes the cross-origin request directly. No CORS concerns.

### Pattern 7: Category Seeding (pb_hooks)

**What:** When a new user is created, a hook creates ~10 default categories owned by that user.

```javascript
// pb_hooks/seed_categories.pb.js
onRecordAfterCreateSuccess((e) => {
  const categoriesCollection = e.app.findCollectionByNameOrId("categories")

  const defaults = [
    { name: "Vivienda",      icon: "🏠", color: "#6366f1" },
    { name: "Alimentación",  icon: "🛒", color: "#22c55e" },
    { name: "Transporte",    icon: "🚗", color: "#f59e0b" },
    { name: "Salud",         icon: "💊", color: "#ef4444" },
    { name: "Sueldo",        icon: "💼", color: "#3b82f6" },
    { name: "Entretenimiento", icon: "🎮", color: "#a855f7" },
    { name: "Educación",     icon: "📚", color: "#14b8a6" },
    { name: "Ropa",          icon: "👕", color: "#f97316" },
    { name: "Servicios",     icon: "⚡", color: "#64748b" },
    { name: "Otros",         icon: "📦", color: "#94a3b8" },
  ]

  for (const cat of defaults) {
    const record = new Record(categoriesCollection)
    record.set("user", e.record.id)
    record.set("name", cat.name)
    record.set("icon", cat.icon)
    record.set("color", cat.color)
    e.app.save(record)
  }

  e.next()
}, "users")
```

### Anti-Patterns to Avoid

- **Storing balance as a field:** Balance would go stale after every transaction insert, update, or delete unless you also update the account record. Single-user, low-volume data makes fresh computation safe and simple.
- **Storing exchange rates as floats:** 1420.5 ARS/USD stored as float will accumulate rounding error when multiplied by centavo amounts. Always store as `rate × 10000` integer.
- **Fetching dolarapi.com from the browser:** Unnecessary; exposes the external API call in client bundles and creates CORS uncertainty. Always fetch from a Server Action.
- **Single transaction record for transfers:** Requires special-casing in every balance calculation. Two linked records make balance math uniform.
- **Deleting one leg of a transfer without the other:** Produces an orphaned record and an incorrect balance on the other account. Server Action must always find and delete both pair records.
- **Allowing categories to be deleted without checking for linked transactions:** Transactions hold a relation to category; deleting the category will leave orphaned relation IDs. The Server Action must check or soft-delete.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Currency display formatting | Custom number formatter | `Number.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })` or a thin `fromCentavos()` helper | Locale-aware, handles thousand separators, peso sign, automatically |
| Exchange rate data | Web scraping dolarhoy.com | `GET https://dolarapi.com/api/dolares` | dolarapi.com is a maintained public API with proper JSON; scraping is fragile |
| Color picker UI | Custom color wheel | `<input type="color">` wrapped in shadcn/ui or a simple hex swatch grid | Category colors are user-facing cosmetic choices; full color picker is overkill |
| Icon picker | Custom emoji search | An emoji string input field or a small fixed grid of ~20 finance-relevant emojis | CATG-01 says "icon/color" — a simple emoji text field satisfies this |
| Atomic multi-record create | Custom transaction wrapper | Two sequential Server Action `create` calls with cleanup on second failure | PocketBase JS SDK has no client-side transaction API; two sequential creates + error handling is the correct pattern |

**Key insight:** The hardest problems (precision, formatting, rate fetching) have trivially small solutions in this project's context. Don't over-engineer.

---

## Complete Schema Reference

### `accounts` collection
| Field | Type | Config | Notes |
|-------|------|--------|-------|
| id | auto | PocketBase-managed | |
| user | relation | required, maxSelect:1, collectionId: users | Owner field for all access rules |
| name | text | required, max:100 | Account display name |
| currency | select | required, values:["ARS","USD"], maxSelect:1 | Currency of denomination |
| archived | bool | default:false | Soft-delete; archived accounts hidden from list |
| created | auto | PocketBase-managed | |
| updated | auto | PocketBase-managed | |

### `categories` collection
| Field | Type | Config | Notes |
|-------|------|--------|-------|
| id | auto | PocketBase-managed | |
| user | relation | required, maxSelect:1, collectionId: users | Owner; defaults seeded by pb_hook |
| name | text | required, max:60 | |
| icon | text | required, max:10 | Emoji string e.g. "🛒" |
| color | text | required, max:7 | Hex color e.g. "#22c55e" |
| created | auto | PocketBase-managed | |

### `transactions` collection
| Field | Type | Config | Notes |
|-------|------|--------|-------|
| id | auto | PocketBase-managed | |
| user | relation | required, maxSelect:1, collectionId: users | Owner |
| account | relation | required, maxSelect:1, collectionId: accounts | The account this transaction affects |
| type | select | required, values:["income","expense","transfer_in","transfer_out"], maxSelect:1 | Drives balance sign |
| amount_centavos | number | required, onlyInt:true, min:1 | Amount in centavos (ARS) or cents (USD) |
| date | date | required | User-specified transaction date (not created timestamp) |
| category | relation | required for income/expense, maxSelect:1, collectionId: categories | Not required for transfers |
| note | text | optional, max:300 | |
| exchange_rate_stored | number | optional, onlyInt:true | Rate × 10000; only present for USD-account transactions |
| transfer_pair_id | text | optional, max:30 | ID of the paired transfer record; set on both legs |
| created | auto | PocketBase-managed | |
| updated | auto | PocketBase-managed | |

---

## Common Pitfalls

### Pitfall 1: createRule Does Not Enforce the `user` Field
**What goes wrong:** The `createRule` is `@request.auth.id != ''`, which only checks that a user is logged in. If the Server Action forgets to set `user: pb.authStore.record?.id`, the record is created with no owner and is invisible to all users (but exists in the DB).
**Why it happens:** PocketBase rules are filters, not field setters. They don't auto-populate fields.
**How to avoid:** Every `create` call in Server Actions for Finance collections must explicitly include `user: pb.authStore.record?.id`. Add a shared helper if needed.
**Warning signs:** Records created successfully but not appearing in lists.

### Pitfall 2: PocketBase Session Not Valid in Server Action
**What goes wrong:** `pb.authStore.isValid` is false inside the Server Action even though the user is logged in in the browser. The `createServerClient()` reads the `pb_auth` cookie, but if the cookie is missing or the token is expired, `isValid` returns false.
**Why it happens:** Server Actions use the `createServerClient()` factory which reads cookies per-request. The token may have expired (though we set 365-day expiry in Phase 1, this remains a defensive check).
**How to avoid:** Always check `if (!pb.authStore.isValid) return { error: 'Not authenticated' }` at the top of every Finance Server Action.

### Pitfall 3: Orphaned Transfer Leg on Delete
**What goes wrong:** User deletes a `transfer_out` transaction. The paired `transfer_in` still exists on the target account. That account's balance is now inflated by the ghost credit.
**Why it happens:** If the delete action only deletes the selected record ID.
**How to avoid:** The `deleteTransaction` Server Action must check `transfer_pair_id`. If non-empty, fetch and delete both records. Wrap in a try-catch; if the pair record no longer exists (was already cleaned up), ignore the error.

### Pitfall 4: Float Slippage at the Display Conversion Boundary
**What goes wrong:** Stored centavos = 123456, displayed as "1234.56". User edits and resubmits "1234.56", but `parseFloat("1234.56") * 100` = 123455.99999... so `Math.round()` is critical.
**Why it happens:** `parseFloat` + multiplication in floating-point land before the round.
**How to avoid:** Always use `Math.round(parseFloat(input) * 100)` — never truncate. Test with values like "1234.565" and "0.01".
**Warning signs:** Balance drifts by 1 centavo over repeated edit-and-save cycles.

### Pitfall 5: dolarapi.com Unavailability Blocking Transaction Entry
**What goes wrong:** If dolarapi.com is down, the transaction form cannot be submitted because the rate fetch fails.
**Why it happens:** Rate fetch result used as required input with no fallback.
**How to avoid:** Rate fetch is best-effort. The UI must always show a manual rate input field. Pre-populate it with the fetched value if available, but never require the fetch to succeed. The Server Action stores whatever rate the user provides.

### Pitfall 6: Archived Account Still Accepts New Transactions
**What goes wrong:** User archives an account but the transaction form still lists it.
**How to avoid:** The account selector in the transaction form must filter `archived = false`. The Server Action creating a transaction should also validate the account is not archived.

### Pitfall 7: Category Deleted With Linked Transactions
**What goes wrong:** User deletes a category that is still referenced by existing transactions. The transaction records now have a dangling relation ID.
**How to avoid:** Before deleting a category, query `transactions` for any record with `category = categoryId`. If found, either block deletion with a user-facing error ("This category has N transactions. Reassign them first.") or soft-delete by adding an `archived` flag to categories.

---

## Code Examples

### Server Action — createAccount
```typescript
// lib/actions/accounts.ts
'use server'
import { createServerClient } from '@/lib/pocketbase-server'
import { revalidatePath } from 'next/cache'

export async function createAccountAction(data: {
  name: string
  currency: 'ARS' | 'USD'
}): Promise<{ id?: string; error?: string }> {
  const pb = await createServerClient()
  if (!pb.authStore.isValid) return { error: 'Not authenticated' }

  try {
    const record = await pb.collection('accounts').create({
      user: pb.authStore.record?.id,
      name: data.name.trim(),
      currency: data.currency,
      archived: false,
    })
    revalidatePath('/finance')
    return { id: record.id }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to create account'
    return { error: msg }
  }
}
```

### Server Action — getAccounts with Balances
```typescript
// lib/actions/accounts.ts
export async function getAccountsWithBalancesAction(): Promise<{
  accounts?: Array<{ id: string; name: string; currency: string; balanceCentavos: number }>
  error?: string
}> {
  const pb = await createServerClient()
  if (!pb.authStore.isValid) return { error: 'Not authenticated' }

  const accounts = await pb.collection('accounts').getFullList({
    filter: 'archived = false',
    sort: 'created',
  })

  // Fetch all transactions once, group by account
  const transactions = await pb.collection('transactions').getFullList({
    fields: 'account,type,amount_centavos',
  })

  const balanceMap = new Map<string, number>()
  for (const tx of transactions) {
    const current = balanceMap.get(tx.account) ?? 0
    const delta = (tx.type === 'income' || tx.type === 'transfer_in')
      ? tx.amount_centavos
      : -tx.amount_centavos
    balanceMap.set(tx.account, current + delta)
  }

  return {
    accounts: accounts.map(a => ({
      id: a.id,
      name: a.name,
      currency: a.currency,
      balanceCentavos: balanceMap.get(a.id) ?? 0,
    }))
  }
}
```

### Money Helpers
```typescript
// lib/money.ts
export const toCentavos = (display: string): number =>
  Math.round(parseFloat(display) * 100)

export const fromCentavos = (centavos: number, currency: 'ARS' | 'USD'): string => {
  const value = centavos / 100
  if (currency === 'ARS') {
    return value.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })
  }
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

export const toRateStored = (rate: string): number =>
  Math.round(parseFloat(rate) * 10000)

export const fromRateStored = (stored: number): string =>
  (stored / 10000).toFixed(2)
```

### dolarapi.com Fetch
```typescript
// Confirmed via live endpoint 2026-03-10
// GET https://dolarapi.com/api/dolares — free, no auth, CORS enabled
// Returns array; key fields per item: casa, compra, venta, fechaActualizacion

type DolarRate = {
  moneda: string
  casa: 'blue' | 'oficial' | 'tarjeta' | 'bolsa' | 'contadoconliqui' | 'mayorista' | 'cripto'
  nombre: string
  compra: number | null
  venta: number | null
  fechaActualizacion: string
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| PocketBase Go hooks | PocketBase JS hooks (`pb_hooks/*.pb.js`) | v0.17+ stable | No custom Go binary needed; JS hooks are hot-reloaded |
| `migrate up` CLI command | Auto-apply on serve | Always | Migrations in `pb_migrations/` run automatically on `./pocketbase serve` |
| NumberField with decimals | NumberField with `onlyInt: true` | v0.23 | Enforces integer at API validation level |
| Manual CRUD via raw fetch | PocketBase JS SDK `pb.collection().create()` | Phase 1 pattern | Already established; consistent with project |

**Deprecated/outdated:**
- `onRecordBeforeCreateRequest`: older PocketBase hook name — current API is `onRecordAfterCreateSuccess` (post-persist hook, fires after DB commit).
- `pb.admins.authWithPassword()`: PocketBase v0.23+ uses superusers (`pb.collection('_superusers')`), but this doesn't affect our app — we only use regular user auth.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright (already installed and configured) |
| Config file | `lauos/playwright.config.ts` |
| Quick run command | `cd lauos && npx playwright test tests/finance.spec.ts` |
| Full suite command | `cd lauos && npx playwright test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ACCT-01 | Create account with name + currency appears in list | E2E | `npx playwright test tests/finance.spec.ts --grep "ACCT-01"` | ❌ Wave 0 |
| ACCT-02 | Account displays correct balance computed from transactions | E2E | `npx playwright test tests/finance.spec.ts --grep "ACCT-02"` | ❌ Wave 0 |
| ACCT-03 | Archive account removes it from list | E2E | `npx playwright test tests/finance.spec.ts --grep "ACCT-03"` | ❌ Wave 0 |
| ACCT-04 | Patrimony summary shows ARS total and USD total separately | E2E | `npx playwright test tests/finance.spec.ts --grep "ACCT-04"` | ❌ Wave 0 |
| TRAN-01 | Create income/expense transaction visible in account list | E2E | `npx playwright test tests/finance.spec.ts --grep "TRAN-01"` | ❌ Wave 0 |
| TRAN-02 | Transfer updates both account balances correctly | E2E | `npx playwright test tests/finance.spec.ts --grep "TRAN-02"` | ❌ Wave 0 |
| TRAN-03 | USD transaction stores exchange rate, not recalculated later | E2E | `npx playwright test tests/finance.spec.ts --grep "TRAN-03"` | ❌ Wave 0 |
| TRAN-04 | Rate fetched from dolarapi shows in rate field; manual override accepted | E2E | `npx playwright test tests/finance.spec.ts --grep "TRAN-04"` | ❌ Wave 0 |
| TRAN-05 | Edit and delete transaction updates balance | E2E | `npx playwright test tests/finance.spec.ts --grep "TRAN-05"` | ❌ Wave 0 |
| CATG-01 | Create custom category with icon and color | E2E | `npx playwright test tests/finance.spec.ts --grep "CATG-01"` | ❌ Wave 0 |
| CATG-02 | Edit and delete category | E2E | `npx playwright test tests/finance.spec.ts --grep "CATG-02"` | ❌ Wave 0 |
| CATG-03 | Default categories exist after login (seeded on user create) | E2E | `npx playwright test tests/finance.spec.ts --grep "CATG-03"` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `cd lauos && npx playwright test tests/finance.spec.ts`
- **Per wave merge:** `cd lauos && npx playwright test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `lauos/tests/finance.spec.ts` — covers all ACCT-*, TRAN-*, CATG-* requirements
- [ ] Default categories seeding requires a test user account that was created after the `pb_hooks` file is deployed — note in test setup comments

---

## Open Questions

1. **PocketBase migration file numbering convention**
   - What we know: pb_migrations uses timestamp-prefixed filenames by default (e.g., `1687801090_create_accounts.js`)
   - What's unclear: Whether we use sequential integers (1_, 2_, 3_) or timestamps; timestamps are safer for ordering but harder to read
   - Recommendation: Use Unix timestamps generated at plan time to match PocketBase's auto-generated migration naming convention. The planner should specify timestamps in the PLAN.

2. **Category required on transfer transactions**
   - What we know: TRAN-01 requires category for income/expense; TRAN-02 (transfers) has no mention of category
   - What's unclear: Whether the UI should allow an optional category on transfers for tracking purposes
   - Recommendation: Make `category` optional on transfer_in/transfer_out records at the DB level (no `required: true`). The UI form skips the category selector for transfer type. This can be relaxed later.

3. **Balance for archived accounts**
   - What we know: Archived accounts are hidden from the main list; their transactions still exist
   - What's unclear: Should patrimony summary include archived account balances?
   - Recommendation: Exclude archived accounts from patrimony summary. Their historical transactions remain queryable for the Insights phase (Phase 4).

---

## Sources

### Primary (HIGH confidence)
- `https://pocketbase.io/docs/api-rules-and-filters/` — access rule syntax, `@request.auth.id` pattern
- `https://pocketbase.io/docs/js-migrations/` — collection creation syntax, field types, migration structure
- `https://pocketbase.io/docs/js-event-hooks/` — `onRecordAfterCreateSuccess` hook syntax, `e.next()` requirement
- `https://pocketbase.io/docs/js-records/` — `new Record(collection)`, `record.set()`, `e.app.save()` pattern
- `https://pocketbase.io/docs/collections/` — field types including NumberField, SelectField, RelationField, View collections
- `https://dolarapi.com/api/dolares` — live endpoint verified 2026-03-10; confirmed response shape, no auth required

### Secondary (MEDIUM confidence)
- `https://github.com/pocketbase/pocketbase/discussions/3113` — NumberField is float64; `onlyInt: true` enforces integer at validation layer; recommended for centavos storage
- `https://github.com/pocketbase/pocketbase/discussions/3753` — View collection SUM pattern; `SELECT 'id' as id, SUM(col) FROM table` — confirmed requirement for id field

### Tertiary (LOW confidence)
- WebSearch results on transfer patterns — no official PocketBase docs on this; two-linked-records recommendation is derived from the constraint that PocketBase has no client-side transaction API and the balance calculation must be uniform across transaction types.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all components already installed; no new dependencies
- Schema design: HIGH — official PocketBase docs consulted for all field types and migration syntax
- Access rules: HIGH — official docs + verified syntax
- dolarapi.com API: HIGH — live endpoint queried 2026-03-10
- Transfer pattern: MEDIUM — derived from PocketBase constraints; no official reference implementation
- Category seeding hook: MEDIUM — hook syntax verified in official docs; exact `Record` constructor and `e.app.save()` pattern confirmed

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (PocketBase 0.36.6 is pinned; dolarapi.com is a community-maintained free API that could change endpoint structure)
