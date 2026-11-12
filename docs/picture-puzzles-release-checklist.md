# Picture Puzzles + Species Detective release checklist

Branch: `codex/podbound-picture-puzzle-desk-20261112`

## Pre-release checks (no production changes)

- [ ] Wait until Vercel Hobby build quota resets; current branch CI checks are failing due to build-rate-limit, not because the latest commit was compiled.
- [ ] Run `pnpm typecheck`, `pnpm run build`, and `pnpm test:fun-zone` on the final commit.
- [ ] Inspect build logs for **errors** rather than treating warnings as failures.
- [ ] Verify owner access to `/admin/puzzle-desk` and that public members cannot open it.
- [ ] Create a draft with an uploaded JPEG/PNG/WebP, set mode, difficulty, Fun Zone level, alt text, and learning cue. Edit draft, preview, publish, and unpublish.
- [ ] Test Jigsaw 3x3, 4x4, 5x5 on Safari/iOS and desktop: drag, snap, keyboard movement, guide, artwork reference, reshuffle, refresh, completion, undo/unavailable support.
- [ ] Test Sliding Puzzle 3x3, 4x4, 5x5: each shuffle is solvable; only adjacent tiles move; resume from storage; complete with verified move history.
- [ ] Test with two member accounts on one device: local puzzle states must not leak between users.
- [ ] Test Species Detective: a wrong answer leads to a score review and Try Again; no completion, EXP, or next unlock. All-correct attempts save and unlock next.
- [ ] Test one-time EXP and achievement toast: first Jigsaw +20, first Sliding +20, fifth Picture Puzzle +45, no duplicate awards on replay.
- [ ] Confirm original eight-game and 32-puzzle milestones still only count the legacy games.

## Database release prerequisites

The current production database does **not** yet have the `picture_puzzles` table. Apply the following reviewed migrations **in order**, after a successful build is available and before production promotion:

1. `supabase/migrations/20261112000000_picture_puzzles.sql` — RLS-protected picture-puzzles table and artwork bucket
2. `supabase/migrations/20261112001000_picture_puzzle_modes.sql` — mode, level, image descriptions, learning cue
3. `supabase/migrations/20261112002000_picture_puzzle_rewards.sql` — update existing one-time award function, jigsaw/sliding achievements, revoke direct client EXECUTE

After applying, verify that the table/columns/bucket exist, service-role read/write succeeds, and the completion RPC remains service-role only. Preserve production member data. **Do not** apply migrations to production just to run a static audit.

## Release sequence

1. Build and inspect a preview of the exact final commit.
2. Test the flows above (including mobile jigsaw touch controls) against a disposable test account.
3. Apply the migrations to the intended Supabase project in order and verify schema and permissions.
4. Stage a production build for the live `podscape-labs` Vercel project and promote the verified release.
5. Check new errors, published picture-puzzle listing, owner desk, EXP awards, and Species Detective retry on the live domain.

## Known limits

- Picture-puzzle board positions are saved **on the current device**, per account; canonical completion/EXP is saved in Supabase.
- Picture puzzle completion requests have client-produced proofs, like other browser games. Sliding proofs replay every legal move server-side, while jigsaw proof validates piece IDs/move totals rather than recording authoritative server-side placement events. For competition-grade anti-cheat, add server-issued attempts/challenges before enabling high-stakes rewards.
- Existing incorrect quiz completions recorded **before** the perfect-score change are not automatically deleted. New completions require all answers correct.
