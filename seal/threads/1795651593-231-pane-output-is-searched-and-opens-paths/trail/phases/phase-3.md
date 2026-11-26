# Phase 3: 1795651593-231-pane-output-is-searched-and-opens-paths

## What this phase found

**The frame held for *Scope* items 13 to 22, with the departures and decisions below.** Its coordinates were opened at `a8ded84b` before the build. `pathCandidates`, `LinkTarget`, `LINK_ROWS`, `linkClick`, `linkCard`, `droppedText` and `paneMenu` stood in `apps/desktop/src/renderer/view.ts`. `newScreen`, `menuAct` and `findsPaths` stood in `apps/desktop/src/renderer/work-item-view.ts`. `KNOWN_APPS` and `installedApps` stood in `apps/desktop/src/main/openers.ts`, `chooseClipboard` in `clipboard.ts`, and `OPEN_ACCOUNTS` in `menu.ts`. The line numbers *Technical context* gives are those of `c1b7d249`. Phases 1 and 2 moved them, and the functions stood under their names. The row "The Machine dialog" and the list of views stood in both editions of `docs/design.md` (read). Departures 1 and 2 below come from reading Electron 45.3.3's clipboard and xterm.js 6.0.0's paste handler.

**What was built, by *Scope* item.**

- Item 13: `pathCandidates` keeps `:12` and `:12:5` after a path as `line` and `column`, and the link's range stays the path.
- Item 14: `pathTarget` makes a link of the kind `file` where a file stands, with the line and the column. `linkRows` gives a file's rows: "Open in <the editor>" on the click with the key, "Show in Finder" on the click with the Shift key, and "Copy path". `act` in `work-item-view.ts` asks the main process to open the file. A folder's link is unchanged.
- Item 15: `fileOpener` in `view.ts` turns the editor's state into `{ editor }`, `"finder"` or `"ask"`. A Mac that holds an editor of the list and has no choice kept gives `"ask"`, and its first row reads "Open in an editor…". The new `apps/desktop/src/main/editor.ts` reads and writes `editor.json` of the app's user data folder through `writeWholeFile`. `app-settings.ts` opens the dialog at the first click, and a Save that names an editor opens the file.
- Item 16: `SETTINGS` in `menu.ts` adds `{ id: "settings", label: "Settings…", accelerator: "CommandOrControl+," }` after "Accounts…". `<dialog id="app-settings-dialog">` in `index.html` holds the heading "Settings", the field "Open files in", the sentence of *Data & interfaces*, "Cancel" and "Save".
- Item 17: `openInEditor` in `openers.ts`, with `EDITOR_COMMANDS`, the table of *Data & interfaces*. It reads the disk again and refuses a path that is not whole, a path nothing stands at, a folder, and an editor that is not chosen, not of the list or not installed, each with a sentence the status line shows. It runs the editor's command with no shell, or `open -a <the bundle> <the file>` where that command does not stand in the bundle. The program `OWLERY_OPENER` names is run in the editor's place with `<path>:<line>:<column>`.
- Item 18: the row "The Settings dialog" stands after "The Machine dialog" in both editions of `docs/design.md`, and the list of views names it. The screenshot run gains the view `app-settings` (`apps/desktop/test/screenshots.ts`, `screenshots.test.ts`).
- Items 19 and 21: `pasteAct` in `view.ts` decides from what a paste holds. `takesPastes` in `work-item-view.ts` reads a paste on the pane's element before the terminal does. The pane menu's "Paste" with no text on the clipboard asks for the image's path.
- Item 20: `pastedImage` in `clipboard.ts` writes `pasted-<time>.png` with the mode 0600 into `owlery-pasted` of the system's temporary folder, sets the folder's mode to 0700, and removes the folder's files older than seven days. `Clipboard` gains `readImage`. In the background it answers null and no file is written.
- Item 22: nothing reads Control+V. A built-app step reads that the pane's program receives the byte 0x16.

**Departure 1: the image is read through Electron 45's own clipboard API.** *Data & interfaces* gives `readImage(): Promise<Uint8Array | null>`. The type stands as written. Electron 45.3.3's `clipboard` has no `readImage` and the typecheck refused it (executed). `main.ts` reads `clipboard.read()` and takes the `image/png` type of the item it answers. That read stands on no case: an app started in the background reads no image of the system's clipboard. *Not verified* in `gaps.md` holds it.

**Departure 2: a paste of an image stops the event as well, and so does a paste that holds nothing.** *Data & interfaces* says the pane's element "stops it only where the pane is handed paths". xterm.js 6.0.0 pastes `getData("text/plain")` at every paste, so an image with no text would reach the program as an empty paste, in brackets where it asked for them. So the element stops the event wherever the pane is not handed the text: for paths, for an image, and for a paste that holds none of the three. *Scope* item 19 names "one of these" and nothing else, so a paste that holds nothing hands nothing. Mutant P3 of the table below lets the event through, and the paste case fails. Judged against `frame/design.md` *Scope* item 19.

**Departure 3: the choice of editor is kept by a module of its own.** *Technical context* lists the main process's modules and names none for the file. `editor.ts` holds `editorChoice`, `readEditor` and `writeEditor`, with `test/editor.test.ts` beside it. `main.ts` stays wiring, as it is for the theme. C3 asks for "a unit case on the file's reader", and that file holds it.

**Decision 1: the view of the Settings dialog is named `app-settings`.** The page already holds `#settings-dialog`, which is the dialog headed "Repository settings", and the screenshot run's view `settings` draws it. The new dialog is `#app-settings-dialog`, and its shots are `<theme>-<appearance>-app-settings.png`. The menu's id stays `settings`, as *Data & interfaces* gives it.

**Decision 2: a file's card is headed by its path alone.** *Scope* item 14 names the rows and no heading. A path's card is headed by its path, and the line and the column are the click's, so the heading stays the target the pane named.

**Decision 3: an app started in the background with no `OWLERY_OPENER` answers null and opens nothing.** *Scope* item 17 says such an app "opens nothing". Every other refusal answers a sentence for the status line. This one answers null, as `showInFinder` and `openLink` answer in the background, so a case that clicks a file in the background raises no status line. The refusals before it still answer their sentences in the background.

**Decision 4: the built-app case of C1, C2 and C3 runs only on a Mac that holds an editor of the list.** C3's dialog lists the installed editors, and a Mac with none never asks. The case reads `installedApps` of `openers.ts` for the Mac it runs on, and saves the last editor of that list. This Mac holds Visual Studio Code and Xcode, so the case ran in every run this phase made and saved Xcode.

**Decision 5: D1's built-app step replaces the main process's answer.** An app started in the background reads no image of the system's clipboard (*Scope* item 20). The case replaces the handler of `owlery:pasted-image` through the main process's inspector, and counts the window's requests, so it reads that the window asked and what it pasted. `clipboard.test.ts` reads the file `pastedImage` writes, with the clipboard handed in.

**Seen red (executed).**

- The unit cases of `view.test.ts`, written before the code, failed 14 and passed 24 of the 38 they select, with 532 skipped (exit 1). Once the code stood they passed 570 of 570 (exit 0).
- The unit cases of `openers.test.ts`, `clipboard.test.ts`, `editor.test.ts` and `menu.test.ts`, written before the code, failed 19 and passed 25 of 44 (exit 1). Once the code stood they passed 49 of 49 (exit 0).
- The built-app cases of C1, C2, C3, D1, D2 and D5 were shown red by the mutations below, run after the commits they name.

**Mutations, each through `seal mutate` (executed).** V1 to N2 ran after `ebf4e095`, P1 to P8 after `2025749d`, and W1 to R10 after `2025749d` again, against the whole of `terminal-basics.test.ts`. Their first run against `-t 'makes a path a pane printed|asks for an editor at the first click'` measured nothing: those cases count the links earlier cases opened, and `seal mutate` answered "no baseline" for each. The commands were these.

- V: `node scripts/test-in-electron.mjs test/view.test.ts -t 'pathCandidates|pathTarget|fileOpener|linkClick|pasteAct' --bail 1`.
- O: `node scripts/test-in-electron.mjs test/openers.test.ts -t 'openInEditor' --bail 1`.
- C, E and N: `test/clipboard.test.ts`, `test/editor.test.ts` and `test/menu.test.ts`, each with `--bail 1`.
- W and R: `env OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/terminal-basics.test.ts --bail 1`.
- P: the same file with `-t 'pastes the path of the file'`.

| # | Unit | Mutant | Verdict |
|---|---|---|---|
| V1 | `view.ts#pathCandidates` | the line and the column dropped | red |
| V2 | `view.ts#pathCandidates` | the column dropped | red |
| V3 | `view.ts#fileOpener` | a chosen editor that is gone read as installed | red |
| V4 | `view.ts#fileOpener` | no choice read as Finder where an editor is installed | red |
| V5 | `view.ts#linkRows` | Finder's choice given the editor's rows | red |
| V6 | `view.ts#linkRows` | "Open in an editor" without its ellipsis | red |
| V7 | `view.ts#linkRows` | "Show in Finder" on the click with the key | red |
| V8 | `view.ts#pathTarget` | a file made a path's link | red |
| V9 | `view.ts#pasteAct` | files' paths ignored | red |
| V10 | `view.ts#pasteAct` | text not left to the terminal | red |
| V11 | `view.ts#pasteAct` | an image ignored | red |
| V12 | `view.ts#linkClick` | the opener ignored | red |
| O1 | `openers.ts#openInEditor` | a folder opened | red |
| O2 | `openers.ts#openInEditor` | a path nothing stands at opened | red |
| O3 | `openers.ts#openInEditor` | the kind of `KNOWN_APPS` not read | SURVIVED; the check was removed in `2025749d` |
| O4 | `openers.ts#openInEditor` | an editor that is not installed run | red |
| O5 | `openers.ts#openInEditor` | the program of `OWLERY_OPENER` not run | red |
| O6 | `openers.ts#openInEditor` | an editor run in the background | red |
| O7 | `openers.ts#openInEditor` | the editor's command run where it does not stand | red |
| O8 | `openers.ts#placeNumber` | line 0 taken | red |
| O9 | `openers.ts#openInEditor` | a column with no line not guarded | SURVIVED; the guard was removed in `2025749d` |
| O10 | `openers.ts#EDITOR_COMMANDS` | Xcode's `--line` given as `-l` | red |
| O11 | `openers.ts#openInEditor` | no choice not refused | red |
| O12 | `openers.ts#EDITOR_COMMANDS` | Zed's command at another path | red |
| C1 | `clipboard.ts#chooseClipboard` | the background reads the system's image | red |
| C2 | `clipboard.ts#pastedImage` | the folder's mode not set | red |
| C3 | `clipboard.ts#pastedImage` | old files kept | red |
| C4 | `clipboard.ts#pastedImage` | the file's mode not set | red |
| C5 | `clipboard.ts#pastedImage` | the name without `.png` | red |
| E1 | `editor.ts#editorChoice` | Finder refused | red |
| E2 | `editor.ts#editorChoice` | an app that is no editor taken | red |
| E3 | `editor.ts#writeEditor` | a refused value written | red |
| E4 | `editor.ts#readEditor` | the file read under another key | red |
| N1 | `menu.ts` | "Settings…" with no ⌘, | red |
| N2 | `menu.ts` | a separator between "Accounts…" and "Settings…" | red |
| W1 | `main.ts`, the menu's clicks | "Settings…" tells the window nothing | red |
| W2 | `main.ts`, `openInEditor`'s channel | the program of `OWLERY_OPENER` not passed | red |
| W3 | `main.ts`, `editor`'s channel | no installed editor | red |
| W4 | `main.ts`, `saveEditor`'s channel | every choice refused | red |
| R1 | `work-item-view.ts#act` | no dialog where the opener asks | red |
| R2 | `work-item-view.ts#findsPaths` | the line and the column dropped | red |
| R3 | `work-item-view.ts#showCard` | the card without the opener | red |
| R4 | `work-item-view.ts`, the link's click | the click without the opener | red |
| R5 | `app-settings.ts#initSettings` | the file not opened after a Save | red |
| R6 | `app-settings.ts#openSettings` | the field stands on Finder with no choice kept | red |
| R7 | `app-settings.ts#initSettings` | the state not read again after a Save | red |
| R8 | `app-settings.ts#initSettings` | "Settings…" of the menu not heard | red |
| R9 | `app-settings.ts#initSettings` | "Cancel" does nothing | red |
| R10 | `renderer.ts` | the editor's state not read at the start | red |
| P1 | `work-item-view.ts#takesPastes` | text not left to the terminal | red |
| P2 | `work-item-view.ts#takesPastes` | an image not pasted | red |
| P3 | `work-item-view.ts#takesPastes` | the event reaches the terminal | red |
| P4 | `work-item-view.ts#menuAct` | "Paste" with no text does nothing | red |
| P5 | `work-item-view.ts#takesPastes` | a paste into the find bar's field read as the pane's | red |
| P6 | `work-item-view.ts#newScreen` | no paste read before the terminal | red |
| P7 | `view.ts#paneKey` | Control+V read as a line feed | red |
| P8 | `work-item-view.ts#pasteImage` | the path pasted though the screen took another pane meanwhile | SURVIVED; `gaps.md` *Not done* |

The failing lines of V1, V6, O5, C2, E4 and N2 were read, and each names the unit mutated. Every W and R mutant failed the case of C1, C2 and C3, and its first failing line was read. W1 and R8 failed at `the Settings dialog, at "Settings…" of the menu`, R1 and R4 at `the Settings dialog, at the first click on a file`, R9 at `the Settings dialog closed at Cancel`, W4 at `the Settings dialog closed at Save`, and R6 on `expected 'finder' to be 'Visual Studio Code'`. W2, R5 and R7 failed on the stand-in's runs, and W3, R2, R3 and R10 on a card's rows or title.

**Unit files together (executed).** `view.test.ts`, `openers.test.ts`, `clipboard.test.ts`, `menu.test.ts`, `editor.test.ts`, `themes.test.ts` and `screenshots.test.ts` without `OWLERY_SCREENSHOTS` passed 642 cases, with 1 skipped, at the tree that became `0714b097` (exit 0). `themes.test.ts` is among them because it reads both editions of `docs/design.md`.

**Built-app files alone (executed).** `terminal-basics.test.ts` passed 34 of 34 at the tree that became `0714b097` (exit 0), and its paste case alone passed at the tree that became `ebf4e095` (exit 0). The typecheck passed at the trees that became `0714b097`, `2025749d` and `3b9b8c3b` (exit 0).

**Decision 6: the pane menu's "Paste" checks the pane at the click before it pastes an image.** The first build compared the pane only before a text was pasted, and `pasteImage` took the pane the screen held once the clipboard's text was read. A screen that took another pane in that time would have pasted the image's path into it. `3b9b8c3b` returns before either paste where the screen's pane changed. No case reads this guard, as none reads P8's, and `gaps.md` *Not done* holds both.

**The phase boundary's set (executed).** One script ran both commands through the runner of heavy commands, at `3b9b8c3b`.

- `OWLERY_BACKGROUND=1 pnpm run test:app` passed 229 cases in 19 files, with 8 cases and 2 files skipped (exit 0). No link-card case failed in it.
- `OWLERY_BACKGROUND=1 OWLERY_SCREENSHOT_THEMES=all pnpm --filter @owlery/desktop run screenshots` failed (exit 1) on `the window never showed the dialog machine-dialog closed`, after 13 shots of the first theme. The shot of the Machine dialog shows why: the run's queues and the scrollback row of phase 1 make the dialog taller than the window, and its "Cancel" stands below the window, where `BuiltApp.click` presses the middle of the button and misses it. No earlier phase ran the screenshots, and no run at the base was made, so which row first pushed the button out of the window is not known.

**Departure 4: the screenshot run scrolls the Machine dialog.** `leave.machine` in `apps/desktop/test/screenshots.test.ts` scrolls "Cancel" into view before it presses it, as a person scrolls the dialog. The dialog keeps its scroll when it opens again, so the second run's later themes shot the dialog scrolled to its foot (read: `desk-light-machine.png`). `show.machine` now takes the dialog back to its heading before each shot. The screenshot run then passed and wrote 90 shots (exit 0), at the tree `c04395be` commits. A person who scrolls the Machine dialog and opens it again finds it where they left it. This phase changed nothing of that, and *Not verified* in `gaps.md` holds it for the owner's walk.

**The shots (read).** The 18 shots of the views `find`, `machine` and `app-settings` in each theme and appearance stand in `screenshots/`. The `find` shots of `night-watch-dark` from the first run, and of `desk-dark` and `register-light` from the second, read "1 of 3" for "login" over the pane, with three matches outlined and the newest, on the line `login.test.ts`, selected. The `app-settings` shots of `register-light`, `night-watch-dark` and `desk-light` show the heading "Settings", "Open files in" on "Visual Studio Code", the sentence, "Cancel" and "Save". The `machine` shot of `register-dark` from the last run opens at its heading with the row "Scrollback lines" at 5000.

