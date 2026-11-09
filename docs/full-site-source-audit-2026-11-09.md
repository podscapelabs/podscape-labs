# PodScape full-site source audit and release readiness — 2026-11-09

## Ground truth
- Repository: `podscapelabs/podscape-labs`
- Audited branch: `codex/podscape-unified-release-20261109`
- Live custom domains: `podscapelabs.com`, `www.podscapelabs.com`
- Their Vercel project: `podscape-labs-preview` (`prj_7RyjnPePjJVBONXLcRe9D4wbUMa0`), **Production** target. Its project name is misleading; do not deploy only to `podscape-labs`.
- Do not change the domain project, branch mappings, production aliases, database schema or existing saved user data during a visual refinement.
- The audited branch is not `main`; compare branch divergence and avoid merging `main` without separately reviewing its five unique commits.

## Source audit scope
The repository tree at audit start contained **352 tracked files**, with **61 page routes**, **159 `.tsx` app/shared-component files** and **59 CSS files** under `app/` and `components/`. Both public and authenticated Owner Desk surfaces are in scope.

### Completed source-level refinements
- Consolidated the prior Home, Manager, Colony and Leaf Ledger refinements onto one unified development branch.
- Standardized shared semantic SVG icon assignments. Game icons keep one identity across the Fun Zone carousel, puzzle library and game pages.
- Removed deprecated Unicode/botanical glyphs from portals, owner tools, card placeholders, scanning/Quick Care, installation screen, achievements, Ledger discovery, onboarding/shortcut editor and the Home loading screen.
- Removed decorative pseudo-botanical Fun Zone layers and the Shop hero's misuse of an actionable Shop icon as decoration. Removed unused Progress botanical declarations.
- Preserved the branded loading wordmark and actual progress animation, and left interaction, backend, EXP award and data models unchanged.
- Kept shared editing patterns and saved-layout keys; no data migration or reset performed.
- Extended `scripts/verify-legacy-icon-rollout.mjs` to recursively audit all `.tsx` and `.css` sources in `app/` and `components/`; `.github/workflows/keeper-qa.yml` now includes the unified branch, running lint, typecheck, care/ledger/fun-zone/design regressions and production build.

### Release gates that still require execution/visual confirmation
These are **not marked passed** on source inspection alone:
- [ ] GitHub Actions lint, TypeScript, all regression scripts and production build successful at the exact final commit.
- [ ] Successful Vercel production-equivalent build for this commit, with no runtime/compilation errors.
- [ ] QA screenshots and interaction checks at 320, 375, 390, 430, 768, 1024 and 1440 CSS px; both light and dark modes, iOS Safari/PWA, keyboard and reduced-motion.
- [ ] Home and Manager edit-mode parity (press-and-hold, up/down drag, move, add, remove, reset, persistence and undo where applicable).
- [ ] Manager QR scanner, care logging, batch care, timestamps, undo, bin switching and data isolation.
- [ ] Ledger: taxonomy display, About, moisture preference, care widgets, import, collection, personal settings, species navigation.
- [ ] Fun Zone: each game, progress tracking, EXP once, achievements, leaderboard placeholder state, card art.
- [ ] Shop, vendor directory, PodBound card gallery, Guides, Search, Community, Menu, Account and Owner Tools links and permission gates.
- [ ] All deep links and redirects (including PodDex compatibility) and no accidental horizontal overflow.
- [ ] Authenticate separate owner/test accounts; verify role restrictions and that preexisting user data, achievement balance, layouts and colony history remain intact.
- [ ] Confirm `podscapelabs.com` **and** `www.podscapelabs.com` resolve to the READY deployment's exact final commit.

## Release blockers / non-code findings
- Vercel's daily API deployment quota has intermittently blocked new builds. Never interpret a successful GitHub push or an older READY deployment as evidence that the current branch is live.
- GitHub check statuses sometimes report the second, unrelated `podscape-labs` project being rate-limited; distinguish this from a build on the actual custom-domain project.
- Because this source inspection cannot emulate authenticated Safari/PWA user sessions, it is not a substitute for browser QA.
- The UI source includes intentionally different semantic artwork (e.g., PodBound cards and species photography); do not delete these merely because the universal icon system disallows random decorative symbols.

## Change safety
The intent is presentation, accessibility, responsiveness and regression coverage only. No database migrations, removal of saved widget keys, purchase/checkout activation, role-policy alterations, deletion of species records or replacement of working care workflows.
