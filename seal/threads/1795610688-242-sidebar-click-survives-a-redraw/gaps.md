# Closing memo: a click on a sidebar line survives a redraw

## Not verified

| Item | Who must answer |
|---|---|
| The full suite, and the built-app files other than `test/seal-back-view.test.ts`, `test/approval-line.test.ts` and `test/machine-dialog.test.ts`, each of which loads the window's bundle, and the bundle holds `src/renderer/renderer.ts` | the orchestrator's broad gate |
| Whether a release that a system popup takes on real hardware, such as the menu of a `<select>` in the sidebar's foot, still reaches the window as a `pointerup`. The probe of `trail/phases/phase-1.md` saw it arrive under CDP only. Where it does not arrive, the lists' drawing waits until the pointer next moves over the window, until the next press is released, or until the window loses the focus | the owner, in a walk of the built app: choose a theme in the sidebar's foot while an agent works, then check that the sidebar keeps changing without a click |
| That a click on a button of the Accounts dialog or the Machine dialog survives an `accounts` or a `machine` message that arrives during its press. Round 1's fix pass hands both dialogs' draws to the hold (`renderer.ts#drawAccountsDialog`, `renderer.ts#drawMachineDialog`), and no case runs them: the acceptance row of `frame/design.md` for these dialogs is read, and the hold itself is run by `press.test.ts` and the case of *Scope* item 4 | the next review round, by reading `renderer.ts#onMessage`; a case of its own, where the orchestrator judges one owed |
| Whether the lists may wait to be drawn for as long as a press lasts anywhere in the window, a drag in a terminal pane among them. The build stands on its default A (`frame/questions.md` Q1) | the owner |

## Not done

The daemon messages draw other parts of the window at once, outside the hold, and the phase did not read whether any of those draws replaces an element a person presses. `trail/phases/phase-1.md`, the last paragraph, lists each one by its message. Two of that list have left it since: round 1's fix pass hands the Accounts dialog's draw at `accounts` and the Machine dialog's draw at `machine` to the hold, as `frame/design.md` *Scope* item 2 now asks. `frame/design.md` *Scope* holds the rest out of the hold, so the work does not take them. Each belongs to an issue that the orchestrator files, beside the keyboard's place across a draw, which `frame/design.md` *Out of scope* already gives to an issue.
