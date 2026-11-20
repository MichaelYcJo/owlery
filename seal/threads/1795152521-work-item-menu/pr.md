Part of #93. The issue closes when `release/v0.0.1` reaches `main`.

Before this change a work item could not be renamed, archived or deleted. A repository was listed in the sidebar only while it held a work item, and there was no way to remove it. Neither one had a menu. Now each has a menu, opened with the right button, with Control and a click, or from the keyboard with M or Shift+F10. A repository stays in the sidebar on its own, with a "+" button for a new work item and a "…" button for its menu.

| Before | After |
|---|---|
| A work item kept the name it was created with | Rename, which also renames the branch only where the branch was never pushed |
| The only way out of the list was to delete the worktree by hand | Archive takes the work item off the lists and changes nothing on disk. Restore brings it back |
| Owlery could not delete a work item | Delete removes the worktree and the local branch, after a dialog names everything that would go |
| A repository left the sidebar with its last work item | Repositories are kept, can be hidden, and are removed only from their menu |
| No pinning, no muting, no grouping | Pin puts a work item first. Mute stops its notifications. Groups sort a repository's work items in the sidebar |
| A folder could be opened only outside Owlery | Open in Finder, or in an editor or terminal Owlery finds installed, and copy the path or the branch name |

**Nothing is deleted without the person's word.**

- **What the delete dialog lists.** Before a delete runs, the dialog lists what it would remove:
  - the branch and the folder;
  - every commit that no other branch, no remote's branch and no tag holds;
  - every uncommitted change and every untracked file;
  - the files git ignores, such as `.env`.
- **When it needs "Force delete".** Where a commit, a change or an untracked file would be lost, "Delete" stays off until the person checks "Force delete". Ignored files are listed but do not need the force.
- **When it refuses.** The daemon reads the loss again just before the delete and once more after it has ended the work item's sessions. Where either read differs from what the person saw, it refuses and the dialog reads again. A session that started after the dialog opened also makes it refuse.
- **What it never removes.** It removes nothing on a remote.
- **Removing a repository.** It removes nothing on disk unless the person checks one of two choices. One choice deletes each work item as a single delete would, and the removal stops at the first refusal. The other moves the repository's folder to the Trash whole.

**An archive and a delete do not run at the same time.** While a delete of a work item is running, an archive of it is refused, and no pane or headless session can start in it. While an archive is ending its sessions, a delete of it is refused.

**An update keeps the list.** A build with this change reads the work items the earlier build kept. It writes its list to a new file at the first change and leaves the old file as it was. A daemon left running from an earlier build shows no repository list. While it runs, the status line says to end its sessions and start Owlery again.

Not verified, for the owner's hand run of #24:

- **The Trash.** No automated run moved a folder to the Trash, so the move and putting the folder back from the Trash are untested.
- **How the screens look.** The dialogs, the archived list and the group headings in both themes, and how a delete dialog listing several hundred files scrolls.
- **A slow pane.** A delete or a removal where a Claude Code pane takes more than three seconds to end.
- **The menus in the built app.** Group moves from the inbox and history menus, the sidebar's groups while a search is typed, and the description each menu item shows on hover.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
