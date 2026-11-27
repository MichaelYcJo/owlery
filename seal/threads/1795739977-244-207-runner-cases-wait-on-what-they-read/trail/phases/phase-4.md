# Phase 4: 1795739977-244-207-runner-cases-wait-on-what-they-read

## What this phase found

**The sealer's withheld verdict holds, and this phase corrects it.** `frame/design.md` *Scope* item 4 and `changelog.md` say that each file whose cases share one app and open a dialog or a menu registers `atRestAfterFailure`. `trail/phases/phase-3.md`'s item 4 table left `records-dialog.test.ts` out with the reason "one case each, so no later case meets what it leaves". That reason was true at the commit phase 3 read. The release merge `c96548f3` then brought #312's second case into the file, so the file now holds two cases that share the app `beforeAll` starts, and each opens the records dialog. The row of `phase-3.md` that says "One case each" for `records-dialog.test.ts` is out of date for that file only, and this record is the correction: the file registers the hook, at `7b2600e3`. `phase-3.md` is left as written, since this record carries the correction and the row is still right for `screenshots.test.ts`.

**The frame holds for phase 4** (`read`). The frame's rule, *Scope* item 4, is the one the sealer quoted, and `built-app.ts#atRestAfterFailure` is at the signature the other files call (`git grep -n atRestAfterFailure -- test` at HEAD, `executed`, prints a registration in each file phase 3 names).

**The registration.** `records-dialog.test.ts` imports `afterEach` and `atRestAfterFailure`, and registers `afterEach(atRestAfterFailure(() => app))` in its one describe, before `afterAll`, the way `chain-choice.test.ts` and the other files of phase 3 register it. The file's own `afterAll` stops the app, and the hook runs after each case, so the hook finds the app running.

**The probe, seen red without the hook and green with it** (`executed`, each once, through the session's lock). The probe was a copy of the file under a name starting `test_tmp_`, with one throw added in the first case after its last assertion and before it closes the records dialog, so the case fails with the dialog open. A second line registered the hook only where an environment variable said so. The copy is gone from the tree.

| Run | Result |
|---|---|
| Without the hook | Both cases failed. The second failed in its first wait: "the window never showed the dialog work-item-dialog; the last click aimed at #new-work-item and its press landed on dialog#records-dialog". The press landed on the dialog the first case left open, so the failure is the one the hook exists to prevent, and the message of phase 1 names it. |
| With the hook | The first case failed with the probe's own error, and the second passed. After the failed case the hook pressed Escape and the records dialog closed. |

**The mutation run was not made.** The registration adds no behaviour of its own. It calls phase 1's helper, whose red phase 1's probe showed, and a mutant of the registration would show red only under a case that fails. The probe above is that case.

**The census, at HEAD `7b2600e3`** (`executed`). The files that start or name a built app are `git grep -l -E 'BuiltApp|buildApp' -- test`, and the files among them with no registration are `git grep -L atRestAfterFailure -- $(git grep -l -E 'BuiltApp|buildApp' -- test)`. Each file of that second list was read against *Scope* item 4:

| File | Decision, and why |
|---|---|
| `approval-line.test.ts`, `seal-back-view.test.ts` | Left out. Their cases share one app, but no case opens a dialog or a menu: `git grep -n -E 'dialog|Dialog|menu'` over them prints nothing, and they press the sidebar's lines, the inbox's button and the view's tabs. |
| `korean-input.test.ts` | Left out. Its cases share one app, and the form opens in `beforeAll` alone. The same search prints nothing for it. |
| `pane-session.test.ts` | Left out. The one match is a comment on Claude Code's own trust dialog, which is in the pane and not the window. |
| `role-session.test.ts` | Left out. It holds no case, and the same search prints nothing for it. |
| `daemon-restart.test.ts` | Left out for the reason `phase-3.md` gives and `gaps.md` *Not done* names: its first describe's last case quits the app. Its cases at `:116` and `:169` share the app, and the second reloads the page before it reads the window. |
| `role-bundle.test.ts`, `keep-awake.test.ts`, `screenshots.test.ts`, `launch.test.ts`, `memory.test.ts` | Left out. In each, a case starts and stops an app of its own, or the one case that shares an app is the only case in its describe (`screenshots.test.ts:1094`), or the app starts only under a measuring variable. |
| `built-app.ts`, `korean-pane.ts`, `launch.ts`, `memory.ts`, `test/fixtures/rerun-unstarted/github.json` | Not test files with cases of their own: the helper's home, three helpers and a fixture. |

The files that register the hook are those `git grep -l atRestAfterFailure -- test` prints: the ones of phase 3 and `records-dialog.test.ts`. The census is complete over the test files that name a built app, by the command that lists them. It does not read the cases of each file again line by line: where a file's cases open a dialog, the search above finds the dialog's id or the word in the case, and it found none in the files left out.

**The phase boundary** (`executed`, at `7b2600e3`, through the session's lock). `records-dialog.test.ts` passed 2 cases, and `tsc --noEmit` over the project exited 0. `built-app.ts` and the other files did not change in this phase, so no other file was run. `gaps.md` *Not verified* no longer names `records-dialog.test.ts` among the files no phase ran.
