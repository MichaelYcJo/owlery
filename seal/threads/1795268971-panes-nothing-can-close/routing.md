# Routing: 1795268971-panes-nothing-can-close

| Axis | Answer |
|---|---|
| Review | straight to the PR |
| Destination | open the pull request |
| Planning | the session |
| Implementation | crafter |
| Automation | yes |
| Branch | fix/28-the-daemon-keeps-panes-nothing-can-close |

Answered 2026-11-21 by the orchestrator, before the first edit.

## Why this way

On 2026-11-21 the owner answered the routing question `agentic` for release 0.0.2, put #28, #29 and #30 in the small tier (the session frames, a Sonnet crafter, an Opus sealer), asked that usage be kept down, and asked that what can run in parallel does. Judged against the plugin's `skills/implement/orchestration.md` *Under agentic*.

- **Planning, the session:** the issue's two *Done when* lines say what to build, and the one choice they leave, whether an exited pane is closed from the window or leaves the list by a rule, is the crafter's to make against the tree and record. The issue is the frame; no `frame/` is written.
- **Implementation, crafter:** a Sonnet crafter, as the tier names. The change touches the daemon's `start`, its option for its own working folder, and how an exited pane leaves the list, with their cases.
- **Review, straight to the PR:** the change removes one path of the daemon and adds one rule, and the sealer reads the diff against the issue.
- **Automation, yes:** the daemon's `start` and its pane list are read by cases, and the window is driven under `OWLERY_BACKGROUND=1`.
- **Branch:** the pull request merges into `release/v0.0.2` (`docs/roadmap.md` *Releases and the tracker*), by squash. It runs beside #30 and #26, cut from `dc82f88`; #30 carries the release's version move, so this work item moves no version.
