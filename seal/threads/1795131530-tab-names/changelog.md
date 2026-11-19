# Changelog: a pane's tab names its kind, and counts only the work item's own panes

Issue #86. A pane's tab read its kind and a number the daemon gives every pane it starts, across every work item and counting the panes already closed. The first Claude Code pane of a new work item could read "Claude Code 3".

- **A tab names its pane's kind alone where the work item has one open pane of that kind**, such as "Claude Code" or "Shell".
- **Two or more open panes of one kind are numbered 1, 2, 3 in the tabs' order.** Each kind counts on its own, so "Shell" stands beside "Claude Code 1" and "Claude Code 2".
- **The numbers follow the open panes.** After a pane closes, the others of its kind are numbered again from 1, so a pane's number can change.
- **A notification for a pane outside any work item is titled with its kind alone.**
