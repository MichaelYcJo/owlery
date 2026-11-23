# Closing memo: 1795396351-seal-breaks-after-a-commit

## Not verified

| Item | Who must answer |
|---|---|
| The whole suite, the repository-wide typecheck and the documents' checks of the `Broad gate` key, on the tree phase 1 leaves: phase 1 ran its own set alone (`trail/phases/phase-1.md`) | the orchestrator, at the broad gate |
| The built-app test files that load the daemon through the build and that phase 1's run did not start: every file of the `app` project but `daemon-restart.test.ts`, `get-a-seal.test.ts` and `role-bundle.test.ts` | the orchestrator, at the broad gate |
| Whether the 3-second bound of the case "reads a head of 10 round records within the interval of the daemon's read of the branches" holds while the broad gate's other suites load the machine: it took 612 ms on an idle machine, and issues #161 and #164 saw cases of the unit project run past 5 seconds under load | the orchestrator, at the broad gate |
| That `daemon.ts#readBranchNow` waits for the read of the branches under way, so an earlier head's reading does not land over the chain's: no case watches it, and `seal mutate` found the break unseen (`trail/phases/phase-1.md`) | the review chain's round 1, by reading |

## Not done

A work item whose base commit was never recorded gets no seal read: `daemon.ts#readBranch` returns before it reads anything for such a work item, as it did before this work, and only work items made before the base commit was recorded are such. Reading the seal for them would mean a second path into the read of a branch for a case no current build makes.
