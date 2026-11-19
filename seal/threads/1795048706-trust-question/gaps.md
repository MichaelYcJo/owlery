# Closing memo: 1795048706-trust-question

## Not verified

| Item | Who must answer |
|---|---|
| The suite, the typecheck and the documents' checks as the `Broad gate` of `seal/config.json` runs them. Phase 1 ran 8 test files at `3cbcafc` and typechecked the three files it changed. No workflow under `.github/workflows/` runs the suite, the lint or the typecheck (`seal deferrals . --kind all`, exit 1) | the orchestrator, by the broad run |
| Scenario 7: the cases of `test/daemon.test.ts` that existed before this work pass with the default of 10 seconds. They passed in phase 1's run of that file, and the other test files that start a pane were not run | the orchestrator, by the broad run |
| Scenario 8, the drawn window: the line under "Waiting for you" with its icon and age, its second row, and the sidebar's bell, for the work item of scenario 1. No agent starts the app | the orchestrator, once the app can open without taking the focus (`frame/design.md` scenario 8) |
| The `shasum -a 256` of `~/.claude/settings.json` and `~/.claude/settings.local.json` before and after the drive, which scenario 1 names. The owner's rule for this run forbids reading anything under `~/.claude`. `stat` showed the same size, modification time and inode for each before and after | the owner, who alone may read the two files; the daemon's code that writes neither is unchanged by this work (`src/daemon/main.ts`, `src/daemon/hooks.ts`) |
| The default of 10 seconds has no case, because vitest ends a case at 5 seconds. The drive of scenario 1 ran it once, at the build of `628d126` | a reader of `SILENT_START_MS` in `src/daemon/daemon.ts`; a later drive of the built daemon |
| The drive ran the build of the tree `628d126` holds. Nobody drove the built daemon at a later commit | the sealer, by reading that no commit after `628d126` changes a file under `apps/desktop/src` |
| A pane whose first event arrives after the silent start maps to `waiting`: the frame's probes reached no such launch, and the case of it runs `agentEvent` inside the cases' process | a person who meets a CLI that sends a notification or a permission request before its session's start |

## Not done

- **The timer's function checks neither that the pane is alive nor that it is listed.** The four cancels hold both, and a second check would be a guard no case can see red (`trail/phases/phase-1.md`).
- **The line does not say why the pane waits.** `frame/design.md` *Scope* item 6 puts it out of scope: the daemon does not know what the CLI asks.
- **The worktree and the repository the drive made stay under the phase's scratch**, with the run folder. Claude Code was sent no key there. Whether it kept a record of the folder was not read, since `~/.claude.json` is not read.
