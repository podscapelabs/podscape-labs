# Fun Zone — 32 puzzle release verification

Branch: `codex/ledger-navigation-optimization`

## Scope
- Eight games, four curated puzzles per game (original + three new), 32 total.
- Each game has an independent progression path: only the first puzzle is open initially, subsequent puzzles unlock one at a time after recorded completion.
- Game library and Fun Zone portal show saved completion counts; My Progress includes total puzzles completed.
- Replays do not grant EXP again. Milestone rewards remain one-time.
- Five milestone achievements: first puzzle (10 EXP), five (30), sixteen (80), one in each of eight games (125), and all 32 (200).
- Achievement notifications appear only after successful server-side award response.
- An owner-only notification test button in Owner Tools emits a simulated banner without storing an achievement or granting EXP.

## Verified automatically
The `PodScape pre-deployment QA` GitHub workflow on this branch runs `pnpm run lint`, `pnpm run typecheck`, `node scripts/verify-ledger.mjs`, `pnpm run test:fun-zone`, and `pnpm run build`.

The Fun Zone regression test checks:
- Exactly 32 distinct puzzle entries across eight categories, in the intended order.
- Distinct correct answers with explanatory feedback for quiz content.
- Valid, bounded, mutually consistent crossword crossings.
- Four disjoint groups of four for Connections.
- All eight words in each seeded search board have valid locations.
- Repeated-letter Word Burrow evaluation.
- Presence of per-user single-award DB keys and previous-puzzle gate.
- Server-side completion validation and achievement event wiring.

## Release blockers before going live
1. Apply `supabase/migrations/20261109190000_fun_zone_puzzle_achievements.sql` **as part of the same production release**; if the migration is absent, saved progress and sequential unlocks cannot function.
2. Smoke-test an **approved, email-verified tester** through all eight first puzzles and the newly unlocked second puzzle. Confirm direct links to locked puzzles redirect.
3. Complete one puzzle for a fresh test account: confirm `member_puzzle_completions`, a single `member_achievements` row, an EXP-only `member_progress_events` event, and an achievement banner. Replay and refresh to confirm no second reward.
4. Press the owner-only Test Achievement Notification button and inspect light/dark, desktop/iPhone, modal overlap, reduced motion, and queue sequencing.
5. Test Word Search tap-tap and drag on installed iPhone PWA; confirm global swipe-to-go-back does not interrupt selection.
6. Confirm quiz wrong-answer reviews, Crossword crossing conflicts, Connections mistake limit, Burrow duplicate letters, and saved completion retry.
7. Confirm existing Ledger, Guide and Shop approved-tester access remains intact; unauthorized visitors still see maintenance and never enter Owner Tools.

This pass includes static and CI checks, not authenticated end-to-end device tests; do not claim such tests passed without running them.
