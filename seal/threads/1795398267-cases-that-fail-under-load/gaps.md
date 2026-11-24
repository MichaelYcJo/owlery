# Closing memo: 1795398267-cases-that-fail-under-load

## Not verified

| Item | Who must answer |
|---|---|
| closed Whether a load heavier than the one measured (load average about 6, several agents and suites beside the run) still pushes either case past its new bound | re-homed to issue #168, under "Rows carried here by the settle of release 0.0.2" |

## Not done

Other cases that start processes and keep vitest's 5-second default were not given more time: none of them failed in the three whole-suite runs measured on 2026-11-23, and a bound raised where nothing failed hides a slow case rather than fixing one.
