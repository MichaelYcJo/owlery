# Review round 6: 1795046889-four-terminals-memory

```seal
target: 246a8c2, fixes 8d08a01..246a8c2
```

This round reads the diff from `8d08a01`, round 5's record, to `246a8c2`. The range holds the fix pass over round 5's one finding, the close block the orchestrator committed at `fd29d9c`, and the orchestrator's fold at `246a8c2`. The fix pass is `bb77204` for the code of `stageOf`, two comments, one case and `phase-4.md:23`, `9ec7872` for two expectations on the fix's guards, and `d8b87bd` for two rows of `gaps.md`. `git show --stat` gives `fd29d9c` as six lines added to `round-5.md` and nothing else, and `246a8c2` as one line of `frame/design.md` changed in place.

As the spawn asked, the round read `view.ts#paneInFront`, `stageOf` and `recentKept` whole (`apps/desktop/src/renderer/view.ts:529-582`), with their wiring in `work-item-view.ts#broughtToFront`, `dropClosed`, `showView`, `enterView` and the handler of the "Side by side" button (`work-item-view.ts:83-86`, `:204-216`, `:299-349`, `:433-440`), and `renderer.ts#takeLists` (`renderer.ts:145-159`). It read them in both states of the control against `frame/design.md` *Scope* item 1, scenario 2 and the rule round 4's finding 1 restored. Carried from rounds 1 to 5, not re-derived: the reading of `screenMoves` and `stageShows`, and that `takeLists` calls `dropClosed` before `showView`, which this round opened again and found as round 5 gave it. Re-derived: every verdict below. `seal/parity.json` is not declared, `seal/config.json` has no `Pact` key, and `Record language` and `Commit and pull request language` are English, so the work item holds no `pr.<lang>.md`.

The round started the Owlery app zero times. Every run below was made in a `git clone --no-local` of the worktree at `246a8c2`, in the round's scratch directory, after `pnpm install --frozen-lockfile --offline` exited 0. The runner, `scripts/test-in-electron.mjs`, runs Electron's binary as Node and opens no window.

## Findings

### 1. With "Side by side" pressed, where the four panes most recently in front have all exited, closing the pane in front gives the keyboard to an exited pane while a live pane stands off the stage, and no frame sentence and no case holds it

```seal
severity: should
location: `apps/desktop/src/renderer/view.ts:562-565`, `seal/threads/1795046889-four-terminals-memory/frame/design.md:131`, `seal/threads/1795046889-four-terminals-memory/trail/phases/phase-4.md:23`, `seal/threads/1795046889-four-terminals-memory/gaps.md:18`, `apps/desktop/src/renderer/work-item-view.ts:212`, `apps/desktop/test/view.test.ts:500-505`
evidence: executed `node scripts/test-in-electron.mjs test/view.test.ts test/test_tmp_round6.test.ts` from `apps/desktop` in the clone at `246a8c2`, and the same command with one mutant of `stageOf` written in and put back; read `apps/desktop/src/renderer/view.ts:529-582`, `apps/desktop/src/renderer/work-item-view.ts:204-216`, `apps/desktop/src/renderer/work-item-view.ts:325-336`, `seal/threads/1795046889-four-terminals-memory/frame/design.md:55`, `seal/threads/1795046889-four-terminals-memory/frame/design.md:131`, `seal/threads/1795046889-four-terminals-memory/trail/rounds/round-5.md:145-149`
regression: round-5#1
```

Why it matters: the unit is `view.ts#stageOf`, whose closed-head path `bb77204` added (`view.ts:562-565`). *Scope* item 1 names, with the control pressed, "the four that were most recently in front" for the stage (`design.md:55`), and `frame/plan.md` *Phases* row 4 delivers that item. The fix gives `paneInFront` only those four, so where none of them runs, `paneInFront` falls back to the most recent of them, an exited pane. Before the fix the whole view's most recent live pane came in front there. The frame that says what follows is the fold `246a8c2` wrote into `design.md:131`: "the four panes most recently in front stay on the stage, and the most recent live pane of those four follows". Where none of those four runs, no live pane of them exists, and the tree gives the keyboard to an exited one. So the sentence states a rule the tree breaks for one input, and the defect came from writing the rule for the case where one of the four runs and leaving the other unsaid.

An example the probe ran. A view has six tabs. Panes 1 to 4 have exited and panes 5 and 6 run, and the control is pressed. Pane 9 was in front, then 1, 2, 3 and 4, and pane 9 is closed. `stageOf(tabs, [9, 1, 2, 3, 4], true)` returns `{ front: 4, shown: [1, 2, 3, 4] }`, and with the control not pressed `{ front: 6, shown: [6] }`. A person who closes the pane they were typing in then has the keyboard in a pane whose process has ended, with two live panes on tabs off the stage. That is the outcome round 4's finding 1 took out of the window for the control not pressed: "the pane in front before the closed one came in front, an exited one included" (`phase-4.md:23`).

The fix pass named this edge in its close and kept it: "where all four panes most recently in front have exited, the most recent of them takes the keyboard although a live pane stands off the stage, since item 1 names the four for the stage" (`round-5.md:148`). Item 1 does fix the stage, and the pane in front stands on the stage, so the tree's outcome follows from item 1. But the grounds stand in the fix pass's account alone. No sentence of the SDD set states the outcome, and the one sentence the fold wrote says otherwise. The sealer reads `design.md:131` against the tree, and the settle carries it toward the policy documents. Each would read a live pane as the rule. Four more statements say the same as the fold: `phase-4.md:23` ("the most recent live pane of those four comes in front"), the row of `gaps.md:18` ("the most recent live one of them comes in front"), the comment at `work-item-view.ts:212`, and the name of the case at `view.test.ts:500`.

No case holds the edge. The round wrote one mutant into the clone that gives the closed-head path the live panes of the four, and the whole view where none of them runs, which is the tree's rule before the fix for that input. Every case of `view.test.ts` passed under it, 169 of 169, and only the probe's expectation failed, on `expected { front: 6, shown: [ 1, 2, 3, 6 ] } to deeply equal { front: 4, shown: [ 1, 2, 3, 4 ] }`. The fix changed what that input gives, so the case is owed by the *Regression test* row of `skills/code-review/SKILL.md` *Probes and regression tests*.

The snippet below keeps the tree's code and states the edge. It rewrites the five statements, and the sentence at `design.md:131` is the orchestrator's to fold, as `246a8c2` was. The fix pass owes the other four and the case. The case fails under the mutant above, which shows it red. Where the owner wants a live pane in front instead, the code changes and *Scope* item 1 gains an exception for the stage, and the `## Not judged` row below names that question.

```text
seal/threads/1795046889-four-terminals-memory/frame/design.md:131, in place of the sentence that opens "Where "Side by side" is pressed":
Where "Side by side" is pressed, `view.ts#stageOf` gives that closed pane no place: the four panes most recently in front stay on the stage, and the most recent live pane of those four follows. Where none of those four runs, the most recent of them follows, an exited pane, although a live pane stands off the stage, because *Scope* item 1 names the four for the stage and the pane in front stands on it.

seal/threads/1795046889-four-terminals-memory/trail/phases/phase-4.md:23, after "and the most recent live pane of those four comes in front.":
Where none of those four runs, the most recent of them comes in front, an exited pane, although a live pane stands off the stage.

seal/threads/1795046889-four-terminals-memory/gaps.md:18, in place of "and the most recent live one of them comes in front.":
and the most recent live one of them comes in front, or the most recent of them where none of them runs.
```

```ts
// apps/desktop/src/renderer/work-item-view.ts:212, in place of the comment:
  // The closed pane that was in front stays as the last in front, so the most recent live pane follows it, and with "Side by side" pressed the most recent live one of the four most recently in front, or the most recent of the four where none of them runs (./view, `recentKept` and `stageOf`).

// apps/desktop/test/view.test.ts, in place of lines 500-505:
  it("gives a pane no longer among the tabs no place on the stage, so where the pane in front closed the four most recently in front stay and the most recent live one of them has the keyboard, or the most recent of them where none runs, and counts a pane named twice once", () => {
    expect(stageOf(six, [9, 2, 9, 2, 1, 3, 4], true)).toEqual({ front: 4, shown: [1, 2, 3, 4] });
    // Pane 4 has exited, so pane 3 is the most recent live one of the four.
    const exited = [session(1), session(2), session(3), session(4, { alive: false }), session(5), session(6)];
    expect(stageOf(exited, [9, 2, 1, 3, 4], true)).toEqual({ front: 3, shown: [1, 2, 3, 4] });
    // Panes 1 to 4 have exited, so pane 4 has the keyboard although panes 5 and 6 run off the stage.
    const fourExited = [session(1, { alive: false }), session(2, { alive: false }), session(3, { alive: false }), session(4, { alive: false }), session(5), session(6)];
    expect(stageOf(fourExited, [9, 1, 2, 3, 4], true)).toEqual({ front: 4, shown: [1, 2, 3, 4] });
  });
```

## Confirmations

```seal
confirms: round-5#1
```
What holds: with "Side by side" pressed, closing the pane in front no longer puts on the stage a pane outside the four most recently in front. `byRecency` ranks the view's tabs by `recent`, then the tabs never in front by id, so it names every tab (`view.ts:560-561`). Where the head of `recent` is no tab and the control is pressed, `candidates` is the first four of it (`view.ts:562-563`). `paneInFront` returns one of those four, so `[front, ...byRecency]` cut at four is those same four (`view.ts:564-567`). The probe ran round 5's example: panes 2 to 6 live, `recent` given by `recentKept([1, 2, 3, 4, 5, 6], {2, 3, 4, 5, 6})`. It returned `{ front: 5, shown: [2, 3, 4, 5] }`, where `d548df0` gave pane 6. The wiring keeps it. `dropClosed` cleared `front` where the closed pane held a screen (`work-item-view.ts:209`), so `showView` finds the target new and calls `broughtToFront(5)` (`work-item-view.ts:331-334`). The probe ran the `recent` that follows, `[5, 1, 2, 3, 4, 6]`, through the next `dropClosed`'s `recentKept`. It gave `[5, 2, 3, 4, 6]` and the same stage. With the control not pressed, `closedFirst` is false and `candidates` is every tab, which is the tree's path before the fix (`view.ts:562-563`). The probe gave `{ front: 6, shown: [6] }` for the example, and the new expectation at `view.test.ts:474` holds it. Every input whose head of `recent` is a tab, or whose `recent` is empty, also takes the path it took at `d548df0`, because `byRecency` with `front` put first is the old `ranked`. The fix pass's red log (`fix-5/stage-red.txt`) shows the changed case failing at line 496 of `view.test.ts` as it stood before `9ec7872`, against the code before the fix. Its `mutate-stage.txt` shows six runs, each with one case failing: three at `view.test.ts:501`, one at `:474` and two at `:497`. The fix pass's account names those as the two guards' expectations. Finding 1 above stands at the one input the close itself named. `executed` in the probe and the narrow run, and `read`.

Round 5's grounds counted one more effect of the defect as a harm: "A person sees a pane that was not on the stage come into the freed tile and take the keyboard. Three tiles that were on screen stay, and none of them gets the keyboard." At `246a8c2` the same holds for round 5's own example. Pane 5 was off the stage, comes into the freed tile and has the keyboard, and panes 2, 3 and 4 stay. Round 5's snippet gave that result in its own probe (`round-5.md`, the paragraph before its fix), and the fold states it. In this tree's words a pane is "most recent" by its id (`view.ts:17`, `:531-532`, `:551`), so "the most recent live pane of those four" is pane 5 and not pane 2, the one most recently in front. That is no finding: the SDD set now states the outcome and the tree does it. Whether a person wants it is the `## Not judged` row below.

What matched: the two expectations `9ec7872` adds each hold what no other case of the group holds. Without the `sideBySide` guard, the case at `view.test.ts:509-514`, which gives `stageOf` a closed head with the control not pressed, still returns pane 1, because the closed head's four are the whole view there. Only the expectation at `view.test.ts:474` fails. Without the `recent.length > 0` guard, `stageOf(six, [], true)` still gives pane 6, which is live and highest among the four never in front. Only the expectation at `view.test.ts:497` fails. The second expectation `bb77204` adds at `view.test.ts:503-504` holds that `paneInFront` reads the four's liveness: a mutant that took the highest id of the four would give pane 4. `read`.

What matched: the docstring of `stageOf` (`view.ts:545-556`), the docstring of `recentKept` (`view.ts:571-579`) and the comment at `work-item-view.ts:32` say what the tree does. "The pane in front is `paneInFront`'s among those four" covers the edge of finding 1, because it names `paneInFront`'s own fallback. `read`.

What matched: the records against the target. `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `pr.md` and `trail/phases/phase-4.md` were read whole at `246a8c2`, and `trail/phases/phase-1.md` to `phase-3.md` and the five earlier rounds for their coordinates. Besides the statements finding 1 names, no sentence among them is contradicted by the tree. `changelog.md:6` says a work item with more tabs "shows the four that were most recently in front", which the fix makes true at a close as well. The diff of `gaps.md` changes rows 12 and 18 in place and adds to each, and takes no row of `## Not verified` out. Row 12 says the fix pass of round 5 ran the same three files in one command, and its `narrow.txt` reads 3 files and 206 passed, round 5's count. The fix pass added expectations and no case, so the count holds. The row labels the suite, the typecheck and the broad gate not verified, with the orchestrator as answerer, which is honest. `pr.md`, `frame/plan.md`, `frame/questions.md`, `changelog.md` and `routing.md` are unchanged since `8d08a01`. `pr.md`'s five quotes stand word for word at the start of the Judgment cells of rows 3, 6, 5, 2 and 1 of *Judgments of the run*. `read` and `executed`.

What matched: the narrow set at the target. `node scripts/test-in-electron.mjs test/view.test.ts test/test_tmp_round6.test.ts` exited 0 with 2 files and 172 passed: 169 in `view.test.ts` and the probe's 3. `executed`.

## Not judged

| What | Location | Who answers |
|---|---|---|
| With the control pressed, where the pane in front closes, which pane takes the keyboard. The tree gives it to the live pane of the four with the highest id, which can be a pane that came onto the stage at that close, and to an exited pane where none of the four runs. The fold states the first, and finding 1 asks for the second to be stated. Neither is grounded in a choice a person made. The alternative is the pane of the four most recently in front, or a live pane off the stage, which would break *Scope* item 1's four | `apps/desktop/src/renderer/view.ts#stageOf`; `seal/threads/1795046889-four-terminals-memory/frame/design.md:131` | the owner at the window |
| The Korean input case, which types into a screen of the window built from the changed `view.ts` and `work-item-view.ts`. The round makes no start of the app | `apps/desktop/test/korean-input.test.ts` | the orchestrator, at the broad run |
| The desktop suite, the typecheck and the broad gate, and the `tsc` the fix pass reports over four files (contract rule 2) | `seal/config.json` `Broad gate`; `gaps.md:12` | the orchestrator, at the broad run |
| The close of the pane in front in the app, with the control pressed or not. The round read the wiring and ran the pure functions, and made no start | `apps/desktop/src/renderer/work-item-view.ts#dropClosed`, `#showView`; `gaps.md:18` | the owner at the window, or the sealer where it starts the app |

## Probes

| Command | Result |
|---|---|
| `git clone --no-local` of the worktree, `git checkout 246a8c2`, `pnpm install --frozen-lockfile --offline` | exit 0 |
| `node scripts/test-in-electron.mjs test/view.test.ts test/test_tmp_round6.test.ts`, `OWLERY_MEASURE_MEMORY` unset, from `apps/desktop` | exit 0, 2 files, 172 passed. The probe held `{ front: 5, shown: [2, 3, 4, 5] }` for round 5's example pressed and `{ front: 6, shown: [6] }` not pressed, the same stage after the next `dropClosed`, `{ front: 4, shown: [1, 2, 3, 4] }` pressed where the four have exited and `{ front: 6, shown: [6] }` not pressed, and `{ front: 6, shown: [3, 4, 5, 6] }` for a closed head with no other pane ever in front |
| The same command with `candidates` in `stageOf` made the live panes of the four, and every tab where none of the four runs, then `git checkout -- src/renderer/view.ts` | exit 1, 171 passed and 1 failed: every case of `view.test.ts` passed, and the probe's case of four exited panes failed on `expected { front: 6, shown: [ 1, 2, 3, 6 ] } to deeply equal { front: 4, shown: [ 1, 2, 3, 4 ] }`. The clone's `git status` showed the probe file alone after the checkout |
| `git show --stat` of `fd29d9c`, `246a8c2` and `d8b87bd` at the worktree | as the opening paragraphs give them |
