# Gaps: 1795278987-built-apps-one-at-a-time

## Not verified

| Item | Who must answer |
|---|---|
| closed The `check` run on GitHub's macOS runner with the split. The runner has 3 cores, so it ran two files at once before; now the built-app files run alone there too, and the run takes longer | answered: the `check` workflow passed on pull request #122 at the head it merged from |
| closed Whether the split removes the runner's first-start failures of #117 (the Open in submenu's pause, the worktree link case). Those failed with two files at once, not eight, and their cause is not measured | answered: work item 1795329619-timed-cases-race (pull request #125, issue #117), whose `check` run held the three cases on the runner after its own fix; the split alone was not what held them |

## Not done

The split does not remove every failure of the link card case. The broad gate at `4227552`, with the built apps run one at a time, failed it at `terminal-basics.test.ts:608`: the card was gone after the four modifier keys were pressed and released, a check that waits on no timer of its own while the card's own timers run. That is the case's own race, not eight apps at once, and it goes to #117.


#117 holds, in a section of its body decided by the orchestrator on 2026-11-22, the runner's first-start failures and the link card case's own race; this issue removes the cause of eight built apps at once. The retry under `CI` stays with #117.
