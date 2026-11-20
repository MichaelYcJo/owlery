# Routing: 1795178893-keep-awake

| Axis | Answer |
|---|---|
| Review | straight to the PR |
| Destination | open the pull request |
| Planning | framer |
| Implementation | crafter |
| Automation | yes |
| Branch | feat/102-the-mac-sleeps-while-an-agent-works |

Answered 2026-11-20 by the orchestrator, before the first edit.

## Why this way

The owner answered the routing question `agentic` on 2026-11-19 for the release's remaining issues, and on 2026-11-20 gave the orchestrator the scope of release 0.0.1 for small basics, chose Fable for the framers and crafters and Opus for the proofers and sealers, and agreed that the small items go without review rounds. Judged against the plugin's `skills/implement/orchestration.md` *Under agentic*.

- **Planning, framer:** the issue leaves one decision open, whether the daemon or the app holds the block on sleep, and where the setting lives and reaches the daemon. The tree answers both, and a framer reads it.
- **Implementation, crafter:** the work touches the daemon, the protocol, the window's settings and its status line, which is more than the orchestrator should hold beside the two other open work items.
- **Review, straight to the PR:** the change adds one child process and one setting, and the sealer's reading of the diff against the issue is the independent reading.
- **Automation, yes:** the daemon's choice is a function a case reads, and the window is driven through the debugging port of an app started under `OWLERY_BACKGROUND=1`.
- **Branch:** the pull request merges into `release/v0.0.1` (`docs/roadmap.md` *Releases and the tracker*), by squash.
