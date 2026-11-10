# PodScape unified release — mobile/PWA readiness audit

**Branch:** `codex/podscape-unified-release-20261109`. **Deployment:** not requested. **Supabase migration:** staged, NOT applied.

## Scope of source audit

Repository inventory: 61 app page routes, 64 CSS modules. Focused review of the shared mobile/PWA shell, navigation, press-and-hold customization, Home/Manager/Species dashboards, QR printing, account sync, Owner Analytics and guide/owner desk entry points. This is a **code/source audit**, NOT a claim that every page was tested in a running browser.

### Issues corrected this pass

1. **Cloud sync account scope:** cloud bootstrap, focus refresh, retry, and post-save comparisons now all read **the signed-in member's** Manager and Species preference keys. Without this, the sync bridge could incorrectly claim a match or prompt for conflicts based on defaults.
2. **Inline shortcut reset:** Home and Manager quick tool inline editors previously reset without asking; both now use the same confirmation as the primary toolbar.
3. **iOS widget editor safe area:** Home/Manager/Species shared editor now accommodates the dynamic viewport, home indicator and mobile scrolling.
4. **QR studio on small phones:** single-label inputs use minimum 16px font to avoid involuntary iOS Safari zoom. Bulk sheet previews allow touch scrolling without shrinking QR dimensions. Print labels are kept intact across page breaks.
5. **CI safeguards:** `scripts/verify-ui-preferences.mjs` checks every sync read is member-scoped. `scripts/verify-release-readiness.mjs` checks responsive/PWA and print contracts, confirmation behaviour and owner access. Both are wired into the pre-deploy workflow.

### Verified by CI

- ESLint and TypeScript
- Leaf Ledger, Fun Zone, achievements, Manager, icon and shared editor regressions
- Account-scoped Home/Manager/Species/navigation preference validation, RLS SQL source assertions
- Mobile/PWA source-level checks
- Next.js production build

## Release blockers / manual acceptance matrix

Do **not** treat this checklist as passed merely because CI is green.

| Device / flow | Manual acceptance |
|---|---|
| iPhone Safari + installed PWA | Open each portal; confirm bottom navigation isn't obscured by home indicator or browser chrome; test 320–430 CSS px and portrait/landscape |
| Home, Manager and Species | Press and hold; move blocks up/down; drag in both directions; reset with confirmation; check keyboard, touch, reduced-motion, dark/light |
| Shortcut editing | Long press, rearrange, replace, reset; verify no accidental navigation and both inline/standard reset prompts |
| Owner Tools and desks | Visit Guide, Product, Species, Spotlight, From the Lab, Platform Analytics; inspect tables/forms/overlays for overflow and safe actions |
| Bulk QR creator | Select multiple bins, print to Letter and A4, test compact/standard/large labels at 100% physical scale, scan from printed labels |
| Single QR creator | Check custom 2–10cm label size, download SVG, actual-size print and scan |
| Onboarding / empty states | Complete and skip tutorial; replay from Account; apply starter dashboards; ensure original layouts/achievements preserved |
| Account sync | Apply staged schema in coordinated release, verify RLS using distinct test accounts; validate first custom device, fresh device, simultaneous edit conflict, offline fallback, account switch |
| PWA setup | Install from Safari/Chrome; verify icon, app launch path, session and navigation. **No offline content support is asserted** |
| Accessibility | Tab navigation and focus trapping, VoiceOver labels, 200% text zoom, high contrast and light/dark themes |
| Production rollout | Check build and database migration; deploy only after explicit approval; confirm both production domains map to expected SHA; test with real member sessions |

**No production release, live database DDL, or physical iOS/print verification was performed during this audit.**
