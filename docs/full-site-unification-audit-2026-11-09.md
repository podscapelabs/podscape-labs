# PodScape — full-site UI unification and pre-release audit
Date: 2026-11-09
Branch: `codex/podscape-unified-release-20261109`
**Scope:** source-level audit and targeted refinements. Browser, account and device-based acceptance testing remains a separate release gate.

## Source inventory reviewed
- 352 repository files at audit start, including 61 Next.js `page.tsx` routes.
- 159 `app/` and `components/` TSX files scanned for legacy glyphs and decorative substitutions.
- 59 `app/` and `components/` stylesheets inspected for Unicode `content:` artwork, obsolete botanical overlays and responsive risks.
- Existing shared editor architecture checked in Home, Manager and Species/Colony workspaces.
- Reviewed the design-system mapping, global tokens, responsive navigation and GitHub QA workflow.

## Changes carried on the unified branch
- Fun Zone: removed leaf-heart ornament layers, standardized game symbols, cleaned featured/puzzle card surfaces, balances and progress.
- Home, Manager, QR Quick Care: replaced edit-toolbar and care-action text glyphs with canonical line icons; preserved navigation slots, local preferences, QR flows and care event persistence.
- Leaf Ledger: About disclosure, discovery shortcuts, featured fallback, moisture UI and configurable widget library use semantic icons.
- Account, Progress and Achievements: responsive cards, owner desk tools, achievement states and toast use the same icon source.
- Shop, Guides, Community, PodBound: removed CSS-generated decorative leaf glyphs, arbitrary sparkles and old artwork placeholders; retained meaningful page photographs and illustrations.
- Onboarding, installation and loading: replaced glyph-based tutorial illustration, pin affordance, PWA prompt and loading ornament; preserved the wordmark and genuine loading progress.
- Administrative desks: replaced Product and PodBound draft/empty-state ornaments; no catalog, financial or editor data was migrated or deleted.
- Cross-browser polishing: use `flex-start` and `flex-end` where Autoprefixer warned about mixed `start`/`end` support.
- Regression guard: recursively scans all TSX and CSS under `app/` and `components/` for forbidden decorative glyphs and checks specific interface and editor invariants. GitHub workflow now triggers for the unified branch.

## Acceptance matrix
| Area | Phone 320–430px | Tablet 768–1024px | Desktop 1280–1440px | Key functional test |
|---|---|---|---|---|
| Home and custom shortcuts | pending | pending | pending | Reorder, replace, reset, persistence |
| Manager and colony workspace | pending | pending | pending | Scan QR, care timestamp, undo, batch logs, archived status |
| Leaf Ledger / collection | pending | pending | pending | Search, profile widgets, saved species, quick import |
| Shop / Product Desk | pending | pending | pending | Filters, images, drafts, SKU and access |
| Fun Zone | pending | pending | pending | All 8 game icons, progress, no duplicate EXP |
| Guides, Community, From the Lab | pending | pending | pending | Heroes, section navigation, internal links |
| Account, Progress, Owner Tools | pending | pending | pending | Auth, panels, achievements, protected access |
| PodBound and card desk | pending | pending | pending | Card previews, editor upload, storefront separation |
| PWA onboarding and navigation | pending | pending | pending | iOS safe area, first-use help, loading, long press |

For each row also inspect light/dark, keyboard focus, at 200% text scaling, reduced motion, focus return and no clipped horizontal overflow. Avoid testing privileged data mutations in public accounts.

## Release gates
- [ ] Unified branch CI passes lint, typecheck, ledger tests, game tests, Manager tests, achievement tests, icon regression tests, and Next.js production build.
- [ ] Production Vercel target is project `podscape-labs-preview` (historical name, **real domain-serving project**), ID `prj_7RyjnPePjJVBONXLcRe9D4wbUMa0`.
- [ ] Exact approved commit deployed with `target=production`, alias `podscapelabs.com` and `www.podscapelabs.com` both resolve to its deployment ID.
- [ ] Authenticated manual mobile and desktop checks completed; run-time errors reviewed.
- [ ] No database migrations, user-data deletion, layout key resets or reward-table changes.

## Known limitations / deferred tasks
- This pass verifies code surfaces and targeted changes, not visual equality on every browser. Human or automated browser screenshots at the actual live domain are still required.
- Cross-device account sync is a separate planned feature; existing per-user/device layout storage remains unchanged.
- A legacy page with bespoke behavior should not be forcibly rewritten into a widget dashboard without flow-specific testing.
- A semantic leaf is valid for the **Leaf Ledger**; decorative random botanical fills are not.
- `podscape-labs.vercel.app` is a separate Vercel project and is not the user's custom-domain app. Avoid deploying to it by mistake.

## Verdict
**Source cleanup committed; deployment readiness conditional on CI and visual/functional acceptance.** Never label the entire platform visually verified based solely on a successful Next.js build.
