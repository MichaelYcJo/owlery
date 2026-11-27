# Routing: 1795739989-304-a-new-issue-is-placed-by-a-written-rule

| Axis | Answer |
|---|---|
| Review | through the review chain |
| Destination | open the pull request |
| Planning | framer |
| Implementation | crafter |
| Automation | yes |
| Branch | docs/304-a-new-issue-has-no-rule-that-places-it-in-a-milestone |

Answered 2026-11-27 by the orchestrator, before the first edit.

## Why this way

The roadmap names each milestone's goal and no rule that places a new issue, and after the public release people outside the repository open issues that arrive with no milestone (#304). On 2026-11-27 the owner asked whether the written rules let an issue be placed without asking, agreed that sorting stays with the repository's side, and put #304 into release 0.1.0 ("0.1.0에 넣자").

- **Planning, framer:** the issue states the rule's five steps; the frame places them in `docs/roadmap.md` *Releases and the tracker* and its Korean twin, and checks them against the milestones as the tracker holds them.
- **Implementation, crafter:** documents only.
- **Review, through the review chain.**
- **Automation, yes.**
- **Branch:** cut from `release/v0.1.0` at `e7737b7e` on 2026-11-27; the pull request merges into `release/v0.1.0` by squash.
