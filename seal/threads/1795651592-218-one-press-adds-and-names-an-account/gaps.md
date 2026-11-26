# Closing memo: 1795651592-218-one-press-adds-and-names-an-account

## Not verified

| Item | Who must answer |
|---|---|
| The broad gate: the full suite, the repository-wide typecheck, and the heading and table-row comparison of `docs/design.md` with `docs/design.ko.md` | the orchestrator, by the `Broad gate` command of `seal/config.json` |
| One real login through "Add an account" in the built app: the row is named by the account's email and reads "Signed in" (*Scope* item 13). It also measures whether a real `claude auth status` prints the login's email as `email`, which `loginStatusOf` reads (`frame/questions.md` Q1). The cases read the stand-in, which prints the field as the executable of Claude Code 2.1.332 was read to print it | the owner |
| Scenario K's built-app case was never seen red against the old window. `theme-controls.test.ts` runs once, and that one run passed. Against the old form its first assertion would fail, because the form held the name input (`read`) | the orchestrator, where a red run of the built app is wanted |
| No mutation ran over the window's new units: the disabled state and the head of `apps/desktop/src/renderer/sign-in-pane.ts#showSignIn`, and `apps/desktop/src/renderer/renderer.ts#takeAddEnded`. Only scenario K's built-app case covers them, and that file runs once per phase | the orchestrator, by a built-app mutation run where one is wanted |
| A window of this build that meets a daemon of 0.0.4 shows that daemon's refusal of an add without a name (`frame/plan.md` *Operational impact*). No case starts two builds | the owner, at the release |
| No mutation ran over the screenshot run's own code of phase 3: the `show` and `leave` of the views `accounts-adding` and `accounts-added` in `apps/desktop/test/screenshots.test.ts`, and the `auth` branch of `apps/desktop/test/fixtures/sample-cli.sh`. Only the screenshot run covers them, and it ran twice green (`trail/phases/phase-3.md`) | the orchestrator, by a mutation run of the screenshot command where one is wanted |
| Phase 4 stands an Accounts row's two buttons under its field while the row is renamed, and under its question while its removal is asked, as it does for a row at rest. No case reads where those buttons stand, and no shot draws either state. The rename case of `theme-controls.test.ts` reads only that the field opens | the proofer, by reading the rule `#accounts-list li` of `apps/desktop/src/renderer/index.html` against `docs/design.md`'s row "An account's name" |

## Not done

Nothing. Phase 3 found the row of a newly added account breaking its email name inside the word, and phase 4 lays the row out again as `frame/design.md` *Scope* item 14 states. `trail/phases/phase-3.md` holds the finding, and `trail/phases/phase-4.md` holds the fix.
