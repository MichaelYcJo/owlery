# Routing: 1795651594-249-251-delete-dialog-names-the-queue-and-keeps-its-scroll

| Axis | Answer |
|---|---|
| Review | through the review chain |
| Destination | open the pull request |
| Planning | framer |
| Implementation | crafter |
| Automation | yes |
| Branch | fix/249-251-the-delete-dialog-calls-a-queued-session-running-and-loses-its-scroll |

Answered 2026-11-26 by the orchestrator, before the first edit.

## Why this way

On 2026-11-26 the owner was asked whether #249 and #251, two defects of the delete dialog found by #214 and then in no milestone, join release 0.0.5 and run now, and whether as one work item or two. The owner chose "0.0.5에 넣고 한 항목으로" ("put them in 0.0.5, as one item"). The option said one item runs the broad gate and the sealer once rather than twice. The owner had answered "진행하자" ("let's go") to running this release's items under `agentic`, so every row below is the orchestrator's, judged against the plugin's `skills/implement/orchestration.md` *Under agentic*.

- **Planning, framer:** #249 leaves to the design what the dialogs say of a session that waits for the machine, and in which dialogs. #251 holds a paste-ready fix for the delete dialog in #214's round 1 record and only a direction for the repository's removal dialog.
- **Implementation, crafter:** the delete and removal dialogs' drawing in `renderer.ts`, the sessions list they show, and their cases, a built-app case among them.
- **Review, through the review chain:** both dialogs are what a person reads before they lose work.
- **Automation, yes:** no person's decision is open.
- **Branch:** cut from `release/v0.0.5` at `9f9ba1da`; the pull request merges into `release/v0.0.5` by squash. The version already moved to 0.0.5, so this work item does not move it.
