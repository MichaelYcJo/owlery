# Closing memo: 1795559732-test-start-raises-no-notification

## Not verified

| Item | Who must answer |
|---|---|
| The files that start the built app and that phase 1 did not run, each of which loads the changed preload and page: `test/chain-choice.test.ts`, `test/daemon-restart.test.ts`, `test/keep-awake.test.ts`, `test/records-dialog.test.ts`, `test/role-bundle.test.ts`, `test/terminal-basics.test.ts`, `test/theme-controls.test.ts`, `test/work-item-form.test.ts`, `test/work-item-menu.test.ts` and the other files `vitest.config.ts` puts in its `app` project | the orchestrator's broad gate |
| `test/ask-section.test.ts` fails at phase 1's commit, at line 185: its line 167 puts a new list in the place of the page's `window.__notifications`, which the *Removes* row of that file does not name (`trail/phases/phase-1.md`) | the crafter of phase 2 |
| `test/screenshots.test.ts` under `pnpm run screenshots`, the one command under which it starts the app, against the page that now keeps its notifications | the crafter of phase 2, which runs that command |
| A person's start of the built app still shows the macOS banner when a pane behind another comes to wait, and a click on it brings the window forward and opens the work item's view | the owner's run at the release walk (`frame/questions.md` Q1) |

## Not done

Phase 1 leaves `test/ask-section.test.ts` failing. Its fix is phase 2's by `frame/plan.md` *Phases*, and a change to that file in phase 1 would build beyond the phase.
