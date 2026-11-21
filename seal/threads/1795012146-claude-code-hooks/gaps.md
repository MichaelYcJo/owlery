# Closing memo: 1795012146-claude-code-hooks

## Not verified

| Item | Who must answer |
|---|---|
| closed The `Notification` hook: no event of the driven session raised one, so Owlery has not seen it arrive | re-homed to #110 at the settle of release 0.0.1: its second *Done when* line asks for a real session's `Notification` hook reaching the inbox |
| closed A person driving the "Claude Code" pane in the app window itself: the hooks were seen through the same `TerminalSession`, `HookServer` and settings file in a PTY the session drove, not through the window's buttons | answered at the settle of release 0.0.1: the owner's hand check of 2026-11-21 in the app started by `pnpm --filter @owlery/desktop start` at `5bd94bf`, written on #24: a real Claude Code session was put to work in a work item's pane and its line in the inbox changed state |
| closed Each hook the architecture lists arrives, with its fields, from a `claude` launched with Owlery's settings | executed 2026-11-18 by a one-off probe (deleted after one run) that drove an interactive `claude` 2.1.327 in a PTY with `--settings` and `--permission-mode default`: `SessionStart`, `UserPromptSubmit`, `PreToolUse`, `PermissionRequest`, `PostToolUse`, `Stop`, then a failing `ls` and `PostToolUseFailure` with `error` and `is_interrupt`; a headless run the same day showed a project-level hook and the `--settings` hook both firing on one `UserPromptSubmit` |
| closed The user's own settings file is unchanged after sessions | executed: `shasum -a 256 ~/.claude/settings.json` printed `9098496f5b5de981…` before the work item's first edit and after the probe |

## Not done

- **The window shows a list of hook events, not the inbox.** The inbox, with each session's state read from these events and from git, is issue #7.
- **A hook answers nothing back.** `PermissionRequest` returns no decision: answering from the phone needs the hook to wait for one, which comes with the phone (v0.2).
- **The main process owns the hook socket.** It moves into the daemon with the terminals in issue #5.
