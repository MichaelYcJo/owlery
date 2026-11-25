# Review round 1: 1795610869-217-a-new-work-item-picks-its-branch

```seal
target: 10207084 against release/v0.0.5
```

The round read the branch against its merge base `ab7a5730`, which `git merge-base 10207084 origin/release/v0.0.5` printed. It read `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md` and `pr.md` whole at the target, the four phase records, the issue (#217) and issue #257, and opened the six screenshots. No earlier round stands, so nothing was carried. `Commit and pull request language` is English, so no `pr.<lang>.md` is owed. No `seal/parity.json` and no `Pact` key stand.

## Findings

### 1. A work item whose base branch is deleted or rewritten gets a branch named after nothing, at the base commit, with no commit made in its worktree

```seal
severity: should
location: `apps/desktop/src/daemon/worktrees.ts:686-703`, `apps/desktop/src/daemon/daemon.ts:4212`, `apps/desktop/src/daemon/daemon.ts:4257`, `seal/threads/1795610869-217-a-new-work-item-picks-its-branch/frame/design.md:46`, `seal/threads/1795610869-217-a-new-work-item-picks-its-branch/frame/plan.md:37`, `seal/threads/1795610869-217-a-new-work-item-picks-its-branch/frame/questions.md:7`, `apps/desktop/test/worktrees.test.ts:1087`
evidence: executed `sh test_tmp_base_gone.sh <round scratch>/probe` (git 2.54.0), and `git grep -n -F "no tag holds" -- apps seal/threads`; read `apps/desktop/src/daemon/worktrees.ts:694-703`, `apps/desktop/src/daemon/daemon.ts:4202-4212`, `apps/desktop/src/daemon/daemon.ts:4253-4262`
```

Why it matters: the issue's complaint is a repository that gains a branch named after nothing. *Scope* item 6 makes the branch at "a commit made in the worktree", and `worktrees.ts#headStands` tests that as a commit no local branch, no remote's branch and no tag holds. That test also holds for the commit the worktree was checked out at, once the base branch no longer holds it. A creation with no branch picked stands detached at its base (`worktrees.ts:590`). Where the person then deletes that base branch, as after a squash merge, or rebases or force-pushes it, the base commit is held by nothing. At the next read, `readBranch` (`daemon.ts:4212`) queues `branchUp`, which makes `owlery/<title>` at the base commit, with `ownsBranch` true, though nobody committed in the worktree. For a work item still named at random, that is `owlery/eager-heron`, the pile the issue removes.

The probe settled it at git's level. A worktree added with `--detach` at a local branch `feature` printed nothing before `git branch -D feature`, and printed its own `HEAD`, which is its base commit, after it. A worktree detached at `feature2` printed its base commit once `feature2` was amended. `headStands` returns `{ commit }` for that output (`worktrees.ts:698-699`), and both callers act on it without comparing it with `baseCommit`. The plan's rejected row "Take `HEAD` other than `baseCommit` as the first commit" (`frame/plan.md:37`) weighed the two tests as alternatives. Each misses a case the other catches, so the fix takes both. The same guard drops the extra `rev-list` over every ref at each poll (`commitPollMs`, 3000 ms) for an idle work item whose `HEAD` still stands at its base, which is the common case.

`git grep -n -F "no tag holds" -- apps seal/threads` printed the statements of the test: the docstring at `worktrees.ts:690`, `frame/design.md:46`, `frame/questions.md:7`, the case name at `worktrees.test.ts:1087`, and `trail/phases/phase-2.md:16`, a phase record of what was built then, which stays. `frame/plan.md:37` states it in other words. The search is a sample under contract rules 12 and 19: a statement in other words escapes it.

```ts
// apps/desktop/src/daemon/worktrees.ts:686-703, headStands whole
/**
 * What the worktree of a work item with no branch yet holds for one: the
 * branch its `HEAD` names, where it names one, which the work item takes up;
 * the commit `HEAD` is detached at, where no local branch, no remote's branch
 * and no tag holds it and it is not `baseCommit`, the commit the worktree was
 * checked out at, which is a commit made in the worktree and the one Owlery
 * makes the branch at; and null where `HEAD` stands at a commit one of those
 * holds, where it stands at `baseCommit` though its base branch was deleted
 * or rewritten since, and where git cannot say.
 */
export async function headStands(worktree: string, baseCommit: string | null): Promise<{ branch: string } | { commit: string } | null> {
  const branch = await branchOfHead(worktree);
  if (branch !== null) return { branch };
  try {
    // `rev-list -1 HEAD` prints HEAD itself where nothing named after `--not` holds it.
    const unheld = (await git(worktree, ["rev-list", "-1", "HEAD", "--not", "--branches", "--remotes", "--tags", "--"])).trim();
    return unheld === "" || unheld === baseCommit ? null : { commit: unheld };
  } catch {
    return null;
  }
}

// apps/desktop/src/daemon/daemon.ts:4212, in readBranch
    if (branch === null && head !== null && head !== baseCommit && (await headStands(item.worktree, baseCommit)) !== null) this.branchUp(item.id);

// apps/desktop/src/daemon/daemon.ts:4257, in branchUp
        const stands = await headStands(worktree, held.item.baseCommit);
```

The fix pass owes the other statements too: `frame/design.md:46` "where `HEAD` is detached at a commit no local branch, no remote's branch and no tag holds, and that is not the work item's `baseCommit` (probe 2)"; `frame/questions.md:7` "a commit no local branch, no remote's branch and no tag holds, other than the commit the worktree was checked out at"; the Verdict cell of `frame/plan.md:37`, "Rejected as the only test; taken with the test of probe 2, so a base branch deleted or rewritten after the creation makes no branch"; and the case name at `worktrees.test.ts:1087`. The regression cases belong in `apps/desktop/test/worktrees.test.ts` (`headStands` gives null for a worktree detached at a base branch since deleted) and in `apps/desktop/test/daemon.test.ts` (a work item with no branch whose base branch is deleted gets no branch at the next read, and gets one at a commit made after).

```seal
verdict: fixed 56963cd0
answer: `headStands(worktree, baseCommit)` gives no commit where the unheld commit is `baseCommit`, as the paste-ready fix writes it, and `readBranch` and `branchUp` each pass the work item's base commit. The second half of the round's fix, `readBranch` asking `headStands` only where its head differs from `baseCommit`, was not built: a `HEAD` at the base commit can name a branch the worktree took up before any commit, and that guard leaves it untaken until the first commit. The new case "takes up the branch its worktree's HEAD names at the base commit, before any commit is made there" in `daemon.test.ts` went red with that guard added by `seal mutate`, and `gaps.md` *Not done* holds the rev-list it would have spared. New cases, each seen red against the source before `56963cd0` and again with the `baseCommit` check of `headStands` removed by `seal mutate`: "gives no commit for a worktree detached at a base branch since deleted or rewritten, …" in `worktrees.test.ts`, and "makes no branch at the base commit of a work item whose base branch was deleted, …" in `daemon.test.ts`, which makes the branch at a commit made after. The case at `worktrees.test.ts:1087` is renamed to name the checked-out commit as none. `seal mutate` of `branchUp`'s base commit to null SURVIVED, since `readBranch` applies the same test before it queues the turn; `gaps.md` *Not verified* holds it for the proofer. The round's search, run again after the last fix commit, prints the docstring and the case name, both rewritten here, the frame's three statements, which the framer's fold `94945fa4` rewrote, `trail/phases/phase-2.md:16`, which stays as the round says, this record, and the delete dialog's caption of a loss, `view.ts:1104`, `protocol.ts:155`, `view.test.ts:763` and `work-item-menu.test.ts:855`, which state what a delete loses and not what a first commit is.
```

### 2. The repository's removal dialog and the work item menu's Rename still say that Owlery deletes and renames every work item's branch

```seal
severity: should
location: `apps/desktop/src/renderer/view.ts:1170-1171`, `apps/desktop/src/renderer/index.html:1073`, `apps/desktop/src/renderer/view.ts:1150-1152`, `apps/desktop/src/renderer/view.ts:2336`, `apps/desktop/test/view.test.ts:820-822`, `apps/desktop/test/work-item-menu.test.ts:963`
evidence: executed `git grep -n -F "worktree and local branch are deleted" -- apps docs`, `git grep -n -F "worktrees and local branches" -- apps docs`, `git grep -n -F "and its branch too where the branch was never pushed" -- apps docs`; read `apps/desktop/src/renderer/view.ts:1163-1172`, `apps/desktop/src/renderer/renderer.ts:1146`, `apps/desktop/src/daemon/daemon.ts:1158`, `apps/desktop/src/renderer/view.ts:2318-2348`
```

Why it matters: a person reads these words before they delete or rename, and they act on them. Phase 1 made a delete remove only the branch Owlery made (`daemon.ts#removedBranch`), and the repository's removal deletes through the same `#deleteOne` (`daemon.ts:1158`). The build rewrote the delete's own words: `deleteSays` and the menu's Delete description. Phase 4 rewrote the "+" button's words because "Phase 3 made that false" (`trail/phases/phase-4.md`). Three more sentences of the window state the same old fact and were left:

- `removalChoice` says "Each work item's worktree and local branch are deleted, as named below." (`view.ts:1170` and `:1171`). In the same dialog, the per-item sentence from `deleteSays` (`renderer.ts:1146`) then says "The branch <name> stays, since Owlery did not make it." for a picked branch, and names no branch for a work item with none. The dialog contradicts itself.
- The removal's choice is labelled "Also delete the work items' worktrees and local branches" (`index.html:1073`), quoted in `removalChoice`'s docstring (`view.ts:1150-1152`).
- The menu's Rename says "Give the work item another name, and its branch too where the branch was never pushed." (`view.ts:2336`). A branch the person picked keeps its name, though it was never pushed (`planBranchRename`'s refusal, *Scope* item 7). For a work item with no branch, the rename makes its branch, and *Scope* item 10 gives the dialog that sentence.

The three searches printed `view.ts:1170-1171`, `index.html:1073`, `view.ts:1151` and `view.ts:2336` in the code. They printed the pins at `view.test.ts:820` and `:822` and at `work-item-menu.test.ts:963`, and `docs/product.md:170`. The product sentence reads "one choice deletes its work items' worktrees and local branches as a delete does", and once `## Rule changes` rewrites what a delete removes, "as a delete does" carries the new rule, so it needs no change. The searches are a sample under contract rules 12 and 19: a statement in other words escapes them. No case pins the Rename description, so contract rule 14 owes one in `apps/desktop/test/view.test.ts` on `workItemMenu`.

```ts
// apps/desktop/src/renderer/view.ts:1170-1171, removalChoice
      ? `${lists} Each work item's worktree, and the local branch Owlery made for it, are deleted, as named below, and the repository's folder then moves to the Trash, whole. Nothing on a remote is removed.`
      : `${lists} Each work item's worktree, and the local branch Owlery made for it, are deleted, as named below. The repository's folder stays, and nothing on a remote is removed.`

// apps/desktop/src/renderer/view.ts:2336, workItemMenu, where `branch` is the `const { branch } = workItem` above it
    { label: "Rename", description: branch === null ? "Give the work item another name, and make its branch from that name." : workItem.ownsBranch === false ? "Give the work item another name. Its branch keeps its name, since Owlery did not make it." : "Give the work item another name, and its branch too where the branch was never pushed.", action: { do: "rename", id }, divides: false },
```

```html
<!-- apps/desktop/src/renderer/index.html:1073 -->
<label id="remove-delete-label" class="check" hidden><input type="checkbox" id="remove-delete" />Also delete the work items' worktrees, and the local branches Owlery made</label>
```

The fix pass owes the label's quotation in the docstring at `view.ts:1150-1152`, and the two sentences pinned at `view.test.ts:820` and `:822` and at `work-item-menu.test.ts:963`, rewritten to the same words.

```seal
verdict: fixed ba5f82df
answer: The paste-ready fix applied as written, after reading it against `deleteSays`, `removedBranch` and `planBranchRename`: `removalChoice`'s two sentences, the removal's label in `index.html` and its quotation in `removalChoice`'s docstring now say "the local branch Owlery made", and the menu's Rename description says that a rename makes the branch of a work item with no branch yet, keeps the name of a branch Owlery did not make, and renames a branch Owlery made where it was never pushed. These three readers of the branch stand in no row of `frame/design.md` *The readers of a work item's branch*: `view.ts#removalChoice`, the label `#remove-delete-label` of `index.html`, and `view.ts#workItemMenu`'s Rename description. The pins at `view.test.ts` and `work-item-menu.test.ts` carry the new words, and the new case "says that Rename makes the branch of a work item with no branch yet, …" in `view.test.ts` pins the three Rename descriptions; both `view.test.ts` cases were seen red against the old words, and `seal mutate` of each removal sentence and of each Rename branch went red. `work-item-menu.test.ts` passed whole in the built app after the fix, 30 cases. The round's three searches, run again after the last fix commit, print `docs/product.md:170`, which the round leaves to the settle, the Rename description of a branch Owlery made at `view.ts:2330` and its pin at `view.test.ts:614`, both now said of that branch alone.
```

### 3. The closing memo says the screenshots are not committed, and the branch commits them

```seal
severity: should
location: `seal/threads/1795610869-217-a-new-work-item-picks-its-branch/gaps.md:23`
evidence: executed `git show --stat ecbf648c`; read `seal/threads/1795610869-217-a-new-work-item-picks-its-branch/gaps.md:23`
```

Why it matters: the sealer reads `## Not done` as what the work left undone, and a person reading the pull request's records reads it the same way. The bullet says "**The screenshots are not committed.** ... Phase 4 made them in its scratch folder ..., for the orchestrator to commit with the pull request's body." At the target, `ecbf648c` adds the six shots under `screenshots/` of the work item's directory, as `docs/design.md` *A pull request that changes the window carries its screenshots* asks. `## Not done` holds "what was within reach and deliberately not taken" (`skills/implement/SKILL.md` *4. The closing memo*), and this was taken. `trail/phases/phase-4.md` *Screenshots* says the files stay in the scratch folder. It is the phase's record of its own moment, so it stays.

```diff
--- seal/threads/1795610869-217-a-new-work-item-picks-its-branch/gaps.md
-- **The screenshots are not committed.** `docs/design.md` *A pull request that changes the window carries its screenshots* puts them in the pull request's records under `seal/threads/`, and `agents/crafter.md` *Job* names no such write for the crafter. Phase 4 made them in its scratch folder (`trail/phases/phase-4.md` *Screenshots*), for the orchestrator to commit with the pull request's body.
```

```seal
verdict: fixed c57fbc5f
answer: The bullet is removed from `gaps.md` *Not done*, as the diff gives it. The same commit marks closed the five rows of `## Not verified` this round's *Confirmations* answered by reading, each with what the round read, and the row of the downgrade, which the orchestrator's row of `frame/plan.md` *Judgments of the run* answers: the copy of `repositories.json` is the one way round. It also adds this fix pass's rows: `branchUp`'s base commit, which no case reaches, and the guard of `readBranch` not built (finding 1's close).
```

## Confirmations

What matched: each sentence of *Scope* items 5, 7, 9 and 10 that the window or the daemon says stands in the code word for word: the held branch's refusal at `worktrees.ts:548`, `planBranchMaking`'s two refusals at `worktrees.ts:750` and `:752`, `planBranchRename`'s refusal at `worktrees.ts:651`, `NO_BRANCH_FOR_CHAIN` and `NO_BRANCH_TO_WRITE` at `daemon.ts:112` and `:115`, `NO_BRANCH_HERE` at `chain-command.ts:145`, the three forms of the plan's words in `view.ts#branchParts`, the rename dialog's sentence in `view.ts#renameChoice`, and the two button sentences of `view.ts:2500` and `:2507`. (read)

What matched: `gaps.md` names the proofer for five rows of `## Not verified`. Each holds by reading. A line's last fact for a work item with no branch carries the classes `says branch none` (`list.ts:159`). The rule `.branch.none` (`index.html:360`) then sets the sans and `--ink-muted`, and wins over `.branch` (`index.html:115`) by specificity, while `.line .says.branch` (`index.html:344`) sets only the size. `renderer.ts#showPlan` hides the "Branch" field where `branchMenu` gives `shown: false` for a plan with no `held`, and `[hidden]` is `display: none !important` (`index.html:68`), so the field's `display: block` does not show it. `planLine` then draws the plan's branch as one name in `.fact`, and `createWorkItem` sends no `branch`, since the menu's value is "". `daemon.ts#chainBranch` (`daemon.ts:123-126`) throws a `ChainStop` with `NO_BRANCH_FOR_CHAIN`, and the loop's first read goes through it (`daemon.ts:3154`). `#commitWord` returns before any commit where `branch` is null (`daemon.ts:2942`). `branchUp` returns where `this.closed` (`daemon.ts:4255`). The rows stay for the orchestrator to mark, since the round edits no record. (read)

What matched: `git grep -n -e '"-b", branch' -- apps/desktop/src` printed nothing and exited 1 at the target, the frame's acceptance row "The creation no longer cuts a branch". (executed)

What matched: the repository's removal deletes each work item through `#deleteOne` (`daemon.ts:1158`), so a removal also removes only a branch Owlery made. (read)

What matched: the readers table holds every reader of the branch outside `daemon.ts` that `git grep -n -E "item\.branch|\.branch\b" -- apps/desktop/src/daemon apps/desktop/src/shared` lists: `last-look.ts:120`, `repositories.ts:369-370` and `seal-state.ts:92`. Inside `daemon.ts`, each `.branch` read the same search lists sits on a row of the table or on `#commitWord`, which phase 1 added. The search is a sample: the typecheck of the broad gate is what makes the list whole. (executed)

What matched: the six screenshots show the form with "No branch yet" chosen under "Starts from", and under the name the words "No branch yet. The first commit or a rename makes owlery/show-the-seal-on-a-line.". The name is in the sans in Night watch and Desk and in the fixed-width face in Register, as `gaps.md`'s closed row and `trail/phases/phase-4.md` *Screenshots* say. (read)

What matched: the three unit files `apps/desktop/test/worktrees.test.ts`, `apps/desktop/test/view.test.ts` and `apps/desktop/test/repositories.test.ts` passed whole at the target, 698 cases. The cases of `apps/desktop/test/daemon.test.ts` that this work added and that its phase records name, selected by `-t`, passed: 14. The branch worktree stood clean after both runs. (executed)

What matched: the other work items' frames at the moved base, those of #235 and #242, change `docs/architecture.md` *Code runs the order, the orchestrator judges* and *Screen framework: Electron*. This item's records cite the first for the clause that a chain starts on a work item whose branch holds a commit after its base, and #235 does not change that clause. At the target, `seal/threads/` holds this work item alone. (executed: `git show origin/release/v0.0.5:<each frame>`)

## Not judged

| What | Location | Who answers |
|---|---|---|
| Whether the downgrade of `repositories.json` is answered by the copy alone, or by a rename of each work item with no branch as well. The round ran no earlier build, and #257 holds the fix. | `seal/threads/1795610869-217-a-new-work-item-picks-its-branch/gaps.md:11`, `seal/threads/1795610869-217-a-new-work-item-picks-its-branch/frame/plan.md:70` | the orchestrator |
| Whether `makeBranch`'s repair from `HEAD@{1}` holds on a git older than 2.54. The round ran git 2.54.0 alone. | `apps/desktop/src/daemon/worktrees.ts:720-731` | the orchestrator |
| The suite, the typecheck and the built-app files, which the round did not run whole. The phase records say the crafter ran `tsc --noEmit` before each commit, which contract rule 2 gives to the orchestrator's broad gate alone. No defect ships from it, and the crafter's hand-back label of the suite is not in the records. | `seal/threads/1795610869-217-a-new-work-item-picks-its-branch/trail/phases/phase-4.md` | the orchestrator, by the broad gate |
| A window of an earlier build attached to a daemon of this build, which receives `branch: null`. The architecture covers the newer window on the older daemon, and the round did not trace the reverse. | `apps/desktop/src/shared/protocol.ts:272` | the orchestrator |

The case of `apps/desktop/test/work-item-form.test.ts:157` names "No branch yet in the sans", and reads the class `none` alone (`work-item-form.test.ts:179` and `:185`), not the face drawn; the rule that sets the face is read above, so the name claims more than the case pins.

## Probes

| Command | Result |
|---|---|
| `sh test_tmp_base_gone.sh <round scratch>/probe` on git 2.54.0, run once | Case A: a worktree detached at a local `feature` printed nothing for `git rev-list -1 HEAD --not --branches --remotes --tags --` before `git branch -D feature`, and printed its base commit `b4ece7a` after it. Case B: a worktree detached at `feature2` printed its base commit `5d58400` once `feature2` was amended. |
| `node scripts/test-in-electron.mjs test/worktrees.test.ts test/view.test.ts test/repositories.test.ts` in `apps/desktop` of the branch worktree | exit 0: 3 files, 698 cases passed |
| `node scripts/test-in-electron.mjs test/daemon.test.ts -t "no branch yet\|Owlery did not make\|takes up the branch\|branch it makes\|checks out a local branch a creation names\|names in a plan each branch\|stands detached"` | exit 0: 14 passed, 385 skipped |
