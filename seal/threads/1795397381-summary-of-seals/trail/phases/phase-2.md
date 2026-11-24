# Phase 2: 1795397381-summary-of-seals

## What this phase found

**The frame holds for this phase.** Each unit `frame/design.md` *Data & interfaces* names for the summary stands in `apps/desktop/src/renderer/view.ts` at the build's base `39babf8`: `changesSince` with the line that reads a look without a seal with the present seal, `summarySentence`, `summaryHead`, `summaryControls`, `inboxLine`, `branchLine`, `sealShown`, the constant `SEAL_BROKEN` and `shortCommit` (read). The callers the frame names for phase 3 stand too: `renderer.ts` works the changes out once at `ready`, `summary.ts#showSummary` draws `held.changes`, and `sidebar.ts` counts them (read). No departure from the frame was needed in this phase. Phase 1's two departures stand as `trail/phases/phase-1.md` states them, and this phase builds on both.

**Phase 1's open gap is closed in the pure functions, and the window already takes it.** `trail/phases/phase-1.md` *What phase 2 meets* said that a `ready` with no `seal` against a look that holds the work item `sealed` opened the summary. `changeOf` now reads the present side without a reading with the look's seal where it compares the two states, and the case "reads a side that carries no seal with the other side's seal" pins it. `renderer.ts` still calls `changesSince` at `ready`, so the window takes the twin from this phase on, before phase 3 reworks the callers (read).

**Decisions made while building, each with its grounds.**

- **`sealSinceLook` is the one function that says what changed of a seal.** It answers `given`, `broke` or null for a look's copy of a work item, or undefined where the look does not hold it, and the present work item. It returns null where either side carries no `seal`, where the present seal is null, where the look held the same state at the same commit, and where the seal broke on a work item whose pull request merged. Judged against `frame/design.md` *Scope* items 3 to 5 and the table of item 3. A seal given on a work item whose pull request merged is still `given`, since *Scope* item 3 names the broken seal alone as the merged case that says nothing.
- **`changeOf` gives one work item's change and whether anything differs, and `changesSince` and `changesOf` are built on it.** `changesSince` keeps the changes that differ. `changesOf` keeps every work item the set names that the lists still hold, whether or not it differs, so its sentence then says its state alone. Both put the changes in the summary's order. Judged against `frame/design.md` *Data & interfaces*, the second and third functions of `view.ts`, and *Scope* item 12. The names are the build's, as *Data & interfaces* leaves them.
- **The changed set is a `ChangedSet` of `ids` and `unread`.** `changedSet` gives the ids of the changes at a load and every work item the load carried without a `seal`. `changedSetAfter` takes new lists. Each work item of `unread` that the lists carry with a reading leaves `unread`, and it joins `ids` where `sealSinceLook` says its seal was given or broke and `ids` does not name it already. A work item the lists do not hold, or carry still without a reading, stays in `unread`. Judged against *Scope* item 13 and *Data & interfaces*, which has `shared.ts#held` keep both lists in phase 3. `unread` names a work item new since the look as well, although `ids` already names it. `changedSetAfter` then names it once, and a case pins that.
- **A change's `sealSince` field carries what changed of the seal.** `summarySentence`, `summaryHead` and `summaryOrder` read it, and `summaryControls` reads the change's `session` beside its work item. Judged against *Data & interfaces*, the last function of `view.ts`.
- **The main control's hint stays "Enter opens the first that needs you." under both labels.** The hint names what Enter does, and both labels open one line that waits. Judged against `docs/design.md` *The voice of the window's words*, where a button is the act it does.
- **A work item with no state beside a counted seal is left out of the sentence's count.** "1 sealed" is said for one seal given and one work item with no state, as "1 needs you" is said today beside a work item with no state. The words "N work items changed" stay for changes of which none has a counted seal or a state. Judged against the docstring of `summarySentence` at `39babf8`.

**The words `frame/questions.md` Q5 leaves to this phase.** The phase took the words of `frame/design.md` *Data & interfaces*, the table of the window's words, unchanged:

| Where | Words |
|---|---|
| The summary's sentence, a seal given | "1 sealed", "2 sealed" |
| The summary's sentence, a seal that broke | "1 seal broken", "2 seals broken" |
| A change's sentence, a seal given | "Sealed at 3f2a9c1 after 2 review rounds.", "Sealed at 3f2a9c1 after 1 review round.", "Sealed at 3f2a9c1." |
| A change's sentence, a seal that broke | "Seal broken." and the seal's sentence as the daemon sends it, backticks included, or "Seal broken." alone where the daemon sent none |
| The main control, a line that waits on a question, a call or a pane | "Answer the first question" |
| The main control, a line that waits for another reason | "Open the first that needs you" |

Each is read against `docs/design.md` *The voice of the window's words*. "Seal broken" is two words and is `view.ts`'s constant `SEAL_BROKEN`, which the line, the notification and the seal's place already say. The counts follow the count's number, as "1 needs you, 2 working" does. "Open the first that needs you" is the act the button does. A "Seal broken." sentence that holds the daemon's backticks is the form #44's `gaps.md` *Not done* leaves to the review of the screenshots, which phase 3 makes. Q5's row is the orchestrator's to fold.

**How each new case was seen red.** Executed, with the new cases in `apps/desktop/test/view.test.ts` and `view.ts` as it stood at `39babf8`, before any source change: `node scripts/test-in-electron.mjs test/view.test.ts` through the Electron lock exited 1, with 11 cases failed and 481 passed. The line numbers below are the file's at that run. At `c2e64d7` the lines up to 2128 stand where they did, and lines 2155, 3263 and 3270 stand at 2159, 3267 and 3274.

- Under `changesSince`: the pin of a whole change failed at line 1846 on the new field `sealSince`. The seal given failed at line 1947, with `[1, undefined, "Finished."]`. The seal broken failed at line 1958, with `[1, undefined, "Needs you."]`. The table failed at line 1982, at its first row, "null to sealed at 3", on the `changesSince` call. The side without a reading failed at line 1999, the present side, where the old code opened a change. The order failed at line 2017, with the old order of the inbox's groups.
- Under "the changed set of a load": both cases failed with `TypeError: changedSet is not a function`, since the function did not exist yet.
- Under `summarySentence`: the new case failed at line 2155, with "1 needs you" for "1 seal broken".
- Under `summaryControls`: both new cases failed, at lines 3263 and 3270, where the old main control opened the line with the broken seal and said "Answer the first question".

Three assertions were green against the old code, and each was shown red by `seal mutate` against the guard it names. The look-side half of the case of a side without a reading, at line 2000, went red with `sealSinceLook`'s guard of a look without `seal` removed. That run also turned #44's case at line 1921 and the changed set's case at line 2128 red. The present-side twin, removed alone, turned line 1999 red. The case that a work item new since the look is named once in the set, added at `c2e64d7`, went red at line 2132 with the check that `ids` does not name it already removed, giving `{ ids: [1, 1] }`. One assertion was added after the red run and before the code: the line that waits on a failed check of its pull request, under `summaryControls`, at line 3277 of `c2e64d7`. It went red there with a failed check counted as a wait on an answer, by a `seal mutate` run after the commit. The pins this phase rebuilt, the cases under `summaryControls` and `summarySentence` and the helper of `summaryHead`, are the ones `frame/design.md` *Removes* names.

**Mutation runs.** Executed with `seal mutate` after the commit `c2e64d7`, against `test/view.test.ts` whole with `--bail=1`, through the Electron lock. One call held 25 mutants of `view.ts`. Each went red and none survived. The mutants:

- `sealSinceLook`: the guard of a look without `seal` turned to `false`; the check of the same commit taken off; the check of the same state taken off; the guard of a merged pull request taken off; the answer turned to `given` for every seal.
- `sealSaid`: the count of rounds read at 0; the count said in the plural for one; the seal's sentence left out after "Seal broken."; the commit said whole.
- `changeOf`: the present-side twin taken off; `differs` read without the seal.
- `summaryOrder`: the broken seals put before the seals given.
- `changesOf`: the filter of the set's ids taken off.
- `changedSet`: `unread` read as `seal == null`, which takes null in.
- `changedSetAfter`: a work item without a reading counted as read; the check that `ids` names it already taken off; every reading joined; `unread` left whole.
- `summarySentence`: "seal" said for several; the seals counted again among the states.
- `waitsOnAnAnswer`: the question, the call and the pane each taken off in turn.
- `summaryControls`: the first line that waits opened whatever it waits on; "Answer the first question" said for every line.

Three mutants were run again alone to read their failing lines, as the paragraph above states.

**The narrow run.** Executed, at `c2e64d7`, as one command from `apps/desktop` through the Electron lock with `OWLERY_BACKGROUND=1`: `node scripts/test-in-electron.mjs test/view.test.ts test/decisions-and-questions.test.ts`. It exited 0: 493 of 493 cases passed, and `test/decisions-and-questions.test.ts` started the built app once in the background. The set is the one test file the phase changed, which holds every case of scenarios 3 to 11, and the one built-app file whose run folder holds a look, so that its app opens on the summary and its case reads the summary's sentence, lines and main control. `test/work-item-menu.test.ts` and `test/terminal-basics.test.ts` import constants of `view.ts` that this phase did not change. Those two, and the other built-app files that load `view.ts` through the built page, were not run, and `gaps.md` holds them. `pnpm run typecheck` in `apps/desktop` exited 0 before the commit `cd12289`, and again at `c2e64d7`.

**What phase 3 meets.** The renderer still keeps `held.changes` from `ready`, and `summary.ts` and `sidebar.ts` read it, so a line of the summary still keeps the seal of the load until phase 3 (`frame/design.md` *Scope* items 10, 12 and 14). `changedSet`, `changedSetAfter` and `changesOf` are there for `renderer.ts`, `shared.ts#held` and `summary.ts`, and no window code calls them yet. `summaryControls` now takes the change's `session`. `held.changes` carries it already, and so do the changes `changesOf` gives.
