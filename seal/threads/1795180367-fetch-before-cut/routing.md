# Routing: 1795180367-fetch-before-cut

| Axis | Answer |
|---|---|
| Review | straight to the PR |
| Destination | open the pull request |
| Planning | framer |
| Implementation | crafter |
| Automation | yes |
| Branch | fix/96-a-work-item-starts-from-a-stale-remote-branch |

Answered 2026-11-20 by the orchestrator, before the first edit.

## Why this way

The owner answered the routing question `agentic` on 2026-11-19 for the release's remaining issues, and on 2026-11-20 gave the orchestrator the scope of release 0.0.1 for small basics, chose Fable for the framers and crafters and Opus for the proofers and sealers, and agreed that the small items go without review rounds. Judged against the plugin's `skills/implement/orchestration.md` *Under agentic*.

- **Planning, framer:** the issue leaves open when the fetch runs (at the plan, at the creation, or both), how long it may take, and what the form says offline. The tree answers these, and a framer reads it.
- **Implementation, crafter:** the work touches the daemon's worktree code, the protocol's plan and the form, which is more than the orchestrator should hold beside the two other open work items.
- **Review, straight to the PR:** the change adds one fetch of one remote before a cut, and the sealer's reading of the diff against the issue is the independent reading.
- **Automation, yes:** the fetch runs against temporary repositories with a local bare remote that a case makes, and a case reads the commit a work item starts from.
- **Branch:** the pull request merges into `release/v0.0.1` (`docs/roadmap.md` *Releases and the tracker*), by squash.
