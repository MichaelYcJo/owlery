# Routing: 1795673153-133-an-idle-daemon-of-another-build-is-replaced

| Axis | Answer |
|---|---|
| Review | through the review chain |
| Destination | open the pull request |
| Planning | framer |
| Implementation | crafter |
| Automation | yes |
| Branch | feat/133-a-daemon-of-another-build-stays-on-release |

Answered 2026-11-26 by the orchestrator, before the first edit.

## Why this way

On 2026-11-26 the owner set the first public release, 0.1.0, for 2026-11-28: a Mac download from the site, to run Owlery publicly from 2026-11-29. The owner moved the walk release, which was 0.0.5, into 0.1.0, and asked to start the launch's remaining work in parallel the same evening ("지금 병렬로 하면 어때"). The milestones were renumbered that evening: `release: 0.1.0` holds the launch, and milestones 3 to 5 follow as 0.1.2 to 0.1.5. Every row below is the orchestrator's, judged against the plugin's `skills/implement/orchestration.md` *Under agentic*. No real `claude` session runs in this work item unless its frame names one in `frame/questions.md` with a default.

- **Planning, framer:** the issue leaves how the window tells a daemon that runs nothing, how the replacement runs without a question, what a kept daemon of another build answers to a request it does not know, and the record of how a daemon ended, to the frame.
- **Implementation, crafter:** the window's load against a daemon of another build, the replacement, the answer to an unknown request, and the record, with their cases.
- **Review, through the review chain:** a replacement ends a process every window and pane depends on.
- **Automation, yes:** the owner answered the launch's scope in conversation; every other choice has a default the tree or the framer can give.
- **Branch:** cut from `release/v0.0.5` at `e9fe914c`, pushed by the owner from another machine; the pull request merges into `release/v0.0.5` by squash. On 2026-11-26 the owner first had #215, #216, #133 and #278 ride one pull request ("CI를 계속돌리는건 너무 비효율적인데"), and this work was built on that branch (it merged #215's and #216's branches at `70c9dae1` and `bec979e2`'s line); the review chain's check seals one work item per pull request, so the owner chose to split them ("C"), and that branch became this work's, fast-forward from the owner's push. #133 merges after #216, whose refresh its phase 2 builds on.


**Branch, 2026-11-27:** the work moved to `feat/133-a-daemon-of-another-build-stays-on-release`, cut from `release/v0.0.5` at `57449b14` and carrying the work as one commit (`e651d395`). The branch it was built on (`feat/133-a-daemon-of-another-build-stays-until-a-person-restarts-it`, `9215cd24`) holds commits of #215 and #216 from the combined branch, whose `Seal-Routing` trailers the review chain's check refuses in a pull request that judges #133 alone; that branch is kept as it was.