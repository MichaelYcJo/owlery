# Phase 1: 1795158088-terminal-basics

## What this phase found

**The frame holds for this phase.** Each coordinate `frame/plan.md` *Technical context* gives was opened at `5e743e9` and stands where the frame says: `main.ts#createWindow` at lines 22 to 43 and the handlers at 45 to 77, `work-item-view.ts#newScreen` at 102 to 146, `tabElement` at 271 to 290 with its `close` at 287, `front` at line 31, `renderer.ts#onCommandKey` at 122 to 129, the reload at 368, the capture listener at 402, and `BuiltApp.start` at 121 to 144. The frame is wrong about the tree nowhere this phase reads it.

The phase's code is in two commits, `373e20e` and `414d47f`. Two more, `25d8045` and `ec84d9c`, change comments alone.

### `frame/questions.md` Q3: option (a)

**A case of the built app has a pane whose session is working, so scenario 11 is a case of `test/terminal-basics.test.ts`.** Judged against `frame/questions.md` Q3, whose `Who can answer` cell names this phase.

The daemon starts a Claude Code pane as `$SHELL -l -i -c 'exec claude --settings <file>'` (`src/daemon/hooks.ts#claudePaneCommand`). The cases start the app with `SHELL` set to `test/fixtures/basics-shell.sh`. Given a command, that file puts the folder `test/fixtures/claude-stand-in` first on its `PATH` and runs the command, so `claude` is the stand-in of that folder. The stand-in reads the settings file, runs the command the file names for the hook `UserPromptSubmit`, and stays until the pane closes. The daemon then lists the session as working, and the window's strip says "Working".

Three facts of this arrangement matter to whoever changes it.

- No profile of the owner's is read and the owner's `claude` never starts: the shell is the stand-in, and it exits where the stand-in for `claude` is missing, before it runs the command.
- The stand-in for `claude` runs its script with the suite's binary, Electron run as Node. The cases hand the binary's path to the app as `OWLERY_STAND_IN_NODE`, which reaches the pane through the daemon's environment.
- A shell pane writes its bytes to the file `OWLERY_RECEIVER_FILE` names with `-<pane id>` after it, and its process id to that name with `.pid`. The daemon numbers the panes it starts from 1 (`src/daemon/daemon.ts:102`), so the first pane's file ends in `-1`.

### Departures from the frame

Each was judged against `frame/design.md`, in the section named.

- **`test/menu.test.ts` is a file the frame does not name.** *Scope* item 6 says a platform other than macOS holds "Quit" under "File" and keeps the same keys free. The suite runs on macOS, so the built menu of scenario 9 never reads that half. The four cases read `menuTemplate` for `darwin`, `linux` and `win32`. `frame/plan.md` *Alternatives considered* rejects the template as the case that holds the macOS menu, because a role brings its own key. That rejection stands: scenario 9 reads the built menu, and these cases hold only what the template itself says.
- **The "Window" menu of a platform other than macOS is written out, as "Minimize" and "Zoom".** *Scope* item 6 gives that platform "a menu that keeps the same keys free". By the crafter's recollection of Electron's roles, which nobody opened, the `windowMenu` role holds a `close` entry on Control+W outside macOS, and Control+W is the key `commandKey` reads there. Writing the menu out keeps the key free whether or not the recollection is right, and the comments of `menu.ts` and `test/menu.test.ts` state only that no case read that menu. The menu as Electron builds it on such a platform was not run, and `gaps.md` holds the row.
- **`BuiltApp` gains `pages()` beside the inspector's option and method.** *Data & interfaces* names the option and the method. Scenarios 1, 2 and 10 read how many pages the debugging port lists, and the port's number was private to `start`. The page's session and the main process's session share one class, `DebugSession`, in place of a second copy of the message handling. `test/korean-input.test.ts` and `test/work-item-form.test.ts` passed on the changed file in the boundary run.
- **The stand-in shell prints no URL yet.** *User scenarios & acceptance* describes the pane's process as printing one URL. No scenario of this phase reads it, and phase 2's scenario 4 adds it.
- **One case beyond the scenarios: the dialog closes where its pane is gone.** *Scope* item 8 states it and no scenario row covers it. The case has a second client of the daemon close the pane while the dialog asks. It reads the daemon's port and token from `run/daemon.json` under the user data folder the case's own app started with.
- **Scenario 11's case also presses Escape, and presses N with the Command key while the dialog is open.** *Scope* item 8 states both, and the scenario row names neither.

### Decisions made while writing the code

- **`closeFront` reads `front` and nothing else to decide that no pane is in front.** `work-item-view.ts#leaveView` already sets `front` to nothing as the view is left. A second test of `held.viewing` in `closeFront` would hold the same case, and contract rule 15 then says the case pins neither. Judged against *Scope* item 7.
- **The keyboard starts on "Cancel" by the order of the dialog's two buttons.** `showModal` gives the keyboard to the dialog's first control. No code focuses the button. The mutant that swaps the two buttons goes red. Judged against *Scope* item 8.
- **The dialog's `close` listener gives the keyboard to the pane in front.** Without it the browser gives the keyboard back to what had it before the dialog, which after a press of "×" is that tab's button. Judged against *Scope* item 8.
- **`asking`, the pane the dialog asked about, is not reset when the dialog closes.** It is read by the "Close pane" button, which can be pressed only while the dialog is open, and by `dropClosed`, where closing a dialog that is not open does nothing. A reset would be a line no case can see.
- **`staysOnPage` refuses every URL while the window shows none.** The window's first load is `loadFile`, which raised no `will-navigate`: the built-app cases load the page with the guard in place.
- **`renderer.ts` names its read `dialogOpen`**, the name `frame/plan.md` *Overlap with the release* gives the function of #93 that replaces it.

### What was seen red

Each case below failed on an assertion of its own before its code, or with its one guard removed. A case that failed because its module did not exist yet is not counted: `navigation.ts` and `menu.ts` were first written as stubs that answer wrongly, so the cases failed on what they assert.

| Case | How it was seen red |
|---|---|
| `test/navigation.test.ts`, the seven refusals | Against a stub that lets every navigation through |
| `test/menu.test.ts`, all four | Against a stub that names Electron's own `appMenu`, `fileMenu` and `windowMenu` roles |
| `test/view.test.ts`, `commandKey` with W | Against `commandKey` at `5e743e9` |
| `test/view.test.ts`, `closeAsks` asks for a working session | Against a stub that answers `false` |
| `test/view.test.ts`, the five sessions `closeAsks` does not ask for | They pass against the `false` stub, so they were run against a stub that answers `true` (contract rule 15) |
| Scenario 9, the menu | Against Electron's default menu: "File / Close Window" is on `CommandOrControl+W` |
| Scenario 2, `window.open` | With a handler that allows the window with `show: false`, as its row states. No run had a window without a handler |
| Scenario 1, the page asks to leave | Twice, as its row states. Without the guard the window showed the temporary file. With a guard that refuses every navigation the page never loaded again |
| Scenario 10, Command+W closes the pane in front | With `closeFront` doing nothing: the window never showed one tab |
| Scenario 10, Command+W on the inbox screen | It passes against the old code. With `front = undefined` removed from `leaveView` the first pane's process ended. The case first pressed the key on a page that had not shown a view since its reload, where `front` was never set, and stayed green under that removal. It now opens the view and leaves it before the key |
| Scenario 11, a working pane asks | With `closePane` never asking: the window never showed the dialog |
| Scenario 11, N with the Command key while the dialog is open | With `dialogOpen` reading the "New work item" form alone: the form opened over the dialog |
| Scenario 12, a shell pane closes at once | It passes against the old code. With `closeAsks` answering `true` the dialog opened |
| The dialog closes where its pane is gone | With the line of `dropClosed` removed: the dialog stayed open |

### Mutation

`seal mutate` ran after the commits, one call per file, every mutant red.

| File | Mutants | Cases |
|---|---|---|
| `src/main/navigation.ts` | the test of an empty shown URL dropped; the comparison dropped | `test/navigation.test.ts` |
| `src/main/menu.ts` | "Close Window" without its accelerator; the `windowMenu` role outside macOS; "About" without its label; no "Quit" under "File" | `test/menu.test.ts` |
| `src/renderer/view.ts` | `closeAsks` without `alive`; `closeAsks` for any state; `commandKey` without W | `test/view.test.ts`, the cases of `commandKey` and `closeAsks` |
| `src/main/main.ts` | no guard; a guard that refuses every navigation; a handler that allows a hidden window; no menu set | `test/terminal-basics.test.ts` |
| `src/renderer/renderer.ts` | `dialogOpen` reading the form alone; W doing nothing | `test/terminal-basics.test.ts` |
| `src/renderer/index.html` | the dialog's two buttons swapped | `test/terminal-basics.test.ts` |
| `src/renderer/work-item-view.ts` | `closeFront` doing nothing; `closePane` never asking; "Close pane" sending nothing; no close of the dialog for a pane that is gone; no keyboard for the pane after the dialog; `front` kept when the view is left; "×" doing nothing; the sentence's label read from the asked pane alone, with `[session]` in place of the work item's tabs; the sentence naming the kind's label, as the daemon gives it, in place of the tab's label | `test/terminal-basics.test.ts` |

The last two mutants of `work-item-view.ts` were run by the fix pass of review round 1, each alone, at `597307b`. That commit's case opens two Claude Code panes and reads "Claude Code 2" in the sentence, and both mutants fail on that line. Scenario 11's case reads the sentence of the only Claude Code pane and passes under both. The phase's own run had one mutant of the sentence, and its output keeps the verdict `red` without the mutant's text, so which text it wrote is not known.

Two units have no mutant because no case can see them, and `gaps.md` holds both: `inboxKey` being told of the new dialog, and Command+W being kept from the terminal.

### What the commands were

- Each test file runs by itself as `node scripts/test-in-electron.mjs test/<file>` from `apps/desktop`. `--bail 1` stops a mutant's run at its first failing case.
- The repository configures no linter and no formatter. Its typecheck is the whole project's, which is the broad gate's. The changed files were typechecked by `tsc --noEmit` with the options of `tsconfig.json` written on the command line and the files named.
- The built-app cases took about six seconds with one start. The app's windows opened in the background, and no process of a run was left: `ps` listed none under `owlery-app-` after the last run.

### What phase 2 needs

- The cases of `test/terminal-basics.test.ts` share one app and run in order. The first pane is a shell pane that no case closes. After the last case it is the one tab, in front, with the keyboard. Its bytes are in the file `${receivedFile}-1`, which `korean-pane.ts#Received` reads.
- The case of scenario 1 reloads the page. The window then shows the inbox screen, and the helper `openView` brings the view back. A case that needs the pane's screen runs before that case or after an `openView`.
- The helpers `command(letter)`, `openPane(label)`, `pidOf(pane)` and `closeFromElsewhere(pane)` are in the `describe` of that file. The app already starts with the main process's inspector.
- `test/fixtures/basics-shell.sh` is where the URL of scenario 4 is printed, before its `exec cat`.
- A terminal's key handler added by `newScreen` sees a key only after `renderer.ts#onCommandKey`, which is on the capture phase of the document.
