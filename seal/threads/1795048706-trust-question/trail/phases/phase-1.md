# Phase 1: 1795048706-trust-question

## What this phase found

**The frame holds, except for the two checksums of scenario 1.** `apps/desktop/src/daemon/daemon.ts`, `apps/desktop/src/shared/protocol.ts` and `apps/desktop/test/daemon.test.ts` were opened at `1c0061d`, and each coordinate of `frame/design.md` *Data & interfaces* is where the frame says. Scenario 1 asks for `shasum -a 256` of `~/.claude/settings.json` and `~/.claude/settings.local.json` before and after the drive. The spawn of this phase carried the owner's rule that nothing under `~/.claude` is read, so the checksums were not taken. It is the first departure below.

**What was built.** The change is `d1f11d5`. `52658e7` and `b05f3df` after it change `test/daemon.test.ts` alone. A pane of a kind that reports state gets one timer in `startSession`, held on its `Session` as `silentStart`. When it fires, `Daemon#silentStartOver` sets the state to `waiting` and `stateSince` to the daemon's clock, and sends the inbox. `DaemonOptions.silentStartMs` shortens the time, and `SILENT_START_MS` is the 10 seconds it has where the options name none. The four comments of `protocol.ts` that *Scope* item 5 lists say the new fact, and so does the docstring of `agentEvent`.

**Decisions made while building, each with its grounds.**

- *The pane's three conditions are held by the cancels, and the timer's own function checks none.* *Scope* item 1 lists a pane as waiting where it is alive, on the lists and silent. *Scope* item 3 cancels the timer at the first event, at the process's exit, at a client's `close` and in `Daemon#close`. With those four in place the timer fires only for a pane that meets all three conditions, so a second check inside `silentStartOver` would be a guard no case can see red: each case would stay green on the other guard (contract rule 15). Judged against `frame/design.md` *Scope* items 1 and 3.
- *The cancel in `agentEvent` is the function's first act*, before the return for a hook name the daemon does not map, as *Scope* item 3 asks. It runs for a pane of any kind, and for a shell pane it cancels nothing.
- *Two cases use a shell that ignores the signal a close sends.* `TerminalSession#kill` ends the pane's process, and the exit then cancels the timer too. A case of a client's `close`, or of `Daemon#close`, written over a process that ends at once therefore stays green with the close's own cancel removed. The first form of the case of a client's `close` did exactly that under `seal mutate`. Both cases now run `trap '' HUP; sleep 1`, so the process outlives the close by a second and the close's cancel is the one guard left.
- *The case of `Daemon#close` counts the clock's reads.* A closed daemon has no client to tell, so the case gives the daemon a `now` that counts its calls and expects none after the close. `silentStartOver` reads the clock once for the state's time.
- *One case more than the frame names.* *Scope* item 4 says an event that maps to `waiting` and arrives while the pane waits by silence changes neither the time, the text nor the tool. Scenarios 2 to 6 hold no row for it. The case "keeps the time of the silence, and neither a text nor a tool, where an event that maps to waiting arrives while the pane waits by silence" pins it.

**Seen red.** Three cases failed against the daemon of `1c0061d`, each by timing out while it waited for an inbox that lists the pane `waiting`: "lists a pane that sent no event in the time after its start as waiting, …", "takes the waiting of a silent pane away at its session's start, …" and "keeps the time of the silence, …". The other six cases assert that a pane is not called waiting, or that nothing is sent, and were green against the old daemon, which called no pane waiting. Each was shown red with its one guard removed, in the `seal mutate` run below, and its failing line was read.

**`seal mutate`.** Nine mutants of `src/daemon/daemon.ts` in one call at `52658e7`, against the nine silent start cases of `test/daemon.test.ts`: 9 red, 0 survived. The same call at `d1f11d5` gave 8 red and one survivor, the third row, which is what changed its case.

| Mutant | The case that failed, and its failing line |
|---|---|
| The cancel in `agentEvent` moves after the return for a hook name that is not mapped | "never calls a pane waiting by silence once an event arrived under its id: SubagentStop, …", at the list of a later client, which held the pane `waiting` |
| `agentEvent` cancels nothing | the same case for `SessionStart` and for `SubagentStop`, at the same line |
| A client's `close` cancels nothing | "sends nothing for the silence of a pane a client closed before the time passed" at `expected [ [ null ], [], [] ] to deeply equal [ [ null ], [] ]` |
| The process's exit cancels nothing | "never calls a pane waiting whose process exited before the time passed", at the list of a later client |
| `Daemon#close` cancels nothing | "calls no pane waiting after the daemon closed, …" at `expected 1 to be +0` |
| A pane of any kind gets the timer | "keeps a silent pane of a kind that reports no state at none, …", at the list of a later client |
| `silentStartOver` does not set the state | the three cases of *Seen red*, each timed out |
| `silentStartOver` reads `Date.now` and not the daemon's clock | "lists a pane that sent no event …" and "keeps the time of the silence, …", each at the list it compares |
| `silentStartOver` sends no inbox | the three cases of *Seen red*, each timed out |

**What no mutant covered.** The default of 10 seconds, `SILENT_START_MS`, has no case: vitest ends a case at 5 seconds (`frame/design.md` *Grounding*). The drive below is its one run.

**Scenario 1, the drive.** Run once, at the build of the tree `52658e7` holds; `b05f3df` after it changes a comment of the test file alone. `pnpm run build` wrote `dist/daemon.js`. The probe `test_tmp_silent_start_probe.mjs` started it with Electron's binary, `ELECTRON_RUN_AS_NODE=1`, `OWLERY_RUN_DIR`, `OWLERY_WORKTREES` and `OWLERY_DEBUG_HOOKS=1`, each folder under the phase's scratch. It connected as a client and sent `createWorkItem` with a Claude Code pane for a repository of one commit it had just made under the scratch. It sent the pane no input. No app and no window was started. The probe, its log `probe-log.txt` and the pane's output `probe-pane-output.txt` are under the session's scratchpad, in `1795048706-trust-question/phase-1/`.

| Time after `workItemCreated` | What the client received |
|---|---|
| 0.00 s | An inbox that lists the pane with `state`, `stateSince`, `stateText` and `stateTool` null |
| 1.02 s to 1.05 s | The pane's output: "Quick safety check: Is this a project you created or one you trust?", with "No, exit" selected and "Yes, I trust this folder" under it |
| 10.00 s | An inbox that lists the pane with `state: "waiting"`, `stateSince` 10 001 ms after the client's own clock at `workItemCreated`, and `stateText` and `stateTool` null |
| 12.03 s | The probe sent `close`; an inbox that lists no pane |

No `agent` message arrived, and `daemon.log` holds the daemon's first line and no line of a hook, with `OWLERY_DEBUG_HOOKS=1` set. The probe exits 1 where the waiting inbox comes sooner than 10 000 ms after `workItemCreated` or not at all, and it exited 0. The daemon exited with code 0 at the probe's SIGTERM, sent to the process id the probe recorded, and removed its discovery file and its hook socket. No process whose command names the phase's scratch was left (`ps`, `executed`). Claude Code 2.1.327 is the version the frame's probes ran; this drive did not read the version.

**Departures from the frame.**

- *The two checksums of scenario 1 were not taken.* The spawn carried the owner's rule: never read or write `~/.claude.json` or anything under `~/.claude`. `shasum` opens the files, so it was declined. `stat` of the two files, which opens neither, was taken before and after the drive: size, modification time and inode of each were the same (`diff`, exit 0). That is weaker than a checksum: a write that keeps the size and restores the time would pass it. `gaps.md` *Not verified* holds the item.
- *Scenario 8 was not run.* It needs the app's window, and no agent starts the app. What the window says of such a session was not read again by this phase either; `frame/design.md` *Grounding* holds the framer's reading at `3e715e4`, and this phase changes no file under `apps/desktop/src/renderer/`.

**The typecheck.** Before each of the three commits, `tsc --noEmit` ran over the three changed files with the compiler options of `apps/desktop/tsconfig.json` typed on the command line, exit 0. The package's own `tsc --noEmit`, which reads every file, is the broad run's.

**The phase boundary.** One command at the tree of `b05f3df`: `pnpm run test` over `test/daemon.test.ts` and the seven test files that import `src/daemon/daemon.ts` or `src/shared/protocol.ts`, directly or through a module that does (`last-look`, `view`, `agent-state`, `agent-events`, `pane-kinds`, `work-items`, `worktrees`). 8 files, 290 cases, exit 0. The repository has no contribution guide, and no test file globs `src/daemon` or `src/shared`.
