# Routing: 1795610687-235-stage-prompts-name-the-worktree

| Axis | Answer |
|---|---|
| Review | through the review chain |
| Destination | open the pull request |
| Planning | framer |
| Implementation | crafter |
| Automation | yes |
| Branch | fix/235-a-stage-prompt-says-this-folder-and-reviews-another-worktree |

Answered 2026-11-25 by the orchestrator, before the first edit.

## Why this way

On 2026-11-25 the owner cut release 0.0.5 to the orchestrator in these words: "0.0.5 릴리즈브랜치파고 알아서끝까지할수있지? 난 잘거라서" ("cut the 0.0.5 release branch, and you can take it to the end on your own, right? I'm going to sleep"), and to the question whether the run is agentic the orchestrator answered that it is. No batch was put to the owner, who was asleep; every row below is the orchestrator's, judged against the plugin's `skills/implement/orchestration.md` *Under agentic*.

- **Planning, framer:** the issue leaves open whether a stage prompt names the worktree by its absolute path or refuses a session started in another worktree.
- **Implementation, crafter:** the chain's stage prompts and their cases.
- **Review, through the review chain:** the prompts are text a role session reads and acts on, so a defect shows as an agent that reviews the wrong tree in a later run.
- **Automation, yes:** every question foreseen has a default the tree can give; a real `claude` pane run that would show a permission question is left to the owner's walk (#184), and recorded as not verified.
- **Branch:** cut from `release/v0.0.5` at `ab7a5730`; the pull request merges into `release/v0.0.5` by squash.
