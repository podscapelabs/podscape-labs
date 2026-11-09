# PodScape portal colour contract

**Source of truth:** `app/globals.css`, under `.v2-site` and `:root[data-theme="dark"] .v2-site`.

Use semantic colour roles, not page-specific green hex codes. The identity is deep forest, warm cream and restrained sage; dark mode stays dark, not neon.

| Role | CSS token | Purpose |
| --- | --- | --- |
| Portal hero start/end | `--portal-hero-start` / `--portal-hero-end` | Stable deep-green hero, even in dark mode |
| Portal halo | `--portal-hero-glow` | Subtle, optional decorative glow |
| Hero foreground | `--portal-hero-text` | Legible title and key text |
| Hero secondary text | `--portal-hero-muted` | Subtitles and descriptions |
| Hero soft highlight | `--portal-hero-soft` | Eyebrows and secondary accents |
| Hero action | `--portal-hero-button-bg` / `--portal-hero-button-text` | High-contrast cream CTA |
| Page controls | `--accent` / `--accent-contrast` | Active selections, focusable cards, buttons |
| UI surfaces | `--surface`, `--surface-secondary`, `--border` | Cards, tiles, dividers |
| UI copy | `--text-primary`, `--text-secondary` | Standard content outside heroes |

## Portal rules

- **Leaf Ledger:** The specimen photo and identity copy have separate areas. The text region uses only the shared hero colours. The three-colour moisture gradient is a deliberate **data visualization**, not a brand accent, and should retain its five distinguishable levels.
- **Fun Zone:** Keep its playful carousel and themed puzzle artwork, but primary green styling and hero colours come from shared tokens. Avoid `var(--forest)` for portal controls: it becomes a pale green in dark mode.
- **Community:** Hero gradient, hero copy, CTAs, accents and cards follow the same roles. Decorative motifs can vary without defining a second palette.
- **Other portals:** Reuse these tokens on the next targeted pass rather than copying hard-coded colours from another page.
- **Contrast:** Never assume `color: #fff` works on `var(--accent)`; use `var(--accent-contrast)`. Do not put dark text on the dark hero or place light hero copy on a light photo without a defined contrast surface.
- **Dark mode:** Both themes need to be reviewed in mobile and desktop viewport sizes. Changing one theme's `--forest` must not change branded hero backgrounds.

Use `pnpm check:portal-colors` to validate the main portal contract before deployment. This check catches structural drift; visual review still matters for contrast and composition.
