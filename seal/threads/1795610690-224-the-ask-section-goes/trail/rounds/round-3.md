# Review round 3: 1795610690-224-the-ask-section-goes

```seal
target: d2585dd1, fixes 874b2ed3..d2585dd1
```

This is a verifying round. Its target is `d2585dd1`, the commit that records round 2's closes. The fixes it answers stand after round 2's record (`874b2ed3`): the orchestrator's rewrite of the *Judgments of the run* row (`c8bb5a4e`), and the fix pass's `39302f3c`, which rewrites `drawMachineDialog`'s doc comment and closes the row at `gaps.md:12`. The work item's records were read whole at `d2585dd1`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `pr.md`, `trail/phases/` and `trail/rounds/round-1.md` and `round-2.md`. Since `128e7dbd`, no commit changed code beyond the comment in `renderer.ts` (executed, `git diff --stat 874b2ed3 d2585dd1`). So this round ran no test, as the coordinator's message asked, and as no close needed one.

Carried from round 2 and not established again: where `drawMachineDialog`, `takeLists` and `showChainList` stand, and that the merge's resolution holds (round 2, *What matched*). Every verdict below was reached again.

## Findings

### 1. The judgment's grounds say the diff left `showChainList`'s branch for a session's line as it was but for the list's element, and the diff also took the permission card out of that branch

```seal
severity: should
location: `seal/threads/1795610690-224-the-ask-section-goes/frame/plan.md:62`
evidence: executed `git diff ab7a5730 d2585dd1 -- apps/desktop/src/renderer/work-item-view.ts`; read `apps/desktop/src/renderer/work-item-view.ts:795-826`
regression: round-2#2
```

Why it matters: the unit is the grounds cell of the *Judgments of the run* row that `c8bb5a4e` rewrote, with round 2's paste-ready text. Round 2's finding 2 asked the grounds to say what holds a session's line and what does not, and the frame's *Scope* item 4 takes the call's card out of the view. The text round 2 wrote, which the fix applied, says "The diff left that branch of `showChainList` as it was but for the list's element". The diff of `work-item-view.ts` since `ab7a5730` shows the branch for a session's line also lost the loop that drew the permission card, with its "Allow" and "Refuse" buttons (the removed `for (const ask of line.asks)` block). So the defect came from round 2's own snippet, not from the fix pass.

The conclusion stands: the card's removal changes neither the "Stop" button nor the error output, so no case of them is owed by the diff. But the sentence states the diff wrongly, and the sealer reads this cell to weigh the decision. The search `grep -rn -F 'but for the list' seal/threads/1795610690-224-the-ask-section-goes/` prints `frame/plan.md:62`, round 2's record, which quotes the sentence as it stood and keeps it, this record, and `trail/phases/phase-2.md:7`, which says "but for the list's own box" of the list's styles and is another fact (executed). The search is a sample under contract rule 12. The fix covers the plan row alone.

```markdown
| 2026-11-26 | Round 1's finding 4, located in `frame/design.md` alone, is folded by the orchestrator as the round wrote it; findings 1 to 3 go to the fix pass. No built-app case is added for a stage session's line now that `ask-section.test.ts` is gone. | `view.ts#headlessLines` gives each line's "Stop" and error output, which `view.test.ts` pins, and `work-item-view.ts#showChainList` draws them, which no built-app case now runs for a session's line: the `approval-line.test.ts` case reads the list hidden, and the screenshot run draws the gate's line alone. The diff changed that branch of `showChainList` only by the list's element and by taking out the permission card it drew, and changed neither its "Stop" nor its error output, so no case of them is owed by the diff, and one would cost a launch of the app for a branch no change of this release touches. | the plugin's `skills/code-review/orchestration.md` *Orchestrator: the run ends with a verifying round* |
```

```seal
verdict: fixed e97513a8
answer: The orchestrator's commit `e97513a8` replaced the grounds cell of the *Judgments of the run* row at `frame/plan.md:62` with this finding's paste-ready text: the diff changed that branch of `showChainList` only by the list's element and by taking out the permission card it drew, and changed neither its "Stop" nor its error output, so no case of them is owed. The decision is unchanged. The repair is located in the work item's records alone, `frame/plan.md`, and touches no code; this pass made no change for it.
```

## Confirmations

```seal
confirms: round-2#1
```
What holds: `renderer.ts:1564` now says the Machine dialog is drawn "at a `machine` message, whose draw replaces the rows of its lists, and at an `inbox`, which carries the chain's stage that names a session that waits" (`39302f3c`). `git grep -n 'drawMachineDialog' -- apps/desktop/src` prints the definition at `renderer.ts:1565` and its two calls, at `1596` in `takeLists` and at `1853` at a `machine` message, and the comment names both (executed). The change is a comment, so no behaviour moved and no case was owed.

```seal
confirms: round-2#2
```
What holds: the row at `gaps.md:12` opens its Item cell with `closed`, and its answerer's cell names `frame/plan.md` *Judgments of the run*, 2026-11-26 (`39302f3c`). The memo's other rows and its *Not done* section are unchanged (executed, `git diff 874b2ed3 d2585dd1 -- seal/threads/1795610690-224-the-ask-section-goes/gaps.md`). No row left without the word `closed`. The grounds cell at `frame/plan.md:62` now says that `headlessLines` gives each line's "Stop" and error output and that `showChainList` draws them, and that no built-app case runs a session's line (`c8bb5a4e`). That agrees with `view.ts:3262-3278`, `work-item-view.ts:795-826` and the `approval-line.test.ts` case at `280-296`. One clause of that cell is wrong, which finding 1 above names.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The broad gate on `d2585dd1`, the merged tree: the suite, the typecheck and the documents' check | `seal/config.json` `Broad gate` | the orchestrator's broad gate |
| The Machine dialog's case seen red with `renderer.ts:1596` removed, which `frame/plan.md:49` promises for after the rebase (round 2, *Not judged*) | `frame/plan.md:49` | the orchestrator |
| The built-app files beyond the one case round 2 ran, and the screenshots in every theme | `gaps.md` *Not verified*, rows 1 and 5 | the orchestrator |

## Probes

| Command | Result |
|---|---|
| `git diff --stat 874b2ed3 d2585dd1` | `renderer.ts` (one comment line), `frame/plan.md`, `gaps.md` and round 2's record; no other file |
