# Routing: 1795132877-headless-lookup-env

| Axis | Answer |
|---|---|
| Review | straight to the PR |
| Destination | open the pull request |
| Implementation | the session |
| Automation | yes |
| Branch | fix/90-a-headless-session-finds-no-node |

Answered 2026-11-20 by the orchestrator, before the first edit.

## Why this way

The owner answered the routing question `agentic` on 2026-11-19 for the release's remaining issues, and on 2026-11-20 told the orchestrator to file and fix the fault #87's sealer found ("그렇게해"). Judged against the plugin's `skills/implement/orchestration.md` *Under agentic*.

- **No frame:** the issue's *Done when* names the environment the lookup's shell starts with, and `pty.ts#terminalEnv` already builds it for a pane. Nothing is left for a framer to decide.
- **Implementation, the session:** the diff is one argument of one call and its case.
- **Automation, yes:** the adapter's cases run a stand-in login shell without a person.
- **Review, straight to the PR:** the sealer's reading of the diff against the issue is the independent reading.
- **Branch:** the pull request merges into `release/v0.0.1` (`docs/roadmap.md` *Releases and the tracker*), by squash.
