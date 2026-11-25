# Closing memo: 1795610690-224-the-ask-section-goes

## Not verified

| Item | Who must answer |
|---|---|
| The screenshot run in every theme (`OWLERY_SCREENSHOT_THEMES=all`): phase 1 ran it in Night watch alone, and phases 2 and 3 change the window again | the phase that changes the window last, or the orchestrator before the pull request's body carries the files |
| The broad gate at the phase's head: the whole suite, the typecheck of every package and the documents' check | the orchestrator |
| The built-app batch ran on Electron 45.3.3 from the main checkout's `node_modules` (`ELECTRON_OVERRIDE_DIST_PATH`), since the worktree's `node_modules` holds no Electron binary | the orchestrator's broad gate, from a checkout that holds its own binary |
| Phase 2's built-app files it did not change: `frame/plan.md` *Phases* row 2 names `node scripts/test-in-electron.mjs --project app`, which phase 2 did not run. The session refused that command, and the spawn named the built-app files the phase changes, `test/approval-line.test.ts` and `test/screenshots.test.ts`, which it ran | the orchestrator's broad gate |
| A headless session's line at the view's foot in the built app: a press of its "Stop" and the error output under a failed session's line had their one built-app case in `test/ask-section.test.ts`, which phase 2 deleted whole (`frame/design.md` *Scope* item 10). `test/view.test.ts` pins what `headlessLines` gives such a line, and the screenshot run draws the gate's line and its output | the orchestrator, who decides whether a built-app case of a stage session's line is owed, here or in milestone 3 |

## Not done

The screenshot run's loop still types the code a setup ends with into the setup pane of a made work item whose setup is to succeed (`test/screenshots.test.ts`, the loop over `WORK_ITEMS`). Since this phase no made work item asks for a setup that succeeds, so nothing reaches that branch. It stays because `WORK_ITEMS`'s type still offers `succeeded` to a made work item, and without the branch that value would leave the setup running and say nothing.
