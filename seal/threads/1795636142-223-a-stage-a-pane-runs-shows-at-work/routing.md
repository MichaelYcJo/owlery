# Routing: 1795636142-223-a-stage-a-pane-runs-shows-at-work

| Axis | Answer |
|---|---|
| Review | through the review chain |
| Destination | open the pull request |
| Planning | framer |
| Implementation | crafter |
| Automation | yes |
| Branch | fix/223-the-approval-line-says-not-started-while-a-panes-session-runs-a-stage |

Answered 2026-11-26 by the orchestrator, before the first edit.

## Why this way

On 2026-11-25 the owner cut release 0.0.5 to the orchestrator in these words: "0.0.5 릴리즈브랜치파고 알아서끝까지할수있지? 난 잘거라서" ("cut the 0.0.5 release branch, and you can take it to the end on your own, right? I'm going to sleep"), and to the question whether the run is agentic the orchestrator answered that it is. No batch was put to the owner, who was asleep; every row below is the orchestrator's, judged against the plugin's `skills/implement/orchestration.md` *Under agentic*.

- **Planning, framer:** the issue leaves open how the daemon learns that a pane's own session runs a stage, and when that stage counts as ended or dropped.
- **Implementation, crafter:** the chain command's signals, the daemon's state, the approval line and their cases.
- **Review, through the review chain:** a place that says the wrong stage, or never clears, is a defect a person acts on.
- **Automation, yes:** every question foreseen has a default the tree or the framer can give.
- **Branch:** cut from `release/v0.0.5` at `943b1bfd`; the pull request merges into `release/v0.0.5` by squash.
