# Routing: 1795158086-notification-click

| Axis | Answer |
|---|---|
| Review | straight to the PR |
| Destination | open the pull request |
| Planning | framer |
| Implementation | crafter |
| Automation | yes |
| Branch | feat/31-a-click-on-a-notification-opens-nothing |

Answered 2026-11-20 by the orchestrator, before the first edit.

## Why this way

The owner answered the routing question `agentic` on 2026-11-19 for the release's remaining issues, put issue #31 into release 0.0.1 on 2026-11-20, chose Fable for the framers and crafters and Opus for the proofers and sealers, and agreed the same day that this item runs beside #93 in a worktree of its own and that the small items go without review rounds. Judged against the plugin's `skills/implement/orchestration.md` *Under agentic*.

- **Planning, framer:** how a click on a notification reaches the window, and which view opens for which session, are choices the tree does not answer yet.
- **Review, straight to the PR:** the change is one path from a notification to a view the window already has; a defect shows at once in the built app, and the sealer's reading of the diff against the issue is enough.
- **Automation, yes:** the issue states every decision a person has to make, and the app is driven through the debugging port of an app started under `OWLERY_BACKGROUND=1`, against a temporary repository.
- **Implementation, crafter:** the owner's choice of Fable.
- **Branch:** the pull request merges into `release/v0.0.1` (`docs/roadmap.md` *Releases and the tracker*).
