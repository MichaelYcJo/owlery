# Routing: 1795610688-242-sidebar-click-survives-a-redraw

| Axis | Answer |
|---|---|
| Review | through the review chain |
| Destination | open the pull request |
| Planning | framer |
| Implementation | crafter |
| Automation | yes |
| Branch | fix/242-a-click-on-a-sidebar-line-is-lost-when-the-sidebar-redraws |

Answered 2026-11-25 by the orchestrator, before the first edit.

## Why this way

On 2026-11-25 the owner cut release 0.0.5 to the orchestrator in these words: "0.0.5 릴리즈브랜치파고 알아서끝까지할수있지? 난 잘거라서" ("cut the 0.0.5 release branch, and you can take it to the end on your own, right? I'm going to sleep"), and to the question whether the run is agentic the orchestrator answered that it is. No batch was put to the owner, who was asleep; every row below is the orchestrator's, judged against the plugin's `skills/implement/orchestration.md` *Under agentic*.

- **Planning, framer:** the issue fixes what a click must do but leaves open how the sidebar keeps a line's element across a redraw.
- **Implementation, crafter:** the sidebar's redraw and the cases that stop clicking again until a view opens.
- **Review, through the review chain:** a case that passes by luck hides the race it was written to catch.
- **Automation, yes:** no person's decision is open.
- **Branch:** cut from `release/v0.0.5` at `ab7a5730`; the pull request merges into `release/v0.0.5` by squash.
