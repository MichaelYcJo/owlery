# Review round 8: 1795339001-worktree-setup

```seal
target: 1335c85, fixes 82537e1..1335c85
```

This round verifies the closes of round 7 and reads the merge of the moved base. Its code is the diff since round 7's target `82537e1`: the fold `8bd9b9f` of round 7's two findings, the closes `da9d77a`, and the orchestrator's merge `1335c85` of `origin/release/v0.0.2` at `c193260`. That base holds #151 (`eff2d74`, the release's settle reads `decisions.md`) and #153 (`c193260`, a background start's window is drawn at opacity 0 and opens no folder dialog). `c193260` is the merge base of HEAD and `origin/release/v0.0.2`. No `seal/parity.json` and no `Pact` key stand.

The records read whole at `1335c85` are `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md` and `pr.md`. After them came `trail/phases/` and `trail/rounds/round-1.md` to `round-7.md`, read for their coordinates. No `pr.<lang>.md` stands, since `Commit and pull request language` is English. The diff of `gaps.md` since `82537e1` rewords row 21 in place, one line removed and one added. No row or memo left it.

Carried from rounds 1 to 7, not established again: the copy's semantics and cleanup, the volumes' behaviour, the merge's resolution at `543fb9f`, and the screenshots' blobs at `613ffd5`. The merge changes no file of `apps/desktop/src/` that this branch changed, and this branch changes none that the base changed: the base's `apps/desktop/src` diff since `b8c1190` is `settle.ts`, `settle-main.ts`, `background.ts`, `main.ts`, `pick-folder.ts` and `ipc.ts`, and the branch's is the fourteen files of the setup, with none in common (`git diff --stat` of each side). Round 5's findings 1 and 2 stay deferred to #144.

**The merge's resolution.** `git show --remerge-diff 1335c85` shows one conflict, in `apps/desktop/test/work-item-form.test.ts`: the header comment's last items and the `node:fs` import under it. The resolution names both sides in the comment, the setup a repository names and the folder the Browse button asks for. It imports `renameSync`, `rmSync` and `writeFileSync`, and each is used (lines 164, 165, 204, 205 and 210). Against round 7's side, the merged file differs by that comment, the base's `inspectMain: true` start with its comment (line 63), and the base's last case (line 236). Against the base's side, it differs by that comment, the import, and this work's setup case (line 162). So nothing of either side was lost. The file holds nine cases, and it passed 9 of 9 at HEAD in the round's scratch clone, with `OWLERY_BACKGROUND=1` and the display held awake. Executed.

**Where the base meets this work.**

- `background.ts#showInBackground` now sets opacity 0 before `showInactive`, and `main.ts` gives the folder handler `chooseFolderDialog(background, …)`. Neither reaches the setup. The setup's window code in `renderer.ts`, `view.ts`, `shared.ts`, `list.ts` and `work-item-view.ts` never calls `pickFolder`. The one call is the Browse button's (`renderer.ts:1640`), which this branch does not change. The setup case of `work-item-form.test.ts` types the folder through the field (line 176) and never presses Browse. The `inspectMain` start opens the main process's inspector on a port of its own (`built-app.ts:180-186`) and changes nothing the setup case reads. Read, and the form file's run above.
- The base's last case of `work-item-form.test.ts` replaces `electron.dialog.showOpenDialog` in the main process. It runs after the setup case, whose `finally` removes the two setup files (lines 203-206), and it asks the page for a folder without the form. So the two cases share the app and nothing else. The case was read against its group. It is the one case of the file that asks for a folder. It holds the handler's wiring, and `pick-folder.test.ts` *chooseFolderDialog* holds the function alone. #148's rounds reviewed it, and this round reports no gap in it.
- `settle.ts` reads each work item's `decisions.md` and nothing else of a work item's directory (`settle.ts:113`, `#readSettle` at line 181). This work item has no `decisions.md`, and neither does any other work item in the tree. Executed: `node apps/desktop/scripts/settle.mjs --list` in the scratch clone exited 0 and printed "No decision was made without asking in this release.", and `git status --short` stayed empty after it. So the new settle keeps nothing of this work item and lists nothing of it. AgenticSeal's settle, which `--apply` runs, reads its `gaps.md` as before.
- The rule changes in merge order. #151's frame states no operation and #148's states eight. The plugin's `rule_changes.parse` and `apply_op` placed #148's eight operations and then this work's twelve, in that order, on the documents at HEAD, with no error and no unread line. Each of this work's four `change` texts in `docs/product.md` and `docs/roadmap.md` stands once at HEAD. The base's edits of `docs/architecture.md` and `docs/roadmap.md` stand in *Records are committed to the repository* and *Releases and the tracker*, and the operations of this work name neither section. Executed.
- `docs/` at HEAD differs from the base only in the five hunks of `docs/design.md` and `docs/design.ko.md` that round 7 read (`git diff --stat c193260 1335c85 -- docs`). `apps/desktop/package.json` is still at version 0.0.2, as `frame/plan.md` *Operational impact* says. The base added a script `settle` to that file and changed nothing else in it.

**The records against the merged tree.** No sentence of `routing.md`, `frame/`, `gaps.md`, `changelog.md` or `pr.md` is contradicted by what the merge brought. Each was read whole, and each was searched for the words the base touches: Browse, `pickFolder`, opacity, the screen, the focus, `OWLERY_BACKGROUND`, the settle, `work-item-form` and the four issue numbers. `gaps.md` row 20 names a failure of `theme-controls.test.ts` while a covered window may draw no frames. #153 makes a background window's page draw its frames under covering windows, which may remove that cause. The row leaves the file to the orchestrator's broad gate at HEAD and at the base, and that still holds. `changelog.md` makes no bullet of #148's or #131's fragment untrue, and neither fragment makes a bullet of this one untrue (`docs/roadmap.md` *Releases and the tracker*). Read.

`frame/plan.md` *Overlap with the release* still says that #119 merges first, and its *Judgments of the run* row of 2026-11-22 says "Merge order: #119, then this item". `frame/design.md` line 143 names "the type #119 names `CameLater`", and line 148 names "#119's `detail`", which takes a callback for "Reverse". At HEAD #119 has not merged. `feat/119-no-question-holds-an-agentic-run` stands at `cf26986` with no pull request. `last-look.ts:42` names the type `SinceRepositories`, and `git grep` finds neither `CameLater` nor "Reverse" in `apps/desktop/src`. The tree cannot say which item merges first, so this round asks it (*Not judged*). The plan's table also names no row for #148, whose case met this work in the conflict above. This record is that merge's report, as the #40 row names the round that reads its merge.

## Findings

This round opens no finding.

## Confirmations

```seal
confirms: round-7#1
```
What holds: the frame names the rewording of *Principles* rule 4. `frame/design.md:67` (*Scope* item 12), `frame/design.md:233` (the last row of *Removes*) and `frame/plan.md:78` (the new row of *Judgments of the run*) are each, byte for byte, the snippet round 7 gave. Executed: each snippet line was found whole with `grep -n -F -x`. The edit of `docs/design.md:14` and `docs/design.ko.md:14` that they name still stands at HEAD, since the merge changes neither file. Executed and read.

```seal
confirms: round-7#2
```
What holds: `gaps.md` row 21 says what each screenshot shows. It holds round 7's snippet whole (`grep -c -F` gives 1, at line 21): nine lines of the error in the inbox's preview and eight in the view, and no "Setup" section in the form's two screenshots. The screenshots are the same files as at `613ffd5`. The merge changes no file under `screenshots/` and no file of `apps/desktop/src/renderer/`. Executed and read.

What matched: the unit files that meet the merge pass at HEAD. `background.test.ts` and `pick-folder.test.ts` hold the base's two changes of the main process. `worktree-setup`, `pty`, `hooks`, `last-look`, `repositories`, `view`, `themes` and `daemon` hold this work. All ten files ran in one command, with `OWLERY_BACKGROUND=1`, in the scratch clone at `1335c85`: 783 of 783 passed. Executed.

## Not judged

| What | Location | Who answers |
|---|---|---|
| Whether #119 still merges before this item. Where it does, this branch takes #119 in, and the round after that merge reads the integration that `frame/plan.md` *Overlap with the release* puts in this work's rounds. Where it does not, the #119 row of that table, the *Judgments of the run* row "Merge order: #119, then this item", and `frame/design.md` lines 143 and 148, which name `CameLater` and #119's `detail` as if they stood in the tree, are rewritten to the order taken | `seal/threads/1795339001-worktree-setup/frame/plan.md:51`, `seal/threads/1795339001-worktree-setup/frame/plan.md:67`, `seal/threads/1795339001-worktree-setup/frame/design.md:143`, `seal/threads/1795339001-worktree-setup/frame/design.md:148` | the orchestrator |
| The suite, the typecheck and the documents' checks of the `Broad gate` key at HEAD, labelled `unverified`. This round ran ten unit files and `work-item-form.test.ts`. `gaps.md` row 1 gives the same label and answerer, which is honest | `seal/config.json` `Broad gate` | the orchestrator's broad run |
| Every built-app file but `work-item-form.test.ts` at HEAD. Each starts the app whose background window the merge now draws at opacity 0, `theme-controls.test.ts` of `gaps.md` row 20 among them. The owner's rule for this round allowed one built-app file | `apps/desktop/test/` | the orchestrator's broad run |
| Whether GitHub draws the seven images in the pull request's body. `613ffd5` is still on no remote branch (`git branch -r --contains 613ffd5` printed nothing) | `seal/threads/1795339001-worktree-setup/pr.md:20-26` | the orchestrator, once the branch is pushed |
| Q2 and Q3, carried from rounds 1 to 7 | `seal/threads/1795339001-worktree-setup/frame/questions.md` | a measurement by the owner or the orchestrator |

This round leaves no finding open. The orchestrator's answer on #119's order comes due first. Where this item goes first and the records are rewritten for it, a round or the sealer reads that change. After that, the orchestrator's broad run and the sealer's spawn come due.

## Probes

| Command | Result |
|---|---|
| `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs` over `test/background.test.ts`, `test/pick-folder.test.ts`, `test/worktree-setup.test.ts`, `test/pty.test.ts`, `test/hooks.test.ts`, `test/last-look.test.ts`, `test/repositories.test.ts`, `test/view.test.ts`, `test/themes.test.ts` and `test/daemon.test.ts`, in `apps/desktop` of the round's scratch clone at `1335c85` | exit 0; 10 files, 783 passed |
| `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/work-item-form.test.ts` in the same place, run once under `caffeinate -d -u -t 900`, which the round started and then stopped by its PID | exit 0; 9 passed |
| `node apps/desktop/scripts/settle.mjs --list` at the clone's root, then `git status --short` | exit 0; "No decision was made without asking in this release."; nothing changed |
| `python3 -I test_tmp_order.py <clone> 1795341002-settle-reads-decisions 1795343000-background-window-unseen 1795339001-worktree-setup`, which calls `rule_changes.parse` and `apply_op` of AgenticSeal 0.38.4 in that order | 0, 8 and 12 operations; each placed, no error, no unread line |
| `python3 -I test_tmp_rc.py <clone>`, this work's operations alone on the documents at HEAD | 12 operations, each placed; each `change` text found once |
| `git show --remerge-diff 1335c85` | one conflict, `apps/desktop/test/work-item-form.test.ts`, the header comment and the `node:fs` import, resolved to both sides |
| `git grep -n "CameLater\|Reverse" 1335c85 -- apps/desktop/src` | nothing printed |
