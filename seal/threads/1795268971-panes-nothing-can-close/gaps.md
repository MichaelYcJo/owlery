# Closing memo: 1795268971-panes-nothing-can-close

## Not verified

| Item | Who must answer |
|---|---|
| closed The window was not driven: that an exited pane of a work item is closed at the "x" of its tab after a reload rests on reading `paneTabs`, `tabElement` and `closeAsks` and on the `paneTabs` cases of `test/view.test.ts` | answered: the orchestrator's broad gate passed at `a6b0699`, the last run of this work item's `trail/gate.md` and the commit its sealer sealed |
| closed The built-app cases that start the daemon with a pane were not run, to keep the machine's load modest | answered: the orchestrator's broad gate passed at `a6b0699`, the last run of this work item's `trail/gate.md` and the commit its sealer sealed |
| closed No daemon of an earlier build was run against the new window: a pane it lists with `workItemId` null still has no tab | re-homed to issue #133, under "Rows carried here by the settle of release 0.0.2" |

## Not done

The exited panes of an archived work item stay listed until the work item is restored or deleted; the window has no view of an archived work item to close them in. Taking them off the list at the archive would lose their last output at a restore, which the archive's own comment keeps on purpose. The rule is stated in `trail/phases/phase-1.md` and `changelog.md`; no code moves for it.

`SessionInfo.workItemId` still admits null, for a daemon of an earlier build and for an old last look; narrowing it touches `last-look.ts`, `view.ts` and `work-item-view.ts` and was not asked.
