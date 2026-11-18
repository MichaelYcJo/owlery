# Routing: 1795015072-daemon

| Axis | Answer |
|---|---|
| Review | straight to the PR |
| Destination | open the pull request |
| Implementation | the session |
| Automation | yes |
| Branch | feat/5-sessions-die-with-the-app |

Answered 2026-11-19 by the orchestrator, before the first edit.

## Why this way

The owner answered the routing question `agentic` for this session's work, accepted for issues #3 and #4 the shape this work item takes again, and said "다음 진행하자" on 2026-11-19 after the orchestrator named #5 as the next work and this shape as the way to run it. Judged against the plugin's `skills/implement/orchestration.md` *Under agentic*.

- **No frame:** issue #5 fixes the change at its coordinate (the daemon owns the terminals and outlives the app, the window reaches it over WebSocket, the local server accepts only an authenticated client, the protocol carries no vendor-specific field), and `docs/architecture.md` *Overall layout* and *Rules that keep it portable* hold the design.
- **Implementation, the session:** the diff restructures the one package the earlier work items built, which the orchestrator holds.
- **Review, straight to the PR:** the sealer's reading of the diff against the issue is the independent reading.
- **Automation, yes:** every check the issue names can be driven by the session itself (a client that reconnects, a client without the token), as the owner asked on 2026-11-18 after #4, so no step waits on a person.
- **Branch:** the pull request merges into `release/v0.0.1`, the branch of milestone 1 (`docs/roadmap.md` *Releases and the tracker*).
