# Routing: 1795653550-150-the-persons-word-is-committed-in-time-and-retried

| Axis | Answer |
|---|---|
| Review | through the review chain |
| Destination | open the pull request |
| Planning | framer |
| Implementation | crafter |
| Automation | yes |
| Branch | fix/150-a-commit-of-the-persons-word-hangs-on-a-hook-and-is-never-retried |

Answered 2026-11-26 by the orchestrator, before the first edit.

## Why this way

On 2026-11-26 the owner asked what of release 0.0.6 could be brought into 0.0.5 while the other machine's work items wait for the night. The orchestrator proposed #246 and #150 under `agentic`, and the owner answered "가져와서 하자" ("let's bring them in and do them"). Both issues moved to milestone 0.0.5. Every row below is the orchestrator's, judged against the plugin's `skills/implement/orchestration.md` *Under agentic*.

- **Planning, framer:** the issue leaves the time limit, when the daemon retries, and what the line or the view says of a word not yet committed to the design.
- **Implementation, crafter:** the daemon's commit of the person's word, its retry, the window's words for it, and their cases.
- **Review, through the review chain:** a commit that hangs or is lost leaves the person's decision unrecorded, a defect nobody sees until the record is read.
- **Automation, yes:** no person's decision is open. The issue carries a hand check of a repository that signs its commits, which only the owner can run in the running app; it stays a check for the owner in `gaps.md` and changes nothing that is built.
- **Branch:** cut from `release/v0.0.5` at `9f9ba1da`; the pull request merges into `release/v0.0.5` by squash. The version already moved to 0.0.5, so this work item does not move it.
