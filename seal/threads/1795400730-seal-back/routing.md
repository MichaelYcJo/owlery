# Routing: 1795400730-seal-back

| Axis | Answer |
|---|---|
| Review | through the review chain |
| Destination | open the pull request |
| Planning | framer |
| Implementation | crafter |
| Automation | yes |
| Branch | feat/47-the-seal-has-no-back |

Answered 2026-11-23 by the orchestrator, before the first edit.

## Why this way

The owner's words that hand the run over: "알아서 진행하고 완료되면 릴리즈까지알아서해" (2026-11-21) and "agentic으로 끝까지" (2026-11-22, releases 0.0.2 and 0.0.3), with the routing answer `agentic` chosen for release 0.0.2 on 2026-11-21. On 2026-11-23 the owner asked for Fable framers, each crafter's model chosen by its issue's weight, and asked what could run in parallel. Judged against the plugin's `skills/implement/orchestration.md` *Under agentic*.

- **Planning, framer:** the issue leaves open how the back of the seal sets each round's defects beside each stage's cost, what the pull request body carries, and how a broken seal's back reads. It depends on #45 (`seal/threads/1795341001-cost-per-stage/` on branch `feat/45-the-daemon-keeps-no-cost-per-stage`, reviewed) for the ledger and on #44 (`seal/threads/1795396351-seal-breaks-after-a-commit/` on branch `feat/44-a-commit-after-the-seal-leaves-it-sealed`, framed) for the broken seal; #46 and #22 frame the work item's view and the summary beside it.
- **Implementation, crafter:** the back of the seal in the window, and the pull request body's part.
- **Review, through the review chain:** the back is where the seal shows whether it is worth its cost; a wrong number there misleads the person about the process itself.
- **Automation, yes:** the cases read committed round records and a ledger the fake adapter writes; no case starts a real `claude`.
- **Branch:** cut from `release/v0.0.2` at `629bfec`; the pull request merges into `release/v0.0.2` by squash, after #44's and #22's. The build waited for #41 to #44 to merge; all have, and the branch merged the release at `cad4a64`. #22 merged at `2737ceb`, and the branch merged the release again at `90184d5`, where the build starts.
