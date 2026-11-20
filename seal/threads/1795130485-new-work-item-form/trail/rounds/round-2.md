# Review round 2: 1795130485-new-work-item-form

```seal
target: f5614e0, fixes d49fd83..f5614e0
```

This is the verifying round after round 1's fix pass. The code reviewed is the diff `d49fd83..f5614e0`, which holds two commits. `e859041` changes `apps/desktop/src/daemon/worktrees.ts`, `apps/desktop/src/shared/protocol.ts` and `apps/desktop/test/worktrees.test.ts`, and corrects `changelog.md` and `gaps.md`. `f5614e0` folds the same facts into `frame/design.md` *Scope* items 4 and 6 and into `frame/plan.md` *Operational impact*, and appends round 1's two close blocks. `git diff --stat d49fd83 f5614e0` printed those eight files and no other. The round worked in a `git clone --no-local` of the branch worktree at `f5614e0`, in the round's scratch.

The records were read whole at `f5614e0`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `trail/phases/phase-1.md`, `trail/phases/phase-2.md` and `trail/rounds/round-1.md`. No `pr.md` stands yet. `Commit and pull request language` is English, so no `pr.<lang>.md` is owed. No `seal/parity.json` and no `Pact` key stand, so neither the parity read nor the pact read applies.

Carried from round 1, not established again: its verdicts on *Scope* items 1 to 10 outside the fix diff, its reading of `renderer.ts#askPlanSoon` and of the repository field's `input` listener (`gaps.md` row 15), and its reading of the sort of the remotes (`gaps.md` row 10). Opened again this round: `apps/desktop/src/daemon/daemon.ts` and `apps/desktop/src/daemon/worktrees.ts` at `365dafd`, for finding 2's claims, and `apps/desktop/src/renderer/renderer.ts#showPlan` and `apps/desktop/src/renderer/view.ts#baseMenu`, for the changed headline of `changelog.md` line 13. The spawn asked for a read of anything in `origin/release/v0.0.1...f5614e0` that round 1 did not reach. The daemon's diff, the protocol's diff and `apps/desktop/src/shared/names.ts` were read whole for it, and found nothing round 1 left open.

## Findings

None. The round opens no finding.

## Confirmations

```seal
confirms: round-1#1
```
What holds: `basesOf` now puts a line under `refs/heads/` into the local list only where it carries no second word (`apps/desktop/src/daemon/worktrees.ts:183-186`). `baseRef` accepts a local name on the same condition (`worktrees.ts:147`). So the plan's list and the creation's read agree. The default base is chosen from that list (`worktrees.ts:199-204`), so an alias is no default base either.

The class was listed by taking apart the one read `basesOf` makes. Each kind of line `git for-each-ref --format="%(refname) %(symref)" refs/heads refs/remotes` can print was set against `baseRef`, and the list and the read agree for every kind:
- a plain local branch: listed, and read as local;
- a local symbolic ref: not listed, and refused as local. Where a remote's branch of the same name exists, the list holds that remote's branch and `baseRef` reads the same remote's branch. Before the fix such a local alias hid that remote's branch from the list.
- a plain remote's branch: listed unless a plain local branch bears its name. In that case the local list holds the name and `baseRef` reads the local branch.
- a remote's symbolic ref, such as `origin/HEAD`: not listed, and refused.
- the checkout's branch before its first commit: not listed, and no default base.
- the branch a remote's `HEAD` names: a default base only where the remote list holds it.

Executed: with the guard `if (symref === "")` of `worktrees.ts:185` removed in the clone, `node scripts/test-in-electron.mjs test/worktrees.test.ts` failed 1 of 36, the new case "is no local branch that names another ref, which a base's name never reads", on "expected [ [ 'master', 'main' ], 'main' ] to deeply equal [ [ 'master' ], 'master' ]". That is the line the close's `answer:` quotes, so its claim that the case was seen red holds. With the guard restored, `node scripts/test-in-electron.mjs test/worktrees.test.ts test/daemon.test.ts` passed 138 of 138, exit 0. The new case is round 1's paste-ready case unchanged. It sits under `describe("the default base")` and holds a fact that no other case of that group holds: no other case plants a symbolic ref under `refs/heads`. This run is also round 1's probe run again, since the case builds the repository the probe built.

The statements of the fact were read where they stand. They are the comments on `WorktreePlan.localBases` (`worktrees.ts:74`), on `baseRef` (`worktrees.ts:129-135` and `:148`) and on `workItemPlan` (`apps/desktop/src/shared/protocol.ts:170`). `frame/design.md` *Scope* item 4 (line 73) and item 6 (line 83) state it too, and so does `changelog.md` line 8. Each now says that a local branch naming another ref is no base. `changelog.md` line 8 says the branch the alias names is listed in its place. That holds where the alias names a branch, which is the case the sentence describes.

```seal
confirms: round-1#2
```
What holds: the corrected sentences say what an earlier daemon does. The round read `apps/desktop/src/daemon/daemon.ts:252-254` at `365dafd`: that daemon accepts any string title and stores `title: message.title`. It read `apps/desktop/src/daemon/worktrees.ts` at `365dafd`: `slugFor` returns `work-item` for a title that leaves nothing, the branch is `owlery/<slug>`, the folder is `<root>/<repo name>/<slug>`, and the loop appends `-2`, `-3` and so on to both. It read `work-items.ts#add` at `365dafd`: the method stores the title as given and refuses nothing. So these three statements hold: `changelog.md` line 13 ("the branch `owlery/work-item`, the folder `work-item` and no title"), `gaps.md` line 14 ("with a number appended where either is taken"), and `frame/plan.md` line 69, which is round 1's replacement word for word. The changed headline of `changelog.md` line 13, "its menu "Starts from" stays empty", holds as well. `index.html:522` opens the menu as an empty, disabled `select`. With no answer, `baseMenu` returns no base and the value null (`view.ts:806`), and `showPlan` replaces the menu's children with nothing and disables it (`renderer.ts:211-212`). Read.

The fix pass left the window unchanged, and the close names this as the orchestrator's choice. Round 1 offered that choice, and *Scope* items 3 and 7 support it. A guard in the window would store a title the branch does not bear. `gaps.md` line 14 keeps the earlier daemon's behaviour as a row and names the owner as its answerer. Read.

What matched: `gaps.md` lines 7 and 8, as the fix pass amended them. The label `unverified` is honest. The rows say the fix pass ran `test/worktrees.test.ts` and not `test/daemon.test.ts` or `test/work-item-form.test.ts`. This round ran `test/daemon.test.ts` beside `test/worktrees.test.ts` in the scratch clone, and both passed. That run is narrow, and it does not close the row: the suite, the typecheck and the broad gate at `f5614e0` stay the orchestrator's. Executed.

What matched: `git diff --stat d49fd83 f5614e0 -- apps/desktop/src/renderer apps/desktop/test/memory.ts apps/desktop/test/korean-pane.ts apps/desktop/test/work-item-form.test.ts apps/desktop/test/view.test.ts` printed nothing. The same command over `apps` printed "3 files changed", so the path is read. The fixes touch none of the files of scenarios 8 to 12, and round 1's executed runs of them at `82dfaa9` stand for those files. Executed.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The suite, the whole typecheck and the broad gate at `f5614e0`. This round ran `test/worktrees.test.ts` and `test/daemon.test.ts`, nothing else. `test/work-item-form.test.ts` was not run, because it starts the app and its clone holds no symbolic ref under `refs/heads`, so the fix does not change what it reads | `gaps.md:7-8` | the orchestrator's broad run |
| A work item whose stored `baseBranch` later becomes an alias. An example is a repository that renamed `master` to `main` and kept `master` as a symbolic ref. `baseRef` refuses the alias, so `aheadOf` gives no count where the daemon of `365dafd` counted through it. This behaviour comes from phase 1 and not from the fix. *Scope* items 4 and 10 state it. The probe shows that an earlier daemon never stored an alias's name at a creation, because git moves `HEAD` to the alias's target at a checkout | `apps/desktop/src/daemon/worktrees.ts:146-149`, `apps/desktop/src/daemon/worktrees.ts:268-270` | the owner, where a repository keeps such an alias |

## Probes

| Command | Result |
|---|---|
| `node scripts/test-in-electron.mjs test/worktrees.test.ts test/daemon.test.ts`, in the scratch clone's `apps/desktop` at `f5614e0` | 2 files, 138 passed of 138, exit 0 |
| `node scripts/test-in-electron.mjs test/worktrees.test.ts`, with the guard of `worktrees.ts:185` removed in the clone through the `Edit` tool and restored afterwards; `git status --short` then printed nothing | exit 1, 1 failed and 35 passed. The one failure was the new case, on "expected [ [ 'master', 'main' ], 'main' ] to deeply equal [ [ 'master' ], 'master' ]" |
| `sh test_tmp_alias_head.sh` in the round's scratch, run once with git 2.50.1 and the global and system configuration set to `/dev/null`. It made a repository on `master` with `refs/heads/main` a symbolic ref to it | `git checkout main` and `git switch main` each left `git symbolic-ref --quiet HEAD` printing `refs/heads/master`. `for-each-ref` printed `refs/heads/main refs/heads/master`. `git rev-list --count refs/heads/main..HEAD --` printed 0, exit 0, so git counts through the alias |
