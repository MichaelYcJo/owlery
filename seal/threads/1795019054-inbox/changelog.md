# Changelog: the inbox

Issue #7. The window listed the work items and said nothing of what their sessions were doing, so a person had to open each tab to find the one that waited.

- **The side panel's list is the inbox.** Each work item has one line: its title, its branch, what its agent is doing, and how many commits its branch gained.
- **A Claude Code session's state shows as it happens.** The line reads `working` once the agent was asked something or used a tool, `waiting` when it asks for permission or sends a notification, and `finished` at the end of its turn. The state is read from Claude Code's hooks, never from what the terminal prints. It is the state of the work item's most recent pane that still runs, and a work item whose agent has not been asked anything, or whose agent's process ended, shows none.
- **New commits show for every work item, with or without hooks.** A work item records the commit its branch was cut at, and its line reads "1 new commit" or "3 new commits" once the branch holds more. The daemon reads the branches every 3 seconds while a window is connected. A work item made before this release shows no count.
- **A click on a line opens the work item.** It shows the work item's most recent pane that still runs. Where the work item has none, after a restart for one, it opens Claude Code in the work item's worktree.
- **A notification when a session waits or finishes.** It is titled with the work item's title and says "Waiting for you" or "Finished". None is shown for the pane in front while the window has focus.
- **Each tab has a close control.** It ends the pane's process and removes the tab, without asking first.
- **The window no longer names Claude Code or the shell itself.** The daemon tells it which kinds of pane exist and what to call them, and the "+" buttons, the form's choice and the tab labels come from that list. The form of a new work item lists the shell first and still starts on Claude Code.
- **For a client of the daemon:** `ready` carries `paneKinds`, a session carries `state`, a work item carries `baseCommit` and `newCommits`, the daemon sends `inbox` with both lists to every client whenever either changes, and `close` ends a pane and takes it off the lists.
