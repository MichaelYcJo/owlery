# Changelog: a Claude Code pane that continues the worktree's latest conversation

Issue #94. A work item's panes end when the daemon is replaced or the Mac restarts, and a new Claude Code pane always started a new conversation, so a person could not get back to the conversation they had in the work item without leaving Owlery.

- **The pane bar of a work item offers "+ Claude Code (continue)".** It stands after "+ Claude Code". The pane it opens starts Claude Code on the latest conversation held in the work item's worktree, with `claude --continue`. Claude Code chooses the conversation, and Owlery reads none of its files.
- **The conversation is the worktree's own.** With Claude Code 2.1.329, measured on 2026-11-20, `--continue` in one worktree opened that worktree's conversation and not another work item's of the same repository. It did not open the one-turn sessions that "Ask" runs.
- **A worktree with no conversation says so.** Claude Code prints `No conversation found to continue` and ends, and the pane shows that line and its exit line. "+ Claude Code" starts a new conversation, as before.
- **The continuing pane is a Claude Code pane in every other way.** It is launched with Owlery's hooks, so the inbox shows its state, and its tab is named and counted with the other Claude Code tabs.
- **The "New work item" form does not offer the choice.** A new worktree has no conversation to continue.
- **A daemon left running from before this change offers no continuing pane** until it is replaced. This way back stands until sessions are resumed by their id (#61).
