# Routing: 1795396351-seal-breaks-after-a-commit

| Axis | Answer |
|---|---|
| Review | through the review chain |
| Destination | open the pull request |
| Planning | framer |
| Implementation | crafter |
| Automation | yes |
| Branch | feat/44-a-commit-after-the-seal-leaves-it-sealed |

Answered 2026-11-23 by the orchestrator, before the first edit.

## Why this way

The owner's words that hand the run over: "알아서 진행하고 완료되면 릴리즈까지알아서해" (2026-11-21) and "agentic으로 끝까지" (2026-11-22, releases 0.0.2 and 0.0.3), with the routing answer `agentic` chosen for release 0.0.2 on 2026-11-21. On 2026-11-23 the owner asked for Fable framers on the review chain's issues (#41 to #44), and for each crafter's model to be chosen by its issue's weight. Judged against the plugin's `skills/implement/orchestration.md` *Under agentic*.

- **Planning, framer:** the issue leaves open how the daemon compares a branch's head with the commit the newest verdict names, which commits after the seal break it and which do not, how a broken seal reaches the pull request's check, and how the state is read again after a restart. #42's frame (`seal/threads/1795393338-broad-gate-and-sealer/frame/` on branch `feat/42-nothing-runs-the-broad-gate-or-asks-a-sealer`) defines the verdict, and #43's (`seal/threads/1795395059-pull-request-and-seal-check/frame/` on branch `feat/43-a-sealed-branch-opens-no-pull-request`) the pull request and its seal check.
- **Implementation, crafter:** the daemon's reading of the seal at the branch's head, the protocol, the inbox line and its notification, and the check.
- **Review, through the review chain:** this is the promise that a seal binds one commit; a defect shows a seal as holding on a tree it never judged.
- **Automation, yes:** the cases commit to temporary repositories and read the line; no case reaches GitHub or starts a real `claude`.
- **Branch:** cut from `release/v0.0.2` at `41e8aa4`; the pull request merges into `release/v0.0.2` by squash, after #43's.
