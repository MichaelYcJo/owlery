# Implementation Plan: 1795343000-background-window-unseen

## Technical context

The tree as read at `e6937ca`. Phase 1 stands in it, built at `dd022bb` before this frame was drawn (`frame/design.md` *Grounding*).

The work builds on four places, each read:

- `apps/desktop/src/main/background.ts:33-37`, `showInBackground`, which the window of a background start passes through. Its one caller is `apps/desktop/src/main/main.ts:152`, `if (background) showInBackground(win)`, inside `createWindow`, whose window is built with `show: !background` at `main.ts:127`. So the window is first shown by `showInactive()`, after `setOpacity(0)`.
- `apps/desktop/src/main/main.ts:170-174`, the handler of `Channel.pickFolder`, which opens `dialog.showOpenDialog` as a sheet of the window that asked. A sheet is a window of its own, and nothing sets its opacity.
- `apps/desktop/src/main/pick-folder.ts:9-16`, `OpenFolderDialog` and `pickFolder`, which take the dialog as a function so the cases run without Electron.
- `apps/desktop/src/main/links.ts#chooseOpener`, `src/main/paths.ts#chooseFinder` and `src/main/clipboard.ts#chooseClipboard`, which each give a stand-in for the system's act in the background. `chooseFolderDialog` takes the same shape.

The constraint is that every built-app case, `pnpm run screenshots` and `measure:memory` read a window that is shown, of 1440 by 900, whose page is visible and draws its frames. `BuiltApp.start` refuses a page of another size.

The failure scenario of the chosen approach, six months on: a later macOS or Electron counts a window at alpha 0 as occluded and throttles its page. The cases that wait on the page's frames or on `matchMedia` then time out on the runner, and `measure:memory` throws its runs away as hidden. The pull request's `check` run on GitHub's macOS runner is where that shows first, and the answer then is `backgroundThrottling: false` under the switch, which the issue's second line already names. A second scenario: a later change adds another surface that opens in its own window, such as a message box or a save dialog, and nothing makes it transparent or holds it back under the switch. The rule at `docs/architecture.md` *Screen framework: Electron*, as *Rule changes* rewrites it, is what a reviewer reads that change against. No case lists the surfaces.

The command that read *Rule changes* (executed, read-only, from the framer's scratch directory): `python3 -I test_tmp_from_in_section.py`, which imports the plugin's `skills/settle/scripts/rule_changes.py`, calls `parse(text, "docs")` on `frame/design.md` and, for each operation, `section_lines` on its document. It printed no error and no unread line, and each `from` occurs once in its section.

## Alternatives considered

| Approach | Failure scenario | Verdict |
|---|---|---|
| Draw the shown window at opacity 0 (`setOpacity(0)` before `showInactive()`) | A later macOS counts the window occluded and throttles its page (*Technical context*) | Chosen. It keeps the window's size and place, and at opacity 0 the page stayed visible at 145 frames a second under another app's window (`trail/phases/phase-1.md`, executed by the crafter) |
| Place the window where no display shows it | macOS holds a window's frame on a screen, and where that is depends on the person's arrangement of displays. A display arranged at the chosen place shows the window. `BuiltApp.start` refuses a page of another size if the system shrinks the window to fit | Rejected. Its result depends on each machine's displays, and the window was still drawn at full opacity wherever a display stood |
| Replace the shown native window with offscreen rendering (`webPreferences.offscreen`) under the switch | The page then draws through another compositing path. `measure:memory` would measure that path and not the one a person's window takes, and the GPU process figures would stop standing for a person's start | Rejected. The premise that keeps the shown window: at opacity 0 it measures like a composited window. `measure:memory` read 142.3 and 228.1 MB at opacity 0, and 142.6 and 236.1 MB at 0.01, within the runs' spread (`phase-1.md`, executed by the crafter) |
| Never show the window under the switch | A hidden page is `hidden` and draws no frame, as the opacity 1 row of `phase-1.md`'s table shows for a covered window. The cases that wait on frames fail | Rejected |
| Set `backgroundThrottling: false` under the switch as well | None at opacity 0 on the measured Mac. It adds a setting that makes a background page draw where a person's would not | Rejected by the measurement. The issue asks for it only where the page throttles, and it did not |
| In the background, give the folder dialog a stand-in that opens nothing and answers that no folder was chosen (`chooseFolderDialog`) | A later case that wants a folder from Browse in a background start gets null. It must fill the field itself, as the cases do today | Chosen. It is the shape of `chooseOpener`, `chooseFinder` and `chooseClipboard`, and it decides the question of whether the sheet takes the parent's opacity without a run that would draw the sheet on the owner's screen (round 1 *Not judged*) |
| Open the folder dialog as a window of its own, not a sheet | A dialog with no parent is a window at full opacity on the screen | Rejected |
| Hide the Browse button under the switch | The page under the switch then differs from a person's, and the screenshots capture that page | Rejected |
| Hold back the system notifications under the switch in this work as well | It reaches into the page (`src/renderer/renderer.ts:1192`), and the system draws the notifications, not the window | Out of this work. The issue's subject is the window, and round 1 *Not judged* routes the notifications to the orchestrator as a follow-up |

## Phases

| Phase | Delivers | Verified by | Status |
|---|---|---|---|
| 1 | `frame/design.md` *Scope* item 1 | `background.test.ts` *showInBackground* seen red against the old function. `seal mutate` on `src/main/background.ts`, with no mutant surviving. The window server's watcher across six starts. The built-app files `trail/phases/phase-1.md` names, `pnpm run screenshots` and `measure:memory`, one at a time. All executed by the crafter | `dd022bb` |
| 2 | `frame/design.md` *Scope* items 2, 4 and 5, the fix pass of round 1 | `pick-folder.test.ts` *chooseFolderDialog* seen red with the background branch of `chooseFolderDialog` removed. `node scripts/test-in-electron.mjs test/pick-folder.test.ts test/background.test.ts` in `apps/desktop` | `6efb9e9` |

*Scope* item 3 is this frame's own `## Rule changes`, which the settle writes, so no phase builds it.

## Overlap with the release

The spawn names no other work item by id. The open issues of the milestone `release: 0.0.2` with a branch in this clone were read: `feat/119-no-question-holds-an-agentic-run` at `fd1cb72`, `feat/131-the-settle-reads-no-decisions` at `79bac46` and `feat/97-a-new-worktree-has-no-ignored-files` at `da9d77a`, each by `git diff --name-only` against its merge base with `origin/release/v0.0.2` and by the `section:` lines its frame adds (executed). `gh pr list --base release/v0.0.2 --state open` printed none (executed). #131 changes no file or section this work changes. #119 meets it, and #97 meets it at `apps/desktop/test/work-item-form.test.ts`, which round 2's fix pass changed at `7ef8dfb`:

| Work item | Where both change | Merges first | Grounds |
|---|---|---|---|
| #119, `feat/119-no-question-holds-an-agentic-run` | `docs/design.md` *A pull request that changes the window carries its screenshots*, the paragraph on `pnpm run screenshots`, and its Korean edition: #119 rewrites its sentence on the invented work items in its branch, and this design's operations name the sentence before it. `apps/desktop/test/built-app.ts` *BuiltApp.start*: this branch rewrote its docstring at `dd022bb`, and #119 adds `writeRun` to the same docstring and signature | #148 | This is the smaller diff and the nearer to its seal, and `routing.md` merges it ahead of the other work items, which take it in when they merge the base. `git merge-tree b8c1190 HEAD feat/119-no-question-holds-an-agentic-run` printed no conflict marker (executed). #119's sentence leaves this design's `from` as it stands, so the settle still finds it |
| #97, `feat/97-a-new-worktree-has-no-ignored-files` | `apps/desktop/test/work-item-form.test.ts`: each branch adds a case and an item to the file's header comment, and #97 widens the `node:fs` import below that comment. `7ef8dfb` also starts the file's app with `inspectMain` | #148 | `routing.md` merges this item ahead of the other work items, which take it in when they merge the base. `git merge-tree --write-tree HEAD da9d77a` at `34ad3b3` printed one conflict hunk, the header comment's last items with the import line under it (executed). #97 resolves it at its merge of the base by keeping both items and its own import line. The two cases and the `inspectMain` start merged without a conflict |

## Operational impact

None. No migration, environment variable or dependency is added, and nothing breaks a deployer's start. The version does not move in this pull request.

## Judgments of the run

| Date | Judgment | Grounds | Judged against |
|---|---|---|---|
