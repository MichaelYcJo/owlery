# Design: a pane's past output is searched, kept longer, and its paths open in the editor (#231)

## Grounding

The tree as read at `c1b7d249`.

| Policy clause | What it fixes for this work |
|---|---|
| `docs/architecture.md` *Memory design*, "A feature is built first, and made efficient where a measurement shows its cost" and "no number of a reference scene is a limit on a feature" | The scrollback's default is not refused because the four-terminal scene reads more with it. The frame states what a line costs, the build measures the scene once at the default, and efficiency work follows only where that number shows a cost. |
| `docs/architecture.md` *Memory design*, the table row "The UI holds only 1,000 lines of history. Anything older is fetched on demand from the daemon and the log on disk" (line 452) | This is the rule the issue asks to change. The row also promises a log on disk that no code holds: `apps/desktop/src/daemon/buffer.ts:37-38` says it "comes later". *Rule changes* rewrites the row as what the daemon and the window keep. |
| `docs/architecture.md` *Memory design*, "The daemon keeps the last 256K characters of each pane's output, and the window draws a pane from that replay each time the pane comes back on screen" (line 458) | A pane that left the stage holds, when it returns, only what the daemon's characters draw. A longer scrollback in the window alone would be lost at every return, so the daemon's limit moves with the scrollback. |
| `docs/architecture.md` *Memory design*, "The limits Owlery keeps are defaults read from the person's machine, which the person sees and changes", and `docs/design.md` *Components and their states*, "The Machine dialog" | The Machine dialog is where a person sees and changes what the daemon keeps of the machine's memory. The scrollback is a value of the daemon's, so it stands there as one more row. |
| `docs/architecture.md` *What a session survives*, "the window reads a field the daemon does not send as a feature that is off" | A daemon of an earlier build sends no scrollback. The window then keeps 1,000 lines and the Machine dialog shows no scrollback row. |
| `docs/architecture.md` *Screen framework: Electron*, "a file is shown selected in its folder and is never opened in an app" (line 489) | The rule kept a path a pane printed from starting a program. The issue asks for a file to open in the person's editor. The work opens a file only in an editor of the main process's own list (`apps/desktop/src/main/openers.ts:17-27`), and never in the app the system gives the file, so the rule's reason still holds. *Rule changes* rewrites the sentence. |
| `docs/architecture.md` *Screen framework: Electron*, "An app started with `OWLERY_BACKGROUND=1` opens nothing in the system browser or in Finder … and reads and writes a clipboard of its own" | An app started in the background opens no editor and reads no image of the system's clipboard. |
| `docs/architecture.md` *Rules that keep it portable*, rules 1 and 2 | The window does not branch on the agent in a pane. An image is pasted as a path for every pane's program, and no key is sent to a pane because its CLI is Claude Code. |
| `docs/architecture.md` *Memory design*, "A pane that comes back onto the stage is sent nothing a person types or pastes there until the window has drawn its replay" | A pasted path goes through `term.paste`, the way a dropped file's path goes, so the rule holds for it without new code (`apps/desktop/src/renderer/view.ts:2689`, `screenTurns`). |
| `docs/product.md` *File explorer and editor*, "Large changes open in the user's own editor" | Opening a file in the person's own editor is the product's stated direction. The editor inside the app is #180's, in 0.0.7. |
| `docs/design.md` *Principles* 3 | A search's match is drawn in the theme's inks and never in Night watch's yellow. The find bar's matches take the terminal's inks. |
| `docs/design.md` *Principles* 8, and *A pull request that changes the window carries its screenshots* | The find bar and the Settings dialog are new forms. The build writes their rows in *Components and their states*, rewrites the Machine dialog's row, and adds their views to the list of views, in both editions and in place. |
| `docs/design.md` *The voice of the window's words*, "A key is named in a sentence" and "Sentence case" | The words of the find bar, the Settings dialog and the Machine dialog's new row follow them. |

What the tree says about the code, at `c1b7d249` (`read` unless marked):

- **The window fixes a terminal's history at 1,000 lines.** `new Terminal({ scrollback: 1000, … })` stands at `apps/desktop/src/renderer/work-item-view.ts:572-574`. The sign-in pane's terminal has its own 1,000 at `apps/desktop/src/renderer/sign-in-pane.ts:35`.
- **The daemon keeps 256 × 1,024 characters of each pane, and nothing else holds a pane's past.** `new OutputBuffer(this.options.bufferChars ?? 256 * 1024)` is at `apps/desktop/src/daemon/daemon.ts:2436`. `OutputBuffer` (`apps/desktop/src/daemon/buffer.ts:46-115`) counts characters and drops from the front. An `attach` is answered with the whole buffer as a `replay` (`daemon.ts:1473`), and a pane takes a screen by sending `attach` (`work-item-view.ts:642-651`). Today's pair is 1,000 lines and 262,144 characters, which is 256 characters a line with 6,144 to spare.
- **Nothing sets `bufferChars`.** `git grep -n -e 'bufferChars' -- apps/desktop` printed `daemon.ts:326` and `daemon.ts:2436` and no other line (`executed`, at `c1b7d249`). The option has no caller and no case.
- **A line of history costs 12 bytes for each column in the window.** xterm.js 6.0.0 keeps a line as a `Uint32Array` of three numbers a cell (`CELL_SIZE = 3`, `@xterm/xterm/src/common/buffer/BufferLine.ts:22`, read in the installed package). 5,000 lines of 100 columns are 6.0 MB and 1,000 are 1.2 MB. `docs/architecture.md` line 452 publishes the measured pair: one more terminal added about 14 MB with 1,000 lines and about 20 MB with 5,000.
- **The caps are a closed set of four.** `Cap` is `"agents" | "worktrees" | "panes" | "heavyCommands"` (`apps/desktop/src/shared/protocol.ts:859`), `Machine` holds a proposal and a set value for each (`protocol.ts:825-832`), `setCaps` sets them (`protocol.ts:946`, `daemon.ts:1643`), `MachineCaps` keeps them in the daemon's run folder (`apps/desktop/src/daemon/machine.ts:16`, `:192-221`), `capRefusal` bounds a value (`apps/desktop/src/shared/machine.ts:173-178`), and the dialog draws a row for each (`apps/desktop/src/renderer/machine.ts:37`, `:98-104`). The window reads the cap on panes at `view.ts:2535`.
- **No search add-on is loaded.** `apps/desktop/package.json` holds `@xterm/addon-fit`, `@xterm/addon-web-links` and `@xterm/addon-webgl` beside `@xterm/xterm` 6.0.0. `@xterm/addon-search` 0.16.0 is the registry's `latest` (`npm view @xterm/addon-search dist-tags`, `executed` 2026-11-26) and states no peer dependency. Its typings, read from the packed 0.16.0, give `findNext` and `findPrevious` with `regex`, `caseSensitive` and `decorations`, `clearDecorations`, and `onDidChangeResults` with `resultIndex` and `resultCount`, where `resultIndex` is -1 past `highlightLimit`, 1,000 by default. `decorations` requires `matchOverviewRuler` and `activeMatchColorOverviewRuler`. The add-on builds its pattern with `RegExp(term, flags)` and catches nothing (`lib/addon-search.mjs`, `read`), so a pattern that is no regular expression throws from `findNext`.
- **A key with the Command key reaches no pane's program.** The window reads K, N and W in `commandKey` (`view.ts:1990-1996`), called from a capturing `keydown` listener of the document (`apps/desktop/src/renderer/renderer.ts:362-370`, `:2103`). It answers null while the Shift key is held. `paneKey` reads more keys with the Command key on a Mac keyboard (`view.ts:2047-2053`). The application menu binds none of them (`apps/desktop/src/main/menu.ts:34-37`).
- **A path's line number is cut and dropped.** `pathCandidates` removes `:12` and `:12:5` at `view.ts:2108` and keeps neither. A path link's target is `workItem` or `path` (`view.ts:2117`, `:2136-2139`), and `LINK_ROWS.path` gives the click with the key to "Show in Finder" (`view.ts:2151-2154`). The main process already answers whether a folder or a file stands at a path (`PathFound.folder`, `apps/desktop/src/shared/ipc.ts:69-72`, `apps/desktop/src/main/paths.ts:30-41`).
- **The main process knows the Mac's editors and opens only a folder in one.** `KNOWN_APPS` lists Visual Studio Code, Cursor, Zed, Sublime Text and Xcode as editors (`openers.ts:17-27`), `installedApps` finds their bundles (`openers.ts:35-42`), and `openFolder` runs `open -a <bundle> <folder>` for a folder that holds `.git` and for nothing else (`openers.ts:68-83`). Who opens an address or shows a path is chosen by `chooseOpener` (`apps/desktop/src/main/links.ts:33-37`): the program `OWLERY_OPENER` names, nobody in the background, the system otherwise.
- **The window has no settings dialog.** The page's dialogs stand at `apps/desktop/src/renderer/index.html:817-1134`. A client's own choice, the theme and the appearance, is kept by the main process in `appearance.json` (`apps/desktop/src/main/appearance.ts`), and the daemon's choices in its run folder. The application menu holds "Accounts…" after "About Owlery" (`menu.ts:26`, `:54-56`).
- **A paste reaches a pane as text alone.** The terminal's own listener reads `text/plain` of a `paste` event (`@xterm/xterm/src/browser/CoreBrowserTerminal.ts:342-344`). The pane menu's "Paste" reads the main process's clipboard text (`work-item-view.ts:449-453`), and `Clipboard` holds `writeText` and `readText` only (`apps/desktop/src/main/clipboard.ts:6-9`). A dropped file's path already reaches a pane as a paste, written by `droppedText` (`view.ts:2020`, `work-item-view.ts:540-551`), and the preload gives a file's path (`pathOf`, `apps/desktop/src/preload/preload.ts:42`).
- **Control+V is the terminal's key, and it sends the byte 0x16.** xterm.js maps a letter with the Control key alone to its control character (`@xterm/xterm/src/common/input/Keyboard.ts:308-310`), and neither `paneKey` nor `commandKey` reads that key.

What a probe gave (`executed` 2026-11-26, at `c1b7d249`):

- **The check the issue asks for, Claude Code's own paste in a pane.** The probe ran once from a `git clone --no-local` of the branch under `<scratchpad>/1795651593-231-pane-output-is-searched-and-opens-paths/frame/`, as `test_tmp_ctrl_v.ts`. It opened the pseudo-terminal the daemon opens for a pane (`TerminalSession.spawn`, `apps/desktop/src/daemon/pty.ts:80-92`, with `terminalEnv`), with the command `<login shell> -l -i -c 'exec claude'` in the work item's worktree, 140 columns by 45 rows. The session was Claude Code 2.1.332 on the account already signed in. The probe ran no `claude auth`, wrote nothing under `~/.claude`, and submitted no prompt, so no turn ran. It lacked two things a pane of the app has: the hook settings file a pane's command names with `--settings`, and the window's terminal, whose key the probe replaced by writing the byte xterm.js sends.
  - Claude Code asked for pastes in brackets at its start: the output held `ESC [ ? 2004 h`.
  - At the byte 0x16 Claude Code printed "Pasting…" and put the text the system's clipboard held into its input. So Control+V reaches Claude Code in such a pane, and Claude Code reads the system's clipboard itself from there.
  - The clipboard held text and no image then (`osascript -e 'clipboard info'` listed `«class HTML»`, `«class utf8»`, `«class ut16»`, `string` and `Unicode text`). The probe did not put an image on it: the clipboard is the person's, and `apps/desktop/src/main/clipboard.ts` keeps an agent's start from replacing what the person copied. Control+V with an image on the clipboard is `unverified`, and Q3 of `frame/questions.md` names who runs it.
  - At a pasted path in brackets, `ESC [ 200 ~ <the path of a PNG file outside the worktree> ESC [ 201 ~`, Claude Code's input showed `[Image #1]`. So the path of an image file, pasted as a dropped file's path is, reaches Claude Code as an image, with no question about a folder outside the worktree.
  - The session did not end at two Control+C, and the probe ended it through the handle of the process it started, whose id it had recorded.
- **The editors of the list that stand on this Mac are Visual Studio Code and Xcode, and each takes a line.** `Visual Studio Code.app/Contents/Resources/app/bin/code --help` printed `-g --goto <file:line[:character]>`, and `xed --help` printed `-l, --line <number>`. Cursor, Zed and Sublime Text are not installed here, so their commands are `unverified` (Q4).
- **The searches the plan's cells name.** `git grep -n -e 'scrollback: 1000' -- apps/desktop/src` printed `sign-in-pane.ts:35` and `work-item-view.ts:574`. *Scope* item 2 removes the second, and the first is kept (*Scope*, out). `git grep -n -e 'bufferChars' -- apps/desktop` printed the lines of `daemon.ts` named above, which *Removes* takes out.

Records with nothing more to say for this work:

- `seal/follow-up.md` does not stand (`executed`: `ls` found no file).
- `docs/README.md` does not stand, so the policy root has no index. Each `file:` of *Rule changes* is a document of `docs/` named by its path, as the designs of release 0.0.5 name theirs (`seal/threads/1795610689-214-delete-dialog-lists-read-cleanly/frame/design.md`, `read`).
- The latest GitHub Release holds no `### Process changes` heading, and no changelog fragment under `seal/threads/` holds one (`gh release view` and `grep -l`, `executed`).
- The issue: `gh issue view 231 --json body,comments` printed no comment (`executed` 2026-11-26). The orchestrator's line says its *Done when* line on the image paste was folded on 2026-11-26 with the owner's answer.
- The comparison the issue came from is `etcs/research/orca-surfaces.md`, a file git ignores, read in the main checkout. Its rows for the find bar (line 120), the scrollback (121), a file's clicks (133), a copied file's paste (144) and an image's paste (145) are what *Scope* answers as one whole. Orca's own code is not on this machine, so what Orca does is that document's account (`read`), not a reading of Orca.

## Scope

In. Each item is one thing the build makes.

The scrollback:

1. **The daemon keeps one more value of the machine, `scrollback`: how many lines of history a pane on screen holds.** Its default is 5,000 on every machine. A person sets a whole number from 1,000 to 50,000, and returns to the default, in the Machine dialog. It is kept with the caps in the daemon's run folder, sent in `machine` to every client, and set by `setCaps`.
2. **Every terminal of the view's pool takes the scrollback as its history**, when it is made and whenever a `machine` arrives with another value. Where the daemon sends no `scrollback`, the terminal keeps 1,000 lines.
3. **The daemon keeps 256 characters of each pane's output for each line of the scrollback.** A change of the scrollback moves the limit of every pane's buffer that lives, and a smaller limit drops the older output at once. The option `bufferChars` goes (*Removes*).
4. **The Machine dialog holds a row "Scrollback lines"**, after "Panes side by side": the field, "Use the default", and the sentence of *Data & interfaces* that states the default and what a line costs. The row is not drawn where the daemon sends no `scrollback`. The row "The Machine dialog" of *Components and their states* names the new row, in `docs/design.md` and `docs/design.ko.md`, edited in place.
5. **`apps/desktop/measurements/memory.md` gains a dated section with the scenario `four` measured once at the default scrollback**, beside the published 503.4 MB.

The find bar:

6. **`@xterm/addon-search` 0.16.0 is a dependency of `apps/desktop`, and a screen loads it at its first find.** A screen nobody searched holds none.
7. **⌘F opens the find bar over the pane in front, and the pane's menu holds "Find…" with that key.** ⌘F is read on a Mac keyboard, where a work item's view is on screen with a pane in front, and not while a dialog or a menu is open. With the bar open it puts the keyboard in the bar's field and selects what the field holds. On another keyboard the menu's item is the way in.
8. **The bar holds a field, "Match case", "Regular expression", the count, "Next match", "Previous match" and "Close".** The search runs from the newest output to the oldest. What is typed is searched as it is typed, and the first match shown is the one nearest the end of the output. "Next match" goes to the next older match and "Previous match" back toward the newest, and each wraps. The count reads "3 of 17", "No match", and "More than 1,000 matches" where the add-on stops counting. A pattern that is no regular expression is not searched, and the count's place says "Not a regular expression".
9. **The bar's keys.** In the field, Enter is "Next match", Shift+Enter is "Previous match", and Escape closes the bar. ⌘G and ⇧⌘G do the same steps wherever the keyboard is in the view, while the bar is open. Escape is the bar's only while the keyboard is in the bar: in the terminal it stays the program's.
10. **Closing the bar removes the marks and the selection it made and gives the keyboard back to the pane's terminal.** The bar closes without that hand-back when its pane leaves the stage, and what was typed is not kept.
11. **Every match is outlined in `--terminal-ink`, and the match in front is the terminal's selection with an outline in `--terminal-strong`.** No token is added.
12. **`docs/design.md` and `docs/design.ko.md` gain the row "A pane's find bar" in *Components and their states*, and the list of views in *A pull request that changes the window carries its screenshots* gains the find bar's view**, edited in place.

A file's path:

13. **A path link keeps the line and the column the pane printed after it**, as `:12` or `:12:5`. The link's range stays the path.
14. **A path at which a file stands is a link of its own kind, `file`.** A click with the Command key opens it in the chosen editor, at that line and column. The same click with the Shift key shows it in Finder. Its card's rows are "Open in <the editor's name>", "Show in Finder" and "Copy path". A folder's link stays as it is.
15. **The editor is chosen once, in the Settings dialog, and the main process keeps the choice** in `editor.json` of the app's user data folder. The choice is one of the editors of `KNOWN_APPS` the Mac holds, or "Show in Finder". Until a person has chosen, on a Mac that holds an editor of the list, the card's first row reads "Open in an editor…" and its click opens the Settings dialog; a Save that names an editor then opens the file. Where the choice is "Show in Finder", where the Mac holds no editor of the list, and where the chosen editor is gone, a file's link acts and reads as a path's does today.
16. **The Settings dialog opens from "Settings…" in the application menu, on ⌘,**, after "Accounts…". It is headed "Settings" and holds the field "Open files in", the sentence of *Data & interfaces*, "Cancel" and "Save".
17. **The main process opens the file**, by the command inside the editor's own bundle that takes a line, with no shell (*Data & interfaces* has the table). Where that command does not stand in the bundle it runs `open -a <the bundle> <the file>`, which opens the file at no line. It reads the disk again at the request and opens only a whole path at which a file stands, in the editor `editor.json` names where that editor is of `KNOWN_APPS` and installed. It answers null, or why nothing was opened as a sentence the status line shows. An app started in the background opens nothing, and the program `OWLERY_OPENER` names is run in the editor's place.
18. **`docs/design.md` and `docs/design.ko.md` gain the row "The Settings dialog", and the list of views gains it**, edited in place.

A paste:

19. **A paste into a pane with the Command key hands the pane's program one of these, in this order.** Where the clipboard holds files that are on a disk, as after a copy in Finder: their paths, written as dropped files' paths are. Otherwise, where it holds text: the text, by the terminal's own paste, which this work does not touch. Otherwise, where it holds an image: the path of a PNG file the main process wrote from it.
20. **The main process writes a pasted image** as `pasted-<time>.png` into the folder `owlery-pasted` of the system's temporary folder, both readable by the person alone, and at each write removes that folder's files older than seven days. An app started in the background reads no image of the system's clipboard and writes none.
21. **The pane menu's "Paste" hands the text where the clipboard holds text, and otherwise the path of the written image.**
22. **Control+V stays the key of the pane's program.** The window reads it nowhere.

Out:

- **Output older than the daemon's characters, and a search over it.** No log on disk is built. The find bar searches what the terminal holds, which is what the scrollback and the daemon's characters give it (*Rule changes*, and Q2 of `frame/questions.md`).
- **The sign-in pane's terminal** keeps its 1,000 lines (`sign-in-pane.ts:35`). A login prints a few lines and its pane is closed with the dialog.
- **A file opened in the app the system gives it**, which Orca does at a click with the Shift key. A path a pane printed can name a file the system would run. The work keeps `docs/architecture.md`'s refusal for every app but the listed editors.
- **An editor outside `KNOWN_APPS`, and a command the person types.** Q1 holds the choice.
- **A line written another way**, as `file.ts(12,5)` or `File "x.py", line 12`. The cut at `view.ts:2108` reads the forms with a colon, and the issue's "where the path names one" is met by them.
- **A folder opened in the editor from a link.** The work item's menu already opens the worktree in an editor ("Open in").
- **A find key on a keyboard without the Command key.** Control+F is the shell's key there, and the pane's menu holds "Find…".
- **The find bar in the sign-in pane and on the back of the seal.** Neither is a pane of the view's pool.
- **An editor inside the app** (#180, release 0.0.7), **a search of the worktree's files from a selection** and **a click with the middle button**, which the comparison rates low.
- **The keys that move between work items, tabs and panes, and the one place that lists every key** (#230).

## User scenarios & acceptance *(mandatory)*

| Scenario | Given / When / Then | Verifiable how |
|---|---|---|
| A1. A line past the first screen is found | Given a pane whose program printed more lines than the screen holds, one of them holding a word no other line holds. When the person presses ⌘F and types the word. Then the count reads "1 of 1", the terminal's selection is that word, and the terminal has scrolled up from its end. | A built-app case in `apps/desktop/test/terminal-basics.test.ts`: the fixture prints the lines, the case presses the key, types, and reads the count, `term.getSelection()` and that the viewport stands above the buffer's base. |
| A2. Next and previous step through the matches | Given the bar open on a word three lines hold. When the person presses Enter twice and Shift+Enter once. Then the count reads "1 of 3" at first, on the match nearest the end, and after those presses the match in front is the middle one. ⌘G and ⇧⌘G do the same from the terminal. | The same file, reading the selection's row after each press. |
| A3. Case and a regular expression | Given lines that hold "Error" and "error". When "Match case" is on. Then only the one spelling counts. When "Regular expression" is on and the field holds `err(or`. Then nothing is searched, the count's place reads "Not a regular expression", and no error is thrown in the page. | A unit case on the function that turns the bar's state into a search (`apps/desktop/test/view.test.ts`), and a built-app step in `terminal-basics.test.ts` that reads the page's uncaught errors. |
| A4. Escape closes the bar and returns the keyboard | Given the bar open with a match in front. When the person presses Escape in the field. Then the bar is gone, the terminal holds no selection and no mark, and the next key typed reaches the pane's program. Given the bar open and the keyboard in the terminal. When the person presses Escape. Then the program receives the byte 0x1b and the bar stays. | `terminal-basics.test.ts`, with the fixture that echoes what it receives. |
| A5. The bar leaves with its pane | Given the bar open over a pane. When another tab takes the stage and the first comes back. Then no bar stands over it. | `terminal-basics.test.ts`. |
| B1. The default scrollback | Given a daemon with no scrollback set. Then `machine.scrollback` is `{ proposed: 5000, set: null }`, a pane's terminal holds 5,000 lines of history, and the pane's buffer in the daemon holds 1,280,000 characters at most. | Unit cases in `apps/desktop/test/machine.test.ts` and `apps/desktop/test/daemon.test.ts`; a built-app case reads the lines a pane's terminal on the stage holds, through "Select All" and "Copy". |
| B2. A person sets the scrollback | Given the Machine dialog. When the person types 20000 in "Scrollback lines" and saves. Then every live pane's buffer holds 5,120,000 characters at most, each terminal of the pool holds 20,000 lines, and the value stands after a restart of the daemon. When the person types 999 or 50001. Then the daemon refuses with "The scrollback is a whole number from 1,000 to 50,000." and nothing changes. When the person presses "Use the default" and saves. Then it is 5,000 again, and a buffer that held more drops its older output. | `machine.test.ts` for the refusal and the file, `daemon.test.ts` for the buffers, `apps/desktop/test/machine-dialog.test.ts` (built app) for the row. |
| B3. A daemon of an earlier build | Given a `machine` with no `scrollback`. Then a terminal holds 1,000 lines and the Machine dialog draws no scrollback row. | A unit case on the function the window reads the scrollback with (`view.test.ts`). |
| B4. A returned pane keeps its history | Given a pane that printed 3,000 short lines and left the stage. When it comes back. Then its terminal holds those 3,000 lines again and the find bar finds a word of the first one. | `terminal-basics.test.ts`. Against the tree at `c1b7d249` the case fails: the terminal holds 1,000. |
| C1. A file opens in the editor at its line | Given the editor chosen and a pane that printed `src/a.ts:12:5`, where that file stands in the worktree. When the person clicks the path with the Command key. Then the main process is asked for that file's whole path with line 12 and column 5, and the stand-in for the editor (`OWLERY_OPENER`) is run with `<whole path>:12:5`. The card reads "Open in Visual Studio Code", "Show in Finder" and "Copy path". | Unit cases on `pathCandidates`, `linkClick` and `linkCard` (`view.test.ts`) and on the main process's function (`apps/desktop/test/openers.test.ts`); a built-app case in `terminal-basics.test.ts` with the stand-in. |
| C2. The Shift key shows the file in Finder | Given the same link. When the person clicks with the Command and the Shift keys. Then the file is shown in Finder, as a click with the Command key shows it today. | `view.test.ts` and `terminal-basics.test.ts`. |
| C3. The editor is chosen at the first click | Given no choice kept and a Mac that holds an editor of the list. When the person clicks a file's path with the Command key. Then the Settings dialog opens. When the person chooses the editor and saves. Then `editor.json` holds the choice, the file opens, and the next click opens with no dialog. | `terminal-basics.test.ts` (built app), `apps/desktop/test/menu.test.ts` for the menu's entry and its key, and a unit case on the file's reader. |
| C4. Nothing but a file, and nothing but a listed editor | Given a request to open a path that is not whole, a path nothing stands at, a folder, or an editor name that is not of `KNOWN_APPS` in `editor.json`. Then nothing is run and the answer is a sentence. Given an app started in the background and no `OWLERY_OPENER`. Then nothing is run. | `openers.test.ts`, with the runner handed in. |
| C5. A path with no editor to open it | Given the choice "Show in Finder", or no editor of the list on the Mac. Then a file's card and clicks are a path's of today. | `view.test.ts`. |
| D1. A copied image is pasted as a file | Given a clipboard that holds an image and no text. When the person presses ⌘V in a pane, or chooses "Paste" in its menu. Then a PNG file stands in `owlery-pasted` of the temporary folder, readable by the person alone, and the pane's program receives its path as a paste, in brackets where it asked for them. | A unit case on the main process's function with a clipboard handed in (`apps/desktop/test/clipboard.test.ts`), a unit case on the paste's decision (`view.test.ts`), and a built-app step that dispatches a `paste` event holding an image file and reads that the page asked the main process. |
| D2. Text and Finder's files | Given a clipboard that holds text. Then the paste is the terminal's own and no file is written, though the clipboard holds an image beside the text. Given files copied in Finder. Then their paths are pasted as dropped files' paths are. | `view.test.ts`. What Chromium's event holds after a copy in Finder is Q5's. |
| D3. Old images go | Given `owlery-pasted` with a file eight days old and one a day old. When an image is pasted. Then the first is gone and the second stands. | `clipboard.test.ts`, on a temporary folder with the clock handed in. |
| D4. The background reads no image | Given an app started in the background. Then the main process's function answers null and writes no file. | `clipboard.test.ts`. |
| D5. Control+V is the program's | Given a pane. When the person presses Control+V. Then the program receives the byte 0x16 and the window does nothing else. | `terminal-basics.test.ts`, with the fixture that echoes what it receives. |

## Data & interfaces

**The protocol** (`apps/desktop/src/shared/protocol.ts`).

- `Cap` gains `"scrollback"`, and `Machine` gains the optional `scrollback?: { proposed: number; set: number | null }`. `proposed` is 5,000. A client reads a `machine` without the field as 1,000 lines and no row.
- `setCaps` gains `scrollback?: number | null`, refused outside a whole number from 1,000 to 50,000 with "The scrollback is a whole number from 1,000 to 50,000."
- No other message changes. `attach`, `replay` and `forget` stay as they are.

**The daemon.** `apps/desktop/src/shared/machine.ts` holds as constants the default, the least and the most, the 256 characters a line, and the row's name and sentence. `OutputBuffer` gains a way to move its limit. The daemon gives a new pane's buffer `256 × the scrollback` characters and moves every live buffer's limit when `setCaps` changes the scrollback.

**The Machine dialog's row.** Name: "Scrollback lines". Sentence: "The default is 5,000 lines for each pane. A pane on screen holds 12 bytes for each column of a line, about 6 MB at 5,000 lines of 100 columns, and the daemon keeps up to 256 characters of output for each line."

**What the scrollback costs for each pane, against `docs/architecture.md` *Memory design*.**

| Where | At 1,000 lines, today | At 5,000 lines, the default | At 50,000 lines, the most |
|---|---|---|---|
| The window, for a pane on screen only: 12 bytes × columns × lines, once the pane printed that many | 1.2 MB at 100 columns | 6.0 MB at 100 columns. The published measurement is about 6 MB more than at 1,000 lines (14 MB to 20 MB) | 60 MB at 100 columns |
| The daemon, for every pane, on screen or not: one or two bytes a character, as the engine stores the string | 262,144 characters, 0.25 to 0.5 MB | 1,280,000 characters, 1.2 to 2.4 MB | 12,800,000 characters, 12 to 24 MB |

The four-terminal scene, 499.0 to 503.4 MB at its highest samples as published, read 532.0 to 543.0 MB at the default in *Scope* item 5's three runs (`apps/desktop/measurements/memory.md`): about 33 MB more in the window's renderer and about 3.5 MB more in the daemon, against the 9.4 MB that the arithmetic 12 × 49 × 4,000 × 4 gave for the window. *Memory design* holds no feature to a scene's number. A pane holds nothing of this until it has printed it, and a pane off the stage holds no terminal in the window.

**The find bar.** One element over the top right corner of the pane's screen. A pure function in `apps/desktop/src/renderer/view.ts` turns the bar's state, the field's text and its choices, into what is searched or into the refusal of a pattern, and another turns the add-on's `resultIndex` and `resultCount` into the count's words. `commandKey` gains `"find"`, `"findNext"` and `"findPrevious"`, read on a Mac keyboard, the last with the Shift key. `PaneMenuAct` gains `"find"`, and `paneMenu` gains "Find…" with ⌘F after "Select All". The search options carry `decorations` with `matchBorder` and `matchOverviewRuler` from `--terminal-ink`, and `activeMatchBorder` and `activeMatchColorOverviewRuler` from `--terminal-strong`.

**A path's line.** `PathCandidate` gains `line?: number` and `column?: number`. `LinkTarget` gains `{ kind: "file"; path: string; line?: number; column?: number }`, and `LinkAct` gains `"editor"`. `LINK_ROWS.file` is "Open in …" on the click with the key, "Show in Finder" on the click with the Shift key, and "Copy path". `linkCard` and `linkClick` take the editor's state: the chosen editor's name, `"finder"`, or none chosen with whether the Mac holds an editor of the list.

**The channels between the window and the main process** (`apps/desktop/src/shared/ipc.ts`, `apps/desktop/src/preload/preload.ts`, `apps/desktop/src/main/main.ts`).

| Call | Answers |
|---|---|
| `editor()` | `{ chosen, installed }`. `chosen` is the name `editor.json` holds, `"finder"`, or null where no choice was made or the file names no editor of the list. `installed` is the names of the list's editors the Mac holds |
| `saveEditor(chosen)` | Keeps a name of the list, or `"finder"`. Any other value is not kept |
| `openInEditor(path, line, column)` | null, or why nothing was opened |
| `pastedImage()` | The path of the file written from the clipboard's image, or null where the clipboard holds none |
| `onSettingsMenu(listener)` | Called at a click on the menu's "Settings…" |

**How each editor takes a file and its line.** The command stands inside the editor's bundle, except Xcode's.

| Editor | Command | Arguments | Read where |
|---|---|---|---|
| Visual Studio Code | `Contents/Resources/app/bin/code` | `--goto <path>:<line>:<column>` | `executed`: `--help` on this Mac |
| Cursor | `Contents/Resources/app/bin/cursor` | `--goto <path>:<line>:<column>` | `unverified`, Q4 |
| Zed | `Contents/MacOS/cli` | `<path>:<line>:<column>` | `unverified`, Q4 |
| Sublime Text | `Contents/SharedSupport/bin/subl` | `<path>:<line>:<column>` | `unverified`, Q4 |
| Xcode | `/usr/bin/xed` | `--line <line> <path>` | `executed`: `--help` on this Mac |

A path with no line is handed alone. A column with no line does not occur. Xcode takes no column.

**The Settings dialog.** Heading "Settings". Field "Open files in", a menu of the installed editors of the list by name and "Show in Finder" last. Sentence under it: "A ⌘ click on a file a pane printed opens it here, at the line the pane named. ⇧ ⌘ click shows it in Finder." The menu entry is `{ id: "settings", label: "Settings…", accelerator: "CommandOrControl+," }`.

**A paste.** A pure function in `view.ts` decides from what a `paste` event holds, the paths of its files, whether it holds text, and whether it holds an image, which of the things of *Scope* item 19 the pane is handed, or nothing. The pane's element reads the event before the terminal does, and stops it only where the pane is handed paths. `Clipboard` gains `readImage(): Promise<Uint8Array | null>`, the PNG's bytes, null in the background.

## Rule changes

- change
  file: docs/architecture.md
  section: Memory design
  from: | The UI holds only 1,000 lines of history. Anything older is fetched on demand from the daemon and the log on disk | Adding one terminal to the same window added about 14 MB with 1,000 lines of history and about 20 MB with 5,000 lines |
  to: | A pane on screen holds as many lines of history as the scrollback names: 5,000 on every machine, until a person sets another number from 1,000 to 50,000 in the Machine dialog. The daemon keeps 256 characters of each pane's output for each of those lines, and nothing older is kept anywhere | Adding one terminal to the same window added about 14 MB with 1,000 lines of history and about 20 MB with 5,000 lines. In the window a line of history takes 12 bytes for each of its columns, so 5,000 lines of 100 columns take about 6 MB and 50,000 take about 60 MB, only in a pane on screen and only once the pane has printed that much |
- change
  file: docs/architecture.ko.md
  section: 메모리 설계
  from: | 화면에는 기록 1,000줄만 둡니다. 그 위는 데몬과 디스크 로그에서 필요할 때 가져옵니다 | 같은 창에 터미널 하나를 더할 때 기록 1,000줄이면 약 14 MB, 5,000줄이면 약 20 MB가 늘었습니다 |
  to: | 화면에 있는 칸은 스크롤백이 정한 줄 수만큼 기록을 둡니다. 어느 컴퓨터에서나 5,000줄이고, 사람이 Machine 대화 상자에서 1,000부터 50,000까지 다른 수로 정할 수 있습니다. 데몬은 그 한 줄마다 칸의 출력 256글자를 갖고 있고, 그보다 오래된 출력은 어디에도 남지 않습니다 | 같은 창에 터미널 하나를 더할 때 기록 1,000줄이면 약 14 MB, 5,000줄이면 약 20 MB가 늘었습니다. 창에서 기록 한 줄은 열 하나마다 12바이트를 쓰므로, 100열 5,000줄은 약 6 MB, 50,000줄은 약 60 MB입니다. 화면에 있는 칸에서만, 그리고 칸이 그만큼 찍은 뒤에만 그렇습니다 |
- change
  file: docs/architecture.md
  section: Memory design
  from: The daemon keeps the last 256K characters of each pane's output, and the window draws a pane from that replay each time the pane comes back on screen.
  to: The daemon keeps the last characters of each pane's output, 256 for each line of the scrollback, which is 1,280,000 at the default, and the window draws a pane from that replay each time the pane comes back on screen. So a pane that comes back holds what those characters draw, which is fewer lines than the scrollback names where its program redrew its screen often, as an agent's CLI does. A change of the scrollback moves the limit of every pane that lives, and a smaller one drops the older output.
- change
  file: docs/architecture.ko.md
  section: 메모리 설계
  from: 데몬은 칸마다 출력의 마지막 256K 글자를 갖고 있고, 칸이 다시 화면에 나올 때마다 창은 그 출력을 다시 받아 칸을 그립니다.
  to: 데몬은 칸마다 출력의 마지막 글자를 스크롤백 한 줄에 256글자씩 갖고 있고, 기본값에서는 1,280,000글자입니다. 칸이 다시 화면에 나올 때마다 창은 그 출력을 다시 받아 칸을 그립니다. 그래서 다시 나온 칸은 그 글자들이 그리는 만큼만 기록을 갖습니다. 에이전트의 CLI처럼 화면을 자주 다시 그리는 프로그램의 칸에서는 스크롤백이 정한 줄 수보다 적습니다. 스크롤백을 바꾸면 살아 있는 모든 칸의 한도가 함께 바뀌고, 줄이면 오래된 출력부터 버립니다.
- change
  file: docs/architecture.md
  section: Screen framework: Electron
  from: A click on it with the Command key held puts the view of another work item in front where the path is that work item's worktree, and shows it in Finder otherwise: a file is shown selected in its folder and is never opened in an app, and a folder is opened unless its name holds a dot after its first character and it is no checkout.
  to: A click on it with the Command key held puts the view of another work item in front where the path is that work item's worktree. On a file it opens the file in the editor the person chose in Settings, at the line and the column the pane printed after the path, and the same click with the Shift key shows the file in Finder. Owlery opens a file in an editor of its own list and in no other app, since a path a pane printed is not the person's and the app the system gives a file may run it. Where the person chose Finder, or the Mac holds no editor of the list, the click shows the file selected in its folder. A folder is opened in Finder unless its name holds a dot after its first character and it is no checkout.
- change
  file: docs/architecture.ko.md
  section: 화면 프레임워크: Electron
  from: Command 키를 누른 채 클릭하면, 다른 작업의 worktree는 그 작업의 화면을 앞으로 가져오고, 그 밖의 경로는 Finder에서 보여 줍니다. 파일은 들어 있는 폴더에서 선택된 채로 보이고 앱으로 열리지 않습니다. 폴더는 열리지만, 이름의 첫 글자 뒤에 점이 있고 체크아웃이 아닌 폴더는 파일처럼 선택된 채로 보입니다.
  to: Command 키를 누른 채 클릭하면, 다른 작업의 worktree는 그 작업의 화면을 앞으로 가져옵니다. 파일은 사람이 Settings에서 고른 편집기로, 칸이 경로 뒤에 찍은 줄과 열에서 열리고, Shift 키를 함께 누른 클릭은 그 파일을 Finder에서 보여 줍니다. Owlery는 파일을 자기 목록에 있는 편집기로만 열고 다른 앱으로는 열지 않습니다. 칸에 찍힌 경로는 사람이 쓴 것이 아니고, 시스템이 그 파일에 정해 둔 앱은 파일을 실행할 수 있기 때문입니다. 사람이 Finder를 골랐거나 Mac에 목록의 편집기가 없으면, 클릭은 파일을 들어 있는 폴더에서 선택된 채로 보여 줍니다. 폴더는 Finder에서 열리지만, 이름의 첫 글자 뒤에 점이 있고 체크아웃이 아닌 폴더는 파일처럼 선택된 채로 보입니다.
- add
  file: docs/architecture.md
  section: Screen framework: Electron
  to: **A paste into a pane gives its program text, and a file or an image on the clipboard reaches it as a path.** Where the clipboard holds files copied in Finder, the pane is handed their paths, written as the paths of dropped files are. Where it holds text, the pane is handed the text. Where it holds an image and no text, the main process writes the image as a PNG file into a folder of its own in the system's temporary folder, readable by the person alone, and the pane is handed that file's path, so the CLI of any agent reads the image as a file. Each such write removes the files of that folder older than seven days. Control+V stays the key of the pane's program, and Claude Code reads the clipboard itself at that key. An app started with `OWLERY_BACKGROUND=1` reads no image of the system's clipboard and opens no editor.
    check: apps/desktop/test/clipboard.test.ts apps/desktop/test/view.test.ts apps/desktop/test/openers.test.ts
- add
  file: docs/architecture.ko.md
  section: 화면 프레임워크: Electron
  to: **칸에 붙여 넣으면 칸의 프로그램은 글자를 받고, 클립보드의 파일이나 이미지는 경로로 받습니다.** 클립보드에 Finder에서 복사한 파일이 있으면, 칸은 그 파일들의 경로를 끌어다 놓은 파일의 경로와 같은 모양으로 받습니다. 글자가 있으면 그 글자를 받습니다. 글자 없이 이미지만 있으면, 메인 프로세스가 그 이미지를 시스템 임시 폴더 안의 자기 폴더에 본인만 읽을 수 있는 PNG 파일로 쓰고, 칸은 그 파일의 경로를 받습니다. 그래서 어느 에이전트의 CLI든 그 이미지를 파일로 읽습니다. 이렇게 쓸 때마다 그 폴더에서 이레보다 오래된 파일을 지웁니다. Control+V는 칸의 프로그램이 받는 키로 남고, Claude Code는 그 키에서 클립보드를 직접 읽습니다. `OWLERY_BACKGROUND=1`로 띄운 앱은 시스템 클립보드의 이미지를 읽지 않고 편집기도 열지 않습니다.
    check: apps/desktop/test/clipboard.test.ts apps/desktop/test/view.test.ts apps/desktop/test/openers.test.ts

## Removes

| Removes | Coordinate | Where it lands, or why it can go |
|---|---|---|
| The fixed history of 1,000 lines and the comment that cites the rule for it | `apps/desktop/src/renderer/work-item-view.ts:573-574` | The scrollback the daemon sends (*Scope* items 1 and 2). The 1,000 stays only as what the window keeps where the daemon sends none |
| The option nothing sets, and the fixed 256 × 1,024 characters it defaults to | `apps/desktop/src/daemon/daemon.ts:326`, `:2436` | 256 characters for each line of the scrollback, a constant of `apps/desktop/src/shared/machine.ts` (*Scope* item 3) |
| The sentence that a log on disk "comes later" | `apps/desktop/src/daemon/buffer.ts:37-38` | It can go: *Rule changes* takes the log on disk out of `docs/architecture.md` *Memory design*, and the comment stood on that row |
| The line and the column that are cut from a path and dropped | `apps/desktop/src/renderer/view.ts:2108` | Kept on the candidate (*Scope* item 13) |
| "Show in Finder" as what a click with the Command key does on a file, and the cases that pin it for a file | `apps/desktop/src/renderer/view.ts:2151-2154`, `apps/desktop/test/view.test.ts:4176`, `apps/desktop/test/terminal-basics.test.ts:803`, `:892` where the path is a file's | The click with the Shift key on a file (*Scope* item 14). A folder's rows and their pins stay |
| The rule that the UI holds 1,000 lines and fetches the rest from a log on disk, and the rule that a file is never opened in an app | `docs/architecture.md` *Memory design* and *Screen framework: Electron*, and the same sections of `docs/architecture.ko.md` | *Rule changes*. They go in return for the rule on a paste that the work adds. The first promised a log no code holds, and nothing was caught by it. The second is narrowed, not dropped: its reason is kept in the sentence that replaces it |

Framed 2026-11-26 by framer, before the build.
