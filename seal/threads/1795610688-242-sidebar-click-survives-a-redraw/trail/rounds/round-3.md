# Review round 3: 1795610688-242-sidebar-click-survives-a-redraw

```seal
target: a28eabde, fixes 52455d16..a28eabde
```

This verifying round reviewed the fix diff `52455d16..a28eabde`: the routing row `7769a039` in `frame/plan.md`, the case `8cf3e6d2` in `theme-controls.test.ts`, the closing memo's row at `3c63fb64`, the close of round 2 at `20aa32b0`, and the orchestrator's fold of `frame/design.md` line 67 at `a28eabde`. It worked in the round 1 clone, fetched and checked out at `a28eabde`. Its `node-pty` was built for Electron 45.3.3 there, so the clone could run a built-app file.

Facts carried from rounds 1 and 2 as coordinates, not searched again: the hold's wiring at `press.ts#holdDraws`, the round 2 probe's record of what Chromium sends for a press with no `buttons`, and the list of every CDP press in the suite (the `mousePressed` search). The fix diff does not change the code any of them describes.

The records were read whole at `a28eabde`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `pr.md`, `trail/phases/phase-1.md`, `trail/rounds/round-1.md` and `trail/rounds/round-2.md`.

## Findings

## Confirmations

```seal
confirms: round-2#1
```
What holds: the case round 2 pasted stands as the last case of `theme-controls.test.ts` (lines 328 to 371), word for word. Its press is at line 357, and its wait for the rename field is at line 363. Executed in the clone at `a28eabde`: `node scripts/test-in-electron.mjs test/theme-controls.test.ts` passed 8 cases of 1 file, at a load average near 8. The close's red is read from the fix pass's output `fix-2/mutate-2.txt`. With `case "accounts"` drawing the dialog at once, the case failed at `theme-controls.test.ts:363` with "the window never showed the rename field of the account Work", and the other 7 passed. That line is the one the close names, and the failure belongs to the guard the case names. The orchestrator's fold of `frame/design.md` line 67 is round 2's sentence. `gaps.md` line 9 is marked `closed`, and it names the case for the Accounts dialog and round 2's reading for the Machine dialog. `gaps.md` line 7 adds `test/theme-controls.test.ts` to the files the phase ran. The verdict names `3c63fb64`, which touches `gaps.md`, a path of the finding's `location:`. The answer names `8cf3e6d2` for the case.

What matched: the hold cannot delay the view that `theme-controls.test.ts` line 78 waits for in `beforeAll`. Read: line 78 waits for the view of Alpha with a terminal on its stage, after the click on `#work-item-create`. The daemon answers that click with `workItemCreated`. `renderer.ts#onMessage` at that case adds the work item to `held.workItems` (line 1874), takes the pane with `takeStarted` (line 1882) and opens the view with `openView` (line 1886). `openView` brings the view to the front and calls `showView`, and `showView` puts the pane on the stage through `stageShows` (`work-item-view.ts:1304`). None of these calls goes through `draws.draw`. The hold keeps only `drawLists`, `drawAccountsDialog` and `drawMachineDialog`, and these draw a second time what is already on screen. So the view and its terminal show at `workItemCreated` whether or not a press is held. A press is not held at that point in any case. `BuiltApp.click` sends the release right after the press (`built-app.ts:291-292`). The fix pass's `fix-2/probe-log.txt` records each `pointerdown` of `beforeAll` followed by its `pointerup` within 3 ms, the press on `#work-item-create` among them. The three failures at line 78 happened at a load of 13 to 14. That line waits 15 s, the default of `BuiltApp.until` (`built-app.ts:277`), for a worktree to be cut and a shell pane started. The failures are consistent with that wait running out under load. One of them (`fix-2/mutate.txt`) is a run whose mutant changes only the Accounts dialog's draw, a path `beforeAll` never reaches. The doubt is closed by reading. The passing run of this round is consistent with it and is not a proof of it.

What matched: a CDP `mouseMoved` sent with no `buttons` between a press and its release could end the hold early, since `buttons` would then lack the main button. The `mouseMoved` lines of the suite stand at `screenshots.test.ts:421`, `terminal-basics.test.ts:351`, `terminal-basics.test.ts:488`, `terminal-basics.test.ts:693`, `terminal-basics.test.ts:943`, `terminal-basics.test.ts:970` and `work-item-menu.test.ts:77` (the helper `pointerTo`). Executed: `git grep -n '"mouseMoved"' -- test` printed exactly those lines, and `git grep -n -A4 '"mousePressed"'` over the two files the fix pass named showed what follows each press. In `terminal-basics.test.ts` and `work-item-menu.test.ts` each `mousePressed` is followed by its `mouseReleased`, with at most an `evaluate` between them (`terminal-basics.test.ts:730-732`). The moves at lines 488, 943 and 970 come before their presses. So no case moves the pointer during a held press. A case that did so would only draw at once, as every draw did at `ab7a5730`. No case in either file relies on the hold.

What matched: the new sentence of the file's header (`theme-controls.test.ts` lines 7 to 9) says what the last case does. The judgment row that `7769a039` added to `frame/plan.md` *Judgments of the run* names the routing that the fix pass followed.

## Not judged

| What | Location | Who answers |
|---|---|---|
| Whether a release that a system popup takes on real hardware reaches the window | `seal/threads/1795610688-242-sidebar-click-survives-a-redraw/gaps.md:8` | the owner, in a walk of the built app |
| `frame/questions.md` Q1, on which the build stands at default A | `seal/threads/1795610688-242-sidebar-click-survives-a-redraw/frame/questions.md:12` | the owner |
| The full suite and every built-app file other than `theme-controls.test.ts` at `a28eabde` | `apps/desktop/test/` | the orchestrator's broad gate |

## Probes

| Command | Result |
|---|---|
| `npx electron-rebuild --only node-pty -v 45.3.3`, from `apps/desktop` of the clone | ran: rebuild complete, inside the clone under the round's scratch |
| `node scripts/test-in-electron.mjs test/theme-controls.test.ts`, from `apps/desktop` of the clone at `a28eabde`, load average 8.4 before and 7.5 after | ran: 1 file, 8 cases passed, `beforeAll` among them |
