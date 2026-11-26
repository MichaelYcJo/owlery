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

## Not done

**The row of a newly added account breaks its name mid-word, and phase 3 did not change the row's layout.** A made account that runs no session offers six buttons on its row, so the name column is about 100 pixels wide, and "dana@example.com" wraps as "dana@example.c" and "om" in every theme's `accounts-added` shot that was opened. The six buttons stood before this work, but every new row is now named by an email, so the break is now the common case. The row's layout belongs to `docs/design.md` *Components and their states*, the row "An account's name", and phase 3's Delivers in `frame/plan.md` *Phases* holds the screenshots alone. So the orchestrator judges whether a fold of this work item lays the row out again, or a follow-up issue does. `trail/phases/phase-3.md` holds the finding.
