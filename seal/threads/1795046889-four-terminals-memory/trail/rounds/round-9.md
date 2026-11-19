# Review round 9: 1795046889-four-terminals-memory

```seal
target: 26a963b, fixes 6dc6b78..26a963b
```

This round reads the diff from `6dc6b78`, round 8's record, to `26a963b`. `git log` gives the range as three commits. `bcba74d` changes two docstrings of `view.ts` (`paneInFront` at lines 531-532, `stageOf` at line 551) and four case names and three comments of `view.test.ts`, 11 lines added and 11 removed, with no `expect` line changed. `88b1e37` changes `gaps.md` rows 12 and 18, `trail/phases/phase-3.md:59` and `trail/phases/phase-4.md:23-24`. `26a963b` adds the six lines of round 8's close block to `round-8.md` and nothing else.

Carried from rounds 1 to 8, not re-derived: where `paneInFront`, `stageOf` and `recentKept` stand (`view.ts:529-583`), that `renderer.ts#takeLists` calls `dropClosed` before `showView`, and that `paneInFront` at `ea78b7b` already sorted its tabs by id. Re-derived: every verdict below, among them the close's sorting of the 30 lines its `git grep` printed, which finding 1 does not hold in full. `seal/parity.json` is not declared, `seal/config.json` has no `Pact` key, and `Record language` and `Commit and pull request language` are English, so the work item holds no `pr.<lang>.md`.

The round started the Owlery app zero times. Every run was made in a `git clone --no-local` of the worktree at `26a963b`, in the round's scratch directory, after `pnpm install --frozen-lockfile --offline` exited 0. The runner, `scripts/test-in-electron.mjs`, runs Electron's binary as Node and opens no window.

## Findings

### 1. The seven statements of the stage after a close with "Side by side" pressed say the four panes most recently in front stay, and where fewer than four of the other tabs were in front the tree brings on a tab never in front, chosen by its id, and can give it the keyboard

```seal
severity: should
location: `apps/desktop/src/renderer/view.ts:553-555`, `apps/desktop/src/renderer/view.ts:575-577`, `apps/desktop/src/renderer/work-item-view.ts:212`, `apps/desktop/test/view.test.ts:500-508`, `seal/threads/1795046889-four-terminals-memory/frame/design.md:131`, `seal/threads/1795046889-four-terminals-memory/gaps.md:18`, `seal/threads/1795046889-four-terminals-memory/trail/phases/phase-4.md:23`
evidence: executed `node scripts/test-in-electron.mjs test/test_tmp_close_fill_2.test.ts` from `apps/desktop` in the clone at `26a963b` (4 passed), and `git grep -n -i "recently in front"` over `apps/desktop/src`, `apps/desktop/test` and the work item's records outside `trail/rounds/`; read `apps/desktop/src/renderer/view.ts:535-568`, `apps/desktop/src/renderer/work-item-view.ts:84-86`, `apps/desktop/src/renderer/work-item-view.ts:326-335`, `apps/desktop/test/view.test.ts:500-508`, `seal/threads/1795046889-four-terminals-memory/trail/phases/phase-4.md:24`
reopens: round-8#1
```

Why it matters: round 8's close took the class as every "most recent" that names a pane by its id in the stage's decisions, their cases and the records. It sorted the 30 lines its `git grep` printed, and put `view.ts:554` and `:576`, `work-item-view.ts:212`, `view.test.ts:500`, `design.md:131`, `gaps.md:18` and `phase-4.md:23` among the 22 that "name order in front". It then wrote that "no line of the stage's decisions, their cases or the records names a pane by its id with 'most recent'". For one input those seven lines do name panes chosen by their id, so the close does not hold for them.

Each of the seven states what the stage holds after the pane in front closes with the control pressed. Each says the four panes most recently in front stay, or that `stageOf` takes the pane in front from them. The tree takes the first four of `byRecency` (`view.ts:561-563`). `byRecency` holds the panes of `recent` that are still tabs, and then the tabs never in front, the highest id first (`view.ts:559`). Where fewer than four of the remaining tabs were ever in front, the four therefore hold tabs never in front, picked by id, and the stage gains a pane that was not on it.

The input is reachable. After a load the window brings pane 6 of six in front (`stageOf(six, [], true)`, `view.test.ts:493`), and `showView` notes it in `recent` (`work-item-view.ts:331-334`). A press on tab 2 gives `recent` `[2, 6]` and the stage `[2, 4, 5, 6]`. Pane 2 then closes, and `recentKept` keeps it at the head. The probe gives `{ front: 6, shown: [3, 4, 5, 6] }`. Pane 3 was never in front and was not on the stage, and it takes pane 2's place. Where pane 6 has exited as well, the probe gives `{ front: 5, shown: [3, 4, 5, 6] }`: pane 5 takes the keyboard, and it was never in front. A reader of `design.md:131` or `gaps.md:18` expects the panes that stood on the stage to stay and a pane that was in front to take the keyboard. Neither happens. The sealer reads both files against the tree.

`phase-4.md:24` records the fill by tabs never in front as phase 4's decision, and gives its ground for a load, where no pane was in front. The seven statements were written later by the fix passes of rounds 5 to 7, for a close, and none of them names the fill. No case holds it either. Each of the three expectations of a closed head with the control pressed (`view.test.ts:501`, `:504`, `:507`) has four other panes in front after the closed one.

The list was made from what produces the defect: every statement of the branch `closedFirst` of `stageOf`. `git grep -n -i "recently in front"` over the tree's window, its cases and the records printed 15 lines, and each was read. Eight of them hold the seven statements above, `view.ts:553` and `:554` being one. `view.test.ts:486`, `design.md:56` and `phase-4.md:51` name the shown pane least recently in front, which a pressed tab replaces, and `view.test.ts:486`'s input holds all six tabs in `recent`. `design.md:55` and `:104`, `changelog.md:6` and `phase-4.md:24` state *Scope* item 1 for a view with no close, where `phase-4.md:24` records the fill as phase 4's reading of the item. Round 4 read that reading (`round-4.md:115`), and this finding leaves those lines. The identifiers `recent` in `paneInFront` (`view.ts:537`, from `ea78b7b`) and `byRecency` (`view.ts:561`) spell the same ranking by id as recency. They are code names, not a sentence an agent acts on, and the finding leaves them.

The fix rewrites the seven statements and adds one expectation, which pins the fill after a close and the choice of the keyboard among a tab never in front. The fix pass shows it red with the tabs never in front taken out of `candidates`. `design.md:131` is the orchestrator's to fold, as `4e0d560` was.

```text
seal/threads/1795046889-four-terminals-memory/frame/design.md:131, in place of "the four panes most recently in front stay on the stage, and the live pane of those four with the highest id follows.":
the stage holds the four panes most recently in front, or where fewer than four of the tabs were in front, those and then the tabs never in front with the highest ids, and the live pane of those four with the highest id follows.

seal/threads/1795046889-four-terminals-memory/gaps.md:18, in place of "the four panes most recently in front stay on the stage and the live one of them with the highest id comes in front,":
the stage holds the four panes most recently in front, or where fewer than four of the tabs were in front, those and then the tabs never in front with the highest ids, and the live one of them with the highest id comes in front,

seal/threads/1795046889-four-terminals-memory/trail/phases/phase-4.md:23, in place of "the four most recently in front stay on the stage, and the live pane of those four with the highest id comes in front.":
the stage holds the four most recently in front, or where fewer than four of the tabs were in front, those and then the tabs never in front with the highest ids, and the live pane of those four with the highest id comes in front.
```

```ts
// apps/desktop/src/renderer/view.ts:553-555, the end of the docstring of `stageOf`, in place of "A closed pane that `recentKept` left first takes no place: the stage keeps the four most recently in front, and the pane in front is `paneInFront`'s among those four.":
 * least recently in front. A closed pane that `recentKept` left first takes
 * no place: the stage holds the first four of that order without it, the
 * panes most recently in front and then the tabs never in front, and the
 * pane in front is `paneInFront`'s among those four.

// apps/desktop/src/renderer/view.ts:575-577, in the docstring of `recentKept`, in place of "which `stageOf` takes from the four most recently in front where "Side by side" is pressed, or the one of those four with the highest id where none of them runs.":
 * finds it is no tab and gives the live pane with the highest id, which
 * `stageOf` takes from the first four of its order where "Side by side" is
 * pressed, the panes most recently in front and then the tabs never in
 * front, or the one of those four with the highest id where none of them
 * runs. Were it taken out, the pane in front before it would come in
 * front, an exited one included.

// apps/desktop/src/renderer/work-item-view.ts:212, in place of the comment:
  // The closed pane that was in front stays as the last in front, so the live pane with the highest id follows it, and with "Side by side" pressed the live one with the highest id of the four `stageOf` keeps, the panes most recently in front and then the tabs never in front, or the one of the four with the highest id where none of them runs (./view, `recentKept` and `stageOf`).

// apps/desktop/test/view.test.ts:500-508, the case's name, and one comment and two expectations after the line at :507:
  it("gives a pane no longer among the tabs no place on the stage, so where the pane in front closed the four most recently in front, then the tabs never in front, stand on the stage and the live one of them with the highest id has the keyboard, or the one of them with the highest id where none runs, and counts a pane named twice once", () => {
    // ... the three expectations and two comments at :501-507 stay as they are ...
    // Only pane 6 was in front besides pane 2, which closed, so pane 3, never in front and not on the stage before, takes pane 2's place, and where pane 6 has exited pane 5, never in front, has the keyboard.
    const twoInFront = [session(1), session(3), session(4), session(5), session(6)];
    expect(stageOf(twoInFront, [2, 6], true)).toEqual({ front: 6, shown: [3, 4, 5, 6] });
    expect(stageOf([session(1), session(3), session(4), session(5), session(6, { alive: false })], [2, 6], true)).toEqual({ front: 5, shown: [3, 4, 5, 6] });
  });
```

```seal
verdict: fixed 076e0a7
location: `seal/threads/1795046889-four-terminals-memory/changelog.md`
answer: The finding holds: `stageOf` takes the first four of `byRecency`, which holds the tabs never in front after the panes of `recent`, and no statement of the close said so. The code of `stageOf` does not change (`frame/plan.md` *Judgments of the run*, last row). The snippet's comment and two expectations are applied as written. Its sentences are not: each restates the order once more, and the fix pass wrote the statements in its own words to name the stage order that `frame/design.md` *Scope* item 1 defines since `ceb965b`. `076e0a7` holds the window and its cases. The docstring of `stageOf` defines the stage order once in the code's terms, and says the first `STAGE_PANES` panes of it stand on the stage after that close, tabs never in front among them, one of which can be the pane in front. The docstring of `recentKept`, the comment at `work-item-view.ts:212` and the case name at `view.test.ts:500` cite that order. `c17ff5c` holds the records: `gaps.md:18`, `trail/phases/phase-4.md:23`, and this pass's run in the row of `gaps.md:12`. The class the pass took is every statement of which panes stand on the stage, or which comes in front, with the control pressed, that does not hold for the tabs never in front. It was listed from what produces the defect, the two uses of `byRecency` in `stageOf`: the candidates after a close, and `top`, which decides the stage and which shown pane a pressed tab replaces. The second use gave three more statements than the finding names, and this block's `location:` names the file the finding does not. A pressed tab takes the place of the shown pane last in the stage order, which is a tab never in front where one is shown, so "least recently in front" did not hold in the docstring of `stageOf` or in the case name at `view.test.ts:486`, and both now name the stage order. `changelog.md:6` said a view with more tabs "shows the four that were most recently in front" and that a pressed tab replaces "the one least recently in front"; it now says in a user's words that the panes started last fill the four where fewer than four had the keyboard, and that a shown pane that never had the keyboard is replaced first. `trail/phases/phase-4.md:24` quoted item 1's words from before `ceb965b`; it now says item 1 named them when the phase was built. Two frame lines state the same replacement and are the orchestrator's to fold: `frame/design.md:56` and `:104`, "the shown pane least recently in front". `trail/phases/phase-4.md:51` records what one drive showed and is left. The check after the fix: `git grep -n -i -E "most recent|recently in front"` over `apps/desktop/src`, `apps/desktop/test` and the work item's records outside `trail/rounds/` prints 23 lines at `c17ff5c` (`fix-9/grep-after.txt` in the pass's scratch), each read. None outside `frame/` states the stage or the pane in front with the control pressed in words that fail for the tabs never in front. The two expectations were seen red before the commit, each with one guard removed by hand and `stageOf` then restored. With the tabs never in front taken out of `candidates`, `node scripts/test-in-electron.mjs test/view.test.ts` exited 1 with 1 failed and 168 passed, at `view.test.ts:511`: `expected { front: 6, shown: [ 3, 4, 5, 6 ] } to deeply equal { front: 5, shown: [ 3, 4, 5, 6 ] }` (`fix-9/red-a.txt`). The expectation at `:510` stays green under that guard's removal, since pane 6 is in front either way. With the tabs never in front taken out of `top` after a close, the run exited 1 with 1 failed and 168 passed, at `view.test.ts:510`: `expected { front: 6, shown: [ 6 ] } to deeply equal { front: 6, shown: [ 3, 4, 5, 6 ] }` (`fix-9/red-b.txt`), and no earlier case failed. At `c17ff5c` the same command exited 0 with 1 file and 169 passed (`fix-9/narrow.txt`), and `tsc` over `view.ts`, `work-item-view.ts`, `renderer.ts` and `view.test.ts` exited 0 (`fix-9/tsc.txt`), both `executed`. The pass started the app zero times.
```

## Confirmations

What matched: round 8's snippet stands in the tree word for word. Each of its four replacement lines was found once by `grep -c -F`, in `trail/phases/phase-4.md` (two), `gaps.md` and `view.test.ts`. `git diff -U0 6dc6b78 26a963b -- apps` changes no `expect` line, and `apps` changes by 11 lines added and 11 removed. That is three lines of the docstring of `paneInFront`, one of `stageOf`, four case names and three comments, as the close counts them. The close's "no expectation and no code" holds. `executed`.

What matched: the wider renaming, line by line against the code. `paneInFront` sorts its tabs by id and returns the live one first found, or the first where none is alive (`view.ts:536-538`), so its docstring (`:531-532`) and its two case names (`view.test.ts:452`, `:458`) are the tree's. `never` is sorted by id, the highest first (`view.ts:559`), so the docstring of `stageOf` at `:551` and the case name at `view.test.ts:491` are the tree's. The comment at `view.test.ts:473` names pane 6 for `[9, 2, 1, 3, 4]` with the control not pressed, which `paneInFront` gives over every tab. The comments at `:492` and `:495` name the inputs of `:493` and `:496-497`: after a load pane 6 is in front, and in `oneLive` panes 2 to 5, the four with the highest ids, have exited. `phase-4.md:24`'s "the three others with the highest ids" holds for six tabs whatever their state, since `top` puts the pane in front first and then `byRecency` (`view.ts:567`). `phase-3.md:59` names the same pane as before: the drive's second work item held panes 5 to 8 with pane 7 exited, and `paneInFront` at `5814c92` sorted by id as it does now, so pane 8 was in front, which the drive's own line on the answers sent to pane 8 after the reload agrees with. No line of the renaming is wrong, and the pass broke nothing. Finding 1 is in lines the pass sorted and did not change. `read`.

What matched: the lines the pass kept. `git grep -n -i "most recent"` over `view.ts`, `work-item-view.ts`, `view.test.ts` and the work item's records outside `trail/rounds/` prints 30 lines at `26a963b`, as the close says. "Most recent" stays in `livePanes` and its two callers' docstrings (`view.ts:17`, `:22`, `:37`) and the case at `view.test.ts:123`. There the pane is the live one the daemon started last, picked by id (`view.ts:18-19`), in a decision that holds no order in front. One sense stands in that decision, so it reads one way. The same holds for `view.test.ts:128`'s "a more recent pane", which the pass's search for "most recent" did not print and which is the same decision. `view.ts:758` and `view.test.ts:768` order headless sessions by id, `design.md:174` quotes a case name of `OutputBuffer`, and `questions.md:32` is an option the owner did not choose, whose words are what was asked. `phase-4.md:41` names a mutant. Keeping each is right. `read`.

What matched: the case at `view.test.ts:512-517`. Its renamed name holds for its input. Its view has one live pane, so the input does not tell the live pane with the highest id from the live pane most recently in front. The case that tells them apart is `view.test.ts:474`. The case holds a fact `design.md:131` states, and its name claims nothing it does not hold, so no finding is owed.

What matched: the records against the target. `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md` and `pr.md` were read whole at `26a963b`, as were `trail/phases/phase-3.md:48-61`, `trail/phases/phase-4.md:18-26`, rounds 7 and 8 whole, and the earlier rounds for their coordinates. `frame/plan.md` and `frame/questions.md`, which the pass did not read, hold no statement of which pane is in front or on the stage. The only one in either is `questions.md:32`, option (d) of Q1, which the pass kept. Neither file holds a sentence the tree contradicts. Of `frame/design.md`, the statements the tree contradicts are those of finding 1, at line 131. `design.md:55` and `:104` state *Scope* item 1 without the fill by tabs never in front, which `phase-4.md:24` records as phase 4's reading for a load, and round 4 read it. `pr.md`'s five quotes stand word for word at the start of the Judgment cells of rows 1, 2, 5, 6 and 3 of `frame/plan.md` *Judgments of the run* (`plan.md:98-103`). The diff of `gaps.md` changes rows 12 and 18 in place, so no row of `## Not verified` leaves. `read`.

What matched: the row of `gaps.md:12`. It says the fix pass of round 8 "reworded four case names, three comments of the cases and two docstrings of `view.ts`, ran `test/view.test.ts`, and ran no `tsc`". `bcba74d` holds those nine, and "None of the five" names the fix passes of rounds 4 to 8. The row leaves the suite, the typecheck and the broad gate to the orchestrator, which is honest. The pass changed comments and strings, so the typecheck has nothing new to read. `read`.

What matched: the narrow set at the target. `node scripts/test-in-electron.mjs test/view.test.ts` exited 0 with 1 file and 169 passed. `executed`.

## Not judged

| What | Location | Who answers |
|---|---|---|
| With the control pressed, where the pane in front closes, which pane a person wants to have the keyboard: the live pane of the four with the highest id, as the tree gives, the pane of the four most recently in front, or a live pane off the stage, which would break *Scope* item 1's four. Rounds 6 to 8 raised it and nobody has answered it. Finding 1 adds the case where the four hold tabs never in front, and asks only that the statements say what the tree gives | `apps/desktop/src/renderer/view.ts#stageOf`; `seal/threads/1795046889-four-terminals-memory/frame/design.md:131` | the owner at the window |
| The Korean input case, which types into a screen of the window built from `view.ts` and `work-item-view.ts`. The round makes no start of the app | `apps/desktop/test/korean-input.test.ts` | the orchestrator, at the broad run |
| The desktop suite, the typecheck and the broad gate (contract rule 2) | `seal/config.json` `Broad gate`; `gaps.md:12` | the orchestrator, at the broad run |
| The close of the pane in front in the app, with the control pressed or not. The round ran the pure functions and made no start | `apps/desktop/src/renderer/work-item-view.ts#dropClosed`, `#showView`; `gaps.md:18` | the owner at the window, or the sealer where it starts the app |

## Probes

| Command | Result |
|---|---|
| `git clone --no-local` of the worktree, `git checkout 26a963b`, `pnpm install --frozen-lockfile --offline` | exit 0 |
| `node scripts/test-in-electron.mjs test/test_tmp_close_fill.test.ts` from `apps/desktop` in the clone, a probe that printed `stageOf`'s results with `console.log`, then the file removed | exit 0, 1 passed. The runner printed none of the lines, so the probe settled nothing and was written again below |
| `node scripts/test-in-electron.mjs test/test_tmp_close_fill_2.test.ts` from `apps/desktop` in the clone, with four expectations, then the file removed | exit 0, 4 passed: `stageOf(six, [2, 6], true)` gives `{ front: 2, shown: [2, 4, 5, 6] }`; `recentKept([2, 6], {1, 3, 4, 5, 6})` gives `[2, 6]`; after pane 2 closes, `{ front: 6, shown: [3, 4, 5, 6] }`; with pane 6 exited as well, `{ front: 5, shown: [3, 4, 5, 6] }`. The clone's `git status --short` printed nothing after |
| `node scripts/test-in-electron.mjs test/view.test.ts`, from `apps/desktop` in the clone | exit 0, 1 file, 169 passed (`proofer-9/narrow.txt` in the round's scratch) |
| `git grep -n -i "most recent"` and `git grep -n -i "recently in front"` over the window's files, their cases and the work item's records outside `trail/rounds/`, at the worktree | 30 lines and 15 lines, each read and sorted in finding 1 and in *Confirmations* |
| `grep -c -F` of each replacement line of round 8's snippet in its file, and `git diff -U0 6dc6b78 26a963b -- apps` counting changed `expect` lines | 1 for each line; 0 |
