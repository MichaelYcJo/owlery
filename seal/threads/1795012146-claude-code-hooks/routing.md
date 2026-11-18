# Routing: 1795012146-claude-code-hooks

| Axis | Answer |
|---|---|
| Review | straight to the PR |
| Destination | open the pull request |
| Implementation | the session |
| Automation | no |
| Branch | feat/4-owlery-cannot-hear-claude-code-sessions |

Answered 2026-11-18 by the orchestrator, before the first edit.

## Why this way

The owner answered the routing question `agentic` for this session's work on 2026-11-18, and accepted for issue #3 the shape this work item takes again: the session writes the code, no review round runs, and the sealer reads the diff against the issue. The orchestrator said before the first edit that #4 would run the same way, and the owner merged #3 without asking otherwise. Judged against the plugin's `skills/implement/orchestration.md` *Under agentic*.

- **No frame:** issue #4 fixes the change at its coordinate (hooks only in the sessions Owlery launches, the user's settings untouched, the fields recorded against `docs/architecture.md`), and a headless probe on 2026-11-18 settled how the hooks are added (`--settings` merges with the user's and the project's settings).
- **Implementation, the session:** the diff extends the one package #3 added.
- **Review, straight to the PR:** the sealer's reading of the diff against the issue is the independent reading.
- **Automation, no:** `PermissionRequest` fires only in an interactive session that asks for a permission, so a person has to drive one in the pane.
