# Routing: 1795388700-review-rounds

| Axis | Answer |
|---|---|
| Review | through the review chain |
| Destination | open the pull request |
| Planning | framer |
| Implementation | crafter |
| Automation | yes |
| Branch | feat/41-the-daemon-cannot-run-review-rounds |

Answered 2026-11-23 by the orchestrator, before the first edit.

## Why this way

The owner's words that hand the run over: "알아서 진행하고 완료되면 릴리즈까지알아서해" (2026-11-21) and "agentic으로 끝까지" (2026-11-22, releases 0.0.2 and 0.0.3), with the routing answer `agentic` chosen for release 0.0.2 on 2026-11-21. On 2026-11-23 the owner said "진행하자" and asked for Fable framers on the review chain's issues (#41 to #44) and the screen issues (#46, #27, #22). The proofer rounds and the sealer run on Opus, as the release's other work items did. Judged against the plugin's `skills/implement/orchestration.md` *Under agentic*.

- **Planning, framer:** the issue leaves open how the daemon orders the rounds and the fix passes, how it asks the orchestrator agent whether the rounds converge, and where a stopped chain resumes from the records. #38's role bundle, #39's tools and #119's park answer much of it from the tree.
- **Implementation, crafter:** the daemon, the role adapter, the protocol and the work item's state.
- **Review, through the review chain:** this is the chain the product sells, and a defect in it stops every later work item's seal.
- **Automation, yes:** the issue's own test runs two rounds and one fix pass through the fake adapter; no case starts a real `claude`.
- **Branch:** the pull request merges into `release/v0.0.2` by squash.
