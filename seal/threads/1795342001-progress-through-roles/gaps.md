# Closing memo: 1795342001-progress-through-roles

## Not verified

| Item | Who must answer |
|---|---|
| The whole suite, the typecheck of every package and the broad gate's document checks, at the phase's last commit. Phase 1 ran the phase boundary set alone, and the typecheck of `apps/desktop` once, before its first commit | the orchestrator, at the broad gate |
| The test files that start the built app and import a path phase 1 changed: `test/ask-section.test.ts`, `test/notification-click.test.ts` and `test/role-bundle.test.ts`. Phase 1 changes nothing the window draws, and the owner's rule for this run starts the built app only as often as the phase's verification needs, which for phase 1 is never | the orchestrator, at the broad gate |
| Whether `test/claude-adapter.test.ts` "reports the exit of a CLI whose child still holds its streams soon after the exit, and signals nothing once the CLI has exited" fails at the base too. At `ea9b71d` it failed in the boundary set and alone, on its bound of 1,500 ms (2,115 ms and 1,745 ms were measured), and it passed in the two later runs of the set. The only module phase 1 changed that it loads is `protocol.ts`, by a type the build erases | the orchestrator, at the broad gate against the base |
| The test files that start the built app and load the page phase 2 changed, which phase 2 did not run: `test/ask-section.test.ts`, `test/daemon-restart.test.ts`, `test/keep-awake.test.ts`, `test/korean-input.test.ts`, `test/notification-click.test.ts`, `test/records-dialog.test.ts`, `test/role-bundle.test.ts`, `test/terminal-basics.test.ts`, `test/work-item-form.test.ts` and `test/work-item-menu.test.ts`. Each window now draws an approval section in the view's right column and the preview of every work item. Phase 2's boundary set started the app in `test/approval-line.test.ts`, `test/theme-controls.test.ts` and `test/decisions-and-questions.test.ts` alone, by the owner's rule that starts it only as often as the phase's verification needs | the orchestrator, at the broad gate |
| The package's typecheck, `pnpm run typecheck` in `apps/desktop`, at phase 2's last commit. Phase 2 typechecked the four files it changed that `tsc` reads and the modules they import, with the options of `tsconfig.json` | the orchestrator, at the broad gate |
| A green run of the phase boundary set. Each of its three runs failed: the last, at `53ccd4b`, on 19 cases of `test/daemon.test.ts` that timed out at 5 seconds while other sessions' suites ran on the machine. Those cases passed when run alone. `trail/phases/phase-1.md` gives each run | the orchestrator, at the broad gate |

## Not done

nothing
