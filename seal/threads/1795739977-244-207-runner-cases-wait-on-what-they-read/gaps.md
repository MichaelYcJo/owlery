# Closing memo: 1795739977-244-207-runner-cases-wait-on-what-they-read

## Not verified

| Item | Who must answer |
|---|---|
| Whether first attempts of `check` on the hosted runner stop failing the removal case and the register case of `apps/desktop/test/work-item-menu.test.ts` | a measurement: the first attempts of later pull requests' `check`, as `frame/questions.md` Q1 states |
| The test files of the `app` project that no phase ran, each of which imports `apps/desktop/test/built-app.ts`, whose `click` and `until` phase 1 changed: `approval-line.test.ts`, `keep-awake.test.ts`, `launch.test.ts`, `pane-session.test.ts`, `records-dialog.test.ts`, `role-session.test.ts`, `screenshots.test.ts` and `seal-back-view.test.ts`. *The phase boundary* of each `trail/phases/phase-N.md` names the files its phase ran | the orchestrator's broad gate |
| The typecheck of the whole project: each phase typechecked the files it changed and some of the files that import them, as *The phase boundary* of its record names, and nothing else | the orchestrator's broad gate |
| Whether first attempts of `check` on the hosted runner stop failing a press of Create, of the form's Cancel or of the delete dialog's Cancel that phase 3 made wait. On this Mac the answer is drawn before each press either way, so the mutants that took a wait away survived | a measurement: the first attempts of later pull requests' `check`, as `frame/questions.md` Q1 states |
| Whether first attempts of `check` on the hosted runner stop failing the old-CLI case of `apps/desktop/test/role-bundle.test.ts`. On this Mac the case meets no read under way at the rewrite, so both of phase 2's mutants survived the case, and their red stands in phase 2's probe alone | a measurement: the first attempts of later pull requests' `check`, as `frame/questions.md` Q1 states |
| Whether a press on a disabled control raises a `pointerdown` in the page. Where it does not, a wait that fails after a `click` aimed at a disabled control says that no pointerdown of its press reached the page | a measurement: one probe of a click on a disabled button; phase 1's probe printed it and the reporter did not show the line |

## Not done

`apps/desktop/test/daemon-restart.test.ts` does not register *Scope* item 4's helper, since item 4 leaves out a file whose cases end the app, and its first describe's last case quits the app. A dialog that describe's first case leaves open when it fails does not reach the cases after it: the second case reloads the page (`apps/desktop/test/daemon-restart.test.ts:175`) before it reads the window, and the third runs after that reload. `trail/phases/phase-3.md` *Item 4, by file* gives each file's decision.
