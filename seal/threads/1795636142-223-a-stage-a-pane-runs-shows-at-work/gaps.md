# Closing memo: 1795636142-223-a-stage-a-pane-runs-shows-at-work

## Not verified

| Item | Who must answer |
|---|---|
| The one-second bound of `turn-socket.ts#tellStage` (`STAGE_LINE_WAIT_MS`). `seal mutate` of `limit = setTimeout(settle, waitMs)` to `limit = undefined` SURVIVED. No case makes a stage line's connect or write hang, so no case shows that the chain command still ends within a second (`trail/phases/phase-1.md`). | the proofer, by reading |
| The drop of a pane's stage at the exit that the replacement for an account change waits on (`daemon.ts`, the pane's `terminal.onExit`, the branch where `session.replacing` holds). The drop runs before that branch, and the change's own `broadcastInbox` sends the lists. No case changes the account of a pane that holds a stage. | the proofer, by reading |
| The handler `main.ts` passes to `TurnServer.listen`, `(line) => daemon.stageTold(line)`. No unit case starts `main.ts`. The cases call `Daemon#stageTold` and start a `TurnServer` with a handler of their own. | phase 2's built-app case in `test/approval-line.test.ts`, which runs the built daemon and the built chain command |

## Not done

- **The docstring of `view.ts#approvalPlaces` was left as it stands.** `frame/plan.md` gives phase 1 *Scope* item 9, which names that docstring. The window reads no `paneStage` until phase 2, so the docstring's clause that no pane's state changes the line still holds at this phase's head. Phase 2's *Scope* item 6 rewrites it (`trail/phases/phase-1.md`).
