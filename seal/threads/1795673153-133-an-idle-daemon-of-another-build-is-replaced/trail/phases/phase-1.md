# Phase 1: 1795673153-133-an-idle-daemon-of-another-build-is-replaced

## What this phase found

**The frame holds, and the build departs from it in four places.** Each is a departure from `frame/plan.md` *Phases*, row 1, or from `frame/design.md` *User scenarios & acceptance*, and none changes what *Scope* items 1 to 4 and 9 to 11 ask.

- **The line units stand in a new module, `apps/desktop/src/daemon/stop-record.ts`.** `src/daemon/main.ts` runs the daemon when it is imported, so no case of scenario J can import a unit of it. The new module holds `stopLine`, `endedLine`, `stopRecord` and `recordErrors`. `src/daemon/main.ts` still writes both lines to its standard output, as `frame/design.md` *Data & interfaces* gives it, through that module. The plan's Delivers cell names no new file. Judged against `frame/design.md` *Data & interfaces*, the bullet on `apps/desktop/src/daemon/main.ts`.
- **`apps/desktop/test/built-app.ts` exports `freePort`.** Scenario K needs a port nothing listens on, and the harness already had one. A copy in the case would state the same thing twice.
- **The counts case of scenario J asserts 3 panes alive and 2 agents working, not 1 and 2.** Its daemon holds a pane that exited, a Claude Code pane whose state is `working`, two shell panes alive, a headless session that finished and one that works while its permission request waits. Each of the three filters of `Daemon#stopCounts` then has an entry to leave out, which the mutation runs below show. With the design's figures the filter of headless sessions had nothing to leave out, and its mutant would have survived.
- **Scenario D is three cases in the `idle exit` group of `test/daemon.test.ts`, not one.** One reads a live pane. One reads a working headless session, then the same daemon once the session and the work item's pane have ended. One reads a running chain during its broad gate stage, where the case asserts that no headless session works or is queued, so the chain's field alone holds the judgment, and then the same daemon once the chain rests. The group is the one of `Daemon#checkIdle`, the exit the judgment mirrors.

**The units the phase adds, and where each stands.** `readyOf` of `apps/desktop/src/daemon/discovery.ts` is the hello of *Data & interfaces*: it gives the `ready` a daemon answered with, typed as no more than an object. `answers` of `src/main/daemon-client.ts` now calls it, and so do `daemonForLoad` and the daemon's start. `runsNothing` and `daemonForLoad` of `src/main/daemon-client.ts` carry *Scope* items 1 to 4. `daemonForLoad` wraps `ensureDaemon`, and the `start` act of `src/main/main.ts` calls it with a set of builds the main process keeps for as long as it runs. `Daemon#stopCounts` is the one public unit of `src/daemon/daemon.ts` the design names.

**Decisions settled while writing the code, each with its grounds.**

- **A build joins the set of replaced builds when its stop begins, not when the stop succeeds.** *Scope* item 3 speaks of a build "this run of the app already replaced", and item 4 of a stop that fails. A load whose stop failed shows the stop's sentence, and the window does not ask again by itself: `connect` of `src/renderer/renderer.ts` leaves a failure in the status line "until the person starts the app again". A person's reload would ask again. Counting the attempt keeps such a reload from signalling a daemon that already outlived one signal, and waiting five seconds more for it, at every reload. The reload then attaches to the daemon and shows the notice of another build, whose "Restart Daemon…" stays the person's way to replace it. Judged against `frame/design.md` *Scope* items 3 and 4.
- **A parked chain counts as one that does not run.** *Scope* item 1 names only a `chain.state` of `running`. Judged against that item.
- **The stop's line is written once in a process.** `stopRecord` holds a flag, so an error raised while a stop that a signal began is closing the daemon writes no second line. The open decision the lines serve counts restarts that ended a working agent and crashes (`frame/design.md` *Grounding*, the row on *Open decisions*), and two lines for one end would count it twice. The first cause stands. Judged against `frame/design.md` *Scope* items 9 and 10.
- **`stopRecord` never throws.** Where the counts cannot be read it writes nothing and returns, so the listener of `uncaughtExceptionMonitor` cannot throw inside a crash. Judged against *Scope* item 10, "changes nothing else of how the process ends".
- **The listener of `uncaughtExceptionMonitor` is added right after the `Daemon` is made**, so the counts it reads exist. An error before that point is a start that failed, which `main().catch` writes as today, and the app reads it as the start's last line.
- **The start reads the standing `daemon.json` after the daemon listens and right before `writeDiscovery`, and passes over a file that names its own process id.** Its hello waits up to one second where something listens at the old address and does not answer. Nothing listens there after a kill, and the connection is refused at once. `ensureDaemon` waits ten seconds for the file.

**An interval the build leaves, as the plan's second client does.** `daemonForLoad` reads `daemon.json`, says hello and judges, and `stopDaemon` then reads the file again and says hello again before it signals. Where another app of a third build replaced the daemon between the two reads, the stop ends that app's daemon, which was just started and runs nothing. The window of that app reloads a second later and starts its daemon again, and the set of replaced builds stops a second round. Judged against `frame/plan.md` *Technical context*, the failure scenario "A second client", which accepts the interval for this release.

**Mutation showed two guards that no case held, and each now has a case** (`59f1336f`). A load that finds an idle daemon of the script's own build keeps it: removing `otherBuild` from the judgment left every case green before the case "keeps a daemon of the script's own build that runs nothing" was added. And a start whose `daemon.json` names a daemon that still answers writes no line: the hello of the start's line had no case until the case of scenario K starts two daemons on one run folder.

**A race in the stand-in of `test/daemon-client.test.ts`** (`f14c10b3`). The stand-in wrote its `port` file with `writeFileSync`, and `started` returns as soon as the file exists, so a case could read the file empty, and `Number("")` gave port 0. The baseline of one mutation run failed on the unmutated file at the line `expect(alive(first.pid)).toBe(false)`, because the load found no daemon at port 0 and kept the stand-in. The stand-in now writes the file through a rename. The cases of `stopDaemon` share the helper and had the same race.

**Seen red.** Each new case was run before its code, against stubs that kept the behaviour of the tree at `741b044d`, or against the tree's own code.

- `test/daemon-client.test.ts`, with `runsNothing` answering false and `daemonForLoad` calling `ensureDaemon` alone: exit 1, five cases red. The replacement case and both variants of the once-per-build case failed on `expect(alive(...)).toBe(false)`, the case of a failed stop on "promise resolved … instead of rejecting", and the case of idle lists on `expected false to be true`.
- `test/daemon.test.ts`, with the module of the lines returning empty strings and doing nothing, and `stopCounts` giving zeros: exit 1, five cases red, each on its own `expect` line.
- `test/daemon-restart.test.ts`, with `src/main/main.ts` held at `741b044d` by a stash and the daemon's `main.ts` not yet changed: exit 1, three cases red. Scenario A failed on "the earlier daemon, still there", and the SIGTERM case and the first case of scenario K on `expected [] to have a length of 1`. Scenario B's case, which stands at the frame's commit, passed unchanged in that run and in every later one.
- The cases that assert that something is kept, not signalled, not counted or not written passed against those stubs, and each was seen red by a mutation that removes its one guard, in the table below.

**Mutation runs**, each with `seal mutate` at the commit named, the cases filtered with `-t` to the group the unit's cases stand in. Each verdict below is from a run of that mutant alone, whose failing case and line were read. The first batch of the judgment's six mutants printed `red` in 0.4 seconds each, which is shorter than a start of Electron and vitest, so the six were run again one at a time, at 2.5 to 3.3 seconds each.

| Unit | Mutant | Verdict, and the case that went red |
|---|---|---|
| `runsNothing` | `session.alive === false` to `!== true` | red: an entry not of the shape, `[{"id":1}]` |
| `runsNothing` | the headless state read as `!== "working"` | red: "is false of lists that hold a queued headless session" |
| `runsNothing` | the chain's state read without its type | red: an entry not of the shape, `[{"id":1,"chain":{}}]` |
| `runsNothing` | `"running"` to `"runs"` | red: "is false of lists that hold a running chain" |
| `runsNothing` | `chain === null` to `=== undefined` | red: the idle lists, `expected false to be true` |
| `runsNothing` | the guard of a list that is no list, for `headless` | red: "is false where one of the three lists is missing", `headless.every is not a function` |
| `daemonForLoad` | without `otherBuild` | red: "keeps a daemon of the script's own build that runs nothing" |
| `daemonForLoad` | without `!replaced.has(...)` | red: both variants of the once-per-build case |
| `daemonForLoad` | without `replaced.add(...)` | red: both variants of the once-per-build case |
| `daemonForLoad` | without `runsNothing` | red: the replacement case and the keep cases |
| `daemonForLoad` | the stop's rejection swallowed | red: "starts nothing where the stop … fails", "promise resolved … instead of rejecting" |
| `readyOf` | the `ready` handed on as `{ type: "ready" }` | red: the replacement case and both variants of the once-per-build case |
| `Daemon#stopCounts` | every pane counted alive | red: `panesAlive: 4` |
| `Daemon#stopCounts` | headless sessions left out of the agents | red: `agentsWorking: 1` |
| `Daemon#stopCounts` | every live pane counted working | red: `agentsWorking: 4` |
| `Daemon#stopCounts` | every headless session counted working | red: `agentsWorking: 3` |
| `stopLine` | the comma after the cause dropped | red: the line of a stop, and the two cases that read it |
| `endedLine` | `after daemon` to `after` | red: the line of a start |
| `stopRecord` | the flag that writes once removed | red: "writes the stop's line once", two lines |
| `stopRecord` | the catch rethrows | red: "writes nothing, and throws nothing", `the daemon is broken` was thrown |
| `recordErrors` | `error` to `idle` | red: the line with `error` |
| `recordErrors` | `uncaughtExceptionMonitor` to `uncaughtException` | red: the line with `error`, `expected [] to deeply equal` |
| daemon's `main.ts` | the stop writes no line | red: the SIGTERM case, no line |
| daemon's `main.ts` | SIGTERM named `signal SIGINT` | red: the SIGTERM case read a line that says `signal SIGINT`, which also shows the run built the mutated script |
| daemon's `main.ts` | the start's line written whatever stands | red: "holds no such line …", two lines |
| daemon's `main.ts` | the start's line without its hello | red: "holds no such line …", one line |

The mutants of `src/daemon/main.ts` ran against `test/daemon-restart.test.ts`, whose `beforeAll` builds `dist/` from the tree, so each run read the mutated script. The commits the runs read: the judgment and the load at `59f1336f` and at `f14c10b3`, every other unit at `f14c10b3`.

**What no case holds, read instead.** `src/daemon/main.ts` passes `idle` at `onIdle`, `signal SIGINT` at SIGINT, and the process itself to `recordErrors`. The idle exit takes 60 seconds, which `frame/design.md` scenario J leaves to review, and no case crashes the built daemon or sends it SIGINT. Each is a line of `src/daemon/main.ts` read at `f14c10b3`, and `gaps.md` *Not verified* carries them.

**Narrow runs.** The typecheck of the changed files and what they import, through a `tsconfig` that extends the package's and lists the ten changed files, exited 0 at `4e58669f` and again at `f14c10b3`. The phase boundary run is the three files the plan names, whole, in one command at `f14c10b3`: `node scripts/test-in-electron.mjs test/daemon-client.test.ts test/daemon.test.ts test/daemon-restart.test.ts` in `apps/desktop`. It exited 0, with 3 files and 441 cases passed. The plan names these three files, and the spawn asked for the plan's set. The other test files that import a changed path or start the built app are the broad gate's, and `gaps.md` *Not verified* names them. The read of the range afterwards rewrote two comments of `src/main/main.ts` and `src/main/daemon-client.ts` (`a0b4233c`), and changed no code. On that commit the app's build exited 0 and `test/daemon-client.test.ts`, which imports the second file, passed whole, 29 cases, exit 0. The boundary run was not repeated for a change to comments.

**For phase 2.** A stand-in daemon of another build that scenario H writes into the run folder through `writeRun` is replaced at the load unless its `ready` lists something that runs. The design's scenario H gives it one live pane, so its `sessions` has to hold that pane with `alive: true`.
