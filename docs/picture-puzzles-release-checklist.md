# Picture Puzzles + Species Detective + Feedback release checklist

Branch: `codex/podbound-picture-puzzle-desk-20261112`

## Pre-release checks (no production changes)

- [ ] Wait until the Vercel daily build quota permits an exact-commit preview build; do not treat quota failures as code validation.
- [ ] Run `pnpm typecheck`, `pnpm run build`, and `pnpm test:fun-zone` on the final commit.
- [ ] Inspect build logs for **errors** rather than treating warnings as failures.
- [ ] Verify owner access to `/admin/puzzle-desk` and that public members cannot open it.
- [ ] Create a draft with an uploaded JPEG/PNG/WebP, set mode, difficulty, Fun Zone level, alt text, and learning cue. Edit draft, preview, publish, and unpublish.
- [ ] Test Jigsaw 3x3, 4x4, 5x5 on Safari/iOS and desktop: drag, snap, keyboard movement, blank board with no answer outlines, optional artwork reference, reshuffle, refresh, completion, interrupted touch drags, keyboard support, and snapped-piece feedback.
- [ ] Test Sliding Puzzle 3x3, 4x4, 5x5: each shuffle is solvable; only adjacent tiles move; resume from storage; complete with verified move history.
- [ ] Test with two member accounts on one device: local puzzle states must not leak between users.
- [ ] Test Species Detective: a wrong answer leads to a score review and Try Again; no completion, EXP, or next unlock. All-correct attempts save and unlock next.
- [ ] Test one-time EXP and achievement toast: first Jigsaw +20, first Sliding +20, fifth Picture Puzzle +45, no duplicate awards on replay.
- [ ] Confirm original eight-game and 32-puzzle milestones still only count the legacy games.
- [ ] Test the floating feedback tab on Android Chrome/Samsung Internet, iOS Safari/PWA, and desktop. Verify it clears the bottom nav and closes with Escape, overlay click, and Close.
- [ ] Send feedback as an approved verified account. Check Bug/Idea/General, page path, device details, sent confirmation, and the five-per-hour rate limit. Confirm guests and unapproved accounts cannot submit.
- [ ] Verify Feedback Desk requires owner access, shows member display names and report details, filters by status/type, and saves New/Reviewing/Resolved without exposing the table through RLS.

## Database status (verified November 12, 2026)

The following migrations were **already successfully applied** to Supabase project `qptvfwmxmhmhdmfyuzbb`. Do not reapply them as part of this next frontend-only release:

1. `supabase/migrations/20261112000000_picture_puzzles.sql` — RLS-protected picture-puzzles table and artwork bucket
2. `supabase/migrations/20261112001000_picture_puzzle_modes.sql` — mode, level, image descriptions, learning cue
3. `supabase/migrations/20261112002000_picture_puzzle_rewards.sql` — update existing one-time award function, jigsaw/sliding achievements, revoke direct client EXECUTE
4. `supabase/migrations/20261112003000_member_feedback.sql` — feedback table, account ownership, private service-role access, categories and owner review statuses

Previously verified: puzzle and feedback tables, mode columns, artwork bucket, RLS, and service-role-only completion RPC. Recheck only if an actual schema change is introduced. Preserve all member data.

## Release sequence

1. Build and inspect a preview of the exact final commit.
2. Test the flows above (including mobile jigsaw touch controls) against a disposable test account.
3. Test owner-only unsaved preview: change artwork/format/difficulty, open and close repeatedly, verify draft fields survive and no preview localStorage records or EXP events are created.
4. Verify deliberate Publish/Unpublish confirmation, draft privacy, and status-changing server checks.
5. Check both owner desks in **Light, Dark, Woodland, Ember, and Lilac**, on desktop and iPhone PWA; verify form surfaces, borders, action buttons, accessibility, and bottom nav clearance.
6. Stage the production-target build on Vercel project **`podscape-labs-preview`** (`prj_7RyjnPePjJVBONXLcRe9D4wbUMa0`), which owns **www.podscapelabs.com**. The separately named `podscape-labs` project does not serve the custom domain.
7. Confirm the custom domain resolves to the exact release commit and manually verify puzzle upload → draft preview → publish → player completion → EXP and achievement once, and Species Detective retry.

## Original artist credit prerequisite

- [ ] Apply `supabase/migrations/20261112004000_picture_puzzle_artist_credit.sql` to Supabase project `qptvfwmxmhmhdmfyuzbb` **before deploying code that queries `artist_credit`**. Previous puzzle migrations are already applied; this new migration is pending.
- [ ] Confirm artwork credit is required for new drafts and for publishing existing uncredited drafts.
- [ ] Verify artist attribution appears on the owner preview, public picture-puzzle library card, and both jigsaw/sliding gameplay pages in each theme.
- [ ] Record the original artist accurately (for example, Ola for the artwork she created). Artist credit does not replace a licence or the artist’s permission to use community-submitted artwork.

## Remaining release-blocking QA

- [ ] Confirm `pnpm run build` succeeds on the newest branch commit (daily quota prevented this at time of editing).
- [ ] Test all three difficulty levels for both game modes on an actual iPhone, including cancelling a drag mid-gesture and resuming after reload.
- [ ] Verify draft puzzles are not shown or playable to members before publication.
- [ ] Verify a completed puzzle awards EXP/achievements once only, including page refresh and replay.
- [ ] Confirm preview completion never writes localStorage or calls the completion endpoint.
- [ ] Verify Feedback Desk filtering, editing, and mobile theme surfaces across five themes.

## Known limits

- Picture-puzzle board positions are saved **on the current device**, per account; canonical completion/EXP is saved in Supabase.
- Picture puzzle completion requests have client-produced proofs, like other browser games. Sliding proofs replay every legal move server-side, while jigsaw proof validates piece IDs/move totals rather than recording authoritative server-side placement events. For competition-grade anti-cheat, add server-issued attempts/challenges before enabling high-stakes rewards.
- Existing incorrect quiz completions recorded **before** the perfect-score change are not automatically deleted. New completions require all answers correct.
