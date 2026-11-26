# Phase 2: 1795610869-217-a-new-work-item-picks-its-branch

## What this phase found

### The frame holds, and the phase-1 fixtures needed a holder for their commit

The plan's row for phase 2 was checked against the tree at `40e083a8` before the build (read). `planRename`, `renameWorkItem`, `NO_BRANCH_TO_RENAME`, `readBranch` on `headCounts`, `planBranchRename`'s loop and the phase-1 case it names stand where the row says. The frame holds.

One thing the frame did not name: three phase-1 fixtures hold a work item with no branch whose worktree's `HEAD` is a commit that nothing else holds. They are `daemon.test.ts#daemonWithoutBranch`, `chain-run.ts#standing` with `branchless`, and the delete case "deletes a work item with no branch yet and one on a branch Owlery did not make". Once this phase landed, the first read makes a branch at that commit, so those cases would no longer meet a work item with no branch. After this phase, such a work item stays that way only until the next read.

- `daemonWithoutBranch` tags its commit `lone`, and `standing` tags each with `held-<id>`. A tag holds the commit, so no read takes it for a commit made in the worktree. The cases that need the branch made make a commit of their own.
- The delete case makes its commit after the daemon's first read, with `readyWaitMs` and `commitPollMs` at a minute, so no read comes before the delete.

### Decisions settled while building, each with its grounds

- **The test of a first commit is `worktrees.ts#headStands`.** It gives the branch the worktree's `HEAD` names. Where `HEAD` is detached at a commit that no local branch, no remote's branch and no tag holds, it gives that commit. Otherwise it gives null. This is probe 2 of `frame/design.md` *Grounding* and the last row of `frame/plan.md` *Alternatives considered*, built as written.
- **`readBranch` queues the making only where `headStands` finds something, and the turn reads the worktree again.** The turn is `daemon.ts#branchUp`, on `this.changing`. A work item with no branch whose `HEAD` stands at a held commit queues nothing. In its turn, `branchUp` does nothing where the work item has a branch by then. A rename that waited ahead of it gives it one that way. The case "gives a work item with no branch yet one branch where a rename makes it while a read finds a commit in its worktree" pins both the queue and that check. The grounds are *Scope* item 6, "a rename and a read never both make a branch".
- **The turn skips an archived work item.** A turn can be queued before an archive and run after it. Making the branch then would break the protocol's sentence "The daemon reads git for no archived work item" (`protocol.ts`, the comment above `archiveWorkItem`). The check was dropped once (`a45c43a1`) and put back (`9d296efc`) when a read of the range met that sentence. The case "makes no branch for a work item archived while a read's turn to give it one waited behind a creation" pins it.
- **No dedupe of queued turns.** A set of the work items with a turn waiting survived its `seal mutate` run. Each turn reads the worktree again, so a second turn finds the branch made and does nothing. Nothing a case or a person sees depended on the set, so it was removed (`f2c672b3`). Judged against `skills/core/SKILL.md` *The rule a mechanism is kept against*.
- **`branchName` and `planBranchRename` share a private `numberedBranch`, and `planBranchRename` does not call `branchName`.** This departs from `frame/design.md` *Data & interfaces*, which says `planBranchRename` "uses it". The two differ where a name leaves no slug. `branchName` falls back to the worktree's folder, as *Scope* item 6 asks. `planBranchRename` keeps its refusal "The name leaves no letter or digit to name a branch by.", and lets the work item's own branch stand in the way of no name. The loop is what `frame/plan.md` *Technical context* asks the two to share. `numberedBranch` is that loop.
- **`planBranchRename` takes `owned: boolean` as a required argument.** A default would let a caller that forgot pass a branch the person picked. The refusal comes first after the slug check, before git is read, since it holds whatever git says of the branch. Its words are *Scope* item 7's.
- **The plan of a rename that makes a branch is a new function, `worktrees.ts#planBranchMaking`.** `frame/design.md` *Data & interfaces* names no function for `planRename`'s answer on a work item with no branch. It gives the name `branchName` gives. It is blocked where an operation is under way in the worktree: "The branch cannot be made while a merge is under way in the worktree.". It is blocked where `HEAD` names a branch: "The worktree is on the branch fix/x, which becomes the work item's at Owlery's next read.". Where git cannot read the worktree, git's words are the reason. `renameWorkItem` reads it again before it makes the branch. The reading of the markers moved out of `whyNoCommit` into `worktrees.ts#underWay`, which both use. The existing cases "the commit of a person's word" hold the move: `seal mutate` of the refusal is red there.
- **A rename that makes a branch writes no routing.** No routing names a work item with no branch (`decision-record.ts#workItemDirectories`), so `routeRenamed` is not called and `commitWord` is not reached. That is why `gaps.md` keeps `commitWord`'s guard as unreached.
- **The protocol comments of `planRename`, `renameWorkItem` and `renamePlan` say what a rename plans and does for a work item with no branch, and that a branch Owlery did not make keeps its name.** *Scope* item 7 and `frame/design.md` *Data & interfaces* ask for `renamePlan`'s comment. The other two state the same behaviour, so they were rewritten in place as well (contract rule 19).
- **The log says why at each read while git refuses.** This is *Scope* item 6 as written. `gaps.md` *Not done* holds why the line is not deduplicated.
- **The window's rename dialog says "The branch becomes owlery/<name>." for a making too.** `view.ts#renameChoice` reads only `branch` and `blocked`, so phase 2 changes nothing in the window. *Scope* item 10's sentence "The rename makes the branch <name>." is phase 4's.

### Q5: a commit that lands while git makes the branch can be left off it

`frame/questions.md` Q5 left this to the work, with the default "Git's lock orders the two writes". The default does not hold.

A probe ran a `git commit` and a `git switch --quiet -c <name>` at once, 300 times, in a worktree detached at a commit of its own (executed: `sh test_tmp_race.sh <scratch> 300` with git 2.54.0; output `race-output.txt`; `<scratch>` is `/private/tmp/claude-501/-Users-yc-Documents-GitHub-owlery/66fc475f-7468-49ce-95e4-d5ba9694fa5e/scratchpad/1795610869-217-a-new-work-item-picks-its-branch/phase-2`).

- In 296 runs the commit ended on the branch.
- In 4 runs it ended on neither the branch nor `HEAD`. The worktree was on the branch at the commit before it, with the commit's files staged.
- The raw reflog of one such run shows why (executed). The switch's entry records the racing commit as `HEAD`'s old value and the commit it read as the new value. Git's switch reads `HEAD`, makes the branch at it, and points `HEAD` at the branch without checking that `HEAD` still names that commit.

So `worktrees.ts#makeBranch` reads `HEAD@{1}` after the switch. Where that commit is not the branch's tip but descends from it, the branch is moved on to it with `git update-ref`, which checks the branch's old value. The switch stays one command, so git's refusal mid-rebase stands, as *Scope* item 6 and `frame/plan.md` *Alternatives considered* chose. The repair departs from the design's one-command `makeBranch`. It is pinned by two cases in `worktrees.test.ts`. Each runs a stand-in `git` that plays one order in place of `git switch`:

- "moves the branch on to a commit made in the worktree between git's read of HEAD and its switch onto the branch" plays the order the probe saw.
- "leaves the branch where a commit landed on it after the switch" plays a commit that lands after the switch. The ancestry check keeps that commit from being moved back off the branch.

The real race was not reproduced in a case, since one run shows one order. Its answer on a git older than 2.54 is a row of `gaps.md` *Not verified*. The orchestrator answers Q5's Status cell from this section.

### Where the plan's list of cases was not followed

- **The plan names a `worktrees.test.ts` case for the refusal of a branch Owlery did not make alone.** `daemon.test.ts` has a case on it too, "answers a `planRename` and a rename of the branch of a work item on a branch Owlery did not make with the reason". Without it, a daemon that passed `true` in place of `ownsBranch` survives (`seal mutate`, mutants 2 and 6 below).
- **The plan's case of a first commit asked for no count.** The first version of "makes the branch owlery/<slug of the title> at a commit made in the worktree ..." also asserted `newCommits: 2`. That failed once at the baseline of a `seal mutate` run: the read that queued the making had counted `HEAD` before the commit landed. A count there pins timing, not a guard, so it was dropped (`40c49cac`).

### Seen red, and the mutation runs

The new and rewritten cases of `daemon.test.ts` and the store's case in `repositories.test.ts` were run against the source as it stood at `40e083a8`, with this phase's source changes set aside in a stash and then applied back by their commit (executed). 8 failed, each on the line its guard names: the plan's answer, the picked branch's plan, a branch never made in time, and the store's list. 3 passed: the delete case, the read at `HEAD` and the chain's refusal, whose premise changed and whose guard is phase 1's. The new `worktrees.test.ts` cases failed at that tree too (executed): the `owned` refusal on its line, the others on a function that did not exist yet.

Each unit was then broken by `seal mutate` after the commit that holds it (executed). Where a run's output was read for its failing line, the table says so.

| File | Mutants | Verdict | Cases run |
|---|---|---|---|
| `src/daemon/worktrees.ts` | the own-branch exemption of `numberedBranch`; the folder fallback of `branchName`; the `owned` refusal; `headStands`' branch, its `--tags`, `--branches` and `--remotes`; the repair skipped; its ancestry check (failing line read: the branch moved back to `lone`); the under-way and the HEAD-on-a-branch refusals of `planBranchMaking`, and its catch of git's words | 12 red | `test/worktrees.test.ts -t "making the branch\|renaming a work item"` |
| `src/daemon/worktrees.ts` | `whyNoCommit`'s under-way refusal after the move | red | `test/daemon.test.ts test/chain.test.ts -t "a conflict\|a merge under way"` |
| `src/daemon/daemon.ts` | `planRename`'s making plan; `planRename`'s `ownsBranch`; the rename's `makeBranch`; its `ownsBranch = true`; its blocked check; the rename's `ownsBranch` to `planBranchRename`; the store's `ownsBranch`; `readBranch`'s queue; `branchUp`'s check of a branch (failing line read: the list held `["owlery/fix-the-login-bug", false]`); `ownsBranch: !taken` as `true`, as `false`; the take-up's `makeBranch` guard; the turn off `changing` (failing line read: `owlery/no-branch-yet` made beside the rename's branch) | 13 red | `test/daemon.test.ts -t "no branch yet\|Owlery did not make\|branch it makes\|takes up the branch"` |
| `src/daemon/daemon.ts` | the dedupe of queued turns | SURVIVED, then removed | as above |
| `src/daemon/daemon.ts` | `branchUp`'s archived check (failing line read: `owlery/no-branch-yet` made) | red | `test/daemon.test.ts -t "archived while a read"` |
| `src/daemon/repositories.ts` | `ownsBranch` left out of `setWorkItem`'s assignment, and out of its comparison | 2 red | `test/repositories.test.ts -t "whether Owlery made"` |

`branchUp`'s check of a closed daemon has no case, and `gaps.md` *Not verified* holds it.

### Runs

The phase boundary set ran as one command at `f2c672b3` (executed). It held the 25 unit files that import `daemon/daemon.ts`, `daemon/worktrees.ts`, `daemon/repositories.ts`, `shared/protocol.ts`, `test/chain-run.ts` or `test/repositories.ts`, listed by `grep -lE` over `apps/desktop/test/*.test.ts`, with the built-app files taken out. 1683 cases passed and 74 failed. 73 failures were in `daemon.test.ts`, in "a Claude Code pane and the owl chain", "headless sessions", "idle exit", "keeping the Mac awake", "the agent's notice" and "the caps on the machine". 1 was in `heavy-run.test.ts`. The output printed `posix_spawnp failed` 71 times, from `node-pty`, with a load average near 9.

Those groups and `heavy-run.test.ts`'s group were run again alone at `9d296efc`, with the load average near 4 (executed). 142 cases passed and no `posix_spawnp failed` was printed. One `heavy-run.test.ts` case timed out again: "keeps one line for the run in the run folder's file ... read while the command holds it". `heavy-run.test.ts` was then run alone (executed), and all 8 of its cases passed. Each case that failed in the boundary set has so passed once at `9d296efc`.

`9d296efc` came after the boundary run, so the groups of `daemon.test.ts` this phase changed were run again there, with `chain.test.ts`, `worktrees.test.ts` and `repositories.test.ts` whole (executed): 449 cases passed. `tsc --noEmit` passed at each commit of the phase (executed). The repository configures no linter or formatter (read: `package.json` of the root and of `apps/desktop`, and no config file of either kind), so the typecheck is the only check of the files each commit changed.

The plan names no built-app change for this phase, and no built-app file was run.
