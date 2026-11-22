# Phase 1: 1795339001-worktree-setup

## What this phase found

### The frame holds

The frame was read against the tree at `85e44ee` before anything was built. Every coordinate `frame/plan.md` *Technical context* and `frame/design.md` *Grounding* name stands there: `worktrees.ts#createWorktree` at lines 521 to 536, the `createWorkItem` case of `daemon.ts` at lines 352 to 374, `Daemon#startSession` and its exit listener, the `close` case, `Daemon#endSessions`, `hooks.ts#paneCommands` and `#claudePaneCommand`, `repositories.ts#StoredWorkItem` and `#isStoredWorkItem`, `last-look.ts#isWorkItem` and `#lookOf` with the type of late fields, which is still named `SinceRepositories` on this branch, and `daemon.test.ts#WORK_ITEM_FIELDS` at line 25. No `seal/follow-up.md` stands, and no `seal/parity.json`. `routing.md` declares a framer, and `frame/design.md` stands.

One line number is off by two: `paneCommands` and `claudePaneCommand` stand at lines 89 to 104, not 87 to 104. Nothing was built on the number.

### Decisions made while building

Each was judged against `frame/design.md` *Scope* and *Data & interfaces*, which leave the point open, unless the item names another document.

- **`copyIncluded` gives a fourth field, `failure`.** *Data & interfaces* gives it `copied`, `copiedCount` and `failed`. *Scope* item 2 says a failure of either git command is recorded as the copy's failure and refuses nothing, and the protocol's `WorktreeSetup.failure` names a git command among its causes. So the copy gives git's first line of complaint in `failure`, copies nothing, and throws nothing. The setup then ends `failed` with that sentence.
- **`setupPaneCommand(env, command, id)` takes the pane's id** and gives a whole `PaneCommand`, with `OWLERY_PANE_ID` in its environment. *Data & interfaces* writes `setupPaneCommand(process.env, command)` and says the id is in the environment as `paneCommands` gives it, which needs the id. The setup pane gets no `OWLERY_HOOK_SOCKET`: the daemon's default has no socket path, and `main.ts` passes no `setupCommandFor`, so `main.ts` is unchanged.
- **The setup's own logic lives in `worktree-setup.ts`,** beside the two functions the design names: `beginSetup` reads both files, copies, and gives the record or null; `endedSetup` gives the record at its end; `isWorktreeSetup` and `setupOf` check and copy a record for the store and the look; `PANE_ENDED` and `DAEMON_STOPPED` are the two sentences of *Scope* item 5. The daemon, the store and the look each import from that one module.
- **A path that already stands in the worktree is skipped whole, and is not listed in `copied`.** *Scope* item 2 says it is not written over. A folder is not merged either. A worktree's own `node_modules/`, made by an earlier setup's `pnpm install`, is then never filled with the main checkout's packages at a run again, and "copies what is missing" (*Scope* item 6) reads per path. `cp` still gets `force: false` and `errorOnExist: false`, as *Data & interfaces* names them. That second guard is pinned by no case: `seal mutate` of `force: false` to `force: true` SURVIVED, because the skip before it holds every case.
- **A `.worktreesetup` that stands and cannot be read is a failed setup.** The design is silent on it. The creation records `failed` with the sentence `.worktreesetup could not be read: <error>`, copies nothing and starts no pane, and the work item is created. Refusing the creation instead would leave the worktree git has already added with no work item to name it. A plan answers such a repository with `setupCommand: null` and `includes: false`.
- **A setup pane that cannot start is a failed setup,** with `paneId: null` and the sentence `The setup pane could not start: <error>`.
- **`runSetup` refuses a setup whose record reads `running`.** *Scope* item 6 says "one whose setup pane's process is alive". The record reads `running` from the pane's start until its process's exit, a closed pane's process that has not exited yet among it, so the two readings are one. The refusals say `The setup of work item <id> is still running.` and `<repository folder> names no setup: it holds neither .worktreeinclude nor .worktreesetup.`; a work item the daemon does not list, an archived one, one being deleted and one whose folder is gone are refused with the sentences `worktreeFor` already gives a `start`.
- **`runSetup` waits in the `changing` chain,** behind the creations and the deletes, so no delete removes the folder while the copy writes into it. An archive does not wait in that chain, so the daemon asks `worktreeFor` again after the copy and starts no pane in a work item an archive began on meanwhile. A case holds that.
- **The daemon's own close records nothing at a pane's exit.** Its `close()` kills every pane, and a record ended there would read `failed` with the pane's exit code, or even `succeeded`: a `/bin/sh -c "sleep 30"` pane the daemon killed exited with code 0 in the cases. So the store keeps `running`, and the next daemon reads it as *Scope* item 5's "The daemon stopped before the setup command ended." A case closes one daemon and reads the setup from the next.
- **A setup that names no command begins before its copy and ends after it.** `beginSetup` takes the daemon's clock and reads it at both ends, so `endedAt` is not the start time. The first commit passed one time for both; `bfd6e1e` fixed it, with a case whose clock advances.
- **The plan reads the files after `planWorktree`,** through a second `repositoryOf` of the folder the form sent, so a folder inside a linked worktree names its main checkout's files, as a creation reads them.
- **The setup pane's id is one less than the creation's pane.** It starts first (*Scope* item 4), and the cases read that order.

### Found while building, and not changed

`TerminalSession.onExit` hands the daemon the exit code alone, without node-pty's signal. A setup command killed from outside the daemon, whose process then reports code 0, reads `succeeded`. *Scope* item 5 reads the result from the exit code, so the build does what the frame states, and `pty.ts` is untouched. `gaps.md` *Not done* holds it.

### What touches #119's coordinates, for the merge

#119 merges first, and each of these was kept to the lines named:

- `apps/desktop/src/shared/protocol.ts`: the new interface `WorktreeSetup` above `WorkItem`; one field, `setup`, at the end of `WorkItem`; the member `runSetup` of `ClientMessage` after `close`; the fields `setupCommand` and `includes` of `workItemPlan`; and the comments above `createWorkItem`, `planWorkItem`, `workItemCreated` and `workItemPlan`.
- `apps/desktop/src/daemon/last-look.ts`: the import of `isWorktreeSetup` and `setupOf`; `"setup"` added to `SinceRepositories`, which #119 renames `CameLater`, with its two docstrings; one line of `isWorkItem`; the parameter and one line of `lookOf`; and a clause of the docstrings of `lookOf` and `LastLook`.
- `apps/desktop/src/daemon/daemon.ts#workItemOf`: not changed. The setup reaches the client through `...item`.
- `apps/desktop/test/daemon.test.ts#WORK_ITEM_FIELDS`: `"setup"` added. `SETUP_FIELDS` is new beside it, and `UNSET` gains `setup: null` with a docstring that names the setup.
- `apps/desktop/src/renderer/list.ts` and `apps/desktop/src/renderer/shared.ts#detail`: not changed; phase 2's.
- `apps/desktop/test/view.test.ts`: the fixture `LOGIN` gains `setup: null`, so the file typechecks with the new required field. Nothing else of the window changed.

### Q4, measured on a stand-in

Executed in the scratch directory with `test_tmp_copy.mjs`, under Electron 45.3.3's Node 24.22.3, on the APFS data volume, one run each while the machine's load average stood near 20. The stand-in `node_modules/` held 1.0 GB in 32,000 files of 32 KB and 400 relative links. `fs.promises.cp` with the options `copyIncluded` passes took 14.3 seconds, and the volume's free space fell by 918 MB. `/bin/cp -c -R -P` took 5.2 seconds, and free space fell by 12 MB. Both kept the links as links with their relative targets. So a clone saves nearly all the disk and about two thirds of the time at this size. A creation in such a repository waits about 14 seconds on the copy. Replacing the copy is a later work item's, as Q4's options say, and the hand-back names it for `seal/follow-up.md`. Q2 and Q3 were not measured: each needs the built app or a logged-in `claude`.

### Runs and their scope

- **The phase boundary run,** executed at `d191fa6`, in one command: `node scripts/test-in-electron.mjs test/worktree-setup.test.ts test/daemon.test.ts test/repositories.test.ts test/hooks.test.ts test/last-look.test.ts test/view.test.ts`. 689 of 690 cases passed. The one failure was `the inbox > reads no count while no client is connected, …`, which asserts that no `git rev-list` runs within 200 ms after a client closes. The machine's load average was about 20. Run alone three times at the same commit, it passed each time. The phase touches neither the poll nor that case.
- **The phase boundary run again,** executed at `bfd6e1e`, the phase's last code commit, with the same command: 690 of 690 cases passed, the case above among them, in 176 seconds.
- **The baseline,** executed at `85e44ee` before the build: the four existing files of the plan row, 282 cases, all passed.
- **The typecheck of the changed files,** executed with the options of `apps/desktop/tsconfig.json` over the six changed source files and the six changed test files, 22 files of the repository with what they import: no error.
- No built-app file was run. The spawn names the five files of the plan row, and none of them builds the app.

### How each case was seen red

`worktree-setup.test.ts` failed at its import before the module stood. `hooks.test.ts`'s case failed with `setupPaneCommand is not a function`. Before the store and the look read the setup, 11 cases of `repositories.test.ts` and 13 of `last-look.test.ts` failed. Before the daemon set anything up, 10 cases of `daemon.test.ts` failed: eight of the nine setup cases then written, and the two plan cases whose answer gained two fields. The case for a repository that names nothing passed there, as an absence case does, and was shown red by removing `beginSetup`'s return of null: the creation's answer then carried a setup.

Each unit that adds behaviour was then broken by `seal mutate`, one break at a time, over the cases that cover it:

- `worktree-setup.ts` over `worktree-setup.test.ts`: 21 breaks, 21 red. They removed the white-space rule, the file check of `.worktreeinclude`, the reading of a folder as no command, `check-ignore`'s filter, the skip of a path that stands, `verbatimSymlinks`, the listing of a failed path, the refusal of `ls-files`'s failure, the reading of `check-ignore`'s exit 1, both cuts at 500, the count, each of the three causes of a failure and the order of the two failures in `endedSetup`, the return of null, the end of a setup with no command, the copy only where `.worktreeinclude` stands, the sentence of an unreadable `.worktreesetup` and its catch. Two more breaks of the clock, after `bfd6e1e`, were red too.
- `worktree-setup.ts` over the store's and the look's cases: 7 breaks of `isWorktreeSetup` and `setupOf`, 7 red.
- `repositories.ts`: 5 breaks, 5 red. They removed the reading of a running setup as failed, the setup from `setWorkItem`'s comparison, its check in `isStoredWorkItem`, its copy on read, and `setup: null` from `UNSET`.
- `last-look.ts`: 3 breaks, 3 red.
- `hooks.ts`: 2 breaks of `setupPaneCommand`, 2 red.
- `daemon.ts` over `daemon.test.ts -t "the setup of a new worktree"`: 19 breaks, 19 red. They removed the setup at a creation, its pane's kind, the sentence of a pane the daemon ended, each of the two marks that the daemon ended a pane, the guard of a closing daemon, the inbox for a closed pane's end, both refusals of `runSetup`, its second `worktreeFor`, the removal of the earlier pane, its `started` answer, the plan's two fields, the sentence and the catch of a pane that cannot start, the record's write, the check of the pane's id, and the pane's id on the record.
- One break SURVIVED: `force: false` to `force: true`, above.

The red lines of the closing daemon's guard and of the pane id's check were read alone. The first gave `exitCode` 0 and `failure` null where the case wants the daemon's sentence. The second gave the setup `failed` with code 4, the other pane's, where it should still run.

### What phase 2 needs

- `WorkItem.setup` is the record, or null. The setup pane is the session whose id is `setup.paneId`, of the kind `shell`. A pane the person closed leaves the lists, and the record still names its id.
- The creating window receives the setup pane's output from the creation on, as it does for a pane it started. `renderer.ts`'s `workItemCreated` case takes only the creation's pane with `takeStarted`, and `work-item-view.ts#write` drops output for a pane with no screen, so nothing shows wrong today. A view that shows the setup pane attaches and gets its replay. Whether the window takes the setup pane as its own or detaches it is phase 2's to decide.
- `runSetup` answers `started` with the new pane, `done` where no command stands, and `error` with the sentences of *Decisions made while building*.
- The plan's `setupCommand` is `.worktreesetup`'s text whole, so it usually ends with a newline, and `includes` says whether `.worktreeinclude` stands.

### Not exercised by any case

The daemon's fallback when no `setupCommandFor` is given, which calls `setupPaneCommand(process.env, …)`, runs in no daemon case: every case gives a `/bin/sh` command, so that no case runs the person's interactive login shell. `hooks.test.ts` pins the command the fallback builds. The fallback line itself is `read`, and Q2's drive of the built app runs it.
