# Gaps: 1795278987-built-apps-one-at-a-time

## Not verified

| Item | Who must answer |
|---|---|
| The `check` run on GitHub's macOS runner with the split. The runner has 3 cores, so it ran two files at once before; now the built-app files run alone there too, and the run takes longer | this pull request's `check` run |
| Whether the split removes the runner's first-start failures of #117 (the Open in submenu's pause, the worktree link case). Those failed with two files at once, not eight, and their cause is not measured | #117 |

## Not done

The split does not remove every failure of the link card case. The broad gate at `4227552`, with the built apps run one at a time, failed it at `terminal-basics.test.ts:608`: the card was gone after the four modifier keys were pressed and released, a check that waits on no timer of its own while the card's own timers run. That is the case's own race, not eight apps at once, and it goes to #117.


#117 is narrowed, in a section of its body, to the runner's first-start failures; the link card case on the owner's Mac, which its comment of 2026-11-22 added, is this issue's. The retry under `CI` stays with #117.
