# Review round 7: 1795046889-four-terminals-memory

```seal
target: 0d44cee, fixes 3fea853..0d44cee
```

This round reads the diff from `3fea853`, round 6's record, to `0d44cee`. `git show --stat` gives the range as four commits. `5115065` changes `view.ts` (the docstring of `recentKept`), `work-item-view.ts` (the comment at line 212) and `view.test.ts` (one case's name and a third expectation), 9 lines added and 5 removed. `1e2801d` changes `gaps.md` rows 12 and 18 and `trail/phases/phase-4.md:23`. `1cb34f9` adds the five lines of round 6's close block to `round-6.md` and nothing else. `0d44cee` changes one line of `frame/design.md` in place, line 131.

Carried from rounds 1 to 6, not re-derived: where `paneInFront`, `stageOf` and `recentKept` stand (`view.ts:529-582`), that `renderer.ts#takeLists` calls `dropClosed` before `showView`, and round 6's mutant of `stageOf`, written again from its `## Probes` row. Re-derived: every verdict below, among them round 6's reading that "most recent" names a pane by its id in this tree's words (`round-6.md`, *Confirmations*, second paragraph), which finding 1 does not hold. `seal/parity.json` is not declared, `seal/config.json` has no `Pact` key, and `Record language` and `Commit and pull request language` are English, so the work item holds no `pr.<lang>.md`.

The round started the Owlery app zero times. Every run was made in a `git clone --no-local` of the worktree at `0d44cee`, in the round's scratch directory, after `pnpm install --frozen-lockfile --offline` exited 0. The runner, `scripts/test-in-electron.mjs`, runs Electron's binary as Node and opens no window.

## Findings

### 1. The statements of which pane follows a closed pane in front say "most recent" for the pane with the highest id beside "most recent" for the pane last in front, so the clause round 6's fix added reads as a pane the tree does not give

```seal
severity: should
location: `seal/threads/1795046889-four-terminals-memory/frame/design.md:131`, `seal/threads/1795046889-four-terminals-memory/trail/phases/phase-4.md:23`, `seal/threads/1795046889-four-terminals-memory/gaps.md:18`, `apps/desktop/src/renderer/view.ts:571-579`, `apps/desktop/src/renderer/work-item-view.ts:212`, `apps/desktop/test/view.test.ts:500-507`
evidence: executed `git grep -n -o -i -E '.{0,90}most recent[^.;]{0,90}' HEAD` over `view.ts`, `work-item-view.ts`, `view.test.ts` and the work item's `frame/`, `gaps.md`, `changelog.md`, `pr.md` and `trail/phases/`, and `node scripts/test-in-electron.mjs test/view.test.ts` from `apps/desktop` in the clone at `0d44cee`; read `apps/desktop/src/renderer/view.ts:529-579`, `apps/desktop/src/renderer/work-item-view.ts:32`, `apps/desktop/src/renderer/work-item-view.ts:83`, `apps/desktop/test/view.test.ts:470-507`, `seal/threads/1795046889-four-terminals-memory/frame/design.md:131`, `seal/threads/1795046889-four-terminals-memory/trail/phases/phase-4.md:22-23`
regression: round-6#1
```

Why it matters: the unit is the clause `5115065` and `1e2801d` wrote, and `0d44cee` folded, into each statement of what follows a closed pane in front with "Side by side" pressed: "Where none of those four runs, the most recent of them follows" (`design.md:131`). The frame says, by *Scope* item 1 (`design.md:55`), that the four panes most recently in front stand on the stage. The fix stated which of them takes the keyboard where none runs, and the defect came from naming that pane with a word the same sentence uses for another order.

The tree uses "most recent" in two senses. In `paneInFront` and the panes never in front, it is the pane with the highest id, the one the daemon started last (`view.ts:17`, `:531-532`, `:551`). In `recent`, it is the pane last in front (`view.ts:547`, `:572-574`, `work-item-view.ts:32`, `:83`, `phase-4.md:22`). `design.md:131` holds both in one bullet: `recentKept` keeps "the most recent one", the pane last in front, and then "the most recent live pane" follows, by id. The new clause names "the most recent of them" right after "the four panes most recently in front". A reader takes it as the one of those four most recently in front, and the tree gives the one with the highest id.

The two readings give different panes for the input the new expectation pins. `stageOf(fourExited, [9, 1, 2, 3, 4], true)` returns `{ front: 4, shown: [1, 2, 3, 4] }` (`view.test.ts:506-507`, executed: 169 passed). Pane 1 was the last in front before pane 9, so the reading by order in front gives pane 1, and the tree gives pane 4, the one of the four in front longest ago. The live clause beside it splits the same way. `stageOf(exited, [9, 2, 1, 3, 4], true)` gives pane 3 (`view.test.ts:504`), where the pane of the four most recently in front that runs is pane 2. The sentence without the control pressed splits too. `stageOf(six, [9, 2, 1, 3, 4], false)` gives pane 6 (`view.test.ts:474`), where the live pane most recently in front is pane 2, which is the outcome round 4's finding 1 took out. Round 6 weighed the live clause and wrote no finding, on the ground that "In this tree's words a pane is 'most recent' by its id". That ground stands on half of the tree's uses, and the round does not carry it. The sealer reads `design.md:131` against the tree, and a sentence that names pane 1 where the tree gives pane 4 is the wrong sentence an agent acts on of `skills/code-review/SKILL.md` *The record*.

The same clause also says "although a live pane stands off the stage" (`design.md:131`, `phase-4.md:23`). Read as a statement of the input, it is not true of every such close: in a view whose panes have all exited, or a view of four tabs or fewer, no live pane stands off the stage. Read as a concession, it is the tree's outcome. The snippet writes "even where", which keeps only the second reading.

The list below was made by the `git grep` of the `evidence:` line, which prints every "most recent" in the window's decisions, their wiring, their cases and the work item's records. Each line it printed was sorted by the sense it holds. A statement is in the snippet where it names the pane that follows a close in front and its sentence or paragraph also holds the other sense. It leaves the lines whose sentence holds one sense alone, or whose other sense is contradicted in place: `view.ts:22`, `:37`, `:531-532`, `:547-552`, `work-item-view.ts:32`, `:83`, `:204`, `view.test.ts:452`, `:458`, `:473`, `:491-495`, `:512`, `phase-4.md:22` and `:24`, `phase-3.md:59`, and the sentence of `gaps.md:18` on the fix pass of round 4, "the window then brings the most recent live pane in front". Three sentences of `phase-4.md:23` that state the rule with the control not pressed are left as well. "So where the pane with the keyboard closes, the most recent live pane comes in front, as before the work" names the rule from before `recent` existed, and the same paragraph says the pane in front before the closed one coming in front was the defect. The sentence at `design.md:131` is the orchestrator's to fold, as `0d44cee` was, and the fix pass owes the rest. The change is to comments, a case's name, its comments and the records, so no behaviour changes and no case is owed.

```text
seal/threads/1795046889-four-terminals-memory/frame/design.md:131, in place of the three sentences from "Which closed panes stay" to "the pane in front stands on it.":
Which closed panes stay among the panes that were in front is `view.ts#recentKept`: the first of them, the pane last in front, stays, so the live pane with the highest id follows a closed pane that was in front, and not the pane in front before it. Where "Side by side" is pressed, `view.ts#stageOf` gives that closed pane no place: the four panes most recently in front stay on the stage, and the live pane of those four with the highest id follows. Where none of those four runs, the one of them with the highest id follows, an exited pane, even where a live pane stands off the stage, because *Scope* item 1 names the four for the stage and the pane in front stands on it.

seal/threads/1795046889-four-terminals-memory/trail/phases/phase-4.md:23, in place of "and the most recent live pane of those four comes in front. Where none of those four runs, the most recent of them comes in front, an exited pane, although a live pane stands off the stage.":
and the live pane of those four with the highest id comes in front. Where none of those four runs, the one of them with the highest id comes in front, an exited pane, even where a live pane stands off the stage.

seal/threads/1795046889-four-terminals-memory/gaps.md:18, in place of "and the most recent live one of them comes in front, or the most recent of them where none of them runs.":
and the live one of them with the highest id comes in front, or the one of them with the highest id where none of them runs.
```

```ts
// apps/desktop/src/renderer/view.ts:571-579, the docstring of `recentKept`:
/**
 * The panes that were in front in a view, the most recent first, once the
 * daemon lists only `listed`. A pane it no longer lists leaves, except the
 * first one: that one stays as the pane last in front, so `paneInFront`
 * finds it is no tab and gives the live pane with the highest id, which
 * `stageOf` takes from the four most recently in front where "Side by side"
 * is pressed, or the one of those four with the highest id where none of
 * them runs. Were it taken out, the pane in front before it would come in
 * front, an exited one included.
 */

// apps/desktop/src/renderer/work-item-view.ts:212, in place of the comment:
  // The closed pane that was in front stays as the last in front, so the live pane with the highest id follows it, and with "Side by side" pressed the live one of the four most recently in front with the highest id, or the one of the four with the highest id where none of them runs (./view, `recentKept` and `stageOf`).

// apps/desktop/test/view.test.ts:500-507, in place of the case's name and its two comments:
  it("gives a pane no longer among the tabs no place on the stage, so where the pane in front closed the four most recently in front stay and the live one of them with the highest id has the keyboard, or the one of them with the highest id where none runs, and counts a pane named twice once", () => {
    expect(stageOf(six, [9, 2, 9, 2, 1, 3, 4], true)).toEqual({ front: 4, shown: [1, 2, 3, 4] });
    // Pane 4 has exited, so pane 3, the live one of the four with the highest id, has the keyboard, and not pane 2, the last in front before pane 9.
    const exited = [session(1), session(2), session(3), session(4, { alive: false }), session(5), session(6)];
    expect(stageOf(exited, [9, 2, 1, 3, 4], true)).toEqual({ front: 3, shown: [1, 2, 3, 4] });
    // Panes 1 to 4 have exited, so pane 4, the highest id of the four, has the keyboard, and not pane 1, the last in front before pane 9, nor panes 5 and 6, which run off the stage.
    const fourExited = [session(1, { alive: false }), session(2, { alive: false }), session(3, { alive: false }), session(4, { alive: false }), session(5), session(6)];
    expect(stageOf(fourExited, [9, 1, 2, 3, 4], true)).toEqual({ front: 4, shown: [1, 2, 3, 4] });
  });
```

```seal
verdict: fixed 08bc078
answer: The finding holds, and the snippet is applied as written, after it was read against `view.ts#paneInFront` and `view.ts#stageOf`: `paneInFront` sorts its tabs by id and gives the live one with the highest id, or the highest id where none is alive, and `stageOf` hands it the four most recently in front where the first of `recent` is closed, so "with the highest id" is the tree's choice in each rewritten statement. `08bc078` holds the docstring of `view.ts#recentKept`, the comment at `work-item-view.ts:212`, and the name and the two comments of the case at `view.test.ts:500-507`; no expectation and no code changes. `8e1b5b8` holds the two sentences of `trail/phases/phase-4.md:23` and the clause in the row of `gaps.md:18`, and adds this pass's run to the row of `gaps.md:12`. `frame/design.md:131` is not the pass's to write, and its three sentences are handed to the orchestrator to fold as the snippet gives them. The lines the finding leaves are left. `node scripts/test-in-electron.mjs test/view.test.ts` from `apps/desktop` exited 0 at `8e1b5b8` with 1 file and 169 passed (`fix-7/narrow.txt` in the pass's scratch), `executed`. No case is new, so none was owed a red run. The pass started the app zero times.
```

## Confirmations

```seal
confirms: round-6#1
```
What holds: the edge round 6 found is stated and pinned. With the control pressed, where the four panes most recently in front have all exited, the tree gives the keyboard to one of them, and the SDD set now says so in `design.md:131`, `phase-4.md:23` and `gaps.md:18`, with the comment at `work-item-view.ts:212` and the docstring of `recentKept` (`view.ts:574-577`). `git diff 3fea853 0d44cee` shows each statement and the case's third expectation written word for word as round 6's snippet gave them. The close's claim that `5115065` also rewrote a sentence the finding did not name, the docstring of `recentKept`, holds: it was the sixth statement of the fact, and the docstring of `stageOf` (`view.ts:553-555`), which names `paneInFront`'s fallback, needed none. The third expectation (`view.test.ts:505-507`) holds what no other expectation of the `stageOf` group holds. The round wrote round 6's mutant into the clone, with the candidates the live panes of the four and every tab where none of the four runs. One case failed, at `view.test.ts:507`, on `expected { front: 6, shown: [ 1, 2, 3, 6 ] } to deeply equal { front: 4, shown: [ 1, 2, 3, 4 ] }`, and 168 passed. That is the red the close reports from `seal mutate`, and the fix pass's `fix-6/mutate-four-exited.txt` shows the same line. `git checkout -- src/renderer/view.ts` put the clone back, and its `git status --short` printed nothing. `executed` and `read`. Finding 1 above stands on the words of the six statements, not on what they say the tree does.

What matched: the records against the target. `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md` and `pr.md` were read whole at `0d44cee`, `trail/phases/phase-4.md:18-26` for the line the range changes, and the six earlier rounds for their coordinates. Besides the statements finding 1 names, no sentence among them is contradicted by the tree. `frame/plan.md`, `frame/questions.md`, `changelog.md`, `pr.md` and `routing.md` are unchanged in the range, and none of them says which pane takes the keyboard at a close. `pr.md`'s five quotes stand word for word at the start of the Judgment cells of rows 3, 6, 5, 2 and 1 of `frame/plan.md` *Judgments of the run* (`plan.md:98-103`). The diff of `gaps.md` changes rows 12 and 18 in place and adds to each, so no row of `## Not verified` leaves. `read`.

What matched: the row of `gaps.md:12`. It says the fix pass of round 6 "changed one case and two comments, ran `test/view.test.ts`, and ran no `tsc`". The diff of `5115065` holds one case, the comment at `work-item-view.ts:212` and the docstring of `recentKept`, and the fix pass's `fix-6/narrow.txt` reads 1 file and 169 passed. The count matches round 6's 169, since the pass added an expectation and no case. "None of the three started the app" names the fix passes of rounds 4, 5 and 6, the three sentences before it. The row labels the suite, the typecheck and the broad gate not verified, with the orchestrator as answerer, which is honest. The new expectation builds `session(n, { alive: false })` as the one at `view.test.ts:503` does, so it brings no type the file did not already hold; that is `read`, and the typecheck stays the orchestrator's.

What matched: the narrow set at the target. `node scripts/test-in-electron.mjs test/view.test.ts` exited 0 with 1 file and 169 passed. `executed`.

## Not judged

| What | Location | Who answers |
|---|---|---|
| With the control pressed, where the pane in front closes, which pane a person wants to have the keyboard: the live pane of the four with the highest id, as the tree gives, the pane of the four most recently in front, or a live pane off the stage, which would break *Scope* item 1's four. Round 6 raised it and nobody has answered it. Finding 1 asks only that the statements name the tree's choice in one reading | `apps/desktop/src/renderer/view.ts#stageOf`; `seal/threads/1795046889-four-terminals-memory/frame/design.md:131` | the owner at the window |
| The Korean input case, which types into a screen of the window built from `view.ts` and `work-item-view.ts`. The round makes no start of the app | `apps/desktop/test/korean-input.test.ts` | the orchestrator, at the broad run |
| The desktop suite, the typecheck and the broad gate (contract rule 2) | `seal/config.json` `Broad gate`; `gaps.md:12` | the orchestrator, at the broad run |
| The close of the pane in front in the app, with the control pressed or not. The round ran the pure functions and made no start | `apps/desktop/src/renderer/work-item-view.ts#dropClosed`, `#showView`; `gaps.md:18` | the owner at the window, or the sealer where it starts the app |

## Probes

| Command | Result |
|---|---|
| `git clone --no-local` of the worktree, `git checkout 0d44cee`, `pnpm install --frozen-lockfile --offline` | exit 0 |
| `node scripts/test-in-electron.mjs test/view.test.ts`, `OWLERY_MEASURE_MEMORY` empty, from `apps/desktop` | exit 0, 1 file, 169 passed |
| The same command with `candidates` in `stageOf` made the live panes of the four, and every tab where none of the four runs, then `git checkout -- src/renderer/view.ts` | exit 1, 168 passed and 1 failed, at `view.test.ts:507`, on `expected { front: 6, shown: [ 1, 2, 3, 6 ] } to deeply equal { front: 4, shown: [ 1, 2, 3, 4 ] }`. The clone's `git status --short` printed nothing after the checkout |
| `git grep -n -o -i -E '.{0,90}most recent[^.;]{0,90}' HEAD` over the files finding 1's `evidence:` line names, at the worktree | exit 0, 57 matches, each sorted by sense in finding 1 |
