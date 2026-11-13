# PodScape Universe — Visual Hierarchy & Interaction Audit

Date: 2026-11-12 Toronto / November 13 UTC. Branch: `codex/podscape-universe-polish-20261112`. **Audit-only production status: no deploy and no production database changes.**

## Product acceptance criteria

- **One universe, distinct personalities.** Light, Dark, Woodland, Ember and Lilac share semantic surfaces, spacing, typography, focus states, mobile controls and pop-up behavior. Home, Keeper, Leaf Ledger, Fun Zone, PodBound and Shop retain their own content hierarchy, artwork and purposeful flavor.
- **Depth without detours.** Primary tasks near the top, related actions contextual, saved filters remain when navigating, details hidden until useful. Destructive actions always explicit.
- **Customizations persist.** Never rename or reset existing saved widget IDs, visibility, position, drag semantics, user-defined navigation or theme preferences.
- **No parallel dialog libraries.** Information/help/education should use `PodscapeInfoDialog`. Widget libraries use one shared editor dialog hook, heading, summary and filter language. Actual forms/confirmation dialogs may need specialized controls, but must retain focus/keyboard/safe-area contracts.

## Phase A — Visual hierarchy and interaction results

| Surface | Finding and source | Change |
| --- | --- | --- |
| Ranking help | `RankingModal.tsx` kept a separate native dialog with duplicate CSS and distinct mobile sheet behavior | Now uses `PodscapeInfoDialog`, with trigger focus returned on close; retired duplicate ranking dialog styles |
| Leaf Ledger research | `SpeciesResearchWidgets.tsx` used its own native modal and research-specific backdrop, title, padding and close behavior | Uses `PodscapeInfoDialog`, retaining compact previews, detailed content, accessibility and focus return; removed superseded modal CSS |
| Widget library — Home | Own widget title/heading/count markup | Uses `WidgetLibraryHeading` and `WidgetLibrarySummary` |
| Widget library — Manager | Own heading, custom count and action labels | Uses same shared heading/summary; Manager-only presets remain |
| Widget library — Species | “Species widgets” as separate dialog title and an incompatible “active widgets” count | Uses one Widget Library title and added/total format; species context shown in eyebrow; cross-species layout behavior preserved |
| Widget library — Fun Zone | Own heading and summary actions | Uses same components; game-specific categories and cards preserved |
| Widget overlays | `PodscapeHome.module.css` included a fixed dark-green sheet backdrop | The shared overlay uses semantic active-theme background, visible focus treatment and safe-area padding |
| Jiggle mode | Four portals already use `WorkspaceEditCanvas`, `WorkspaceEditToolbar`, `useWorkspaceDrag` and standard long-press thresholds | Confirmed shared interaction contract; aligned edit block focus and minimum 44px directional controls. No persistence or drag algorithm rewrite |
| Widget library focus | All four portals use `useWorkspaceEditorDialog` | Confirmed focus trapping, Escape to dismiss, scroll locking and trigger focus return. Do not replace with ad-hoc modals |
| Reset semantics | All four use `confirmWorkspaceReset` | Kept the existing per-portal data-safety messages and unchanged saved-layout keys |

## Phase B — Complete source route inventory

**78 `app/**/page.tsx` routes** enumerated and checked for local headers, explicit shared shell references, inline styles and redirect-only handlers:

| Area | Routes |
| --- | ---: |
| Account and Owner Tools | 12 |
| Administrative routes | 17 |
| Fun Zone and its games | 12 |
| Keeper/Manager and bin tools | 11 |
| Leaf Ledger + legacy PodDex | 6 |
| PodBound | 3 |
| Shop and Vendors | 4 |
| Guides + historical From the Lab | 4 |
| Remaining application, auth, community, explore, search, home, menu and updates | 9 |
| **Total** | **78** |

Note: A missing `PlatformShell` import in one page is **not** automatically a bug. `app/account/layout.tsx` wraps descendants in the platform shell; redirects such as old `/poddex` URLs intentionally have no page UI. Conversely, an explicit hero in a feature area is not necessarily inconsistent; it may express the portal identity.

### Follow-up visual QA candidates (do not classify as confirmed bugs)

1. **Account and Owner Tools hub:** local hero systems are still authored independently. Compare their heading scale, first action, tab order and card density with the shared portal and Owner Studio hierarchy.
2. **Older authentication/reset and maintenance screens:** ensure guest/owner states use coherent token roles and predictable navigation without accidentally exposing owner-only routes.
3. **Marketplace, Keeper and game detail pages:** source contains inline styles for content-specific imagery/progress and some locally-authored headings. Inspect rendered examples in all themes to distinguish intentional decorative exceptions from inconsistent UI.
4. **Species dashboard information depth:** review which advanced widgets can stay collapsed; retain care-at-a-glance and the collection action above deep research.
5. **Onboarding:** intentionally uses a multi-step role=dialog flow. Confirm keyboard trap, Escape/back progression and mobile viewport behavior; a tutorial cannot be reduced to a static help sheet without losing its flow.
6. **Other confirmation/danger dialogs:** inventory delete/archive, import overwrite, account changes and marketplace actions need real interaction testing. Do not replace native confirmation safety with a purely cosmetic modal.

### Manual acceptance matrix to execute before live release

On **iPhone PWA, mobile browser and desktop** at all **five themes**: Home, Menu, Account, Ledger browse + species details, Manager + bin + QR + care, Fun Zone games + rules + achievements, Exchange buy/sell + rankings, PodBound card gallery/detail, Shop and vendors, and every Owner Desk/editor.

For each area:
- Hero/section hierarchy: page identity → one primary action → summary → detailed content.
- Cards, forms and links: contrast, text clipping, touch target size, safe-area overlap, loading/empty/error/success/disabled states.
- Pop-ups: opening focus, scrolling, backdrop, Escape, close button, backdrop dismissal, focus return, and no double overlays.
- Dashboards: 500ms touch-and-hold to jiggle, drag/reorder, keyboard move buttons, Add Widget, Available/Added filters, Done, Reset confirmation, persistence after reload.
- Most common workflow: count taps from portal landing to action; identify and remove redundant intermediate pages. Minimize detours without bypassing confirmation on destructive actions.
- Data preservation: compare a signed-in test account's layouts, rankings, portfolio, bins, care events, species selection and theme preferences before/after.

## Enforcement

`scripts/verify-universe-interactions.mjs` enumerates every page route and checks the four widget/jiggle implementations, the common information sheet, theme-based overlays, focus behavior and minimum touch controls. Both release workflows run this, as well as the established universe-polish, design-system, theme, Keeper, Fun Zone and PSX safety checks.

Passing static checks means the shared components compile and the source-level contracts are present. It does **not** certify screenshot-level visual consistency or the behavior of all deep workflows without device QA.

## Recommended next release gate

Freeze the branch, finish both CI builds on the exact HEAD, then conduct authenticated hands-on visual and functional testing. Leave the staged database grants/indexes unapplied until separately reviewed. Release the refinement branch only after critical UX/visual issues are resolved.
