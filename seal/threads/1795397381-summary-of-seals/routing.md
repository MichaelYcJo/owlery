# Routing: 1795397381-summary-of-seals

| Axis | Answer |
|---|---|
| Review | through the review chain |
| Destination | open the pull request |
| Planning | framer |
| Implementation | crafter |
| Automation | yes |
| Branch | feat/22-the-summary-says-nothing-of-seals |

Answered 2026-11-23 by the orchestrator, before the first edit.

## Why this way

The owner's words that hand the run over: "알아서 진행하고 완료되면 릴리즈까지알아서해" (2026-11-21) and "agentic으로 끝까지" (2026-11-22, releases 0.0.2 and 0.0.3), with the routing answer `agentic` chosen for release 0.0.2 on 2026-11-21. On 2026-11-23 the owner asked for Fable framers on the screen issues (#46, #27, #22), and for each crafter's model to be chosen by its issue's weight. Judged against the plugin's `skills/implement/orchestration.md` *Under agentic*.

- **Planning, framer:** the issue leaves open what counts as a change to sealed or broken since the last look, how the summary leads with sealed and broken work items, and the rows the settle of release 0.0.1 carried here: which of the window's events carries a look, and when the summary opens. #44's frame (`seal/threads/1795396351-seal-breaks-after-a-commit/frame/` on branch `feat/44-a-commit-after-the-seal-leaves-it-sealed`) defines the states `sealed` and `broken` this work reads.
- **Implementation, crafter:** the daemon's look, the summary screen and its lines.
- **Review, through the review chain:** the summary is the first thing a person who comes back reads, and it states what was sealed; a defect there says sealed of a work item whose seal broke.
- **Automation, yes:** the cases feed the daemon's look and read the summary; no case reaches GitHub or starts a real `claude`.
- **Branch:** cut from `release/v0.0.2` at `41e8aa4`; the branch merged `release/v0.0.2` at `099e086`; the pull request merges into `release/v0.0.2` by squash, after #44's.
