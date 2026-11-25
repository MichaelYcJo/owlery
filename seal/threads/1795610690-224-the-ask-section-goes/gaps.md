# Closing memo: 1795610690-224-the-ask-section-goes

## Not verified

| Item | Who must answer |
|---|---|
| The screenshot run in every theme (`OWLERY_SCREENSHOT_THEMES=all`): phases 1, 2 and 3 each ran it in Night watch alone. Phase 3, the last that changes the window, ran the screenshot run once in its built-app batch, as the spawn allowed | the orchestrator, before the pull request's body carries the files |
| The broad gate at the phase's head: the whole suite, the typecheck of every package and the documents' check | the orchestrator |
| The built-app batch ran on Electron 45.3.3 from the main checkout's `node_modules` (`ELECTRON_OVERRIDE_DIST_PATH`), since the worktree's `node_modules` holds no Electron binary | the orchestrator's broad gate, from a checkout that holds its own binary |
| Phase 2's built-app files it did not change: `frame/plan.md` *Phases* row 2 names `node scripts/test-in-electron.mjs --project app`, which phase 2 did not run. The session refused that command, and the spawn named the built-app files the phase changes, `test/approval-line.test.ts` and `test/screenshots.test.ts`, which it ran | the orchestrator's broad gate |
| Phase 3's built-app files beyond the ones that read a path it changed: `frame/plan.md` *Phases* row 3 names `node scripts/test-in-electron.mjs --project app`. The spawn allows at most three test files a command, so phase 3 ran `test/machine-dialog.test.ts`, `test/approval-line.test.ts` and `test/role-bundle.test.ts` in one command, then `pnpm run screenshots` and `pnpm run role:refusal` (`trail/phases/phase-3.md`) | the orchestrator's broad gate |
| closed a headless session's line at the view's foot in the built app: a press of its "Stop" and the error output under a failed session's line had their one built-app case in `test/ask-section.test.ts`, which phase 2 deleted whole (`frame/design.md` *Scope* item 10). `test/view.test.ts` pins what `headlessLines` gives such a line, and the screenshot run draws the gate's line and its output | the orchestrator, who owes no case: `frame/plan.md` *Judgments of the run*, 2026-11-26 |

## Not done

The screenshot run's loop still types the code a setup ends with into the setup pane of a made work item whose setup is to succeed (`test/screenshots.test.ts`, the loop over `WORK_ITEMS`). Since this phase no made work item asks for a setup that succeeds, so nothing reaches that branch. It stays because `WORK_ITEMS`'s type still offers `succeeded` to a made work item, and without the branch that value would leave the setup running and say nothing.

The text a permission request carries for a person has no reader left since phase 3: `RoleEvent`'s `text` on a `permission` event, and `adapters/claude.ts#firstOf` with `PERMISSION_TEXT_CHARS` and `PERMISSION_CUT_MARK`, which cut it. The daemon now reads a request's action and path for the grant, and its tool and action for a refusal's row. Taking the text out changes the adapter's event, which the fake adapter, its cases and the Claude adapter's cases share. `frame/design.md` *Scope*, the list *Out*, leaves it to issue #254.
