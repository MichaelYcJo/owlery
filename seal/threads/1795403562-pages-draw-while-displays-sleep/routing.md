# Routing: 1795403562-pages-draw-while-displays-sleep

| Axis | Answer |
|---|---|
| Review | straight to the PR |
| Destination | open the pull request |
| Planning | the session |
| Implementation | the session |
| Automation | yes |
| Branch | test/164-two-theme-cases-fail |

Answered 2026-11-23 by the orchestrator, before the first edit.

## Why this way

The owner's words that hand the run over: "알아서 진행하고 완료되면 릴리즈까지알아서해" (2026-11-21) and "agentic으로 끝까지" (2026-11-22, releases 0.0.2 and 0.0.3). Judged against the plugin's `skills/implement/orchestration.md` *Under agentic*.

- **Planning, the session:** issue #164 states the failure and asks for its cause; the cause, once found, fixes the change at one place, the window a start in the background makes.
- **Implementation, the session:** the orchestrator had an agent of its own find the cause with probes and make the fix, one listener in `src/main/main.ts` and the doc comment of `src/main/background.ts`, both on the path a start with `OWLERY_BACKGROUND=1` alone takes.
- **Review, straight to the PR:** the change reaches no window a person starts, and the sealer's reading of the diff against the issue is the independent reading; the broad gate's passing run while the displays sleep is the change's own evidence.
- **Automation, yes:** nothing to ask.
- **Branch:** cut from `release/v0.0.2` at `29d7cb0`; the pull request merges into `release/v0.0.2` by squash, before #45's, since every work item's broad gate fails on the two cases while the displays sleep.
