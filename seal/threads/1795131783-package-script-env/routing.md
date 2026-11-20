# Routing: 1795131783-package-script-env

| Axis | Answer |
|---|---|
| Review | straight to the PR |
| Destination | open the pull request |
| Implementation | the session |
| Automation | yes |
| Branch | fix/87-a-pane-holds-the-package-scripts-variables |

Answered 2026-11-20 by the orchestrator, before the first edit.

## Why this way

The owner answered the routing question `agentic` on 2026-11-19 for the release's remaining issues. The orchestrator put this issue into release 0.0.1 on 2026-11-20, because release 0.0.1 is started with `pnpm -C apps/desktop start`, so every person who runs it meets the fault. Judged against the plugin's `skills/implement/orchestration.md` *Under agentic*.

- **No frame:** the issue's *Done when* names the variables and the `PATH` folders a pane drops. The change extends `pty.ts#terminalEnv`, which already drops the variables of the process the app was started from, and nothing is left for a framer to decide.
- **Implementation, the session:** the diff is one function and its cases.
- **Automation, yes:** the function's cases and a login shell in a pseudo-terminal run without a person.
- **Review, straight to the PR:** the sealer's reading of the diff against the issue is the independent reading.
- **Branch:** the pull request merges into `release/v0.0.1` (`docs/roadmap.md` *Releases and the tracker*), by squash.
