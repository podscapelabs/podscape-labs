# PodScape responsive inspection checklist — 2026-11-09

## Status
**Code refinement committed, preview build and browser testing pending.** This document is an inspection plan, not a completed browser audit or a claim that every route passed.

Development source of truth: `codex/podscape-unified-release-20261109`. It includes the latest icon/navigation work and the legacy cleanup. Keep `main` unchanged until preview checks pass.

## Changes in this pass
- Account shortcut cards now expand their target settings accordion before moving focus to its summary. The path, owner authorization, Supabase profile queries and settings forms are unchanged.
- Account cards, account balance labels, dark/light styles, narrow-width typography and desktop layouts are more consistent.
- Owner Tools standalone page uses the same semantic icon set as the Account owner drawer, with a responsive 3/2/1-column design.
- Progress navigation and suggested destinations use canonical icons. The old Creative Network link was replaced by the existing Community route. EXP and achievement logic are unchanged.
- My Colonies background, cards and text use theme variables instead of fixed light-theme colors.
- Mobile bottom navigation editor and toolbar get compact viewport/safe-area adjustments. Existing slot persistence and editing logic are unchanged.

## Browser matrix
Test at minimum: 320px, 375px, 390px, 430px, 768px, 1024px and 1440px viewport widths. At each width check light/dark, focus-visible, iOS Safari/PWA bottom safe area, reduced motion, overflow and keyboard access.

| Area | Routes and critical checks |
|---|---|
| Public entry & access | `/`, `/early-access`, `/account/login`, `/account/sign-up`, `/auth/callback`: invitations, redirects, account errors |
| Member Account | `/account`, `/account/progress`, `/account/change-password`, `/account/forgot-password`, `/account/reset-password`: panels, buttons, progress, secure profile updates |
| Owner access | `/account/owner-tools`, `/admin`, `/admin/early-access`, `/admin/reset-password`: protected entry, owner visibility, logout |
| Content desks | `/admin/species`, `/admin/products`, `/admin/products/[id]`, `/admin/guides`, `/admin/lab`, `/admin/spotlight`, `/admin/podbound`, `/admin/podbound/[id]`: unsaved guards, input validation, persistent edits, icon consistency |
| Navigation & Home | `/app`, `/menu`, `/search`, `/explore`: 5 slots, jiggle, drag/move, reset, pin/unpin, correct active links |
| Leaf Ledger | `/ledger`, `/ledger/[slug]`, `/ledger/my-collection`: metadata, photos, data density, favorites/collection, search and taxonomy |
| Manager | `/keeper`, `/keeper/collection`, `/keeper/new`, `/keeper/[id]`, `/keeper/[id]/details`, `/keeper/[id]/history`, `/keeper/activity`, `/keeper/schedule`, `/keeper/qr`, `/keeper/scan`: QR quick care, bulk care, timestamps, undo, bin changes |
| Shop & vendors | `/shop`, `/shop/[slug]`: search, filters, images, catalogue links, checkout-unavailable messaging |
| Guides & studio | `/field-guide`, `/field-guide/[slug]`, `/from-the-lab`, `/from-the-lab/[slug]`, `/community`: sections, filters, responsive reading |
| Fun Zone | `/fun-zone`, `/fun-zone/[game]`, `/fun-zone/[game]/[puzzle]`, `/fun-zone/word-search`, `/fun-zone/word-search/[puzzle]`, `/fun-zone/word-search/genus-explorer`, `/fun-zone/leaderboard`: game interaction, completed state, EXP once |
| PodBound | `/podbound`, `/podbound/cards`, `/podbound/cards/[id]`: artwork, card metadata, storefront separation |
| Compatibility | `/poddex`, `/poddex/species`, `/poddex/species/[slug]`: deliberate redirects, old inbound links, no 404 |

## Release gates
- [ ] Vercel preview build exists on the exact unified branch commit.
- [ ] Build, typecheck and lint pass.
- [ ] No runtime errors or missing variables in preview logs.
- [ ] Account Quick Links reveal the exact section and return focus accessibly; progress balances and owner cards render.
- [ ] Keyboard, small phone, tablet and desktop layouts have no unusable horizontal overflow.
- [ ] Visual verification in light and dark modes.
- [ ] Confirm user collections, widgets, settings, owner desks, achievements, shop inventory, QR events and access restrictions are unchanged.
- [ ] Verify existing deep links and external navigation.
- [ ] Explicitly review preview before production promotion.

## Known review debt
- `/explore` retains an earlier platform-map layout; it may remain as a utility index or be consolidated only after inbound-link review.
- PodDex redirects are intentional compatibility surfaces; do not remove without checking links.
- Dynamic content and private owner flows cannot be verified solely from source and need authenticated preview sessions.
- Source-level modifications to selected routes are not a substitute for visiting all pages.
