# Review round 5: 1795046889-four-terminals-memory

```seal
target: d548df0, fixes 40daf18..d548df0
```

This round reads the diff from `40daf18`, round 4's record, to `d548df0`. The range holds the fix pass over round 4's four findings, the close blocks the orchestrator committed at `0ea178b`, and the orchestrator's fold at `d548df0`. The fix pass is `f155c71` for finding 1, `368a86e` for finding 3, `96b70fe` for finding 2, `ec49ba1` for finding 4, and `eee89e3` for its records and two comments. `git diff --stat 40daf18..d548df0` lists three files of `apps/desktop` (`src/renderer/view.ts`, `src/renderer/work-item-view.ts`, `test/view.test.ts`) and five of the work item. `git diff --stat 40daf18..0ea178b -- seal` shows `round-4.md` gaining 21 lines and losing none, so the orchestrator's commit appends the four close blocks and changes no finding.

Carried from rounds 1 to 4, not re-derived: round 4's reading of `screenMoves` and `stageShows`, by which the pool gains a screen only where a pane comes onto the stage and none is free, the reading of `renderer.ts#takeLists` (`dropClosed` before `showView`), and the measurement's tables in `apps/desktop/measurements/memory.md` as round 4 read them against phase 4's scratch. Re-derived: every verdict below, and the wiring of `dropClosed`, `showView` and `broughtToFront` that decides which pane follows a close. `seal/parity.json` is not declared, `seal/config.json` has no `Pact` key, `Record language` and `Commit and pull request language` are English, so the work item holds no `pr.<lang>.md`.

The round started the Owlery app zero times, as the spawn asked. Every run below was made in a `git clone --no-local` of the worktree at `d548df0`, in the round's scratch directory, with its own `pnpm install --frozen-lockfile --offline`. The runner, `scripts/test-in-electron.mjs`, runs Electron's binary as Node and opens no window. One mutant of `recentKept` was written into the clone and put back without being run, because the session's permission check refused the run. The fix pass's own red and mutation logs in its scratch (`fix-4/recent-red.txt`, `fix-4/mutate-recent.txt`) were read in its place.

## Findings

### 1. With "Side by side" pressed, closing the pane that has the keyboard puts on the stage a pane that was not among the four most recently in front, and gives it the keyboard

```seal
severity: should
location: `apps/desktop/src/renderer/view.ts:555-565`, `apps/desktop/src/renderer/work-item-view.ts:212-213`, `apps/desktop/test/view.test.ts:495-497`, `seal/threads/1795046889-four-terminals-memory/trail/phases/phase-4.md:23`
evidence: executed `node scripts/test-in-electron.mjs test/view.test.ts test/test_tmp_close_side_by_side.test.ts` from `apps/desktop` in the clone at `d548df0`; read `apps/desktop/src/renderer/view.ts:530-565`, `apps/desktop/src/renderer/view.ts:567-576`, `apps/desktop/src/renderer/work-item-view.ts:83-86`, `apps/desktop/src/renderer/work-item-view.ts:204-216`, `apps/desktop/src/renderer/work-item-view.ts:325-336`, `apps/desktop/src/renderer/renderer.ts:145-158`, `seal/threads/1795046889-four-terminals-memory/frame/design.md:55`, `seal/threads/1795046889-four-terminals-memory/changelog.md:6`
regression: round-4#1
```

Why it matters: the unit is `view.ts#recentKept` as `dropClosed` calls it (`work-item-view.ts:213`). Since `f155c71` it leaves a closed pane at the head of `recent` in both states of the control, and `stageOf` then reads it. `frame/design.md` *Scope* item 1 says that pressed, "A work item with more tabs than four shows the four that were most recently in front in that view" (`design.md:55`), and `frame/plan.md` *Phases* row 4 delivers that item. The fix kept the closed pane at the head so that `paneInFront` falls back to the most recent live pane. That rule is the one *Scope* item 1 keeps "as today" for the control not pressed. The defect came from `stageOf`, which since phase 4 ranks the pane in front first whatever it is (`view.ts:556`, `:562`). Its case "counts a pane no longer among the tabs as never in front" (`view.test.ts:495-497`) pins that fallback with the control pressed, as `{ front: 6, shown: [1, 2, 3, 6] }` where the four most recently in front are 2, 1, 3 and 4. At `626d036` no path of the window handed `stageOf` a closed pane at the head of `recent`, because `dropClosed` took every closed pane out. Round 4's snippet would have opened the same path.

An example. Six live panes were each in front once, from pane 6 down to pane 1, and the control is pressed, so panes 1 to 4 are tiles and pane 1 has the keyboard. The person closes pane 1. `takeLists` calls `dropClosed` (`renderer.ts:155`), which leaves `recent` as `[1, 2, 3, 4, 5, 6]` (`recentKept`). `showView` then calls `stageOf` (`work-item-view.ts:327`). `paneInFront` finds pane 1 is no tab and returns pane 6, the newest live pane (`view.ts:536-538`). Pane 6 ranks first, so the stage shows 2, 3, 4 and 6, and pane 6 takes the keyboard (`work-item-view.ts:331-335`). Pane 5 was in front more recently than pane 6 and is left off. At `626d036` the same close showed 2, 3, 4 and 5 with pane 2 in front. The probe runs both: `stageOf(tabs 2 to 6, recentKept([1, 2, 3, 4, 5, 6], {2, 3, 4, 5, 6}), true)` returns `{ front: 6, shown: [2, 3, 4, 6] }`, and with every closed pane filtered out it returns `{ front: 2, shown: [2, 3, 4, 5] }`. A person sees a pane that was not on the stage come into the freed tile and take the keyboard. Three tiles that were on screen stay, and none of them gets the keyboard. The changelog says the same as the frame: "A work item with more tabs shows the four that were most recently in front" (`changelog.md:6`). The phase record says "Item 1 does not say otherwise" of the rule (`phase-4.md:23`). For the control pressed, item 1 does say otherwise.

The fix pass's claim that "The rest of `recent` only ranks the tiles, and a closed pane leaves it as before the fix" holds for every place but the head. With the control not pressed, the close holds as round 4 asked, and the confirmation below says so.

The snippet makes a closed pane at the head of `recent` take no place while the control is pressed. The stage then keeps the four most recently in front, and the keyboard goes to the most recent live pane of those four, by `paneInFront`'s own rule. Every other input takes the tree's path unchanged, so the other five `stageOf` cases and both `recentKept` cases keep their expectations. The probe ran this rule for the closed-head path in the form `paneInFront(tabs of the four, recent[0])`. Run that way, the example gives `{ front: 5, shown: [2, 3, 4, 5] }`, the changed case gives `{ front: 4, shown: [1, 2, 3, 4] }`, and the tree's other `stageOf` and `recentKept` expectations held. The snippet as written below was not run.

Before writing it, the round listed the rule's statements from `git grep -n -e "most recent live" -e recentKept -- apps seal`, leaving out the round records. The snippet rewrites three of them: the code of `stageOf`, its docstring (`view.ts:544-554`), and the case at `view.test.ts:495-497`, whose name and expectation change. That case then fails against the tree's `stageOf`, which shows it red. A new case would hold nothing the changed case does not, so none is added. The fix pass also owes four other statements. `recentKept`'s docstring (`view.ts:567-573`) and the comment at `work-item-view.ts:212` say the closed pane makes "the most recent live pane" follow, which for the control pressed becomes the most recent live pane of the four. The fold's sentence at `frame/design.md:131` says the same and owes the same qualification. `phase-4.md:23` owes "Item 1 does not say otherwise" scoped to the control not pressed, and a sentence on the control pressed. The row of `gaps.md` on the pool's wiring (`gaps.md:18`) names the reading of the wiring and owes nothing as long as its sentence stays true. `changelog.md:6` holds once the snippet is in.

```ts
// apps/desktop/src/renderer/view.ts, in place of the docstring and the body of stageOf (lines 544-565):
/**
 * The panes on the stage of a view that shows `tabs`, in the tabs' order,
 * and the one of them in front, which has the keyboard. `recent` is the panes
 * that were in front in that view, the most recent first. The pane in front
 * is `paneInFront`'s for the first of them. Where "Side by side" is not
 * pressed, it is alone on the stage. Where it is pressed, the stage holds up
 * to `STAGE_PANES` panes: the one in front, then the ones most recently in
 * front, then the tabs that were never in front, the most recent first. A
 * pressed tab is the most recent, so it takes the place of the shown pane
 * least recently in front. A closed pane that `recentKept` left first takes
 * no place: the stage keeps the four most recently in front, and the pane in
 * front is `paneInFront`'s among those four.
 */
export function stageOf(tabs: readonly SessionInfo[], recent: readonly number[], sideBySide: boolean): { front: number | undefined; shown: number[] } {
  const ids = tabs.map((tab) => tab.id);
  const never = ids.filter((id) => !recent.includes(id)).sort((a, b) => b - a);
  // A set keeps each pane at the first place it is named.
  const byRecency = [...new Set([...recent.filter((id) => ids.includes(id)), ...never])];
  const closedFirst = sideBySide && recent.length > 0 && !ids.includes(recent[0] as number);
  const candidates = closedFirst ? tabs.filter((tab) => byRecency.slice(0, STAGE_PANES).includes(tab.id)) : tabs;
  const front = paneInFront(candidates, recent[0]);
  if (front === undefined) return { front, shown: [] };
  if (!sideBySide) return { front, shown: [front] };
  const top = [...new Set([front, ...byRecency])].slice(0, STAGE_PANES);
  return { front, shown: ids.filter((id) => top.includes(id)) };
}

// apps/desktop/test/view.test.ts, in place of lines 495-497:
  it("gives a pane no longer among the tabs no place on the stage, so where the pane in front closed the four most recently in front stay and the most recent live one of them has the keyboard, and counts a pane named twice once", () => {
    expect(stageOf(six, [9, 2, 9, 2, 1, 3, 4], true)).toEqual({ front: 4, shown: [1, 2, 3, 4] });
  });
```

```seal
verdict: fixed bb77204
location: `apps/desktop/src/renderer/view.ts`, `apps/desktop/src/renderer/work-item-view.ts`, `apps/desktop/test/view.test.ts`, `seal/threads/1795046889-four-terminals-memory/trail/phases/phase-4.md`, `seal/threads/1795046889-four-terminals-memory/gaps.md`
answer: The finding holds, and the snippet is applied as written, after it was read against `frame/design.md` *Scope* item 1, scenario 2 and every input `work-item-view.ts#showView` hands `stageOf`. With "Side by side" not pressed the snippet takes the path the tree took, so the rule round 4's finding 1 restored stands. With it pressed and a closed pane first in `recent`, the stage keeps the four panes most recently in front, and `paneInFront` picks among those four. The changed case was run before the code and failed on `expected { front: 6, shown: [ 1, 2, 3, 6 ] } to deeply equal { front: 4, shown: [ 1, 2, 3, 4 ] }` (`fix-5/stage-red.txt` in the pass's scratch). `bb77204` also gives that case a second expectation, where one of the four has exited and the most recent live one of them comes in front, and rewords `recentKept`'s docstring, the comment in `dropClosed` and `phase-4.md:23`. `9ec7872` adds two expectations for the snippet's two guards, which no case held: not pressed, a closed pane first in a view of six still brings the most recent live pane of the view, and pressed with no pane ever in front, a view whose four most recent tabs have exited keeps its one live pane in front and on the stage. Six mutants of `stageOf` each read red under `seal mutate` (`fix-5/mutate-stage.txt`), the two guards' mutants on those two expectations. `d8b87bd` adds the pass's narrow run and the changed close to two rows of `gaps.md`, which the finding's `location:` does not name. The narrow run, `test/view.test.ts`, `test/memory.test.ts` and `test/themes.test.ts` in one command, passed 206 cases, and `tsc` over the four files of the window and its cases exited 0. The pass started no app, so the close in the window stays `read` in the wiring, and the sentence at `frame/design.md:131` is handed to the orchestrator with its replacement. One edge is kept as the snippet gives it: where all four panes most recently in front have exited, the most recent of them takes the keyboard although a live pane stands off the stage, since item 1 names the four for the stage.
```

## Confirmations

```seal
confirms: round-4#1
```
What holds: with "Side by side" not pressed, closing the pane in front brings the most recent live pane in front, and no longer the pane in front before it. `dropClosed` hands `recent` to `recentKept` (`work-item-view.ts:213`), which keeps place 0 and every listed pane (`view.ts:574-576`). `showView` then calls `stageOf`, whose `paneInFront` finds the closed pane is no tab and returns the newest live tab (`view.ts:535-538`). Because the new target differs from `front`, which `dropClosed` cleared, `broughtToFront` puts it first (`work-item-view.ts:331-335`, `:84-86`). The closed pane moves to place 1, and the next `dropClosed` takes it out. A work item whose view shows no tab keeps the closed pane first until a pane is started or brought in front, and `stageOf` returns nothing for it meanwhile. That is the same as `lastInFront` before the work. The first `recentKept` case runs round 4's example and holds pane 1 in front. The fix pass's `recent-red.txt` reads it failing on `expected [ 2, 1 ] to deeply equal [ 3, 2, 1 ]`, and its `mutate-recent.txt` reads four mutants, four red. The second case holds the mutant that keeps every pane, which passes the first case, so the two cases do not duplicate each other. `phase-4.md:23`, the comment at `work-item-view.ts:32`, the docstring at `work-item-view.ts:204` and the sentence `gaps.md:18` adds say what the tree does with the control not pressed. With the control pressed, finding 1 above stands. `executed` in the narrow run, and `read`.

```seal
confirms: round-4#2
```
What holds: `changelog.md:9` is the snippet, word for word. Its numbers stand in `apps/desktop/measurements/memory.md`: 257.8 MB is the highest sample of `inbox-after-four` (`memory.md:73`), 156.4 MB that of `inbox` (`memory.md:61`), and `memory.md:100` says the same pair. "Up to four" holds by the carried reading of `stageShows` and by `STAGE_PANES` (`view.ts:542`). `git grep -n -e "only for a pane on screen"` prints only round 4's record. `executed` and `read`.

```seal
confirms: round-4#3
```
What holds: the case of a view with more tabs is gone, and the case that stays carries the snippet's name (`view.test.ts:484`). `git grep -n -e "puts a pressed tab that was not shown in place" -e "most recently in front on the stage of a view"` over `apps` and `seal` prints that case and round 4's record alone. The narrow run passes it. `executed`.

```seal
confirms: round-4#4
```
What holds: `phase-4.md:62` now says the search aimed at `apps/desktop/src/daemon` counts lines in seven files. `git grep -c -i -e claude -- apps/desktop/src/daemon` at `d548df0` printed seven: `adapters/claude.ts`, `adapters/fake.ts`, `agent-events.ts`, `hooks.ts`, `main.ts`, `pane-kinds.ts` and `pty.ts`. `executed`.

What matched: scenarios 12 to 14 at the target. `git grep -n -e 'new Terminal(' -- apps/desktop/src` printed `apps/desktop/src/renderer/work-item-view.ts:106` alone. `git grep -n -e 'process exited' -- apps/desktop/src/renderer` and `git grep -n -i -e claude -- apps/desktop/src/renderer` each printed nothing and exited 1. `executed`.

What matched: the records against the target. `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `pr.md` and `trail/phases/phase-4.md` were read whole at `d548df0`, and `trail/phases/phase-1.md` to `phase-3.md` and the four earlier rounds for their coordinates. Besides the statements finding 1 names, no sentence among them is contradicted by the tree. The diff of `gaps.md` changes two rows in place and adds to each, and takes no row of `## Not verified` out. The row of the suite says the fix pass ran `test/view.test.ts`, `test/memory.test.ts` and `test/themes.test.ts` in one command. The fix pass's `narrow-2.txt` reads 3 files and 206 passed, which is 205 at round 4, plus two `recentKept` cases, less the deleted `stageOf` case. The row says the Korean input case did not run after the fix, and labels the suite, the typecheck and the broad gate not verified with the orchestrator as answerer, which is honest. `pr.md` is unchanged since round 4, and its five quotes stand word for word at the start of the Judgment cells of rows 3, 6, 5, 2 and 1 of *Judgments of the run*. `read` and `executed`.

What matched: the narrow set at the target. `node scripts/test-in-electron.mjs test/view.test.ts`, with the probe beside it, exited 0 with 2 files and 173 passed: 169 in `view.test.ts` and the probe's 4. `executed`.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The Korean input case, which types into a screen of the window built from the changed `work-item-view.ts`. The round makes no start of the app | `apps/desktop/test/korean-input.test.ts` | the orchestrator, at the broad run |
| The desktop suite, the typecheck and the broad gate, and the `tsc` the fix pass reports over four files (contract rule 2) | `seal/config.json` `Broad gate`; `gaps.md:12` | the orchestrator, at the broad run |
| The close of the pane in front in the app, with the control pressed or not. The round read the wiring and ran the pure functions, and made no start | `apps/desktop/src/renderer/work-item-view.ts#dropClosed`, `#showView`; `gaps.md:18` | the owner at the window, or the sealer where it starts the app |
| How two tiles and three look on screen, and how the tiles look in the Letter theme | `apps/desktop/src/renderer/index.html`; `gaps.md`, the rows on the pool's wiring and on the Letter theme | the owner at the window |
| Whether the published number holds for a start a person makes (`frame/questions.md` Q5) | `gaps.md`, the first row | the owner, at the machine |

## Probes

| Command | Result |
|---|---|
| `git clone --no-local` of the worktree, `git checkout d548df0`, `pnpm install --frozen-lockfile --offline` | exit 0 |
| `node scripts/test-in-electron.mjs test/view.test.ts test/test_tmp_close_side_by_side.test.ts`, `OWLERY_MEASURE_MEMORY` unset, from `apps/desktop` | exit 0, 2 files, 173 passed. The probe held the tree's `{ front: 6, shown: [2, 3, 4, 6] }` for the close of the example, `{ front: 2, shown: [2, 3, 4, 5] }` for the logic of `626d036`, and the candidate rule against the tree's `stageOf` and `recentKept` expectations with the one case changed |
| `git grep -c -i -e claude -- apps/desktop/src/daemon` at the worktree | seven files |
| `git grep` of `new Terminal(`, `process exited`, `claude`, `only for a pane on screen`, the two case names, `most recent live` and `recentKept` at the target | as the finding and the confirmations give them |
