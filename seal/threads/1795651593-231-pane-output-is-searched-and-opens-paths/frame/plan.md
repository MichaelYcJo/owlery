# Implementation Plan: a pane's past output is searched, kept longer, and its paths open in the editor (#231)

## Technical context

The tree as read at `c1b7d249`.

The work is in the view's terminal pane, the daemon's buffer of a pane's output, the caps of the machine, and the main process's hands on the Mac. `frame/design.md` *Grounding* names each coordinate with what was read there. The build stands on these:

- `apps/desktop/src/renderer/work-item-view.ts:568-633`, `newScreen`: the one place a pane's terminal is made, with its add-ons, its key handler, its drops, its path links and its menu. `:445-469` is `menuAct`, `:642-661` is `take` and `giveBack`, where a pane takes a screen and leaves it.
- `apps/desktop/src/renderer/view.ts`: the pure functions the page's code calls, `commandKey` (`:1990`), `droppedText` (`:2020`), `paneMenu` (`:2076`), `pathCandidates` (`:2100`), `LinkTarget`, `LINK_ROWS`, `linkClick` and `linkCard` (`:2117-2190`). Each new decision of this work is a pure function here with unit cases, and `work-item-view.ts` only wires it.
- `apps/desktop/src/daemon/buffer.ts:46-115`, `OutputBuffer`, and `apps/desktop/src/daemon/daemon.ts:2436`, where a pane gets one. `daemon.ts:1643` is `setCaps`.
- `apps/desktop/src/shared/machine.ts`, `apps/desktop/src/daemon/machine.ts` and `apps/desktop/src/renderer/machine.ts`: the caps, their file and their dialog.
- `apps/desktop/src/main/openers.ts`, `paths.ts`, `links.ts`, `clipboard.ts`, `menu.ts` and `main.ts`, with `apps/desktop/src/shared/ipc.ts` and `apps/desktop/src/preload/preload.ts`: what the main process does for the window. Each module takes the system's part as an argument, so its cases run without Electron.

Constraints:

- **The window does not branch on the agent in a pane** (`docs/architecture.md` *Rules that keep it portable*). Nothing here reads a pane's kind.
- **An app started in the background touches nothing of the person's**: no editor, no Finder, no image of the system's clipboard. Each new act of the main process is chosen the way `chooseOpener` and `chooseClipboard` choose.
- **The broad gate compares the headings and the table rows of `docs/*.md` with `docs/*.ko.md`.** Each row this work writes in `docs/design.md` goes into both editions in one commit.
- **A built-app file runs alone while a case of it is worked on, and all of them run in one batch when a phase ends** (`docs/architecture.md` *Measure before building*). This Mac runs one heavy command at a time (`seal/config.json` *Heavy commands*), so each phase's batch, the install and the screenshot run take their turn through the runner of heavy commands.
- **A case is seen red before it is committed** (contract rule 15), against `c1b7d249`'s code or with the one guard it names removed.

The chosen approach, and what breaks in six months:

- **The approach.** The structure that holds a pane's past stays: the daemon keeps characters, the window's terminal keeps lines, and a pane that returns is drawn from the daemon's characters. Both limits come from one value, the scrollback, at 256 characters a line, which is the ratio of today's 262,144 characters to 1,000 lines. The find bar searches the terminal with xterm.js's own search add-on. A file opens through the editor's own command, run by the main process with no shell. An image is pasted as the path of a file.
- **What breaks.** A pane whose program redraws its screen often spends its characters on redraws. Claude Code draws a moving status line, so a Claude Code pane that left the stage may return with far fewer lines than the scrollback names, and the find bar then finds less in it than in a pane that stayed. Q2 of `frame/questions.md` measures it, and the row "A terminal in the daemon for each pane" below is what answers it if the number is poor.
- **A second cost.** At 50,000 lines a pane's return carries up to 12,800,000 characters in one message, and the terminal draws them before the pane takes a key. The person who sets the most pays that wait at every return of a full pane. Q2 measures the return at the default.
- **A third.** The editor's command is a path inside another product's bundle. A release of Cursor, Zed or Sublime Text that moves it leaves the file opening at no line, through `open -a`, and nothing says why. Q4 holds the three paths nobody ran.

## Alternatives considered

| Approach | Failure scenario | Verdict |
|---|---|---|
| Keep the daemon's buffer of characters, and scale it with the scrollback | The costs under "What breaks" above. The premise that keeps the structure was checked: a pane's terminal in the window is emptied when the pane leaves the stage, and the daemon's `replay` is the one way its past returns (`work-item-view.ts:642-661`, `daemon.ts:1473`, `read`), so the window can search only what the daemon's characters redraw, and no second store exists to search. | Chosen. |
| Replace it: a terminal in the daemon for each pane (`@xterm/headless` with its serialize add-on), whose serialized screen and history is the replay | The daemon parses every byte every pane prints, hidden or not, and `docs/architecture.md` *Measure before building* lists that cost as unmeasured ("Daemon CPU"). Every pane then holds 12 bytes a cell in the daemon, about 6 MB at the default against 2.4 MB at most. The daemon carries a second copy of the terminal's parser that must stay in step with the window's. In return a returned pane holds exactly the scrollback's lines, and `lastModes` and `OPEN_SEQUENCE` of `buffer.ts` go. | Not this work. It is the first to weigh where Q2 shows a returned Claude Code pane holds too little. |
| Replace it: the log on disk the old rule promised, read on demand | xterm.js adds no line above its history, so older output could not be scrolled to. The search would run in the daemon over raw output with its escape sequences, beside the window's search of the drawn lines, and the two would answer differently for one word. | Rejected. *Rule changes* takes the promise out. |
| Raise the window's scrollback alone | A pane that leaves the stage and returns holds what 262,144 characters draw, so the longer history is lost at every return. Scenario B4 fails. | Rejected. |
| Keep the scrollback as the window's own choice, beside the theme | The daemon sizes each pane's buffer and must know the value, and a second client, the phone, would hold another. | Rejected: it is the daemon's state, as the caps are. |
| Put the scrollback in the Settings dialog, beside the editor | The value would be shown in one dialog and kept with the caps of another, and a person who opens "Machine" to see what the daemon keeps of memory would not find it. | Rejected: one value, one home. The Machine dialog states each default with its arithmetic, which this value needs. |
| A default above Orca's, 10,000 lines | Twice the window's cost and the daemon's for every pane, for a person who never asked. The issue asks for no smaller than Orca's 5,000. | Rejected. A person raises it to 50,000. |
| A search written here over the terminal's lines | It would handle wrapped lines, wide characters, the marks and the count again, each of which the add-on already does for this version of xterm.js. | Rejected: `@xterm/addon-search` 0.16.0. |
| "Next match" steps down the output, as on a web page | The bar's first match is the newest one, where the person's eye is. The first Enter would wrap to the oldest line of the history. | Rejected. The search runs from the newest output to the oldest, and "Next match" is the next older one. |
| New tokens for a match and for the match in front | Each token is a row of every theme's table in both editions of `docs/design.md`, a value of `themes.css` for each theme and appearance, and a pair `themes.test.ts` holds to a contrast floor. | Rejected. `--terminal-ink` and `--terminal-strong` already stand on the terminal's ground in every theme, and *Principles* 3 asks for the theme's inks. |
| Open a file with `open -a <editor> <file>` alone, or through the editor's address scheme | `open -a` passes no line, so the issue's "at the line" fails. An address such as `vscode://file/…` exists for some editors of the list only, and the main process opens no address but `http` and `https` (`links.ts:16-21`). | Rejected. The editor's own command takes the line, and `open -a` is what is left where that command is missing. |
| Open a file in the app the system gives it at a click with the Shift key, as Orca does | A pane can print the path of a `.command` file or of a script, and the system's app for it runs it. | Rejected: `docs/architecture.md` *Screen framework: Electron* refuses it, and the work keeps that reason. |
| Take the first installed editor of the list with no question | The click opens an app the person did not choose, and the issue says "chosen once in settings". | Rejected. The first click on a file opens the Settings dialog. |
| Keep the editor's choice in the daemon | The editor is an app of the Mac the window runs on. A client on another machine would be told to open an app it does not hold. | Rejected: the main process keeps it, as it keeps the theme. |
| A control for the editor in the sidebar's foot | The foot already holds the accounts, the machine, the keep-awake choice, the theme and the appearance, and a choice made once does not earn a place that is always on screen. | Rejected. "Settings…" in the application menu, on ⌘,, is where a Mac app keeps such a choice. |
| At ⌘V with an image, send Control+V to a Claude Code pane and let it read the clipboard | The window would branch on the agent, against rule 1 of *Rules that keep it portable*. A shell and another agent's CLI would get nothing. Control+V with an image is also `unverified` (Q3). | Rejected. A path of an image reached Claude Code as `[Image #1]` in the probe, and a path serves every CLI. |
| Write the pasted image from the event's bytes, in the page | The pane menu's "Paste" has no event, so a second way to the image would be needed for it. | Rejected: the main process reads its clipboard for both. |
| Write the pasted image into the worktree | It shows in `git status`, and an agent told to commit everything commits it. | Rejected: a folder of the system's temporary folder. |

## Phases

| Phase | Delivers | Verified by | Status |
|---|---|---|---|
| 1 | *Scope* items 1, 2, 3, 4 and 5 | Unit, while building: `cd apps/desktop && node scripts/test-in-electron.mjs test/machine.test.ts test/daemon.test.ts test/view.test.ts`, with the cases of scenarios B1, B2 and B3. Built app, each file alone while its case is written: `test/machine-dialog.test.ts` for the row, and `test/terminal-basics.test.ts` for B1's terminal and for B4 up to the 3,000 lines the returned terminal holds. At the phase's end, once: `OWLERY_BACKGROUND=1 pnpm run test:app` in `apps/desktop`, then `OWLERY_BACKGROUND=1 OWLERY_MEMORY_SCENARIOS=four pnpm run measure:memory`, whose samples go into `apps/desktop/measurements/memory.md` with date, commit and method. `git grep -n -e 'scrollback: 1000' -- apps/desktop/src` prints `sign-in-pane.ts:35` and no other line, and `git grep -n -e 'bufferChars' -- apps/desktop` prints nothing. The phase record holds how long the 3,000-line pane took to return, for Q2. | built `4e0b409e`; `trail/phases/phase-1.md` |
| 2 | *Scope* items 6, 7, 8, 9, 10, 11 and 12 | `pnpm install` once, for the add-on, through the runner of heavy commands. Unit, while building: `node scripts/test-in-electron.mjs test/view.test.ts`, with the cases of A3, of the count's words, of `commandKey` and of `paneMenu`. Built app, alone while written: `test/terminal-basics.test.ts`, with A1, A2, A4, A5 and the rest of B4, and `test/screenshots.test.ts` without `OWLERY_SCREENSHOTS`, for the new view's name. At the phase's end, once: `OWLERY_BACKGROUND=1 pnpm run test:app`. | built `cf5f148b`; `trail/phases/phase-2.md` |
| 3 | *Scope* items 13, 14, 15, 16, 17, 18, 19, 20, 21 and 22 | Unit, while building: `node scripts/test-in-electron.mjs test/view.test.ts test/openers.test.ts test/clipboard.test.ts test/menu.test.ts`, with the cases of C1, C2, C4, C5, D1, D2, D3 and D4. Built app, alone while written: `test/terminal-basics.test.ts`, with C1 and C3 through the stand-in `OWLERY_OPENER` names, D1's `paste` event and D5. At the phase's end, once: `OWLERY_BACKGROUND=1 pnpm run test:app`, then `OWLERY_SCREENSHOT_THEMES=all pnpm --filter @owlery/desktop run screenshots`. The shots of the Machine dialog, the find bar and the Settings dialog, for every theme and appearance, are committed under `seal/threads/1795651593-231-pane-output-is-searched-and-opens-paths/screenshots/`. The broad gate is the orchestrator's. | built `c04395be`; `trail/phases/phase-3.md` |

## Overlap with the release

The spawn named #218, #249 with #251, #224, #217, #215, #216, #223, #213 and #230. #249 with #251 has a frame at `11e39c8b` and #218 one at `34e6be48`, each read at its commit (`gh api` and `git show`, `executed` 2026-11-26). The branches of #224, #217, #215, #216, #223 and #213 are not on origin, so their rows read each issue's body (`gh issue view`), and what their builds changed is `unverified`, for the orchestrator to answer when they arrive. #230 is not started.

Every meeting below is two changes in different parts of one file, except #230's, where one item's list reads the other's keys. This work is the largest diff of the release that is not yet built, so it merges after the others, and takes `release/v0.0.5` into its branch by a merge before its broad gate.

| Work item | Where both change | Merges first | Grounds |
|---|---|---|---|
| #249 with #251 | `apps/desktop/src/renderer/renderer.ts`: theirs draws the session and loss lists of the delete and removal dialogs, this work adds the find keys' caller and the Settings dialog. `apps/desktop/src/shared/protocol.ts`: theirs rewrites the doc comment of `Running`, this work changes `Cap`, `Machine` and `setCaps`. `docs/design.md` and `docs/design.ko.md` *Components and their states*: theirs edits the row "The delete dialog", this work adds two rows and edits "The Machine dialog". `apps/desktop/test/screenshots.test.ts`: theirs changes the delete view's wait, this work adds views. | #249 | It changes the window alone and is the smaller diff, so it is likelier to be sealed first. |
| #218 | `apps/desktop/src/daemon/daemon.ts`: its frame changes how a sign-in pane starts, in `startSession` (`:2427`), and this work changes the buffer a pane gets a few lines below (`:2436`), so the two edits stand side by side in one function. `apps/desktop/src/renderer/renderer.ts` and `index.html`: the Accounts dialog there, and the Settings dialog, the Machine dialog's row and the find bar here. `docs/design.md` *Components and their states*, other rows. `apps/desktop/test/screenshots.test.ts`: both rewrite the pins of the views' file names. `sign-in-pane.ts` is #218's and is out of this work's scope. | #218 | Its frame names itself first for the same reason this one does: it is the smaller diff. The later one takes the merged `startSession` and rewrites the screenshot pins with both sets of views. |
| #213 | `apps/desktop/src/renderer/work-item-view.ts`: the tab strip there (`tabElement`, `:1147`), a pane's screen and its own menu here (`newScreen`, `menuAct`). `view.ts`: the tab's menu there, `paneMenu` here, which is the menu of a pane's screen and gains "Find…". `index.html`. | #213 | Built already, so it is sealed sooner. |
| #230 | `view.ts`, `commandKey` and `paneKey`, and `renderer.ts`, their callers. #230 lists every key in one place and checks each against what a pane's program reads. That list reads this work's keys: ⌘F, ⌘G, ⇧⌘G and ⌘,, with Enter, Shift+Enter and Escape in the bar. | #231 | #230 is not started and waits for #213. Its frame then reads these keys in the merged tree. |
| #224 | `work-item-view.ts`, `index.html` and `view.ts`: the Ask section goes there. `apps/desktop/test/screenshots.test.ts` and the scene's paragraphs of `docs/design.md` *A pull request that changes the window carries its screenshots*: #224 rewrites the scene, and this work adds views to the list of views and to the run. | #224 | Built already. This work's new views are written against the scene as #224 leaves it. |
| #217 | `apps/desktop/src/daemon/daemon.ts` and `protocol.ts`: the creation of a work item there, the panes' buffers and `setCaps` here. `index.html`. | #217 | Built already. |
| #215 and #216 | `view.ts`, `renderer.ts` and `index.html`: the sidebar and its head row there. `docs/design.md` *Components and their states*, the sidebar's rows there and new rows here. | #215, then #216 | Built already. |
| #223 | `view.ts` (`approvalPlaces`) and `daemon.ts`. | #223 | Built already. |

## Operational impact

- **A new dependency:** `@xterm/addon-search` 0.16.0 in `apps/desktop/package.json`, with the lockfile. It states no peer dependency and is the registry's `latest` beside `@xterm/xterm` 6.0.0.
- **A new file of the app's user data folder:** `editor.json`. An app that finds none asks at the first click on a file.
- **The daemon's caps file gains `scrollback`.** A daemon of an earlier build that an update leaves running sends none, and the window keeps 1,000 lines until that daemon is replaced or restarted.
- **A folder of the system's temporary folder, `owlery-pasted`,** holds pasted images for seven days at most.
- **A new key of the application menu, ⌘,.** No page reads that key.
- No migration, no environment variable and no compatibility break. The version does not move in this pull request: `routing.md` says it already stands at 0.0.5.

## Judgments of the run

| Date | Judgment | Grounds | Judged against |
|---|---|---|---|
| | | | |
