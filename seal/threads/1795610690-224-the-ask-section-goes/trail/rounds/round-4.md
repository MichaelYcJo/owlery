# Review round 4: 1795610690-224-the-ask-section-goes

```seal
target: cec9362b, fixes 10ec28b5..cec9362b
```

This is a verifying round. Its target is `cec9362b`, and the change it answers stands after round 3's record (`10ec28b5`). That change is the orchestrator's rewrite of the *Judgments of the run* row (`e97513a8`), its row on the red run of the Machine dialog's case (`1ab63cea`), and the close of round 3 (`936036e6`). It is also the merge of `origin/release/v0.0.5` at `943b1bfd` (#237's comments, #214's delete dialog), concluded at `4517e474` with the crafter's resolution of `apps/desktop/test/screenshots.ts` and `apps/desktop/test/screenshots.test.ts`, and the orchestrator's rewrite of #214's changelog bullet and two rule-change `to` texts (`cec9362b`). The chain check reads no merge commit, so this round read the resolution against both parents, with `git show --remerge-diff`. It also read the files the merge auto-merged where they meet #224's removals. The work item's records were read whole at `cec9362b`.

Carried from round 2 and not established again: where `drawMachineDialog`, `takeLists`, `showChainList` and `sessionName` stand. Every verdict below was reached again.

## Findings

### 1. The plan's row of #214 says the two works touch other functions and elements and the rebase is textual, and their merge changed what the screenshot run's scene does

```seal
severity: should
location: `seal/threads/1795610690-224-the-ask-section-goes/frame/plan.md:44`
evidence: executed `git show --remerge-diff --format= 4517e474`, `git log -1 --format=%B 4517e474` and `grep -rn -i "toDelete\|queuedHeads\|rev-list --count\|#256" seal/threads/1795610690-224-the-ask-section-goes/`; read `apps/desktop/test/screenshots.test.ts:38-47`, `apps/desktop/test/screenshots.test.ts:246-292`, `apps/desktop/test/screenshots.test.ts:590-600`, `apps/desktop/test/screenshots.test.ts:770-778`, `apps/desktop/test/screenshots.test.ts:836-841`, `apps/desktop/src/daemon/daemon.ts:2978-2994`
```

Why it matters: `frame/plan.md` *Overlap with the release*, the row of #214, says where the two works both change. It names `view.ts` and `index.html`, and its grounds end "The two touch other functions and other elements, so this work's rebase is textual." The merge at `4517e474` conflicted in `screenshots.ts` and `screenshots.test.ts`, which the row does not name. Its resolution was not textual: it changed what the scene does.

- #214's delete view stands on "Rename the settings file", the work item this work stores parked on a question and has the daemon resume (`QUEUED`). #214 wrote the untracked file and `.env` into that worktree before the look. The resolution writes them once the stage waits (`screenshots.test.ts:836-840`), since `daemon.ts#whyNoChain` refuses to resume a chain in a worktree holding a change no commit holds (`daemon.ts:2993-2994`).
- #214 waited for a commit head of exactly 39. The resolution counts the branch's commits no other ref holds with `git rev-list --count` (`queuedHeads`, `screenshots.test.ts:597-599`), since the branch also holds the commits of its records.

No record of this work item says any of it. The merge's message lists only the two conflicted files, and the search above prints nothing. The plan's rows are what the sealer reads to tell whether the release's merges kept each work's behaviour, and the #242 row's merge has its *Judgments of the run* row (`frame/plan.md:62`) while this one has none. The fix rewrites the row in place, as the #242 row was kept in step. `grep -n -F 'rebase is textual' seal/threads/1795610690-224-the-ask-section-goes/` prints only this row (executed), so no other statement of the fact stands. That search is a sample under contract rule 12.

```markdown
| #214, the delete dialog | `apps/desktop/src/renderer/view.ts` (#214's delete dialog against this work's `archivalOf`, `removalOf`, `runningSessions` and `daemonEnding` words, phase 3), `apps/desktop/src/renderer/index.html` (#214's dialog markup against `#ask`, phase 2), and the screenshot run (`apps/desktop/test/screenshots.test.ts`, `screenshots.ts`), whose view `delete` #214 adds on the work item this work stores parked on a question and has the daemon resume | #214 | #214 merged first (`943b1bfd`). The merge at `4517e474` conflicted in the two screenshot files, and its resolution changed the scene: the untracked file and `.env` are written into that work item's worktree once its stage waits, since `daemon.ts#whyNoChain` refuses to resume a chain in a worktree that holds a change no commit holds, and the delete view waits for a commit head that counts the branch's commits no other ref holds (`queuedHeads`), since the branch also holds the commits of its records. |
```

```seal
verdict: fixed 0149ac5f
answer: The orchestrator's commit `0149ac5f` replaced the *Overlap with the release* row of #214 in `frame/plan.md` with this finding's paste-ready row, which says what the merge's resolution changed in the screenshot scene. The repair is located in the work item's records alone, `frame/plan.md`, and touches no code; this pass made no change for it.
```

## Confirmations

```seal
confirms: round-3#1
```
What holds: the grounds cell at `frame/plan.md:63` now says the diff changed that branch of `showChainList` "only by the list's element and by taking out the permission card it drew, and changed neither its "Stop" nor its error output" (`e97513a8`). That agrees with the diff of `work-item-view.ts` since `ab7a5730`, which round 3 read. The row's decision is unchanged.

What matched: the orchestrator's row at `frame/plan.md:62`, which records the Machine dialog's case run red on the merged tree with `draws.draw(drawMachineDialog);` taken out of `takeLists`. It answers the check the #242 row of *Overlap with the release* asks for, which rounds 2 and 3 left to the orchestrator under *Not judged*. This was read, not run again.

What matched: the resolution of `screenshots.ts`. It keeps #214's view `delete` in `VIEWS` after #224's `machine`, and its doc comment names the stage that waits, not an asked session, and the commits of the records.

What matched: the resolution of `screenshots.test.ts`, read against both parents.
- The header comment keeps #224's scene and rewrites #214's paragraph for it.
- #214's constants `ASKED`, `ASKED_TO_ALLOW` and `ASKED_TO_WAIT`, and its second `QUEUED`, are gone, so none of the removed "Ask" path comes back.
- The outer variable `queued`, which #224's `parkedOnAQuestion` result holds, keeps its name, and #214's lookup took the name `toDelete` (`screenshots.test.ts:772-773`).
- The count the delete view waits for is read as the daemon reads it. `worktrees.ts#readLoss` lists `git log <tips> --not --exclude=<branch> --branches --remotes --tags` (`worktrees.ts:789`), and the view counts `git rev-list --count <branch> --not --exclude=<branch> --branches --remotes --tags`. It refuses a count under 39.
- The unit cases of the file passed (executed). The screenshot run itself is the broad gate's.

What matched: the auto-merged files against #224's removals. Since `936036e6` the merge changes `hooks.ts`, `main.ts`, `pane-chain.ts`, `index.html`, `renderer.ts`, `view.ts`, `view.test.ts` and `work-item-menu.test.ts`. Its lines that add code hold no `asked`, prompt-named session, `permission` or `headless` text (executed, `git diff 936036e6 4517e474 -- apps/desktop/src`, searched). No case of `view.test.ts` or `work-item-menu.test.ts` expects "Asked:" or "Asked in" (executed, `git grep`). #214's delete dialog names a running headless session through `runningIn`, so by `sessionName`.

What matched: the rule changes of the release, as the settle would apply them. The base changed `docs/design.md` and `docs/design.ko.md` (#214's row "The delete dialog" and its view in the list of views). The probe applied every operation of the work items that hold a frame, in merge order (#235, #242, #214, then #224), to copies of the documents at `cec9362b`. Every operation was placed, and none was refused. Each edition kept its English edition's count of headings and of table rows (`design` 15 and 384, `architecture` 27 and 124, `product` 15 and 36). The *Removes* "Policy sentences" search, joined with "session waits for the machine" and its Korean words, found no line in the copies (executed, *Probes*). #214's rewritten `to` (`cec9362b`) names "the work item whose chain's stage waits for the machine" and a head that "counts at least 39", which agrees with the resolution.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The screenshot run on the merged tree, its `delete` view among them, and the screenshots in every theme | `apps/desktop/test/screenshots.test.ts`, `gaps.md` *Not verified*, row 1 | the orchestrator's broad gate |
| The broad gate on `cec9362b`: the suite, the typecheck and the documents' check | `seal/config.json` `Broad gate` | the orchestrator's broad gate |
| #214's records other than the two `to` texts and the changelog bullet `cec9362b` rewrote, such as its *Scope* item 9 ("the work item whose session waits for the machine"), which state #214's frame at its own framing | `seal/threads/1795610689-214-delete-dialog-lists-read-cleanly/frame/design.md:60` | the settle, which reads #214's operations and not its scope |

## Probes

| Command | Result |
|---|---|
| `python3 -I test_tmp_rule_changes_merged.py <clone> <245> <235> <242> <237> <214> <224>`, in the round's scratch directory, which applies each design's `## Rule changes` with the plugin's `rule_changes.py#apply_op`, in merge order, to copies of the documents at `cec9362b` | #245 and #237 hold no frame. #235 has 4 operations, #242 2, #214 2 and #224 34, with no parse error and none refused. Headings and table rows are equal across editions. The stale-sentence search over the copies counted 0 in each of the six documents |
| `node scripts/test-in-electron.mjs test/screenshots.test.ts`, in `apps/desktop` of the branch worktree with `OWLERY_SCREENSHOTS` unset | exit 0, 7 passed, 1 skipped (the run itself) |
| `git show --remerge-diff --format= 4517e474` | two conflicted files, each resolved as *What matched* states |
