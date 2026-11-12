# Fun Zone EXP balance review — November 12, 2026

This is a non-destructive audit of PodScape's current progression economy, prepared alongside the picture-puzzle completion redesign. **No member EXP balances or historical reward events were changed.**

## Current data (aggregate only)

Production `member_progress` has 8 members with progress: median 372 EXP, mean 787 EXP, highest 2,696 EXP. No account-identifying data is included here.

| Reward source | Events | Total awarded EXP | Largest single award |
|---|---:|---:|---:|
| Achievements | 66 | 2,315 | 125 |
| Ranking rewards | 9 | 2,278 | 750 |
| Personalization | 24 | 880 | 100 |
| Fun Zone | 19 | 820 | 200 |

The current level formula is `floor(sqrt(total_exp / 100)) + 1`. Level 10 begins at 8,100 lifetime EXP; Level 50 at 240,100. Lifetime EXP and earned achievements should stay immutable when introducing more games.

## Picture-puzzle release rewards

Nine new jigsaw/sliding achievements collectively total **590 EXP**, earned only once after verified completions. The pre-existing first-jigsaw (20), first-sliding (20), and five-picture-puzzle (45) milestones add up to 85 EXP. Combined, that is up to 675 EXP for all twelve picture puzzles from picture-specific achievements, plus any general Fun Zone milestones that become newly unlocked.

These achievements pay for distinct milestones, not every replay; a replay receives no new reward. The current rewards do not justify changing existing player EXP balances.

## Balance concern to monitor

Ranking rewards currently have the greatest concentration of EXP: recorded all-time cross-game placements awarded **750**, **450**, and **250** EXP for first/second/third. A single 750-EXP award exceeds all nine new picture milestones combined. Before adding many more games, audit whether ranking bonuses can repeat across weekly periods or many game categories and whether those benefits are disproportionate to the time spent completing challenges.

## Suggested durable economy rules

1. Preserve lifetime EXP, unlocked achievements and transaction histories. Do **not** silently subtract or rewrite past awards. Any future corrections need an auditable, clearly justified event.
2. Reward distinct first-time completions and milestone progression; replaying puzzles for fun should not mint the same EXP repeatedly.
3. Scale new game achievement sets by expected player effort and difficulty, not merely by the number of levels added. Favor one-time mastery milestones over payouts per shuffle or tap.
4. Do not rebalance based only on eight member accounts. Reassess with larger beta cohorts after the initial twelve puzzles are playable; look at weekly EXP gained, median progress, ranking share and time-to-level.
5. Keep the source of truth for achievement EXP aligned between `data/achievement-catalog.ts` and the database completion-award function. Never change one without the other.
6. Display the **actual EXP returned by the completion endpoint** on the celebration card. Once earned, a replay should show no new EXP and must not imply the same reward was granted again.
7. When expanding arcade content, plan for a sustainable completion budget, monitor accumulation by source, and resist the urge to recalibrate users retroactively.

## Release checks

- [ ] Two Easy/Medium/Hard puzzles per mode are independently tracked.
- [ ] Learning cue and artist credit are shown only after completion and not before play.
- [ ] Jigsaw tray disappears on success; sliding board and redundant reference disappear on success.
- [ ] Reward text shows server-confirmed EXP, not a fixed preview number.
- [ ] Replays do not create duplicate progress events, rewards or misleading visual payouts.
- [ ] iPhone PWA has no accidental dead space, overlapping bottom nav or unusable scroll.
- [ ] Run a successful production-compatible build and manually QA before deploying.

**Decision:** Keep current picture-puzzle EXP awards and member balances unchanged for now. Prioritize ranking payout review and larger-cohort monitoring before introducing more game families.
