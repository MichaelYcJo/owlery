# Closing memo: 1795636143-213-a-panes-tab-has-a-menu

## Not verified

| Item | Who must answer |
|---|---|
| A press of the right button on the back's tab opens no menu and keeps the system's menu away (`work-item-view.ts#backTab`). No case reaches the back's tab: `terminal-basics.test.ts` draws no back, and `seal-back-view.test.ts` presses nothing on it with the right button | the proofer of round 1, by reading `backTab`; a case in `seal-back-view.test.ts` is what would execute it |
| `terminal-basics.test.ts` whole at `f8cc50e4` or later, where only its five close cases ran, and the built-app files outside the phase's batch that build `index.html`, `work-item-view.ts` and `view.ts` into the app they start | the orchestrator's broad gate |
| The full suite, the repository-wide lint and the typecheck at the work item's head | the orchestrator's broad gate |

## Not done

Phase 1 writes no `changelog.md`: the crafter writes it in the work item's last phase, which is phase 2.
