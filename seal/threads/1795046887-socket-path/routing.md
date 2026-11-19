# Routing: 1795046887-socket-path

| Axis | Answer |
|---|---|
| Review | straight to the PR |
| Destination | open the pull request |
| Planning | framer |
| Implementation | crafter |
| Automation | yes |
| Branch | fix/19-the-daemon-dies-where-its-socket-path-is-too-long |

Answered 2026-11-19 by the orchestrator, before the first edit.

## Why this way

The owner answered the routing question `agentic` on 2026-11-19 for the release's remaining issues, and the same day asked that work which can run beside #18 run in parallel, on Fable ("병렬로 할만하거있으면 fable로 진행해"). Judged against the plugin's `skills/implement/orchestration.md` *Under agentic*.

- **Planning, framer:** the issue leaves the remedy open (a shorter socket path, or the window saying why the daemon did not start), and the choice touches where a socket readable by the user alone may live.
- **Implementation, crafter:** the owner's choice of Fable, and a builder on another model than the sealer's.
- **Review, straight to the PR:** the change is small and its defect shows at once as a daemon that does not start; the sealer's reading of the diff against the issue is the independent reading.
- **Automation, yes:** a run folder whose path is over the cap can be made in a test and in the built app with `--user-data-dir`.
- **Branch:** the pull request merges into `release/v0.0.1` (`docs/roadmap.md` *Releases and the tracker*). It runs beside #18, whose branch also touches `apps/desktop/src/main/main.ts`.
