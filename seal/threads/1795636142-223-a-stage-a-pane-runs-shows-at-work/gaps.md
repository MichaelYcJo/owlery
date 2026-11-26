# Closing memo: 1795636142-223-a-stage-a-pane-runs-shows-at-work

## Not verified

| Item | Who must answer |
|---|---|
| closed the one-second bound of `turn-socket.ts#tellStage` (`STAGE_LINE_WAIT_MS`). `seal mutate` of `limit = setTimeout(settle, waitMs)` to `limit = undefined` SURVIVED in phase 1, since no case made a stage line's write hang (`trail/phases/phase-1.md`). | the case "settles a stage line's tell at its wait where the daemon accepts the connection and never reads" in `test/heavy-run.test.ts` writes an 8 MB line to a server that never reads; the same mutant is red there at `b4ec592f` (`trail/rounds/round-1.md`, finding 3) |
| closed the drop of a pane's stage at the exit that the replacement for an account change waits on (`daemon.ts`, the pane's `terminal.onExit`, the branch where `session.replacing` holds). | the case "drops the stage a changed pane's session told at the exit of the process the change ends" in `test/daemon.test.ts` reads `paneStage` null in the lists the change sends; it is red at `b4ec592f` with the drop kept from that exit (`trail/rounds/round-1.md`, finding 2) |
| closed the handler `main.ts` passes to `TurnServer.listen`, `(line) => daemon.stageTold(line)`. No unit case starts `main.ts`. The cases call `Daemon#stageTold` and start a `TurnServer` with a handler of their own. | the built-app case at `test/approval-line.test.ts:316` read `paneStage` round 1 in the built daemon's lists after the built chain command's `owed` in a pane, passed at `08713da8` (`trail/phases/phase-2.md`) |
| closed The built-app files that import `renderer/view.ts` and that phase 2 did not run: `test/theme-controls.test.ts`, `test/terminal-basics.test.ts` and `test/work-item-menu.test.ts`. Each imports constants phase 2 left unchanged, and the built-app batch ran `test/approval-line.test.ts` alone (`trail/phases/phase-2.md`). | answered: the broad gate passed at `f521a4c1`, the last run of this work item's `trail/gate.md`, after which only the work item's records changed (`git diff --name-only f521a4c1 ee657060` outside its directory prints nothing); the `check` workflow passed on pull request #299 at `ee657060`, the head it merged from |

## Not done

- **Phase 1 left the docstring of `view.ts#approvalPlaces` to phase 2.** `frame/plan.md` gave phase 1 *Scope* item 9, which names that docstring. The window read no `paneStage` until phase 2, so the docstring's clause that no pane's state changes the line held at phase 1's head (`trail/phases/phase-1.md`). Phase 2 rewrote it with *Scope* item 6 (`trail/phases/phase-2.md`).
