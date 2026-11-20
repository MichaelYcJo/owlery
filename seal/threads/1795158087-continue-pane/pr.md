Part of #94. The issue closes when `release/v0.0.1` reaches `main`.

A work item's pane bar now offers "+ Claude Code (continue)" after "+ Claude Code". The pane it opens starts Claude Code with `--continue`, on the latest conversation held in the work item's worktree. So a person can get back to the conversation they had in a work item after the daemon is replaced or the Mac restarts, without leaving Owlery. Claude Code chooses the conversation, and Owlery reads none of its files.

What `--continue` does was measured first, with the owner's logged-in Claude Code 2.1.329 in a temporary repository on 2026-11-20:

- In each of two worktrees of one repository, it opened that worktree's own conversation, whichever worktree held the later one.
- In a worktree with no conversation, it printed `No conversation found to continue` and ended with exit code 1, so Owlery adds nothing there.
- It did not open the one-turn sessions that "Ask" runs, so "Ask" needed no change.
- The hooks arrived from a continued session, so the inbox shows its state as for any Claude Code pane.

The continuing pane is a Claude Code pane in every other way: same hooks and settings file, same tab name and count. The "New work item" form does not offer the choice, because a new worktree has no conversation.

| Before | After |
|---|---|
| A new Claude Code pane always started a new conversation | "+ Claude Code (continue)" opens the worktree's latest conversation |
| A daemon told a window which kinds of pane it offers | It also tells which kinds can continue; a `start` asking to continue a shell is refused |

A window of this build shows no continuing button to a daemon of an earlier build, so a daemon left running from before this change offers none until it is replaced.

Not verified, for the owner's hand run of #24: what the app's terminal draws when `--continue` finds no conversation, what `--continue` shows in a repository whose trust question was never answered, and the permission and tool hooks of a continued session.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
