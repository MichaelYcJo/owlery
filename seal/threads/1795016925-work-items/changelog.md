# Changelog: work items

Issue #6. Every pane opened in one folder, so two sessions working on one repository edited the same files.

- **A work item gets a branch and a folder of its own.** Creating one cuts the branch `owlery/<slug>` at the repository's current `HEAD` and checks it out in a new git worktree, a separate folder of the same repository. The slug is the title in lower case with dashes, at most 40 characters. A second work item of the same title gets `-2` on both the branch and the folder.
- **The worktrees live under `~/.owlery/worktrees`.** The folder is `~/.owlery/worktrees/<repository name>/<slug>`, outside the repository and with no space in the part Owlery adds. Setting `OWLERY_WORKTREES` moves the root. Owlery copies no ignored file, such as `.env`, into a new worktree, and does not remove a worktree or its branch yet.
- **"+ Work item" in the window creates one and opens a pane in it.** The form asks for the repository folder, typed or chosen in the folder dialog, a title, and whether to open Claude Code or a shell. Any folder inside the repository will do. The pane's process runs in the worktree, and its tab starts with the work item's title.
- **A folder that is not in a git repository is refused.** The form shows the reason and nothing is created.
- **The window lists the work items, and the list outlives the daemon.** The daemon keeps it in `work-items.json` in its run directory, readable by the user alone. The sessions still end with the daemon.
- **"+ Shell" and "+ Claude Code" open where they did**, in the user's home.
