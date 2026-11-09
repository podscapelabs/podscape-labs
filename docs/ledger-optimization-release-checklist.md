# Leaf Ledger & navigation optimization — release gate

Branch: `codex/ledger-navigation-optimization`
Production baseline: `310eca2f028ba849bbe86f3673a2859a8397074b`

## Reviewed in code
- [x] Species lookup uses the existing catalogue and does not change or migrate species data.
- [x] Owner previews require authenticated owner access; unpublished records are not public.
- [x] Leaf Ledger filter/query/sort and scroll position are stored session-locally, not as a new database field.
- [x] Species browsing prefetches only adjacent profiles and retains the filtered browsing order.
- [x] Standalone-PWA content swipe Back ignores native screen edges, interactive controls, open dialogs, editing surfaces, local species swipes, horizontal scrolling, tabs and grids.
- [x] Shortcut editors provide precise reordering without dragging, with visible keyboard focus.
- [x] Layout editing respects reduced-motion preference.
- [x] Scroll persistence is throttled and restoration runs once per catalogue mount.

## Required before production release (NOT verified)
- [ ] Run `pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm lint` and `pnpm build`; fix all reported failures.
- [ ] Test iPhone installed PWA: Home > Ledger > filter > species > next/previous > Back restores filter and catalogue scroll.
- [ ] Test browser's native left-edge Back separately from interior right-swipe PWA Back.
- [ ] Test swipe on carousels, research details, editor handles, scrolling containers and forms; Back must not activate.
- [ ] Test first-visit deep links and browser refresh; no surprise navigation away from PodScape.
- [ ] Test drag up/down and precise arrows in Home, Manager, species dashboard, shortcut rows and bottom navigation.
- [ ] Test a saved custom layout across refreshes and between species profiles; Reset to Default requires the existing confirmation.
- [ ] Test light/dark, iPhone Safari, narrow browser viewport, tablet, desktop keyboard and prefers-reduced-motion.
- [ ] Verify owner draft preview and public unpublished slug protection.
- [ ] Verify production alias points to the intended commit after explicit deploy approval.

Automated checks were not available for the latest branch commit during preparation of this checklist. Earlier Vercel previews are not proof that the final commit builds.
