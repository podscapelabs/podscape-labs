# Legacy Portal Cohesion — UI Refinement Closeout
Date: 2026-11-10
Branch: `codex/podscape-unified-release-20261109`
Scope: No database schema or member data changes. No new features or themes. No production deployment.

## Changes made
- **Field Guide:** Removed fixed green/cream backgrounds from hero, featured guide and topic illustrations; these now follow the current theme's semantic portal roles, with mobile hero/search/card spacing and keyboard focus improvements.
- **PodBound:** Preserved the green card mockups as game artwork, but restyled the hero background, overlay, copy and action around Woodland/Lilac/Ember. The PodBound page uses legacy root tokens rather than v2-only tokens, avoiding undefined role values.
- **QR Label Studio:** Replaced fixed green step indicators and print actions with `--ps-accent` / `--ps-accent-text`; matched Bulk QR controls and focus states; kept actual QR matrices, paper previews and printed labels dark on white for scanning; avoided duplicate bottom-navigation padding.
- **From the Lab:** Redirected the obsolete landing URL `/from-the-lab` to `/updates`. Kept published/draft Lab data and existing article routes `/from-the-lab/[slug]` untouched. Reused existing `lab` navigation slot ID, updating its label/destination to Updates & Improvements so saved menus continue working.
- **Outdated directory references:** Routed PodBound to `/podbound` and Vendor Directory to `/shop/vendors`.
- **Regression:** Extended `scripts/verify-theme-system.mjs` to check these known legacy colour and route pitfalls.

## Verification & release
- All 12 focused source-level consistency checks passed.
- A preview build for the final commit was requested, but the Vercel API returned HTTP 402 `api-deployments-free-per-day`. GitHub combined Vercel statuses report failure for this quota-blocked SHA. **No fresh build or mobile visual acceptance has been completed.**
- Previous successful build applies to an older SHA and does not certify this commit.
- Production remains unchanged; validate the final commit in preview and all five themes (plus System setting) before asking to deploy production.
- Scope not covered: every legacy portal across the whole codebase, authenticated browser screenshots, visual accessibility audit and remaining staging-only security testing. Do not claim global completion on these points.
