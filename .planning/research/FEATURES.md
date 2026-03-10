# Feature Research

**Domain:** Personal Dashboard / Life OS — single-user, modular web app
**Researched:** 2026-03-09
**Confidence:** HIGH (auth/shell/finance patterns), MEDIUM (Claude stats — API constraint caveat noted)

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features assumed to exist. Missing these = product feels broken or incomplete.

#### Auth / Shell

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Email + password login | Every app has auth | LOW | PocketBase handles this natively; no custom auth code needed |
| Persistent session | Don't want to log in every time | LOW | PocketBase is stateless; JS SDK stores token in localStorage by default; clear on logout |
| Redirect to login on expired/missing token | Security standard | LOW | Middleware guard on protected routes in Next.js |
| Top navbar with app identity | Navigation orientation | LOW | Brand logo/name + user indicator + logout |
| Responsive layout | Web-first but screen-size varies | MEDIUM | Navbar + sidebar/grid — desktop-first, mobile-usable |
| Dark mode with persistent preference | Standard in 2025/2026 dashboards | LOW | Persist in localStorage or PocketBase user record; system preference detection via prefers-color-scheme |
| Empty state guidance | First-time experience | LOW | When no data, show prompt to add first account/transaction |
| Module navigation | Users need to switch between modules | LOW | Sidebar or top-level nav links to Finance, Claude Stats, etc. |
| Dashboard home with module widgets | Entry point showing high-level data | MEDIUM | Bento grid or card layout with clickable module previews |

#### Finance Module

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Create and list accounts | Core of any finance tracker | LOW | Accounts have name, currency (ARS or USD), current balance |
| Manual transaction entry | Without bank integration, this IS the feature | LOW | Date, amount, description, category, account |
| Transaction list with filters | Need to review history | MEDIUM | Filter by account, date range, category; pagination |
| Category assignment per transaction | Standard in all finance apps | LOW | Custom categories; not locked to a taxonomy |
| Account balance display | Why else track? | LOW | Calculated from initial balance + transactions |
| Balance per currency (ARS, USD separated) | Multi-currency is table stakes here | MEDIUM | ARS and USD must not be mixed without explicit conversion |
| Edit and delete transactions | Mistakes happen | LOW | Soft correction, no audit trail needed for v1 |
| Total net worth / summary view | At-a-glance financial picture | MEDIUM | Separate totals per currency; optionally a converted total |

#### Claude Stats Module

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Total tokens used (period) | Primary reason to build this module | MEDIUM | Requires polling Usage API; store snapshots in PocketBase |
| Estimated cost in USD | Developer cares about spend | MEDIUM | Cost API returns USD decimal strings |
| Breakdown by model | Claude Opus vs Sonnet vs Haiku cost profiles differ | MEDIUM | Group by model from Usage API response |
| Date range selector | Compare this week vs last week | LOW | UI filter; pass to API query |
| Time series chart (daily usage) | Visual trend identification | MEDIUM | Recharts or similar; data from `bucket_width=1d` |

---

### Differentiators (Competitive Advantage)

Features that set lauOS apart. Not required to function, but valuable for Lautaro's specific workflow.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| ARS/USD parallel tracking without forced conversion | Argentina context: operating in two currencies simultaneously is the reality, not the exception | MEDIUM | Store each account in its native currency; show totals per currency; optional manual FX rate for cross-currency view |
| Manual FX rate snapshot | Peso/dollar rates are volatile; official vs. informal rates diverge sharply | LOW | Allow user to record exchange rate at time of entry; used for optional total view |
| Token cache efficiency metric | Shows whether prompt caching is saving money — useful for a developer | MEDIUM | Compute `cache_read / (input + cache_read)` ratio from Usage API response |
| Tool acceptance rate display | Edit tool, Write tool acceptance rates from Claude Code Analytics API show AI collaboration quality | MEDIUM | Only if Admin API access is confirmed; see caveat below |
| Cost per session trend | Rolling cost/session ratio helps detect workflow inefficiency | MEDIUM | Derived metric from Claude Code Analytics daily data |
| Module grid customizable order | Personal dashboard should feel personal | HIGH | Drag-and-drop order persistence; defer unless fast to implement |
| Color-coded account cards | Visual separation of ARS vs USD accounts at a glance | LOW | Badge or border color per currency |
| Monthly finance summary widget on home | Quick snapshot without entering the module | MEDIUM | Pulls latest balance totals; shows vs. last month if data exists |

---

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Automatic bank integration (Fintoc, Plaid) | "Why type transactions manually?" | Requires OAuth flows, bank API maintenance, legal compliance, and unreliable sync for Argentine banks; massive scope increase for v1 | Manual entry with fast UX; CSV import in v1.x |
| Real-time Claude API cost monitoring | "I want live spend" | Usage API data has up to 5-minute delay; polling too frequently hits rate limits; real-time creates false precision | Refresh on demand or scheduled background sync (hourly); show last-updated timestamp |
| Automatic ARS/USD conversion using live FX rates | "Show me everything in USD" | Official vs. informal (blue dollar) rates in Argentina diverge significantly; using an API rate misrepresents actual purchasing power | Manual FX rate field per account or per transaction; user enters the rate that reflects their actual situation |
| Budget planning / envelope system | Common request after seeing balances | Budgeting adds a second data model (budget targets) on top of transaction tracking; high complexity, different mental model | Track spending by category first; budget feature is a natural v2 evolution after data exists |
| Recurring transaction automation | "Schedule my rent payment" | Requires scheduling infrastructure, edge cases for failed entries, and notification system | Manual entry; add recurring as a v1.x quality-of-life after the base workflow is proven |
| Multi-user access / sharing | "What if I want to share finances?" | Project is single-user by design; multi-user auth, permissions, and data isolation are a separate project | Keep scope; PocketBase allows adding users later if truly needed |
| Mobile native app | "I want this on my phone" | Native app doubles the codebase; premature investment before web version is validated | Web-first, responsive CSS; PWA installs to home screen as a free win |
| AI-powered spending insights | "Tell me where I'm overspending" | Requires substantial data history before insights are meaningful; adds LLM API calls and cost; complex to get right | Build data foundation first; this is a natural v2 feature when history exists |
| Notification / alert system | "Notify me when cost exceeds X" | Requires background jobs, email/push infrastructure, threshold management; Resend is available but the trigger logic is non-trivial | Defer to v2; Resend is already in stack for when it's needed |

---

## Feature Dependencies

```
[PocketBase Auth]
    └──required by──> [All modules] (every route is protected)
    └──required by──> [User preferences] (dark mode persistence per user)

[Account Management]
    └──required by──> [Transaction Entry] (a transaction belongs to an account)
    └──required by──> [Balance Display] (balance derived from account + transactions)
    └──required by──> [Finance Summary Widget on Home]

[Transaction Entry]
    └──required by──> [Transaction List / History]
    └──required by──> [Category Spending View]
    └──required by──> [Monthly Summary Widget]

[Anthropic Admin API Key]
    └──required by──> [Usage Token Data] (Usage and Cost API)
    └──required by──> [Claude Code Analytics] (Claude Code Analytics API)
    └──enables──> [Cost Breakdown by Model]
    └──enables──> [Tool Acceptance Rate]
    └──enables──> [Time Series Chart]

[Usage Data Fetched & Stored in PocketBase]
    └──required by──> [Date Range Selector on Stats module] (query cached data, not live API each time)
    └──enables──> [Cost per Session Trend] (derived metric)

[Dashboard Home Shell]
    └──requires──> [Module widgets exist] (Finance Summary, Claude Stats summary)
    └──enhanced by──> [Customizable grid order] (deferred)
```

### Dependency Notes

- **Auth required by everything**: PocketBase must be configured and working before any module is built. This is Phase 1 regardless of anything else.
- **Account Management required by Transaction Entry**: Cannot record a transaction without an account to attach it to. Both are in the Finance module Phase but accounts must come first.
- **Anthropic Admin API key constraint**: The Usage API and Claude Code Analytics API both require an Admin API key (`sk-ant-admin...`), which is only available to organization accounts — not individual API accounts. Lautaro must confirm whether his Anthropic account is under an organization or needs to create one. If individual-only, the Usage and Cost API data shown in the Console is still accessible via the console UI, but not via API. This is a **critical prerequisite to verify before building the Claude Stats module**.
- **Data caching in PocketBase**: The Stats module should store fetched data locally rather than hitting the Anthropic API on every page load. This makes the date-range UI fast and avoids rate limits. Anthropic recommends polling no more than once per minute; daily refresh is the practical pattern for this use case.

---

## MVP Definition

### Launch With (v1)

Minimum to make lauOS usable as a daily driver for Lautaro.

- [ ] PocketBase auth — login, session persistence, protected routes
- [ ] Dashboard home with module card grid (Finance + Claude Stats)
- [ ] Finance: create accounts (ARS and USD, with initial balance)
- [ ] Finance: manual transaction entry (date, amount, description, category, account)
- [ ] Finance: transaction list with basic filter (by account, by date range)
- [ ] Finance: account balance display (per account, per currency totals)
- [ ] Claude Stats: token usage display (daily, weekly) from Usage API
- [ ] Claude Stats: cost breakdown by model
- [ ] Claude Stats: time series chart (daily tokens/cost)
- [ ] Dark mode with persistent preference
- [ ] Consistent design system (clean/modern, yellow accent, card layout)

### Add After Validation (v1.x)

Features to add once the core is stable and actively used.

- [ ] Finance: edit / delete transactions — add once first use reveals pain points
- [ ] Finance: transaction categories view / spending by category — add once enough transactions exist to make it meaningful
- [ ] Finance: manual FX rate field on transactions — add when the cross-currency total view is needed
- [ ] Finance: CSV import — add when manual entry volume becomes a friction point
- [ ] Claude Stats: cache efficiency metric — quick win once base stats are working
- [ ] Claude Stats: Claude Code Analytics (tool acceptance rates, LOC, commits) — add once Admin API access is confirmed
- [ ] Empty state design for both modules — polish pass after core UX is validated
- [ ] Monthly finance summary widget on home — add once there is enough data to summarize

### Future Consideration (v2+)

Defer until the foundation is solid and v1 is actively used.

- [ ] Notes module — capture quick thoughts; depends on having a good editor experience
- [ ] Habit tracker module — streak-based; requires daily check-in UX
- [ ] Pomodoro / focus timer module — session-based; simple but benefits from session history
- [ ] Bookmarks module — link management; depends on tagging/search UX
- [ ] Budget planning / envelope system — meaningful only after transaction history exists
- [ ] Recurring transaction automation — quality-of-life after manual entry is habitual
- [ ] AI-powered spending insights — meaningful only after multi-month data history
- [ ] Notification / alert system via Resend — useful once thresholds are defined from real usage
- [ ] Health metrics module — external device integrations; high complexity
- [ ] Mobile PWA / native — after web experience is polished

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| PocketBase auth + session | HIGH | LOW | P1 |
| Dashboard home shell + nav | HIGH | LOW | P1 |
| Finance: account management | HIGH | LOW | P1 |
| Finance: transaction entry | HIGH | LOW | P1 |
| Finance: balance display per currency | HIGH | LOW | P1 |
| Finance: transaction list + filters | HIGH | MEDIUM | P1 |
| Dark mode persistent | MEDIUM | LOW | P1 |
| Claude Stats: token usage + cost | HIGH | MEDIUM | P1 |
| Claude Stats: time series chart | MEDIUM | MEDIUM | P1 |
| Claude Stats: model breakdown | MEDIUM | LOW | P1 |
| Finance: edit/delete transactions | MEDIUM | LOW | P2 |
| Finance: category spending view | MEDIUM | MEDIUM | P2 |
| Finance: manual FX rate entry | MEDIUM | LOW | P2 |
| Finance: CSV import | LOW | MEDIUM | P2 |
| Claude Stats: cache efficiency metric | MEDIUM | LOW | P2 |
| Claude Stats: Claude Code Analytics | HIGH | MEDIUM | P2 |
| Monthly summary widget on home | MEDIUM | MEDIUM | P2 |
| Budget / envelope planning | MEDIUM | HIGH | P3 |
| Recurring transactions | LOW | HIGH | P3 |
| Notes module | MEDIUM | HIGH | P3 |
| Habit tracker | MEDIUM | HIGH | P3 |
| AI spending insights | MEDIUM | HIGH | P3 |
| Notification / alert system | MEDIUM | HIGH | P3 |

**Priority key:**
- P1: Must have for v1 launch
- P2: Should have, add after core is stable
- P3: Future consideration, v2+

---

## Competitor Feature Analysis

| Feature | Notion Life OS Templates | Lunch Money | Our Approach |
|---------|--------------------------|-------------|--------------|
| Multi-currency accounts | No native; relies on Notion's manual setup | 160+ currencies, auto FX rates | Manual entry with per-account currency; manual FX rate for cross-currency view (ARS blue dollar reality) |
| Transaction entry | Manual database entry | Manual or bank-synced | Manual entry; fast form UX |
| Category taxonomy | User-defined databases | Pre-set + custom | Custom categories; no locked taxonomy |
| Balance display | Formula-based; fragile | Real-time per account | Calculated from initial balance + transactions; reliable |
| API stats integration | None | None | Differentiator: built-in Anthropic usage stats |
| Module system | Page/database based | Feature-based navigation | Modular widget cards on home, dedicated module pages |
| Dark mode | Notion-level (not per-template) | Yes | Yes, with system preference detection |
| Custom design | Template-bound | Fixed app UI | Custom design system; yellow accent, consistent card style |
| Developer productivity metrics | None | None | Differentiator: Claude Code sessions, LOC, acceptance rates |

---

## Critical Research Caveat: Anthropic Admin API Access

**This is a gate for the Claude Stats module.**

Both the Usage & Cost API and the Claude Code Analytics API require an Admin API key (`sk-ant-admin...`). Per official Anthropic documentation (confirmed 2026-03-09):

> "The Admin API is unavailable for individual accounts. To collaborate with teammates and add members, set up your organization in Console → Settings → Organization."

**What this means in practice:**
- If Lautaro's Anthropic account is a standalone individual API account, neither API is accessible programmatically.
- The Console UI at `console.anthropic.com/usage` shows the same data visually, but there is no scraping-based alternative.
- Creating an "organization" in the Anthropic Console (even with a single member) unlocks the Admin API. This is likely the path forward — it costs nothing additional and does not require an Enterprise plan.
- The Claude Code Analytics API additionally requires usage of Claude Code under that organization's API key (not personal subscription).

**Recommended action before Phase 2 (Claude Stats module):** Lautaro verifies whether he can create/has an organization in the Anthropic Console and whether his Claude Code usage is attributed to that organization's API key.

If Admin API is not accessible, the module falls back to manually entered stats or scraping from the console — both are anti-patterns. The module should be blocked until this is confirmed.

---

## Sources

- Anthropic Usage and Cost API official docs: https://platform.claude.com/docs/en/api/usage-cost-api (HIGH confidence — official, fetched 2026-03-09)
- Anthropic Claude Code Analytics API official docs: https://platform.claude.com/docs/en/api/claude-code-analytics-api (HIGH confidence — official, fetched 2026-03-09)
- PocketBase authentication docs: https://pocketbase.io/docs/authentication/ (HIGH confidence — official)
- PocketBase session management discussion: https://github.com/pocketbase/pocketbase/discussions/1670 (MEDIUM confidence — community, verified against docs)
- Lunch Money multi-currency features: https://lunchmoney.app/features/multicurrency/ (MEDIUM confidence — competitor product)
- PocketSmith multi-currency: https://www.pocketsmith.com/tour/multi-currency/ (MEDIUM confidence — competitor product)
- Personal finance app pitfalls: https://www.netguru.com/blog/mistakes-in-creating-finance-app (MEDIUM confidence — industry analysis)
- Life OS dashboard design patterns: https://grokipedia.com/page/Personal_Life_OS_Dashboard (LOW confidence — WebSearch only)
- Notion Life OS templates 2026: https://gridfiti.com/notion-life-os-templates/ (LOW confidence — WebSearch only, used for pattern identification only)
- Dark mode best practices 2025: https://www.influencers-time.com/dark-mode-ux-in-2025-design-tips-for-comfort-and-control/ (MEDIUM confidence — industry blog, verified against multiple sources)
- Dashboard UI/UX patterns 2025: https://medium.com/@allclonescript/20-best-dashboard-ui-ux-design-principles-you-need-in-2025-30b661f2f795 (LOW confidence — WebSearch only)

---

*Feature research for: lauOS — personal dashboard / life OS*
*Researched: 2026-03-09*
