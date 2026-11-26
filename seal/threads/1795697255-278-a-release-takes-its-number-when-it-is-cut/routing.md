# Routing: 1795697255-278-a-release-takes-its-number-when-it-is-cut

| Axis | Answer |
|---|---|
| Review | through the review chain |
| Destination | open the pull request |
| Planning | framer |
| Implementation | crafter |
| Automation | yes |
| Branch | docs/278-the-roadmap-fixes-each-releases-number-when-its-milestone-opens |

Answered 2026-11-26 by the orchestrator, before the first edit.

## Why this way

The owner decided the versioning rules in the conversation of 2026-11-26 ("그렇게하자", to the orchestrator's proposal after reading how Orca and Paseo number their releases); issue #278 holds the six decisions word for word. The frame writes them as the roadmap's rule changes; the crafter writes them into both editions of `docs/roadmap.md`, and of `docs/architecture.md`, `docs/product.md` and `README.md` where they name a version by the old rule.

- **Planning, framer:** the rules touch every place the roadmap names a version (the release table, *Releases and the tracker*, the rejected alternatives, *Later versions*), which the framer enumerates.
- **Implementation, crafter:** documents only, in two editions whose headings and table rows must match.
- **Review, through the review chain:** a rule left half-rewritten contradicts itself and the tracker.
- **Automation, yes:** the owner gave the decisions; nothing is left to ask.
- **Branch:** cut from `release/v0.0.5` at `f683c693`. The owner's decision to run CI once ("CI를 계속돌리는건 너무 비효율적인데") first had it ride the combined pull request of #215, #216 and #133; the review chain's check seals one work item per pull request, so it opens its own pull request.
