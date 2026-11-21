Part of #28. The issue closes when `release/v0.0.2` reaches `main`.

Since #18 the window opens no pane outside a work item, yet the daemon still started one for a `start` that named no work item, in a folder of its own. Such a pane had no tab, so after a reload nothing could close it, and it stayed listed until the daemon exited.

| Before | After |
|---|---|
| A `start` without `workItemId` opened a pane in the daemon's own folder | The daemon answers it with the error "a pane opens in a work item" and starts nothing, a start that asks to continue a conversation among them |
| The daemon took a `cwd` option and read `OWLERY_CWD` | Both are gone. A pane runs in its work item's worktree alone |
| `start.workItemId` was optional in the protocol | It is required |

**An exited pane is closed from its tab, and no rule drops it.** Release 0.0.1 already gave an exited pane of a work item its tab from the daemon's list (`paneTabs`), and its "×" closes it at one press. The pane with a null work item was the only one left without a tab, and the refusal removes it. Dropping a pane when it exits was rejected, because it would lose the last output of a pane that just failed.

**The panes of an archived work item stay listed as exited** while it is archived, since the window has no view of an archived work item to close them in. A restore brings them back as tabs, and a delete of the work item takes them off the list. The archive keeps them on purpose, so that a restore shows their last output.

**The window's code does not change.** It already sent `workItemId` on every start. About three dozen daemon cases that started a pane with no work item now start one in work item 1 of a run folder, through a new helper.

Not verified:

- **A daemon of an earlier build** run against the new window still lists a pane with a null work item, which has no tab. The daemon restarts at a build change (#106), so the owner's running daemon is replaced at the next start of a new build.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
