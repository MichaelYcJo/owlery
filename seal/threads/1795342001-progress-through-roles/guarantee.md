# Guarantee: 1795342001-progress-through-roles

This is the second audit. The first sealed `430c01c`, and its verdict block stands below as it was written. Since then six commits stand on the branch: `2b84254`, which commits the first guarantee, and `63edad3`, `7ac9b06`, `bbf6513`, `5aee31d` and `3757b73`. Of them only `63edad3` touches a file outside the work item's records, `apps/desktop/test/approval-line.test.ts`, and no commit touches `apps/desktop/src`, `docs/`, `frame/`, `changelog.md`, `pr.md` or the phase records (executed: `git diff --stat 430c01c 3757b73`, and the same over `apps/desktop/src docs`, which printed nothing). This audit read `63edad3`, `gaps.md`, `trail/rounds/round-4.md`, `trail/gate.md` and the logs of run `45127495689` at `3757b73`. It re-ran the claims whose coordinates those commits touched, and read every party again. The claims of the first audit whose coordinates nothing touched are carried, and the table names them as carried. The base `release/v0.0.2` resolves through its upstream to `71d035e`, as before. Each run below was made in a clone of the branch at `3757b73`, under `OWLERY_BACKGROUND=1`, through the electron lock, and each file a run changed was restored from `3757b73` after it.

## Claims re-run

| Claim | Source | Command | Result |
|---|---|---|---|
| The broad gate ran at `5aee31d` against `71d035e`, and only the work item's records follow it | `trail/gate.md:8` | `git log --no-merges --name-only 5aee31d..HEAD ^71d035e`, and `git merge-base --is-ancestor 5aee31d HEAD` | holds. `5aee31d` is an ancestor of HEAD, and the one commit after it, `3757b73`, touches `trail/gate.md` alone. `executed` |
| The pull request body is `pr.md` above the records' heading and the records' text below it | the body file the orchestrator composed again with `seal pr-body` | `seal pr-body seal/threads/1795342001-progress-through-roles --body <the body file> --check` | holds. Exit 0, "matches". `executed` |
| With `63edad3`'s `openView`, the four cases of `test/approval-line.test.ts` reach their assertions, and the last case still holds a failed place's line in the colour of a failure: with the rule `.approval .under.failed` removed, it goes red with `[false, true]` after the line's words pass | `trail/rounds/round-1.md:85` (`7b582ad`), and the case as `63edad3` changes it | `node scripts/test-in-electron.mjs test/approval-line.test.ts` in `apps/desktop`, with that one rule removed from `src/renderer/index.html`. The built app started once, through `BuiltApp.start` | holds. Exit 1: 3 cases passed, and the last failed at `approval-line.test.ts:253` with `[ false, true ]` for `[ true, true ]`, after its `openView` and the stop of the round. `executed` |
| `63edad3` changes no file under `src/`, so what the window draws is what the first audit read | `gaps.md:21`, `trail/rounds/round-4.md` *Confirmations* | `git diff --stat 430c01c 3757b73 -- apps/desktop/src docs` | holds. Nothing printed. `executed` |
| The sidebar replaces every line's button at each draw, and a line opens its view by a `click` listener on its button | `gaps.md:22` | read `apps/desktop/src/renderer/sidebar.ts:111-113` and `:151` at `3757b73` | holds. The listener is on the button, and `repositories.replaceChildren` draws new buttons. `read` |
| Round 4's finding 1 is closed by `bbf6513` with the record's text, a fix no round read | `trail/rounds/round-4.md`, the close of finding 1 | `grep -cxF` of the row the finding gives against `gaps.md`; `git show --stat bbf6513`; `git grep -n "nor what it reads"` | holds. The row stands once, word for word. `bbf6513` touches `gaps.md` alone. The old words stand only in `round-4.md`, which quotes them. The row says what the finding asked: this work item changes the pass that sends the inboxes the case counts, and the base `71d035e` sends the unexpected inbox too. `executed` |
| The pull request's two failed runs of `check` failed on #168's two cases of `test/terminal-basics.test.ts` (attempt 1), and on the last case of `test/approval-line.test.ts` at "the window never showed the view of Beta" and the case of `test/daemon.test.ts` at `[ undefined, null, 'waiting' ]` (attempt 2) | `trail/rounds/round-4.md` *Probes*, `gaps.md:21-23` | `gh run view 45127495689 --attempt 1 --log-failed` and `--attempt 2 --log-failed` | holds. Attempt 1: 1 file failed, 54 passed, the two `terminal-basics` cases. Attempt 2: 2 files failed, 53 passed, the two cases named. `executed` |
| Carried from the first audit, untouched since: the four phase-3 cases of `test/view.test.ts` red against `0dc13e8`; the exact asker guard red at `view.test.ts:1326`; the refusal guard of `chain-records.ts` red at `chain-records.test.ts:46`; `test/view.test.ts`, `test/chain-records.test.ts` and `test/themes.test.ts` green, 478 cases; both *Removes* rows gone; `role-grants.ts#verdictOn`; the readers of `lineSince`; the twelve screenshots at `64274a7`; the issue's comment on the fifth *Done when* line; a record for each phase | the first audit's verdict block, at `430c01c` | not re-run: no commit since `430c01c` touches `apps/desktop/src`, `apps/desktop/test/view.test.ts`, `apps/desktop/test/chain-records.test.ts`, `docs/`, the screenshots, `frame/plan.md` or `trail/phases/` | holds as the first audit ran it. `executed` at `430c01c`, and the files are the same at `3757b73` |

## The parties

| Party | Says | Agrees with | Disagrees with |
|---|---|---|---|
| The design | Unchanged since `430c01c`: the daemon sends `WorkItem.recorded`, the window composes four places with the chain, the inbox's line names a running stage, and a failed gate, the sealer as a stage and the role session's own screen are out of scope, each with its reason | the build, and the issue's *Done when* lines as the first audit read them. Scenarios 10 to 12 state the line in the built app and not how the case opens the view, and `63edad3` keeps every assertion on the line | none. Its departures from the issue's words stand as the first audit named them |
| The build | The phase records and the diff as before, and `63edad3`: the cases of `test/approval-line.test.ts` open a view through `openView`, which clicks again where the view does not show in 2 s, and open Beta's view before `getSeal` and `stopHeadless`. `gaps.md:21-23` say what it ran, the sidebar's lost click and the daemon case's race | the design; the re-run above; the logs of run `45127495689`; `sidebar.ts` | none |
| The last round | Round 4 at `63edad3` judges the three failures' diagnoses, confirms them, opens one `should` on a `gaps.md` row, which `bbf6513` closes, and leaves the suite, `approval-line.test.ts` under load, the sidebar's lost click and Q1 to others | the build at `3757b73`; the logs; the row of `gaps.md` as the close says. The suite under load ran in the broad gate at `5aee31d` | none |
| The changelog | Unchanged since `430c01c`, as the first audit compared it | the build and the design. `63edad3` changes nothing a person sees | none |
| The orchestrator's part of the pull request body | `pr.md`, unchanged since `430c01c`, as the first audit compared it | the design, the build, the changelog and the issue's comment | none |

The routing's *Why this way* names the crafter's work as the protocol, the daemon's progress and the window's view and inbox line. `63edad3` changes a case of that line in the built app, and nothing its grounds do not describe.

The pull request's `hygiene` run at `3757b73` (run `45134108694`) fails as a ready pull request on two things this audit's verdict and the orchestrator's next act answer: the guarantee names `430c01c`, which `63edad3` follows, and the pull request's body is not yet the one `seal pr-body` composes at HEAD. The body file the orchestrator composed passed the check above. Its `check` run at `3757b73` was pending when this audit read it. Both are the orchestrator's to read once it sends the body.

Not verified by this audit, each with who answers it:

- Whether the owner takes the line's form and words, `frame/questions.md` Q1, which stays open with its default taken. The owner answers it, on the pull request's screenshots.
- That the first case of a running stage in `test/approval-line.test.ts` fails on its assertions of the inbox's line where the line names no stage. It is `unverified`, as the first audit left it, and no party claims it executed.
- `test/approval-line.test.ts` under the load of the whole suite, where attempt 2 lost a click. The broad gate at `5aee31d` ran it among 1690 cases, and this audit ran it alone. The pull request's `check` at `3757b73` answers it.
- Whether a click lost to a redraw between press and release is a defect of the release's sidebar, and the daemon case's 500 ms race (`gaps.md:22-23`). The orchestrator answers them, as follow-ups beside #168. Neither is this work item's change.
- The failed gate's mark on the line, the third *Done when* line's other half, waits for the gate stage of #42. Only this work item's frame carries it there. The orchestrator answers where it is carried.

```seal
target: 430c01c against 71d035e
Verdict: sealed
```

```seal
target: 3757b73 against 71d035e
Verdict: sealed
```
