# PodScape Refinement Era — initial cross-portal audit

Status: **working refinement branch; not deployed to public domain**. Primary domain Vercel project is `prj_7RyjnPePjJVBONXLcRe9D4wbUMa0`, NOT `prj_5uR7m4QHn4wVMXvZizQ1A87cAGny`. Live PSX 2.0 market already activated on its earlier release. Never reset wallets or rotate the V3 seed.

## Completed in this branch

| Workstream | Verified opportunity | Change |
| --- | --- | --- |
| Mobile shell | Owner Theme and Feedback floated over actual buttons and charts | Both compacted to separate 42px icon buttons just above the bottom navigation, safe-area aware, with accessible names and the existing theme restore action preserved |
| Leaf Ledger → Manager | Adding a bin while the bin list is unavailable could make a second enclosure with a conflicting name | Disabled Quick Add while collection fetch reports unavailable; preserves read-only species/colony view and tells user why |
| Colonies | Keeper overview required extra navigation to reach saved species and colony actions | Direct Saved species and Manage this colony links; existing private bin Quick Care kept |
| Multi-care | Search only rendered 40 of the 500 potentially selected bins, yet “Select matching” only selected the visible 40 | Full query match selection, 40-row rendering cap clearly disclosed, 500-bin action cap retained, Undo retained, population bounds validated |
| Customizable dashboards | Widget filter counts were visible but not announced coherently | Shared filter announces counts to assistive technology; same component already powers Home, Manager, Species and Fun Zone |
| Five themes | Keeper no-results surfaces still used old global green/cream variables | Replaced with semantic surface, accent, text, border and focus tokens |
| Fun Zone and Exchange | Watchlist repeatedly fetched wallet & quotes while hidden | Visibility guard, focus refresh and reduced polling; deterministic server quote source unchanged |
| Market persistence | Each Exchange market fetch could independently schedule an identical history backfill in the same worker minute | One scheduled backfill per active server instance/minute, preserving idempotent published-history records; no trades or prices changed |
| Owner Studio | Retired Lab Desk duplicated Recently Updated/Updates Desk | Removed from Owner desk navigation, historic Lab route and stored data remain |
| DB least privilege | Four trigger-only SECURITY DEFINER functions unnecessarily exposed to direct REST RPC calls | Additive migration to revoke public/anon/authenticated direct EXECUTE, without changing triggers or records. Staged in Git only, NOT yet applied to production |
| Release testing | Old CSS and PSX tests expected obsolete UI components | Tests aligned to new Exchange and grouped onboarding style selectors; expanded cross-portal CI |

## Verified live baseline (read-only)

Production PSX market version `psx-v3-release-1` active and cutover reached 2026-11-13 01:00 UTC. At 01:03 UTC: 24 published price-history rows, 2 event-history rows, 5 portfolios, 63 recorded orders. No errors in recent Vercel production runtime logs. **Live test trades have not been performed**, and live device QA is still needed.

## Safeguards for release

- No direct mutation of production member records in this branch. Keep signed-in vs guest wallets separate; never silently default corrupt saved balances.
- Preserve existing saved widget keys and scopes, including user-specific navigation and colony layouts.
- Do not alter owner-only permissions or allowlist sign-in rules without explicit security regression checks.
- Apply the least-privilege SQL only with a controlled migration review. Post-migration, verify that trigger-based profile creation, revision capture and ranking-preference defaults still work. Username availability and is_collectible_species are intentionally excluded pending API-contract review.
- Supabase security advisor additionally flags compromised-password protection as not enabled; this must be changed in Auth settings if supported by the selected plan (not a source-code fix).
- Supabase has twenty RLS-enabled tables without direct policies; most appear server-only and must be examined table by table before granting access. No broad allow policies have been added.

## Deferred from this first source-level pass

Before claiming the entire app is *fully polished*: run hands-on iPhone PWA, Android and desktop visual QA on all five themes; profile cold-load page sizes and network waterfalls on real devices; perform a signed-in beta test of new bin, archived bin, notes, QR, multi-care, and trade reconciliation; validate accessibility with keyboard and screen reader; manually review every admin form and empty state; audit image optimization/CLS; review all database grants and production backups. These are substantial, should be tested explicitly rather than presumed from passing static CI.

## QA command

The `PodScape PSX arcade release candidate` GitHub Actions workflow runs lint, typecheck, Next.js build, PSX persistence, wallet safety, Manager/Ledger, theming, onboarding, Fun Zone, privacy and `scripts/verify-refinement-era.mjs`. Only deploy after HEAD passes and live data is backed up.
