# Routing: 1795764399-321-the-held-session-is-held-again

| Axis | Answer |
|---|---|
| Review | through the review chain |
| Destination | open the pull request |
| Implementation | crafter |
| Automation | yes |
| Branch | test/321-the-count-of-working-agents-misses-one |

Answered 2026-11-27 by the orchestrator, before the first edit.

## Why this way

Issue #321: a case of the daemon suite counts one working agent where it holds two, on the hosted runner and on this Mac, since the release took #127's work item. A crafter's diagnosis, run once through the lock, found the cause in the case: since #127 the daemon appends the scratch folder's paragraph to a proofer's prompt, and the case's fake adapter holds the session only where the prompt equals "Held" whole, so the session ends at once and the count reads it as ended or not by a race with the test client's poll.

- **Planning, no row:** the fix is one comparison of a test's fake adapter, a test that pins what already holds, which the ladder of `skills/implement/orchestration.md` *Orchestrator: when a work item is required* places on its second rung; the closing memo's scope line stands for the plan.
- **Implementation, crafter.**
- **Review, through the review chain.**
- **Automation, yes.**
- **Branch:** cut from the release branch on 2026-11-27, after the merge of #320; the pull request merges into the release branch by squash, before the work item of #318.
