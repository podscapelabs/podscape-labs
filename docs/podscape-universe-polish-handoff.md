# PodScape Universe Polish — integrated working branch

## Release controls
- Branch: `codex/podscape-universe-polish-20261112`
- Baseline: `codex/podscape-refinement-era-20261112` at `23b1b32d0ece2840a37372b5de452567e97224f4`
- Live-domain Vercel project: `podscape-labs-preview`, `prj_7RyjnPePjJVBONXLcRe9D4wbUMa0`, `www.podscapelabs.com`. **DO NOT deploy to the similarly named second project**.
- **Not deployed.** No SQL from this branch was applied to the live Supabase project. Existing PSX V3 seed, market version, wallets, trades, achievements, members and personal layouts must remain untouched.

## Shared foundation delivered

1. `components/OwnerDeskFoundation.tsx` + CSS: semantic theme-aware shared hero, action row, owner section, and error/success/status surface. Keyboard focus rules, mobile spacing, icons and descriptions.
2. Eleven owner entry points migrated to the shared hero: Species, Guide, Product, Vendor, Spotlight, Updates, Feedback, Puzzle, PodBound Card, Early Access, and Platform Analytics. Desks retain their specialized actions and forms; Product and Card creation buttons remain at the top.
3. Early Access page rewritten to use the shared owner section and semantic forms rather than hardcoded inline green/cream styles. Tester approvals and revocation still use the original server actions.
4. Five owner entry points use unified `OwnerDeskNotice` status/error semantics, retaining exact save/retry messages and screen-reader live roles.
5. `components/PortalActionRail.tsx` + CSS: member-customization-safe contextual links and in-place controls with common responsive touch targets.
6. Manager's in-page Quick Care, Notes, Population and Multi-care workflows, Fun Zone's quick destinations, Shop discovery, and Keeper collection shortcuts now use the same contextual action component. Hidden Fun Zone widget destinations are no longer broken anchors.
7. PodBound and Menu now reuse `PlatformShell`, preserving their own visual identity and customized menu pins without duplicating the global header.
8. Retired decorative star glyphs in puzzle screens, puzzle-artwork picker, and pod access page removed or replaced with the canonical line icon library.
9. Owner navigation no longer stacks duplicate back links above the shared studio header.
10. The previous refinement branch's mobile Theme/Feedback compact docks, improved Keeper collection flow, watchlist polling, and news-first PSX UI remain included.

## Backend and CI
- Staged ONLY, not applied: `20261113010500_trigger_only_function_privileges.sql` to remove unnecessary direct REST EXECUTE grants from four trigger-only privileged routines.
- Staged ONLY, not applied: `20261113013000_universe_performance_fk_indexes.sql` for missing indexes on species-view foreign keys and inventory adjustment actor IDs.
- Fixed malformed step name in `.github/workflows/keeper-qa.yml` (unquoted colon), which previously created GitHub Actions failures with zero jobs.
- Extended both Keeper QA and PSX release candidate workflow to run `scripts/verify-universe-polish.mjs`.
- Updated icon checker to inspect the real Fun Zone portal component (instead of the server wrapper) and repaired four genuine forbidden legacy glyphs.
- The live Supabase `early_access_testers` SELECT policy has an auth-function performance warning, and the auth compromised-password protection option needs separate settings review. Do not alter these blindly.

## Build/test requirements
- Must pass lint, TypeScript, Next.js production build, original Play/Manager/Ledger tests, Theme/Onboarding tests, Pod Exchange V3 price and wallet safety, privacy tests, icon consistency and new universe checks.
- Manual iPhone PWA, Android and desktop QA across Light/Dark/Woodland/Ember/Lilac remains **required**. Source-level testing is not proof of pixel-perfect UI.
- Check Owner create/edit/preview/publish/archive in every desk, especially responsive forms, compare desktop and mobile, and verify member navigation preferences before and after.
- Test one real signed-in Keeper flow: Ledger species → save species without bin → create bin → log/undo care → archive → restore → QR label → import duplicates.
- Verify official market API quotes are available, then test a controlled signed-in buy/sell with expected fees; no automated destructive trade reset.
- Snapshot member portfolio/order and keeper bin/event totals before and after release. Never use truncate/drop/reset on member data.

## Next implementation opportunities not claimed complete
- Eliminate duplicated owner desk record-browser/editor logic using a shared `OwnerRecordWorkspace` without changing current server actions or URLs.
- Design a transaction-safe species+enclosure creation and import operation; the current separate saves can leave a bookmarked species if enclosure creation fails. Require rollback tests, archived-record behavior and concurrency checks before activation.
- Establish visual snapshots, bundle-size baselines and click-count measurements per persona; shorten any journey above three principal actions with contextual shortcuts.
- Audit all remaining legacy CSS variables. Migrate incrementally to semantic tokens without modifying authored theme palettes or wiping preferences.
- Review remaining data-table RLS policies, database authorization, query plans and downtime/rollback procedures on staging.
