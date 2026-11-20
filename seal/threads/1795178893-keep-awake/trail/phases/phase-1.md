# Phase 1: 1795178893-keep-awake

## What this phase found

**The frame holds for this phase.** Each coordinate `frame/design.md` *Grounding* and `frame/plan.md` *Technical context* give for the daemon was opened at `315db03` and stands where the frame says: `Daemon#agentEvent` at `src/daemon/daemon.ts:152-168`, the pane's close at 317 to 327, the log of the look's failed write at 352 to 355, `headlessChanged` at 427 to 430, the process's exit at 453 to 464, `silentStartOver` at 478 to 482, `checkIdle` at 605 to 610, `LastLook` at `src/daemon/last-look.ts:89-126`, and the expectation on the keys of `ready` at `test/daemon.test.ts:428`. The Electron binary the plan says is absent was installed before this phase began.

The phase's code is in commit `b42b293`, and two cases more are in `21cc0d0`.

### Decisions the frame left to the build

Each was judged against `frame/design.md`, in the section named.

- **A choice that already stands changes nothing.** The daemon sends no `keepAwake` message and writes no file for a `setKeepAwake` that names the choice it holds. *Data & interfaces* says the message goes out "whenever the choice or `held` changes", and neither does.
- **One message carries a choice and the hold it moved.** Where a choice starts or releases the hold, the daemon sets the choice first and sends one `keepAwake` message with both. Scenario 5 asks for `choice: "always"` with `held: true`, and a client that received two messages would draw a state that never stood.
- **A hold lost before the holder returns never stood.** The daemon tells no client of it and holds nothing. The real holder reports a loss on a later turn of the event loop, so this path is a holder's that fails at once. The first build of it threw `ReferenceError: Cannot access 'hold' before initialization`, and the case written for it caught that.
- **The loss of a hold the daemon released is not the loss of the hold that stands.** The daemon compares the hold a loss names with the one it holds. The real holder reports nothing after a release, and the daemon does not rest on that.
- **A closed daemon holds nothing.** `Daemon#close` ends the panes, and each pane's exit sends an inbox afterwards. Under `always` that inbox would start a child after the close without the guard on `closed`.
- **The log's words for a choice that was not written** are `the choice of when to keep the Mac awake was not written: <why>`, pinned by a case as the look's are.

### Departures from the frame

- **`holdAwakeFor` takes the program's path as a second argument**, `/usr/bin/caffeinate` where none is given. *Data & interfaces* names one argument, the process id. The case for a program that cannot start needs a path that holds none, and `src/daemon/main.ts` passes the process id alone.
- **A lost hold is started again at any inbox the daemon sends**, and not only at a change of a session's state or of the choice. *Scope* item 4 names those two. The plan settles the hold in `Daemon#broadcastInbox`, and that function also sends an inbox when a work item's branch gains a commit. The hold then returns sooner than item 4 says, and never later.
- **`src/shared/keep-awake.ts` also holds `DEFAULT_KEEP_AWAKE`**, the choice of a daemon nobody has told one. *Data & interfaces* names the list and the function alone. The store reads the default from there, so the window of phase 2 can read the same.
- **Comments in three files the frame does not name were corrected.** `src/daemon/whole-file.ts` said that three of the daemon's writers use it, and `DaemonOptions.runDir` and two comments of `src/daemon/main.ts` listed two files in the run directory. Each now names the choice's file too. The search `git grep -n -i -E "last look|last-look\.json|work-items\.json" -- apps/desktop/src docs README.md` found no other sentence that lists the run directory's files. That search finds the wordings it names and is a sample.

### How each case was seen red

The cases were written first. Against a holder that started nothing and a daemon that knew no `holdAwake`, `node scripts/test-in-electron.mjs test/keep-awake.test.ts test/daemon.test.ts -t "keeping the Mac awake|the hold on the Mac"` failed 21 cases and passed one.

- The three cases of `test/keep-awake.test.ts` timed out waiting for the child or for the loss.
- The cases of scenarios 1 to 9 failed on `ready.keepAwake` being absent, on the holder's count, or on a `keepAwake` message that never came.
- The case of scenario 10 asserts an absence and passed. It was seen red with each of its two guards removed alone: with `ready` always carrying `keepAwake` it failed on the keys of `ready`, and with the holder's check taken off `setKeepAwake` it failed on a message of `{ choice: "always", held: false }`.
- The case for a hold lost before the holder returns first failed on the absent `ready.keepAwake`, which is not its guard. With the check on a loss before the hold stood removed it failed on a message of `held: false`, and with the early return removed on a message of `held: true`.
- The two cases of `21cc0d0` were written after the code. The case for a closed daemon failed with `closed` taken out of the want, on `held: 2`. The case for a released hold's loss failed with the comparison of holds removed, on `held: false` in a later `ready`.

`seal mutate` ran over each unit that adds behaviour, at `21cc0d0`, with the cases of both files' two groups as its command. Every mutant was red.

| File | Mutants | What they broke |
|---|---|---|
| `src/daemon/daemon.ts` | 17 red | the settle at `listen`, in `broadcastInbox` and in `headlessChanged`; the release at `close` and in the settle; `keepAwake` in `ready` without a holder; each of the three checks on `setKeepAwake`; the one message for a choice; `closed` in the want; both halves of the check on a loss; the early return; the message at a loss; the check that the hold already stands as wanted |
| `src/daemon/keep-awake.ts` | 15 red | `never`, `always`, `alive` and the headless sessions in the want; the check on what the file holds; the write and its shape; the choice held in memory; `-i`, and `-w` with the process id; the listeners for the child's exit and its error; the kill at a release; the two guards that report a loss once |
| `src/shared/keep-awake.ts` | 3 red | the check that a value is one of the three, the default, and `never` in the list |

The batches stop at the first failing case and print no case's name, so nine mutants were run again alone to read the failing line: the four of the two absence cases above, the two of the cases of `21cc0d0`, the release in the settle, and the two guards of the real holder.

### What phase 2 needs

- **No case reads the words of `KEEP_AWAKE_CHOICES`.** The daemon reads the list's values and not its labels or its order. Scenario 13's case is the first reader of both.
- **No case of this phase runs `src/daemon/main.ts`.** That the daemon is given `holdAwakeFor(process.pid)` on macOS and nothing elsewhere is `read`. Scenario 13's case reads the daemon's child and its arguments, which proves the macOS half.
- **`test/keep-awake.test.ts#holdsOf` finds a child by its parent and by the process id its arguments end in.** It reads this process's children, so scenario 13's case needs the parent as an argument to read the daemon's.
- **A case of the built app whose pane works now starts a real `caffeinate`.** This phase started no app, so the built-app case files were not run after the change (`gaps.md` *Not verified*).
- **The cases of `test/keep-awake.test.ts` each hold a real block for under a second.** After every run of this phase `ps -axo pid=,ppid=,args=` listed no `caffeinate` this phase started. One `caffeinate -i -t 300` whose parent is process 11040 ran throughout, and is not this work's.
