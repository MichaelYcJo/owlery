# Closing memo: the delete dialog names the queue and keeps its scroll (#249, #251)

## Not verified

| Item | Who must answer |
|---|---|
| The full suite, the typecheck and the broad gate at the work item's last commit. Phase 1 ran `test/view.test.ts`, `test/themes.test.ts`, `test/machine-dialog.test.ts`, `test/work-item-menu.test.ts` and `test/daemon-restart.test.ts`. Every other built-app file loads the window's bundle, which holds `src/renderer/renderer.ts` and `src/renderer/index.html` | the orchestrator's broad gate |
| An archive of a work item whose only session waits for the machine opens its dialog first (`frame/design.md` *Scope* item 3). The decision is `archive` in `renderer.ts`, through `sessionSections`, and no case reaches it with such a work item | the proofer reads `archive`; a built-app case for it is the review chain's call |
| How two session sections look under each other in the dialog before an archive, the repository's removal dialog and the dialog that asks before the daemon ends. No case and no screenshot shows them. The delete dialog's shot is phase 3's | the proofer reads the markup and the styles against `docs/design.md` *Components and their states* |
| That the tooltip under the pointer stays open while a dialog draws again. The cases of phase 2 read that the row under it is the same element after an `inbox` (`isConnected`). Chromium draws the tooltip, and no case reads it on the screen | the proofer reads the cases; a person at the built app, where the orchestrator judges a look is worth it |
| The dialog before an archive and the dialog that asks before the daemon ends keep their session lists at an `inbox`. They draw through `drawSessions`, which the removal and delete cases of `work-item-menu.test.ts` watch, and no case keeps one of these two dialogs open across an `inbox` | the proofer reads that `showArchive` and `showDaemonEnding` call `drawSessions` and draw no other list |

## Not done

Three comments state the old fact in words that still read true, and phase 1 left them as they are. `protocol.ts` says of `archiveWorkItem`, `removeRepository` and `deleteWorkItem` that `running` "names the running sessions the person was told of". The field's type is `Running`, whose doc comment now says it holds the headless sessions that work or wait for the machine, and the daemon's own `runningIn` (`daemon.ts:2035-2040` at HEAD) counts both as running. `daemon.ts:1128` says "Every running session is one the person was told of", in that daemon sense. `renderer.ts`, at `case "headlessDropped"`, says no dialog "that names the running sessions" changes when the daemon drops an ended session. An ended session is in neither section, so the sentence holds for both.

Phase 2 left the dialog of the records place with its own variable, `recordsDrawn`, and did not move it onto `drawWhereChanged`. *Removes* in `frame/design.md` does not name it, and *Scope* items 6 to 8 name the delete, removal and session dialogs alone. Moving it would change a dialog this work item has no case for. The two forms compare the same way, so a later change that moves it replaces one comparison with a call.
