# PodScape Stock Exchange 2.0 — code and database audit

**Status:** Architecture review and compatibility groundwork. Dedicated branch: `codex/psx-arcade-rebuild-20261112`. Not deployed. No production migrations applied.

## Verified existing implementation

**Stock universe: SIX tickers**, not five:
- `DUCK` — Rubber Ducky Inc., high-end moss and luxury hides.
- `MOO` — Dairy Cow Dairy, colony foods.
- `PANDA` — Panda King Holdings, leaf-litter real estate.
- `BLUE` — Powder Blue Express, logistics.
- `TITAN` — Titan Heavy Industries, cork mining.
- `CLOWN` — Clown Entertainment, media and entertainment.

Both code, database constraints, portfolio validation, ranking audit and achievements support all six. **PANDA must remain**: production currently contains recorded PANDA trades.

### Market and news
- `lib/pod-exchange.ts` defines a deterministic, globally shared price function `priceAt(symbol,cycle)`. The current arcade cycle is 60 seconds and has a separate numeric namespace; legacy 5-minute cycles remain reproducible.
- Current market is continuous, 24/7, **without a scheduled price-generation job**. Time-based calculation works even when no player visits. The source code's opening comment about a five-minute market is outdated.
- `marketSessionAt` gives six-hour major market regimes, with the session impact creating a rise/fall/fade for one featured ticker.
- `newsAt` and `headlineAt` supply **five-minute minor bulletins**, not six-hour news only. The five-minute stories drive prices temporarily. Preserve this additional activity layer.
- Arcade minute prices currently use a previous five-minute computed price multiplied by a new minute noise/rush and a session/news multiplier; there is no running price state.
- Prices have per-stock bounds. Legacy `MARKET_V2_START_CYCLE` is a future UTC 2026-11-20 boundary for the *legacy* 5-minute formula, NOT an authorization to overwrite old minute prices.
- Player trading does not move the shared price. No limited share inventory.

### Portfolios, trades, EXP and rankings
- `member_exchange_portfolios` stores cash, holdings JSON, revision and timestamps. `member_exchange_orders` stores each trade with share count, side, execution cycle and price.
- Server-only Postgres RPC `execute_member_exchange_order` uses a per-user advisory transaction lock, idempotent trade IDs, row locking, a 0.5% fee, validation and transactional achievement calls. The API rechecks market price/clock before invoking it.
- Signed-in wallets are authoritative in Supabase; guests have device-local wallets and a guarded one-time cloud import. Cloud errors refuse to silently reset an existing wallet.
- `member_exchange_trades` and `member_achievements` preserve one-time stock achievements; ranking preferences and Monday snapshots support market leaderboards. Only authenticated players see private trade histories.
- UI currently shows the latest 50 orders but doesn't compute rigorous FIFO realized P/L or cost-basis unrealized P/L. Its “overall gain” means net worth minus 10,000 starting Duck Bucks.
- Live ranking API computes net worth from minute cycles; **weekly snapshot cron previously used the legacy five-minute clock**. A non-destructive code correction is staged; existing snapshot rows will remain untouched.

### Actual production data (aggregate read-only check, Nov 12 2026)
- 5 saved portfolios, 63 orders and 63 exchange achievement trade-ledger entries.
- Orders: 33 legacy five-minute and 30 newer arcade-minute orders.
- All six symbols have historical trades, including 4 PANDA orders.
- No public `market_price_history`, `market_event` or rumour table currently exists.
- Market prices are not persisted once per minute; charts recompute historical `priceAt` values. This is historically consistent **only while the exact price algorithm remains unchanged**.
- `vercel.json` schedules weekly market rankings and daily ranking awards; there is no minute-market cron. No `cron.job` relation was found in the currently accessible database.

### Current UI
- `app/fun-zone/pod-exchange/PodExchange.tsx`: header and tick countdown, balance tiles, horizontal six-company carousel with SVG sparklines, six-hour event card, five-minute news, listings, buy/sell panel, holdings, 50 recent orders, rankings, rules.
- Chart range controls currently offer 2h and 24h, downsampled to only 25 points. This hides short 5–10 minute opportunities.
- A few labels still say “five-minute prices,” including the Fun Zone watchlist and market ranking information.
- Existing themes and icons are shared with PodScape. No standalone app is required.

## Preserve — NO wholesale replacement
1. Six symbols, prior quotes for historical trade cycles, cash, balances, orders, achievements, market leaderboard identity/privacy and all EXP.
2. The existing 60-second arcade clock and six-hour major event cadence.
3. Five-minute *minor* news, as an entertaining second layer.
4. Server-authoritative trades with transactional writes and idempotent order IDs; 0.5% buy/sell fee unless a tested balance change is approved.
5. Shared unlimited-liquidity market and non-market-moving individual trades.
6. Existing user-local guest import and wallet reconciliation.
7. Playfulness, mobile UI, theme preferences, minimal financial complexity.

## Critical problems / recommendations

### 1. Deterministic public future prices are exploitable
`priceAt` and all pseudorandom seeds are in a client-imported module. A technically inclined player can calculate **future ticks** and obtain near-certain timing edges, undermining the requirement that knowledge/observation matter without guaranteed winning. **Fix:** introduce a server-private, persistent seed per market version, with only current and historical price snapshots exposed. Never deliver unreleased event outcomes or future HMAC material to the browser. A static algorithm is fine if the seed is private.

### 2. Current minute movement is not a convincing running market
The arcade quote uses a *different old five-minute reference price every fifth tick*, plus independent noise. It is not a continuous log-return process, so repeated shifts and regime effects can be abrupt. Move to **bounded, seeded per-minute returns** with company-specific volatility, short trends, recovery pressure and scheduled catalysts. A trend should last a small number of ticks, with short-term variation, not a fixed predictable sawtooth. The price ceiling and floor must avoid irreversible bankrupt corporations.

### 3. Historical trades must never be repriced
Version the engine by a future **cutover UTC minute** only after testing. All earlier `priceAt` cycles must continue to use the old engine byte-for-byte. At cutover use each company's final legacy price as the opening anchor; store the actual V3 seed/version and immutable price snapshots. The algorithm must not change for already-traded cycles. Never move an activation boundary retrospectively.

### 4. Charts need genuine persisted snapshots
For new V3 minute ticks, persist `(engine_version,cycle,symbol,price,created_at)` with unique keys. Provide 10m, 30m, 1h, 24h views. Backfill **older periods from the exact historical legacy formula** and mark their engine version. Do not interpolate invented future price movements or discard prior records.

### 5. Rumours need scheduled outcomes, not narrative-only bait
Preselect six-hour catalysts on the server and schedule optional rumours within the lead-up. Some rumours are accurate, some false, some partially correct. Reveal outcomes with an explicit settled event ID to enable achievements without letting the player exploit guaranteed future returns. Do not display a rumour's future direction or internal result until publication.

### 6. P/L, bankruptcy and rewards need accounting
Compute net worth as cash + shares valued at the same server quote. Realized gain/loss needs a consistent **FIFO cost-basis rule** including buy and sell fees and historical orders (not merely 50 UI orders). “Bankruptcy” should mean liquid/no holdings and insufficient Duck Bucks for one minimum-share buy, not merely cash=0 while the user owns shares. A recovery allowance needs a small capped, auditable, once-per-condition server credit with anti-farming safeguards; never reset wallets.

### 7. Scheduling can remain reliable without a permanently running worker
A public cron every minute is not currently configured; the existing 24/7 market works by clock. A server-private seeded engine can compute prices deterministically for any elapsed minute, **materializing missing snapshots idempotently** on demand; an authorized scheduler can precompute for performance, but must not be a single point of failure. Use advisory locks/unique constraints and bounded catch-up batches. Do not query future minute outcomes.

## PSX 2.0 target gameplay

**Six personality profiles**:
| Stock | Identity | Intended behavior |
|---|---|---|
| MOO | Dairy Cow Industries · dependable food giant | Smaller minute returns, stronger medium-term stability, reactions to colony booms and food supply |
| BLUE | Powder Blue Logistics | Medium-high intraday momentum, contract rallies, supply-chain setbacks |
| PANDA | Panda King Holdings · leaf property dynasty | Medium volatility, slow speculation / construction cycles and leaf estate rumours |
| CLOWN | Clown Capital | Hype-driven jumps and corrections, higher volatility, public-relations disasters |
| TITAN | Titan Heavy Industries | Longer project trends, infrastructure contracts, rare expensive failures |
| DUCK | Rubber Ducky Inc. | Most outrageous and volatile, luxury scandal shocks, reversals; higher risk, not guaranteed upside |

**Illustrative volatility targets, not deployed values:** MOO lower (about 0.3–1.0% typical minute variation), PANDA moderate, BLUE/TITAN lively, CLOWN/DUCK higher; rare major shock amplitude should be limited and tested across time horizons and bankrolls. Target at least one *decision-worthy story or trend* in most five-minute sessions, not a guaranteed positive-trade opportunity.

**Narrative layers**: (a) six-hour major financial scandal/industry event; (b) five-minute funny bulletin with smaller sentiment effects; (c) occasional unverified rumour that may be true, partly true or false, followed by a resolution. Every price-impacting event must reference an event ID and affected company. News must reflect real server-owned movement; do not promise exact price paths.

**Market UX**: one portal hero with cash/net worth/P&L; swipeable six-stock cards and mini charts; prominent active news and optional rumours; compact single trade panel; portfolio and transaction/realized-profit details; existing rankings; five-theme support.

## Planned migrations — NOT YET APPLIED
1. `psx_market_versions`: immutable engine version, cutover UTC time/minute, opening anchors, seed reference (secret never readable by ordinary clients).
2. `psx_price_history`: engine version, cycle, symbol, price, published timestamp; unique `(version,cycle,symbol)` for safe retries.
3. `psx_events` and `psx_rumours`: start/end cycles, scope, release time, outcome state, revealedAt; explicit public read RLS for **only released** stories.
4. Optional `member_exchange_lot_ledger` or an API-side read model for FIFO cost-basis reporting, derived from original orders without altering them.
5. Optional `member_exchange_recovery_events` with unique claim keys; credit changes must share wallet transaction locking and idempotency.
6. New one-time achievement triggers in the existing achievements/EXP system, including client-replay-safe event attribution.

**Do not apply schema changes until code/test scenarios are ready. No customer backfill or wallet update in the audit phase.**

## Delivery sequence

1. **Audit, baseline, and compatibility fixes** (this branch): document source of truth, fix weekly snapshot to use the minute market, clean stale five-minute labels, add shorter chart views from existing historical deterministic quotes. No market-price changes.
2. **Server-private V3 engine and simulation only**: prototype separate pure market generator, long-run and multi-user test vectors, tune volatility/noise/events; compare values against legacy at cutover and test exploit scenarios. Not wired to trade execution.
3. **Versioned persistence**: reviewed additive SQL migrations, private seed, historical quote snapshots, background-independent idempotent catch-up, read-only quote/history API.
4. **Atomic quote/trading cutover**: read current quote from private engine; validate on trade server and inside settlement transaction, protect simultaneous buys and replay IDs; preserve legacy cycles.
5. **Ridiculous news and rumours**: six-hour major + five-minute minor; resolution links and one-time event achievements.
6. **Portfolio accounting and recovery**: FIFO realized/unrealized P/L, fee parity, accurate net worth/rankings, safe fictional recovery.
7. **PodScape portal polish**: mobile cards, charts, transaction feedback, five themes, concise tutorials, achievements.
8. **Release gates**: 30+ simulated days of prices for each company; full chart-history parity; crash/recovery and 5–10-minute session review; wallet invariants; concurrent trades and duplicate requests; six symbols; stable 1-minute scheduler/catch-up; private-seed cannot be inferred from client; migration dry run; production backups; preview build and mobile QA. Production deploy only after all pass.

## Release rule

The 2.0 cutover is a **deliberate future UTC boundary** chosen at production release time, never hard-coded to an already past date. Production remains on the old engine until then. A market engine is not approved just because its chart looks entertaining.
