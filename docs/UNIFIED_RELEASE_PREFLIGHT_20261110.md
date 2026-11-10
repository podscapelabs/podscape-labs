# PodScape unified release preflight — 10 November 2026

Target branch: `codex/podscape-unified-release-20261109`

## Current decision: HOLD production until a fresh successful build

This file is a source/connector audit, **not a completed release acceptance test**. The latest Vercel build was blocked by one obsolete `RecentGroup.label` type reference; that reference was corrected in commit `6d6c257`. The corrected branch has **not** completed a subsequent production build because Vercel reports a daily deployment API quota.

## Changes audited and corrected

- Recently Updated: corrected the Field Guide category property after the six-category redesign; stable link keys; always-present expanded-list target; collapsed CSS visibility
- Vendor Directory: replaced forbidden decorative glyph placeholders with the shared `vendor` icon
- iPhone PWA splash: new app icon/wordmark experience, no trademark marker, layout safe areas and reduced-motion support
- Legacy release QA: updated the obsolete requirement for the old loading-screen wordmark asset
- GitHub Actions: added `scripts/verify-unified-release.mjs` to the existing pre-deployment test workflow
- Home/Manager naming: inspected shared widget registry and onboarding labels; existing user layout IDs are unchanged
- Colony CSV import: inspected identity-scoped insertion, duplicate handling, input limits and no-overwrite behaviour
- Preference sync: checked authenticated sync, account scope, conflict handling and registered preference storage
- QR print: source check of member-specific QR targets and native printing

## Database and environment checks

Read-only checks confirmed that the deployed Supabase project has migrations for member UI preferences, vendor profiles/storage and curated updates; the relevant tables are RLS enabled. At audit time, curated platform updates contained zero published records. No DDL was run in this preflight.

The Vercel project has `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` configured for production and preview. Secret values were not accessed.

There are existing Supabase advisories related to older functions/tables and leaked-password protection. These were not modified as part of this source audit; review them separately before wider public launch.

## Required automated release gate

1. `pnpm install --frozen-lockfile`
2. `pnpm run lint`
3. `pnpm run typecheck`
4. Every existing `scripts/verify-*.mjs` test listed in `.github/workflows/keeper-qa.yml`, including the new unified-release test
5. `pnpm run build`, with a READY deployment whose Git commit SHA exactly matches the release candidate

**Do not claim the gate passed on the basis of connector/source checks alone.**

## Required hands-on smoke test on a protected preview

- Home loads in desktop, mobile Safari and installed PWA; splash centered without trademark; navigation and safe areas usable in light/dark and reduced motion
- Recently Updated: six categories appear only when there is content; category ordering, batching, expansion and link navigation work; a bulk species update does not hide other categories
- Owner Updates Desk: access denied to members; draft creation, editing, publishing, updating and unpublishing; no draft leaks to public feed
- Vendor Directory: unauthenticated sign-in gate; verified member application; logo preview and upload; pending owner review; approve/reject; approved-only public visibility; editing resets approval
- Home/Manager/Species dashboard edit, drag down/up, reset confirmation; Favorites pin creates and reveals widget; saved layouts survive refresh
- Existing account welcome tour and replay; no owner-only preview
- Import Studio: CSV validation, duplicate handling, species collection linkage, no overwrites; QR batch/single labels scan and print
- Account sync: separate accounts, fresh device, conflict and offline recovery
- Confirm target production domains, project, branch and SHA **before** promotion/release

## Release process

Freeze branch after successful CI, inspect READY preview and perform smoke tests, then deploy/promote that **exact** approved SHA to production. Verify the custom-domain response and member-facing landing page afterward. Do not deploy an older passing SHA to work around a failure on newer code.
