# Routing: 1795042041-headless-session

| Axis | Answer |
|---|---|
| Review | straight to the PR |
| Destination | open the pull request |
| Planning | the session |
| Implementation | crafter |
| Automation | yes |
| Branch | feat/8-the-daemon-launches-no-headless-session |

Answered 2026-11-19 by the orchestrator, before the first edit.

## Why this way

The owner answered the routing question `agentic` on 2026-11-19 for issues #8, #9 and #10 in turn, chose the answer that keeps the crafter on Fable as in #6 and #7, and had this session merge #17 so that #8 starts from the inbox's daemon. Judged against the plugin's `skills/implement/orchestration.md` *Under agentic*.

- **Planning, the session:** issue #8 fixes what is built, and `docs/architecture.md` *Authentication of the Claude adapter*, *Role sessions run detached from the user's environment* and *Rules that keep it portable* fix the flags, the environment and the two adapters; the frame records the few choices left (the protocol messages, where the session runs, how the window asks).
- **Implementation, crafter:** the owner's choice of Fable, and a builder on another model than the sealer's.
- **Review, straight to the PR:** the sealer's reading of the diff against the issue is the independent reading.
- **Automation, yes:** both done-when lines can be driven by the crafter itself: the fake adapter in the suite, and the user's `claude` asked one short prompt by the built app.
- **Branch:** the pull request merges into `release/v0.0.1` (`docs/roadmap.md` *Releases and the tracker*).
