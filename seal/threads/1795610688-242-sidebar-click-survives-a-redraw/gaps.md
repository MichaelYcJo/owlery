# Closing memo: a click on a sidebar line survives a redraw

## Not verified

| Item | Who must answer |
|---|---|
| The full suite, and the built-app files other than `test/seal-back-view.test.ts`, `test/approval-line.test.ts` and `test/machine-dialog.test.ts`, each of which loads the window's bundle, and the bundle holds `src/renderer/renderer.ts` | the orchestrator's broad gate |
| Whether a release that a system popup takes on real hardware, such as the menu of a `<select>` in the sidebar's foot, still reaches the window as a `pointerup`. The probe of `trail/phases/phase-1.md` saw it arrive under CDP only. Where it does not arrive, the lists' drawing waits until the next press is released or the window loses the focus | the owner, in a walk of the built app: choose a theme in the sidebar's foot while an agent works, then check that the sidebar keeps changing without a click |
| Whether the lists may wait to be drawn for as long as a press lasts anywhere in the window, a drag in a terminal pane among them. The build stands on its default A (`frame/questions.md` Q1) | the owner |

## Not done

The daemon messages draw other parts of the window at once, outside the hold, and the phase did not read whether any of those draws replaces an element a person presses. `trail/phases/phase-1.md`, the last paragraph, lists each one by its message. `frame/design.md` *Scope* limits the hold to the lists' draws, so the work does not take them. Each belongs to an issue that the orchestrator files, beside the keyboard's place across a draw, which `frame/design.md` *Out of scope* already gives to an issue.
