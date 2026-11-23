# Closing memo: 1795457209-role-launch-bound

## Not verified

| Item | Who must answer |
|---|---|
| Whether the two cases fail where the adapter does not stop the CLI. Read, not run: the stand-in sleeps 30 seconds, so a run the adapter does not stop ends after the 10-second bound, as the case of #161 that this one follows has it | The sealer, reading the diff |
| Whether a load heavier than the broad gate's pushes either case past its new bound | The broad gate of each later work item of release 0.0.2, which runs the whole suite on the same machine |

## Not done

The cases that measure from a stop, not from the run's start (`claude-adapter.test.ts`, "stops a run: …" and "gives a stopped role run the same stop as a caller's: …"), keep `KILL_AFTER_MS`: they tell a CLI that ended at the signal from one that needed the kill, and none of them failed in the broad gates of 2026-11-23 and 2026-11-24.
