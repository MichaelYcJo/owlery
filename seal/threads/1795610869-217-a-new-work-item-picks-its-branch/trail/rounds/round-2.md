# Review round 2: 1795610869-217-a-new-work-item-picks-its-branch

```seal
target: 940e0892, fixes 10207084..940e0892
```

A verifying round. It answers the three closes of round 1 and reviews the code the fix range changes: `worktrees.ts#headStands`, its two callers in `daemon.ts`, `view.ts#removalChoice`, the Rename description of `view.ts#workItemMenu`, the removal's label in `index.html`, and the cases of `daemon.test.ts`, `worktrees.test.ts`, `view.test.ts` and `work-item-menu.test.ts` the range adds or rewrites. It read whole at the target `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `pr.md` and round 1's record with its closes. `changelog.md`, `pr.md` and `routing.md` did not change in the range, and nothing in the range contradicts them.

Carried from round 1, not established again: where `headStands`, `readBranch` and `branchUp` stand, and that the repository's removal deletes through `#deleteOne`. Round 1's probe was run again, as its `evidence: executed` line names it.

## Findings

### 1. The removal's new label is pinned by no case, though the readers table names a built-app case for it

```seal
severity: should
location: `apps/desktop/src/renderer/index.html:1073`, `apps/desktop/test/work-item-menu.test.ts:962`, `seal/threads/1795610869-217-a-new-work-item-picks-its-branch/frame/design.md:118`
evidence: executed `git grep -n -e "local branches Owlery made" -e "remove-delete-label" -- apps/desktop/test`; read `apps/desktop/test/work-item-menu.test.ts:952`, `apps/desktop/test/work-item-menu.test.ts:962`, `apps/desktop/test/work-item-menu.test.ts:1015`
regression: round-1#2
```

Why it matters: the unit is the label `#remove-delete-label` of `index.html:1073`, whose words `ba5f82df` changed to "Also delete the work items' worktrees, and the local branches Owlery made". The frame's fold `901cb6f6` added its row to *The readers of a work item's branch* (`frame/design.md:118`) and named `apps/desktop/test/work-item-menu.test.ts` in the built app as its case. The fix changed the words a person reads before a repository's removal deletes, and no case reads those words: the search printed three lines of `work-item-menu.test.ts`, each reading only the label's `hidden` flag (`:952`, `:1015`) or its computed `display` (`:962`). So the words can go back to "worktrees and local branches" with every case green. Contract rule 14 asks that a fix that changes what a person sees pins it in the same commit. The table's acceptance row asks that each row's case be seen red with its guard removed, and this case cannot be. The sentences of `removalChoice` and the Rename descriptions are pinned (`view.test.ts:614`, `:832-834`, `work-item-menu.test.ts:963`). The label is the one unit of round 1's finding 2 left without a pin.

```ts
// apps/desktop/test/work-item-menu.test.ts, after line 962, in the same case
    expect(await value<string>(`document.getElementById("remove-delete-label").textContent`)).toBe("Also delete the work items' worktrees, and the local branches Owlery made");
```

The line is a built-app read. It is seen red against the label at `10207084`, and run in the built-app batch the fix pass ends with. Then the row at `frame/design.md:118` holds as it stands.

```seal
verdict: fixed 2d521c88
answer: The round's line stands after the line that reads the label's `display`, in the case "deletes a repository's work items from disk at its removal where the dialog's choice is taken: …". `work-item-menu.test.ts` ran in the built app in one `seal mutate` command after `2d521c88`: against the label as it stands, all 30 cases passed; with the label put back to the words of `10207084`, "Also delete the work items' worktrees and local branches", the run went red, and its first failure was that case, at the new line, receiving those words. The four cases after it failed too, since that case left the removal's dialog open. `seal mutate` restored `index.html` and checked its hash.
```

## Confirmations

```seal
confirms: round-1#1
```
What holds: `headStands(worktree, baseCommit)` gives null where the commit no ref holds is `baseCommit` (`worktrees.ts:696-706`). `readBranch` passes the work item's base commit (`daemon.ts:4213`), and so does `branchUp` (`daemon.ts:4258`). Round 1's probe, run again on git 2.54.0, printed the base commit for both a deleted and an amended base branch, the output `headStands` now drops. The case "gives no commit for a worktree detached at a base branch since deleted or rewritten, …" asserts that very `rev-list` output and then `null`. The daemon case "makes no branch at the base commit of a work item whose base branch was deleted, …" waits through a dozen reads and then finds the branch made at a later commit. Both passed. (executed)

The fix pass left out the half of round 1's paste-ready fix that guarded `readBranch` with `head !== baseCommit`, and the round agrees. `headStands` reads first whether `HEAD` names a branch. A worktree at its base commit can stand on a branch an agent made with `git switch -c` before any commit, and that guard would leave the branch untaken until the first commit, while the rename dialog says it "becomes the work item's at Owlery's next read". The case "takes up the branch its worktree's HEAD names at the base commit, before any commit is made there" pins that `readBranch` still asks. Round 1's snippet was wrong there. The cost kept is the `rev-list` an idle work item with no branch ran before round 1. `frame/plan.md` *Alternatives considered* rejects the guard, and `gaps.md` *Not done* names the cost. (read)

```seal
confirms: round-1#2
```
What holds: `removalChoice`'s two sentences say "Each work item's worktree, and the local branch Owlery made for it, are deleted, as named below" (`view.ts:1170-1171`), and the label's quotation in its docstring follows the label. The Rename description takes three forms: a work item with no branch, a branch Owlery did not make and one it made, read as a daemon of an earlier build sends it (`view.ts:2330`). `git grep -n -F "worktree and local branch are deleted" -- apps docs` prints nothing at the target. `git grep -n -F "and its branch too where the branch was never pushed" -- apps` prints `view.ts:2330` and its pin at `view.test.ts:614` alone, both now said of a branch Owlery made. The cases of `workItemMenu` and of the delete dialog's sentences in `view.test.ts` passed. The label's missing pin is finding 1. (executed)

```seal
confirms: round-1#3
```
What holds: the bullet that said the screenshots are not committed is gone from `gaps.md` *Not done*, and the six shots stand under `screenshots/`. The same commit marked five rows of `## Not verified` closed in place, with what round 1 read, and none left the table without the word `closed`. It closed the downgrade's row by the orchestrator's row of `frame/plan.md` *Judgments of the run*, dated 2026-11-26. `frame/plan.md` *Operational impact* now names the copy as the one way round, and the changelog fragment already said the copy. (read)

What matched: the row `gaps.md` adds for the proofer holds by reading. `branchUp` hands `held.item.baseCommit` to `headStands` in its turn (`daemon.ts:4258`), so a turn queued at a commit made in the worktree makes no branch where `HEAD` stood back at the base commit when the turn ran. No case reaches it, as the row says, since `readBranch` applies the same test before it queues the turn. (read)

What matched: the folds `94945fa4` and `901cb6f6` restate the first-commit test the same way in each place it stands: `frame/design.md` *Grounding* probe 2 and *Scope* item 6, the new acceptance row, *Data & interfaces*, `frame/questions.md` and the two rows of `frame/plan.md` *Alternatives considered*. The names of the cases the acceptance row and the readers table cite match the cases in the tree word for word. (read)

What matched: `node scripts/test-in-electron.mjs test/worktrees.test.ts test/view.test.ts -t "making the branch of a work item|workItemMenu|removal|delete dialog"` passed 28 cases, and `node scripts/test-in-electron.mjs test/daemon.test.ts -t "base commit|takes up the branch|makes the branch owlery|no branch yet"` passed 11. The branch worktree stood clean after both. (executed)

## Not judged

| What | Location | Who answers |
|---|---|---|
| Whether to take the check that `frame/plan.md` *Alternatives considered* leaves open: in `headStands`, after the read of the branch `HEAD` names and before the `rev-list`, return null where `HEAD` is `baseCommit`. It would spare an idle work item's `rev-list` and keep the take-up. | `apps/desktop/src/daemon/worktrees.ts:696-706`, `seal/threads/1795610869-217-a-new-work-item-picks-its-branch/gaps.md:24` | the orchestrator |
| Whether `makeBranch`'s repair from `HEAD@{1}` holds on a git older than 2.54, carried from round 1. | `apps/desktop/src/daemon/worktrees.ts:720-731` | the orchestrator |
| The suite, the typecheck and the built-app files, which the round did not run whole. | the repository | the orchestrator, by the broad gate |

The daemon case "makes no branch at the base commit of a work item whose base branch was deleted, …" asserts an absence after a 300 ms wait. A slow machine that makes no read in that time leaves it green without testing the guard, and it never fails falsely. The worktrees case on the same guard pins the guard without timing, so the gap costs no coverage.

## Probes

| Command | Result |
|---|---|
| round 1's `sh test_tmp_base_gone.sh <round scratch>/probe` on git 2.54.0, run once more | Case A printed nothing before `git branch -D feature` and the base commit `c1ba685` after it. Case B printed the base commit `f251e79` once `feature2` was amended. This is the output `headStands` now drops. |
| `node scripts/test-in-electron.mjs test/worktrees.test.ts test/view.test.ts -t "making the branch of a work item\|workItemMenu\|removal\|delete dialog"` in `apps/desktop` | exit 0: 28 passed, 637 skipped |
| `node scripts/test-in-electron.mjs test/daemon.test.ts -t "base commit\|takes up the branch\|makes the branch owlery\|no branch yet"` in `apps/desktop` | exit 0: 11 passed, 390 skipped |
