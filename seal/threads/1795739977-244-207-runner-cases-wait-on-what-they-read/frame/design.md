# Design: two built-app cases wait on what they read (#244, #207)

## Grounding

The tree as read at `15701977`. Each fact carries its label: `executed` for what a command gave, `read` for what was opened. The framer ran no check of the repository's: no suite, no typecheck, no broad gate. The two probes below are the framer's own files, run once each in a `git clone --no-local` under the framer's scratch directory, through the session's lock.

| Policy clause | What it fixes for this work |
|---|---|
| `docs/architecture.md` *Options for launching Claude Code*: "While that notice stands, the daemon reads the version again each time a window connects, so the notice goes once the person updated." | The read at a window's hello is the product's rule, and this work changes no product code. The old-CLI case has to hold whichever read is under way when it rewrites the version. |
| `apps/desktop/vitest.config.ts`, project `app` (`fileParallelism: false`), and `git grep -n 'BuiltApp.start' -- apps/desktop/test` (`executed`) | Each built-app file starts its own app. A dialog one case leaves open reaches the later cases of that file and no other file. #244's sentence "the built-app files share one app" does not hold at this commit, and each of the two runner logs of the cascade shows one failed file. |
| No clause of `docs/` states how a case waits: `git grep -n -i -e 'blind wait' -e 'fixed wait' -- docs` prints nothing (`executed`), and `docs/` holds no document on tests (`read`, its file list) | The work adds no rule. Its bound is the spawn's: no case passes by asserting less, and none by a longer wait on nothing. |

**The runs read.** `gh run list --workflow check.yml --limit 100` and, for each run with more than one attempt, `gh run view <id> --attempt <n> --log-failed` (`executed`, GET only). The failures of the two issues' cases:

| Run, attempt | Date | Failed | First failure |
|---|---|---|---|
| 45522093662, 1 | 2026-11-25 | `role-bundle.test.ts`, the old-CLI case | "the window never showed the notice in the page loaded anew" |
| 45614364110, 1 | 2026-11-25 | the same case | the same message |
| 45669561774, 1 | 2026-11-25 | the same case | the same message |
| 45686383614, 2 | 2026-11-25 | the same case | the same message |
| 45614364110, 2 | 2026-11-25 | thirteen cases of `work-item-menu.test.ts` | "the window never showed the dialog records-dialog closed", in the case that registers a repository alone, after its press of "Not now" |
| 45907578756, 1 (#301) | 2026-11-26 | eight cases of `work-item-menu.test.ts` | `expected [ +0, false, false, true, true ] to deeply equal [ 52, true, true, true, true ]` at `test/work-item-menu.test.ts:1036`, in the case that keeps the removal dialog's lists |

The first failure of #301's run is the removal dialog's case, not the records dialog. The spawn and `routing.md` name it as a records dialog, and the log does not. The orchestrator's later finding is the same failure on this Mac: the broad gate of another work item, run while other agents worked, failed the same eight cases with the same first line, and the framer opened that gate's output (`read`). So the cascade has two known first failures, and the removal case is the one seen twice.

**Why the later cases fail.** `apps/desktop/src/renderer/renderer.ts#opened` opens nothing while `renderer.ts#dialogOpen` finds a `dialog[open]` or a `[role="menu"]` (`read`). A case that throws with a modal dialog open leaves it open, and every later case of the file that opens a menu or the form waits 15 seconds and fails. The logs show those two messages after each first failure.

**Cause 1, the removal case (`work-item-menu.test.ts:1021`), by the code read.** After the press of `#remove-delete`, `renderer.ts#showRemove` sends one `readLoss` for each work item of the repository. The daemon answers each when its own read of git ends (`apps/desktop/src/daemon/daemon.ts`, `case "readLoss"`, `void read()`), so the answers arrive in the order the reads end. Each answer runs `showRemove`, whose `drawWhereChanged` over `#remove-losses` is keyed on every work item's loss together, and it replaces every child when one loss arrives. The case waits for the heading of twelve commits and for `#remove-force-label`. `apps/desktop/src/renderer/view.ts#removalChoice` shows that label as soon as one known loss loses work (`forceShown: loses`). So the wait ends while another work item's loss is still on its way. The case notes the list and scrolls it, the late loss draws every list of losses anew, and `kept()` reads scroll 0 and a new list. The lists of work items and of sessions stay, which is the `true, true` at the end of the received value. The product does what #251 decided: a list is drawn again where what it names changed.

**Cause 2, the records dialog's "Not now" (`work-item-menu.test.ts:691`), by a probe.** `renderer.ts#openRecords` opens the dialog with no plan and asks the daemon for it, and `renderer.ts#takeRecordsPlan` draws the plan's files when the answer comes. `BuiltApp.click` reads the element's middle in one call and presses in two more. Probe 1 (`executed`, `test_tmp_runner_cases.test.ts`, 2026-11-27): "Not now" stood at (872, 508) when the dialog opened, with the dialog 184 px high, and at (857, 850) once the plan was drawn 92 ms later, with the dialog 868 px high. A press at the first place then landed on a `pre` of the plan, and the dialog stood open a second later. A press aimed after the plan was drawn closed it. The case presses with no wait on the plan, so a plan that arrives between the read of the place and the press leaves the dialog open, and `dialogClosed` then waits out its 15 seconds. The runner's log holds the message and not the place of the press. That this is what happened on 2026-11-25 is inferred, and the mechanism is shown.

**Cause 3, the old-CLI notice (`role-bundle.test.ts:497`), by two probes.** `daemon.ts#readOutside` starts `readAgentNotice` at each hello while a notice stands. The case's stand-in for the CLI looks at the `hold` file first and reads the `version` file after it. A read begun at a hello before the case writes `hold` passes the hold. Where it reads `version` after the case rewrote it, it prints 2.1.326, the daemon drops the notice, and the next hello starts no read, since no notice stands. Probe 2 (`executed`, `test_tmp_notice_read_at_hello.test.ts`, 2026-11-27) forced that order: a second client said hello once the notice stood, and the stand-in's second run waited between its look at the hold and its read of the version until the version was rewritten. The status line read "Daemon running, no agent" before the reload, the wait threw "the window never showed the notice in the page loaded anew", which is the issue's message, and no run of the CLI began after the reload. Probe 1 ran the case's own order on this Mac: one run of the CLI before the hold, so no read was under way at the rewrite, and the case passed. On this Mac the window's first hello came before the daemon's first read ended, so that hello started no read. A window that connects after the first read ended starts one, and that is the read the case races. That the runner's window connects that late is inferred from the four failures and not observed: the case's message does not say what the status line held.

Two facts bound the fix of cause 3. No longer wait can pass: once the notice is gone, no read is under way that could bring it back. And a held read is ended after 10 seconds (`apps/desktop/src/daemon/adapters/claude.ts`, `notice()`, `timeout: options.lookupTimeoutMs ?? 10_000`), after which the notice goes, so the case's 15-second wait is already longer than the hold can last.

**The installed runner's hooks.** In `@vitest/runner` 4.1.12 as installed, a failed case's `result.state` is `"fail"` before its `afterEach` hooks run (`dist/chunk-artifact.js`, `failTask` at line 2966 before `callSuiteHook(…, "afterEach", …)` at line 2974) (`read`).

**A third sighting, cause not shown.** The orchestrator's finding names an earlier gate run that failed `machine-dialog.test.ts:317`, "the window never showed 4 tabs", after a press of "+ Shell", and the framer opened that output (`read`). Nothing read shows why the press made no tab. *Scope* item 6 makes the next such failure say where the press landed.

## Scope

In:

1. **The removal case waits for every work item's loss before it notes the lists.** In `apps/desktop/test/work-item-menu.test.ts`, the case at line 1021 waits, after the press of `#remove-delete`, until `#remove-losses` holds a heading for each work item `#remove-work-items` lists and no sentence "Reading what a delete would remove." under any of them. Every assertion of the case stays as it is.
2. **The register case presses "Not now" once the records dialog shows its plan.** In the same file, the case at line 663 waits until `#records-files` holds the plan's files, asserts their paths, and then presses `#records-cancel`. Every other assertion of the case stays.
3. **The same wait at every other place of the class.** The class is a press or a read in a dialog between a request the dialog sent and the draw of its answer. The requests are the ones the window sends for a dialog's content: `planRename` (`renderer.ts:738`), `planWorkItem` (`renderer.ts:861` and `renderer.ts:1831`), `readLoss` (`renderer.ts:1209` and `renderer.ts:1334`), `planRecords` (`renderer.ts:1434`), `fetchBase` (`renderer.ts:1795`), and `readMachine` with `readHeavyRuns` (`apps/desktop/src/renderer/machine.ts:167`). For each, the phase lists every place in the test files of the `app` project that presses or reads a control of that dialog after the request. Each place either waits on the answer as drawn, or is recorded in the phase record with the reason the answer cannot move what it presses or change what it reads.
4. **A failed case leaves no dialog and no menu open.** `apps/desktop/test/built-app.ts` gains one exported helper. After a case that failed, it presses Escape in the window, as a person closes a dialog or a menu, until `document.querySelector('dialog[open], [role="menu"]')` finds nothing, and it throws with the ids of what stays open where Escape closes nothing. After a case that passed it does nothing, so a passing case that leaves a dialog open still fails the next case, as it does at this commit. Each test file of the `app` project whose cases share one started app and open a dialog or a menu registers it. A file whose cases end the app is left out, and the phase record names it.
5. **The old-CLI case holds every read of the version, whenever it began.** In `apps/desktop/test/role-bundle.test.ts`, the stand-in for the CLI reads the `version` file first, then waits while `hold` stands, then prints what it read. The case writes `hold` first and then puts the new version in place with a rename, so no read sees half a file. A read that began before the rewrite prints 2.1.300, and one that began after it is held. The wait on the page loaded anew, where it fails, says what the status line held and whether the page is the new one. Every assertion of the case stays.
6. **A wait that fails says where the last press landed, where it missed.** `BuiltApp.click` notes, in the page, the element its press arrived on. `BuiltApp.until`, where it throws, adds to its message the selector the last click aimed at and what the press landed on, where that was not the element or a part of it, and names a press that raised no `pointerdown` in the page, such as one past the window's edge. It changes no case's result.

Out:

- **Any product code.** The records dialog grows when its plan arrives, and the removal dialog draws its losses anew at each answer. Both are as the product decided. A fix that needs a product change stops the work and is named in its record.
- **Why `machine-dialog.test.ts:317` failed once.** Nothing read shows it. Item 6 is what this work gives it.
- **What a failed case leaves in the daemon's lists.** The cases of `work-item-menu.test.ts` build on each other's work items. After item 4 a later case can still fail on a work item the failed case did not delete.
- **The other failures the logs hold**: `ask-section.test.ts` (run 45569113096), `daemon.test.ts` and `chain.test.ts` (#291, #292 and #295, closed by #297), and the open issues #300, #258 and #202.
- **The 600 ms pause of the register case** (`work-item-menu.test.ts:685`), which waits to assert that nothing is drawn.

## User scenarios & acceptance *(mandatory)*

| Scenario | Given / When / Then | Verifiable how |
|---|---|---|
| A late loss does not fail the removal case | Given the daemon answers the loss of another work item of the repository after the loss of "Long list". When the case runs. Then it notes the lists after every loss is drawn, and passes. | A one-off probe of the crafter's, named `test_tmp_*`, starts the app with a stand-in for `git` first on its `PATH` that pauses in one other work item's worktree. The case fails at line 1036 with the wait of this commit and passes with item 1's. The probe is not committed. |
| "Not now" is pressed where it stands | Given the records dialog has opened with no plan. When the register case reaches its press. Then the plan's files are drawn, and the dialog closes at the press. | The case's wait and its assertion of the paths, by reading. The file run five times through the lock, each run passing. |
| A failed case leaves the window at rest | Given a case throws while a dialog is open. When the next case of the file opens a menu or the form. Then it opens. | A one-off pair of cases in a `test_tmp_*` file: the first opens the "New work item" form and throws, the second opens it again. The second fails without the helper and passes with it. |
| A passing case that leaves a dialog open still fails the next | Given a case passes with a dialog open. When the next case opens the form. Then it fails as it does at this commit. | The same one-off file, with the first case passing. |
| A read under way at the rewrite does not take the notice | Given a read of the version passed its look at the hold before the case wrote it. When the case rewrites the version and reloads the page. Then the page loaded anew shows the notice. | The order of the framer's probe 2 with item 5's stand-in, run once by the crafter as a `test_tmp_*` file: it shows the notice. With the stand-in of this commit it threw the issue's message (`executed`, *Grounding*). |
| The old-CLI case's failure names the status line | Given the page loaded anew shows another text. When the wait fails. Then its message holds that text. | The same probe with the stand-in of this commit and item 5's message: the message holds "Daemon running, no agent". |
| A missed press is named | Given a click's press lands on another element. When a later wait fails. Then its message names the selector and what the press landed on. | A one-off case that clicks an element another element covers, then waits on what the click would have shown, and reads the message. |
| The runner | Given items 1, 2 and 5 are merged. When `check` runs first attempts on the hosted runner. Then these three cases do not fail. | `frame/questions.md` Q1: no agent starts a run, so the runs of later pull requests answer it. |

## Data & interfaces

No schema, no message of the protocol and no product file changes. `apps/desktop/test/built-app.ts` gains one exported helper (item 4), and `BuiltApp.click` and `BuiltApp.until` keep their signatures (item 6).

## Rule changes

- nothing
  why: the work changes test cases and the suite's helper, and no rule of `docs/` states how a case waits.

## Removes

- nothing
  why: every case keeps its assertions, and the helper and the two messages are additions. Item 5 reorders the stand-in's steps and removes none.

Framed 2026-11-27 by framer, before the build.
