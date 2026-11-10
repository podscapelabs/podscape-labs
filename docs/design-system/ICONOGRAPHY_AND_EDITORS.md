# PodScape design system · icons and editing controls

**Status:** Foundation adopted on the Fun Zone and shared dashboard editor. This is the canonical policy for all future portal refinement passes. Other legacy pages remain subject to audit; do not claim a whole-site migration is complete.

## 1. One line-icon family

- **Source of truth:** `components/PodscapeLineIcon.tsx`. Icons are real SVG paths, not AI placeholder artwork, emoji, dingbats, Unicode substitute symbols, or arbitrary botanical motifs.
- **ViewBox:** `0 0 32 32`, outline stroke `1.65`, rounded joins and caps, `currentColor`. No unapproved alternative stroke weights.
- **Sizes:** 16px for compact controls, 20px for standard buttons and navigation, 24px for widget/feature tools, 32–48px only for meaningful game identity/hero labels. Use CSS for size; don't redraw a new icon for each size.
- **Colour:** inherit the appropriate token. Use a single neutral or accent tone per icon, respecting light/dark themes. Never rely on colour alone to communicate status.
- **Accessibility:** icon-only buttons need a descriptive `aria-label`; SVG icons paired with visible text are `aria-hidden`. Maintain at least 44×44 CSS px tap targets for primary mobile interactions where practical.
- **Allowed leaf usage:** Leaf Ledger and actual plant-related concepts can use the **leaf icon** *semantically*. Random leaf-heart ornaments, broad decorative `❧` glyphs, and pseudo-leaf CSS flourishes are **not** acceptable page filler.

## 2. Icon roles, kept separate

| Role | Purpose | Examples | Never do |
|---|---|---|---|
| Navigation | Open a destination | Shop bag, Ledger leaf, Manager bin | Use a button icon as random card decoration with no relevant destination |
| Actions | Perform an edit | Edit, Add Widgets, Grip, Arrow Up/Down, Close | Use trophy, plant, or emoji instead of a purposeful action |
| Status | Convey state | Check, Lock, Achievement | Substitute ambiguous shapes or rely on colour alone |
| Content identity | Identify a game or topic | Crossword grid, Connections nodes, Quiz question | Give different icons to the same game on separate pages |
| Illustration / decoration | Atmosphere, not function | Brand photographs, abstract surfaces, subtle texture | Reuse actionable glyphs as ornamental confetti or invent new AI icons |

**Exception:** An icon for a game can appear larger on *that game's* hero or listing card to identify it; this is the same semantic referent, not a random cosmetic graphic. Keep accessible game names in text.

## 3. Canonical mapping

- Fun Zone games: `lib/podscape-icon-catalog.ts` → `funZoneIcons`. It is shared between Fun Zone listing, featured carousel and individual puzzle libraries.
- Progress: `progressIcons` for completed, locked, available, achievement.
- Editing: `editorIcons` for customize, widgets, close and done. The shared editor renders actual `PodscapeLineIcon` paths.
- Any new icon must be added to the canonical SVG component with a stable name, documented meaning and reuse target. Avoid creating inline bespoke SVGs in unrelated pages without a design-system review.
- Never use an unrelated icon simply because it happens to look good.

## 4. Shared dashboard editing contract

Home, Manager and Colony dashboards should share **the same interaction language** through `components/WorkspaceEditCanvas.tsx`:

1. **Enter:** accessible Edit/Customize control on desktop; press-and-hold a noninteractive widget area on mobile. Long-press must not intercept text fields, selection or nested shortcut editing.
2. **While editing:** a consistently positioned toolbar with **Add Widgets**, **Reset to Default**, and **Done**. Every widget shows drag grip, Move Up, Move Down and Remove (unless required). The keyboard controls perform the same action as drag.
3. **Manage:** categorized widget library with clear selected/added state. Close with Done, outside-click where safe, or Escape. Keep keyboard focus inside the modal and return focus to the opener.
4. **Finish:** changes save immediately; Done exits edit mode. There must be no hidden save requirement.
5. **Reset:** explicit confirmation; reset layout only, never delete account, care, game or species records.
6. **Persistence:** preserve existing member/device-specific storage keys and supported data. A future account sync phase can move the storage behind an adapter; it must not break existing layout preferences.
7. **Empty states:** if all optional widgets are hidden, show Add Widgets access. Required identity/navigation remains reachable.
8. **Motion:** drag and layout animations respect reduced-motion preference; do not let global PWA swipe/back gestures hijack local widget drag.

**Known gaps for the full-site pass:** each portal still has its own widget-library presentation, some unrelated cards use legacy symbols, and cross-device layout sync is deliberately deferred. Don't multiply editors further. Extract shared library/preset primitives before the next portal is migrated.

## 5. Rollout and acceptance criteria

- **Phase 1:** Fun Zone removes artificial leaf-heart ornament graphics and uses semantic game/status icons; shared dashboard editor buttons use canonical action glyphs.
- **Phase 2:** Home, Manager, Colony, Leaf Ledger, Guides, Shop, Account, PodBound and public/marketing screens receive page-by-page audits. Record before/after screenshots at 375px and desktop for light and dark.
- **Phase 3:** All page/portal widget libraries and onboarding customization are refactored to shared editor UI primitives; test keyboard, touch, PWA gestures, focus and saved preferences.
- **Phase 4:** Cross-device sync (planned separately) without data loss.

**Reject a change** if it uses arbitrary decorative Unicode for icons, mixes unrelated icon styles without documentation, duplicates an existing semantic icon, removes a needed accessible label, or makes editing behave differently from the shared workflow without a reason.


## 6. Unified editing refinement (November 2026)

The current Home, Manager, Species and navigation pass centralizes the practical rules while retaining the existing storage keys and data shape:

- `components/workspace-edit-standards.ts`: one **500 ms** hold, **11 px** movement cancellation, **1100 ms** post-gesture click suppression, and scoped reset-confirmation copy (Home, Manager, Species, Home shortcuts, Manager shortcuts, bottom toolbar).
- `components/WorkspaceEditCanvas.tsx`: the same drag handles, movement arrows, removal controls and semantic iconography, with nested form/button controls excluded from press-and-hold interception.
- `components/useShortcutEditor.ts`: one long-press contract for Home quick links, Manager quick links and bottom navigation; safe pointer capture and pointer-ID checks for multitouch.
- `components/useWorkspaceEditorDialog.ts`: Home, Manager and Species widget-library dialogs share background-scroll locking, Escape-to-close, Tab focus containment, first-control focus and opener focus restoration.
- All three dashboard Edit controls now use the canonical semantic SVG edit icon. Reduced-motion disables editing jiggle and transition effects.
- The regression script `scripts/verify-design-system.mjs` verifies these invariants on every CI run.

**Not included:** cross-device synchronization, any clearing of existing layout preferences, changing species or colony data, or live deployment. Device/browser walkthroughs remain a separate acceptance gate before release.
