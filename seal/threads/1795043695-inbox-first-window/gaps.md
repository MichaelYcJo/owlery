# Closing memo: 1795043695-inbox-first-window

## Not verified

| Item | Who must answer |
|---|---|
| The suite, the typecheck and the documents' checks as the `Broad gate` of `seal/config.json` runs them: phase 1 ran `test/view.test.ts` at `88a8f93`, and the package's own `tsc --noEmit` once at the tree that commit holds, before the commit. No workflow under `.github/workflows/` runs the suite (`seal deferrals . --kind all`) | the orchestrator, by the broad run after the last phase |
| The parts of `src/renderer/renderer.ts` phase 1's drive did not reach, which no case covers either: an exited pane that keeps its tab and its last screen; the pane last in front coming back in a view with two tabs; a pane started from a view whose answer arrives after the person returned to the inbox; a pane another client opens while the view is on screen; a refused `start` or `ask` in the status line; "Reconnecting to the daemon…" and the reload after the daemon went away; the terminal fitted again when the window is resized; and output that arrives before its replay, which the guard drops | a person at the built app, or a later drive |
| A pane of the state-reporting kind running the real agent CLI inside a work item's view: the drive's `SHELL` ran `/bin/cat` in its place, so the "+" button of that kind and the form's choice of it were shown with a stand-in | a person at the built app with their own CLI |
| What a person's hand does: the drive pressed with pointer events at each control's middle and typed with `Input.insertText` through the debugging port, and set the form's three fields by script. The Enter key in the "Ask" field, the Tab order of the two screens and a screen reader's reading of a line, whose button's name ends with "No seal yet", were not tried | a person at the built app |
| The notification macOS shows: the drive replaced `window.Notification` with a recorder | a person at the built app |
| The two lines of terminal output the drive's claims rest on were read in screenshots and not by the probe: `35 108` after `stty size` (`shot-1-alpha-view.png`), and the replayed commands on screen after the reload (`shot-4-alpha-view-after-load.png`). The probe itself checked the `resize` frame of 108 by 35 and that the replay frame held the marker | a reader of the two screenshots in the phase's scratch, or a later drive that keeps the whole replay |
| How the two screens look to a person: a long title or branch cut on a line, many tabs in the pane bar, a narrow window, and the dimmed emblem at 20 pixels | the owner, with the mockup of phase 2 |
| Whether each of the 14 mutants `seal mutate` reported red only in the call of 19 failed on the line that watches its unit: that call prints the verdict and the exit code. Five mutants were also run alone, and `trail/phases/phase-1.md` gives their failing lines | a reader re-running one pair alone |
| A daemon an earlier build left running with a pane that has no work item: `frame/plan.md` *Operational impact* says the new window gives it no tab. The drive's daemons never held one | a measurement: one `start` without `workItemId` sent by a second client, then the window's tabs read |

## Not done

- **An exited pane the window holds no terminal for cannot be closed from the window.** `paneTabs` gives it no tab (`frame/design.md` *Scope* item 5), so after a reload nothing in the window sends its `close`. The daemon lists it until the daemon exits. The frame names the tabs and not what removes such a session.
- **A pane's process starts at a size that is not its terminal's.** A work item created from the inbox screen starts its pane at 80 by 24, and the first pane of a view started from a button does the same. The terminal sends its fitted size when it is made, a moment later. A program that prints at start may wrap its first lines at the wrong width. Measuring the stage without a terminal was within reach and adds a second way to size a pane; `trail/phases/phase-1.md` gives the grounds.
- **A pane this window started is replayed to it.** Every terminal attaches, so the daemon sends the pane's output so far once more, in the replay. For a new pane that is a few bytes.
- **A process's exit that arrives before the replay is drawn above it.** The window writes the "process exited" line when `exit` arrives, and the guard holds back `output` alone.
- **Each `inbox` redraws the lines and the tabs whole.** The keyboard's place on a line or a tab is lost at the next message. `frame/plan.md` *Technical context* names it as the chosen approach's cost.
- **A headless answer that arrives while the inbox screen is in front shows nowhere** until its work item's view is opened (`frame/plan.md` *Technical context*). The inbox line says nothing of a headless session (*Scope* item 16).
- **No key returns to the inbox.** The control is the "← Inbox" button alone. The frame names no shortcut.
- **The pane bar does not scroll.** With more tabs than the bar's width holds, the tabs shrink and then run under the "+" buttons. Laying the bar out is phase 2's, with the mockup.
- **The form remembers the kind last chosen** for the life of the page, as it did before this work, and preselects the state-reporting kind only at the first opening.
- **The first lines of `README.md` still say "There is no code yet".** The README's opening is issue #21's (`frame/design.md` *Scope* item 16).
