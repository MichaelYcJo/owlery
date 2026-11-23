# Routing: 1795395059-pull-request-and-seal-check

| Axis | Answer |
|---|---|
| Review | through the review chain |
| Destination | open the pull request |
| Planning | framer |
| Implementation | crafter |
| Automation | yes |
| Branch | feat/43-a-sealed-branch-opens-no-pull-request |

Answered 2026-11-23 by the orchestrator, before the first edit.

## Why this way

The owner's words that hand the run over: "알아서 진행하고 완료되면 릴리즈까지알아서해" (2026-11-21) and "agentic으로 끝까지" (2026-11-22, releases 0.0.2 and 0.0.3), with the routing answer `agentic` chosen for release 0.0.2 on 2026-11-21. On 2026-11-23 the owner asked for Fable framers on the review chain's issues (#41 to #44), and for each crafter's model to be chosen by its issue's weight. Judged against the plugin's `skills/implement/orchestration.md` *Under agentic*.

- **Planning, framer:** the issue leaves open how the daemon composes the pull request body from the records, how it pushes and opens the pull request through the user's `gh`, how the seal reaches GitHub as a check, and how the daemon waits on the pull request's checks with no agent running. #42's frame (`seal/threads/1795393338-broad-gate-and-sealer/frame/` on branch `feat/42-nothing-runs-the-broad-gate-or-asks-a-sealer`) defines the verdict this work carries to GitHub.
- **Implementation, crafter:** the daemon's path to GitHub, the seal check, the inbox line and the README.
- **Review, through the review chain:** this is the fourth invariant ("no PR without a seal"), and a defect lets a branch reach a pull request without a seal or shows a seal GitHub does not hold.
- **Automation, yes:** the cases run against a stand-in `gh` and a local bare remote; no case reaches GitHub or starts a real `claude`.
- **Branch:** cut from `release/v0.0.2` at `41e8aa4`; the pull request merges into `release/v0.0.2` by squash, after #42's.
