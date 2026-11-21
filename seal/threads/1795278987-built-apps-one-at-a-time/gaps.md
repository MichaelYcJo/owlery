# Gaps: 1795278987-built-apps-one-at-a-time

## Not verified

| Item | Who must answer |
|---|---|
| The `check` run on GitHub's macOS runner with the split. The runner has 3 cores, so it ran two files at once before; now the built-app files run alone there too, and the run takes longer | this pull request's `check` run |
| Whether the split removes the runner's first-start failures of #117 (the Open in submenu's pause, the worktree link case). Those failed with two files at once, not eight, and their cause is not measured | #117 |

## Not done

#117 stays open for the runner's first-start failures; the retry under `CI` stays with it.
