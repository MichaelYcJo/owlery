# Routing: 1795338001-records-place-and-pr-check

| Axis | Answer |
|---|---|
| Review | through the review chain |
| Destination | open the pull request |
| Planning | framer |
| Implementation | crafter |
| Automation | yes |
| Branch | feat/40-connecting-a-repository-creates-no-records-place |

Answered 2026-11-22 by the orchestrator, before the first edit.

## Why this way

The owner's words that hand the run over, in this session: "알아서 진행하고 완료되면 릴리즈까지알아서해" (2026-11-21) and "agentic으로 끝까지" (2026-11-22, releases 0.0.2 and 0.0.3), with the routing answer `agentic` chosen for release 0.0.2 in the session's question dialog on 2026-11-21. Under them the orchestrator decides what the tree and the issue leave to it; a question that arises later is decided from the code and the policy and recorded as a decision; only what those cannot answer and the session cannot give itself parks this work item alone, and nothing is posted on an issue (the owner, 2026-11-22). Judged against the plugin's `skills/implement/orchestration.md` *Under agentic*. On 2026-11-21 the owner put #40 in the middle tier. On 2026-11-22 the orchestrator, on the owner's word, made a work item's records the one source of its decisions and questions, and the format of those blocks part of #40; the owner then said "fable로 고민해", so #40 moves to the core tier: a Fable framer and a Fable crafter, Opus proofer rounds and an Opus sealer. An Opus framer started first and was stopped before it committed anything; its draft is kept in the session's scratch for the Fable framer to read.

- **Planning, framer:** the issue leaves open what connecting writes and where, how the person reads it before it is committed, how an existing AgenticSeal root is kept, where the broad gate command lives, and whether AgenticSeal's check scripts are adapted or rewritten, which the issue asks to be written into `docs/architecture.md`.
- **Implementation, crafter:** the daemon's repository connection, the files it writes, and the window's confirmation.
- **Review, through the review chain:** the check this installs judges every later pull request of a connected repository.
- **Automation, yes:** a case connects a temporary repository and reads what it writes; the check runs on GitHub on this pull request.
- **Branch:** the pull request merges into `release/v0.0.2` by squash.
