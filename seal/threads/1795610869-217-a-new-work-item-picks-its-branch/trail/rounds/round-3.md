# Review round 3: 1795610869-217-a-new-work-item-picks-its-branch

```seal
target: 66d134bf, fixes 940e0892..66d134bf
```

A verifying round. The range holds round 2's record (`3519b492`), the orchestrator's route row (`f6cca7a1`), the fix `2d521c88`, and round 2's close (`66d134bf`). The fix adds one line to a case of `apps/desktop/test/work-item-menu.test.ts` and changes no source. The round read the frame, `gaps.md`, `changelog.md`, `pr.md` and `routing.md` whole at the target. Only `frame/plan.md` *Judgments of the run* changed among them, by one row. No test was run: the close is settled by reading the line against the label it pins. The close's own red and green runs are the fix pass's `executed` account.

## Findings

None.

## Confirmations

```seal
confirms: round-2#1
```
What holds: the line at `apps/desktop/test/work-item-menu.test.ts:963` reads `document.getElementById("remove-delete-label").textContent` and expects "Also delete the work items' worktrees, and the local branches Owlery made". The label at `apps/desktop/src/renderer/index.html:1073` holds an `<input>`, which gives no text, and then exactly those words, so its `textContent` is that string whole, with no white space around it. The line stands in the case that opens the removal's dialog with the choice shown, after the read of the label's `display` (`:962`), so the dialog is drawn when it reads. Words put back to "worktrees and local branches" fail it, and the row at `frame/design.md:118` now names a case that pins its words. The close says it was seen red that way by `seal mutate`, and that the file passed whole, 30 cases, against the label as it stands. The line reads and changes nothing, so it can break no other case. (read)

What matched: the route row `f6cca7a1` adds to `frame/plan.md` *Judgments of the run* leaves the check inside `headStands` untaken. It says what the row of `gaps.md` *Not done* at `gaps.md:24` keeps, and the two agree. Round 2 left that check to the orchestrator as a row of `## Not judged`, and this row answers it. (read)

Nothing of this round stays open. What comes due is the orchestrator's broad run, at HEAD after the base `release/v0.0.5` is merged in, and then the sealer's spawn.

## Not judged

| What | Location | Who answers |
|---|---|---|
| Whether `makeBranch`'s repair from `HEAD@{1}` holds on a git older than 2.54, carried from round 1. | `apps/desktop/src/daemon/worktrees.ts:720-731` | the orchestrator |
| The suite, the typecheck and the built-app files, which no round ran whole. | the repository | the orchestrator, by the broad gate |

## Probes

| Command | Result |
|---|---|
| none | The round ran no test and no probe. |
