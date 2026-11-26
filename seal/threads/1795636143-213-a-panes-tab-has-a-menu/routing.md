# Routing: 1795636143-213-a-panes-tab-has-a-menu

| Axis | Answer |
|---|---|
| Review | through the review chain |
| Destination | open the pull request |
| Planning | framer |
| Implementation | crafter |
| Automation | yes |
| Branch | feat/213-a-panes-tab-has-no-menu |

Answered 2026-11-26 by the orchestrator, before the first edit.

## Why this way

On 2026-11-25 the owner cut release 0.0.5 to the orchestrator in these words: "0.0.5 릴리즈브랜치파고 알아서끝까지할수있지? 난 잘거라서" ("cut the 0.0.5 release branch, and you can take it to the end on your own, right? I'm going to sleep"), and to the question whether the run is agentic the orchestrator answered that it is. No batch was put to the owner, who was asleep; every row below is the orchestrator's, judged against the plugin's `skills/implement/orchestration.md` *Under agentic*.

- **Planning, framer:** the issue leaves open which entries the tab's menu holds, and how a tab's name and colour are kept.
- **Implementation, crafter:** the tab's menu, its entries, what the daemon keeps of them, and their cases.
- **Review, through the review chain:** a menu entry that closes more panes than the person meant loses their sessions.
- **Automation, yes:** every question foreseen has a default the tree or the framer can give.
- **Branch:** cut from `release/v0.0.5` at `943b1bfd`; the pull request merges into `release/v0.0.5` by squash.
