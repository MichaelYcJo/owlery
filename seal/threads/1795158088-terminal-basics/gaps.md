# Closing memo: 1795158088-terminal-basics

## Not verified

| Item | Who must answer |
|---|---|
| The suite, the typecheck of the whole project and the `Broad gate` command of `seal/config.json` at the head of the branch. Phase 1 ran nine test files in one command at `414d47f` and typechecked the files it changed. `25d8045` and `ec84d9c` after it change comments alone, and `test/terminal-basics.test.ts` and `test/menu.test.ts` ran at `ec84d9c`. The fix pass of review round 1 changed `test/terminal-basics.test.ts` alone and ran that file by itself at `597307b` | The orchestrator, in the broad run after the review rounds settle |
| A person's press of Command+W and of Shift+Command+W under the new menu. The cases send the key to the page through the debugging port, which goes past the system's menu, and read the menu's bindings as Electron built them. `frame/questions.md` Q4 holds the question | The owner's hand run in the built app, before the release |
| The menu as Electron builds it on a platform other than macOS. `test/menu.test.ts` reads the template for `linux` and `win32`, and no run built the menu there. That Electron's `windowMenu` role closes the window on Control+W there is a recollection nobody opened, and the template names no such role outside macOS | The owner, when a platform other than macOS is taken up. `docs/roadmap.md` *Goal* names macOS alone for this release |
| That `inboxKey` reads none of its keys while the dialog that asks before a close is open. `renderer.ts#onKey` hands it the same `dialogOpen` read as `commandKey` gets. The dialog opens only in a work item's view, where `inboxKey` reads no key for a second reason, so no case can go red on it | The proofer's round, by reading `apps/desktop/src/renderer/renderer.ts#onKey` |
| That Command+W never reaches the terminal of the pane in front. `renderer.ts#onCommandKey` stops the event for W on the lines it stops K and N on. No case reads what a terminal would send for the key | The proofer's round, by reading `apps/desktop/src/renderer/renderer.ts#onCommandKey` |

## Not done

Two things were within reach and not taken.

- **The dialog stays open where the session stops working while it asks.** `frame/design.md` *Scope* item 8 closes the dialog where the daemon no longer lists the pane, and names no other change of the pane. "Close pane" then closes a pane that would no longer have asked, which is what the person pressed.
- **`test/fixtures/receiver.sh` was not changed to serve these cases.** `test/korean-input.test.ts` runs it, and a pane file per pane id would change what that case reads. The terminal basics cases have a stand-in of their own, `test/fixtures/basics-shell.sh`, which repeats the receiver's four lines.
