# PodScape Theme Contract — architecture v1

**Goal:** A theme is an environment, not an accent swap. New appearances must work without editing page components.

## Ownership

- `lib/theme-registry.ts` is the only runtime registry for theme identity, display name, swatch preview, icon, order and native colour scheme. `system` is a preference that resolves to Light or Dark.
- `app/globals.css` contains theme colour definitions. Each theme now supplies legacy and portal roles in one root palette block. The shared `.v2-site` adapter maps all `--theme-*` portal roles without any theme-specific page declarations.
- Shared components should use roles, **never** ask which theme is selected. Do not create new `html[data-theme="..."]` branches in page CSS.
- `app/app/loading.module.css` takes splash colours from `--canvas`, `--ink`, `--muted` and `--forest`. The first-paint script, picker and toggle all use the registry.

## Required semantic roles

| Area | Roles |
| --- | --- |
| Canvas and surfaces | `--ps-bg`, `--ps-surface`, `--ps-surface-raised`, `--ps-surface-muted`, `--ps-border` |
| Content | `--ps-text`, `--ps-text-secondary` |
| Actions | `--ps-accent`, `--ps-accent-text`, `--ps-focus` |
| Portals | `--portal-hero-start`, `--portal-hero-end`, `--portal-hero-glow`, `--portal-hero-text`, `--portal-hero-muted`, `--portal-hero-button-bg`, `--portal-hero-button-text` |
| Typography and controls | `--ps-font-ui`, `--ps-font-display`, `--ps-radius-card`, `--ps-min-control` |

The legacy `--canvas`, `--paper`, `--paper-strong`, `--forest`, `--ink`, `--line` and portal `--surface` / `--background` aliases remain supported during migration.

## Adding a theme

1. Declare the identity and swatch in `THEMES` in the registry.
2. Define its palette once in a `:root[data-theme="new-name"]` block in `app/globals.css`, including legacy roles and `--theme-*` roles. Do not add a `.v2-site` palette override.
3. Run `pnpm check:theme-system`, `pnpm check:portal-colors` and `pnpm typecheck`, then build a preview and visually audit the screen matrix below. The theme system's source gate derives its registered theme list automatically.
4. A new theme should **never** require edits to Home, Ledger, Manager, Shop or any other individual page. If it does, migrate the component to semantic roles and add a regression test instead.

## Screen matrix (required before release)

Home, Leaf Ledger (discovery, profiles, collection), Manager (workspace, collection, bins, QR), Shop (product, vendors, checkout), Field Guide, Fun Zone, PodBound, Account, Owner Tools (all desks), onboarding, updates, dialogs, toasts, search, navigation and loading screens. Check phone and desktop, light/dark system preference, active/disabled/focus states and accessible contrast.

## Exceptions

Photo/artwork colours, species photographs, game card art, status semantics and printable QR code matrices may intentionally use fixed colours. Printed QR modules and paper must remain high-contrast black/dark on white. Document exceptions rather than globally recolouring them.

## Release truth

Source verification cannot prove pixel-level theme parity. Test a preview deployment and authenticated mobile flows before promoting. The existing fixed-colour CSS inventory is migration debt, **not evidence of complete compliance**. Home, Shop, and Manager no longer contain theme-specific page overrides, but remaining page modules still require visual inspection.
