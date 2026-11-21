# Routing: 1795268972-headless-failure-and-limit

| Axis | Answer |
|---|---|
| Review | straight to the PR |
| Destination | open the pull request |
| Planning | framer |
| Implementation | crafter |
| Automation | yes |
| Branch | fix/26-a-failed-headless-session-says-nothing |

Answered 2026-11-21 by the orchestrator, before the first edit.

## Why this way

On 2026-11-21 the owner answered the routing question `agentic` for release 0.0.2, put #26 in the middle tier (an Opus framer, an Opus crafter, an Opus sealer), asked that usage be kept down, and asked that what can run in parallel does. Judged against the plugin's `skills/implement/orchestration.md` *Under agentic*.

- **Planning, framer:** the issue leaves open how much of the error stream is kept, what the run's limit is and where it is stated, which client message ends a run, how long the daemon waits before it kills a process that ignores the signal, and how many finished sessions it keeps. The tree answers most of these, and a framer reads it. The milestone's role sessions (#38 on) run on this adapter, so the frame names what they will read.
- **Implementation, crafter:** the work touches the headless adapter, the daemon's session list and the protocol, with their cases.
- **Review, straight to the PR:** the change bounds an existing adapter, and the sealer reads the diff against the issue. Where the diff reaches what these grounds do not name, the route is raised to the review chain.
- **Automation, yes:** a fake CLI the cases start prints to its error stream, ignores a signal and never finishes.
- **Branch:** the pull request merges into `release/v0.0.2` (`docs/roadmap.md` *Releases and the tracker*), by squash. It runs beside #30 and #28, cut from `dc82f88`; #30 carries the release's version move, so this work item moves no version.
