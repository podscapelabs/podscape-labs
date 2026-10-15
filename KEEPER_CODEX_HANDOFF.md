# PodScape Keeper — Codex integration handoff

Branch: `feature/keeper-qr-quick-care`  
Base: `codex/platform-rebuild-v2`  
PR: https://github.com/podscapelabs/podscape-labs/pull/15

## Implemented pages and UI
- `/ledger/my-collection`: existing Ledger collection plus grouped, searchable Keeper bin manager.
- `/keeper`: per-enclosure list, create flow, scan and care-schedule navigation.
- `/keeper/[id]`: existing private colony details, QR label tools, interval editor and full activity controls.
- `/keeper/[id]/history`: dated event history (currently limited by `getEnclosure()` to latest 30 events).
- `/keeper/scan`: camera QR detection when browser supports BarcodeDetector, direct `?bin=<id>` links, manual bin selection, quick events, dated custom notes, scan-next.
- `/keeper/schedule`: cross-bin browser-local misting schedule with no fabricated health status.

## Before any deploy
1. **Install and lock dependencies:** `qrcode` and `@types/qrcode` were added to `package.json`. Run `pnpm install` and COMMIT the updated `pnpm-lock.yaml` on this branch; do not deploy with a stale frozen lockfile.
2. Run `pnpm typecheck`, `pnpm lint`, and `pnpm build`. Fix any type, ESLint, package, or Next.js errors.
3. Confirm the customer Supabase project (NOT PodBound) has `keeper_enclosures` and `keeper_events` migrations applied before testing writes. Do not rerun old data migrations destructively.
4. Test a signed-in user with multiple colonies of one species, an account with none, archived bins, and authorization boundaries.
5. Test QR labels using the local `qrcode` package. Scan them with iOS Camera and Android Camera into `/keeper/scan?bin=<id>`, then test saving, fast next scan and care history. Built-in scanner depends on BarcodeDetector support and may be absent in iOS browsers; native phone Camera + deep link is the reliable fallback.
6. Inspect mobile and desktop layouts, dark theme, and navigation. Keep PodScape's botanical premium identity; no generated art assets.
7. Deploy to a protected **preview** only after verification. Preserve podscapelabs.com's existing maintenance experience until founder approves release.

## Outstanding system integrations
- Care reminder dates and frequencies are stored **only in localStorage per device**. Build an owner-scoped persistence table with RLS, and derive next dates from synced care events. They are not push notifications.
- A QR scan of an enclosure URL should require authentication; no private data can leak to unauthenticated users. QR links are locators, not credentials.
- Add full event history pagination and optionally an undo/edit model with auditability, not silent deletion.
- If BarcodeDetector unsupported, favor platform Camera app deep-links or integrate a well-tested QR decoder with user consent.
- Add a UI for common per-event details (food types, substrate changes, health observations) only when grounded by user workflows; avoid cluttering Quick Care.
- Review `keeper_colonies` versus `keeper_enclosures` legacy migration overlap; don't delete or overwrite member records.
- Audit the `on conflict` behavior for older migration variants and the branch's `vercel.json` deploy suppression rule.

## Deployment gating
`vercel.json` contains `git.deploymentEnabled["feature/keeper-qr-quick-care"]=false` to avoid auto-preview deployments per commit. Do not change it without deciding a controlled release strategy.
No direct production changes were intended during this build pass.
