# PodScape Foundation Audit — Consolidated Decision
Reviewed: 2026-11-10
Branch: `codex/podscape-unified-release-20261109`
Audit classification: **Source/database inspection substantially completed; end-to-end security and recovery certification NOT complete**.
Production mutation during this audit: **none**.

## Executive outcome
PodScape's present data integrity and primary owner/member RLS structure look sound in the inspected areas. A Vercel preview for commit `9ff9bc6` was READY after Next.js build, TypeScript checks and generation of 57 pages. These checks do not certify every authenticated route or user journey. **No production release sign-off** until the P0 storage policy has a verified correction and essential cross-account tests are performed.

### Coverage and findings by pillar

| Pillar | Completed evidence | Outstanding exit tests | Status |
| --- | --- | --- | --- |
| Database integrity | 27/27 public tables have RLS; 22 foreign keys declared; 0 inspected orphan collection/enclosure/keeper event/product/inventory/member references | Staging migrations; exception/constraint scenarios; migration reconciliation | Audited, conditional |
| Security and permissions | Inspected published vendor RLS, owner-only shop policies, member care ownership, privileged function grants and storage policy catalog | Fix and test product-photos UPDATE policy; reduce legacy TRUNCATE grants; two-user HTTP mutations and Storage tests | **BLOCKING** |
| Frontend architecture | Shared themes: Light, Dark, Woodland; responsive long-text CSS; source regression tests; clean Next preview build | Actual per-route screenshots/mobile/browser accessibility/saved preferences tests in all themes | Incomplete visual QA |
| Backend architecture | Member-scoped preference revisions, vendor approval identity gates; stale vendor approval race guard now committed | Concurrent update/upload/permission API test suite; runtime exceptions/log tests | Partially verified |
| Performance/scaling | Index inventory, advisor and approximate row counts reviewed; two FK-covering indexes missing; directory client cap 1,000 | Browser Web Vitals/load tests; server-side vendor pagination as traffic increases | Low immediate risk |
| Reliability/recovery | CI workflow written; ready preview at `9ff9bc6`; source/runbook prepared | Successful complete GitHub CI suite on newest SHA, verified backup retention, isolated restore rehearsal, production rollback drill | **BLOCKING for recovery certification** |

## Confirmed security issues
**P0 / Storage UPDATE policy:** Authenticated policy `Owner updates product photographs` on `storage.objects` has no `USING` or `WITH CHECK` condition. Authenticated has UPDATE privilege and public SELECT allows product photos. The effective owner boundary is insufficiently constrained; direct exploitation has not been demonstrated and must not be claimed. Proposal: `proposals/PRODUCT_PHOTO_STORAGE_POLICY_REVIEW.sql`. Apply on staging with owner/non-owner access tokens first, then approve a versioned migration.

**P1 / Editorial least privilege:** Tables `content_revisions`, `guide_records`, `lab_records`, `product_records`, `species_records` give anon/authenticated roles broad privileges, including TRUNCATE, despite RLS and no policies. PostgreSQL TRUNCATE is not covered by RLS. Since no direct exposed SQL path was proven, treat as privilege hardening, not proven public data deletion. Proposal: `proposals/EDITORIAL_LEAST_PRIVILEGE_REVIEW.sql`. Verify server-only read/write before revoking.

**Function grants:** Security advisors flag public EXECUTE on two SECURITY DEFINER trigger functions and authenticated EXECUTE on `is_collectible_species`. Trigger functions cannot be called as ordinary SQL functions; advisor notices do not themselves prove RPC exploits. Restrict unnecessary direct EXECUTE grants after verifying trigger/collection behavior on staging. Most other privileged business functions already exclude anon/authenticated.

**Authentication:** Supabase advisor recommends leaked-password protection. Check its support and enable through the authorized project setting after owner review.

## Integrity snapshot
- 36 enclosures, 0 missing user/species collection references
- 8 keeper events, 0 orphaned enclosure links, 0 wrong-owner event links
- 35 member species collection entries, 0 missing auth users, 0 missing species references
- 3 shop variants, 2 product images, 1 inventory adjustment: all linked to existing parents in checked joins
- 2 saved preference rows: both linked to users
- 1 vendor listing linked to an existing user; the older approved listing still has empty country metadata
- 0 public views or materialized views; view-level RLS bypass is not a current exposed-public-schema concern
- Storage: `podbound-art` is private; `product-photos`, `species-photos`, `vendor-logos` are public by design
- Counts are point-in-time production aggregates; no user row contents or credentials were collected

## Performance interpretation
The two unindexed FK columns are `member_species_views.species_id` and `shop_inventory_adjustments.actor_user_id`. Their current approximate table sizes are ~61 and ~1 rows respectively, so a migration is low urgency. Draft: `proposals/FOREIGN_KEY_INDEX_REVIEW.sql`. An advisor also reports an early-access auth policy, although the current policy already wraps `auth.jwt()` in SELECT; inspect the actual plan before changing. Do not remove "unused" indexes on tiny tables based solely on statistics. Vendor directory uses client-side filtering over at most 1,000 listings; introduce server pagination before genuine global traffic demands it.

## Verified code improvements on the branch
1. Owner vendor review checks the status and `updated_at` of the exact application shown; stale decisions fail closed.
2. Automated source guard `scripts/verify-stabilization-boundaries.mjs` runs in GitHub Actions predeployment workflow.
3. New GET-only two-member RLS tester `scripts/test-account-isolation-staging.mjs` can be run with `pnpm test:account-isolation:staging`, but **has not run** because the staging database is unavailable. It cannot substitute for mutating tests.
4. Repeatable non-mutating integrity queries: `READ_ONLY_DATABASE_CHECKS.sql`.
5. Operational runbook: `RECOVERY_AND_ROLLBACK_RUNBOOK.md` (unrehearsed).

## Release-gate decision
**NO-GO for a claim of fully audited/security-certified PodScape.** This is not a claim the product is currently compromised. The tested application *can compile* and the preview for the earlier SHA is READY; the latest added audit/testing commits need a new CI run and build. A production release is a separate, explicitly approved risk decision.

Before declaring the foundation audit complete:
1. Create/approve an isolated Supabase environment. As of this review, `list_branches` returned none. A branch may incur compute charges; do not create without cost approval.
2. Verify product-photo Storage policy enforcement with actual non-owner/owner requests; apply reviewed restrictive migration to staging, then production only with approval.
3. Exercise two-user read AND write denial tests, vendor approval race, role changes, and private Storage visibility.
4. Confirm Supabase backup/PITR availability and retention; rehearse a **non-production restore**. Connector doesn't currently expose a backup-enumeration or restoration-test mechanism.
5. Obtain a clean GitHub Actions lint/typecheck/regression run and Next build for the **final** commit and perform authenticated mobile/desktop smoke testing in Light/Dark/Woodland.

This report deliberately distinguishes inspection, source checks, deployed preview build and unfinished runtime testing. It is not a certification document.
