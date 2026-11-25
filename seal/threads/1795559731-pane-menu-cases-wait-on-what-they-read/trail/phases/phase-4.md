# Phase 4: 1795559731-pane-menu-cases-wait-on-what-they-read

## What this phase found

**Scenario 7 was red at the phase's start.** With the replay-delay patch applied by `git apply` and `OWLERY_TMP_REPLAY_DELAY=1500`, the whole file at `f521b5c2` failed three cases, 22 passed. Line 536 got the path without brackets, line 554 got nothing, and line 907 got nothing for the first key, `ArrowLeft with the Command key: expected '' to be '01'`. These are the three lines `frame/design.md` scenario 7 names. The command was `OWLERY_BACKGROUND=1 OWLERY_TMP_REPLAY_DELAY=1500 node scripts/test-in-electron.mjs test/terminal-basics.test.ts` from `apps/desktop`. Executed.

**No delay showed the Shift+Enter case red.** `frame/plan.md` phase 4 asks for a delay from 500 ms down at which the Shift+Enter case fails at the phase's start. The whole file ran once at each of 500, 400, 300, 250, 200, 150 and 100 ms, with the same command. The Shift+Enter case passed at every one. Executed. What failed at each:

| Delay | Cases that failed |
|---|---|
| 500 ms | the two-drop case and the Command-key case |
| 400 ms | the two-drop case and the Command-key case |
| 300 ms | the two-drop case |
| 250 ms | the two-drop case |
| 200 ms | none, 25 passed |
| 150 ms | "shows a card under a link the pointer rests on…", at line 669: the card was not shown 600 ms after the pointer moved onto it |
| 100 ms | "makes a path a pane printed a link…", at line 749: no link found within a second at a cell that holds one; and "shows a path's file in Finder…", at line 764, which reads that case's pane |

The Command-key case failed at 400 ms and passed at 300 ms. That fits the 200 ms that `Received.next(0)` waits before its first key, with the round trips of the case on top. Read. Below 200 ms the key cannot come before the replay for the same reason, so no smaller delay can show the Shift+Enter case red by that path. At 500 ms and 400 ms the Shift+Enter case passed where the Command-key case failed. The reading of `frame/design.md` *Grounding*, the row on why 1,500 ms shows that case green, would predict a failure there. No run shows why it passed, and this phase did not probe it further.

**The failures at 150 ms and 100 ms are hover checks, seen in one run each.** Line 669 waits a fixed 600 ms for the card, and line 749 gives the pointer one second to find a link. Neither case sends to a pane that came back. Each failed once, and the same case passed at every other delay. This phase did not chase them, because neither is a case of `frame/design.md` *Scope* item 9. `gaps.md` *Not verified* holds them.

**The helper is `untilReplayDrawn`, and it takes the tile as an expression of the page.** Where no tile is named it reads the first tile that is not hidden, which is what `cell`, `pointAt`, `pointAway` and `comeOnto` read before this phase. Where the stage shows one pane that tile is the pane in front, as `frame/design.md` *Data & interfaces* says. The four pointer helpers take the tile as their last argument, with the same default. `OVER_LINK` is now `overLink` of the first tile not hidden. Before, it matched a pointer over a link in any tile not hidden, so it differs only where two tiles stand, and no case reads `OVER_LINK` then. `cell` still reads the columns and the rows from the strip, which gives the size of the pane in front. Two tiles side by side are of one size, so the cell of the tile without the keyboard is found the same way. The two-drop case's run is the check.

**The two-drop case reads the tile it drops on.** It names that tile once, the tile without the keyboard, and hands it to the helper and to `drop`. The helper moves the pointer and presses nothing, so the first drop case still blurs the terminal and asserts that no pane has the keyboard before its drop.

**Each of the four cases calls the helper first.** The Shift+Enter case and the Command-key case call it at their start, before `Received.next(0)`. The first drop case calls it before `Received.next(0)` and the blur. The two-drop case calls it after "Side by side" and its waits, before `Received.next(0)` and the drop. The menu-open case's two lines are now one call.

**Scenario 7 is green.** After the four calls, the whole file passed with the patch at 1,500 ms, 25 of 25, and at 400 ms, 25 of 25. 400 ms is a delay at which the phase's start failed the two-drop case and the Command-key case. No delay showed the Shift+Enter case red, so the run at a shorter delay that `frame/design.md` scenario 7 asks for where one was found has no delay to run at. The same command as the red runs. Executed.

**Scenario 4 is green.** With the patch taken out by `git apply -R`, the whole file passed, 25 of 25: `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/terminal-basics.test.ts` from `apps/desktop`. No commit of the phase holds the patch, and the tree was clean after the run apart from this phase's edits. Executed. `pnpm run typecheck` from `apps/desktop` passed before the commit. Executed.

**The phase brings `gaps.md` *Not done* and the changelog fragment's bullet on the cases to what is now true.** *Not done* is `nothing`, since the four cases it named wait now. The changelog's bullet names the four cases beside the two of the issue.
