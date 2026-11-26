# Routing: 1795610869-217-a-new-work-item-picks-its-branch

| Axis | Answer |
|---|---|
| Review | through the review chain |
| Destination | open the pull request |
| Planning | framer |
| Implementation | crafter |
| Automation | yes |
| Branch | feat/217-a-new-work-item-makes-a-random-branch-not-a-worktree-on-a-picked-branch |

Answered 2026-11-25 by the orchestrator, before the first edit.

## Why this way

On 2026-11-25 the owner cut release 0.0.5 to the orchestrator in these words: "0.0.5 릴리즈브랜치파고 알아서끝까지할수있지? 난 잘거라서" ("cut the 0.0.5 release branch, and you can take it to the end on your own, right? I'm going to sleep"), and to the question whether the run is agentic the orchestrator answered that it is. No batch was put to the owner, who was asleep; every row below is the orchestrator's, judged against the plugin's `skills/implement/orchestration.md` *Under agentic*.

- **Planning, framer:** the owner set the shape in the issue, and a work item without a branch reaches every reader of `WorkItem.branch` in the daemon and the window, which the frame has to enumerate and order into phases.
- **Implementation, crafter:** a change across the protocol, the daemon, the worktree code and the new work item form.
- **Review, through the review chain:** a reader of the branch left assuming one stands is a defect a person meets only on a work item that has none.
- **Automation, yes:** every question foreseen has a default the tree or the framer can give.
- **Branch:** cut from `release/v0.0.5` at `ab7a5730`; the pull request merges into `release/v0.0.5` by squash.
