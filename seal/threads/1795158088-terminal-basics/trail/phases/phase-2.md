# Phase 2: 1795158088-terminal-basics

## What this phase found

**The frame holds for this phase, apart from one sentence about the stand-in shell.** Each thing of the installed versions the frame builds on was opened and stands: `attachCustomKeyEventHandler`, `input`, `paste` and the option `linkHandler` in xterm 6.0.0's typings, `webUtils.getPathForFile` in Electron 45.3.3's, and the constructor of `@xterm/addon-web-links` 0.12.0, which takes the function a click calls. The coordinates of `frame/plan.md` *Technical context* are those of `efde55b`, and phase 1 moved them. The sentence the build departs from is the first under *Departures from the frame*.

The phase's code is in three commits, `f76e3e8`, `c110928` and `a528498`.

### `frame/questions.md` Q2: option (a)

**The debugging port delivers a drop whose file has a path, so scenario 3 is a case of `test/terminal-basics.test.ts`.** Judged against `frame/questions.md` Q2, whose `Who can answer` cell names this phase.

The case sends `Input.dispatchDragEvent` three times at one point of the pane, as `dragEnter`, `dragOver` and `drop`, each with `data: { items: [], files: [<path>], dragOperationsMask: 1 }`. Once the pane's element answers the `dragover`, the page receives the `drop`, and `webUtils.getPathForFile` gives the path the case named. The framer's probe saw no `drop` because nothing answered the drag then. A drag of a text is the same three calls with `items: [{ mimeType: "text/plain", data: <text> }]` and no `files`.

What the port does not show is a drag that starts in Finder. `gaps.md` holds that row under `frame/questions.md` Q4.

### Departures from the frame

Each was judged against `frame/design.md`, in the section named.

- **The stand-in shell asks for bracketed paste and prints two links.** *User scenarios & acceptance* says the pane's process "prints one URL and then writes every byte it is handed to a file". `test/fixtures/basics-shell.sh` now first asks its terminal for pastes in brackets, then prints the URL on its first row and a link behind a name, in the OSC 8 sequence, on its second. *Scope* item 2 says a program that asked for bracketed paste receives the paths as one paste, and without the brackets a mutant that hands the paths to the terminal as typed keys passes every case. So scenario 3's case reads the path between `ESC [ 200 ~` and `ESC [ 201 ~`. The path without brackets is held by the cases of `droppedText`.
- **Five cases of the built app beyond the scenario rows.** *Scope* items 2 and 3 state each behaviour, and no scenario row covers it. Two files dropped on the pane that is not in front, with two panes side by side: the paths reach that pane alone, and it comes in front. A dropped file whose name holds a tab: nothing is sent, an empty paste neither. A drag that carries a text and no file: the pane does not take it. A file dropped on the view's header: nothing is sent. A link behind a name: it opens at a click with the Command key and not without it, and the browser's own question is never asked.
- **`initView` takes whether the keyboard is a Mac's.** *Data & interfaces* names no change of it. `linkOpens` needs the fact, and `renderer.ts` hands it to the sidebar and the lists the same way.
- **`links.ts` exports the type `Opener` beside its three functions, and `chooseOpener` runs the named program itself.** *Data & interfaces* says the second function "chooses the opener from the program named, the background switch and the system's opener". `execFile` is Node's, so the module still imports nothing of Electron, and `test/links.test.ts` runs a program it writes into a temporary folder.
- **The drop's own default is not stopped.** *Scope* item 2 does not ask for it. `gaps.md` *Not done* holds the grounds.

### Decisions made while writing the code

- **The opener is handed the address as the URL's parser writes it.** *Scope* item 3 opens an address "only where it parses as a URL whose scheme is `http` or `https`". What was judged and what is opened are then one text. `HTTPS://Example.com/a b` is opened as `https://example.com/a%20b`.
- **A named program that cannot be run, or that exits with another code than 0, answers `false`, and the system's opener is not tried.** *Scope* item 4 says the main process "runs that program" where the variable names one. A fall back on the system's opener would open the owner's browser in the one case where the variable was meant to prevent it.
- **An empty `OWLERY_OPENER` names no program.** The variable still leaves the environment. Judged against *Scope* item 4, "Where the app's environment holds `OWLERY_OPENER`".
- **A value that is no text is refused before it is parsed.** The channel hands the main process whatever the page sent. A list that holds one address reads as that address once it is made a text, and the case hands over such a list.
- **On a Mac a click with the Control key opens no link.** *Scope* item 3 gives the Control key to the keyboard that has no Command key. On a Mac the Control key with a click is the secondary click.
- **The key handler stops the default of every event of a Shift+Enter press, and sends the line feed at the `keydown`.** xterm hands the handler more than the `keydown` of a press: with the line feed sent at every event, the pane's process received `0a0a`. With the default left in place, the hidden field the terminal types in took a line break: the mutant failed on the case's read of that field, with `"\n"` received. A held Shift+Enter repeats the line feed, as a held Enter repeats its byte. Judged against *Scope* item 5, "the terminal sends nothing else for that press".
- **The pane takes the keyboard at a drop, and comes in front by the listener that already reads a press inside a screen.** *Scope* item 2 says the pane that took the drop becomes the pane in front, which *Scope* defines as the pane with the keyboard. `takesDrops` calls `term.focus()`, and `newScreen`'s `focusin` listener does the rest.
- **A drop that leaves no path still gives its pane the keyboard.** *Scope* item 2 says both that the pane becomes the pane in front and that such a drop types nothing. The pane takes the keyboard before the paths are read.
- **`droppedText` leaves out the files, and `work-item-view.ts` only maps each file to its path.** The page cannot tell a file on no disk from one with a path except by the empty string `pathOf` gives, so both tests are in the function a case reads without a browser.

### What was seen red

Each case below failed on an assertion of its own before its code, or with its one guard removed. The functions of `view.ts` and `links.ts` were first written as stubs that answer wrongly, so no case failed because a module was missing.

| Case | How it was seen red |
|---|---|
| `test/view.test.ts`, `droppedText`, all 33 | Against a stub that answers `"stub"` |
| `test/view.test.ts`, `paneKey`, Shift+Enter sends a line feed | Against a stub that answers null |
| `test/view.test.ts`, `paneKey`, the five that leave a key to the terminal | They pass against the null stub, so they were run against a stub that answers `"lineFeed"` (contract rule 15) |
| `test/view.test.ts`, `linkOpens`, both | Against a stub that answers `false`. Each case asserts an opening click first |
| `test/links.test.ts`, the eight that failed first | Against stubs: `openLink` answers `false`, `chooseOpener` answers the system's opener, `takeOpener` answers `"stub"` |
| `test/links.test.ts`, the eight refusals of `openLink`, the opener that opened nothing, and the system's opener | They pass against those stubs, so they were run against the opposite ones: `openLink` hands every value to the opener and answers `true`, and `chooseOpener` answers an opener that opens nothing |
| `test/links.test.ts`, the refusal of a list that reads as an address | Written after the code. With the test of the value's type removed, this case alone failed: the opener was called |
| Scenario 7, Shift+Enter | Before the code: `0d` received where `0a` was expected |
| Scenario 7, the hidden field holds no line break | Written after the code. With the handler's `preventDefault` removed the field held `"\n"` |
| Scenario 3, a file dropped on a pane | Before the code: no byte received |
| Scenario 3's bytes inside the brackets of a paste | Written after the code. With `term.paste` replaced by `term.input` the path arrived without brackets |
| The keyboard in the pane after a drop | With `term.focus()` removed from the drop: the pane had no keyboard |
| Two files dropped on the pane that is not in front | Written after the code. With the paste handed to the pane that was in front, the first pane received nothing. With the listeners on the page's body, the second pane received the paths too. With `term.focus()` removed, the dropped pane never came in front |
| A dropped file whose name holds a tab sends nothing | It passes against the old code. With the test of an empty text removed, the pane's process received `1b5b3230307e1b5b3230317e`, the brackets of an empty paste |
| A drag that carries a text is not taken | It passes against the old code. With the `dragover` answered for every drag, the pane took the keyboard |
| A file dropped outside a pane sends nothing | It passes against the old code. With the listeners on the page's body, the pane's process received the path |
| Scenario 4, a click with the Command key | Before the code: the window never showed a link under the pointer. With the click's call of the main process removed: the opener's file held nothing |
| Scenario 5, a click without the key | Before the code it failed on the wait for a link under the pointer, which is not what it asserts. With the test of the key removed, the opener's file held three addresses where one was expected |
| A link behind a name | Before the code: the first address was never opened. With the test of the key removed: the click without the key opened the address. With `linkHandler` removed: the address was not opened, and the browser's question was answered by the case's own stand-in |

### Mutation

`seal mutate` ran after the commits, one call per file. The verdicts below are of `a528498` for `work-item-view.ts`, `main.ts`, `preload.ts` and `renderer.ts`, and of `c110928` for `links.ts` and `view.ts`, which `a528498` does not change.

| File | Mutants | Cases |
|---|---|---|
| `src/main/links.ts` | twelve, all red: the test of the value's type dropped; `http` refused; `https` refused; every scheme let through; the address handed on as it came; the named program not run in the background; a program that could not be run answering `true`; the background opening through the system's opener; the system's opener never called; the variable left in the environment; an empty variable naming a program; the program run through a shell | `test/links.test.ts` |
| `src/renderer/view.ts` | sixteen, all red: a file with no path kept; a delete kept; a null kept; `%` escaped; a space not escaped; a character outside ASCII escaped; two spaces between two paths; each of the two tests of a composition dropped; any key with the Shift key; Enter without it; each of the three other modifiers let through; either key opening a link; the Command key opening one on every keyboard | `test/view.test.ts`, the cases of `droppedText`, `paneKey` and `linkOpens` |
| `src/renderer/work-item-view.ts` | fifteen, all red: a link opened at every click; a click that calls nothing; no `linkHandler`; no link add-on; the drop listeners on the page's body; no keyboard for the pane at a drop; the paste handed to the pane that was in front; every drag answered; no drag answered; an empty paste sent; the paths typed as keys; a carriage return for Shift+Enter; the default left in place; a line feed at every event of the press; the terminal reading the key as well | `test/terminal-basics.test.ts` |
| `src/main/main.ts` | two, both red: no handler of the new channel; the opener chosen as if no program were named | `test/terminal-basics.test.ts` |
| `src/preload/preload.ts` | two, both red: `openLink` that asks nobody; `pathOf` that gives no path | `test/terminal-basics.test.ts` |
| `src/renderer/renderer.ts` | one, red: the view told the keyboard is not a Mac's | `test/terminal-basics.test.ts` |

Two mutants survived, and each changed what was done.

- **The drop's `preventDefault` removed.** Every case passed, at `c110928`. `a528498` takes the line out, and `gaps.md` *Not done* holds the grounds.
- **The paste handed to the pane in front, after `term.focus()`.** It is the code's own behaviour written another way: the focus has put the dropped pane in front by then. The mutant in the table hands the paste over before the focus, and is red.

**A batch of `seal mutate` prints no output of its runs, so a red of a built-app batch does not say which case failed.** The runs of `work-item-view.ts`, `main.ts`, `preload.ts` and `renderer.ts` went through a wrapper in the phase's scratch directory, `run-built.sh`, which keeps each run's output in a file. Each red in the table was read there for the case and the line that failed. The first batch, run without the wrapper, gave a red for the mutant without the link add-on in 4.8 seconds, which is less than the app's start takes. The same mutant alone failed on its own case in 39.9 seconds. Phase 1's table of built-app mutants was made from batches without such a wrapper.

**One run of a mutant showed something no case did.** In the run without the keyboard at a drop, at `a528498`, the opener's file held both addresses before the first case that clicks a link, in the order no case clicks them, and the pane that took the drop came in front though the mutant gives it no keyboard. The same mutant run again showed neither. A person's own clicks on the test's window, which a background start still shows on screen, would explain both. Nothing in the run tells whether that is what happened. The output is `wiv-d/run-6.txt` in the phase's scratch directory.

### What the commands were

- Each test file runs by itself as `node scripts/test-in-electron.mjs test/<file>` from `apps/desktop`.
- The repository configures no linter and no formatter. The changed files were typechecked by `tsc --noEmit` with the options of `tsconfig.json` written on the command line and the files named.
- At `a528498`, `test/view.test.ts`, `test/links.test.ts`, `test/terminal-basics.test.ts` and `test/korean-input.test.ts` each ran by itself and passed. Scenario 8 is the last of them: 32 cases passed, and the one skipped is the typed run a person makes.
- The boundary run at `a528498` was one command over seven files: those four, `test/work-item-form.test.ts` and `test/memory.test.ts`, which read `test/built-app.ts` or the app it builds, and `test/themes.test.ts`, which reads every module under `src/renderer`. It exited 0 with 340 cases passed and that one skipped. It made three starts of the app, each in the background.
- `test/terminal-basics.test.ts` takes about fourteen seconds with its one start. A case that expects no byte or no address waits about a second for one.
- `pnpm add --save-exact @xterm/addon-web-links@0.12.0` ran in `apps/desktop` of this worktree and changed `apps/desktop/package.json` and `pnpm-lock.yaml`.

### What a later change needs

- The cases of the drop, the link and the key stand after phase 1's and read the first pane, which is the one tab, in front, with the keyboard, before and after each of them.
- The helpers `cell(column, row)`, `clickLink(row, modifiers)`, `opened(count)`, `enter(modifiers)`, `drop(element, files)` and `handedMeanwhile()` are in the `describe` of that file. `clickLink` moves the pointer over the link first, since xterm finds a link at the pointer's move, and waits for the class `xterm-cursor-pointer`.
- A shell pane of these cases is in bracketed paste mode, so anything pasted into it arrives between the brackets.
- The app of these cases starts with `OWLERY_OPENER` naming a program the case writes into its temporary folder. The program adds each address to the file `opened` there.
