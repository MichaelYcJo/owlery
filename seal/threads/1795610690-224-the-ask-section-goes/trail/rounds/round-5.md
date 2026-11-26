# Review round 5: 1795610690-224-the-ask-section-goes

```seal
target: aa5d13e4, fixes d0716b33..aa5d13e4
```

This is a verifying round. Its target is `aa5d13e4`. The change it answers stands after round 4's record (`d0716b33`). That change is the orchestrator's rewrite of the *Overlap with the release* row of #214 (`0149ac5f`), which closed round 4's finding, and the close of round 4 (`f26fbb47`). It is also the crafter's merge of `origin/release/v0.0.5` at `783e2331` (#259, #262, #263, #264, #265, #267, #268), concluded at `18892f73`, and the orchestrator's fold of the rows of #218 and #263 into `frame/plan.md` (`aa5d13e4`). The chain check reads no merge commit, so this round read the resolution against both parents with `git show --remerge-diff 18892f73`. It compared the branch's own changes in each file before and after the merge (`git diff -U0 943b1bfd f26fbb47` against `git diff -U0 783e2331 18892f73`, per file). It also searched the auto-merged files for a release change that still sends or expects `ask`, `asked` or `permissions`. The work item's records were read whole at `aa5d13e4`.

Carried from rounds 2 to 4 and not established again: where `drawMachineDialog`, `takeLists`, `showChainList`, `sessionName` and `startRoleSession` stand, and the shape of the rule-change probe of round 4. Every verdict below was reached again.

The plan's *Overlap with the release* has no row for #264 (`1795653550-150`) or #267 (`1795651593-231`), though the merge resolved a conflict with each: #264 rewrote the `daemon.test.ts` case of a word committed while a headless session works, whose `ask` the resolution moved to `startRoleSession`, and #267 added the view `find` to `screenshots.ts#VIEWS` and the find bar to the header comment of `work-item-view.ts`. No sentence of the records says the table is whole, so this is no finding. The merge's message names both conflicts.

## Findings

### 1. The plan's row of #263 says every line of the session dialogs reads "name in title", and leaves out that the merge moved #263's built-app case of a running session from a headless session to a pane

```seal
severity: should
location: `seal/threads/1795610690-224-the-ask-section-goes/frame/plan.md:50`
evidence: executed `git show --remerge-diff --format= 18892f73 -- apps/desktop/test/machine-dialog.test.ts`, `grep -rn -F 'name} in ${title}' seal/threads/1795610690-224-the-ask-section-goes/` and `grep -rn -F 'Queued list' seal/threads/1795610690-224-the-ask-section-goes/`; read `apps/desktop/src/renderer/view.ts:1025`, `apps/desktop/src/renderer/view.ts:1059`, `apps/desktop/src/renderer/view.ts:1081`, `apps/desktop/src/renderer/renderer.ts:1284`, `apps/desktop/test/machine-dialog.test.ts:420`, `apps/desktop/test/machine-dialog.test.ts:429`, `apps/desktop/test/view.test.ts:727`, `apps/desktop/test/view.test.ts:840`
```

Why it matters: the row's grounds say "The merge at `18892f73` keeps #263's split and names each session by its stage: a line reads `${name} in ${title}`, and the delete view's Queued list shows "Proofer, round 1"." Two parts of that do not hold at the target, and one change the resolution made is missing.

- A line reads `${name} in ${title}` only in the removal's and the daemon end's dialogs (`view.ts:1025`, `runningSessions`). `archivalOf` gives the name alone (`view.ts:1081`). The archive's dialog and the delete dialog draw from it (`renderer.ts:1284`), so the delete dialog's line is "Proofer, round 1" with no title. The same sentence quotes that line, so it states the rule and its exception together.
- The delete dialog has no "Queued" list. Its section is "Sessions waiting for the machine that leave the queue". The cell also places `SessionsNamed` in `runningIn`, which returns `{ panes, working, queued }` (`view.ts:1059`), and no `SessionsNamed`.
- #263's built-app case of the delete dialog listed a headless session that a person asked, and that worked, under "Running sessions that end". The resolution lists the work item's Claude Code pane there (`machine-dialog.test.ts:420`, `machine-dialog.test.ts:429`), since nothing asks a session any more. No built-app case now draws a working headless session in that section. The `view.test.ts` cases of `removalOf` and `archivalOf` pin it (`view.test.ts:727`, `view.test.ts:840`). Round 4's finding 1 was this kind of gap: the rows of *Overlap with the release* are what the sealer reads to tell whether a merge kept each work's behaviour, and a resolution that changed a case of the other work is said there.

The two searches above print only this row (executed). They are a sample under contract rule 12, since a statement of the fact in other words escapes them. The fix rewrites the row in place.

```markdown
| #249 and #251, the delete dialog's queued sessions and its scroll (PR #263) | `apps/desktop/src/renderer/view.ts`, where #263 splits a work item's sessions into those that run and those that wait for the machine (`SessionsNamed { running, queued }`) in `removalOf`, `archivalOf` and `runningSessions`, from the split `runningIn` makes, which this work names by stage (`sessionName`); `test/view.test.ts`, `test/machine-dialog.test.ts` and the screenshot run's delete view | #263 | #263 merged first (`95b1a3ee`). The merge at `18892f73` keeps #263's split and names each headless session by its stage: a line of the removal's and the daemon end's dialogs reads `${name} in ${title}`, and a line of the archive's dialog and of the delete dialog, which name one work item, reads the name alone. #263's built-app case of the delete dialog (`test/machine-dialog.test.ts`) lists the work item's Claude Code pane under "Running sessions that end", where #263 listed a headless session a person asked, since no session is asked; the `view.test.ts` cases of `removalOf` and `archivalOf` pin a working headless session in that section. That case and the screenshot run's delete view list the stage that waits, "Proofer, round 1", under "Sessions waiting for the machine that leave the queue". |
```

```seal
verdict: fixed 4bee5669
answer: The orchestrator replaced the row of #263 in `frame/plan.md` *Overlap with the release* with the round's paste-ready row, after reading it against `view.ts:1025`, `:1059`, `:1081` and `test/machine-dialog.test.ts:420-429`. The change is to the work item's records alone.
```

## Confirmations

```seal
confirms: round-4#1
```
What holds: the *Overlap with the release* row of #214 at `frame/plan.md:44` is round 4's paste-ready row, word for word (`0149ac5f`, an ancestor of `aa5d13e4`). It names the two screenshot files and says what the resolution of `4517e474` changed in the scene. `grep -rn -F 'rebase is textual' seal/threads/1795610690-224-the-ask-section-goes/` prints only round 4's own record (executed).

What matched: the branch's own changes survive the merge. Per file, the lines the branch changed between `943b1bfd` and `f26fbb47` are the lines it changes between `783e2331` and `18892f73`, for every file but the ten the merge conflicted in (executed). Among those ten, `daemon.ts` differs only in its import, and `work-item-view.ts` only in its header comment.

What matched: the resolution of `src`, read against both parents (executed, `git show --remerge-diff`).
- `daemon.ts` imports #264's `WordOwed` and neither `PermissionAsk` nor `roleStageOf`.
- `view.ts` keeps #263's split of the sessions that run from those that wait in `removalOf`, `archivalOf`, `runningSessions` and `runningIn`, and names each headless session through `sessionName`. `runningIn`'s field is `working`, where #263 called it `asked`. No line of `view.ts` names a session by its prompt or by "Asked".
- `work-item-view.ts`'s header names the list of the daemon's chain, and keeps #267's find bar.

What matched: the resolution of the cases.
- `accounts.test.ts` takes #265's `addAccount` with a folder and no name. Its helper answers `done`, `error`, `workItemCreated` and #265's `started`, and not `asked`. Scenario J's `ask`, the one #265 added, is now `d.startRoleSession(workItemId, "Who am I?", PROOFER, 1)`, which rejects with "No account 1 is kept." (`accounts.test.ts:1402`).
- `daemon.test.ts`'s `WORK_ITEM_FIELDS` and the created work item hold #264's `wordOwed` and no `permissions`. #264's case of a word committed while a headless session works starts its session with `startRoleSession`.
- `sample-cli.sh` keeps #265's `auth` branch and not the held prompt.
- `screenshots.ts#VIEWS` keeps #267's `find` and `app-settings` and #265's `accounts-adding` and `accounts-added`, and its doc comment names the stage that waits. `screenshots.test.ts` keeps #264's parked view, whose shot scrolls to the decisions, and #263's wait on both session sections of the delete view, with "Proofer, round 1" for the stage that waits and `queuedHeads(commits)` from round 4.
- `view.test.ts` rewrites #263's three cases of a session that waits with sessions of a role, and drops the branch's case that named a waiting session as one that runs, which #263's split replaces. A case-title comparison over `apps/desktop/test` at the four commits finds no release case gone at the target but those three, each under a new title (executed).

What matched: the auto-merged regions. At `aa5d13e4`, `git grep` on `type: "ask(ed)?"`, `case "ask(ed)?"`, `PermissionAsk`, `answerPermission`, `permissionsOf`, `.permissions`, `permissions: [`, `"Ask"`, `Asked: `, `#ask-`, `#headless` and `session asked` in `apps/desktop/src` and `apps/desktop/test` prints only the lines the frame's acceptance rows allow. These are the case at `daemon.test.ts:5274-5275`, the `last-look.test.ts` and `view.test.ts` cases of a look and a work item an earlier daemon sent with `permissions`, the `approval-line.test.ts` case that asserts no "Ask" section, and `main/forward.ts:16`. The other words `ask` it prints belong to other things: the chain command's `ask` subcommand, the turn socket's `ask` message and the file opener's `"ask"` (executed). #268's `turn-failed` is a pane's agent event (`agent-events.ts:14`, `agent-state.ts:27`) and reaches no headless session. The release changed neither the `ask` nor the `answerPermission` handler that the branch removed (executed, a diff of each handler between `943b1bfd` and `783e2331`). So no release change to them was dropped with them.

What matched: the release's rule changes, applied as the settle would apply them. The probe applied every operation of the release's work items that hold a frame, in merge order, then this work item's, to copies of the documents at `aa5d13e4`. Every operation was placed, and none was refused. Each edition kept its English edition's count of headings and of table rows (`design` 15 and 386, `architecture` 27 and 124, `product` 15 and 36). The *Removes* "Policy sentences" search, joined with "by its prompt" and "session waits for the machine", found only this work's own `to`, "No session is named by its prompt." (executed, *Probes*). #267's rows of the find bar and the Settings dialog and its scrollback in the Machine dialog's row stand beside this work's change of that row.

What matched: the merged tree's narrow runs and the scene. The unit files of the conflicted code, the conflicted `daemon.test.ts` cases with the group of headless sessions, and the built-app files of the Machine dialog, the screenshots and the role bundle passed. The screenshot run made 34 shots in Night watch. In them the delete dialog lists "Shell" under "Running sessions that end" and "Proofer, round 1" under "Sessions waiting for the machine that leave the queue", the Machine dialog lists "Rename the settings file" over "Proofer, round 1", and the view's foot shows the failed gate's line with its output (read, `night-watch-light-delete.png`, `night-watch-light-machine.png`, `night-watch-light-view.png`). The crafter's scratch logs of the merge say the same, and this round ran each again rather than read them as evidence.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The broad gate on `aa5d13e4`: the whole suite, the typecheck of the merged `daemon.ts`, `renderer.ts` and `view.ts`, and the documents' check. This round ran no typecheck (contract rule 2) | `seal/config.json` `Broad gate` | the orchestrator's broad gate |
| The screenshots in every theme. The delete view now differs from the release's, which drew "Asked: " and a prompt, so it joins the views the pull request's body carries | `gaps.md` *Not verified*, row 1 | the orchestrator, before the pull request's body carries the files |
| #263's records that state its delete dialog names a headless session by "Asked: " and its prompt, which the merge changed: its *Scope* item 2, its *Out* on how a dialog names a stage, and its acceptance row of the screenshots | `seal/threads/1795651594-249-251-delete-dialog-names-the-queue-and-keeps-its-scroll/frame/design.md:56`, `:70`, `:90` | the settle, which reads #263's operations and not its scope |

## Probes

| Command | Result |
|---|---|
| `python3 -I test_tmp_rule_changes_merged.py <clone at aa5d13e4> <245> <235> <242> <237> <214> <236> <246> <249-251> <150> <218> <231> <188> <224>`, in the round's scratch directory, which applies each design's `## Rule changes` with the plugin's `rule_changes.py#apply_op`, in merge order | #245 and #237 hold no frame, and #236's frame holds no operation. #235 has 4 operations, #242 2, #214 2, #246 2, #249-251 6, #150 8, #218 6, #231 8, #188 2 and #224 34, with no parse error and none refused. Headings and table rows are equal across editions. The stale-sentence search printed `design.md:457` alone, which is this work's own `to` |
| `node scripts/test-in-electron.mjs test/view.test.ts test/accounts.test.ts test/machine.test.ts`, in `apps/desktop` of the branch worktree | exit 0, 668 passed |
| `node scripts/test-in-electron.mjs test/daemon.test.ts -t "creates a work item and opens a pane whose process runs in its worktree\|leaves the record written and not committed while a headless session\|starts no session at a message of a client\|refuses to remove an account a queued session would run under\|refuses with its reason, and ends nothing, a change of a shell\|headless sessions"` | exit 0, 47 passed, 344 skipped |
| `node scripts/test-in-electron.mjs test/machine-dialog.test.ts test/screenshots.test.ts test/role-bundle.test.ts` | exit 0, 38 passed, 1 skipped (the screenshot run itself) |
| `OWLERY_SCREENSHOTS=1 node scripts/test-in-electron.mjs test/screenshots.test.ts`, its folder in the round's scratch directory | exit 0, 34 shots in Night watch |
