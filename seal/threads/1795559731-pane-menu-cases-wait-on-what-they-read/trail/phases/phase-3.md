# Phase 3: 1795559731-pane-menu-cases-wait-on-what-they-read

## What this phase found

**The version's move rewrites `.github/workflows/owlery-seal.yml` as well, which the frame does not name.** `frame/design.md` *Grounding* reads the move to 0.0.3 at `09ff5ad0` and finds that it changed line 3 of `apps/desktop/package.json` and no other file for the version. That held at `09ff5ad0`. The workflow file and the case that holds it to the version came later, with `c409dbb0` (#195). The case "holds Owlery's own workflow to the one a setup writes for the app's version, so the pull request that moves the version rewrites it" in `apps/desktop/test/records-place.test.ts` failed after the move of `package.json` alone. The diff it printed named three lines of the workflow: the step's name, `at Owlery 0.0.3`, and the two clones of `v0.0.3` and `release/v0.0.3`. Executed. Those three lines now name 0.0.4, and the case passed, 30 of 30. Executed. The workflow's edit is in the same commit as the move of `package.json` and `changelog.md`, as `frame/plan.md` *Operational impact* asks of the move. Judged against the case itself, which states the rule.

**Scenario 5 holds.** `git grep -n '"version"' -- apps/desktop/package.json` printed `apps/desktop/package.json:3:  "version": "0.0.3",` before the move, and `apps/desktop/package.json:3:  "version": "0.0.4",` after it. Executed.

**The two test files that read the version from `package.json` pass.** `test/records-place.test.ts` passed, 30 of 30, by `node scripts/test-in-electron.mjs test/records-place.test.ts`. `test/records-dialog.test.ts` passed, 1 of 1, by `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/records-dialog.test.ts`, each from `apps/desktop`. Executed. `test/korean-input.test.ts` reads `package.json` too, but only its `dependencies`, so the move cannot change its result, and it was not run.

**The changelog fragment holds no `### Process changes` table.** The work item's diff changes none of the files the plugin's `docs/layout/the-record-layout.md` *A change writes fragments, never a shared file* names for one.
