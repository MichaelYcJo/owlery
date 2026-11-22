# Closing memo: 1795339000-sessions-outlive-the-daemon

## Not verified

| Item | Who must answer |
|---|---|
| Whether the process of a real Claude Code pane ends when its daemon stops (`frame/questions.md` Q1, the row the settle of release 0.0.1 carried to #36) | The first real session of issue #61's work, or the owner by hand: after "Restart Daemon…" with a Claude Code pane open, `claude agents --json` lists no session whose `cwd` is that pane's worktree |
| Whether the hook events of a subagent carry the pane's own `session_id` | The first real session of issue #61's work |
| Whether Owlery's hook settings and a pane's environment reach a `claude --bg` session, and whether it outlives the process that attached to it (`frame/questions.md` Q2) | The first real session of issue #61's work |
| Whether a daemon started from inside the packaged app's folder keeps opening panes and launching role sessions after the updater replaced that folder (`frame/questions.md` Q4) | Issue #78's work |

## Not done

nothing
