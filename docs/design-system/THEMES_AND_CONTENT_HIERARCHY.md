# PodScape Themes — shared UI contract and visual review
Status: source-level consistency pass on unified branch; browser/device matrix remains required before claiming every page visually verified.

## Core theme rule
**Themes change semantic roles, not individual page colors.** Visual components should never ask for "the green" or "the white" when they mean an actionable surface, accent text, or a secondary label. Do not modify widget IDs, navigation IDs, storage keys, or page structure while changing themes.

Two existing palettes co-exist: legacy `canvas/paper/forest` and portal `background/surface/accent`. Both now feed a common `--ps-*` semantic layer. Existing implementations can migrate incrementally without changing the stored appearance setting (`data-theme="dark"`).

| Role | Variable | Purpose |
| --- | --- | --- |
| Page background | `--ps-bg` | App canvas behind dashboards and pages |
| Card surface | `--ps-surface` | Default cards, panels and widgets |
| Raised surface | `--ps-surface-raised` | Inputs, dialogs, raised panels |
| Muted surface | `--ps-surface-muted` | Quiet metadata or icon tile |
| Main text | `--ps-text` | Titles, values, body content |
| Secondary text | `--ps-text-secondary` | Captions, descriptions, help |
| Border | `--ps-border` | Dividers and card outlines |
| Accent | `--ps-accent` | Action buttons, active states, links |
| Text on accent | `--ps-accent-text` | Critical: adapts to lighter dark-mode accents |
| Keyboard focus | `--ps-focus` | Visible focus outline |
| UI font | `--ps-font-ui` | Navigation, labels, controls, body copy |
| Display font | `--ps-font-display` | Hero and content headings |
| Card/control radius | `--ps-radius-card`, `--ps-radius-control` | Predictable shape hierarchy |
| Control min size | `--ps-min-control` | Touch and keyboard targets |

## Hierarchy
1. **Portal hero**: one prominent title, one-sentence context, optional clear primary action. Rich media or dedicated hero palettes may remain fixed **only** where foreground contrast is explicitly designed for them.
2. **Section headings**: use the same display font scale across Home, Manager, Guide, Ledger, Shop, Fun Zone, PodBound and Owner Studio.
3. **Navigation and quick actions**: compact UI font and recognizable icons; avoid using a large content heading style for control labels.
4. **Cards**: same surface/border family; never bake in a light-only white or dark-only green. A selected state uses `--ps-accent` **and** `--ps-accent-text`.
5. **Body and metadata**: distinguish primary text from secondary descriptions via role, not arbitrary opacity.
6. **Popups/dialogs**: raised surface, clear close control, keyboard focus, mobile safe-area, reduced-motion support.

## Text resilience
- Each flex/grid card and child text container must have `min-width:0`.
- Long or unbroken names, taxonomic names, vendor names and translated text should use `overflow-wrap:anywhere`.
- On discovery rails, **titles** clamp to 2–3 lines and **previews** to 2–3 lines; the complete content remains available through the destination or update-details panel.
- Fixed height should be avoided on user-generated text cards. Prefer `min-height`, flexible contents and bottom-aligned CTAs.
- At 320/375/430 CSS px, 200% text zoom, and a long translated title, no card should bleed into adjacent cards or make the viewport horizontally scroll unexpectedly.

## Coverage performed
Source-level inspection included the 68 app/component CSS modules surfaced by the GitHub branch comparison, plus `app/globals.css`. Audited contrast across Home/Manager, Account/Progress, Shop/Vendors, Guide/Ledger, Fun Zone, PodBound and Owner Studio. Corrected critical hardcoded light text on dynamic accent backgrounds in several modules, and migrated the shared section/card primitives to semantic tokens.

These checks **do not prove** every route has been visually inspected in both appearances; a stylesheet may style multiple routes, and the branch comparison listing is capped. The automated test `scripts/verify-theme-system.mjs` scans all CSS under `app` and `components` during CI and guards semantic theme roles and long-text contracts.

## Visual acceptance matrix — must pass before themes launch
Use a working deployment with approved tester/owner accounts and capture **both light and dark** at mobile (320, 375, 430px) and desktop (1280px):
- Home: hero, shortcuts, Spotlight, Recently Updated, widget edit, modals and long-text cards
- Manager/individual colonies: dashboard, Quick Care, QR scanning/printing, import, history, care states, archives
- Leaf Ledger: discovery grid, species profile, dashboards, collections, editor and search
- Shop: product cards/detail, Vendor Directory filters, long bios, application and Owner review
- Field Guide: article reader, chapters, search and Guide Desk
- Fun Zone: game tiles, puzzle screens, results, leaderboard
- PodBound: home, card gallery, card details and card editor
- Account: onboarding, sign-in, profile, achievements, settings, preferences/conflict dialog
- Owner Studio: landing, Guides, Species, Products, Spotlight, Updates, Vendors, Analytics
- Navigation and system: sticky/bottom navigation, loading/splash, empty states, overlays, notices

For each screen verify typography order, foreground/background contrast, selected states, tap targets, focus visibility, scroll/clipping, long text, reduced motion, and iPhone safe areas. Record visual defects by component and fix **shared components first**. Avoid claiming the theme program is complete until browser/device tests are done.

## Adding a future theme
Define semantic palette values for both light/dark variants and portal hero roles. Keep clear text-on-accent and muted-text contrast. Validate against this contract and the CI theme checks. Do not fork each page or add a collection of one-off hex overrides.

## Woodland — first alternate PodScape palette (November 2026)

Woodland is a warm dark appearance built around cocoa `#211A16`, chestnut `#30251F`, copper `#D6AC76`, and parchment `#F5E9D7`. It reuses the same semantic typography, cards, modals and navigation roles instead of introducing new layouts.

The four choices in **Account → Preferences → Appearance** are Light, Dark, Woodland and System. The quick appearance control cycles the three explicit palettes; System remains available in Settings. The chosen preference is stored in the existing `podscape-theme` key and restored during the initial document bootstrap to avoid flashing the wrong palette. Woodland uses `color-scheme: dark` for native input controls.

Important: `data-theme="woodland"` is its own explicit palette. Avoid CSS that assumes `not([data-theme="dark"])` necessarily means Light. The loading screen follows this rule and preserves the dark cocoa background. Future theme names should extend the shared semantic variables and bootstrap allowlist rather than adding one-off colors to every portal.

The palette and switch logic are guarded in `scripts/verify-theme-system.mjs`. Browser checks in all three palettes remain required before release. In particular, test Owner Studio, species cards, mobile bottom navigation, QR scanning, release-detail sheets, form selects and disabled buttons in Woodland as well as Light and Dark.


## Lilac — soft alternate palette (November 2026)

Lilac is a **light-mode** alternate, not a pastel overlay on Dark. The primary palette uses lavender canvas `#F4EFF9`, creamy orchid cards `#FFFAFF`, deep plum text `#33223E`, and purple action accents `#70418B`. Complementary orchid, mauve and dusty rose tones distinguish shortcuts and media placeholders without abandoning accessible primary text.

There are now five choices in Account Appearance: **Light, Dark, Woodland, Lilac, System**. The quick theme toggle cycles the four explicit palettes; System remains available in Account. The same `podscape-theme` key and bootstrap apply Lilac before first paint, using `color-scheme: light` for native form controls. The loading screen uses lavender/plum, not the Dark forest fallback.

Both legacy `canvas/paper/forest` and modern `background/surface/accent` tokens are defined. Theme-specific Home, Manager and Shop gradient exceptions use Lilac shades while retaining the card hierarchy. Owner Studio, member dashboards, bottom navigation, and dialogs inherit semantic roles.

As with Woodland, **browser validation in mobile/desktop, with real authenticated routes and adequate foreground contrast, remains required**. Automated checks cover the theme option, theme cycle, first-paint bootstrap, splash and major portal overrides.


## Ember — final alternate theme (November 2026)

Ember is a warm **light** theme: apricot `#FFF3E5`, creamy surfaces `#FFFAF3`, burnt-orange accent `#A64C21`, terracotta accents and espresso text `#3E281D`. It uses semantic role mappings for both legacy modules and v2 portals, with theme-specific overrides only where existing artwork and hero gradients need adapting.

The appearance lineup is now **FINAL / FEATURE-FROZEN**: Light, Dark, Woodland, Lilac, Ember, plus System (which follows device appearance). Do not introduce further themes or add ad hoc theme-specific colours to unrelated components. The selection persists in the existing `podscape-theme` setting, uses the same quick toggle, and is applied before first paint. Ember's native controls and splash screen use a light colour scheme.

The five explicit themes and System are a complete, maintained design system. Future effort goes to **accessibility, cohesion and consistency** across those existing palettes, not additional options.

As with Woodland and Lilac, real browser screenshots in authenticated mobile/desktop portals and focus/contrast checks are still needed. `scripts/verify-theme-system.mjs` now guards the final theme set and page-specific hero/loading coverage.
