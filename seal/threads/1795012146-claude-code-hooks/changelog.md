# Changelog: Claude Code hooks

Issue #4. Owlery could open a terminal but could not tell what a Claude Code session in it was doing.

- **A "Claude Code" pane starts `claude` with Owlery's hooks.** The pane replaces the user's interactive login shell with `claude --settings <Owlery's hook file>`, so the hooks reach only the sessions Owlery launches. Claude Code adds those settings to the user's and the project's, and Owlery writes nothing under `~/.claude`.
- **The hook events reach the app.** Each hook sends its event with the pane's id to a socket in Owlery's own directory, readable by the user alone, and exits 0 when Owlery is not listening, so a session is never held up. The window lists the events by pane.
- **The hooks are recorded as run.** `docs/architecture.md` now says each hook it lists was run on 2026-11-18 and which fields arrived, among them that `PermissionRequest` carries no `tool_use_id`.
- **The Claude Code pane ends with `claude`.** A shell opened after `claude` came up without the user's prompt theme, so "+ Shell" opens shells.
