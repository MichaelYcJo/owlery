# Phase 4: 1795559736-caps-on-worktrees-and-agents

## What this phase found

The frame held. Before building, the crafter checked the paths phase 4 builds on: `view.ts#stageOf` and `#recentKept`, the call of `stageOf` in `work-item-view.ts#showView`, `work-item-view.ts#stageShows`, and the stage's rules in `renderer/index.html`. At the phase's base, `git grep -n 'STAGE_PANES' -- apps` printed the seven lines of `view.ts` that `frame/design.md` *Grounding* states: the constant, and the lines of `stageOf` and of the comments around it and around `recentKept` that name it. The stage's rules laid out two to four tiles, as *Grounding* states.

**The cap reaches `stageOf` as its fourth argument, from `view.ts#paneCap`.** `paneCap` gives the cap a person set on panes side by side, the proposal where none is set, and 4 where the daemon keeps no cap. The 4 is `PANES_WITHOUT_CAP` in `shared/machine.ts`, beside `PANES_MOST`. `STAGE_PANES` is removed, with every line that named it. `work-item-view.ts#showView` reads the cap from the machine the window holds at each draw. Phase 2 has the window draw the view again when a `machine` message comes, so a cap a person changes lays the stage out at once. The built-app case shows this: it sets the cap to 6, then 5, then 2, with the view open. A cap of 1 shows the pane in front alone, as where "Side by side" is not pressed. Judged against `frame/design.md` *Scope* item 12, *Removes* row 1 and scenario 10.

**The layout is `view.ts#stageGrid`, and each tile is placed in the grid.** `stageGrid` gives the number of columns and, for each tile, its row, its column and how many columns it spans. That is two columns for 2 to 4 tiles, three for 5 to 9 and four for 10 to 16, row by row, the last tile spanning what is left of its row. `work-item-view.ts#stageShows` sets the stage's `data-columns` and each tile's `data-row`, `data-column` and grid area. The grid area is needed because the pool's order of screens is not the tabs' order. The rules of `index.html` that gave tiles 1 to 4 their order are removed, and so is the rule that let the third of three span both columns. Judged against `frame/design.md` *Scope* item 12 and scenario 14.

**Each tile draws the rule at its left and the one above it.** The stage drew two rules at its middle, which fit two columns alone. Now a tile outside the first column draws a vertical rule in the middle of the margin at its left. A tile outside the first row draws a horizontal rule in the middle of the margin above it. Two and four tiles draw the rules they drew before. Three tiles draw no vertical rule beside the third, which spans both columns, as before. No case reads where a rule is drawn (`gaps.md`). Judged against `frame/design.md` *Scope* item 12.

**The title of "Side by side" names the cap.** It said "Show up to four of this work item's panes at once". It now says "Show up to 6 of this work item's panes at once" for a cap of 6, and "Show one of this work item's panes at a time" for a cap of 1. `view.ts#sideBySideTitle` holds it, `view.test.ts` pins it, and the built-app case reads it at each cap. The page's own title, before the first draw, names 4. Judged against contract rule 14.

**The cases that pinned four.** *Removes* row 2 names the three cases of `stageOf` whose names said "up to four" and "the first four panes". Each case of `stageOf` now gives the cap, 4, and those names say "the cap, here four". The call in a case of `recentKept` gives it too. Their assertions are unchanged. Judged against `frame/design.md` *Removes* row 2.

**Scenario 15's search prints nothing.** `git grep -n 'STAGE_PANES' -- apps` exited 1 with no line at `cc1051d`, the phase's build. The two lines of `docs/` that name the constant are the settle's to rewrite, by the first pair of *Rule changes*. This phase does not touch them.

**The reds.** Before the build, the new cases ran against the tree.

- In `view.test.ts`, the case of `stageOf` with a cap of 6 and of 2 was red by its assertion: the tree showed four panes. The cases of `stageGrid`, of `paneCap` and of the title were red because those functions did not exist. The five changed cases of `stageOf` passed, since the tree ignored the cap and the cap they give is 4.
- The built-app case of `machine-dialog.test.ts` was red by its wait for six tiles.

Two lines were added after the build, before the mutation pass, and committed in `faacb8a`. In the case of `stageOf`, a closed pane in front under a cap of 2 shows the second place the cap is read, which a cap of 4 cannot. In the built-app case, a cap of 5 shows the last tile spanning two columns. Without it a tile's grid area showed nowhere, since six tiles fill three columns in any order.

**The mutation runs.** Each mutant ran alone through `seal mutate`, with the verbose reporter, over the cases of its unit. All 12 went red.

| Unit | Mutants | Red |
|---|---|---|
| `renderer/view.ts#paneCap`, `#sideBySideTitle`, `#stageGrid` and `#stageOf`, under the cases of those functions and of `recentKept` in `view.test.ts` | 8 | 8 |
| `renderer/work-item-view.ts#showView` and `#stageShows`, under the built-app case of scenario 14 | 4 | 4 |

The mutants of `view.ts` were: 16 where the daemon keeps no cap; the proposal over a cap a person set; no title of its own for a cap of 1; two columns for five tiles; three columns stopping at eight; no tile spanning; a stage of four; and four as the reach of a closed pane in front. The mutants of `work-item-view.ts` were: four in place of the cap; a title that does not follow the cap; no grid area; and no columns on the stage. The rules between the tiles had no mutant, since no case reads them.

**Each new case went red under at least one mutant.** The 5 new cases are 4 of `view.test.ts` and 1 of `machine-dialog.test.ts`. The crafter's scratch holds each mutant's run and the cases it turned red.

**The *Phase boundary* set was the 39 test files of the phases before, in one command, and passed at `faacb8a`: 37 files and 1,681 cases, with 2 files and 6 cases skipped.** The 1,681 are phase 3's 1,676 and the 5 new cases. The files the plan row names are among them. So are every test file that imports `renderer/view.ts` or `shared/machine.ts`, and the built-app files, which start the app built from the changed renderer. `terminal-basics.test.ts`, whose cases press "Side by side" with two panes, is among them.
