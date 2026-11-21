# Closing memo: 1795268971-panes-nothing-can-close

## Not verified

| Item | Who must answer |
|---|---|
| The window was not driven: that an exited pane of a work item is closed at the "x" of its tab after a reload rests on reading `paneTabs`, `tabElement` and `closeAsks` and on the `paneTabs` cases of `test/view.test.ts` | the orchestrator's broad gate (`terminal-basics.test.ts` closes panes in the built app) |
| The built-app cases that start the daemon with a pane were not run, to keep the machine's load modest | the orchestrator's broad gate |
| No daemon of an earlier build was run against the new window: a pane it lists with `workItemId` null still has no tab | nobody until a person runs an old daemon; the daemon restarts at a build change (`daemon-restart.test.ts`) |

## Not done

The exited panes of an archived work item stay listed until the work item is restored or deleted; the window has no view of an archived work item to close them in. Taking them off the list at the archive would lose their last output at a restore, which the archive's own comment keeps on purpose. The rule is stated in `trail/phases/phase-1.md` and `changelog.md`; no code moves for it.

`SessionInfo.workItemId` still admits null, for a daemon of an earlier build and for an old last look; narrowing it touches `last-look.ts`, `view.ts` and `work-item-view.ts` and was not asked.
