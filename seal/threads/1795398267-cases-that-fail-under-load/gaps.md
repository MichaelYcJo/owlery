# Closing memo: 1795398267-cases-that-fail-under-load

## Not verified

| Item | Who must answer |
|---|---|
| Whether a load heavier than the one measured (load average about 6, several agents and suites beside the run) still pushes either case past its new bound | The broad gate of each later work item of release 0.0.2, which runs the whole suite on the same machine |

## Not done

Other cases that start processes and keep vitest's 5-second default were not given more time: none of them failed in the three whole-suite runs measured on 2026-11-23, and a bound raised where nothing failed hides a slow case rather than fixing one.
