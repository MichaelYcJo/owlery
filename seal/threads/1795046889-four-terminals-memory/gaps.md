# Closing memo: four visible terminals keep the app under about 500 MB

## Not verified

| Item | Who must answer |
|---|---|
| A person's run of the measurement, `pnpm run measure:memory` from `apps/desktop` without `OWLERY_BACKGROUND`, with the window left in front (`frame/questions.md` Q5). No run has made what only that start does: `BuiltApp.start` with `keepBackground` from `apps/desktop/test/memory.ts#measure`, the form filled with no focus emulated, and the rule that throws a run away for a sample without the focus read on a real sample. An agent's start sets the variable, so no agent makes this run | the owner, at the machine, with nothing typed while it runs |
| The numbers before this work stand on one launch of each scenario, where `frame/design.md` *Scope* item 7 publishes three: `inbox`, `one` and `eight-in-turn` at `aeaa1e0` (`trail/phases/phase-1.md`) | phase 3's run of `eight-in-turn` and phase 4's three runs of each scenario, which read whether one launch stood for the others |
| The measurement's driving of the window has no case and no mutant, since each is a launch of the app: `measure`, `STEPS`, `openWorkItem`, `addPane`, `untilInFront`, `untilPrinters`, `PAGE_READ` and `footprintsOf` in `apps/desktop/test/memory.ts`. Six launches ran them at `aeaa1e0`'s tree and kept every run | the proofer's reading of them, and every later run of the measurement: phase 3's, phase 4's and the sealer's |
| No launch was thrown away and none left a process behind, so the measurement's case was never seen failing on either, and no launch failed before its first sample, where `measure` reads the panes' processes again before it stops the app | whoever first has a run thrown away or a process left. `thrownAway` and the row `tables` prints for such a run have cases, each seen red |
| The measurement stopped by a signal. The handlers `measure` sets for SIGINT, SIGTERM, SIGHUP and the process's `exit` were not run | nobody runs them. A person who stops a run and finds `owlery-app-*` or `owlery-work-items-*` under the temporary folder, or a daemon or a `printer.sh` left running |
| The desktop suite, the typecheck of the whole app and the repository's broad gate. Phase 1 ran `test/memory.test.ts` and `test/korean-input.test.ts` in one command, and `tsc` over `test/memory.ts` and `test/memory.test.ts`. The fix pass of round 1 ran `test/memory.test.ts` and the same `tsc`. Phase 2 ran the nine files `trail/phases/phase-2.md` names in one command, and `tsc` over the six files it changed | the orchestrator, at the broad run |
| The window with the exit line gone was read in one start, with the DOM renderer, for a pane whose process exited while its terminal was in front (`trail/phases/phase-2.md`, the drive). No run read a terminal drawn with WebGL, whose text is not in the page, or a pane that exited while another tab was in front | phase 3's drive of scenario 7, which shows a pane that exited while hidden |
| No client of the tree sends `detach` at `30c8327`: its cases send it over a socket, and the window does not. A `detach` for a session the client does not receive, or that the daemon does not list, has no case (`trail/phases/phase-2.md`) | phase 3, whose pool sends `detach` and whose drive reads the window's frames (`frame/design.md` scenario 1); the proofer's reading of `Daemon#handle` for the two sessions with no case |
| A daemon an earlier build left running, under this window, appends no exit line, and this daemon under a window of an earlier build shows it twice (`frame/plan.md` *Operational impact*). Neither pair was run | the owner, the first time the app is replaced while its daemon runs. `read`: `src/renderer/renderer.ts#onMessage` writes nothing at `exit`, and the build before `30c8327` wrote the line there |

## Not done

Three launches of each scenario were not made in phase 1. The spawn asked for as few starts of the app as the phase needs on a machine its owner works at, and the phase's comparison, eight terminals against one, does not need them.

`korean-pane.ts#openReceiverPane` and `memory.ts#openWorkItem` both fill the "New work item" form, and no shared function was made of them. It would change the Korean case's file, which this phase's plan row does not name, and the two differ in what they wait for: the receiver's file, or the tab and its terminal.

The measurement prints the date and the versions of macOS, Electron and xterm.js. It does not print the commit, the machine and its displays, the window's size or a tile's size. `frame/design.md` *Scope* item 7 asks them of `apps/desktop/measurements/memory.md`, which phase 4 writes.

A launch that is thrown away is not made again by the tool. The run fails, and whoever ran it runs it again.

The cut at a line's start reads at most the first 4,096 characters kept for a line break, on each append that drops output (`apps/desktop/src/daemon/buffer.ts#dropLineRest`, the bound of `frame/design.md` *Scope* item 5). Phase 2 measured 29 microseconds an append for pieces of 64 characters where the search read all 256K characters kept. The bounded search was not timed: it reads at most 4,096 characters whatever is kept.

A launch fails where `footprint` gave no number for any process of the app (`apps/desktop/test/memory.ts#unread`, round 1's finding 1), and no process of the app is let off. A helper that Chromium starts and ends between the read of `ps` and the read of `footprint` would fail a launch that way. No launch has been made since the rule, so nobody has seen whether one does. The by-kind rows of phase 1's three kept launches hold the same five kinds (`trail/phases/phase-1.md`).
