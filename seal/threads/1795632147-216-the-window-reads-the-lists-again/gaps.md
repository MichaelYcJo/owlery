# Closing memo: the window reads the lists again

## Not verified

| Item | Who must answer |
|---|---|
| The full suite, the typecheck of every package and the rest of the broad gate. Phase 1 ran only the cases of `apps/desktop/test/daemon.test.ts` that `trail/phases/phase-1.md` names, the built-app files `test/notification-click.test.ts` and `test/daemon-restart.test.ts`, and `tsc --noEmit` in `apps/desktop`. Every other test file that loads `src/daemon/daemon.ts` or `src/shared/protocol.ts` went unrun, and so did each file that calls the stand-in for `gh` in `test/chain-run.ts`, `test/chain.test.ts` among them, though phase 1 changed that stand-in | the orchestrator's broad gate |
| That a client which closes while its `readLists` is answered is sent nothing. `answerReadLists` checks that the socket is still a client before each send, and no case can read what a closed socket did not receive (`trail/phases/phase-1.md`) | the proofer's reading of `daemon.ts#answerReadLists` |

## Not done

nothing
