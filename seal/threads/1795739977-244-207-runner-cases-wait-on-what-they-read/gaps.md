# Closing memo: 1795739977-244-207-runner-cases-wait-on-what-they-read

## Not verified

| Item | Who must answer |
|---|---|
| Whether first attempts of `check` on the hosted runner stop failing the removal case and the register case of `apps/desktop/test/work-item-menu.test.ts` | a measurement: the first attempts of later pull requests' `check`, as `frame/questions.md` Q1 states |
| The test files of the `app` project other than `work-item-menu.test.ts`, each of which imports `apps/desktop/test/built-app.ts`, whose `click` and `until` phase 1 changed: none was run in phase 1 | the orchestrator's broad gate |
| The typecheck of the whole project: phase 1 typechecked `built-app.ts` and `work-item-menu.test.ts` and the files they import, and nothing else | the orchestrator's broad gate |
| Whether a press on a disabled control raises a `pointerdown` in the page. Where it does not, a wait that fails after a `click` aimed at a disabled control says that no pointerdown of its press reached the page | a measurement: one probe of a click on a disabled button; phase 1's probe printed it and the reporter did not show the line |

## Not done

*Scope* item 4 asks each test file of the `app` project whose cases share one started app and open a dialog or a menu to register the helper. Phase 1 registers it in `apps/desktop/test/work-item-menu.test.ts` alone, because the spawn of phase 1 named that file and `built-app.ts` as the phase's files. The other files are left to phase 3, whose *Verified by* cell already runs each file that registers the helper. `trail/phases/phase-1.md` lists the files a search found, which phase 3 reads whole before it registers the hook.
