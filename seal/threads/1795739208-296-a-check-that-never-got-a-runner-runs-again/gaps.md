# Closing memo: 1795739208-296-a-check-that-never-got-a-runner-runs-again

## Not verified

| Item | Who must answer |
|---|---|
| The broad gate at the work item's last commit. The phase ran only `apps/desktop/test/rerun-unstarted.test.ts`, the one test file that reads a path the phase changed. | the orchestrator, at the broad gate |
| Scenario K: on GitHub, a never-started `check` job is queued again without a person. Whether GitHub accepts the rerun from the workflow's own token, and whether the end of the rerun attempt starts the workflow again, can be read only once the file stands on `main` (`frame/questions.md` Q1). | the orchestrator, from the first run of `rerun-unstarted` after a no-runner attempt once the release merges into `main`, as Q1 states |
| Scenario J: the workflow's trigger, its `if:`, its three permissions and the `env` that carries each value of the run. No case parses the file; a YAML reader parsed it once with no error. | the proofer, at review against the file |
| That `actions/checkout` and `actions/setup-node` at the pinned commits run in a `workflow_run` job on `ubuntu-latest`. No workflow can run before the file is on `main`. | the orchestrator, from that same first run |

## Not done

The command reads at most 100 jobs of an attempt and 100 annotations of a job, one page each, and pages no further. At `64d9cd6e`, `check` and `package` hold one job each, and of the five jobs whose annotations the fixtures hold, read on 2026-11-27, the one with the most has 11. A workflow with more jobs would need the reads paged, which is beyond the request.
