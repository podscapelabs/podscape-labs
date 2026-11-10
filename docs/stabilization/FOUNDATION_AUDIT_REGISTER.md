# PodScape Foundation Stabilization — Audit Register
Updated: 2026-11-10
Branch: `codex/podscape-unified-release-20261109`
Policy: **Feature freeze**. No new major features. No production permission, schema, auth or data changes without explicit owner approval. No production deploy until CI + smoke tests pass.

## Definitions
- CONFIRMED: verified by read-only Supabase catalog, advisor, or reviewed source.
- REVIEW: a risk or recommendation requiring code-path/test evidence.
- BLOCKED: requires isolated test environment, platform setting, or user action.
- DONE: implementation and appropriate verification have completed. Source checks are not a substitute for runtime tests.

## A. Database integrity
- CONFIRMED: 27 regular tables in public; 27 have RLS enabled. Seven editorial/content tables have no RLS policies. **Not automatically a defect**: they appear accessed by privileged server code. Test intended client access before adding policies.
- CONFIRMED: 22 declared foreign keys in public, including keeper enclosure/collection relationships, member owner foreign keys, products and inventory. Evaluate cross-table owner invariants and deletion semantics.
- REVIEW: audit all migration scripts against applied migration history, validate unique/check constraints and orphan counts using non-sensitive aggregate queries.
- REVIEW: assess foreign key indexes for `member_species_views.species_id` and `shop_inventory_adjustments.actor_user_id` with EXPLAIN and projected query volume. Index changes are production DDL and need approval.

## B. Security and permissions
- CONFIRMED: RLS policies on `keeper_events` validate both `auth.uid() = user_id` and an enclosure owned by the caller; `keeper_enclosures` also requires ownership.
- CONFIRMED: `vendor_profiles` public SELECT policy filters `status='approved'`; app server actions enforce verified member identity for applications and owner authentication for approvals.
- REVIEW: five Supabase advisor notices about grants to three SECURITY DEFINER functions: `capture_content_revision()`, `create_customer_profile()`, `is_collectible_species(text)`. The first two return TRIGGER, so a direct RPC exploit is **not established** by their EXECUTE grants. Revoke unnecessary client EXECUTE permissions after checking call sites and trigger behavior in staging.
- REVIEW: existing editorial tables grant some client table privileges even when RLS denies rows. Consider least-privilege GRANT/REVOKE in a reviewed migration, not as an untested live change.
- BLOCKED: enable leaked-password protection in Supabase Auth settings if supported by the current plan and test password/reset flows.
- BLOCKED: two-user integration tests proving no cross-account access to enclosures, care logs, preferences, photos, vendor drafts and other uploads.

## C. Frontend architecture
- CONFIRMED: shared theme roles now cover Light, Dark and Woodland; automated source-level theme checks are part of GitHub Actions.
- REVIEW: run screenshots/smoke tests for every portal in all three modes, including 320/375/430px, reduced motion, keyboard, and long-text cards; do not claim every page is verified before rendering.
- REVIEW: widget persistence across user/device, onboarding, quick navigation, editing and modal focus.

## D. Backend architecture
- CONFIRMED: authenticated preferences sync uses user-scoped queries and revision-based conflict rejection.
- CONFIRMED: vendor submissions validate HTTPS links, file signature/size, shipping countries, verified member and pending approval; owner actions protect approval.
- REVIEW: add request-boundary and concurrency tests for seller update/approve races; monitor image upload and old-file deletion failure modes.
- REVIEW: inspect every privileged Supabase admin-client use for a preceding trusted authorization boundary; no privileged keys may reach browser bundles.

## E. Performance and scalability
- CONFIRMED: Supabase advisor reports two missing FK-covering indexes, one row-by-row auth evaluation in early access RLS and 13 unused indexes.
- REVIEW: never drop an unused index based solely on an advisor warning; confirm statistics and production query patterns.
- REVIEW: Vendor Directory currently returns up to 1000 approved profiles and filters client-side. Plan server-side country/destination/search pagination before global scale.
- REVIEW: measure server work, asset sizes, Web Vitals and mobile startup rather than guessing.

## F. Reliability and recovery
- CONFIRMED: GitHub Actions pre-deploy workflow includes lint, typecheck, source regressions and Next.js production build.
- BLOCKED: verify which backups/PITR are available and retention, capture restore instructions, then perform a **non-production restore** and demonstrate recovery; never test restores against live data.
- BLOCKED: test an exact-SHA preview and record mobile/desktop acceptance; production promotion only after review.
- REVIEW: document rollback of Vercel code separately from roll-forward recovery of incompatible database migrations.


## Verified read-only integrity snapshot (2026-11-10)

All numbers are live aggregate checks, **not** a simulated restore or multi-user access test:
- Enclosures: **36**, missing member-species references **0**.
- Care events: **8**, orphaned enclosure links **0**, events assigned to a different enclosure owner **0**.
- Shop variants: **3**, missing product references **0**; product images: **2**, orphaned references **0**; inventory adjustments: **1**, orphaned references **0**.
- Member species collection entries: **35**, missing user accounts **0**; saved UI preference rows: **2**, missing user accounts **0**.
- Vendor profiles: **1**, missing user account **0**, with **1** existing listing lacking the newly mandatory origin-country field (it predates the new application validation).
- Storage: public buckets `product-photos`, `species-photos`, `vendor-logos`; private `podbound-art`. Public buckets deliberately make stored media publicly retrievable—avoid sensitive uploads.

### P0 storage policy misconfiguration — confirmed from database catalog
The `storage.objects` authenticated **UPDATE** policy called `Owner updates product photographs` has **NULL USING and NULL WITH CHECK** (no conditions). The authenticated database role has UPDATE privileges on storage.objects. There is a public SELECT policy for `product-photos`. A non-owner's ability to mutate a product photo through the Storage API remains **unproven** until tested with an ordinary JWT in staging, but the policy is missing an owner check and is too broad for owner-managed photos.

**Fix proposal only (not applied)**: `docs/stabilization/proposals/PRODUCT_PHOTO_STORAGE_POLICY_REVIEW.sql`. Restrict UPDATE both before and after to `bucket_id='product-photos'` and a trusted `public.is_podscape_owner()` check. This function uses the owner role from `app_metadata`, not user-editable user metadata. Confirm no other permissive policies widen the effective rule and run isolated owner/non-owner tests.

### P1 vendor-review race prevention — branch code change
Vendor owner-review forms now submit the exact `updated_at` and `status` that the owner reviewed. The server's update uses both in its WHERE clause, rejecting a stale approval if a vendor edited the profile or another owner changed its status. The regression check is included in `scripts/verify-stabilization-boundaries.mjs`. This prevents silent approval of newly edited details *after deployment*; a full concurrent integration test is still pending.

### Staging availability
Supabase development database branches: **none** at audit time. No staging project created; creating one could incur a charge. Confirm staging cost and access before rehearsing permissions, account isolation, or backup restoration.

## Release gates (must all pass)
1. A clean GitHub Actions run for the exact SHA (lint, typecheck, regression scripts, production build).
2. Database and permission fixes, if approved, applied as versioned migrations and verified by Supabase catalog/advisor and account-isolation tests.
3. Preview smoke-tested across required portals, modes and mobile/desktop.
4. Backup restore rehearsal completed and documented in a separate environment.
5. Owner approval for production deployment/promotion.

## Priority order
P0 — restrict the unbounded product-photo storage UPDATE policy in staging, then review privileged functions and cross-user access; P1 — migration/integrity and recovery; P2 — architecture and full theme UX; P3 — performance profiling and planned pagination. This order is about risk, not a claim that each P0 finding is an exploit.

## External references
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase database security: https://supabase.com/docs/guides/database/postgres/row-level-security#policies
