# Routing: 1795342001-progress-through-roles

| Axis | Answer |
|---|---|
| Review | through the review chain |
| Destination | open the pull request |
| Planning | framer |
| Implementation | crafter |
| Automation | yes |
| Branch | feat/46-a-work-item-view-shows-no-progress-through-roles |

Answered 2026-11-23 by the orchestrator, before the first edit.

## Why this way

The owner's words that hand the run over: "알아서 진행하고 완료되면 릴리즈까지알아서해" (2026-11-21) and "agentic으로 끝까지" (2026-11-22, releases 0.0.2 and 0.0.3), with the routing answer `agentic` chosen for release 0.0.2 on 2026-11-21. On 2026-11-23 the owner said "진행하자" and asked for Fable framers on the screen issues (#46, #27, #22). The proofer rounds and the sealer run on Opus, as the release's other work items did. Judged against the plugin's `skills/implement/orchestration.md` *Under agentic*.

This work item's id is the one #46's comment of 2026-11-22 names. A session that is no longer running framed it then, and pushed nothing, so no file of that frame stands; this framer starts again from the issue and its comments, and from the comments that frame left on #47 and #22.

- **Planning, framer:** the issue leaves open what progress the daemon sends, how the approval line draws each stage, and whether a role session's own screen opens from the line in this release. The design system of #130 and the artboards #22 names answer the look.
- **Implementation, crafter:** the protocol, the daemon's progress and the window's view and inbox line.
- **Review, through the review chain:** the line is how the person reads the chain at all, and it is drawn beside #41's stages, which are built at the same time.
- **Automation, yes:** a stand-in script for the CLI holds the stages in the built app's cases and in the screenshot run, and no fake adapter drives them. The window is read through the debugging port of an app started under `OWLERY_BACKGROUND=1`.
- **Branch:** the pull request merges into `release/v0.0.2` by squash.
