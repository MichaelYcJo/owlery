# Routing: 1795613754-245-scenario-i-holds-pages-that-stay-resident

| Axis | Answer |
|---|---|
| Review | straight to the PR |
| Destination | open the pull request |
| Implementation | the session |
| Automation | yes |
| Branch | test/245-heavy-run-scenario-i-waits-on-a-reading-memory-pressure-never-gives |

Answered 2026-11-25 by the orchestrator, before the first edit.

## Why this way

On 2026-11-25 the owner cut release 0.0.5 to the orchestrator in these words: "0.0.5 릴리즈브랜치파고 알아서끝까지할수있지? 난 잘거라서" ("cut the 0.0.5 release branch, and you can take it to the end on your own, right? I'm going to sleep"), and to the question whether the run is agentic the orchestrator answered that it is. No batch was put to the owner, who was asleep; every row below is the orchestrator's, judged against the plugin's `skills/implement/orchestration.md` *Under agentic*.

- **No Planning row:** the issue names the case, the cause and the fix's shape, so no frame is called for.
- **Implementation, the session:** one shell command inside one case.
- **Review, straight to the PR:** the change alters what the case's child does and nothing the app does, and the sealer's single reading of the diff against the issue is enough.
- **Automation, yes:** no person's decision is open.
- **Branch:** cut from `release/v0.0.5` at `ab7a5730`; the pull request merges into `release/v0.0.5` by squash. The orchestrator filed the issue on 2026-11-25 in release 0.0.8 and moved it into 0.0.5 the same night, because the case failed the broad gate of #237 twice under the machine's memory pressure and would fail every broad gate of the release the same way. So this work item merges first and carries the version move to 0.0.5 (`docs/roadmap.md` *Releases and the tracker*), which #237 gives up.
