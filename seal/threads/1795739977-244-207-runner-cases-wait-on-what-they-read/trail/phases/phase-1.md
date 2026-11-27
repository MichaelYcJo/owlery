# Phase 1: 1795739977-244-207-runner-cases-wait-on-what-they-read

## What this phase found

**The frame holds at `bf83a8c6`** (`read`). The coordinates the frame names for phase 1 stand where it says: the removal case at `work-item-menu.test.ts:1021` and its wait at `:1026-1028`, the register case at `:663` and its press at `:689-692`, `BuiltApp.until` at `built-app.ts:277` and `BuiltApp.click` at `:287`. `renderer.ts#showRemove` draws an `h3.work-item` and a `p.says` for each work item, and the sentence of a loss still awaited is `view.ts#deleteSays(null)`. `#remove-losses` also holds an `h3` for each section of a loss, the twelve commits' heading among them, so a heading for each work item is counted as `h3.work-item` only.

**The spawn narrowed *Scope* item 4, and phase 1 took that reading.** The plan's Delivers cell gives phase 1 all of item 4, and the spawn named `work-item-menu.test.ts` and `built-app.ts` as the phase's files. Phase 1 registers the hook in `work-item-menu.test.ts` alone, and `gaps.md` *Not done* names the rest. The files of the `app` project were listed by `grep -l 'import { [^}]*buildApp' test/*.test.ts`, and each was searched for where it starts the app and for `showModal`, `dialogOpen`, `.open`, `menuShown` and `role="menu"`. These start the app in a `beforeAll` and hold a dialog or a menu: `chain-choice.test.ts`, `decisions-and-questions.test.ts`, `machine-dialog.test.ts`, `notification-click.test.ts`, `screenshots.test.ts`, `terminal-basics.test.ts`, `theme-controls.test.ts` and `work-item-form.test.ts`. `records-dialog.test.ts` shares one app and holds one case, so no later case meets what it leaves. That list is a sample: it was made from words, and phase 3 reads each file whole before it registers the hook.

**Decisions settled while writing the code**, each judged against `frame/design.md` *Scope*:

- The removal case's wait counts the `h3.work-item` headings against the lines of `#remove-work-items`, and refuses a `.says` line that reads `deleteSays(null)`. The sentence comes from the dialog's own function, so the case and the dialog cannot drift apart. The wait keeps the two conditions it had.
- The register case waits until `#records-files` holds a `.path`, then asserts the three paths `records-dialog.test.ts` asserts for a repository with no records place. One plan arrives for `second`: it holds no `package.json`, so `records-place.ts#proposedBroadGate` is null and `renderer.ts#takeRecordsPlan` asks no second plan.
- The hook is `atRestAfterFailure(() => app)`. The file assigns `app` in its `beforeAll`, after the hook is registered, so the hook reads it through a function. It reads `task.result.state`, which is `"fail"` before `afterEach` runs (`frame/design.md` *Grounding*, the installed runner's hooks). A press of Escape is given two seconds to change what stands open, and the hook stops after ten presses.
- *Scope* item 6 says where a press landed. Phase 1 also names a press that raised no `pointerdown` in the page, which a press past the page's edge does. This adds to the frame: the first run of the row-1 probe below pressed "Cancel" in a removal dialog taller than the window, and the dialog stayed open. That the press fell past the edge is inferred; the run held no item 6 yet.
- No committed case reads the wait's message or `window.__builtAppPress`: `grep -n "never showed" test/*.ts` finds no assertion on the message outside the probes, and `__builtAppPress` stands in `built-app.ts` alone (`executed`). The listener the click adds reads the event and stops nothing, so item 6 changes no case's result.

**Row 1 of *User scenarios & acceptance*, the removal case under a late loss** (`executed`, `test_tmp_removal_late_loss.test.ts`, not committed). A stand-in for `git`, first on the daemon's `PATH`, held each `git status` outside Long list's worktree while a hold file stood. The probe ran the file's cases up to the removal case, then the removal case twice under the held loss, with the hold removed two seconds after the press of `#remove-delete`. Copy A kept this commit's wait and copy B took item 1's. Both waited after the note for every loss to be drawn, so the late loss lands after a note the wait let through.

- Copy A was red at line 1036 with `expected [ +0, false, false, true, true ] to deeply equal [ 52, true, true, true, true ]`, the first failure of run 45907578756 word for word. At its note, a loss was still being read.
- Copy B was green. At its note, every loss was drawn.
- The stand-in's log held `first-item` and `second-item` twice each, and let `long-list` through twice.
- The probe ran three times. The first run's copy A failed at its own cleanup, a press of Cancel that left the dialog open, and copy B then failed on the open dialog. The second run's copy A did not put back the mute it took back, and copy B failed on the mark. Each later run corrected the probe and not the case.

**Rows 3 and 4, the hook** (`executed`, `test_tmp_rest_and_press.test.ts`, not committed, run once). Without the hook, a case that opened the form and threw left the next case unable to open it anew: `the window never showed the form opened anew; the last click aimed at #new-work-item and its press landed on dialog#work-item-dialog saying "New work item Repository folder Browse… "`. With the hook, the same pair passed its second case. A case that passed with the form open still failed the next case, with the same message.

**Row 7, the missed press** (`executed`, the same probe file). A click on `#new-work-item` under a covering `div#probe-cover` made the wait fail with `the window never showed the form; the last click aimed at #new-work-item and its press landed on div#probe-cover saying "over the button"`. A wait that failed after a click that landed said nothing of the click.

**Mutations** (`executed`, `seal mutate apps/desktop/test/built-app.ts`, with the probe's four `unit:` cases as the tests, after `d47e9cf5`). The batch of six read red for each mutant. Its log held the verdicts and not the cases' output, so each mutant was then run alone, and the line each failed on was read:

| Mutant | Failed case, and its line |
|---|---|
| The hook acts after a case that passed too | "the helper leaves the form open after a pass…": `expected false to be true`, at the assertion that the form stays open after a pass |
| The hook never throws | "the helper names what Escape does not close": `expected '' to contain 'probe-stuck'` |
| `until` adds nothing to its message | "a failed wait names a click whose press another element took": the message ends at "the form" |
| The click counts every press as a miss | "a failed wait after a click that landed says nothing of the click": the message names the click |
| The click never notes that its press arrived | "a failed wait names a click whose press another element took": the message differs from the one the case expects, and the output cuts both before the point where they part |
| The hook presses no Escape | "the helper leaves the form open after a pass…": "Escape did not close what the failed case left open: the dialog work-item-dialog" |

The message quoted under *Rows 3 and 4, the hook* is as that run printed it. `395f1526` then trimmed the space the 40-character cut left before the closing quote, and the four `unit:` cases ran once more after it.

**The phase boundary** (`executed`, at `395f1526`): `test/work-item-menu.test.ts` ran five times through the session's lock, and each run passed its 33 cases. No other test file ran: the spawn allows three files a command, and `vitest.config.ts` makes the `app` project of the files that import `buildApp` from `built-app.ts`, so `gaps.md` *Not verified* hands them to the broad gate.

The register case's new wait and assertion have no red of their own. On this Mac the plan is drawn before the press either way, and `frame/design.md` *User scenarios & acceptance* row 2 verifies it by reading and by five runs.
