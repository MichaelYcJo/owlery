# Closing memo: the delete dialog names the queue and keeps its scroll (#249, #251)

## Not verified

| Item | Who must answer |
|---|---|
| The full suite, the typecheck and the broad gate at the work item's last commit. Phase 1 ran `test/view.test.ts`, `test/themes.test.ts`, `test/machine-dialog.test.ts`, `test/work-item-menu.test.ts` and `test/daemon-restart.test.ts`. Every other built-app file loads the window's bundle, which holds `src/renderer/renderer.ts` and `src/renderer/index.html` | the orchestrator's broad gate |
| An archive of a work item whose only session waits for the machine opens its dialog first (`frame/design.md` *Scope* item 3). The decision is `archive` in `renderer.ts`, through `sessionSections`, and no case reaches it with such a work item | the proofer reads `archive`; a built-app case for it is the review chain's call |
| How two session sections look under each other in the dialog before an archive, the repository's removal dialog and the dialog that asks before the daemon ends. No case and no screenshot shows them. The delete dialog's shot is phase 3's | the proofer reads the markup and the styles against `docs/design.md` *Components and their states* |

## Not done

Three comments state the old fact in words that still read true, and phase 1 left them as they are. `protocol.ts` says of `archiveWorkItem`, `removeRepository` and `deleteWorkItem` that `running` "names the running sessions the person was told of". The field's type is `Running`, whose doc comment now says it holds the headless sessions that work or wait for the machine, and the daemon's own `runningIn` (`daemon.ts:2035-2040` at HEAD) counts both as running. `daemon.ts:1128` says "Every running session is one the person was told of", in that daemon sense. `renderer.ts`, at `case "headlessDropped"`, says no dialog "that names the running sessions" changes when the daemon drops an ended session. An ended session is in neither section, so the sentence holds for both.
