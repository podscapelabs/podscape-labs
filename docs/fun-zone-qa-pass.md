# Fun Zone: practice-game refinement pass

Scope: current eight playable practice games; no EXP, coins, streaks or server-side completion claims added.

## Changes
- Word Burrow: corrected the grammatical error MOSSY (adjective, not a place) and replaced the static answer with three accurately clued terms (HUMUS, COVER, FUNGI). Repeated-letter scoring respects letter multiplicity, a visible clue keyboard updates after each guess, and a completed round can be replayed or advanced.
- Colony Connections: each restart reshuffles the same sixteen terms. Four mistaken submissions end the round, reveal remaining categories and allow a new attempt.
- Crossword Colony: displays conflicting intersection letters instead of silently overwriting them; clear checking and reset remain available.
- Species Detective, Keeper's Challenge, Word of the Week, Species Quiz: expanded question sets and added a review of missed questions at the end. Explanations are phrased as general knowledge, not guarantees for every taxon or enclosure.
- Genus Explorer: adds selection feedback, a reset that clears hints, and an optional starting-letter hint.
- Fun Zone cards: consume the shared game catalogue instead of independently duplicating metadata.

## Static checks completed (source/data only)
- [x] All five crossword answer paths fit inside the 7 × 6 board and agree at crossings.
- [x] Four Connections groups each have four terms; no duplicated term.
- [x] Deterministic word-search placement places all eight genera within a 16 × 16 board and spells each correctly.
- [x] Word Burrow rounds contain three five-letter uppercase answers.
- [x] Question bank contains 23 questions across the four quiz games (6 + 6 + 5 + 6).
- [x] None of these changes modify species records, collections, user accounts or reward balances.

## Release QA still required
- [ ] Successful Next.js production build for the final commit (an earlier preview is not proof of the final branch).
- [ ] iPhone PWA + mobile Safari: Word Search tap-tap, drag, touch end outside grid, hint/reset.
- [ ] Word Burrow: repeated letters and answer lock after six guesses; moving between the three rounds.
- [ ] Connections: four mistakes end play, solved groups disappear from grid, rescramble starts a new round.
- [ ] Crossword: conflicting letters highlighted and removed when corrected; all five correct produce completion.
- [ ] Quizzes: disable options after answer, explanation and progression, end-of-round review and restart.
- [ ] Keyboard navigation, visible focus, dark/light theme, and reduced-motion preferences.
- [ ] Approved tester access; owner-only tools remain inaccessible to testers.

All current puzzles remain practice mode and do not award EXP or save results.
