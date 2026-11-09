# PodScape Legacy Page Audit — 2026-11-09

## Scope and baseline
- Reference: `codex/unified-home-manager-customization` (not `main`, which is substantially older).
- Working branch: `codex/legacy-page-audit-20261109`.
- No separately named `icon pass` branch was visible through the connected GitHub branch search at audit time.
- This is a **source-level review** of key application routes and shared UI files, **not** a claim that every route has been visually or functionally tested.
- Policy: preserve public routes, authenticated records, database schemas, owner permissions, checkout status, QR care workflows, and customizable layouts; no destructive removals until routing and link usage are verified.

## Confirmed inconsistencies and changes made
| Surface | Finding | Action | Status |
| --- | --- | --- | --- |
| `/field-guide` | Topic tiles and guide cards used botanical Unicode marks. | Use `PodscapeLineIcon` for recognizable semantic marks, standardize icon geometry, remove decorative pseudo-element glyphs. | Implemented |
| `/shop` | Discovery cards, category tiles, hero motif and search used divergent text symbols. | Convert navigation/category/search/hero icon surfaces to shared line icons; preserve catalogue forms and filtering. | Implemented |
| `/account` | Account section links, settings and owner-desk links used mismatched symbols. | Use shared icon component, add semantic icon metadata to owner-desk definitions, normalize sizing. | Implemented |
| `/community` | Illustrative orbital icons and editorial headline/section pattern remain. | Review hero density and decorative semantics; retain page for now. | Follow-up |
| `/menu` | Uses a standalone Header and an older marketing container instead of a common portal wrapper. | Review against the unified navigation/shell before altering; preserve pinned items. | Follow-up |
| `/podbound` | Uses standalone Header and a specialized landing-page structure. | Confirm branded variant is intentional; keep shared login/cart/navigation consistent. | Follow-up |
| `/keeper` | New ManagerWorkspace lives alongside older components, QR scanner screens and supplemental routes. | Check which screens remain legacy; preserve event writes, timestamps, undo and saved bin settings. | Follow-up |
| `/ledger` and `/ledger/[slug]` | Newer profile and discovery treatments coexist with older edit/admin workflows. | Run read-only usability review; do not mutate species data. | Follow-up |
| `/fun-zone` | Shared header exists; game-specific screens may still have independent icon/navigation styles. | Audit every game route and completion state, preserve EXP awards. | Follow-up |
| `/admin/*` | Content desks have specialized editor workflows. | Standardize shared field, section, confirmation, save and status components incrementally. | Follow-up |
| `/early-access` | Access gating is security-sensitive. | Review visual consistency only; do not change allowlist enforcement or redirect logic without tests. | Follow-up |

## Definition of done for a route
1. Portal-specific hero or purposeful branded treatment; no redundant global title or sticky header.
2. Navigation and shortcut icons use the approved semantic shared icon system; decorative illustrations are not used as functional icons.
3. Reuse component styling tokens, typography, responsive spacing, accessible focus states and light/dark themes.
4. Search stays inside the relevant portal where appropriate; no unnecessary global detours.
5. Existing customization uses the unified press-and-hold/edit/rearrange convention; user's layout persists.
6. All links, owner permissions, form validation, read/write operations, success/error states and QR actions continue working.
7. Mobile touch, scroll, keyboard and reduced-motion behavior checked.
8. Successful production deployment **only after** review, build/typecheck and functional testing.

## Remaining validation required
- GitHub branch head and PR comparison against the actual latest icon-pass work, if it was created in another environment or an unpushed workspace.
- Run `pnpm typecheck`, `pnpm lint`, `pnpm build` in an environment with the project and dependencies.
- Exercise Shop category query, Guide topic links, Account owner permissions, Manager quick care and Fun Zone games on preview.
- Confirm icon mappings are approved visually before broad propagation.
- Route inventory from the full repository tree and screen-by-screen visual review is still required before calling this an *entire site* audit complete.

## Design rule
Preserve functionality and content. Replace inconsistent visual affordances rather than automatically removing routes or entire pages. Old does not necessarily mean obsolete.
