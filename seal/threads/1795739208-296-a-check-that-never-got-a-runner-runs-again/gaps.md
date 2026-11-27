# Closing memo: 1795739208-296-a-check-that-never-got-a-runner-runs-again

## Not verified

| Item | Who must answer |
|---|---|
| closed The broad gate at the work item's last commit. The phase ran only `apps/desktop/test/rerun-unstarted.test.ts`, the one test file that reads a path the phase changed. | answered: the broad gate's run at `770797c8` (`trail/gate.md`), after which only this work item's records changed to the pull request's head (`git diff --name-only`); the `check` run of #316, run 45945876836, passed |
| closed Scenario K: on GitHub, a never-started `check` job is queued again without a person. Whether GitHub accepts the rerun from the workflow's own token, and whether the end of the rerun attempt starts the workflow again, can be read only once the file stands on `main` (`frame/questions.md` Q1). | re-homed to issue #336, opened by the settle of 2026-11-27, since the workflow can run only once the release merges into `main` |
| closed Scenario J: the workflow's trigger, its `if:`, its three permissions and the `env` that carries each value of the run. No case parses the file; a YAML reader parsed it once with no error. | answered: review round 1 read the trigger, the `if:`, the three permissions and the `env` against the file (`trail/rounds/round-1.md:138` and `:142`) |
| closed That `actions/checkout` and `actions/setup-node` at the pinned commits run in a `workflow_run` job on `ubuntu-latest`. No workflow can run before the file is on `main`. | re-homed to issue #336, opened by the settle of 2026-11-27, with the row above |

## Not done

The command reads at most 100 jobs of an attempt and 100 annotations of a job, one page each, and pages no further. At `64d9cd6e`, `check` and `package` hold one job each, and of the five jobs whose annotations the fixtures hold, read on 2026-11-27, the one with the most has 11. A workflow with more jobs would need the reads paged, which is beyond the request.
