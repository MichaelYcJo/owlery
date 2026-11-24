# Closing memo: 1795400730-seal-back

## Not verified

| Item | Who must answer |
|---|---|
| The test files that start the built app, whose daemon runs the `daemon.ts` phase 1 changed: `test/approval-line.test.ts`, `test/ask-section.test.ts`, `test/daemon-restart.test.ts`, `test/decisions-and-questions.test.ts`, `test/get-a-seal.test.ts`, `test/keep-awake.test.ts`, `test/korean-input.test.ts`, `test/notification-click.test.ts`, `test/records-dialog.test.ts`, `test/role-bundle.test.ts`, `test/screenshots.test.ts`, `test/terminal-basics.test.ts`, `test/theme-controls.test.ts`, `test/work-item-form.test.ts`, `test/work-item-menu.test.ts` and the measurement of `test/memory.ts` (executed: `git grep -l "BuiltApp.start" -- test`). None was run in phase 1. Each would start the built app, and the owner's rules ask for as few starts as possible. The one thing phase 1 changes in a running daemon is the field `chain` of each ledger entry it writes, and no file of `src/renderer` reads the ledger (`frame/design.md` *Grounding*, the first row of its third table) | the orchestrator's broad gate |
| The other test files that import `src/shared/protocol.ts`, whose `LedgerEntry` gained a field. The change is to a type alone, so it moves no value at run time, and `pnpm run typecheck` passed over `src` and `test` after it (executed, at `5c1c88e` and `abb63f4`). Their cases were not run in phase 1 | the orchestrator's broad gate |
| Phase 2: the test files that start the built app, whose daemon runs the `daemon.ts` phase 2 changed, the same files as the first row (executed: `git grep -l "BuiltApp" -- test`). None was run in phase 2, for the same reason. Phase 2 adds one case to the daemon's messages, `readSealRecords`, which no file of `src/renderer` sends yet, and changes what `round-record.ts` gives the chain by two fields and one field of a close, which none of those files imports (executed: `git grep -l -E "readRoundRecord|round-record|sealRecords"` over them names `test/role-bundle.test.ts` alone, for a path of the plugin's docs) | the orchestrator's broad gate |
| Phase 2: the wording of the back's sentences, which `src/shared/seal-back.ts` composes and no window draws yet. `frame/questions.md` Q5 leaves it to phase 3, and `trail/phases/phase-2.md` lists each wording the frame did not fix | phase 3's crafter, which draws the back |

## Not done

Phase 1: nothing.

Phase 2: nothing.
