# Closing memo: the window reads the lists again

## Not verified

| Item | Who must answer |
|---|---|
| The full suite, the typecheck of every package and the rest of the broad gate. Phase 1 ran only the cases of `apps/desktop/test/daemon.test.ts` that `trail/phases/phase-1.md` names, the built-app files `test/notification-click.test.ts` and `test/daemon-restart.test.ts`, and `tsc --noEmit` in `apps/desktop`. Every other test file that loads `src/daemon/daemon.ts` or `src/shared/protocol.ts` went unrun, and so did each file that calls the stand-in for `gh` in `test/chain-run.ts`, `test/chain.test.ts` among them, though phase 1 changed that stand-in. Phase 2 ran `test/refresh.test.ts`, `test/press.test.ts`, `test/themes.test.ts` and the built-app files `test/notification-click.test.ts`, `test/work-item-menu.test.ts` and `test/screenshots.test.ts` (`trail/phases/phase-2.md`). Every other built-app file, each of which builds the page that phase 2 changed, went unrun, and so did the count of table rows across the two editions of `docs/design.md` | the orchestrator's broad gate |
| That a client which closes while its `readLists` is answered is sent nothing. `answerReadLists` checks that the socket is still a client before each send, and no case can read what a closed socket did not receive (`trail/phases/phase-1.md`) | the proofer's reading of `daemon.ts#answerReadLists` |
| That the window says the daemon's refusal of a `readLists` in the status line. The module's end of a refused request is pinned by the unit case "ends at the error of its request" of `refresh.test.ts`, but no case of the built app makes the daemon's read throw, so the route of the `error` case of `renderer.ts#onMessage` to `refreshing.refused` ran in no case (`trail/phases/phase-2.md`) | the proofer's reading of the `error` case of `renderer.ts#onMessage` |
| That the refresh's arrows turn while its answer is on its way, and stand under the system's setting for less motion. The built-app case reads `aria-busy` and the words, and no case or shot reads the animation that `#refresh-lists[aria-busy="true"] svg` gives | the proofer's reading of the rule in `index.html`, or a person's look at the built app |
| That a window of this build tells the person, after 15 seconds, that a daemon of an earlier build did not answer, and keeps the notice of a daemon of another build after that sentence. The unit cases of the wait pin both with a stand-in wait, the second with the notice `view.ts#daemonNotice` gives, and no case runs the window against a daemon that drops the message, so the line of `renderer.ts` that gives the refresh `held.daemonNotice` ran in no case | the proofer's reading of `refresh.ts` and of its wiring in `renderer.ts` |

## Not done

**Only the inbox's shots are committed.** Every view of the screenshot run shows the sidebar's head, and the head row draws nothing that depends on the view. So the six shots of the inbox, one for each theme and appearance, show the row the work changes. The other 102 shots of the run, made at the merge of `release/v0.0.5` at `8a19d3e2`, stand in the crafter's scratch directory and are not committed. Grounds: `docs/design.md` *A pull request that changes the window carries its screenshots* asks for a shot of each view the pull request changed, and what this work changes in each view is the row these shots hold.

![The sidebar's head in Night watch, dark](../blob/247cfd6c6c79a13bc472c7eb02912192b8ef9188/seal/threads/1795632147-216-the-window-reads-the-lists-again/screenshots/night-watch-dark-inbox.png?raw=true)

![The sidebar's head in Night watch, light](../blob/247cfd6c6c79a13bc472c7eb02912192b8ef9188/seal/threads/1795632147-216-the-window-reads-the-lists-again/screenshots/night-watch-light-inbox.png?raw=true)

![The sidebar's head in Register, dark](../blob/247cfd6c6c79a13bc472c7eb02912192b8ef9188/seal/threads/1795632147-216-the-window-reads-the-lists-again/screenshots/register-dark-inbox.png?raw=true)

![The sidebar's head in Register, light](../blob/247cfd6c6c79a13bc472c7eb02912192b8ef9188/seal/threads/1795632147-216-the-window-reads-the-lists-again/screenshots/register-light-inbox.png?raw=true)

![The sidebar's head in Desk, dark](../blob/247cfd6c6c79a13bc472c7eb02912192b8ef9188/seal/threads/1795632147-216-the-window-reads-the-lists-again/screenshots/desk-dark-inbox.png?raw=true)

![The sidebar's head in Desk, light](../blob/247cfd6c6c79a13bc472c7eb02912192b8ef9188/seal/threads/1795632147-216-the-window-reads-the-lists-again/screenshots/desk-light-inbox.png?raw=true)

**No shot shows the refresh button while it works.** `frame/questions.md` Q1 stands on its default (a), the head row at rest. A shot of the working form would need the run's stand-in for `gh` to hang for one pull request while the run presses the button, and a view added to the run's list in both editions of `docs/design.md`. Grounds: the default of Q1, taken under the routing answer Automation yes.
