# Pitfalls Research

**Domain:** Personal dashboard web app — Next.js (Vercel) + PocketBase (VPS), multi-currency finance module
**Researched:** 2026-03-09
**Confidence:** HIGH for PocketBase/Next.js integration pitfalls (directly documented in official discussions); MEDIUM for architecture pitfalls (community patterns); HIGH for float precision (well-established JS behavior)

---

## Critical Pitfalls

### Pitfall 1: Shared PocketBase SDK Instance in Server-Side Context

**What goes wrong:**
A single global `new PocketBase(url)` instance is created and imported across server-side code. Because `pb.authStore` is mutable global state, concurrent requests from the single user (or hypothetical future users) overwrite each other's auth tokens. In Next.js App Router, server components run in the same Node.js process, so the global instance persists across requests.

**Why it happens:**
The PocketBase docs show a simple top-level initialization example that looks correct for SPAs. First-time users copy this pattern into a `lib/pocketbase.ts` file and import it everywhere — which works perfectly in client-side SPAs but breaks silently in SSR contexts.

**How to avoid:**
Create a factory function, not a singleton. For server components and route handlers, instantiate a fresh `PocketBase` instance per request and initialize auth from the incoming cookie:
```typescript
// lib/pocketbase.ts
export function createServerPocketBase(cookieHeader?: string) {
  const pb = new PocketBase(process.env.NEXT_PUBLIC_PB_URL);
  if (cookieHeader) {
    pb.authStore.loadFromCookie(cookieHeader);
  }
  return pb;
}
```
For client components, use a single browser instance (safe because each browser tab is isolated). Document the distinction explicitly in the codebase.

**Warning signs:**
- Auth state randomly resets or shows wrong user data
- Works perfectly in local dev (low concurrency) but breaks after deployment
- `pb.authStore.isValid` returns inconsistent results between server and client renders

**Phase to address:** Foundation phase (auth setup). This must be the correct pattern from day one — retrofitting it later requires touching every server component.

---

### Pitfall 2: Next.js Default fetch() Caching Serving Stale PocketBase Data

**What goes wrong:**
Next.js App Router extends the native `fetch()` with persistent server-side caching. By default (Next.js 14 and earlier), fetch requests are cached indefinitely. Financial data (balances, transactions) and Claude Code stats fetched in server components get cached and served stale to the user — showing yesterday's numbers as if they were current.

**Why it happens:**
Next.js's custom `fetch` caching is invisible. Developers don't realize the SDK is using `fetch` under the hood, and PocketBase SDK calls go through this cache without any explicit `cache: 'no-store'` option. The app appears to work but data is frozen.

**How to avoid:**
Pass a custom fetch function to the PocketBase SDK that disables caching, or explicitly set `cache: 'no-store'` on any route segment that renders live data:
```typescript
// In server components rendering financial data
export const dynamic = 'force-dynamic'; // at the top of the file

// Or pass custom fetch to PocketBase SDK
const pb = new PocketBase(url, { fetch: (url, config) => fetch(url, { ...config, cache: 'no-store' }) });
```
For the Anthropic usage API calls, use `revalidateTag` with on-demand revalidation rather than indefinite caching.

**Warning signs:**
- Transaction totals don't update after adding new records
- Claude stats show the same numbers across multiple page loads
- Data only refreshes after a hard refresh or clearing cache
- Works correctly in dev (with `npm run dev`) but breaks in production build

**Phase to address:** Finance module phase and Claude Stats module phase. Add `export const dynamic = 'force-dynamic'` as a default for all dashboard pages, then selectively re-enable caching only where stale data is acceptable.

---

### Pitfall 3: PocketBase Collection API Rules Left Open (No Access Control)

**What goes wrong:**
PocketBase collections are created without configuring List/View/Create/Update/Delete API rules. By default, new collections in PocketBase have no rules set, which means they are accessible only to admins — but once a rule is set incorrectly (e.g., `""` meaning "allow all") the collection becomes publicly accessible without authentication.

**Why it happens:**
The PocketBase admin UI makes it easy to set rules visually, but the rule syntax is non-obvious. First-time users see their data isn't accessible and set rules to empty string `""` (allow all) to "fix" it, not realizing this opens the collection to the public internet.

**How to avoid:**
For this single-user app, every collection rule should be locked to the authenticated user. The correct rule for user-owned records is:
```
@request.auth.id != ""
```
Or for the `transactions` and `accounts` collections where records belong to a user:
```
@request.auth.id = user_id
```
Verify rules immediately after creating any collection by testing unauthenticated requests in the PocketBase API playground. Never use empty string rules in production.

**Warning signs:**
- You can access collection data without being logged in via `curl` or the browser
- The PocketBase dashboard shows a green "accessible" status but the auth rule field is blank
- No auth errors appear when testing with an invalid token

**Phase to address:** Foundation phase (PocketBase setup). Define all collection rules before writing any application code that reads data.

---

### Pitfall 4: Storing Monetary Values as Floats in PocketBase

**What goes wrong:**
Transactions are stored as `number` type fields in PocketBase (which maps to SQLite `REAL`, a 64-bit IEEE 754 float). Amounts like `1500.10` get stored as `1500.0999999999999` due to binary float representation. When summed across many transactions, the rounding errors compound and balance calculations drift. This is especially painful for ARS, where amounts are large numbers (e.g., 150,000 pesos) and small precision errors become visible in UI.

**Why it happens:**
Developers treat money as a number because it looks like a number. The PocketBase UI doesn't warn about float imprecision for `number` fields.

**How to avoid:**
Store all monetary amounts as integers in the smallest denomination unit (centavos for ARS/USD — multiply by 100). Store as `number` in PocketBase but enforce integer-only values at the application layer. Display by dividing by 100 at render time. Never perform `amount * exchangeRate` in floating-point arithmetic; use a library like `currency.js` or `big.js` for all calculations.

```typescript
// Store: Math.round(userInputAmount * 100)  → 150010 (centavos)
// Display: (storedAmount / 100).toFixed(2)   → "1500.10"
// Calculate: currency(balanceInCentavos).add(transactionInCentavos).value
```

**Warning signs:**
- Balance totals show values like `1500.0999999999999` in the UI or API response
- Summing transactions produces a different result than manually adding them
- Exchange rate conversions produce numbers with 14+ decimal places

**Phase to address:** Finance module schema design phase. This must be decided before any transaction data is stored — migration after the fact is painful.

---

### Pitfall 5: PocketBase Process Not Surviving VPS Reboots

**What goes wrong:**
PocketBase is started manually with `./pocketbase serve` during development and testing. The VPS reboots (kernel update, power event, OOM killer) and PocketBase doesn't restart automatically. The dashboard becomes unavailable and the user doesn't notice until they try to log in.

**Why it happens:**
PocketBase is a single binary with no built-in daemon mode. First-time users run it in a terminal session (or screen/tmux) and forget to configure a process supervisor.

**How to avoid:**
Create a systemd unit file immediately after the first successful test on the VPS:
```ini
[Unit]
Description=PocketBase
After=network.target

[Service]
Type=simple
User=pocketbase
ExecStart=/opt/pocketbase/pocketbase serve --http=127.0.0.1:8090
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```
Enable with `systemctl enable pocketbase && systemctl start pocketbase`. Bind to `127.0.0.1` (not `0.0.0.0`) and put Nginx in front for TLS termination.

**Warning signs:**
- PocketBase is started in a terminal or screen session instead of via systemd
- `systemctl status pocketbase` returns "Unit not found"
- No monitoring/alerting configured for the VPS

**Phase to address:** Infrastructure/deployment phase. The systemd unit should be created as part of the first VPS setup, not added later.

---

### Pitfall 6: Forgetting PocketBase Is Not Backward-Compatible Before v1.0

**What goes wrong:**
PocketBase is still pre-1.0 (as of early 2026). Breaking changes between minor versions can corrupt `pb_data` or require manual migration. Updating without a backup leaves no recovery path.

**Why it happens:**
The PocketBase binary auto-update or manual version bump is done casually because "it's just a backend update."

**How to avoid:**
Before every PocketBase update: backup `pb_data` to a separate location (not just the same VPS disk). Use the builtin backup API (`Settings > Backups`) with S3-compatible storage (e.g., Backblaze B2), or script `sqlite3 pb_data/data.db .backup /backups/data-$(date +%Y%m%d).db`. Test updates on a copy of `pb_data` before applying to production. Pin the PocketBase version in deployment scripts.

**Warning signs:**
- PocketBase version is updated without checking the changelog
- `pb_data` backups don't exist or haven't been tested for restorability
- No offsite copy of backups

**Phase to address:** Infrastructure/deployment phase. Backup strategy must be in place before any real data is entered.

---

### Pitfall 7: ARS/USD Exchange Rate Confusion — Mixing Official and Blue Rates

**What goes wrong:**
Argentina has multiple simultaneous USD exchange rates: the official rate, the "blue" (parallel) market rate, MEP, CCL, and crypto rates. The difference between official and blue can be 30-100%+. If the app stores transactions at one rate and displays conversions at another, the balance in USD will be wildly incorrect and confusing.

**Why it happens:**
The user is entering manual transactions without a clear policy about which exchange rate applies. The app might use an API that returns the official rate while the user's real-world transactions happened at the blue rate.

**How to avoid:**
Make the exchange rate a user-entered field on each transaction, not an auto-fetched value. When converting ARS to USD (or vice versa), display the rate used alongside the converted amount. Store the rate used at transaction time in the database — never recalculate historical conversions with a current rate. Consider adding a "rate type" label (official / blue / custom) as a metadata field on transactions.

**Warning signs:**
- The app auto-fetches an exchange rate from an API without letting the user override it
- Converted USD totals don't match what the user knows they have
- Historical transaction displays change their USD value when the rate changes

**Phase to address:** Finance module schema design phase. Decide and document the exchange rate policy before building the UI.

---

### Pitfall 8: Modular Dashboard Becoming a God Component

**What goes wrong:**
All dashboard widget state, data fetching, and layout logic is placed in a single `page.tsx` or `Dashboard.tsx` component. Each new module (Finance, Claude Stats) adds more props, more fetch calls, and more conditional rendering to the same file. After two modules, the component is 600+ lines. Adding a third module requires understanding the full component.

**Why it happens:**
The quickest path to a working dashboard is to build everything in one place. The modular architecture is deferred because "I'll refactor later."

**How to avoid:**
Enforce a feature-folder structure from day one:
```
src/
  modules/
    finance/
      components/
      hooks/
      types.ts
      api.ts
    claude-stats/
      components/
      hooks/
      types.ts
      api.ts
  app/
    dashboard/
      page.tsx  ← thin orchestration only, no business logic
```
Each module exports a single `<ModuleWidget />` component. The dashboard page only imports and arranges widgets. Module-specific data fetching lives inside the module. Modules must not import from each other.

**Warning signs:**
- `page.tsx` has more than 100 lines of logic
- Adding a widget requires modifying the dashboard layout file
- State from the finance module is accessed in the Claude stats component
- `useEffect` in the main page handles data for multiple unrelated features

**Phase to address:** Architecture phase (before building any module). Define the folder structure and enforce the module boundary contract as a constraint for all subsequent phases.

---

### Pitfall 9: CORS Misconfiguration Between Vercel and VPS PocketBase

**What goes wrong:**
PocketBase is running on the VPS and Next.js is deployed on Vercel. The browser makes requests from `https://laush.vercel.app` to `https://api.laush.example.com`. PocketBase's default CORS allows all origins (`*`) which is permissive, but enabling `allowCredentials: true` with `allowOrigins: '*'` is a browser security violation and requests fail silently. Alternatively, restricting origins too tightly blocks legitimate Vercel preview deployments.

**Why it happens:**
CORS configuration is done once and forgotten. The interaction between `allowCredentials` and wildcard origins is a documented security restriction that browsers enforce but many developers don't anticipate.

**How to avoid:**
Configure PocketBase with explicit origin allowlist, not wildcard, and only when using credentials:
```javascript
// pb_hooks/main.pb.js
routerUse((e) => {
  e.response.header().set("Access-Control-Allow-Origin", "https://laush.vercel.app");
  e.response.header().set("Access-Control-Allow-Credentials", "true");
  // ... other headers
  e.next();
});
```
Or use the `--origins` CLI flag: `./pocketbase serve --origins='https://laush.vercel.app'`. For Vercel preview deployments, consider routing all PocketBase requests through Next.js API route handlers (which are same-origin) as a proxy layer.

**Warning signs:**
- Browser console shows "CORS error" or "has been blocked by CORS policy"
- Requests work via `curl` (server-to-server, no CORS) but fail in the browser
- Auth works in local dev but fails after deploying to Vercel

**Phase to address:** Infrastructure/deployment phase. Test CORS configuration with the production Vercel URL before considering deployment done.

---

### Pitfall 10: Anthropic Usage API Called on Every Page Load Without Caching

**What goes wrong:**
The Claude Stats module fetches usage data from the Anthropic API on every request to the dashboard. The Anthropic usage API has rate limits, and at a minimum this creates unnecessary latency (external API roundtrip on every page view). If rate limits are hit, the entire dashboard page fails to render because the server component throws an error.

**Why it happens:**
Server components make it easy to `await fetch(anthropicAPI)` directly in the component body. There's no obvious feedback that this fires on every page load.

**How to avoid:**
Cache Anthropic usage data aggressively — it doesn't need to be real-time. Use Next.js `revalidate` with a long interval (e.g., 1 hour):
```typescript
const data = await fetch('https://api.anthropic.com/v1/usage', {
  next: { revalidate: 3600 } // cache for 1 hour
});
```
Alternatively, store fetched usage data in PocketBase and run a scheduled refresh (cron on VPS or a route handler triggered by a cron service). Always wrap the Anthropic API call in a try/catch and render a fallback widget rather than crashing the full page.

**Warning signs:**
- Dashboard load time is slow because of an external API call on every render
- 429 errors from Anthropic visible in server logs
- The entire dashboard page fails when the Anthropic API is temporarily unavailable

**Phase to address:** Claude Stats module phase. Design the data fetching strategy before building the UI components.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Global PocketBase singleton in server code | Simpler initial setup | Silent auth state corruption, security risk | Never — always per-request instances on server |
| Storing amounts as floats | No conversion logic needed | Balance drift, compounding rounding errors | Never for monetary values |
| Hardcoding exchange rates in app | No API/user input needed | Stale rates, incorrect ARS/USD conversions | Never — store rate at transaction time |
| No systemd for PocketBase | Faster initial deploy | Process dies on VPS reboot, manual restart required | Never in production |
| All dashboard logic in one page component | Faster first module | Exponential complexity when adding modules | Only for a throwaway proof-of-concept |
| No `pb_data` backups | Simpler ops | Data loss on disk failure or botched PocketBase upgrade | Never once real data exists |
| Open collection API rules | No auth logic to debug | Public data exposure | Never — even for a single-user app |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| PocketBase + Next.js SSR | Global SDK singleton causes shared auth state | Factory function per request, cookie-initialized |
| Next.js fetch + PocketBase | Default caching serves stale financial data | `cache: 'no-store'` or `dynamic = 'force-dynamic'` for live data pages |
| Vercel + VPS PocketBase | Wildcard CORS with credentials fails in browser | Explicit origin allowlist on PocketBase with `--origins` flag |
| Anthropic API + server components | Uncached external call on every render | `next: { revalidate: N }` or store in PocketBase via cron |
| PocketBase auth + Next.js middleware | Auth check in middleware uses stale cookies | Use `pb.authRefresh()` and propagate updated cookie back to browser |
| ARS/USD amounts + PocketBase number field | Float storage causes precision drift | Store as integer centavos, convert at display time |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Anthropic API call in server component render path | 500-2000ms added to every page load | Cache with revalidate or background job | Immediately on every page load |
| N+1 PocketBase queries in widget rendering | Each widget fires separate list requests; slow dashboard | Batch queries or use PocketBase's expand feature for relations | Noticeable at 50+ transactions per module |
| SQLite write contention | Concurrent transaction saves fail with SQLITE_BUSY | Acceptable for single-user; queue writes client-side | Irrelevant for single user, relevant if multi-user added in v2 |
| No PocketBase indexes on frequent query fields | Slow list queries as transaction count grows | Index `account_id`, `date`, `currency` fields from the start | Noticeable at ~5,000+ transaction records |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Open collection API rules (`""` = allow all) | Any internet user can read/write financial data | Require `@request.auth.id != ""` on every collection |
| PocketBase admin UI exposed on public port | Admin panel accessible to internet without VPS firewall | Bind PocketBase to `127.0.0.1`, use Nginx reverse proxy with IP allowlist for admin |
| PocketBase encryption key not set | `pb_data/data.db` readable in plaintext if VPS is compromised | Set `--encryptionEnv=PB_ENCRYPTION_KEY` with a strong key stored in env |
| Anthropic API key in client-side code or `.env.local` committed to git | API key leaked, unauthorized API usage | Store in Vercel environment variables only; never in code or `.env` files committed to git |
| `allowCredentials: true` with `allowOrigins: *` | Browsers block the request; if somehow bypassed, CSRF risk | Use explicit origin list with credentials |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No loading states for PocketBase fetches | Dashboard appears frozen while data loads | Skeleton loaders per widget; each module loads independently |
| Displaying raw centavo integers in UI | User sees "150010" instead of "$1,500.10" | Always format at the display layer; never expose raw stored integers |
| No explicit currency label on amounts | User can't tell if "1,500" is ARS or USD | Always show currency code/symbol alongside every amount |
| Balance calculation done on frontend | If user has many transactions, the browser calculates everything | Pre-aggregate balances server-side or in PocketBase view; don't sum 1000 records on the client |
| Exchange rate conversion without showing the rate used | User can't verify if conversion is correct | Show "1 USD = X ARS (as of [date])" next to any converted amount |
| Whole dashboard fails if one module errors | User sees a blank page when Claude API is down | Each module should have its own error boundary; partial dashboard is better than no dashboard |

---

## "Looks Done But Isn't" Checklist

- [ ] **Auth:** Session persists across browser restarts — verify the token is stored in a cookie (not just memory) and refreshed automatically
- [ ] **Collection rules:** Test every PocketBase collection with an unauthenticated curl request — confirm it returns 401 or 403
- [ ] **PocketBase process:** Reboot the VPS and verify PocketBase comes back automatically — `systemctl status pocketbase` shows active
- [ ] **Backups:** Restore a backup to a temporary location and verify data integrity — don't assume backups work until tested
- [ ] **CORS:** Open the deployed Vercel URL on a browser and verify no CORS errors in the console — don't test only from localhost
- [ ] **Float precision:** Manually add several transactions with decimal amounts and verify the balance total is exact — spot-check with known-good arithmetic
- [ ] **ARS/USD conversions:** Add a transaction in ARS and verify the USD conversion uses the user-entered rate, not an auto-fetched stale rate
- [ ] **Stale data:** Add a transaction, navigate away, return to dashboard — verify the new transaction appears without a hard refresh
- [ ] **Module error isolation:** Disconnect the Anthropic API (invalid key) and verify the Finance module still renders normally

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Global PocketBase singleton discovered in production | HIGH | Audit all server-side PocketBase usage; refactor to factory pattern; regression-test all authenticated routes |
| Float precision drift discovered with existing data | HIGH | Write a migration script to multiply all stored amounts by 100; change field to number with integer constraint; re-verify all balances |
| No backup, data lost on disk failure | CATASTROPHIC | No recovery possible — implement backup immediately after first real data is entered |
| Open collection rules discovered | MEDIUM | Immediately set rules in PocketBase admin; audit logs for unauthorized access; rotate any sensitive data if exposed |
| PocketBase process not persisted via systemd | LOW | Install systemd unit, enable, start — 15 minutes of work |
| CORS misconfiguration blocking production | MEDIUM | Update `--origins` flag on PocketBase, restart service — 30 minutes to diagnose and fix |
| Anthropic API crashing full dashboard render | LOW | Wrap call in try/catch with fallback; add caching — 1-2 hours |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Shared PocketBase SDK instance (server) | Phase 1: Auth foundation | Test with two concurrent requests; verify no shared state |
| Next.js fetch caching serving stale data | Phase 1: Auth foundation / Phase 2+: Each module | Add `dynamic = 'force-dynamic'` to dashboard pages; verify live data updates |
| Open collection API rules | Phase 1: PocketBase setup | Unauthenticated curl to every collection returns 401 |
| Float storage for monetary values | Phase 2: Finance module schema | Manual balance calculation matches app's displayed balance |
| PocketBase process not in systemd | Phase 1: VPS infrastructure setup | VPS reboot test; `systemctl status pocketbase` active |
| PocketBase backward-compat / no backups | Phase 1: VPS infrastructure setup | Successful restore from backup to temp directory |
| ARS/USD exchange rate policy undefined | Phase 2: Finance module schema | Transactions store rate; historical conversions don't change when rate changes |
| Modular dashboard becoming god component | Phase 0: Architecture decision | Feature folder structure enforced; each module is independently navigable |
| CORS Vercel + VPS misconfiguration | Phase 1: Deployment setup | Browser console clean on production Vercel URL |
| Anthropic API uncached on every render | Phase 3: Claude Stats module | Dashboard load time under 1s with Anthropic API simulated slow |

---

## Sources

- [PocketBase JS SSR Issues and Recommendations Discussion #5313](https://github.com/pocketbase/pocketbase/discussions/5313)
- [PocketBase Best Practices for Initializing Instance in Next.js Discussion #5359](https://github.com/pocketbase/pocketbase/discussions/5359)
- [PocketBase Next.js App Router SSR Integration Discussion #4065](https://github.com/pocketbase/pocketbase/discussions/4065)
- [PocketBase Going to Production — Official Docs](https://pocketbase.io/docs/going-to-production/)
- [PocketBase API Rules and Filters — Official Docs](https://pocketbase.io/docs/api-rules-and-filters/)
- [PocketBase Production Considerations Discussion #1528](https://github.com/pocketbase/pocketbase/discussions/1528)
- [PocketBase SQLite Concurrent Write Limit Discussion #5524](https://github.com/pocketbase/pocketbase/discussions/5524)
- [Financial Precision in JavaScript — DEV Community](https://dev.to/benjamin_renoux/financial-precision-in-javascript-handle-money-without-losing-a-cent-1chc)
- [currency.js — JavaScript currency library](https://currency.js.org/)
- [Anthropic Usage and Cost API — Official Docs](https://docs.anthropic.com/en/api/usage-cost-api)
- [Next.js Caching Documentation](https://nextjs.org/docs/app/guides/caching)
- [PocketBase CORS Configuration Discussion #6266](https://github.com/pocketbase/pocketbase/discussions/6266)

---
*Pitfalls research for: lauOS — Next.js + PocketBase personal dashboard*
*Researched: 2026-03-09*
