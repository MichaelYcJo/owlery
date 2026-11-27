# Implementation Plan: two built-app cases wait on what they read (#244, #207)

## Technical context

The tree as read at `15701977`.

The work changes three test files of `apps/desktop/test/` and files of the same project that share their class. It changes no file under `apps/desktop/src/`.

- `built-app.ts:277` `BuiltApp.until` polls an expression of the page every 100 ms for 15 seconds, and its message names only what never came. `built-app.ts:287` `BuiltApp.click` reads the element's middle with one call of the debugging port and presses with two more, so what the page draws between the calls moves the element away from the press.
- `work-item-menu.test.ts:269` starts one app for the file's cases. Its cases build on each other: a later case reads the work items an earlier one made.
- `work-item-menu.test.ts:1026-1028` is the removal case's wait, and `work-item-menu.test.ts:689-692` the register case's press of "Not now".
- `role-bundle.test.ts:507` is the stand-in for the CLI, and `role-bundle.test.ts:525-529` the rewrite, the reload and the wait.
- A run of a built-app file goes through the session's lock, with `OWLERY_BACKGROUND=1`, as the spawn states it.

**The failure scenario of the chosen approach.** The waits are written case by case, so a case written later can press in a dialog before its answer is drawn, and nothing refuses it. It then fails now and then under load, as these did. *Scope* item 6 is what that later failure gets: its message names the press that missed. Item 3's list is made from the requests the window sends at this commit, so a request added later is outside it.

## Alternatives considered

| Approach | Failure scenario | Verdict |
|---|---|---|
| Each case waits on the answer its dialog asked for, drawn, before it presses or notes anything (*Scope* items 1, 2, 3 and 5) | A later case forgets the wait and fails under load. Nothing in the helper refuses it. | Chosen. The wait is on what a person reads before pressing, it asserts more than the case did, and it leaves no order to chance. The premise that keeps `BuiltApp.click` as it is: the dialogs whose content arrives after they open can be listed from the requests the window sends. `git grep -n 'send({ type: "\(plan\|read\|fetch\)' -- apps/desktop/src/renderer` lists them (`executed`). Item 3 names the ones that fill a dialog; the others it prints fill the sidebar (`readLists`) and the work item's view (`readGateOutput`, `readSealRecords`, `readLedger`), where no modal dialog stands. |
| Replace `BuiltApp.click` with a click that checks its press arrived on the element and aims again where the element moved | The press that missed has already landed on another control, and the second press hides it. A click the product loses when it draws between the press and the release, which #242 was, would pass on the second aim. A press on a disabled or covered control, which some cases make on purpose, would be aimed again without end or refused. | Rejected. It makes a case pass where a person's click would have missed, which is the defect the spawn rules out. Item 6 takes the part of it that asserts nothing less: the miss is named in the failure. |
| A longer wait, or a second try of the failed wait | The removal case's list is already drawn anew when the wait ends, and the old-CLI notice is gone with no read under way to bring it back (`design.md` *Grounding*, cause 3). A held read is ended after 10 seconds, so a wait past 15 seconds reads a notice that went. | Rejected. No length of wait passes either case. |
| Change the product: the removal dialog keeps the lists of the losses it already drew when another loss arrives, and the records dialog keeps its height while it waits for its plan | Each is a decision about what a person sees, and #251 decided the first: a list is drawn again where what it names changed. A product change made to pass a case ships with a release that did not ask for it. | Rejected for this work, whose routing is test cases. The removal dialog's redraw of every loss at each answer is named in the report for the orchestrator. |
| After every case, passed or failed, close what is open, or fail a passing case that leaves something open | Closing after a passing case hides a case that leaves a dialog open, which fails the next case at this commit. Failing such a case is a new assertion on every file whose cases share an app, and this work did not read those cases whole. | Rejected. Item 4 acts after a failed case alone, so no passing run changes. |
| Start a new app for each case of `work-item-menu.test.ts`, so nothing a case leaves reaches the next | The file's cases build on each other's work items, so each case would need its own setup, and the file's time on the runner, 125 seconds in run 45907578756, would grow by a start for each of its cases. | Rejected. It answers the cascade and costs a rewrite of the file; item 4 answers the open dialog, which is what #244 asks. |
| The old-CLI case waits until the stand-in's log shows no read under way, then rewrites the version | A read the daemon has started and whose process has not written its first line yet is not in the log, so the case rewrites under it. | Rejected. Item 5 needs no knowledge of which reads are under way. |

## Phases

| Phase | Delivers | Verified by | Status |
|---|---|---|---|
| 1 | *Scope* items 1, 2 and 6, and item 4's helper with its registration in `test/work-item-menu.test.ts` | `test/work-item-menu.test.ts` run five times through the lock, each passing. The crafter's one-off `test_tmp_*` probes of `design.md` *User scenarios & acceptance*, rows 1, 3, 4 and 7, each run once and none committed: the removal case red with this commit's wait under a delayed loss and green with item 1's; the pair of cases red without the helper and green with it; the passing case that leaves the form open still failing the next; the missed press named. | `395f1526` |
| 2 | *Scope* item 5 | The old-CLI case run twenty times through the lock (`test/role-bundle.test.ts -t "notice of an old CLI"`), each passing. The crafter's one-off probe of rows 5 and 6: the order of the framer's probe 2 shows the notice with item 5's stand-in, and with this commit's stand-in the new message holds "Daemon running, no agent". | `a0c8800f` |
| 3 | *Scope* item 3, and item 4's registration in each other built-app file whose cases share one app | The phase record lists, for each request item 3 names, every place found and what was done there, with the command that listed them. Each test file the phase changed, and each file that registers item 4's helper, run once through the lock, passing. | `6bf50a2c` |

The typecheck, the whole suite and the broad gate are the orchestrator's, after the rounds.

## Overlap with the release

The spawn names no other open work item of the release. `origin/release/v0.1.0` at `e7737b7e` holds no directory under `seal/threads/` (`git ls-tree --name-only origin/release/v0.1.0 seal/threads/` prints nothing, `executed`), so no frame stands to read. The orchestrator's finding names a worktree for #300, whose issue is on timed cases of the daemon's suite, and its frame was not handed to the framer.

| Work item | Where both change | Merges first | Grounds |
|---|---|---|---|
| | | | |

## Operational impact

None. No migration, no environment variable, no dependency and no version move.

## Judgments of the run

| Date | Judgment | Grounds | Judged against |
|---|---|---|---|
| | | | |
