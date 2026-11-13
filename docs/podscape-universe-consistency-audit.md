# PodScape Universe Polish — Whole-Application Consistency Audit

Status: **source-level audit and shared-component implementation**, on working branch, not deployed. The public-domain project remains `prj_7RyjnPePjJVBONXLcRe9D4wbUMa0`; do not deploy to the other Vercel project.

## Vision and invariants

PodScape is one universe. Home, Leaf Ledger, Manager, Fun Zone, PSX, PodBound, Shop, Field Guide, Community, Account and Owner Studio use one design language, behavior and navigation grammar. Each portal retains its own tone and identity. Never erase user widget layouts, navigation slots, themes, collections, care logs, game progress, cards or Duck Bucks.

## Pass A — visual hierarchy and interaction contracts

**Headings:** one portal identity/hero and primary purpose, then one dominant next action, then quick actions, then overview/widgets. Avoid repeated back links, repeated hero blocks and equal-weight competing action groups. A modal title should be visually distinct from the eyebrow and body copy.

**Modal/sheet:** all informational dialogs use `PodscapeInfoDialog` with native modal focus confinement, Escape handling, themed backdrop, mobile safe-area, background-scroll lock and focus return. Ranking help and Leaf Ledger research have been moved onto it; update details, rules and Exchange information already use it. Action/confirmation dialogs still require explicit audit: they are not safely interchangeable with informational sheets, and destructive actions must remain confirmed.

**Widget Library:** Home, Manager, Species and Fun Zone use `WidgetLibraryHeading`, `WidgetLibrarySummary`, `WidgetLibraryFilter`, `WidgetLibraryEmptyState` and `useWorkspaceEditorDialog` for consistent wording, counts, access and keyboard behavior. Keep actual widget contents, IDs, visibility and storage scopes portal-specific.

**Arrange / jiggle:** same `WorkspaceEditToolbar`, `WorkspaceEditBlock`, `useWorkspaceDrag` and edit-timing constants in all four customizable portals. Consistent hold activation, keyboard move controls, reset confirmation, touch size (44px), reduced-motion behavior and Done/Arrange return. A drag must never trigger the underlying widget's navigation. All theme variants inherit identical editing surface and focus semantics.

**Owner Studio:** one OwnerDeskHeader/Section, RecordBrowser/Count, Notice, and contextual navigation. Search and filter state must survive changing selected records. Editor-specific forms keep their existing validation, media workflows, and authorized save/publish server actions. Protect ordinary native editor forms against accidental unsaved loss.

**Mobile:** maintain safe-area and bottom nav spacing; floating owner theme and feedback must not hide content; maintain 44px interactive targets and readable compact text. Prefer contextual actions in the active portal instead of replacing member-configured navigation slots.

## Pass B — every route, shared implementation and remaining exceptions

A repeatable full-source inventory is checked in at `scripts/verify-universe-consistency-audit.mjs`. It visits every `app/**/page.tsx`, reports shared/delegated shell and route exceptions (auth, access, redirects), inline-style pages, competing dialog implementations, and high-concentration hardcoded stylesheet colours. It also asserts all four portal libraries inherit the shared jiggle/modal contracts, all five theme IDs remain valid, and nested PodBound/Menu routes share the shell.

Not every page needs an additional `PlatformShell` inside its component: App Router layouts and wrappers already provide it for some segments. Avoid double headers and duplicate navigation. The scanner reports uncertain pages for human review rather than injecting a second shell blindly.

### Residual review areas, in priority order

1. **Device-rendered visual verification remains open.** Check representative phone/desktop widths and each of Light, Dark, Woodland, Ember and Lilac; validate no clipping, contrast loss, doubled headers, modal overlap or invalid sticky/floating layering. Static source checks cannot claim screenshot-level completion.
2. **All action/confirmation interfaces:** inventory and migrate appropriate bespoke `window.confirm` and other action overlays to shared accessible confirmation sheets, but keep genuinely security-sensitive actions guarded. Test Cancel, Escape, backdrop click, pending states and focus restoration.
3. **Older global CSS:** trace legacy `--forest`, `--paper`, hardcoded hexadecimal palette usage and high-specificity overrides. Gradually replace with semantic tokens; do not wholesale replace species artwork/brand assets, which intentionally use fixed artwork colours.
4. **Portal section order:** inspect first fold and goal-to-action tap counts in Keeper, Shop, Fun Zone and Owner Studio. The source has shared components but not all section ordering has been verified by viewport screenshots.
5. **Owner desk specialized editors:** Species, Puzzle, Vendor and Spotlight can adopt deeper common record browsing and save/validation conventions where they fit, without breaking custom forms.
6. **Accessibility:** full keyboard navigation, screen reader modal focus, long-press alternatives, drag announcements, Escape/cancel behavior and low-motion system setting.
7. **End-to-end data correctness:** signed-in bin creation, QR/care entry, archiving, imports, PSX portfolio continuity, custom layouts and theme persistence in every portal, plus permissions and RLS checks.

## Release gates

- Both Keeper and PSX full CI workflows successful on the **same final HEAD**, including Next.js production builds, shared UI contract audit and existing game/collection regressions.
- No production member record reset, no unreviewed SQL migration or permission change, no changes to PSX settlement.
- Device walkthrough and five-theme screenshot comparisons (including modal open, widget editor open, jiggle mode, empty/error states) before claiming entire-platform visual consistency.
- Deploy only to the correct public-domain Vercel project after review/approval.

## Scope note

This is a repository-wide source audit and implementation of shared contracts, not proof that every screen is pixel-identical or that every interaction passed real-device testing. The goal is **one dependable universe, not identical-looking pages**.
