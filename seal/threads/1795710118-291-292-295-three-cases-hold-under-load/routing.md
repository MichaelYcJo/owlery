# Routing: 1795710118-291-292-295-three-cases-hold-under-load

| Axis | Answer |
|---|---|
| Review | through the review chain |
| Destination | open the pull request |
| Planning | the session |
| Implementation | crafter |
| Automation | yes |
| Branch | test/291-292-295-three-cases-fail-under-load-on-the-runner |

Answered 2026-11-27 by the orchestrator, before the first edit.

## Why this way

Three cases of the desktop suite fail under load, on this Mac's broad gates and on GitHub's runner, and each failure has blocked a sealed pull request of release 0.0.5 at its `check` job: #291 (`daemon.test.ts`, a count of git calls 100 ms after a close), #292 (`daemon.test.ts`, a worktree read while a work item takes up its branch) and #295 (`chain.test.ts`, one case that runs fourteen sealed chains in series near its 60-second limit). The owner delegated the release and asked to land as much as possible before Sunday 2026-11-29; four sealed or nearly sealed pull requests wait behind these cases.

- **Planning, the session:** each issue states its cause, read from the code, and its *Done when*; the fix is a test's wait or split, with no product change. The orchestrator writes a short frame from the three issues (`frame/design.md`, `frame/plan.md`, one phase). Should a fix need a product change, the crafter stops and says so.
- **Implementation, crafter:** three test cases in two files.
- **Review, through the review chain:** a fix that makes a case pass by asserting less is the defect to catch.
- **Automation, yes.**
- **Branch:** cut from `release/v0.0.5` at `c80b900a`; it merges first among the waiting items, so the others' `check` jobs pass.
