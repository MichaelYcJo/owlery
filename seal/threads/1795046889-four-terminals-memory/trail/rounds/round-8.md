# Review round 8: 1795046889-four-terminals-memory

```seal
target: 4e0d560, fixes f6083d8..4e0d560
```

This round reads the diff from `f6083d8`, round 7's record, to `4e0d560`. `git log` gives the range as four commits. `08bc078` changes the docstring of `view.ts#recentKept`, the comment at `work-item-view.ts:212`, and the name and two comments of one `stageOf` case (`view.test.ts:500-507`), 10 lines added and 10 removed, with no expectation changed. `8e1b5b8` changes `gaps.md` rows 12 and 18 and `trail/phases/phase-4.md:23`. `9759b1c` adds the five lines of round 7's close block to `round-7.md` and nothing else. `4e0d560` changes one line of `frame/design.md` in place, line 131.

Carried from rounds 1 to 7, not re-derived: where `paneInFront`, `stageOf` and `recentKept` stand (`view.ts:529-582`), that `renderer.ts#takeLists` calls `dropClosed` before `showView`, and that the window before this work kept the closed pane as `lastInFront`. Round 7's `git grep` was run again at the target. Re-derived: every verdict below, among them round 7's sorting of which lines finding 1 leaves, which finding 1 below does not hold in full. `seal/parity.json` is not declared, `seal/config.json` has no `Pact` key, and `Record language` and `Commit and pull request language` are English, so the work item holds no `pr.<lang>.md`.

The round started the Owlery app zero times. Every run was made in a `git clone --no-local` of the worktree at `4e0d560`, in the round's scratch directory, after `pnpm install --frozen-lockfile --offline` exited 0. The runner, `scripts/test-in-electron.mjs`, runs Electron's binary as Node and opens no window.

## Findings

### 1. Three record sentences and one case name still call the pane with the highest id "the most recent live pane", beside "most recent" for the pane last in front, and the fix now gives the same choice a second name in the same paragraph

```seal
severity: should
location: `seal/threads/1795046889-four-terminals-memory/trail/phases/phase-4.md:23`, `seal/threads/1795046889-four-terminals-memory/gaps.md:18`, `apps/desktop/test/view.test.ts:512`
evidence: executed `git grep -n -o -i -E '.{0,60}most recent[^.;]{0,60}' HEAD` over `apps/desktop/src/renderer/view.ts`, `work-item-view.ts`, `apps/desktop/test/view.test.ts` and the work item's `frame/`, `gaps.md`, `changelog.md`, `pr.md` and `trail/phases/` (48 lines), and `node scripts/test-in-electron.mjs test/view.test.ts` from `apps/desktop` in the clone at `4e0d560`; read `apps/desktop/src/renderer/view.ts:529-582`, `apps/desktop/test/view.test.ts:470-516`, `seal/threads/1795046889-four-terminals-memory/trail/phases/phase-4.md:23`, `seal/threads/1795046889-four-terminals-memory/gaps.md:18`, `seal/threads/1795046889-four-terminals-memory/trail/rounds/round-5.md:15`, and `git show ea78b7b:apps/desktop/src/renderer/view.ts` at `paneInFront`
reopens: round-7#1
```

Why it matters: round 7's close says "The lines the finding leaves are left", and the fix pass applied round 7's snippet word for word. The close does not hold in full, because round 7's list of lines left holds three statements of its own class. Round 7 drew the class as each statement that "names the pane that follows a close in front and its sentence or paragraph also holds the other sense". It then left `gaps.md:18`'s "the window then brings the most recent live pane in front" as a sentence of one sense, although its row holds "the four panes most recently in front". It left the `phase-4.md:23` sentence "So where the pane with the keyboard closes, the most recent live pane comes in front, as before the work", which stands one sentence after "keeps a closed pane in `recent` where it is the most recent one". It did not name the sentence "That fix brought the most recent live pane of the whole view onto the stage with the control pressed" of the same paragraph either way.

The fix made the leftovers worse. Before it, both cases in each paragraph said "most recent". Now `phase-4.md:23` names the choice with the control not pressed "the most recent live pane", and two sentences later names the choice with it pressed "the live pane of those four with the highest id". `gaps.md:18` does the same in one row. Both are the one choice of `paneInFront`, which sorts by id (`view.ts:537-538`). A reader who meets two names reads two rules, as `skills/writing-style/SKILL.md` *에이전트와 검사가 읽는 글은 한 가지로만 읽히게 쓴다* states: one thing called by two words is read as two things. The sealer reads both files against the tree.

The readings give different panes. `stageOf(six, [9, 2, 1, 3, 4], false)` gives pane 6 (`view.test.ts:474`, executed: 169 passed). Read as the live pane most recently in front, the sentence gives pane 2, which is the outcome round 4's finding 1 took out. The sentence on round 4's fix splits the same way. That fix gave the live pane with the highest id of the whole view, which round 5's finding 1 names as "a pane that was not among the four most recently in front" (`round-5.md:15`). Read by order in front, the same view gives pane 2, which already stands among the four, so the sentence would give round 5 nothing to change. "As before the work" holds only by id. The window before this work kept the closed pane as `lastInFront`, and `paneInFront` at `ea78b7b` then gave the highest live id.

The case name at `view.test.ts:512`, "keeps a closed pane that was the most recent, so the most recent live pane comes in front", holds both senses in one sentence. The `stageOf` case of the same file that the fix renamed (`view.test.ts:500`) now says "with the highest id" for the same choice. The case holds a fact `frame/design.md:131` states, so its name is not exempt as the name of a case that holds no frame fact.

The list was made by the `git grep` of the `evidence:` line, which prints every "most recent" in the window's decisions, their wiring, their cases and the work item's records. Each of the 48 lines was sorted by the sense it holds. The snippet reaches each statement that names the pane following a close in front, or the pane round 4's fix brought, by "most recent" in the sense of the highest id, where its sentence or paragraph also uses "most recent" for order in front. The lines below are left, each for the reason given.

- `view.ts:17`, `:22`, `:37` and `:758`, and `view.test.ts:123` and `:768`, are other decisions.
- `view.ts:531-532`, `view.test.ts:452` and `:458` (`paneInFront`) hold only the sense of the id. They name order in front as "last in front".
- `view.ts:547-554` (`stageOf`) holds both senses. It names the fill order of tabs never in front and not a close.
- `view.test.ts:473` holds the sense of the id alone, and "whichever were in front before" takes out the other reading.
- `view.test.ts:491-495` names tabs that were never in front, which have no order in front.
- `work-item-view.ts:32`, `:83` and `:204`, `view.ts:572` and `:576`, `view.test.ts:486` and `:500`, `phase-4.md:22` and `:24`, `design.md:55`, `:104` and `:131`, and `changelog.md:6` hold only order in front.
- `phase-3.md:59` describes a view after a reload, with no close.
- `phase-4.md:41` and `design.md:174` name a mutant and a case.

The change is to two record sentences, one row's clause and a case's name, so no behaviour changes and no case is owed.

```text
seal/threads/1795046889-four-terminals-memory/trail/phases/phase-4.md:23, in place of "So where the pane with the keyboard closes, the most recent live pane comes in front, as before the work.":
So where the pane with the keyboard closes, the live pane with the highest id comes in front, and not the pane in front before it, as before the work.

seal/threads/1795046889-four-terminals-memory/trail/phases/phase-4.md:23, in place of "That fix brought the most recent live pane of the whole view onto the stage with the control pressed,":
That fix brought the live pane of the whole view with the highest id onto the stage with the control pressed,

seal/threads/1795046889-four-terminals-memory/gaps.md:18, in place of "so that the window then brings the most recent live pane in front is `read` in the wiring:":
so that the window then brings the live pane with the highest id in front is `read` in the wiring:
```

```ts
// apps/desktop/test/view.test.ts:512, in place of the case's name:
  it("keeps a closed pane that was the most recent, so the live pane with the highest id comes in front and not the pane in front before it", () => {
```

## Confirmations

What matched: round 7's snippet stands in the tree word for word, in every place it named. Each replacement line of the snippet was found by `grep -F`, once each, in `frame/design.md`, `trail/phases/phase-4.md` and `gaps.md`, and once by `grep -x -F` at `work-item-view.ts:212`. The docstring of `recentKept` (`view.ts:571-580`) and the case at `view.test.ts:500-508` match the snippet's lines with no difference under `diff`. `git diff -U0 f6083d8 4e0d560 -- apps/desktop/test/view.test.ts` changes no `expect` line, and `apps` changes by 10 lines added and 10 removed, all comments and one case name. The close's "no expectation and no code changes" holds. `executed`.

What matched: the statements the fix wrote, against the code. `recentKept` keeps the entry at place 0 whatever the daemon lists (`view.ts:582`). With the control not pressed, `paneInFront` finds that entry is no tab and returns the live tab with the highest id, or the highest id where none runs (`view.ts:535-538`). With it pressed and that entry closed, `stageOf` hands `paneInFront` the first four of `byRecency` (`view.ts:562-564`). So "the first of them, the pane last in front, stays", "the live pane with the highest id follows", and "the one of them with the highest id follows" where none of the four runs, in `design.md:131` and the docstring, are the tree's. "And not the pane in front before it" holds at `view.test.ts:474`, where pane 6 comes in front and pane 2, the last in front before pane 9, does not. Each new comment of the case at `view.test.ts:502` and `:505` names its own input rightly: pane 2 and pane 1 are the last in front before pane 9 in `[9, 2, 1, 3, 4]` and `[9, 1, 2, 3, 4]`. `read`, and the run below is `executed`.

What matched: the fold. `4e0d560` changes only the three sentences of `design.md:131` that the snippet named, and the rest of the bullet is as at `0d44cee`. The design's coordinates and statements stand for the tree outside the sentences finding 1 names. `read`.

What matched: the records against the target. `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md` and `pr.md` were read whole at `4e0d560`, as were `trail/phases/phase-4.md` and the seven earlier rounds for their coordinates. Besides the statements finding 1 names, no sentence among them is contradicted by the tree. `frame/plan.md`, `frame/questions.md`, `changelog.md`, `pr.md` and `routing.md` are unchanged in the range. `pr.md`'s five quotes stand word for word at the start of the Judgment cells of rows 1, 2, 5, 6 and 3 of `frame/plan.md` *Judgments of the run* (`plan.md:98-103`). The diff of `gaps.md` changes rows 12 and 18 in place, so no row of `## Not verified` leaves. `read`.

What matched: the row of `gaps.md:12`. It says the fix pass of round 7 "reworded that case's name and comments and the same two comments, ran `test/view.test.ts`, and ran no `tsc`". `08bc078` holds the name and the two comments of the case round 6 changed, the comment at `work-item-view.ts:212` and the docstring of `recentKept`, the two comments round 6 changed. The fix pass's `fix-7/narrow.txt` reads 1 file and 169 passed. "None of the four" names the fix passes of rounds 4 to 7, and the row leaves the suite, the typecheck and the broad gate to the orchestrator, which is honest. The pass changed comments and a string, so the typecheck has nothing new to read. `read`.

What matched: the narrow set at the target. `node scripts/test-in-electron.mjs test/view.test.ts` exited 0 with 1 file and 169 passed. `executed`.

## Not judged

| What | Location | Who answers |
|---|---|---|
| With the control pressed, where the pane in front closes, which pane a person wants to have the keyboard: the live pane of the four with the highest id, as the tree gives, the pane of the four most recently in front, or a live pane off the stage, which would break *Scope* item 1's four. Rounds 6 and 7 raised it and nobody has answered it. Finding 1 asks only that the records name the tree's choice with one word | `apps/desktop/src/renderer/view.ts#stageOf`; `seal/threads/1795046889-four-terminals-memory/frame/design.md:131` | the owner at the window |
| The Korean input case, which types into a screen of the window built from `view.ts` and `work-item-view.ts`. The round makes no start of the app | `apps/desktop/test/korean-input.test.ts` | the orchestrator, at the broad run |
| The desktop suite, the typecheck and the broad gate (contract rule 2) | `seal/config.json` `Broad gate`; `gaps.md:12` | the orchestrator, at the broad run |
| The close of the pane in front in the app, with the control pressed or not. The round ran the pure functions and made no start | `apps/desktop/src/renderer/work-item-view.ts#dropClosed`, `#showView`; `gaps.md:18` | the owner at the window, or the sealer where it starts the app |

## Probes

| Command | Result |
|---|---|
| `git clone --no-local` of the worktree, `git checkout 4e0d560`, `pnpm install --frozen-lockfile --offline` | exit 0 |
| `node scripts/test-in-electron.mjs test/view.test.ts`, `OWLERY_MEASURE_MEMORY` empty, from `apps/desktop` in the clone | exit 0, 1 file, 169 passed (`proofer-8/narrow.txt` in the round's scratch) |
| `git grep -n -o -i -E '.{0,60}most recent[^.;]{0,60}' HEAD` over the files finding 1's `evidence:` line names, at the worktree | exit 0, 48 lines (`proofer-8/most-recent.txt`), each sorted by sense in finding 1 |
| `grep -c -F` of each replacement line of round 7's snippet in its file, `grep -c -x -F` of the comment in `work-item-view.ts`, and `diff` of the docstring and the case against the snippet's lines | 1 for each line, and `diff` exited 0 for both |
| `git diff -U0 f6083d8 4e0d560 -- apps/desktop/test/view.test.ts`, counting changed `expect` lines | 0 |
