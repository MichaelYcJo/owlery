# Phase 4: 1795158088-terminal-basics

## What this phase found

**The frame holds for this phase, with one consequence it does not name.** The phase started from `f5df7d4`, the last commit of the fix pass that followed round 3. Each thing of the installed versions the fold builds on for items 16 to 19 was opened and stands: `hasSelection`, `getSelection`, `selectAll`, `clear`, `reset`, `paste` and `input` in xterm 6.0.0's typings, the terminal's own listener for `contextmenu` in `node_modules/@xterm/xterm/lib/xterm.js`, and `BrowserWindow.hide`, `isVisible`, `isFullScreen`, the window's `close` and `leave-full-screen` and the app's `before-quit` and `activate` in Electron 45.3.3's. The consequence is the first entry under *Departures from the frame*.

The phase's code is in `9d3d269`. `b9556b6` and `9e3e0ad` take out three lines no case could see, `5d2d390` adds steps to the menu's case, and `4817072` changes one comment.

### Q7 is answered (a)

A press of the right button through the debugging port, `Input.dispatchMouseEvent` with `button: "right"`, raises `contextmenu` where the pane's element reads it, on Electron 45.3.3. The listener stands on the pane's element and not on the capture phase, so the terminal's own listener has run by then. Scenario 21 is a case of the built app, and the press is the port's and not an event the case makes in the page. Judged against `frame/questions.md` Q7.

Two things the terminal does at that press shape the code. It takes the keyboard, so the pane is in front before the menu opens, and the window's listener has no line for that. On a Mac it selects the word under the pointer (`rightClickSelectsWord`, xterm's default there), so "Copy" can be pressed after a press on a word, and is disabled after a press on an empty row, which is where the case presses.

### Departures from the frame

Each was judged against `frame/design.md`, in the section named.

- **A program's modes are lost after "Clear Screen", once the pane leaves the stage and comes back.** *Scope* item 17 has the daemon forget what the pane printed, and item 16 has "Clear Screen" keep the terminal's modes, since only "Reset Terminal" is said to end them. Both hold in the window that cleared. A pane that returns to the stage is drawn from the daemon's replay into a terminal that `view.ts#screenTurns` reset when the pane left, and the replay no longer holds the sequences that set the modes. One probe saw it, `test/test_tmp_modes.test.ts`, a copy of the built-app file with the steps reordered: after "Clear Screen", another tab and back, a paste reached the pane's process as `from the clipboard`, without the brackets it had before the tab was left. For Claude Code that means a paste of several lines is read as typed lines until the program asks for brackets again. `frame/plan.md` *The failure scenarios of what the fold adds* does not name it. The phase built `forget` as framed. Keeping the modes needs a `forget` that carries what the daemon keeps in place of the output, or a daemon that reads the sequences, and both change the message the frame states. `gaps.md` *Not done* holds the entry.
- **Scenario 21's steps run in another order.** Its row has "Reset Terminal" and its paste after the pane's return to the stage. By then a paste has no brackets whatever "Reset Terminal" did, for the reason above, so that assertion could not fail. The case pastes after "Clear Screen" and reads the brackets, presses "Reset Terminal" and reads a paste without them, and only then leaves the stage and comes back.
- **"Select All" and "Copy" put everything the pane printed on the clipboard.** Scenario 21 says the clipboard then "holds the URL the pane printed". It holds the URL and, on the next line, the words of the named link. The case reads both.
- **A second `contextmenu` on a pane opens the menu where it was pressed.** *Scope* item 16 lists a second `contextmenu` among what closes the menu. The press of the button that raises it is a press outside the menu, which closes it, and the event then opens the pane's menu at the new place. A `contextmenu` on the menu itself closes it and opens nothing.
- **The arrows move through the items that can be pressed, and go round.** Item 16 says they "move through its items". A disabled "Copy" is passed over. From the menu itself, where the keyboard starts, the down arrow goes to the first item and the up arrow to the last.
- **`view.ts` gains two names *Data & interfaces* does not list.** `PANE_KEY_BYTES` gives the byte for each thing `paneKey` returns, so the key handler holds no byte of its own. `cardStaysAt`, which the fix pass after round 3 added, says whether the card stays at a key.

### Decisions made while writing the code

- **The menu's element is made when it opens and removed when it closes.** *Scope* item 16 has the renderer's read answer true "where an element with the role `menu` stands in the page", so the element's presence is the open state, and `renderer.ts#dialogOpen` reads `dialog[open], [role="menu"]`.
- **The menu takes the keyboard while it is open**, on its own element first. The arrows and Escape are then the menu's, and no key reaches the pane's process, which the case reads. Closing gives the keyboard to the terminal the menu was for.
- **"Paste" does nothing where the screen went to another pane before the main process answered.** The clipboard is read by a request, and the answer comes later.
- **"Clear Screen" and "Reset Terminal" send `forget` before they touch the terminal**, as item 16 orders them.
- **An item pressed for a pane the screen no longer holds does nothing.** `gaps.md` *Not done* holds what that leaves open.
- **The menu is moved up and left where it would pass the window's foot or its right edge.** Item 16 asks for both. Only the foot has a case: the view's right column, 420 pixels wide, stands between every pane and the window's right edge (`index.html`, `#work-item-view`). `gaps.md` *Not verified* holds the row.
- **`paneKey` reads Enter before it reads the keyboard**, so Shift+Enter is a line feed on every keyboard, as phase 2 built, and the three editing keys are read on a Mac keyboard alone. Judged against items 5 and 18.
- **The window is shown at `activate` only where it is not visible.** A click on the Dock icon also arrives while the window is on screen. Judged against item 19.
- **A full-screen window hides at its `leave-full-screen`**, listened for once. Item 19 gives that order.
- **`quitting` is set at `before-quit` and never taken back.** Nothing in the app refuses a close once Quit was chosen.
- **`OutputBuffer.clear` empties the count as well as the pieces.** A buffer that kept its count would drop a line of the output after the clear too early.

### What was seen red

Each case below failed on an assertion of its own before its code, or with its one guard removed.

| Case | How it was seen red |
|---|---|
| `test/view.test.ts`, the three editing keys of `paneKey` | Before the code: `paneKey` answered null for each, where `lineStart`, `lineEnd` and `deleteToLineStart` were expected |
| `test/view.test.ts`, the five cases of `paneMenu` | Against a stub that gives no item |
| `test/view.test.ts`, `paneKey` during a composition, with another modifier, without the Command key, on a keyboard that is no Mac's, and for every other key | Each passed before the code, which answered null for every such key. Each failed under its mutant: the event's word of a composition no longer read, key code 229 no longer read, the test of a Mac keyboard removed, the test of the Command key removed, each of the three other modifiers no longer read, and Backspace answered for every key |
| `test/background.test.ts`, `closeHides` on macOS and on `linux` and `win32` | Against a stub that answers true on every platform but macOS |
| `test/background.test.ts`, `closeHides` where the app is quitting or started in the background | They passed against that stub. Each failed under its mutant: the read of the background removed, and the read of the quit removed |
| `test/daemon.test.ts`, the daemon's `forget` | Before the code: the second replay held `one`, which the daemon had not forgotten |
| `test/daemon.test.ts`, `OutputBuffer` once it was emptied | Against a method that does nothing: the buffer still held `ab\ncd` |
| Scenario 23, the three keys in the built app | Before the window's code: the pane's process received nothing for the left arrow with the Command key |
| Scenario 23, the menu's keys | The expectation passed when written, since no entry is on such a key. It failed under two mutants of `src/main/menu.ts`, each with an entry on one of the keys: `File / Line Start: Command+Left` was read back |
| Scenario 21, the pane's menu | Before the window's code: no menu opened at the press |
| Scenario 21, the return to the stage | Without the `forget`: the link of the pane's first row was found again after the pane came back, at the line that reads none there |
| The steps `5d2d390` adds | They passed when written. They failed under a mutant in which the up arrow goes from the menu itself to the first item |

### Mutation

`seal mutate` ran after the commits, one call per file. A built-app run went through `run-menu.sh` in the phase's scratch directory, which runs the cases named and keeps each run's output, and each red below was read there for the line that failed.

| File | Mutants | Cases |
|---|---|---|
| `src/renderer/view.ts` | twenty, all red: eleven of `paneKey`, six of `paneMenu`, and each of the three bytes of `PANE_KEY_BYTES` | `test/view.test.ts`, and for the bytes scenario 23's case of `test/terminal-basics.test.ts` |
| `src/main/background.ts` | three, all red: each of the three things `closeHides` reads | `test/background.test.ts` |
| `src/daemon/buffer.ts` | two, both red: the pieces kept, and the count kept | `test/daemon.test.ts` |
| `src/daemon/daemon.ts` | two, both red: nothing forgotten, and every session's output forgotten | `test/daemon.test.ts` |
| `src/renderer/work-item-view.ts` | twenty-eight. Twenty-five are red. Three survived, and the text below says what became of each | `test/terminal-basics.test.ts` |
| `src/renderer/renderer.ts` | one, red: the read of an open menu removed, and Command+W closed a pane | `test/terminal-basics.test.ts` |
| `src/renderer/index.html` | one, red: the menu without `position: fixed` | `test/terminal-basics.test.ts` |
| `src/main/menu.ts` | two, both red, as the table above says | `test/terminal-basics.test.ts` |

Three mutants of `work-item-view.ts` survived.

- **The terminal's `focus()` in the `contextmenu` listener was a line no case could see.** The terminal takes the keyboard at the press by itself, and the case reads the pane in front all the same. `9e3e0ad` takes the line out, with the test of a screen that holds no pane, which a hidden screen never reaches.
- **The up arrow from the menu itself was read by no step.** `5d2d390` adds the steps, and three mutants of that line are red at it.
- **The move to the left at the window's right edge still passes every case.** *Decisions made while writing the code* says why no case reaches it.

Before those, `b9556b6` took out the close of an open menu in `openMenu`: the press that asks for a menu has closed it.

**No mutant of `main.ts` was run.** The join of the window's `close`, `before-quit` and `activate` acts only in an app that was not started in the background, and no agent starts one. `gaps.md` holds the row.

`seal mutate` refused one call: an `--replace` text that held `⌘` was said to occur nowhere in `view.ts`, where `grep` finds it once. The mutants were written again around the escape.

### What the commands were

- Each test file runs by itself as `node scripts/test-in-electron.mjs test/<file>` from `apps/desktop`. `test/view.test.ts`, `test/background.test.ts`, `test/daemon.test.ts`, `test/terminal-basics.test.ts`, `test/korean-input.test.ts` and `test/notification-click.test.ts` each ran so at `4817072` and exited 0. The last was not changed.
- The boundary run at `4817072` was one command over twelve files: the first five of those six, `test/notification-click.test.ts`, `test/work-item-form.test.ts` and `test/memory.test.ts`, which start the app this phase changed, `test/themes.test.ts`, which reads `index.html` and every module under `src/renderer`, `test/menu.test.ts`, `test/last-look.test.ts`, which reads the protocol, and `test/paths.test.ts`. It exited 0 with 571 cases passed and one skipped, the typed run a person makes.
- The repository configures no linter and no formatter. The changed files were typechecked by `tsc-files.sh` of phase 3's scratch directory, with `src/renderer/renderer.ts` named among them: it declares `window.owlery`, and `work-item-view.ts` does not typecheck without it.
- One probe ran once, `test/test_tmp_modes.test.ts`, as the first departure says. The file is gone from the tree.
- A built-app case can run alone: `-t "opens a pane's menu"` and `-t "Control\+A"` each pass after the file's `beforeAll` and nothing else, in under ten seconds. Every start was in the background, and `pgrep` listed no process of a run after the last one.

### What the next party needs

- After the last case the window shows the first work item's view, "Korean input", with its one shell pane in front, and the app's clipboard holds `from the clipboard`.
- A press of the right button on a word selects it on a Mac. A case that wants nothing selected presses on `EMPTY_ROW`.
- The menu is `#pane-menu`, there only while it is open. Its items are `[role=menuitem]` buttons whose first child holds the words.
