# Phase 1: 1795610688-242-sidebar-click-survives-a-redraw

## What this phase found

**The frame holds against the tree.** The build started at `35956132`, which adds only the frame to `80917d43`, so each coordinate of `frame/design.md` *The code as it stands* stated the tree the build started from. The two `git grep` commands of the design's last scenario printed the lines the scenario lists, and `git grep -n 'listInFront()?.show()' -- apps/desktop/src` printed `renderer.ts` lines 342, 1556, 1807 and 1828. Executed.

**After the build, the acceptance commands print what the plan's *Verified by* cell asks.** At `6a423a33`, `git grep -n -A1 'for (const deadline' -- apps/desktop/test | grep 'app.click('` and `git grep -n -e 'replaces its buttons' -e 'made again until the view shows' -- apps/desktop` each print nothing. `git grep -n 'listInFront()?.show()' -- apps/desktop/src` prints two lines: line 347 in `showNarrowed`, and line 1547 in `drawLists`. Executed.

**`frame/design.md` *Scope* item 6 is held by the design's `## Rule changes`, and the phase edits no policy document.** The work item's subject is the code. A work item of that kind states the rules it changes in `## Rule changes`, and the settle after the release writes them into `docs/architecture.md` and `docs/architecture.ko.md`. A direct edit would leave two statements of one rule for the settle to choose between. Judged against `skills/implement/SKILL.md` *Document layout — two roots, three lifetimes*, the row of the policy root. `git log -- docs/architecture.md` shows only settles and policy work items editing the file. Executed.

**`frame/questions.md` Q2 is answered by the work: the window holds one open socket to the daemon.** `Runtime.queryObjects` on `WebSocket.prototype` in the built app found the window's socket, and the case keeps only an open socket whose `url` is `ws://127.0.0.1:<port>/`, the port that `run/daemon.json` names. That is option B's filter. The case asserts that exactly one socket passes it, and the assertion passed in the phase-boundary run. The comparison is an equality with the trailing slash that `WebSocket.url` adds, and not a prefix, so a port such as 1234 cannot match a socket on 12345. Executed.

**The `accounts` and `machine` messages now draw everything `drawLists` draws.** At `80917d43` they drew the sidebar, the list in front and the view. They now also draw the summary in front, the archived screen's fallback to the inbox and the six open dialogs. `frame/design.md` *Scope* item 2 asks for this, since one function holds the draws and all three messages call it. Each `inbox` already drew all of those, and an `inbox` comes far more often than either message, so no dialog meets a draw it did not meet before. Read.

**The `inbox` case's `showSignIn` stays outside the hold.** `frame/design.md` *Scope* item 2 names the draws that move into the one function, and the sign-in pane of the Accounts dialog is not among them. Read.

**The unit cases were seen red against a hold that runs every draw at once.** `press.ts` was first written with `drawHold` returning a hold whose `draw` called the draw at once, and the wiring in place. `node scripts/test-in-electron.mjs test/press.test.ts` failed 6 of the 10 cases. The four that passed assert behaviour the stub also had: a draw with no press runs at once, the listeners are in the capture phase, and a `pointercancel` and a `blur` each end the hold. Contract rule 15 has each of those shown red with its own guard removed, in the mutation table below. Executed.

**Each guard of `press.ts` goes red when it is broken alone, after one case was added for a guard that survived.** Each row is a `seal mutate src/renderer/press.ts --replace … --tests "node scripts/test-in-electron.mjs test/press.test.ts"` run from `apps/desktop`, after the commit. The first run of the fourth row survived: no case pressed and released with no draw asked for. Commit `6a423a33` changed the second case to make that press and check that no task is scheduled, and the rerun of the row went red on that line (`press.test.ts:59`). Executed.

| Unit | Break | Verdict |
|---|---|---|
| `drawHold` | a draw during a press runs at once (`if (false)`) | red |
| `drawHold` | a draw with no press is kept (`if (true)`) | red: the at-once case, the case of a draw between the release and its task, the other-button case, and the `pointercancel` and `blur` cases |
| `drawHold` | the task does not check for a press begun after the release | red |
| `drawHold` | a draw made at once leaves its kept copy for the task | red |
| `drawHold` | a release schedules a task with nothing kept | survived, then red after `6a423a33` |
| `drawHold` | the release runs the kept draws itself, not in a later task | red |
| `drawHold` | the task leaves `scheduled` set | red |
| `holdDraws` | every button's press begins the hold | red |
| `holdDraws` | no `pointercancel` listener | red |
| `holdDraws` | no `blur` listener | red |
| `holdDraws` | a release of any button ends the hold | red |
| `holdDraws` | the `pointerdown` listener is outside the capture phase | red |

The break `release` without its `if (!pressed) return;` was not run. A release with no press held then finds nothing kept, or finds a task already scheduled, so it returns before scheduling anything. No case can tell that mutant from the code.

**The built-app case was seen red with every draw at once, through `seal mutate` and not through `renderer.ts` as at `80917d43`.** The plan's *Verified by* cell asks for the red against `renderer.ts` as at `80917d43`. The run replaced `const draws = holdDraws(window);` with `const draws = { draw: (draw: () => void): void => draw() };`, so all three messages draw at once, as `80917d43` draws. `seal mutate` restores the file from the bytes it read, and the crafter restores no file from HEAD. The command was `seal mutate src/renderer/renderer.ts --replace … --tests "node scripts/test-in-electron.mjs test/seal-back-view.test.ts -t pressed" --timeout 400`, run from `apps/desktop`. The new case failed at line 230 with `the window never showed the view of the work item whose line was pressed`. That is the line of the scenario "A click on a sidebar line across a draw", and it names the hold. The case's `drawnWhilePressed` check of the hold comes after that line, so it was not reached in that run. Executed.

**The phase-boundary set passed in one command at `6a423a33`.** From `apps/desktop`: `node scripts/test-in-electron.mjs test/press.test.ts test/themes.test.ts test/seal-back-view.test.ts test/approval-line.test.ts test/machine-dialog.test.ts` gave 5 files and 42 cases passed, none skipped. `test/themes.test.ts` is in the set because it reads each module of `src/renderer/` by listing the folder, and `press.ts` is a new module there. The repository's guide names no tree-wide test files. The first case of `seal-back-view.test.ts` and the single clicks of `approval-line.test.ts` and `machine-dialog.test.ts` passed on their first run. No case was re-run. Executed.

**The other built-app files load the window's bundle, which holds `renderer.ts`, and were not run.** The cases are the app project of the suite, and running them is the broad gate's (contract rule 2). `gaps.md` names them. Read.

**A probe found that a press on a `<select>` and on a scrollbar each still send the window a `pointerup`.** Under CDP's `Input.dispatchMouseEvent` in Electron 45.3.3, a press and a release on a `<select>` sent `pointerdown`, then `pointerup` and `click` on the select, and a second `pointerup` after Escape closed its popup. A press on the scrollbar of an `overflow-y: scroll` element sent `pointerdown` and `pointerup`. So the hold ends at those releases, and the phase adds no end of the hold beyond the ones `frame/design.md` *Scope* item 1 names. The probe is `test_tmp_ends/main.js` under the crafter's scratch directory `phase-1/`. A release that a system popup takes on real hardware may behave otherwise, and `gaps.md` names it. Executed, under CDP only.

**The runs used the main checkout's Electron binary.** The worktree's `electron` package holds neither `dist/` nor `path.txt`. Each run set `ELECTRON_OVERRIDE_DIST_PATH` to `node_modules/.pnpm/electron@45.3.3/node_modules/electron/dist/Electron.app/Contents/MacOS` of `/Users/yc/Documents/GitHub/owlery`, the version `apps/desktop/package.json` pins. Executed.

**The typecheck passed, and the repository configures no linter or formatter.** `tsc --noEmit` over `apps/desktop` passed after each change. Executed.

**Other draws that a daemon message makes still run at once, outside the hold.** Each case of `renderer.ts#onMessage` was read for the draws it calls. Outside `drawLists`, the cases call `showSignIn` at `inbox`; `showAccountsEntry` and `showAccounts` at `accounts`; `showKeepAwake` and `showStatus` at `keepAwake`; `showMachine` at `heavyRuns`; `showMachineEntry` and `showMachine` at `machine`; `showStatus` at `agentNotice`; `takeStarted` at `started` and `workItemCreated`; `takeHeadlessSession` at `asked` and `headless`; and the back's draws at `gateOutput`, `sealRecords` and `ledger`. The phase did not read whether each of them replaces an element a person presses. `frame/design.md` *Scope* holds them out, `ready` and the "Ask" section by name and the rest by naming only the lists' draws. `gaps.md` *Not done* holds them. Read.
