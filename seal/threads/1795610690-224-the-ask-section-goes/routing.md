# Routing: 1795610690-224-the-ask-section-goes

| Axis | Answer |
|---|---|
| Review | through the review chain |
| Destination | open the pull request |
| Planning | framer |
| Implementation | crafter |
| Automation | yes |
| Branch | fix/224-the-views-ask-section-starts-a-session-that-knows-nothing |

Answered 2026-11-25 by the orchestrator, before the first edit.

## Why this way

On 2026-11-25 the owner cut release 0.0.5 to the orchestrator in these words: "0.0.5 릴리즈브랜치파고 알아서끝까지할수있지? 난 잘거라서" ("cut the 0.0.5 release branch, and you can take it to the end on your own, right? I'm going to sleep"), and to the question whether the run is agentic the orchestrator answered that it is. No batch was put to the owner, who was asleep; every row below is the orchestrator's, judged against the plugin's `skills/implement/orchestration.md` *Under agentic*.

- **Planning, framer:** removing the section removes the window's only start of a role-less session, which several cases drive, and the issue leaves open where the gate's output shows instead.
- **Implementation, crafter:** the section, its protocol message and the cases that drive it.
- **Review, through the review chain:** a removal that leaves a path nobody starts, or a case that no longer reaches what it tested, shows only to a reader of the whole diff.
- **Automation, yes:** every question foreseen has a default the tree or the framer can give.
- **Branch:** cut from `release/v0.0.5` at `ab7a5730`; the pull request merges into `release/v0.0.5` by squash.
