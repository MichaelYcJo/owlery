# Routing: 1795339000-sessions-outlive-the-daemon

| Axis | Answer |
|---|---|
| Review | straight to the PR |
| Destination | open the pull request |
| Planning | framer |
| Implementation | the session |
| Automation | yes |
| Branch | docs/36-a-session-ends-with-the-daemon |

Answered 2026-11-22 by the orchestrator, before the first edit.

## Why this way

The owner's words that hand the run over, in this session: "알아서 진행하고 완료되면 릴리즈까지알아서해" (2026-11-21) and "agentic으로 끝까지" (2026-11-22, releases 0.0.2 and 0.0.3), with the routing answer `agentic` chosen for release 0.0.2 in the session's question dialog on 2026-11-21. Under them the orchestrator decides from the code and the policy what the tree and the issue leave to it, and records each decision; nothing waits for the owner. Judged against the plugin's `skills/implement/orchestration.md` *Under agentic*.

- **Planning, framer:** a Fable framer writes the study the issue asks for, as the issue says ("The study runs on Fable"), comparing the ways for Owlery and recommending one combination. On 2026-11-22 the owner decided the orchestrator adopts the study's recommendation and opens its issues.
- **Implementation, the session:** this work item builds no code: its pull request holds the study's text in `docs/architecture.md` where the policy places it (both languages), and the orchestrator opens one issue for each part the recommendation names.
- **Review, straight to the PR:** a study and its issues; the sealer reads it against the issue.
- **Branch:** the pull request merges into `release/v0.0.2` by squash.
