# Closing memo: 1795636143-213-a-panes-tab-has-a-menu

## Not verified

| Item | Who must answer |
|---|---|
| A press of the right button on the back's tab opens no menu and keeps the system's menu away (`work-item-view.ts#backTab`). No case reaches the back's tab: `terminal-basics.test.ts` draws no back, and `seal-back-view.test.ts` presses nothing on it with the right button | the proofer of round 1, by reading `backTab`; a case in `seal-back-view.test.ts` is what would execute it |
| closed `terminal-basics.test.ts` whole at `f8cc50e4` or later, where only its five close cases ran, and the built-app files outside the phase's batch that build `index.html`, `work-item-view.ts` and `view.ts` into the app they start | `terminal-basics.test.ts` passed whole at `cff754a6`, 40 cases, in phase 2 (`trail/phases/phase-2.md`); the other built-app files stand in the row below |
| The built-app files outside phase 2's batch of `terminal-basics.test.ts`, `work-item-menu.test.ts` and `screenshots.test.ts`, which start the app built from the sources phase 2 changed: `apps/desktop/vitest.config.ts` lists them, as the test files that import `buildApp` | the orchestrator's broad gate |
| `daemon.test.ts` whole: phase 2 ran `-t setPane` and, by name, the cases whose assertions of a whole session gained `NO_MARKS` | the orchestrator's broad gate |
| The two refusals of `setPane` the window shows: the rename dialog's under its field (`work-item-view.ts#takePaneName`, which `renderer.ts` asks for both `done` and `error`), and a swatch's in the sidebar, as `renderer.ts` tells every refusal no dialog claims. No case reaches either from the window: the field takes 60 characters at most, and a pane that is gone closes the dialog before anything is sent | the proofer of round 1, by reading those two paths; a built-app case whose daemon refuses `setPane` is what would execute them |
| The full suite, the repository-wide lint and the typecheck at the work item's head | the orchestrator's broad gate |

## Not done

In the `tabs` screenshots the open menu covers part of the blue tab's bar and of the pink one's, since the menu opens at the pointer, which stands on the tab. The `rename` shots of the same scene show the three bars whole, so no further view was added to show the bars without a menu.
