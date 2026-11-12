# PSX V3 — Prototype Simulation Report (Nov 12, 2026)

**Branch:** `codex/psx-arcade-v3-isolated-20261112`. Based on last verified production SHA `114402786b43ed34acbb0ef69cf92eef0cc7e660`. No live engine integration, DB migrations, wallets or production deployments have been changed.

## Engine prototype architecture
- Pure Node-only ESM module: `lib/psx-v3-prototype.mjs`.
- A server-private HMAC-SHA256 secret controls future price-driving randomness. Never include this seed in client bundles, logs, public database policies, events or API payloads.
- O(1) pricing for any past/current minute from an opening anchor and minute index; no scheduled browser required.
- A price opening at minute 0 exactly equals the locked legacy closing quote; the new signals phase in over 25 minutes to avoid artificial overnight revaluation.
- Six company-specific volatility/trend profiles with original fictional executive names.
- Five-minute company bulletins, six-hour corporate catalysts, and optional unreleased rumours. Rumour accuracy is resolvable only after the scheduled event.
- Side-channel restrictions: `publicMarketFrame` exposes current published headlines, not seed, internal direction/strength, future event results or unreleased rumour truth.
- Clamps all prices to 48%–205% of that stock's cutover anchor to prevent terminal collapse/monotonic unlimited appreciation. These are prototype bounds, not approved economics.

## Executed exploratory simulations — limited scope

The engine's JS calculation path was evaluated with **deterministic test hashing substituted for Node HMAC** because the connected repository is not locally mounted for invoking its Node crypto runtime. This is a useful *behavioural smoke test*, **not** the authoritative Node/crypto regression run and **not** a live-market performance claim.

Two separate seeded test-hash experiments, **7 days, every minute, six companies**:

| Company | Average absolute 1m movement (Seed A / B) | Observed max absolute 1m movement (Seed A / B) | 5m positive movement over 1.01%, Seed A / B |
|---|---:|---:|---:|
| MOO | 0.109% / 0.103% | 1.55% / 1.57% | 5.5% / 4.9% |
| PANDA | 0.168% / 0.168% | 2.63% / 2.53% | 10.5% / 9.8% |
| BLUE | 0.234% / 0.245% | 4.47% / 3.99% | 14.9% / 15.5% |
| TITAN | 0.217% / 0.200% | 3.70% / 3.02% | 14.8% / 13.5% |
| CLOWN | 0.298% / 0.308% | 5.05% / 4.86% | 19.5% / 20.1% |
| DUCK | 0.334% / 0.331% | 5.18% / 5.50% | 21.1% / 20.5% |

In this test-only sampling, **78.3%–79.0%** of five-minute windows had at least one company move more than 1.2% either way. This measures an interesting *decision*, not a winning trade, and ignores individual holding costs, directional forecasting, execution timing, and the 0.5% fee charged on each buy and sell. These results are **not guaranteed** under actual HMAC seeding or among all future market conditions.

**30 days**, sampled every five minutes, with a third deterministic test seed:

| Company | Minimum | Maximum | Worst 5m | Best 5m | End vs start |
|---|---:|---:|---:|---:|---:|
| MOO | 38.12 | 49.40 | −4.5% | +5.1% | +2.4% |
| PANDA | 71.78 | 109.54 | −6.3% | +6.9% | −10.6% |
| BLUE | 17.21 | 27.53 | −11.6% | +13.8% | −0.6% |
| TITAN | 87.03 | 145.41 | −8.6% | +7.9% | +1.6% |
| CLOWN | 27.57 | 46.59 | −14.6% | +20.3% | −7.9% |
| DUCK | 106.28 | 204.77 | −12.4% | +15.4% | −5.0% |

All sampled prices were finite and positive. These results indicate the intended risk ordering *in this limited proxy run*, but the 5-minute CLOWN/DUCK extremes require more fee-adjusted bankroll stress tests before approving the amplitude. None of this proves that a player cannot exploit scheduled releases or frequent reversals.

## Corrected before further testing
- Prototype initially had an immediate first-minute cutover jump as high as ~13% from the old closing price. Added a 25-minute transition ramp; observed first-minute moves were then within ~0.12% in tested runs.
- Rumours initially disappeared abruptly just before their scheduled event, potentially causing a mechanical jump. Added a two-sided taper and ensured nonexistent rumours cannot be marked resolved.

## Automated regression checks added — execution still pending

Run on a clean Node install: `pnpm test:psx-v3`. Script: `scripts/verify-psx-v3-prototype.mjs`.

The script covers:
- Six stocks, market clock, clean cutover, quote determinism, bounds and independent company identities.
- Six-hour event cadence and fair six-company event coverage.
- Five-minute bulletins and no future event outcome/secret in public market frames.
- Private rumour outcome until publication, including never-resolving absent rumours.
- Per-minute risk and first-minute jump limits, 5-minute movement opportunity rate, seven-day sampling and 30-day long-range history sampling.
- No production writes, migrations, trading or integration.

**Not yet performed:** execution under real Node HMAC, TypeScript/Next build, concurrent order tests, five-theme iPhone QA, HMAC key/storage deployment, database history persistence, sampled price parity between future API and DB settlement, safe cutover/rollback validation, production backup verification.

## Safety / next gate

The next implementation stage must add an **immutable V3 market-version registry**, server-only seed/key reference, read-only released historical prices and guarded market-frame endpoint. All old trade-cycle quote formulas and 63 existing orders remain untouched. Reconcile and test the actual stored 0.5% fee and historical rank snapshots; never rewrite earlier prices or Monday baselines.

**PSX V3 is NOT live, NOT an approved price/wealth balance, and NOT ready for server trading activation.**
