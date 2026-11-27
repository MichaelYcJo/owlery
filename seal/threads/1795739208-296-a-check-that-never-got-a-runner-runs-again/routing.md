# Routing: 1795739208-296-a-check-that-never-got-a-runner-runs-again

| Axis | Answer |
|---|---|
| Review | through the review chain |
| Destination | open the pull request |
| Planning | framer |
| Implementation | crafter |
| Automation | yes |
| Branch | chore/296-the-check-job-is-cancelled-unstarted-for-want-of-a-runner |

Answered 2026-11-27 by the orchestrator, before the first edit.

## Why this way

The `check` job of a pull request ends `cancelled` about 15 minutes after it is queued, with no runner and no step, when GitHub cannot place a `macos-latest` (arm64) job on a hosted runner; the job's annotations say so (#296, the comment of 2026-11-27). Each such attempt has been rerun by hand and has then passed, and each costs a sealed pull request another wait before it can merge. On 2026-11-27 the owner put #296 into release 0.1.0 ("0.1.0에 넣어"), for the same reason as the timed cases: the reruns cost more time than the fix.

- **Planning, framer:** the fix may be a workflow that reruns an attempt that never started, a change of the runner label, or both; each touches the repository's CI and its permissions, and the frame weighs them against what GitHub's documentation and the runs' records say.
- **Implementation, crafter.**
- **Review, through the review chain:** a rerun that also reruns a real failure, or loops without end, is the defect to rule out.
- **Automation, yes.**
- **Branch:** cut from `release/v0.1.0` at `e7737b7e` on 2026-11-27; the pull request merges into `release/v0.1.0` by squash.
