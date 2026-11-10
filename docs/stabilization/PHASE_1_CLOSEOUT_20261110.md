# PodScape Foundation Stabilization — Phase 1 Closeout
Date: 2026-11-10
Branch: `codex/podscape-unified-release-20261109`
Decision: **CLOSE SOURCE/READ-ONLY AUDIT PHASE; DEFER PAID STAGING AND DEEP RECOVERY TESTS**
Production data/schema/permissions changed during audit: **No**
Paid Supabase branch created: **No**

## Completed and recorded
- Inspected 27 public database tables (all have RLS enabled), relationships, major ownership policies, privilege grants, Storage policies, and Supabase advisories.
- Read-only integrity queries found no orphaned/cross-owner links in checked records.
- Committed owner vendor approval race protection: last-reviewed status and timestamp are checked atomically.
- Added source-level auth regression assertions to the GitHub pre-deployment workflow, plus an opt-in GET-only staging account isolation harness.
- Documented recovery/rollback and account-isolation test procedures.
- Drafted **unapplied** SQL proposals for product-photo Storage policy restriction, broad editorial table grants, and two optional indexes.
- Earlier preview SHA `9ff9bc6` built successfully. Newest commit needs its own verification before release.

## Outstanding — not resolved, not certified
**P0: product-photo Storage update policy** lacks owner restrictions. It has an unrestricted authenticated UPDATE policy and must be fixed/tested with owner and ordinary-member accounts before full security sign-off. This is a live database policy, **not corrected by app-code deployment**. See `proposals/PRODUCT_PHOTO_STORAGE_POLICY_REVIEW.sql`.

**P1: old editorial grants** include TRUNCATE permissions for anon and authenticated on five server-managed tables; RLS does not protect TRUNCATE. Fix after verifying all intended server access. See `proposals/EDITORIAL_LEAST_PRIVILEGE_REVIEW.sql`.

Staging two-account mutation tests, Storage permission-denial tests, backup availability/retention, restore rehearsal, authenticated mobile/browser tests, and comprehensive GitHub regression results remain unverified.

## Release definition
A successful compilation/preview is evidence of buildability only. A deployment with these deferrals is an **explicitly accepted limited release**, not proof that the full foundation audit is complete. Do not claim the P0 permission finding has been remediated.

## Resume checklist
1. Evaluate a no-cost local Supabase CLI environment as an alternative to paid Supabase hosted branching. Ensure it models live migrations and authorization; only a real database-backed test can validate permission behavior. Do not use production accounts/data.
2. Test the draft Storage permission fix and editorial grant restrictions with disposable accounts; apply approved versioned migrations to production only after review.
3. Verify backup policy and practice a restore without touching production data.
4. Run the complete regression suite and signed-in mobile/desktop acceptance on an exact SHA.
5. Close the above as Phase 2 security/recovery certification.
