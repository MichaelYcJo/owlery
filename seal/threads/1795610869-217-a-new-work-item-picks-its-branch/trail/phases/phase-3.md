# Phase 3: 1795610869-217-a-new-work-item-picks-its-branch

## What this phase found

### The frame holds, and one sentence is Owlery's where the frame names git's

The plan's row for phase 3 was checked against the tree at `e3ea2a25` before the build (read). `createWorktree`, `placeFor`, the `-b` cut, `planWorktree`, `listedWorktrees`, the protocol's comment above `createWorkItem` and `test/repositories.ts#branchOf` stand where the frame and the phase records say. The frame holds.

`frame/design.md` *Scope* item 5 says a held branch is refused "with the sentence git's refusal carries, naming the folder". The refusal comes before git runs, so git prints no sentence then, and git's own words differ between versions. The daemon says "The branch <name> is checked out in <folder>, so a new work item cannot check it out.", which carries what git's refusal carries, the branch and the folder, in the shape of the delete's sentence "The branch <name> is checked out in <folder>, so it cannot be deleted." (`worktrees.ts#readLoss`). Judged against *Scope* item 5 and `skills/core/SKILL.md` *The rule a mechanism is kept against*: one sentence a case pins, and none read from git's output.

### Decisions settled while building, each with its grounds

- **The folder is numbered alone, by `worktrees.ts#folderFor`.** `placeFor` numbered the branch and the folder together. Its branch half goes, as `frame/design.md` *Removes* states, so a branch `owlery/taken` no longer moves a new folder to `taken-2`. The case "takes the name of a branch that exists where no folder bears it, since the creation makes no branch" pins it.
- **The plan's `branch` is `branchName(repo, title, the planned folder)`.** *Data & interfaces* says the plan's branch "names the branch a making from this title would give now". The making names it from the stored title, and from the folder where the title leaves no slug, and a creation stores the folder's name as the title where none is typed. So the plan names it from the planned folder, and a second work item of one title gets the folder `-2` while the plan's branch stays unnumbered until a branch bears the name.
- **A remote's branch whose name a local branch bears checks out that local branch, and Owlery does not own it.** The design is silent on it. `remoteBases` lists `origin/x` beside a local `x` (`worktrees.ts#basesOf` compares `origin/x` with local names whole). *Scope* item 5 says a remote's branch is checked out "as git's own `git worktree add <folder> <name>` does it", and git checks out the local branch then. A local branch the person has is not Owlery's to delete (`frame/questions.md` Q2's default), so `ownsBranch` is false. The case "checks out the local branch of a remote's branch's name where one stands, and makes none" pins it.
- **The tracking branch is made by `git branch --track <name> <remote ref>`, then checked out by `git worktree add <folder> <name>`.** Git's own guess, `git worktree add <folder> <name>` with no local branch, refuses where two remotes hold the name and `checkout.defaultRemote` is unset. `remoteOf` already names the one remote, so the ref is given whole. The plan's absence check forbids `-b` to `git worktree add`. Where git then refuses the checkout, the branch made for the creation is removed again. The case "removes the local branch it made for a remote's branch where git then refuses to check it out" pins it, with a worktree git still lists at a folder removed by hand.
- **`baseCommit` of a picked branch is `git merge-base <base ref> <tip>`, and the tip where git gives none or no base stands.** This is *Scope* item 5 as written. The cases "checks out a local branch as it stands, makes no branch, and starts from the commit the branch shares with the base" and "starts from the branch's tip where it shares no commit with the base" pin both.
- **A creation on a picked branch reads the branch at once (`readBranch`), and one detached at its base keeps the counts it sets.** The counts were set to nothing new because the branch was cut a moment ago. That still holds of a worktree detached at its base. A picked branch holds whatever commits it holds, so its counts, its commits and its seal are read before `workItemCreated` goes out. The daemon case of a picked local branch pins `newCommits: 1`.
- **The creations stay on `this.changing`, and the comment above it says why now.** A creation no longer takes a branch where none is picked. It still takes a folder, checks out a picked branch, and makes the local branch of a picked remote's branch, so two creations never check out one branch and a rename never takes the name of a branch a creation makes. The case "runs a rename of a branch after a creation that is under way, so the two never take one branch" was rewritten to a creation that picks `origin/owlery/taken-name` while a rename asks for that name.
- **`createWorkItem.branch` that is no string is refused** with "a work item checks out a branch by its name, and <value> is none", as `base` is.
- **The protocol's comments of `createWorkItem`, `workItemPlan` and `WorkItem.baseCommit` and `baseBranch` were rewritten in place** (*Data & interfaces*, contract rule 19). `WorkItem.baseCommit` now says what the work starts from, and that a work item made by an earlier build holds the commit its branch was cut at.

### What this phase removed

- The cut at each creation: `git grep -n -e '"-b", branch' -- apps/desktop/src` printed nothing at `76ec868a` (executed). `git grep -n -e '"-b"' -e '"worktree", "add"' -- apps/desktop/src` printed the two `git worktree add` lines of `createWorktree` alone, `--detach` and the checkout of a picked branch (executed).
- `placeFor`'s branch half, as `folderFor` above.
- `test/repositories.ts#unbranched`, which the frame did not name. It detached a created worktree and removed the branch its creation cut. A creation now leaves the worktree that way, so the helper stood on a cut that no longer happens and would throw at its `branchOf`.

### How each case that needs a branch after its creation gets it

The plan's coordinate `git grep -n branchOf -- apps/desktop/test` listed the reads typed as a `string`. A read in a template literal or a `toMatchObject` is no type error, so the list was made whole by the run of each group of `daemon.test.ts` and of each unit file that imports a module this phase changed (*Runs*), and of the built-app files of the batch.

- **By a rename**, the act a person takes: `daemon.test.ts#branchedByRename` sends a `renameWorkItem` of the work item's own name with `branch: true`. `withWorkItem` of "what a person sets on a work item" and the shared `withWorkItems` use it, and so do the cases "carries only the fields the protocol names", "removes a repository with its work items deleted from disk", "asks git for a branch's log and diff only where its head moved", the two cases of the counts ahead and behind, "gives a work item whose branch is gone no count", "sends no inbox while the counts stay", "reads the counts between two hellos" and "leaves `record-times.json` at its start as it stood", and in `gate.test.ts` "keeps what the command printed in memory where the daemon was given no run folder" (`6da504e1`), whose chain started at once after its commit, before any read could make the branch. In the built app, `approval-line.test.ts` and `seal-back-view.test.ts` send the same rename from their second client, `screenshots.test.ts` sends it after each creation through the form, and `work-item-menu.test.ts#create` renames each work item in the rename dialog with its choice taken.
- **By a commit and a read:** "shows a commit made in a work item's worktree as one new commit ... on the branch the read makes at it" commits in the detached worktree and waits for the inbox that carries both the branch and the counts, since the making and the read each send one, in either order.
- **By `test/repositories.ts#branchedWorktree`,** for a fixture built outside a daemon: a creation with no branch picked, then `makeBranch` with the name `branchName` gives, the function a rename and a read both call. `chain-run.ts#standing`, `daemon.test.ts#runFolderWithWorkItem`, the stored fixtures of the machine's caps and of the pull request's watch, the fixtures of `worktrees.test.ts` after its creation group, and the two stored work items of `screenshots.test.ts` take it. `runFolderWithWorkItem` drops its `ownsBranch` from the entry of `work-items.json`, as no build that wrote that file wrote one.
- **By a picked branch:** the two phase-1 and phase-2 cases of a branch Owlery did not make now pick a real local branch `picked`, and `role-bundle.test.ts`'s "Carried" picks `carried`, since its pane asks the chain command at its start, before any commit.
- `work-item-form.test.ts` reads the worktree's `HEAD` where it read the cut branch, since the creation there picks no branch.

Three cases of "what a person sets on a work item" ordered a creation that cut a branch against a read's turn, a rename and a delete. The first and the third now expect no branch from the creation, and the second picks a remote's branch, as above.

### Seen red, and the mutation runs

The new and rewritten creation cases were run against the source as it stood at `e3ea2a25`, with this phase's source changes set aside in a stash and applied back before the commit (executed). In `worktrees.test.ts` *createWorktree*, 14 failed and 11 passed: the default base's cases, the start at a named base, the folder's numbering and the two refusals of a folder outside a repository, which this phase did not change in what they assert. In `daemon.test.ts` *work items*, 9 failed: the creation, the two cases of naming, the start at a base, the picked branches, the held branch, the two plans, and "carries only the fields", whose rename has no branch to make at that tree.

Each unit was then broken by `seal mutate` after `76ec868a` (executed):

| File | Mutants | Verdict | Cases run |
|---|---|---|---|
| `src/daemon/worktrees.ts` | the folder's numbering; the plan's `held`; the plan's branch named from the repository's folder; the detached worktrees in `held`; the refusal of a name that is no branch; the fetch of a picked remote's branch; the local branch of its name taken for one to make; the refusal of a held branch; `-b` back in the detached `git worktree add`; `--no-track` for the tracking branch; the removal of the branch where git refuses; the merge base skipped; the tip fallback; `ownsBranch` false | 14 red | `test/worktrees.test.ts -t "^createWorktree "` |
| `src/daemon/daemon.ts` | the refusal of a `branch` that is no string; the `branch` not passed on; the read of a picked branch skipped; `ownsBranch` stored true; the counts of a detached creation set for a picked branch | 5 red | `test/daemon.test.ts -t "checks out a local branch a creation names\|names in a plan each branch a worktree has checked out\|creates a work item and opens a pane ... which stands detached"` |

### Runs

The spawn bounded each command to three test files and `daemon.test.ts` to named groups, since parallel runs exhaust this machine's PTYs. The phase boundary set was run that way in place of one command (executed):

- `daemon.test.ts`, every one of its 26 groups at the tree of `76ec868a`, in eight commands of one to seven groups, each after the file's last change: all passed.
- `chain.test.ts` whole, 170 cases; `worktrees.test.ts`, `repositories.test.ts` and `heavy-run.test.ts`, 144 cases; and the other unit files that import `daemon/daemon.ts`, `daemon/worktrees.ts`, `shared/protocol.ts`, `test/repositories.ts` or `test/chain-run.ts`, listed by `grep -lE` over `apps/desktop/test/*.test.ts` with the built-app files taken out, in seven commands of up to three files: all passed but `gate.test.ts`'s case above, which `6da504e1` gave a branch, and `gate.test.ts` then passed whole, 18 cases.
- No `posix_spawnp failed` stands in the outputs kept: every run's but the first six unit commands', whose output file the next command wrote over (executed: `grep -l posix_spawnp` over the phase's scratch folder).

`tsc --noEmit` passed before each commit (executed). The repository configures no linter or formatter (`trail/phases/phase-2.md` *Runs*).

### The built-app batch

The batch ran once, at `76ec868a`, in three commands of the `app` project (executed): `work-item-menu.test.ts`, `work-item-form.test.ts` and `role-bundle.test.ts`, 56 cases passed; `approval-line.test.ts`, `seal-back-view.test.ts` and `screenshots.test.ts`, 13 passed and one skipped, which runs only with `OWLERY_SCREENSHOTS`; `daemon-restart.test.ts`, 4 passed.

The files were chosen by reading each file `git grep -l -e createWorkItem -e work-item-create -- apps/desktop/test` lists among the `app` project's, and each file that imports `test/korean-pane.ts` or `test/memory.ts`, for a case that reads or commits on a created work item's branch. `ask-section`, `chain-choice`, `notification-click`, `theme-controls`, `terminal-basics`, `records-dialog`, `role-session`, `machine-dialog`, `korean-input`, `launch` and `memory` create a work item and read only the plan's text or no branch, or read a branch a case wrote into the store, so they were not run (read). `daemon-restart.test.ts` creates none through the window but reads the branch of `chain-run.ts#standing`, which this phase changed.

### What the next phase needs

The form still shows, under the name, the plan's branch in the words of a creation that cut it, and a creation through it now makes a work item with no branch. *Scope* item 9's words, the branch field and the drawing of a plan with no `held` are phase 4's. No release ships between the phases.
