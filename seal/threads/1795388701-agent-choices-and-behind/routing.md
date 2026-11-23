# Routing: 1795388701-agent-choices-and-behind

| Axis | Answer |
|---|---|
| Review | through the review chain |
| Destination | open the pull request |
| Planning | framer |
| Implementation | crafter |
| Automation | yes |
| Branch | feat/27-the-inbox-cannot-say-what-the-agent-asks |

Answered 2026-11-23 by the orchestrator, before the first edit.

## Why this way

The owner's words that hand the run over: "알아서 진행하고 완료되면 릴리즈까지알아서해" (2026-11-21) and "agentic으로 끝까지" (2026-11-22, releases 0.0.2 and 0.0.3), with the routing answer `agentic` chosen for release 0.0.2 on 2026-11-21. On 2026-11-23 the owner said "진행하자" and asked for Fable framers on the screen issues (#46, #27, #22). The sealer runs on Opus, as the release's other work items did. Judged against the plugin's `skills/implement/orchestration.md` *Under agentic*.

- **Planning, framer:** the issue leaves open which field of a hook's payload carries the choices an agent offers, and how the daemon counts the commits a branch is behind its base without asking a remote.
- **Implementation, crafter:** the daemon's reading of the payload and of git, the protocol and the window's preview.
- **Review, through the review chain, raised from straight to the PR on 2026-11-23** (`frame/plan.md` *Judgments of the run*). The first answer stood on two grounds: the change adds two read values and their display, so a defect would show at once in the cases or on screen, and the sealer's reading of the diff against the issue would be the independent reading. Round 1 found a sentence the card draws that no case read (`trail/rounds/round-1.md` finding 1), so the first ground did not hold, and the review chain reads the diff.
- **Automation, yes:** the cases inject hook payloads and read temporary repositories; no case starts a real `claude`.
- **Branch:** the pull request merges into `release/v0.0.2` by squash.
