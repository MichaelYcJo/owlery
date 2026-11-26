# Closing memo: 1795636142-223-a-stage-a-pane-runs-shows-at-work

## Not verified

| Item | Who must answer |
|---|---|
| The one-second bound of `turn-socket.ts#tellStage` (`STAGE_LINE_WAIT_MS`). `seal mutate` of `limit = setTimeout(settle, waitMs)` to `limit = undefined` SURVIVED. No case makes a stage line's connect or write hang, so no case shows that the chain command still ends within a second (`trail/phases/phase-1.md`). | the proofer, by reading |
| The drop of a pane's stage at the exit that the replacement for an account change waits on (`daemon.ts`, the pane's `terminal.onExit`, the branch where `session.replacing` holds). The drop runs before that branch, and the change's own `broadcastInbox` sends the lists. No case changes the account of a pane that holds a stage. | the proofer, by reading |
| closed the handler `main.ts` passes to `TurnServer.listen`, `(line) => daemon.stageTold(line)`. No unit case starts `main.ts`. The cases call `Daemon#stageTold` and start a `TurnServer` with a handler of their own. | the built-app case at `test/approval-line.test.ts:316` read `paneStage` round 1 in the built daemon's lists after the built chain command's `owed` in a pane, passed at `08713da8` (`trail/phases/phase-2.md`) |
| The built-app files that import `renderer/view.ts` and that phase 2 did not run: `test/theme-controls.test.ts`, `test/terminal-basics.test.ts` and `test/work-item-menu.test.ts`. Each imports constants phase 2 left unchanged, and the built-app batch ran `test/approval-line.test.ts` alone (`trail/phases/phase-2.md`). | the orchestrator, at the broad gate |

## Not done

- **Phase 1 left the docstring of `view.ts#approvalPlaces` to phase 2.** `frame/plan.md` gave phase 1 *Scope* item 9, which names that docstring. The window read no `paneStage` until phase 2, so the docstring's clause that no pane's state changes the line held at phase 1's head (`trail/phases/phase-1.md`). Phase 2 rewrote it with *Scope* item 6 (`trail/phases/phase-2.md`).
