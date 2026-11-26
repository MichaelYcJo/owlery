# Routing: 1795673152-188-a-turn-ended-on-an-api-error-stops-working

| Axis | Answer |
|---|---|
| Review | through the review chain |
| Destination | open the pull request |
| Planning | framer |
| Implementation | crafter |
| Automation | yes |
| Branch | fix/188-a-turn-that-ends-on-an-api-error-leaves-its-session-working |

Answered 2026-11-26 by the orchestrator, before the first edit.

## Why this way

On 2026-11-26 the owner set the first public release, 0.1.0, for 2026-11-28: a Mac download from the site, to run Owlery publicly from 2026-11-29. The owner moved the walk release, which was 0.0.5, into 0.1.0, and asked to start the launch's remaining work in parallel the same evening ("지금 병렬로 하면 어때"). The milestones were renumbered that evening: `release: 0.1.0` holds the launch, and milestones 3 to 5 follow as 0.1.2 to 0.1.5. Every row below is the orchestrator's, judged against the plugin's `skills/implement/orchestration.md` *Under agentic*. No real `claude` session runs in this work item unless its frame names one in `frame/questions.md` with a default.

- **Planning, framer:** the issue leaves how the daemon reads `StopFailure` beside `Stop`, and where the event's shape comes from when no real API error can be made on demand, to the frame.
- **Implementation, crafter:** the daemon's state of a session after the event, and its cases.
- **Review, through the review chain:** a session's state drives the inbox, the view and the pane's foot of every work item.
- **Automation, yes:** the owner answered the launch's scope in conversation; every other choice has a default the tree or the framer can give.
- **Branch:** cut from `release/v0.0.5` at `e9fe914c`, the branch of release 0.1.0, whose name stays until the release's own step; the pull request merges into it by squash. The version moves to 0.1.0 in the release's own work item, not here.
