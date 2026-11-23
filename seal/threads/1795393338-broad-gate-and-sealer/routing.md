# Routing: 1795393338-broad-gate-and-sealer

| Axis | Answer |
|---|---|
| Review | through the review chain |
| Destination | open the pull request |
| Planning | framer |
| Implementation | crafter |
| Automation | yes |
| Branch | feat/42-nothing-runs-the-broad-gate-or-asks-a-sealer |

Answered 2026-11-23 by the orchestrator, before the first edit.

## Why this way

The owner's words that hand the run over: "알아서 진행하고 완료되면 릴리즈까지알아서해" (2026-11-21) and "agentic으로 끝까지" (2026-11-22, releases 0.0.2 and 0.0.3), with the routing answer `agentic` chosen for release 0.0.2 on 2026-11-21. On 2026-11-23 the owner asked for Fable framers on the review chain's issues (#41 to #44), and for each crafter's model to be chosen by its issue's weight. Judged against the plugin's `skills/implement/orchestration.md` *Under agentic*.

- **Planning, framer:** the issue leaves open where the gate's command comes from and how its result is recorded, how the sealer's session is told which commit it seals, how the seal record names the building and the judging sessions, and how a failed gate reaches the inbox. #41's frame (`seal/threads/1795388700-review-rounds/frame/` on branch `feat/41-the-daemon-cannot-run-review-rounds`) defines the chain this work extends.
- **Implementation, crafter:** the daemon, the sealer's role session, the records and the inbox line.
- **Review, through the review chain:** the gate and the sealer are the invariants the seal rests on ("no seal without a broad gate at HEAD"), and a defect in either lets an unchecked commit carry a seal.
- **Automation, yes:** the issue's own test covers a passed gate, a failed gate and a refusing sealer through the fake adapter; no case starts a real `claude`.
- **Branch:** cut from `release/v0.0.2` at `41e8aa4`; the pull request merges into `release/v0.0.2` by squash, after #41's.
