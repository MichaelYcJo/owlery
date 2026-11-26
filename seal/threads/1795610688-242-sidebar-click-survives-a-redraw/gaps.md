# Closing memo: a click on a sidebar line survives a redraw

## Not verified

| Item | Who must answer |
|---|---|
| closed The full suite, and the built-app files other than `test/seal-back-view.test.ts`, `test/approval-line.test.ts`, `test/machine-dialog.test.ts` and `test/theme-controls.test.ts`, each of which loads the window's bundle, and the bundle holds `src/renderer/renderer.ts` | answered: the broad gate passed at `f93485fd`, the last run of this work item's `trail/gate.md`, after which only the work item's records changed (`git diff --name-only f93485fd e9d113e8` outside its directory prints nothing); the `check` workflow passed on pull request #253 at `e9d113e8`, the head it merged from |
| closed Whether a release that a system popup takes on real hardware, such as the menu of a `<select>` in the sidebar's foot, still reaches the window as a `pointerup`. The probe of `trail/phases/phase-1.md` saw it arrive under CDP only. Where it does not arrive, the lists' drawing waits until the pointer next moves over the window, until the next press is released, or until the window loses the focus | re-homed to issue #184, in a comment of the settle of release 0.0.5 that lists the row |
| closed that a click on a button of the Accounts dialog or the Machine dialog survives an `accounts` or a `machine` message that arrives during its press | the Accounts dialog: the last case of `apps/desktop/test/theme-controls.test.ts` presses an account's Rename button while a second client adds an account, and fails with `case "accounts"` drawing the dialog at once (round 2's fix pass). The Machine dialog: round 2 read that `machine.ts#showMachine` replaces only list entries that hold no control, so no press on it can be lost (`trail/rounds/round-2.md`, finding 1) |
| closed Whether the lists may wait to be drawn for as long as a press lasts anywhere in the window, a drag in a terminal pane among them. The build stands on its default A (`frame/questions.md` Q1) | re-homed to issue #184, in a comment of the settle of release 0.0.5 that lists the row |

## Not done

The daemon messages draw other parts of the window at once, outside the hold, and the phase did not read whether any of those draws replaces an element a person presses. `trail/phases/phase-1.md`, the last paragraph, lists each one by its message. Two of that list have left it since: round 1's fix pass hands the Accounts dialog's draw at `accounts` and the Machine dialog's draw at `machine` to the hold, as `frame/design.md` *Scope* item 2 now asks. `frame/design.md` *Scope* holds the rest out of the hold, so the work does not take them. Each belongs to an issue that the orchestrator files, beside the keyboard's place across a draw, which `frame/design.md` *Out of scope* already gives to an issue.
