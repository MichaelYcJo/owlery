# Closing memo: 1795651592-218-one-press-adds-and-names-an-account

## Not verified

| Item | Who must answer |
|---|---|
| The broad gate: the full suite, the repository-wide typecheck, and the heading and table-row comparison of `docs/design.md` with `docs/design.ko.md` | the orchestrator, by the `Broad gate` command of `seal/config.json` |
| One real login through "Add an account" in the built app: the row is named by the account's email and reads "Signed in" (*Scope* item 13). It also measures whether a real `claude auth status` prints the login's email as `email`, which `loginStatusOf` reads (`frame/questions.md` Q1). The cases read the stand-in, which prints the field as the executable of Claude Code 2.1.332 was read to print it | the owner |
| Scenario K's built-app case was never seen red against the old window. `theme-controls.test.ts` runs once, and that one run passed. Against the old form its first assertion would fail, because the form held the name input (`read`) | the orchestrator, where a red run of the built app is wanted |
| No mutation ran over the window's new units: the disabled state and the head of `apps/desktop/src/renderer/sign-in-pane.ts#showSignIn`, and `apps/desktop/src/renderer/renderer.ts#takeAddEnded`. Only scenario K's built-app case covers them, and that file runs once per phase | the orchestrator, by a built-app mutation run where one is wanted |
| A window of this build that meets a daemon of 0.0.4 shows that daemon's refusal of an add without a name (`frame/plan.md` *Operational impact*). No case starts two builds | the owner, at the release |

## Not done

Nothing of phase 2. Phase 3 holds *Scope* item 11 and the screenshot pins.
