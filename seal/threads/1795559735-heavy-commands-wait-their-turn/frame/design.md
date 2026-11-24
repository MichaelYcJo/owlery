# Design: heavy commands wait their turn (#134)

## Grounding

The tree as read at `404b9cd`, the branch `feat/134-work-items-start-their-heavy-checks-at-once`, cut from `release/v0.0.4` at `4a005eb`. The ticket is issue #134, read with `gh issue view 134 --json title,body,comments,milestone,labels` (executed, 2026-11-25). Its three comments are the owner's. The first asks that the display stay awake for a built-app run. The second says issue #42 was to build one gate at a time for the broad gate alone and that this issue widens it. The third moves the issue to release 0.0.4. The spawn carried no line on the comments, so they were read here. `routing.md` stands and sends the work through the review chain to a pull request.

| Policy clause | What it fixes for this work |
|---|---|
| `docs/architecture.md` *Memory design*, "The limits Owlery keeps are defaults read from the person's machine, which the person sees and changes" (read) | A limit is a default the daemon proposes from this machine's memory and cores, never from a scene measured on another machine, and the person sees and changes it. The issue cites this clause as *What we keep within limits*. No document holds that heading: `git grep -n -i 'within limits' -- .` prints nothing (executed) |
| `docs/architecture.md` *Memory design*, "Owlery spends as little memory as it can, and a feature costs nothing while nobody uses it" (read) | The daemon reads the machine's load and a command's memory only while a heavy command runs or waits, and when a person opens the place that shows them. No timer runs otherwise |
| `docs/architecture.md` *Code runs the order, the orchestrator judges*, "After the rounds settle, the daemon runs the repository's broad gate" (read) | Only the exit of a run Owlery's code made counts as a gate. A run that passes is committed as a run block of `trail/gate.md`. A run that fails commits nothing. A gate that runs a second time is still a run of Owlery's code on the same head commit |
| The same section, "In a pane the session runs each stage, and the chain command keeps the order and writes each record" (read) | The chain command talks to no daemon today. A pane's gate is a heavy command, so this work makes the command ask the daemon for one thing, a turn (*Rule changes*) |
| The same section, "The daemon runs a work item's review rounds and fix passes one stage at a time, and reads where the work item stands from its committed records" (read) | The daemon keeps no position of its own. The queue's order is read from the committed records too, and the queue is not stored: a daemon that restarts holds no queue, and each command that still waits asks again |
| `docs/architecture.md` *Overall layout*, "The daemon keeps the Mac from idle sleep while an agent works" (read) | The hold is one child process, `caffeinate -i -w`, and the clause says the display may still sleep. The owner's first comment asks for the display, so the clause changes (*Rule changes*) |
| `docs/architecture.md` *State lives in three places* (read) | What a repository says about itself stands in its own tree, as `.worktreesetup` and the `Broad gate` key do. What a person sets, and what changes often, is the daemon's state in its run folder |
| `docs/architecture.md` *Role sessions run detached from the user's environment* (read), and `apps/desktop/src/daemon/adapters/claude.ts#claudeEnv` (read) | A role session's environment holds five names. A sixth is a change to that clause, which this work does not make (*Scope*, Out) |
| `docs/architecture.md` *Records are committed to the repository* and `apps/desktop/src/daemon/record-blocks.ts`, head comment (read) | A field of a record stands inside a `seal` block, and the pull request check reads the same blocks in Python. Prose outside a block is read by neither reader, so a sentence above a run block changes no grammar |
| `docs/design.md` *Components and their states*, *The voice of the window's words* and *A pull request that changes the window carries its screenshots* (read) | A dialog's heading says what it does. A count on a line is in the fact face. The pull request carries the screenshots of the window it changes |
| `docs/architecture.md` *Measure before building*, "A start of the app that an agent makes on a person's machine sets `OWLERY_BACKGROUND=1`" (read) | Every start of the built app in this work's cases sets it |
| The frame of `1795559736-caps-on-worktrees-and-agents`, issue #32, committed on its branch at `205554a`: `frame/design.md` *Scope* items 1 to 4, 7, 8 and 13, *Data & interfaces* and its seam, and `frame/questions.md` Q7 to Q9 (read). The orchestrator's message of 2026-11-25 decides the seam: #32 owns the shared parts and merges first | #32 builds the reading of the machine (`daemon/machine.ts#readMachine()`, with `cores`, `memoryBytes`, `load` and `disk`), the formulas' module `shared/machine.ts`, `limits.json`, `ready.machine`, the message `machine`, the messages `setCaps` and `readMachine`, the Machine dialog, `OWLERY_MACHINE` for the built-app cases, and the line's words "Waiting for the machine (2 ahead)". This work creates none of them and adds its own key, fields, rows and cases to each |

What the code holds, each read at `404b9cd`:

- **Nothing in the tree orders commands across work items or reads the machine.** `git grep -n -E 'loadavg|os\.cpus|totalmem|freemem|availableParallelism|statfs' -- apps/desktop/src` prints nothing (executed). `git grep -n -i -E 'semaphore|concurren|one at a time' -- apps/desktop/src` prints one line, the `concurrency:` key of the workflow text in `apps/desktop/src/daemon/records-place.ts` (executed). What issue #42 was to build, one gate at a time and a second run alone, is not in the tree.
- **`apps/desktop/src/daemon/gate.ts#startGate` starts one command with `/bin/sh -c`, with no terminal, as the leader of its own process group.** Its callers are `apps/desktop/src/daemon/daemon.ts#runGate`, the daemon's own chain, and `apps/desktop/src/daemon/chain-command.ts#gate`, the chain command a pane's session runs. Each starts the command at once.
- **`daemon.ts#runGate` lists the gate as a stage of the chain when its process starts**, enters one ledger entry for the run, and throws a `StageStopped` at every end but an exit with 0.
- **`apps/desktop/src/daemon/stage-records.ts#InTurn` is a different turn.** It puts the commits of one work item in order. This design calls its own turn "a turn on the machine" and names its module apart from it.
- **`chain-command.ts#stageFolder` finds the run folder** from `OWLERY_RUN_DIR`, or from the folder of the launcher `OWLERY_CHAIN` names. `apps/desktop/src/daemon/hooks.ts#paneCommands` gives every pane `OWLERY_PANE_ID` and `OWLERY_HOOK_SOCKET`, and a pane that carries the owl chain `OWLERY_CHAIN`. `apps/desktop/src/daemon/pane-chain.ts#writePaneChain` writes the launcher `owl-chain` into the run folder at each start of the daemon.
- **A hook of a pane cannot hold a command back.** `hooks.ts`, the constant `RELAY`: the hook sends the event to a socket and always exits with 0.
- **`apps/desktop/src/daemon/records-place.ts#readRecordsPlace` reads `config.json` of a worktree's records root** and takes the `Broad gate` key by its name. A key it does not ask for decides nothing. `pr-check/lib/config.py` was read in part, the lines that name keys and not the file whole: its readers ask for keys by name.
- **`apps/desktop/src/daemon/keep-awake.ts#holdAwakeFor` starts `caffeinate -i -w <pid>`**, and `#wantsAwake` decides when, from the person's choice. `man caffeinate` (executed): `-d` keeps the display from sleeping, and `-u` turns a display on that is off and holds it for the seconds `-t` names.
- **`apps/desktop/src/shared/protocol.ts#WorkItem` carries `chain` and `recorded`**, and `apps/desktop/src/renderer/view.ts#lineText` picks the second row of a work item's line from a fixed order of texts: a question, a call to allow, a stopped chain's sentence, the running stage, and then what the session and the branch say.
- **`apps/desktop/src/daemon/ledger.ts` keeps one entry for each stage of the daemon's own chain**, the gate among them, with its start and end. A gate a pane's chain ran has no entry.
- **The sidebar's foot holds the controls of the daemon's state**: `apps/desktop/src/renderer/index.html`, `#sidebar-foot`, with the Accounts button and the "Keep awake" choice.
- **`apps/desktop/vitest.config.ts` says why the suite is heavy.** Vitest runs files in parallel with up to one worker fewer than the machine's cores, and the files that start the built app then run one at a time. Its comment names a load average above 15 on a 10-core Mac as the load under which cases of the unit project ran past their time.
- **The search of `frame/plan.md` phase 2 was run at `404b9cd`.** `git grep -n 'talks to no daemon' -- apps/desktop` prints one line, `apps/desktop/src/daemon/chain-command.ts:3` (executed), which the first row of *Removes* names. The pathspec holds neither `docs` nor this work item's directory.
- **`apps/desktop/package.json` names version 0.0.3**, and `seal/config.json` holds the keys `Mode`, `Commit and pull request language`, `Record language` and `Broad gate` (executed, read with `python3`).

What a probe gave, each executed on 2026-11-25 on the machine this frame was written on, from a script under the framer's scratch directory:

- Node reads 12 cores (`os.availableParallelism()`), 36 GiB of memory (`os.totalmem()`) and a load average of 3.9 over the last minute (`os.loadavg()[0]`). `sysctl -n hw.perflevel0.physicalcpu hw.perflevel1.physicalcpu` prints 6 and 6. The spawn names the owner's Mac as a 10-core one, and so does the comment of `vitest.config.ts`. Which machine that is was not opened. The default of *Scope* item 2 gives 1 on both.
- `os.freemem()` read 0.8 GiB on that machine, so free memory as Node reads it on macOS is no measure of room, and this design reads total memory.
- One run of `/bin/ps -axo pgid=,rss=` took 18 ms for 890 processes, so a reading of every process each 5 seconds costs under half a percent of one core.

What reached this frame in prose and was not opened: the spawn's facts of this release's runs, which are a limit of 511 terminals with the failure `posix_spawnp failed.`, timed cases that failed under several worktrees' load, and the orchestrator's serialization by hand. They are the orchestrator's findings. This design rests on the last two as the issue states them and on nothing of the first.

Also read: `seal/follow-up.md` does not stand (`ls seal`, executed), so no item waits on this work. `seal/threads/` holds this work item alone. The latest GitHub Release, `v0.0.3`, holds no `### Process changes` heading (`gh release view --json body --jq .body`, searched, executed). The policy root holds no `README.md` index, so each `file:` of *Rule changes* is a document `ls docs` lists.

## Scope

A **heavy command** is a command a repository names as one that loads the whole machine. A **turn** is the daemon's word that one heavy command may run now. The **limit** is how many heavy commands hold a turn at once on this machine.

In:

1. **A repository names its heavy commands in its records root's `config.json`.** The key is `Heavy commands`: an object whose keys are names and whose values are command lines, each run at the worktree's top. The `Broad gate` command is heavy whether or not the key stands. A repository with no such key has one heavy command, its broad gate.
2. **The limit's default comes from the reading of the machine, which issue #32 builds.** This work adds no reader. It reads the cores, the memory and the load average of the last minute from #32's reading. The default limit is one heavy command for each 8 cores, or one for each 16 GiB of memory, whichever gives fewer, and never under one. Its formula and its sentence stand beside #32's in `apps/desktop/src/shared/machine.ts`. A value the person sets replaces the default until they take the default back, and it is kept under this work's own key of #32's `limits.json`. A daemon given no reader of the machine keeps a limit of 1.
3. **The daemon gives turns: at most as many heavy commands run at once as the limit says, across every work item and every repository.** A command that asks while the limit is full waits. The daemon orders those that wait by what the person waits on first, in these places:
   1. the broad gate of a work item, which is one step from its seal;
   2. a heavy command of a work item whose branch holds a review round's record, so it is under review;
   3. a heavy command of a work item whose branch holds no round record, so it is still being built;
   4. a heavy command run in a folder no work item's records name.

   Inside one place, the command that asked first goes first. A command that runs is never stopped for one that waits. A turn ends when its command ends, and also when the process that asked for it is gone, so a crashed command holds nothing. Lowering the limit stops nothing: it holds for the next start.
4. **The daemon's own chain takes a turn before it starts a broad gate.** While the gate waits, it is listed as the chain's stage, and the chain's sentence says that the gate waits for the machine.
5. **Any session takes a turn through one command, the runner.** The daemon writes a launcher, `owl-run`, into its run folder, and every pane's environment names it in `OWLERY_RUN`. `"$OWLERY_RUN" <name>` looks the name up in the worktree's `Heavy commands`, asks the daemon for a turn, says on its error output that it waits, runs the command line with the session's own input and output, and exits with the command's exit code. Words after `--` are added to the command line, each as one word. A name the repository does not hold is refused with exit code 64 and a sentence that lists the names it holds.
6. **The chain command's `gate` takes a turn the same way**, so a pane's broad gate waits behind the gates and commands of other work items.
7. **A command runs at once where no daemon answers.** The runner and the chain command's `gate` say so in one sentence on the error output and run the command with no turn. The same holds where the daemon ends while the command waits.
8. **A work item's line says "Waiting for the machine" while a heavy command of it waits.** The words, their count, as in "Waiting for the machine (2 ahead)", and their place in the line's second row are #32's, which words a session that waits for the agent cap so. This work gives the line a second source of the same words. Where a work item waits in both queues, the line shows the wait that began first. The work item's view says the same at the stage that waits.
9. **A broad gate that failed while the machine was over its load is run once more, alone, before it counts as failed.** The machine was over its load during a run where another heavy command held a turn during any part of it, or where the load average the daemon read at its start was above the number of cores. Alone means that no other heavy command runs beside it: the daemon lets those that run end and starts no other. The second run also waits, for 10 minutes at most, until the load average is at or under the number of cores. A second failure counts, whatever the load. This holds in the daemon's chain and in the chain command's `gate`.
10. **The record names both runs.** Where the second run passes, `trail/gate.md` holds one sentence above the run block: that an earlier run on the same commit failed while the machine was over its load, with how it ended and what the load was. Where it fails, the chain's sentence, and in a pane the command's refusal, names both runs. In the daemon's chain each run is a stage of its own with a ledger entry of its own.
11. **The daemon keeps what each heavy command took.** One line for each run, in a file of the run folder: the repository, the work item, the command's name, when it asked, started and ended, its exit code, its peak memory, the load at its start and the highest load during it, whether another heavy command ran beside it, and whether it ran alone as a second run. Peak memory is the highest sum of the resident memory of the command's process and its descendants, read every 5 seconds.
12. **While a heavy command runs, the daemon keeps the display awake, and wakes it at the command's start.** This holds under the choices "While an agent works" and "Always" of "Keep awake", and not under "Never". The hold ends with the last heavy command.
13. **The Machine dialog, which #32 builds, gains this work's rows.** One row for the limit, "Heavy commands at once", in the form of #32's rows: a number field, the default's sentence with its arithmetic, and "Use the default". Under it the heavy commands that run and wait, in the queue's order, each with the reason for its place. Under those, for each heavy command that ran: how many runs, the longest, the most memory and the highest load. *Data & interfaces* shows the words.
14. **This repository names its own heavy commands.** `seal/config.json` gains `Heavy commands` with `test`, the desktop suite's command, which takes test files after `--`, and `install`, the install.
15. **The role bundle says where a heavy command goes.** `apps/desktop/role-bundle/skills/agent-contract/SKILL.md`, rule 2, gains one sentence: a command the repository's `config.json` names under `Heavy commands` is run through the program `OWLERY_RUN` names, where the environment names one.

Out:

- **A cap on agents, worktrees and panes, and everything of the machine both work items share.** Issue #32 builds the caps, the reading, the store, the dialog and the line's words, and merges first (*Grounding*, the row of #32's frame). **How the two queues meet:** #32's queue holds sessions that wait to start, and this work's queue holds commands that a running session or the daemon's chain asks to run. A session that waits in #32's queue runs nothing, so it asks for no turn, and a broad gate is no agent, so #32's count does not hold it. Nothing waits in both queues for the same act. Their orders differ because they order different things, and they agree in direction: #32 starts a chain that already ran a stage before a chain's first stage, and this work runs the gate of a work item one step from its seal before a command of one still being built.
- **A command nobody runs through the runner.** A command a person types, or one a session starts by its own command line, takes no turn and is not seen. No hook reads a command's text to guess that it is heavy (`frame/plan.md` *Alternatives considered*).
- **A role session of the daemon's own chain.** Its environment holds the names policy gives it and no other, and nothing in the window starts that chain in this release. Issue #55 starts it, and the runner reaches it with one more name there.
- **Stopping a running command for a more urgent one, and moving a command up the longer it waits.**
- **A default that moves by itself from what was measured.** The measurements are shown beside the default, and the person decides.
- **A limit for one repository.** The limit is the machine's.
- **The repository's `.worktreesetup`.** It stays `pnpm install`, run as a new worktree's setup with no turn. A repository that wants its setup in the queue writes the runner into that file itself.
- **A second run for a heavy command that is no broad gate.** Its caller reads its exit code.
- **Windows and Linux.** The display's hold is macOS's `caffeinate`, as the hold from idle sleep is. Node gives no load average on Windows, so no run there is ever over its load.

## User scenarios & acceptance *(mandatory)*

| Scenario | Given / When / Then | Verifiable how |
|---|---|---|
| A. Two work items reach their gate together | Given a limit of 1 and two work items of two repositories whose chains owe a broad gate. When both chains reach the gate. Then one gate runs, the other is listed as the stage "Broad gate" that waits, its line says "Waiting for the machine", and it starts when the first ends | Cases of `apps/desktop/test/chain.test.ts` with two work items and a gate command that waits on a file: the second command has not started while the first runs, and the second `WorkItem` carries the wait. A case of `apps/desktop/test/view.test.ts` reads the line's second row from `machineWait`, in #32's words |
| B. The queue's order | Given a limit of 1 with one command running, and others that wait: a command of a work item with no round record that asked first, a command of a work item under review that asked second, and a broad gate that asked last. When the running command ends. Then the gate starts, then the command under review, then the one still being built | Cases of `apps/desktop/test/machine-turns.test.ts`, new, which give the turn keeper its asks with a clock and read the order of its grants. No process starts in them |
| C. A session runs a named command | Given a pane in a work item's worktree whose `config.json` names `test`. When the session runs `"$OWLERY_RUN" test -- test/view.test.ts` while another heavy command runs. Then the runner prints that it waits, starts the command when its turn comes with the word after `--` added, and exits with the command's exit code | Cases of `apps/desktop/test/heavy-run.test.ts`, new, against a daemon of the test's: the command's start follows the first command's end, the exit code is the command's, and the error output holds the sentence |
| D. No daemon answers | Given a runner whose run folder holds no daemon. When it is asked to run a named command. Then the command runs at once and the error output says that it ran without waiting its turn | A case of `apps/desktop/test/heavy-run.test.ts` with an empty run folder |
| E. The default and the person's value | Given a machine of 12 cores and 36 GiB. Then the default is 1, and its arithmetic reads: one for each 8 cores gives 1, one for each 16 GiB gives 2. When the person sets 2. Then two heavy commands run at once, and the value outlives the daemon. When the person takes the default back. Then the limit is 1 | Cases added to #32's `apps/desktop/test/machine.test.ts`: the arithmetic at several sizes, 1 core and 1 GiB among them, and the value under this work's key read by a second store on the same folder. A case of `apps/desktop/test/machine-turns.test.ts` raises the limit and reads a second grant |
| F. A gate fails under load | Given a gate whose command fails on its first run and passes on its second, and a load average above the cores at its start. When the chain runs the gate. Then the gate runs twice, the second time with no other heavy command, `trail/gate.md` holds the sentence and the run block, and the chain goes on to the seal | Cases of `apps/desktop/test/chain.test.ts` and `apps/desktop/test/chain-command.test.ts`, with a reading of the load the test gives. A fixture of `apps/desktop/test/record-blocks.test.ts` hands a gate record with the sentence to both readers, and both read its run block |
| G. A gate fails with the machine calm | Given the same command, a load under the cores and no other heavy command. When the gate fails. Then it runs once, and the chain stops as it does today | A case beside F's in each of the two files |
| H. A gate fails twice | Given a gate that fails on both runs under load. Then the chain stops, and its sentence names both runs and says the second ran alone | A case beside F's in each of the two files |
| I. What ran is kept | Given a heavy command that ran through the runner. Then the run folder's file holds its line with a duration and a peak memory above zero, and the Machine dialog lists the command with one run | A case of `apps/desktop/test/heavy-run.test.ts` that reads the line, and a case added to #32's `apps/desktop/test/machine-dialog.test.ts` |
| J. The display | Given the choice "While an agent works". When a heavy command starts. Then the holder is asked for the display too, and for a wake, and the display's hold is released when the last heavy command ends. Under "Never" it is asked for nothing | Cases of `apps/desktop/test/keep-awake.test.ts` with a holder the test gives, which starts no `caffeinate` |
| K. The dialog | Given a daemon with one command running and one waiting. When the person opens "Machine". Then it shows the reading, the limit with its arithmetic, the commands in order with each reason, and the field changes the limit | Cases added to #32's `apps/desktop/test/machine-dialog.test.ts`, a file that starts the built app with `OWLERY_BACKGROUND=1` and with #32's `OWLERY_MACHINE`, and the screenshot the pull request carries |

## Data & interfaces

Each name below is this design's proposal. A phase that finds a better name takes it and says so in its phase record. The shapes are the contract.

**The repository's key**, in `config.json` of the records root, read by `records-place.ts#readRecordsPlace` from the worktree's file:

```json
{ "Heavy commands": { "test": "pnpm --filter @owlery/desktop run test", "install": "pnpm install" } }
```

A value that is no object, and an entry whose value is no text or is empty, names nothing, and the runner's refusal says so.

**The machine's reading** is #32's: `apps/desktop/src/daemon/machine.ts#readMachine()` gives `MachineReading`, of which this work reads `cores`, `memoryBytes` and `load`. This work adds one function to #32's `apps/desktop/src/shared/machine.ts`: `heavyDefault(reading)` gives `{ value, byCores, byMemory }` as `max(1, min(floor(cores / 8), floor(memory GiB / 16)))`, with the sentence that states it.

**The limits' store** is #32's `limits.json`. This work adds the key `heavyCommands`, as in `{ "heavyCommands": 2 }`. An absent key follows the default, and a value that is no whole number from 1 to the machine's cores is read as absent.

**The turn keeper**, a new module `apps/desktop/src/daemon/machine-turns.ts` that imports nothing of the `Daemon` class and starts no process. It takes asks, each with the folder, the command's name, its place of *Scope* item 3 and whether it must run alone, and gives each a turn by the limit and the order. It is given its clock, its limit and its reading of the load, so its cases run with none of them and phases 1 to 4 of `frame/plan.md` need nothing of #32's.

**The turn socket**, a Unix socket of the run folder beside the hook socket, readable by the user alone. One connection is one command. Each message is one line of JSON:

| From | Message | Says |
|---|---|---|
| the runner | `ask` | the worktree's top, the command's name, the place of *Scope* item 3 as the runner read it from the committed records, and whether the run must be alone |
| the daemon | `waits` | how many wait before it, sent at each change |
| the daemon | `turn` | the command may start, with the load the daemon read |
| the runner | `ended` | the exit code and the peak memory |
| the daemon | `ran` | whether the machine was over its load during the run, and the highest load |

A connection that closes ends its ask or its turn. The daemon's own chain asks the keeper in process and opens no socket.

**The runner**: `owl-run <name> [-- <words>]`, one more subcommand of the chain command's script, started by the launcher `owl-run`, which sets the run folder for it, so the launcher's path serves a session outside a pane too. Exit code: the command's own, or 64 for a refusal of the runner's.

**The protocol** (`apps/desktop/src/shared/protocol.ts`), each new field optional, so a window of an earlier build reads nothing from it:

- `WorkItem.machineWait`: `{ name, since, ahead }` or null.
- A gate that waits is a `working` stage of `ChainStage` with `gate.waits: true`, and the daemon's sentence says the wait.
- #32's `Machine` gains `heavy`: `{ proposed, byCores, byMemory, set, queue }`, where `queue` lists `{ workItemId, repo, name, place, state, since }` in order. The daemon sends #32's message `machine` when the heavy queue or the limit changes too.
- #32's client message `setCaps` gains `heavyCommands?: number | null`, where null follows the default.
- `readHeavyRuns`: answered with one row for each command's name and repository, from the runs' file.

**The runs' file**, `heavy-runs.jsonl` of the run folder, one line for each run, appended and never rewritten, as `ledger.jsonl` is: the fields of *Scope* item 11.

**The gate record's sentence**, prose above the run block of the second run, in no `seal` block:

```
An earlier run on <commit> ended with exit code <n> while the machine was over its load (load average <x> on <cores> cores, <k> other heavy commands). The run below ran alone.
```

**The hold**, `keep-awake.ts`: the holder takes whether the display is held too. With it, the child is `caffeinate -d -i -w <pid>`, and each heavy command's start runs `caffeinate -u -t 5` once.

**This work's part of the Machine dialog.** #32's rows for agents, worktrees and panes stand in the same dialog and are not shown here. The first line is the probe's reading of *Grounding*. Every other number is invented for the example:

```
Machine
12 cores · 36 GB of memory · load 3.9

Heavy commands at once   [ 1 ]   [Use the default]
The default is 1: one for each 8 cores gives 1, one for each 16 GB gives 2, and the fewer is taken.

Running and waiting
1  Running  caps on worktrees and agents · Broad gate · 4 min
2  Waiting  pane menu cases · Broad gate · one step from its seal · 2 min
3  Waiting  heavy commands wait their turn · test · still being built · 6 min

What ran
owlery · Broad gate   9 runs · longest 14 min · most memory 9.2 GB · highest load 13.1
owlery · test         31 runs · longest 3 min · most memory 4.1 GB · highest load 9.8
```

## Rule changes

- add
  file: docs/architecture.md
  section: Code runs the order, the orchestrator judges
  to: **A repository names its heavy commands, and the daemon lets as many of them run at once as the machine's limit says, across every work item and repository.** A heavy command is one that loads the whole machine: the broad gate always, and each command the records root's `config.json` names under `Heavy commands`. A session runs a named command through the runner, the program its pane's environment names in `OWLERY_RUN`, and the daemon's chain and the chain command's `gate` ask for the broad gate themselves. A command that asks while the limit is full waits, and its work item's line says "Waiting for the machine". Those that wait go in the order of what the person waits on first: a broad gate, then a command of a work item under review, then one of a work item still being built, then one in a folder no work item's records name, and inside each the one that asked first. The place is read from the committed records, and the daemon stores no queue. A running command is never stopped for one that waits, and a turn ends with its command or with the process that asked for it. Where no daemon answers, the command runs at once and says so. A command nobody runs through the runner takes no turn.
    check: apps/desktop/test/machine-turns.test.ts apps/desktop/test/heavy-run.test.ts apps/desktop/test/chain.test.ts apps/desktop/test/chain-command.test.ts apps/desktop/test/view.test.ts
- add
  file: docs/architecture.ko.md
  section: 순서는 코드가, 판단은 orchestrator가
  to: **저장소는 무거운 명령을 정해 두고, 데몬은 모든 작업과 저장소를 통틀어 그 컴퓨터의 상한만큼만 무거운 명령을 동시에 돌립니다.** 무거운 명령은 컴퓨터 전체에 부하를 주는 명령입니다. 전체 검사는 언제나 무거운 명령이고, 기록 뿌리의 `config.json`이 `Heavy commands` 아래에 적은 명령도 무거운 명령입니다. 세션은 이름 붙은 명령을 실행기로 돌립니다. 실행기는 칸의 환경 변수 `OWLERY_RUN`이 가리키는 프로그램입니다. 데몬의 체인과 체인 명령의 `gate`는 전체 검사의 차례를 직접 청합니다. 상한이 찬 동안 청한 명령은 기다리고, 그 작업의 줄에는 "Waiting for the machine"이 나옵니다. 기다리는 명령은 사람이 먼저 기다리는 순서로 돕니다. 전체 검사가 먼저이고, 리뷰 중인 작업의 명령, 아직 만드는 중인 작업의 명령, 어떤 작업의 기록도 가리키지 않는 폴더의 명령이 그 뒤를 따르며, 같은 자리에서는 먼저 청한 명령이 먼저 돕니다. 자리는 커밋된 기록에서 읽고, 데몬은 대기열을 저장하지 않습니다. 도는 명령은 기다리는 명령 때문에 멈추지 않으며, 차례는 명령이 끝나거나 차례를 청한 프로세스가 사라지면 끝납니다. 답하는 데몬이 없으면 명령은 바로 돌고 그렇게 말합니다. 실행기를 거치지 않은 명령은 차례를 받지 않습니다.
    check: apps/desktop/test/machine-turns.test.ts apps/desktop/test/heavy-run.test.ts apps/desktop/test/chain.test.ts apps/desktop/test/chain-command.test.ts apps/desktop/test/view.test.ts
- change
  file: docs/architecture.md
  section: Code runs the order, the orchestrator judges
  from: A run that fails stops the chain and commits nothing, and what the command printed stays in the daemon's run folder, where the work item's view reads it.
  to: A run that fails stops the chain and commits nothing, and what the command printed stays in the daemon's run folder, where the work item's view reads it. A run that failed while the machine was over its load is first run once more, alone, and only the second run's failure stops the chain. The machine was over its load where another heavy command ran during any part of the run, or where the load average the daemon read at the run's start was above the number of cores. The second run waits until no other heavy command runs and, for 10 minutes at most, until the load average is at or under the number of cores. Where it passes, `trail/gate.md` names the earlier run in a sentence above the run block, and where it fails, the chain's sentence names both runs.
- change
  file: docs/architecture.ko.md
  section: 순서는 코드가, 판단은 orchestrator가
  from: 실패한 실행은 체인을 멈추고 아무것도 커밋하지 않으며, 명령이 출력한 내용은 데몬의 실행 폴더에 남아 작업 화면이 거기서 읽습니다.
  to: 실패한 실행은 체인을 멈추고 아무것도 커밋하지 않으며, 명령이 출력한 내용은 데몬의 실행 폴더에 남아 작업 화면이 거기서 읽습니다. 컴퓨터의 부하가 넘친 동안 실패한 실행은 먼저 혼자서 한 번 더 돌리고, 두 번째 실행이 실패해야 체인이 멈춥니다. 부하가 넘쳤다는 것은 실행 중 어느 때든 다른 무거운 명령이 함께 돌았거나, 실행이 시작할 때 데몬이 읽은 부하 평균이 코어 수보다 높았다는 뜻입니다. 두 번째 실행은 다른 무거운 명령이 하나도 돌지 않을 때까지 기다리고, 부하 평균이 코어 수 이하로 내려올 때까지 길어야 10분을 더 기다립니다. 두 번째 실행이 통과하면 `trail/gate.md`가 실행 블록 위의 문장으로 앞선 실행을 밝히고, 실패하면 체인의 문장이 두 실행을 모두 밝힙니다.
- change
  file: docs/architecture.md
  section: Code runs the order, the orchestrator judges
  from: The command reads the worktree it is run in, talks to no daemon, and keeps what it hands a session under `chain/<work item>/` of the run folder.
  to: The command reads the worktree it is run in and keeps what it hands a session under `chain/<work item>/` of the run folder. It asks the daemon for one thing, a turn on the machine before it runs the broad gate, and it runs the gate at once where no daemon answers.
- change
  file: docs/architecture.ko.md
  section: 순서는 코드가, 판단은 orchestrator가
  from: 체인 명령은 자기가 실행된 워크트리를 읽고, 데몬과는 말하지 않으며, 세션에 건네는 것을 실행 폴더의 `chain/<work item>/` 아래에 둡니다.
  to: 체인 명령은 자기가 실행된 워크트리를 읽고, 세션에 건네는 것을 실행 폴더의 `chain/<work item>/` 아래에 둡니다. 데몬에는 한 가지만 청합니다. 전체 검사를 돌리기 전에 이 컴퓨터에서 돌 차례입니다. 답하는 데몬이 없으면 전체 검사를 바로 돌립니다.
- change
  file: docs/architecture.md
  section: Overall layout
  from: The display may still sleep, and a closed lid still puts the Mac to sleep.
  to: The display may still sleep while no heavy command runs, and a closed lid still puts the Mac to sleep. While a heavy command runs, the daemon keeps the display awake too and wakes it at the command's start, since a case that waits on what the page draws fails on a sleeping display. Under "Never" it holds neither.
- change
  file: docs/architecture.ko.md
  section: 전체 구성
  from: 화면은 꺼질 수 있고, 덮개를 닫으면 Mac은 전과 같이 잠듭니다.
  to: 무거운 명령이 돌지 않는 동안에는 화면이 꺼질 수 있고, 덮개를 닫으면 Mac은 전과 같이 잠듭니다. 무거운 명령이 도는 동안에는 데몬이 화면도 켜 두고, 명령이 시작할 때 꺼진 화면을 켭니다. 화면에 그려지는 것을 기다리는 테스트는 꺼진 화면에서 실패하기 때문입니다. "Never"에서는 둘 다 하지 않습니다.
- add
  file: docs/architecture.md
  section: Memory design
  to: **How many heavy commands run at once is one of the limits, and its default is one for each 8 cores or one for each 16 GiB of memory, whichever gives fewer, and never under one.** One run of a suite takes most of a machine's cores by itself, and two at once failed timed cases on a Mac of 10 to 12 cores, so a machine of that size runs one, and a second runs from 16 cores. The 16 GiB is a first value, set before any heavy command's memory was measured. The person sees the default with its arithmetic in the Machine dialog and changes it there, and the value is the daemon's state. The daemon keeps, for each run of a heavy command, how long it took, its peak memory and the load beside it, and the dialog shows them beside the default so that the default can be checked against what ran. No measurement moves the default by itself. The daemon reads the load and a command's memory only while a heavy command runs or waits and when a person asks.
    check: apps/desktop/test/machine.test.ts apps/desktop/test/machine-turns.test.ts apps/desktop/test/heavy-run.test.ts
- add
  file: docs/architecture.ko.md
  section: 메모리 설계
  to: **동시에 도는 무거운 명령의 수도 상한 가운데 하나이고, 기본값은 코어 8개마다 하나와 메모리 16GiB마다 하나 가운데 적은 쪽이며, 하나보다 적지 않습니다.** 테스트 묶음은 한 번 도는 것만으로 컴퓨터의 코어 대부분을 쓰고, 코어가 10개에서 12개인 Mac에서 둘이 함께 돌았을 때 시간을 재는 테스트가 실패했습니다. 그래서 그만한 컴퓨터에서는 하나만 돌고, 두 번째 명령은 코어가 16개인 컴퓨터부터 함께 돕니다. 16GiB는 무거운 명령의 메모리를 재기 전에 정한 첫 값입니다. 사람은 Machine 대화 상자에서 기본값과 그 계산을 보고 거기서 값을 바꾸며, 이 값은 데몬의 상태입니다. 데몬은 무거운 명령이 돌 때마다 걸린 시간, 메모리 최고치, 그때의 부하를 남기고, 대화 상자는 그것을 기본값 옆에 보여 주어 기본값을 실제로 돈 것에 견주어 볼 수 있게 합니다. 잰 값이 기본값을 스스로 바꾸지는 않습니다. 데몬은 무거운 명령이 돌거나 기다리는 동안과 사람이 물을 때만 부하와 명령의 메모리를 읽습니다.
    check: apps/desktop/test/machine.test.ts apps/desktop/test/machine-turns.test.ts apps/desktop/test/heavy-run.test.ts
- add
  file: docs/design.md
  section: Components and their states
  to: | The Machine dialog | A dialog headed "Machine". Its first line is what the daemon read of the machine, in `--font-fact` and `--ink-muted`. Under it stands the limit, "Heavy commands at once", as a number field with the button "Use the default" beside it, which is no main button, and under the field the default's arithmetic as a sentence in `--ink-muted` at `--size-caption`. The commands that run and wait are rows of a list of records in the queue's order, each with its state in words, its work item, the command's name, the reason for its place, and its age in `--font-fact` and `--ink-faint`. What ran is a second list of records, one row for each command. The dialog opens from an icon button at the sidebar's foot. | — | — | — | The ring. | "Use the default" where the limit is the default. |
- add
  file: docs/design.ko.md
  section: 부분과 그 상태
  to: | Machine 대화 상자 | 머리가 "Machine"인 대화 상자. 첫 줄은 데몬이 컴퓨터에서 읽은 값이고 `--font-fact`와 `--ink-muted`로 적습니다. 그 아래에 상한 "Heavy commands at once"가 숫자 칸으로 있고, 옆에 단추 "Use the default"가 있으며 이 단추는 주 단추가 아닙니다. 칸 아래에는 기본값의 계산을 `--size-caption` 크기의 `--ink-muted` 문장으로 적습니다. 돌고 있는 명령과 기다리는 명령은 대기열의 순서로 놓인 기록 목록의 줄이고, 줄마다 말로 적은 상태, 작업, 명령의 이름, 그 자리에 있는 까닭, 그리고 `--font-fact`와 `--ink-faint`로 적은 지난 시간이 있습니다. 돈 명령은 두 번째 기록 목록이고 명령마다 한 줄입니다. 대화 상자는 사이드바 아래쪽의 아이콘 단추로 엽니다. | — | — | — | 고리입니다. | 상한이 기본값일 때의 "Use the default"입니다. |

## Removes

This work adds a mechanism: a queue, a limit and a key of `config.json`. The reading, the store and the dialog are #32's to add. What it takes out in return stands outside the tree. It is the rule the orchestrator kept by hand in this release's spawn prompts, one built-app file at a time behind a wait on `pgrep`. That rule's record is the spawn's and was not opened here: the timed cases failed where it was not kept. No check, hook or rule of the tree can go in return, because the tree holds none that orders commands (*Grounding*). The 20-second time of the unit project in `apps/desktop/vitest.config.ts` stays: it answers load from outside the queue, which the queue does not remove.

| Removes | Coordinate | Where it lands, or why it can go |
|---|---|---|
| The words "and it talks to no daemon" of the head comment | `apps/desktop/src/daemon/chain-command.ts`, the comment that opens the file | The comment is rewritten in place to say that `gate` asks the daemon for a turn and nothing else. The policy's sentence of the same fact is a `change` of *Rule changes* |
| The sentence that `-i` leaves the display free to sleep | `apps/desktop/src/daemon/keep-awake.ts#holdAwakeFor`, its comment | Rewritten in place: the holder keeps the display awake where it is asked to |
| The start of the gate's stage at the process's start | `apps/desktop/src/daemon/daemon.ts#runGate`, the comment "From here to the stage's listing nothing waits" and the lines under it | The stage is listed when the gate asks for its turn, and the wait for the turn stands between the listing and the start. A stop that arrives during the wait ends the ask |

Framed 2026-11-25 by framer, before the build.
