# PSX 2.0 — One-command release handoff

Status: code release candidate, **not deployed to the public-domain project**. Do not release automatically on branch push.

## Release target (critical)

- GitHub: `podscapelabs/podscape-labs`
- Branch: `codex/psx-arcade-ui-release-ready-20261112`; pin the exact passing CI commit at deploy time.
- Public domain: `www.podscapelabs.com` / `podscapelabs.com`.
- **Correct Vercel project:** `podscape-labs-preview`, ID `prj_7RyjnPePjJVBONXLcRe9D4wbUMa0`, team `team_0pq0PPdY5XkMZE8cic2kRMOG`, target **production**.
- The other Vercel project `podscape-labs` (ID `prj_5uR7m4QHn4wVMXvZizQ1A87cAGny`) does **not** own the public domain. Deploying there is insufficient.
- Supabase project `qptvfwmxmhmhdmfyuzbb`.
- `PSX_V3_SECRET` is configured server-side in the public-domain Vercel project. Never rotate it after the first V3 price publishes, never expose it to the browser or version control.
- `psx_market_versions` contains an obsolete `psx-v3-prototype-1` testing row from exploratory staging. **Do not activate or edit it**. Its previous fingerprint is not approved. The release engine is `psx-v3-release-1`.

## Completed on branch

- Compact theme-aware arcade hero and market pulse.
- Playable six-company trading carousel, shared charts, and trade desk.
- Leaf Street Journal and Rumour Mill inside the playable exchange; duplicate stock list removed.
- Existing signed-in and guest wallets, rankings, historical orders and achievements remain in place.
- No-price-leak server-side HMAC engine and deterministic legacy price bridge.
- Read-only manifest generator `scripts/prepare-psx-release.mjs` computes future first-tick anchors and fingerprint with the actual secret; **never commits or persists** the secret.
- Guarded staged market cannot become publicly active just by deploying code.

## On user command “deploy”

1. Recheck branch HEAD, CI green including `pnpm run lint`, `pnpm run typecheck`, `pnpm run test:psx-v3`, `node scripts/verify-psx-arcade-release.mjs`, manager and ledger QA, and `pnpm run build`.
2. Recheck Vercel quota. Capture baseline production URL/commit and Supabase portfolio/order counts for non-destructive comparison. Confirm no conflicting active market version; verify pending V3 migration already exists.
3. Deploy pinned branch commit to the **public-domain Vercel project** in production; wait for READY and verify domain resolves to that deployment. If Vercel gives 402 or deployment ERROR, **stop**, leaving database version unactivated.
4. Make a **new** future UTC minute cutover (at least 15 minutes away, preferably with a 30+ minute QA window). With `CUTOVER_UTC` and the matching server secret run `node scripts/prepare-psx-release.mjs` in a trusted environment. Do not log or share the seed. Check that the generated version is `psx-v3-release-1` and the six opening prices equal the old `priceAt(symbol,cutoverCycle-1)` cents.
5. Stage the manifest as a **testing** row in Supabase using restricted administration. Validate the fingerprint against the already configured private seed; verify both Vercel environments' server-side values match *without logging plaintext*. Do not reuse or overwrite the old prototype testing row.
6. Before the selected UTC tick, transition only `psx-v3-release-1` to `active` and set `activated_at`, using a guarded state change. This is authorized only after domain rollout and matching checks. The code uses legacy prices before the cutover; no wallet reset.
7. Confirm the `/api/fun-zone/pod-exchange/market` response changes from `mode:legacy` to `mode:v3` at the cutover. Verify continuity of all six opening quotes, news publishing, and later one-minute ticks. Check that logged-in portfolios still read successfully and their cash/holdings/orders counts are unchanged. Do not place trades on another player's account for QA.
8. Inspect recent runtime errors, market write-audit discrepancies and latency; if any checks fail, report and avoid resetting portfolios.

## Failure and rollback safeguards

- **Before cutover:** Leave the version `testing` or abort the planned activation. Keep the established market untouched; release seed alone never activates anything.
- **After cutover:** Never alter first-tick anchors, retroactively change historical trades, rotate the seed, or revert to application code that knows only legacy quotes. A Vercel rollback is **not** automatically safe after V3 prices are published. Use a forward fix with version-aware historical quote verification; preserve the published engine to protect orders and rankings.
- The database migration must remain additive, with RLS protection, immutable published history and no deletes/truncation of exchange portfolios, orders, EXP or achievements.
- If a command reaches the Vercel free API deployment quota, leave the release staged and tell the user; do not claim public-domain deployment occurred.
