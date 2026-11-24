# Closing memo: 1795559732-test-start-raises-no-notification

## Not verified

| Item | Who must answer |
|---|---|
| The files that start the built app and that phase 1 did not run, each of which loads the changed preload and page: `test/chain-choice.test.ts`, `test/daemon-restart.test.ts`, `test/keep-awake.test.ts`, `test/records-dialog.test.ts`, `test/role-bundle.test.ts`, `test/terminal-basics.test.ts`, `test/theme-controls.test.ts`, `test/work-item-form.test.ts`, `test/work-item-menu.test.ts` and the other files `vitest.config.ts` puts in its `app` project | the orchestrator's broad gate |
| closed `test/ask-section.test.ts` fails at phase 1's commit, at line 185: its line 167 puts a new list in the place of the page's `window.__notifications`, which the *Removes* row of that file does not name (`trail/phases/phase-1.md`) | the file passes at `23167047`, run alone with `OWLERY_BACKGROUND=1` in phase 2's boundary run, where the case reads the page's list after a count in place of a new list (`trail/phases/phase-2.md`) |
| closed `test/screenshots.test.ts` under `pnpm run screenshots`, the one command under which it starts the app, against the page that now keeps its notifications | `pnpm run screenshots` passed at `23167047`, run once and alone in phase 2, with no replacement of the page's `Notification` before the start or the reload (`trail/phases/phase-2.md`) |
| A person's start of the built app still shows the macOS banner when a pane behind another comes to wait, and a click on it brings the window forward and opens the work item's view | the owner's run at the release walk (`frame/questions.md` Q1) |

## Not done

Phase 1 left `test/ask-section.test.ts` failing. Its fix was phase 2's by `frame/plan.md` *Phases*, and a change to that file in phase 1 would have built beyond the phase. Phase 2 fixed it at `23167047`.

The count `test/ask-section.test.ts` takes before its requests is kept, though a mutation that sets it to 0 survives: the page's list is empty when that case begins, so the count holds nothing at this tree. `frame/design.md` *Scope* item 4 asks for it, and it keeps the case from breaking once an earlier case raises a notification. No case was added to make it fail today, because that would raise a notification in an earlier case only to pin this count (`trail/phases/phase-2.md`).
