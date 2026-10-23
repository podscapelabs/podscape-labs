# PodScape Design System V1

**Status:** Foundation only. Existing page layouts are intentionally not migrated.

## Source of truth
- `app/design-system.css`: additive semantic `--ds-*` tokens, including theme parity and mobile safe-area clearance.
- `components/design-system/PodscapeUI.tsx`: reusable page headers, actions, card families, and statuses.
- `components/design-system/PodscapeUI.module.css`: component visuals and interaction states.
- `/admin/design-system`: owner-authenticated preview; do not expose it publicly.

## Rules for future features
1. Start from the shared components instead of copying another page's custom CSS.
2. Use editorial headers for discovery destinations; utility headers for account/management workflows.
3. Use `PodscapeButton` for actions and `PodscapeActionLink` for navigation; do not put navigation inside a button.
4. Use `PodscapeNavigationCard`, `PodscapeContentCard`, or `PodscapeDataRow` before inventing new card treatments.
5. Status badges require a visible text label and semantic tone, based on real record state.
6. Use `--ds-*` tokens for new CSS. Keep existing `--*` values as backward-compatible aliases until migration is complete.
7. New control targets should be at least 44px in their tappable dimension; visual glyphs may be smaller.
8. Account for `--ds-bottom-safe-space` on mobile pages with persistent navigation.
9. Respect light/dark mode and reduced motion; verify WCAG AA contrast on text, icons and action states.
10. Do not introduce AI-generated public artwork or modify published visual layouts without approval.

## Incremental rollout and signoff
- First review tokens/component previews in both themes at 320, 375, 430, 768, and 1280px widths.
- Check keyboard focus, no nested `main` landmarks, interaction semantics, content clipping, and safe-area clearance.
- Then pilot Account and Manager, verify behaviour and appearance, then migrate other features.
- Keep feature-specific content/art and special Ledger leaf identity.
- No new feature should implement its own palette, button hierarchy, status chip, and generic cards by default.

## Known follow-ups
- `PlatformShell` currently renders `<main>`, and multiple nested pages render another `<main>`; coordinate an explicit semantic cleanup in the page migration, don't silently change the whole site.
- Legacy `--canvas/--paper` and V2 `--background/--surface` coexist; migrate gradually.
- The current mobile navigation must remain unchanged until its safe-area and active-state pass.
- Fun Zone achievement and completion persistence is separate from design-system styling.
