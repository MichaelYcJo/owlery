# Review round 2: 1795610690-224-the-ask-section-goes

```seal
target: 128e7dbd, fixes 1ff3d6e7..29a696a4
```

This is a verifying round. Its target is `128e7dbd`, the merge of `origin/release/v0.0.5` at `ef2675d2` into the branch, and the fixes it answers stand between round 1's record (`1ff3d6e7`) and the record of its closes (`29a696a4`): the orchestrator's fold `3ff6e835`, and the fix pass's `450a5619` and `7b027cdd`. The coordinator asked this round to read the merge's resolution too, since the chain check reads no merge commit. So the code this round reviewed is the fix diff, the resolved conflict in `apps/desktop/src/renderer/renderer.ts`, and the auto-merged files that #224's removals touch (`daemon.ts`, `chain.test.ts`, `role-bundle.test.ts`, `approval-line.test.ts`, `machine-dialog.test.ts`). The work item's records were read whole at `128e7dbd`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `pr.md`, `trail/phases/` and `trail/rounds/round-1.md`.

Carried from round 1 and not established again: where the subsystems live (`view.ts#headlessKey`, `view.ts#sessionName`, `daemon.ts#startRoleSession`, `claude.ts#claudeArgs`), and the probe of `frame/design.md` *Rule changes*, since no commit since round 1 changed that section or `docs/` (`git diff --quiet bf1e81fb 128e7dbd -- docs` exits 0, and the fold changed one row of *User scenarios & acceptance* alone). Every verdict below was reached again.

## Findings

### 1. The Machine dialog's draw says it runs at a `machine` message, and the merge made it run at every `inbox` too

```seal
severity: should
location: `apps/desktop/src/renderer/renderer.ts:1564`
evidence: executed `git show --remerge-diff --format= 128e7dbd -- apps/desktop/src/renderer/renderer.ts`; read `apps/desktop/src/renderer/renderer.ts:1564-1567`, `apps/desktop/src/renderer/renderer.ts:1594-1596`, `apps/desktop/src/renderer/renderer.ts:1849-1853`
```

Why it matters: #242 (`ef2675d2`) wrote `drawMachineDialog` with the doc comment "Draws the Machine dialog where it is open, at a `machine` message, through the hold". The merge resolved the conflict in `takeLists` as `frame/plan.md` *Overlap with the release*, the row of #242, says: `draws.draw(drawMachineDialog);` at `renderer.ts:1596`, after `draws.draw(drawLists);`. So the function now runs at a `machine` (`renderer.ts:1853`) and at every `inbox` (`renderer.ts:1596`), and its doc comment names the first alone. The comment at the call site says why the `inbox` draws it, but an agent that reads the function's own comment learns that one message draws it. It may then take the call in `takeLists` for a stray and remove it, which turns Scope item 12 back into the stale row phase 1 found. Contract rule 19 asks the change that amends a fact to rewrite the sentence that states it. The search `git grep -n 'drawMachineDialog' -- apps/desktop/src` prints the definition, its two calls and nothing else, so the fix covers each statement.

```ts
/** Draws the Machine dialog where it is open, through the hold: at a `machine` message, whose draw replaces the rows of its lists, and at an `inbox`, which carries the chain's stage that names a session that waits. One function, so the hold keeps it once per press. The `heavyRuns` answer to the person's opening of the dialog draws it at once. */
function drawMachineDialog(): void {
  if (MACHINE.dialog.open) showMachine();
}
```

### 2. The judgment that no built-app case of a stage session's line is owed says `headlessLines` draws the line, and leaves its memo row open

```seal
severity: should
location: `seal/threads/1795610690-224-the-ask-section-goes/frame/plan.md:62`, `seal/threads/1795610690-224-the-ask-section-goes/gaps.md:12`
evidence: read `apps/desktop/src/renderer/view.ts:3262-3278`, `apps/desktop/src/renderer/work-item-view.ts:795-826`, `apps/desktop/test/approval-line.test.ts:280-296`, `apps/desktop/test/screenshots.ts:10`; executed `git grep -n 'view-chain' -- apps/desktop/test` at `128e7dbd`
regression: round-1
```

Why it matters: the unit is the row of *Judgments of the run* that the orchestrator's fold `3ff6e835` added to `frame/plan.md`. `gaps.md:12` left to the orchestrator whether a built-app case of a stage session's line is owed, and the frame's *Scope* item 10 removes `ask-section.test.ts` and names nothing in its place. The fold decided no case is owed, and wrote grounds that misstate the code. The grounds say: "The line's "Stop" and its error output are drawn by `view.ts#headlessLines`, which `view.test.ts` pins, and the list they stand in is drawn in the built app by the new `approval-line.test.ts` case and the screenshot run, so a built-app case of its own would buy a launch and catch nothing the two do not".

- `headlessLines` (`view.ts:3262-3278`) draws nothing. It gives each line's `stop` and `errorOutput` as data. `work-item-view.ts#showChainList` (`work-item-view.ts:795-826`) draws them: the "Stop" button that sends `stopHeadless`, and the `error-output` part.
- Neither built-app run draws a session's line. The `approval-line.test.ts` case reads the list hidden, with no child (`approval-line.test.ts:280-296`). The screenshot run's views are the summary, the inbox, four work items' views, the menu, the dialogs and the Machine dialog (`screenshots.ts:10`). In the shown views the list holds the gate's line alone, and the work item whose stage waits for the machine is drawn in the inbox and the Machine dialog, never in its view. `git grep -n 'view-chain' -- apps/desktop/test` prints only those two files.

So a defect in `showChainList`'s branch for a session's line, such as a "Stop" that sends nothing, is caught by neither. The decision can still stand: the diff did not change that branch's behaviour, and *Probes and regression tests* owes no case for code the diff left as it was. But the grounds have to say what holds it and what does not, so the sealer weighs the right cost. Separately, `gaps.md:12` still reads as an open row whose answerer is the orchestrator, while `frame/plan.md:62` gives the answer. `skills/implement/SKILL.md` *4. The closing memo* ends such a row by marking it `closed`. The fix below rewrites the grounds cell and closes the row, and both are in the work item's records alone.

```markdown
| 2026-11-26 | Round 1's finding 4, located in `frame/design.md` alone, is folded by the orchestrator as the round wrote it; findings 1 to 3 go to the fix pass. No built-app case is added for a stage session's line now that `ask-section.test.ts` is gone. | `view.ts#headlessLines` gives each line's "Stop" and error output, which `view.test.ts` pins, and `work-item-view.ts#showChainList` draws them, which no built-app case now runs for a session's line: the `approval-line.test.ts` case reads the list hidden, and the screenshot run draws the gate's line alone. The diff left that branch of `showChainList` as it was but for the list's element, so no case of it is owed by the diff, and one would cost a launch of the app for a branch no change of this release touches. | the plugin's `skills/code-review/orchestration.md` *Orchestrator: the run ends with a verifying round* |
```

```markdown
| closed a headless session's line at the view's foot in the built app: a press of its "Stop" and the error output under a failed session's line had their one built-app case in `test/ask-section.test.ts`, which phase 2 deleted whole (`frame/design.md` *Scope* item 10). `test/view.test.ts` pins what `headlessLines` gives such a line, and the screenshot run draws the gate's line and its output | the orchestrator, who owes no case: `frame/plan.md` *Judgments of the run*, 2026-11-26 |
```

The second snippet is the row at `gaps.md:12` whole, with its Item cell opened by `closed` as `skills/implement/SKILL.md` *4. The closing memo* marks a closed row, and its answerer's cell naming the judgment that answered it.

## Confirmations

```seal
confirms: round-1#1
```
What holds: `view.ts:3354` now says the key "differs where the broad gate's line or a session's line differs", and `view.test.ts:1669` and `1675` name "a session of the work item that no stage of its chain names" (`450a5619`). The fix pass also rewrote a member round 1's search missed, the `approvalPlaces` case at `view.test.ts:1402` and `1409`, which now says that no pane's state and no headless session changes the line. That holds, since `approvalPlaces` takes the work item alone. Round 1's search, run again at `128e7dbd`, prints `renderer.ts:435` and `688` and `view.ts:1681`. The first two name a pane a person asked for and the third a pane's agent that waits for a call in its terminal, and none of them is in this class. A search on "without a role|with no role|role-less|no role" over `apps/desktop/test` prints lines that name the refresh of an account's usage or a session a daemon before release 0.0.5 started, which the frame keeps. Both searches are a sample under contract rule 12. `test/view.test.ts` passed whole, 543 cases (executed).

```seal
confirms: round-1#2
```
What holds: `gaps.md:18` ends "`frame/design.md` *Scope*, the list *Out*, leaves it to issue #254" (`7b027cdd`). `grep -rn -F 'names none of'` over the work item prints `trail/phases/phase-3.md:35`, which states what the frame held when phase 3 closed, and round 1's record. `grep -rn -F '#254'` prints `frame/design.md:59`, `gaps.md:18` and round 1's record (executed).

```seal
confirms: round-1#3
```
What holds: `changelog.md:6` says "Every session of a chain's stage has a role", and that the refresh of an account's usage has no role and holds no tool (`7b027cdd`). That agrees with `claude.ts:102` and `protocol.ts:869`. `grep -rn -F 'Every session the daemon starts'` prints round 1's record alone (executed).

```seal
confirms: round-1#4
```
What holds: the *Verifiable how* cell of the row "The window says no "Asked"" at `frame/design.md:73` names the cases of `archivalOf`, `removalOf`, `runningSessions`, `daemonEnding` and `machineQueue`, "which read the names `sessionName` gives (no case calls `sessionName` itself)" (`3ff6e835`). `grep -c sessionName apps/desktop/test/*.ts` prints 0 for every file (executed).

What matched: the merge's resolution in `renderer.ts`. `git show --remerge-diff` shows the one conflicted file and two hunks. The first takes #242's `drawLists`, `drawAccountsDialog` and `drawMachineDialog`, and writes `takeLists`'s doc comment without #242's clause "of each call a headless session began to wait for the person to allow", which #224 removes. The second ends `takeLists` with `draws.draw(drawLists);` then `draws.draw(drawMachineDialog);` (`renderer.ts:1594-1596`), as `frame/plan.md` *Overlap with the release* says for #242. The dialog is drawn once per `inbox`: `drawLists` holds no `showMachine` (`renderer.ts:1543-1557`), and `press.ts#drawHold` keeps each function once per press. No `permissionNotifications`, `case "asked"` or `answerPermission` stands in `src` (executed, `git grep`). The Machine dialog's case of a stage that waits for the machine passed at `128e7dbd`, its app built from the merged tree (executed, `machine-dialog.test.ts -t "the sessions that wait for the machine"`, with `dist/` rebuilt at the run).

What matched: the auto-merged files against #224's removals. Since `29a696a4`, the merge brings #235's stage prompts (`daemon.ts`, where `runConvergence` and `runRuling` pass `worktree`, `chain.test.ts` and `role-bundle.test.ts`), #247's `heavy-run.test.ts`, and #242's `press.ts` and its cases, which drop the clicks made again in `approval-line.test.ts` and `machine-dialog.test.ts`. A search over `apps/desktop/src` and `apps/desktop/test` for `type: "ask"`, `"asked"`, `PermissionAsk`, `answerPermission`, `permissionsOf`, `.permissions`, the `#ask` ids, `#headless` and `askButton` prints only lines #224 keeps on purpose: the case of `daemon.test.ts:4964-4965`, the `approval-line.test.ts` case that reads the ids absent, and the cases of an earlier daemon's look and work item (executed). #224's `approval-line.test.ts` case and `machine-dialog.test.ts`'s parked-chain case stand in the merged files whole.

What matched: the other work items' frames the merge brought. `seal/threads/1795610688-242-sidebar-click-survives-a-redraw/frame/design.md` changes *Screen framework: Electron*, and `seal/threads/1795610687-235-stage-prompts-name-the-worktree/frame/design.md` changes *Code runs the order, the orchestrator judges*, each in `docs/architecture.md` and its Korean edition. `seal/threads/1795613754-245-scenario-i-holds-pages-that-stay-resident/` holds no frame. No operation of this work item names either section (executed, `awk` over each design's `## Rule changes`).

## Not judged

| What | Location | Who answers |
|---|---|---|
| `frame/plan.md` *Overlap with the release*, the row of #242, says the Machine dialog's case "is seen red again after the rebase with that line removed". No record shows that run, and this round ran the case green at `128e7dbd` and did not run it with the line removed. Read: without `renderer.ts:1596` the dialog is drawn only at `machine` and `heavyRuns`, which is the state phase 1 saw red at `3b85b13d` | `frame/plan.md:49`, `apps/desktop/src/renderer/renderer.ts:1596` | the orchestrator |
| The broad gate on the merged tree: the suite, the typecheck the coordinator reports as passing, and the documents' check | `seal/config.json` `Broad gate` | the orchestrator's broad gate |
| The built-app files beyond the one case this round ran, and the screenshots in every theme | `gaps.md` *Not verified*, rows 1 and 5 | the orchestrator |

## Probes

| Command | Result |
|---|---|
| `node scripts/test-in-electron.mjs test/view.test.ts`, in `apps/desktop` of the branch worktree at `128e7dbd` | exit 0, 543 passed |
| `node scripts/test-in-electron.mjs test/machine-dialog.test.ts -t "the sessions that wait for the machine"`, same place | exit 0, 1 passed, 8 skipped; `dist/` was rebuilt by `buildApp` at the run |
| `git show --remerge-diff --format= 128e7dbd -- apps/desktop/src/renderer/renderer.ts` | two conflict hunks, resolved as *What matched* states |
