# Changelog: a pane opens only in a work item

Issue #28. Since #18 the window opens no pane outside a work item, yet the daemon still started one for a `start` that named none, in a folder of its own, and a pane like that had no tab to close it from.

- **A start without a work item is refused.** The daemon answers a `start` whose `workItemId` is no number with the error "a pane opens in a work item", and starts nothing. A start that asks to continue a conversation is refused the same way when it names no work item.
- **The daemon's own working folder is gone.** The daemon takes no `cwd` option and no longer reads `OWLERY_CWD`. A pane runs in its work item's worktree and nowhere else.
- **An exited pane is closed from its tab.** A pane of a work item keeps its tab after its process exits, also after a reload, and its "x" closes it at one press. With no pane outside a work item, no listed pane is left without a tab. The panes of an archived work item stay listed as exited while it is archived, and come back as tabs when it is restored; a delete of the work item takes them off the list.
