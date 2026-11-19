# Routing: 1795131530-tab-names

| Axis | Answer |
|---|---|
| Review | straight to the PR |
| Destination | open the pull request |
| Implementation | the session |
| Automation | yes |
| Branch | fix/86-a-panes-tab-shows-the-daemons-id |

Answered 2026-11-20 by the orchestrator, before the first edit.

## Why this way

The owner answered the routing question `agentic` on 2026-11-19 for the release's remaining issues, and on 2026-11-20 put this issue into release 0.0.1 and chose how tabs are named: by kind, in the order the work item's open panes stand, with no number where a kind has one pane. Judged against the plugin's `skills/implement/orchestration.md` *Under agentic*.

- **No frame:** the owner's answer is the design. The change is one pure function of the window, `view.ts#tabLabel`, and its two callers, and nothing is left for a framer to decide.
- **Implementation, the session:** the diff is one function, its cases and two call sites, small enough that a spawn costs more than it saves.
- **Automation, yes:** the function's cases run without a person.
- **Review, straight to the PR:** the sealer's reading of the diff against the issue is the independent reading.
- **Branch:** the pull request merges into `release/v0.0.1` (`docs/roadmap.md` *Releases and the tracker*), by squash.
