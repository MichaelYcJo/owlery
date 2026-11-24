# Design: caps on worktrees and agents

Issue #32. The daemon reads the machine, proposes a cap on the agents that run at once, on the worktrees that stand and on the panes a view shows side by side, and shows the numbers each proposal came from. A person changes each cap. A headless session over the agent cap waits in a queue the inbox shows. Creating a work item warns where the disk would not hold its worktree.

## Grounding

The tree as read at `07d5e853`, the branch's head, which holds `release/v0.0.4` at `4a005ebf` and this work item's `routing.md`.

| Policy clause | What it fixes for this work |
|---|---|
| `docs/architecture.md` *Memory design*, the paragraph "The limits Owlery keeps are defaults read from the person's machine, which the person sees and changes" | The caps are the agents at once, the worktrees, and the panes a view shows at once. Each is a default the daemon proposes and a person changes. The paragraph says issue #32 builds them in milestone 3, and that until then nothing caps the agents and the worktrees. *Rule changes* rewrites both sentences |
| The same section, "never from the number of a scene measured on another machine" | A proposal uses what the daemon measured on this machine. Before it has measured an agent, the proposal needs a starting value, and `frame/questions.md` Q3 holds that value for the owner |
| The same section, the table's fourth row: "One Claude process uses 345–679 MB" | The unit of the agent cap is one agent's own process, not the tools it starts. The starting value is the range's high end |
| The same section, "A work item's view shows at most four panes at once today" and "The GPU terminal limit stays at Chromium's default of 16" | The pane cap replaces `STAGE_PANES`, and no value above 16 is taken |
| The same section, "a feature costs nothing while nobody uses it" | The daemon samples memory only while an agent lives, and measures a worktree once |
| `docs/architecture.md` *What changes because Owlery is not a plugin*, the row "Running several work items together" | The daemon sets how many run at once. This work builds the count and the queue. The order of whole work items stays milestone 3's |
| `docs/architecture.md` *Overall layout*, the keep-awake rule: "The choice is the daemon's state: it is kept in the daemon's run directory and sent to every client" | A cap a person sets is the daemon's state, kept in its run folder and sent to every client, as that choice is |
| `docs/architecture.md` *State lives in three places* | Nothing of the caps is written in the person's repository |
| `docs/product.md` *What we deliberately don't do*: "Owlery deletes nothing of a person's work without that person's word" | Nothing over a cap is ended or removed |
| `docs/design.md` *The voice of the window's words*: "A state is two words at most. The four states are" | Waiting for the machine is not a fifth state. Q8 holds the alternative |
| `docs/design.md` *A pull request that changes the window carries its screenshots* | The pull request carries a screenshot of the Machine dialog and of the line that waits |
| `docs/roadmap.md` *Milestones*, row 3, and *Releases and the tracker*, row 0.0.4 | Row 0.0.4 already names #32. Row 3 names no cap, and *Rule changes* adds it as what milestone 3's role sessions start under |

What the tree holds, each `read` at `07d5e853` unless it says `executed`:

- **No code reads the machine.** `executed`: `git grep -n -E 'totalmem|freemem|cpus\(|loadavg|statfs|availableParallelism|sysctl' -- apps/desktop/src apps/desktop/scripts` prints nothing.
- **The tree already says what an agent is.** `apps/desktop/src/renderer/view.ts#daemonStatus` counts "a live pane of a kind that reports its state". This work counts those panes and the headless sessions that are working.
- **A Claude Code pane's process is the agent's own.** `apps/desktop/src/daemon/hooks.ts#claudePaneCommand` ends its shell line with `exec … claude`, so the pane's process id (`pty.ts#TerminalSession.pid`) is `claude`'s. A headless session's process is the child `adapters/claude.ts#claudeAdapter` spawns, whose id `RoleRun` does not hand over today.
- **Three things start an agent.** A pane (`daemon.ts#handle`, the cases `start` and `createWorkItem`), a headless session a person asks for in a work item's view (the case `ask`), and a stage of a chain (`daemon.ts#runStage`). The last two go through `daemon.ts#beginHeadless`. A refresh of an account's usage starts a short session with no tool and is no headless session of the list.
- **Nothing in the window starts a chain.** `daemon.ts#startChain` says "No client message starts a chain", and `executed`: `git grep -n 'startChain(' -- apps/desktop/src` prints its definition alone. A chain parked with questions resumes from `daemon.ts#resumeChain`. So in release 0.0.4 the queue is reached from the window by the "Ask" form alone, and by a chain only from the cases, which call `startChain` as milestone 3's code will.
- **A setting a person changes has one pattern.** `shared/keep-awake.ts`, `daemon/keep-awake.ts#KeepAwakeStore`, the `keepAwake` field of `ready`, the message `keepAwake` and the client message `setKeepAwake`, with a control at the sidebar's foot (`renderer/keep-awake.ts`). The Accounts dialog (`#accounts-dialog` of `renderer/index.html`) is the pattern of a dialog opened from that foot.
- **The form already asks the daemon before a creation.** `planWorkItem` is answered by `workItemPlan`, and `renderer/view.ts#planLine` words it under the name.
- **The stage's tiles are laid out for two to four.** `renderer/index.html`, the rules on `#stage:is([data-tiles="2"], [data-tiles="3"], [data-tiles="4"])`, two columns.
- **One constant holds the pane cap.** `executed`: `git grep -n 'STAGE_PANES' 07d5e853 -- apps` prints seven lines, all in `apps/desktop/src/renderer/view.ts`: the constant, and the lines of `stageOf` and of the comments around it that name it. The pathspec leaves out `docs/`, whose two lines the settle rewrites, and this work item's directory.
- **A built-app case can write the run folder before the app starts**, through `writeRun` of `apps/desktop/test/built-app.ts`, and sets the environment of the start.
- **The checks run on macOS.** `.github/workflows/check.yml` runs `pnpm -r run check` on `macos-latest`.
- **`seal/follow-up.md` does not stand**, and no other work item's directory stands under `seal/threads/` at this commit. `executed`: `ls seal seal/threads`.
- **The latest release's note holds no *Process changes* heading.** `executed`: `gh release view v0.0.3 --json body --jq .body`, read for its headings.
- **The policy root has no index.** `docs/README.md` does not stand, so each `file:` of *Rule changes* is a document of `docs/` named by its path, with its `.ko.md` edition beside it, as the settled work items of release 0.0.3 wrote theirs (`git show origin/feat/181-a-claude-code-pane-carries-none-of-owlerys-chain:seal/threads/1795498003-interrupted-turn-stays-working/frame/design.md`).

What a probe gave, each `executed` on the owner's Mac on 2026-11-25. The probe is `test_tmp_machine.mjs` in the framer's scratch directory, run once under Electron 45.3.3 as Node (`ELECTRON_RUN_AS_NODE=1`), which is how the app starts the daemon (`src/main/daemon-client.ts`):

- The daemon's runtime is Node 24.22.3. `os.totalmem()` gives 38,654,705,664 bytes, which is 36 GB. `os.availableParallelism()` gives 12. `os.loadavg()` gives the load.
- `fs.statfsSync` of the home folder gives 25,088,950,272 bytes free of 494,384,795,648, in 0.4 ms. For a folder that does not stand it throws `ENOENT`, so the reader asks the nearest folder above that stands.
- `/usr/sbin/sysctl -n hw.perflevel0.physicalcpu hw.physicalcpu` prints `6` and `12` in 6.5 ms. Node has no call for the performance cores, so the reader asks `sysctl` for them. The owner's answer to Q2 puts them into the agent cap.
- `/bin/ps -o pid=,rss= -p <pid>,<pid>` prints one line for each process, in kilobytes, in 60 ms. For a process that is gone it prints nothing and exits 1.
- `/usr/bin/du -sk` of this repository's main checkout with its install prints 561,412 kilobytes in 141 ms, with the files already read once.
- `ps -axo rss=,comm=` listed eight `claude` processes at that moment, between 242 and 766 MB each. One read above the 679 MB that `docs/architecture.md` states.

A second probe, `test_tmp_rules.py` in the same directory, `executed` once: the plugin's reader (`skills/settle/scripts/rule_changes.py#parse`) reads *Rule changes* below with no refusal, and finds each operation's section in its document. Each `from` stands in its document at `07d5e853`, with runs of white space collapsed.

The spawn's facts, each opened: 345 to 679 MB per Claude process and the app's 500 MB are `docs/architecture.md` *Memory design*, `read`. "A worktree installs about 440 MB" is the issue's body, `read` there, and nobody's measurement in this frame: the probe's 561 MB is the main checkout, which holds the repository's history as well. "This release ran up to 6 worktrees at once" is the orchestrator's account, `unverified` here, and no number of the design rests on it.

The issue's comments, read with `gh issue view 32 --json body,comments`: the comment of 2026-11-22 adds the pane cap, which is *Scope* item 12. The comment of 2026-11-24 moves the issue to release 0.0.4.

**What release 0.0.4 changes for the roadmap's row 3.** The issue was written for milestone 3, where the daemon starts work by itself. It is now built one release earlier, so that the cap stands before milestone 3's role sessions. Row 3 therefore does not build the cap. It names the cap as what its role sessions start under, and *Rule changes* writes that sentence. In release 0.0.4 the queue can be seen from the "Ask" form, and milestone 3 adds the starts that fill it.

## The caps, in numbers

Each proposal is a floor of a division, shown to the person with its numbers. The right column is the owner's Mac as the probe read it.

| Cap | Proposal | On a Mac with 36 GB and 25.1 GB free |
|---|---|---|
| Agents at once | The smaller of two numbers: the performance cores, and half of the machine's memory divided by what one agent uses. One agent uses 679 MB until the daemon has measured five agents here, and then the highest value among the last twenty it measured. At least 1 | 6. The performance cores give 6, and the memory gives 18,432 MB ÷ 679 MB = 27, or 24 with the 766 MB read today |
| Worktrees | The worktrees that stand, plus the free disk of the worktrees' folder less 10 GB kept free, divided by the largest worktree measured here. No proposal until one worktree has been measured | (25.1 GB − 10 GB) ÷ 0.44 GB = 34 more than stand now |
| Panes side by side | 4 under 16 GB of memory, 6 from 16 GB, 8 from 32 GB. A person sets from 1 to 16 | 8 |

The owner chose this on 2026-11-25 (`frame/questions.md` Q2, option B). The memory alone gives 6 on a Mac with 8 GB and 12 on one with 16 GB, so on such a Mac the smaller of that and its performance cores is the cap. The dialog's sentence names both numbers and says which one is the cap.

The performance cores are what macOS gives under `hw.perflevel0.physicalcpu`. Where `sysctl` gives no whole number above 0 for that key, as on an Intel Mac and off macOS, or does not run, the performance cores are read as all the cores, `os.availableParallelism()`. The pane cap and the worktree cap read no cores. The reading also holds all the cores and the load for #134, and the dialog shows them.

## Scope

In. The items are numbered, and `frame/plan.md` cites them by number.

1. **The reading of the machine.** A new module, `apps/desktop/src/daemon/machine.ts`, reads the memory, the cores, the performance cores, the load, and the free and total disk of the worktrees' folder, each as *Data & interfaces* states. The daemon is given the reader as an option, as it is given `holdAwake`. A daemon given none keeps no cap, queues nothing and sends no `machine`, so every case that stands today runs as it does now.
2. **The proposals.** `apps/desktop/src/shared/machine.ts` holds the formulas of *The caps, in numbers* as functions of the reading and of what was measured, and the sentence that states each proposal with its numbers. The window and the daemon read the same functions.
3. **The person's caps.** A cap a person sets is kept in `limits.json` in the daemon's run folder and outlives the daemon. A cap nobody set follows its proposal, which the window calls the default. The daemon sends the reading, the proposals, the set values, the counts and the queue in `ready` and in a `machine` message after each change, and takes `setCaps` and `readMachine`.
4. **The Machine dialog.** A button at the sidebar's foot, beside Accounts, opens a dialog. It shows the reading in one line, and one row for each cap: a number field, the default's sentence, and "Use the default" where the person's value differs. Under the agent row it lists the queue in order, each entry by its work item's title and what it waits to run. The button is hidden against a daemon that sends no `machine`.
5. **The agents' memory, measured.** While at least one agent lives, the daemon reads every 60 seconds the resident memory of each agent's own process, with one `ps` call for all of them. It keeps each agent's highest value, for the last twenty agents it read at least once, in `agent-memory.json` of the run folder. The proposal uses them as *The caps, in numbers* states. `RoleRun` hands over its process id for this.
6. **The count and the queue.** The agents that run are the live panes of a kind that reports its state and the headless sessions that are working. Where that count is at the cap or over it, a headless session the daemon is asked to begin is listed as `queued` and starts no process. It starts when the count falls under the cap, or the cap rises. A pane a person opens always opens, and counts.
7. **The queue's order.** A session a person asked for goes first, then a stage of a chain that has already run a stage in this run, then a chain's first stage. Within each, the one that waited longest goes first.
8. **What a person sees of the queue.** The second row of the work item's line reads "Waiting for the machine (2 ahead)", and "Waiting for the machine" with none ahead. It comes after a question, a call to allow and a stopped chain's sentence, and before every other text of that row. The line's state is unchanged. The headless session's own line says "Queued" and offers "Stop". A chain whose stage waits says the same sentence at the view's foot. The status line reads "Daemon running, 6 agents of 6, 2 waiting" where a cap is kept.
9. **A queued session is one that runs for whoever would end it, and one that does not work for whoever asks about work.** A stop, an archive, a delete, a removal of its repository and "Quit Owlery Completely…" name it and end it, and an account it would run under cannot be removed. Keep-awake, `daemon.ts#works` and `whyNoChain` do not read it as working. Its time limit, its `startedAt`, its stage's `startedAt` and its ledger entry's time count from its start, not from its place in the queue.
10. **A worktree's size, measured.** The daemon measures a work item's worktree once with `du -sk`: when its setup's pane exits, at once where the repository names no setup, and at the daemon's start for a standing worktree that has no measure, one at a time. The measure is kept with the work item.
11. **The worktree cap and the warning.** `workItemPlan` carries the free disk, the 10 GB kept free, what a worktree of the repository needs (the largest measured of that repository, or nothing where none is measured), the worktrees that stand and the cap. The form shows a warning under the plan where the disk would not hold the worktree, and one where the worktrees are at their cap. Create stays enabled.
12. **The pane cap.** `renderer/view.ts#stageOf` takes the cap as an argument in place of `STAGE_PANES`. "Side by side" lays out up to 16 tiles: two columns for 2 to 4 as today, three for 5 to 9, four for 10 to 16, and the last tile spans what is left of its row.
13. **A reading for the cases.** The daemon reads `OWLERY_MACHINE`, the text of a JSON object, in place of the system's reading where it is set. `apps/desktop/test/built-app.ts` sets it for every start, so no built-app case depends on the machine it runs on.
14. **The changelog fragment**, `changelog.md` of the work item, and the version's move where `frame/questions.md` Q11 finds it owed.
15. **The screenshots.** The screenshot run (`apps/desktop/test/screenshots.test.ts`) gains a view of the Machine dialog and a line of the inbox that waits for the machine, so the pull request carries them as `docs/design.md` asks.

Out, each with its reason.

- **The heavy commands.** Issue #134. This work hands it the reading (*Data & interfaces*). #134 divides its limit from all the cores, and this work's agent cap reads the performance cores, so the two read different fields.
- **The subscription's usage limit**, which the issue says often binds first. Milestone 5, `docs/architecture.md` *Reading usage limits*.
- **Refusing or holding what a person starts by hand**: a pane, and a work item's creation. The issue asks for a warning at a creation, and Q1 and Q5 hold the alternatives.
- **Ending or archiving anything that is over a cap.** `docs/product.md` *What we deliberately don't do*.
- **The order of whole work items, and the daemon starting a chain.** Milestone 3 (`docs/roadmap.md` *Milestones*, row 3).
- **A fifth state of the inbox.** Q8.
- **Measuring a worktree again as it grows, and freeing disk.** The archive that moves files away is milestone 4's. A worktree that grew after its setup is read at its first size, which `gaps.md` is to say.
- **A reading on Windows or Linux.** v0.1 is the macOS app (`docs/architecture.md` *Platforms and their order*). `sysctl`, `ps` and `du` are called as macOS has them, and the performance cores fall back as *The caps, in numbers* states.
- **The policy documents.** This work item's subject is the code, so the settle writes *Rule changes* after the release. The issue's last *Done when* line, that row 3 names the cap, is met there.

## User scenarios & acceptance *(mandatory)*

| Scenario | Given / When / Then | Verifiable how |
|---|---|---|
| 1. The proposal states its numbers | Given a reading of 36 GB, 12 cores of which 6 are performance cores, and 25.1 GB free, and no agent measured. When the person opens the Machine dialog. Then the agent row holds 6 and its sentence reads "The default is 6: the 6 performance cores, fewer than the 27 that half of 36 GB holds at 679 MB an agent (not measured on this Mac yet)." Given the same memory and 32 performance cores, the row holds 27 and the sentence says the memory is the smaller | A case of `apps/desktop/test/machine.test.ts` on `shared/machine.ts`, and a built-app case of `apps/desktop/test/machine-dialog.test.ts` under `OWLERY_MACHINE` |
| 2. The proposal follows the measurement | Given a reading of 8 GB and 8 performance cores, and five agents measured, the highest at 766 MB. Then the agent row proposes 5, from 4,096 MB ÷ 766 MB, and its sentence names 766 MB, "the highest of the last 5 agents measured here". Given four measured, it names 679 MB and proposes 6 | `machine.test.ts`, on the formula and on the store's twenty kept |
| 3. A person changes a cap, and it stays | Given a proposal of 6. When the person types 3 and saves. Then every client is sent 3 as the cap, `limits.json` holds it, and a daemon started on that run folder sends 3. When the person presses "Use the default", the cap is 6 again and follows the proposal | `apps/desktop/test/daemon.test.ts`, with a reader given as an option |
| 4. A session over the cap waits | Given a cap of 1 and one live Claude Code pane. When the person asks a headless session in a work item. Then the session is listed `queued`, no process starts, the work item's line reads "Waiting for the machine", and the status line counts 1 waiting | `daemon.test.ts` with the fake adapter, which counts its starts, and `apps/desktop/test/view.test.ts` on `lineText` and `daemonStatus` |
| 5. The queue moves when a place frees | Given scenario 4. When the pane's process exits, or the person sets the cap to 2. Then the session starts, its `startedAt` is the time of the start, and its time limit counts from there | `daemon.test.ts`, with the clock given as an option |
| 6. The order of the queue | Given a cap that is reached, then a chain's first stage, a stage of a running chain and a person's asked session, queued in that order. When places free one at a time. Then the asked session starts first, the running chain's stage second, the first stage last | `daemon.test.ts` and `apps/desktop/test/chain.test.ts` |
| 7. A stage that waited costs no time | Given a chain whose round waited 10 minutes in the queue. Then the stage's `startedAt`, and its ledger entry's time, count from the session's start | `chain.test.ts` and `apps/desktop/test/ledger.test.ts` |
| 8. A pane always opens | Given a cap of 1 and one live Claude Code pane. When the person opens a second. Then it opens, and the status line reads "2 agents of 1" | `daemon.test.ts`, `view.test.ts` |
| 9. A queued session ends with what ends it | Given a queued session. When the person presses "Stop", or archives or deletes its work item. Then it leaves the queue, is listed `failed` with `stopped: "request"`, and the next in the queue is not started in its place unless the count allows. Keep-awake does not hold for it alone | `daemon.test.ts`, `apps/desktop/test/keep-awake.test.ts` |
| 10. A daemon without a reader | Given a daemon given no reader. Then `ready` carries no `machine`, nothing is queued, and the window hides the Machine button and shows four panes side by side at most | `daemon.test.ts`, `view.test.ts` |
| 11. The disk would not hold a worktree | Given 10.2 GB free, 10 GB kept free, and a worktree of the repository measured at 440 MB. When the person types the repository in the form. Then the form says under the plan that the disk would not hold the worktree, with those numbers, and Create is enabled | `daemon.test.ts` on `workItemPlan`, `view.test.ts` on the form's sentence, and a built-app case of `machine-dialog.test.ts` |
| 12. The worktrees are at their cap | Given a cap of 2 worktrees and 2 standing. Then the form says this is worktree 3 of a cap of 2, and Create is enabled. Given no worktree measured anywhere, the dialog's worktree row says nothing is proposed until one is measured | `view.test.ts`, `machine.test.ts` |
| 13. A worktree is measured once | Given a work item whose setup's pane exits with 0. Then the daemon runs one `du` for its worktree and keeps the size with the work item. A restart runs none for it | `daemon.test.ts` with the reader's `sizeOf` counted, `apps/desktop/test/repositories.test.ts` on the stored field |
| 14. More than four panes side by side | Given a pane cap of 6 and six tabs. When "Side by side" is pressed. Then the stage holds six tiles in three columns. Given a cap of 2, it holds two and the rest stay tabs | `view.test.ts` on `stageOf` with the cap, and a built-app case of `machine-dialog.test.ts` that reads `#stage`'s `data-tiles` and the tiles' rectangles |
| 15. No constant holds the pane cap | After the build, `git grep -n 'STAGE_PANES' -- apps` prints nothing. At `07d5e853` it prints the lines *Grounding* states, which *Removes* row 1 names | The search, run again at the build's head |
| 17. The performance cores fall back | Given a machine where `sysctl -n hw.perflevel0.physicalcpu` prints nothing, exits with an error or cannot be started, and 8 cores. Then the reading's `performanceCores` is 8. Given one where it prints `6`, it is 6 | `machine.test.ts`, on the reader with the `sysctl` call given to it |
| 16. The cases do not read the runner | Given `OWLERY_MACHINE` set by the harness. Then a built-app case reads the same proposal on the owner's Mac and on the hosted runner | `machine-dialog.test.ts`, in the `check` job |

## Data & interfaces

Names are the builder's where the tree's own naming asks for another. The meaning of each field is binding.

`apps/desktop/src/shared/protocol.ts`:

```ts
/** What the daemon reads of the machine it runs on. */
export interface MachineReading {
  memoryBytes: number;        // os.totalmem(), read once at the daemon's start
  cores: number;              // os.availableParallelism(), read once
  performanceCores: number;   // `/usr/sbin/sysctl -n hw.perflevel0.physicalcpu` on macOS, read once; `cores` where it gives no whole number above 0, does not run, and off macOS
  load: number;               // os.loadavg()[0], read at each ask
  disk: { freeBytes: number; totalBytes: number } | null; // fs.statfs of the worktrees' folder, or of the nearest folder above it that stands; null where none answers
}

export interface Machine {
  reading: MachineReading;
  /** `queue` holds the queued headless sessions by id, in the order they will start. */
  /** `byCores` and `byMemory` are the two numbers the proposal is the smaller of. */
  agents: { proposed: number; byCores: number; byMemory: number; set: number | null; running: number; perAgentBytes: number; measured: number; queue: number[] };
  worktrees: { proposed: number | null; set: number | null; standing: number; perWorktreeBytes: number | null; keepFreeBytes: number };
  panes: { proposed: number; set: number | null };
}
```

- `ready` gains `machine?: Machine`, and a new server message is `{ type: "machine"; machine: Machine }`. A client reads a missing `machine` as a daemon that keeps no cap. The client message `readMachine` has the daemon read the load and the free disk anew and send `machine`, which the dialog asks as it opens.
- A new client message is `{ type: "setCaps"; requestId: number; agents?: number | null; worktrees?: number | null; panes?: number | null }`. A field that is absent is left as it is, and `null` follows the proposal. The daemon refuses a value that is no whole number, one under 1, and a pane cap over 16, with a sentence. It answers `done`, before the `machine` that carries the change.
- `HeadlessState` gains `"queued"`. `HeadlessInfo` gains `queuedAt?: number | null`, the time it joined the queue, or null for one that never waited.
- `workItemPlan` gains `disk?: { freeBytes: number; keepFreeBytes: number; needsBytes: number | null; standing: number; cap: number | null }`.
- `adapters/adapter.ts#RoleRun` gains `pid: number | undefined`, the agent's own process, and the fake adapter gives none.
- The stored work item (`daemon/repositories.ts`) gains the worktree's measured size in kilobytes and the time of the measure.
- `limits.json` in the run folder holds the caps a person set under the keys `agents`, `worktrees` and `panes`, as in `{ "agents": 3 }`. An absent key follows the default, and a value the daemon would refuse from `setCaps` is read as absent. `agent-memory.json` beside it holds the kept measures in kilobytes. Both are written whole through `daemon/whole-file.ts`, readable by the user alone.
- `OWLERY_MACHINE` holds the text of a JSON object with `memoryBytes`, `cores`, `performanceCores`, `freeBytes` and `totalBytes`. A value that is no such object stops the daemon's start with a sentence, as an unset `OWLERY_RUN_DIR` does.

**The seam with #134.** The design of `1795559735-heavy-commands-wait-their-turn` was read in its worktree on 2026-11-25, uncommitted and without a plan, so what follows is that text as it stood and this frame's default, not an agreement.

Both designs name the same things, and this one takes the other's names where they differed: the module `daemon/machine.ts` with `readMachine()`, the reading's fields `cores`, `memoryBytes` and `load`, the store `limits.json` with one key for each limit, `ready.machine`, the message `machine`, the client message `readMachine`, the dialog "Machine" at the sidebar's foot with "Use the default", the case file `apps/desktop/test/machine.test.ts`, the built-app file `apps/desktop/test/machine-dialog.test.ts`, and the line's words "Waiting for the machine (2 ahead)". #134's design reads total memory and all the cores, as this one does.

One reading serves both: `cores`, `memoryBytes`, `load` and `disk`, which both designs read, and `performanceCores`, which this work alone reads, for the agent cap. #134's design divides its limit from `cores` and needs nothing of the new field. **This work item owns it**: the reader, the store, the message and the dialog are whole lines of this issue's *Done when*. #134 adds `heavyCommands` to the store, its limit, its queue and its runs to `Machine`, its rows to the dialog, and the field `WorkItem.machineWait`. The window words a line that waits from either source in the same form. #134's design says that issue #32 "adds the free disk of a folder to the same reading" and "adds its keys", which reads as #134 building these first. Because the names agree, the other order costs this work item only that its phase 1 adds to what stands. `frame/plan.md` *Overlap with the release* states the order this frame proposes, and the orchestrator settles it between the two frames.

## Rule changes

- change
  file: docs/architecture.md
  section: Memory design
  from: Issue #32 builds them, in milestone 3 ([Milestones](roadmap.md#milestones)). Until then nothing caps the agents and the worktrees, and the panes on a view stay at four (below).
  to: Release 0.0.4 built them (issue #32), before milestone 3's role sessions start under them ([Milestones](roadmap.md#milestones)). The rules at the end of this section state each.
- change
  file: docs/architecture.ko.md
  section: 메모리 설계
  from: 이 상한은 이슈 #32가 마일스톤 3에서 만듭니다([마일스톤](roadmap.ko.md#마일스톤)). 그때까지 에이전트와 worktree에는 상한이 없고, 화면의 칸은 넷까지입니다(아래).
  to: 이 상한은 릴리스 0.0.4가 만들었습니다(이슈 #32). 마일스톤 3의 역할 세션은 이 상한 아래에서 시작합니다([마일스톤](roadmap.ko.md#마일스톤)). 상한마다의 규칙은 이 절의 끝에 있습니다.
- change
  file: docs/architecture.md
  section: Memory design
  from: A work item's view shows at most four panes at once today. Four is the count the reference scene was measured at, and it is fixed in the code (`STAGE_PANES` in `apps/desktop/src/renderer/view.ts`) until issue #32 makes it one of the defaults read from the machine, higher on a machine with more memory.
  to: A work item's view shows side by side at most as many panes as the cap on panes names. The daemon proposes 4 on a machine with less than 16 GB of memory, 6 from 16 GB and 8 from 32 GB, and a person sets from 1 to 16. Four is the count the reference scene was measured at.
- change
  file: docs/architecture.ko.md
  section: 메모리 설계
  from: 작업 하나의 화면은 지금 칸을 한 번에 넷까지만 보입니다. 넷은 기준 장면을 잰 칸 수이고, 이슈 #32가 컴퓨터에서 읽어 정하는 기본값으로 바꿀 때까지 코드에 고정되어 있습니다(`apps/desktop/src/renderer/view.ts`의 `STAGE_PANES`). 메모리가 더 많은 컴퓨터에서는 그 기본값이 넷보다 커집니다.
  to: 작업 하나의 화면은 칸 상한이 정한 수까지만 칸을 나란히 보입니다. 데몬은 메모리가 16 GB보다 적은 컴퓨터에서 4를, 16 GB부터 6을, 32 GB부터 8을 제안하고, 사람은 1부터 16까지 정합니다. 넷은 기준 장면을 잰 칸 수입니다.
- add
  file: docs/architecture.md
  section: Memory design
  to: **The daemon reads the machine at its start and proposes each cap with the numbers it used.** It reads the memory, the cores, the performance cores and the free disk of the worktrees' folder. The cap on agents is the smaller of the performance cores and half of the memory divided by what one agent's own process uses: 679 MB until the daemon has measured five agents on this machine, and then the highest value among the last twenty it measured. The performance cores are what macOS gives under `hw.perflevel0.physicalcpu`, and all the cores where it gives none. It measures while an agent lives, once a minute. The cap on worktrees is the worktrees that stand plus the free disk less 10 GB, divided by the largest worktree measured there, and nothing is proposed until one is measured. A cap a person sets is the daemon's state, kept in its run folder and sent to every client, and it stays until the person returns it to the proposal.
    check: apps/desktop/test/machine.test.ts apps/desktop/test/daemon.test.ts
- add
  file: docs/architecture.ko.md
  section: 메모리 설계
  to: **데몬은 시작할 때 컴퓨터를 읽고, 상한마다 제안값을 그 값에 쓴 수치와 함께 냅니다.** 읽는 것은 메모리, 코어, 성능 코어, 그리고 worktree 폴더의 남은 디스크입니다. 에이전트 상한은 성능 코어 수와, 메모리의 절반을 에이전트 하나의 프로세스가 쓰는 양으로 나눈 값 가운데 작은 쪽입니다. 성능 코어 수는 macOS가 `hw.perflevel0.physicalcpu`로 주는 값이고, macOS가 그 값을 주지 않으면 전체 코어 수입니다. 그 양은 데몬이 이 컴퓨터에서 에이전트 다섯을 잴 때까지 679 MB이고, 그 뒤로는 마지막으로 잰 스물 가운데 가장 큰 값입니다. 데몬은 에이전트가 살아 있는 동안 1분에 한 번 잽니다. worktree 상한은 지금 있는 worktree 수에, 남은 디스크에서 10 GB를 뺀 값을 이 컴퓨터에서 잰 가장 큰 worktree로 나눈 수를 더한 값이고, 하나를 잴 때까지는 제안하지 않습니다. 사람이 정한 상한은 데몬의 상태입니다. 데몬의 실행 폴더에 두고 모든 클라이언트에 보내며, 사람이 제안값으로 되돌릴 때까지 그대로입니다.
    check: apps/desktop/test/machine.test.ts apps/desktop/test/daemon.test.ts
- add
  file: docs/architecture.md
  section: Memory design
  to: **A headless session over the cap on agents waits in a queue, and what a person opens by hand never waits.** The agents that run are the live panes of a kind that reports its state and the headless sessions that are working. A headless session asked for while that count is at the cap is listed as queued and starts no process until the count falls or the cap rises. A session a person asked for starts first, then a stage of a chain that is already running, then a chain's first stage. A pane always opens and counts, and nothing over a cap is ended. The work item's line says that it waits for the machine and its place in the queue, and a stage's time counts from its start.
    check: apps/desktop/test/daemon.test.ts apps/desktop/test/chain.test.ts apps/desktop/test/view.test.ts
- add
  file: docs/architecture.ko.md
  section: 메모리 설계
  to: **에이전트 상한을 넘는 headless 세션은 대기열에서 기다리고, 사람이 손으로 여는 것은 기다리지 않습니다.** 도는 에이전트는 상태를 알려 주는 종류의 살아 있는 칸과 일하고 있는 headless 세션입니다. 그 수가 상한에 닿아 있을 때 요청된 headless 세션은 대기 중으로 목록에 오르고, 수가 줄거나 상한이 오를 때까지 프로세스를 시작하지 않습니다. 사람이 요청한 세션이 먼저 시작하고, 그다음이 이미 도는 체인의 단계, 그다음이 체인의 첫 단계입니다. 칸은 언제나 열리고 수에 들어가며, 상한을 넘었다고 끝내는 것은 없습니다. 작업의 줄은 컴퓨터를 기다린다는 것과 대기열에서의 순서를 말하고, 단계의 시간은 시작한 때부터 셉니다.
    check: apps/desktop/test/daemon.test.ts apps/desktop/test/chain.test.ts apps/desktop/test/view.test.ts
- add
  file: docs/architecture.md
  section: Memory design
  to: **Creating a work item warns where the disk would not hold its worktree or the worktrees are at their cap, and creates it on the person's word.** The daemon measures each worktree once, after its setup, and a new worktree of a repository is taken to need what the largest measured worktree of that repository takes. The form states the free disk, the 10 GB kept free and that need. It refuses nothing, since the person may know what they are about to remove.
    check: apps/desktop/test/daemon.test.ts apps/desktop/test/view.test.ts
- add
  file: docs/architecture.ko.md
  section: 메모리 설계
  to: **작업을 만들 때 디스크가 그 worktree를 담지 못하거나 worktree 수가 상한에 닿아 있으면 경고하고, 사람이 만들라고 하면 만듭니다.** 데몬은 worktree마다 설정이 끝난 뒤 한 번 크기를 재고, 한 저장소의 새 worktree는 그 저장소에서 잰 가장 큰 worktree만큼 든다고 봅니다. 만드는 창은 남은 디스크, 남겨 두는 10 GB, 그리고 그 크기를 말합니다. 사람이 무엇을 지울지 알고 있을 수 있으므로 아무것도 거절하지 않습니다.
    check: apps/desktop/test/daemon.test.ts apps/desktop/test/view.test.ts
- change
  file: docs/roadmap.md
  section: Milestones
  from: The inbox states: waiting for answers, in progress, sealed, broken
  to: The daemon starts each role session under the cap on agents that release 0.0.4 built, and a work item over the cap waits in the inbox's queue ([Memory design](architecture.md#memory-design)). The inbox states: waiting for answers, in progress, sealed, broken
- change
  file: docs/roadmap.ko.md
  section: 마일스톤
  from: 작업함의 상태는 질문 대기, 진행 중, 인장 찍힘, 인장 깨짐입니다
  to: 데몬은 역할 세션마다 릴리스 0.0.4가 만든 에이전트 상한 아래에서 시작하고, 상한을 넘는 작업은 작업함의 대기열에서 기다립니다([메모리 설계](architecture.ko.md#메모리-설계)). 작업함의 상태는 질문 대기, 진행 중, 인장 찍힘, 인장 깨짐입니다

## Removes

| Removes | Coordinate | Where it lands, or why it can go |
|---|---|---|
| 1. The constant that fixes the panes at four, with its comment and every line that names it | `apps/desktop/src/renderer/view.ts#STAGE_PANES`, and `view.ts#stageOf` and `view.ts#recentKept` where they name it | `stageOf` takes the cap as an argument (*Scope* item 12). Against a daemon that sends no `machine` the window passes 4, from `shared/machine.ts` |
| 2. The cases that pin four as the most panes on the stage | `apps/desktop/test/view.test.ts`, the three cases of `stageOf` whose names say "up to four" and "the first four panes" | The same cases, with the cap given, and scenario 14's |
| 3. The sentences that say nothing caps the agents and the worktrees, and that the panes are fixed in the code until issue #32 | `docs/architecture.md` *Memory design* and `docs/architecture.ko.md` *메모리 설계* | The first two pairs of *Rule changes*, which the settle writes |

This work adds no gate, check, hook, CI step or mark of the process. It adds rules of the product to *Memory design* and takes out the sentences of row 3, which said the rules were not built yet.

Framed 2026-11-25 by framer, before the build.
