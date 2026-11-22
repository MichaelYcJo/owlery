# Routing: 1795329619-timed-cases-race

| Axis | Answer |
|---|---|
| Review | through the review chain |
| Destination | open the pull request |
| Planning | the session |
| Implementation | crafter |
| Automation | yes |
| Branch | test/117-two-built-app-cases-race-a-timer |

Answered 2026-11-22 by the orchestrator, before the first edit.

## Why this way

The owner's words that hand the run over, in this session: "알아서 진행하고 완료되면 릴리즈까지알아서해" (2026-11-21) and "agentic으로 끝까지" (2026-11-22, releases 0.0.2 and 0.0.3), with the routing answer `agentic` chosen for release 0.0.2 in the session's question dialog on 2026-11-21. Under them the orchestrator decides what the tree and the issue leave to it; a question only the owner can answer is posted on the issue and parks this work item alone. Judged against the plugin's `skills/implement/orchestration.md` *Under agentic*. #117 is taken before the seal chain because its link card case turned five broad gates red during release 0.0.2, a recurrence the plugin gives a prevention home at once.

- **Planning, the session:** the issue's body and its section "Narrowed by #118, and what it holds" name the three cases, their failing lines and runs, and what *Done when* asks; no `frame/` is written.
- **Implementation, crafter:** an Opus crafter, the middle tier the owner set; the work is finding out on the owner's Mac and on GitHub's runner, and it may touch the app's renderer where the page is slower than it should be.
- **Review, through the review chain (raised 2026-11-22):** the route was first `straight to the PR`, for a change to three cases and what they wait on, and it said a change to the app's behaviour raises it. Phase 1 found evidence that the link card case failed under the person's own pointer (one posted mouse move reproduced it; no failing run was caught with a pointer moving), and changed how the app shows a window started in the background (`src/main/background.ts#showInBackground` ignores the mouse), so a proofer round reads the diff before the sealer.
- **Automation, yes:** the suite and the runner's `check` read it.
- **Branch:** the pull request merges into `release/v0.0.2` by squash.
