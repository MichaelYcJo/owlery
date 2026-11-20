# Routing: 1795180366-daemon-restart

| Axis | Answer |
|---|---|
| Review | straight to the PR |
| Destination | open the pull request |
| Planning | framer |
| Implementation | crafter |
| Automation | yes |
| Branch | feat/101-no-way-to-restart-or-fully-quit-the-daemon |

Answered 2026-11-20 by the orchestrator, before the first edit.

## Why this way

The owner answered the routing question `agentic` on 2026-11-19 for the release's remaining issues, and on 2026-11-20 gave the orchestrator the scope of release 0.0.1 for small basics, chose Fable for the framers and crafters and Opus for the proofers and sealers, and agreed that the small items go without review rounds. Judged against the plugin's `skills/implement/orchestration.md` *Under agentic*.

- **Planning, framer:** the issue leaves open how the app stops a daemon it attached to and starts the running build's, how the window tells a daemon of another build, and how a case proves it never stops a daemon it did not start. The tree answers these, and a framer reads it.
- **Implementation, crafter:** the work touches the main process's menu, the daemon client, the protocol, the daemon and the status line, which is more than the orchestrator should hold beside the two other open work items.
- **Review, straight to the PR:** the change adds two menu items, one client message and one status sentence, and the sealer's reading of the diff against the issue is the independent reading.
- **Automation, yes:** a case starts the built app under `OWLERY_BACKGROUND=1` with a daemon of its own run folder, and drives the menu's actions through the main process.
- **Branch:** the pull request merges into `release/v0.0.1` (`docs/roadmap.md` *Releases and the tracker*), by squash.
