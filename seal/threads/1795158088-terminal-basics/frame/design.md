# Design: 1795158088-terminal-basics

The ticket is issue #95. `routing.md` was read: the work runs through the review chain, and a framer plans it.

## Grounding

The tree as read at `efde55b`.

| Policy clause | What it fixes for this work |
|---|---|
| `docs/product.md` *Foundation: the inbox, the AgenticSeal process and the back of the seal, with terminals on call*, "Every feature of that CLI works as it does outside the app, and no agent needs special support from the app" | A pane behaves as a terminal does for whatever runs in it. The drop, the link and Shift+Enter are therefore built for every kind of pane, and nothing in them names Claude Code |
| `docs/architecture.md` *Memory design*, the row "Only one window is used. There is no built-in browser" | No second window opens, and no page of the web is shown inside Owlery. A link leaves for the system browser. `## Rule changes` adds the rule that holds this in the main process |
| `docs/architecture.md` *Rules that keep it portable*, as `apps/desktop/src/daemon/pane-kinds.ts` cites it: a client names no kind of pane | The confirmation before a close reads a session's `alive` and `state`, and not its kind |
| `docs/roadmap.md` *Milestones*, row 1, "The Korean input regression test passes", with the rule the design of `1795046888-korean-input-test` adds to that section, whose check line names `apps/desktop/test/korean-input.test.ts` | The key handler this work attaches to a terminal leaves every key of a composition to the terminal. Phase 2 runs that file by itself |
| `docs/roadmap.md` *Goal*, "It is the macOS desktop app only" | The menu is drawn for macOS. Another platform gets a menu that keeps the same keys free and nothing more |
| `docs/product.md` *What we deliberately don't do*, "We do not build an IDE, a kanban board or a built-in browser" | Issue #35 keeps the study of how far the terminal goes. This work is the minimum issue #95 lists |

The policy root holds no rule on a pane's keys, on a drop, on the app's menu or on closing a pane. No unsettled design's `## Rule changes` under `seal/threads/` names one either (`executed`: each design's section was printed on 2026-11-20). `seal/follow-up.md` does not exist. `seal/parity.json` is not declared. Issue #95 had no comment on 2026-11-20 (`executed`: `gh issue view 95 --json title,body,comments,milestone`).

### What the first four do today

The issue's first *Done when* line asks that the first step drive the built app and write what each of the first four does today. The framer ran one probe on 2026-11-20 (`executed`). It built the app from a `git clone --no-local` of this branch at `efde55b`, started it with `OWLERY_BACKGROUND=1` and with a user data folder and a repository of its own under the system's temporary folder, and spoke to the window through the debugging port and to the main process through its inspector (`--inspect`). The versions were Electron 45.3.3 and Chromium 156.0.8078.100. The probe is `test_tmp_probe.mjs` under the framer's scratch directory, and its output is `probe-output.txt` beside it.

| Behaviour | What the probe saw | What the issue said |
|---|---|---|
| A file dropped on the window | `Input.dispatchDragEvent` with one file, dropped while the inbox screen was in front after the reload below: the page received `dragenter` and `dragover` with the type `Files` and no `drop` event, the main process saw no `will-navigate`, and the window still showed its own page. Nothing was typed into a pane. A drop on a pane itself and a drag from Finder were not run | The issue says Electron's default navigates the window to the dropped file. It does not: `webPreferences.navigateOnDragDrop` is `false` by default (`read`: `apps/desktop/node_modules/electron/electron.d.ts:20450`, the comment on that option) |
| A URL in a pane | The pane printed `https://example.com/owlery-probe` on its first row. A press and release of the left button with the Command key held, at the tenth cell of that row, opened no window, raised no `will-navigate` and sent no byte to the pane's process | As the issue says: nothing happens |
| Shift+Enter | The pane's process received `0d` for Enter, `0d` for Shift+Enter and `1b0d` for Option+Enter | As the issue says: Shift+Enter is Enter |
| Cmd+W | The app's menu is Electron's default. Its item `File/Close Window` has the role `close` and the accelerator `CommandOrControl+W`. No item is bound to the Command key with K or with N. The key itself was not pressed: the debugging port sends a key to the page and never through the system's menu | As the issue says, by the menu's binding. A press of the key by a person is `unverified` |

Two more facts came from the same run (`executed`).

- `window.location.reload()` raises `will-navigate` in the main process, with the window's own URL. `apps/desktop/src/renderer/renderer.ts:368` reloads that way when the daemon goes away, so a guard on navigation has to let it through.
- The main process's inspector answers with `require` in scope, in an app started in the background. A case can therefore read `Menu.getApplicationMenu()` as Electron built it.

### What the tree and the installed versions answer

| Fact | Label and coordinate |
|---|---|
| Nothing in the tree takes a drop, provides a link, attaches a key handler to a terminal, builds a menu, handles `will-navigate` or sets a window open handler | `read`: `apps/desktop/src/main/main.ts`, `apps/desktop/src/renderer/work-item-view.ts` and `apps/desktop/src/renderer/renderer.ts`, each whole |
| The window reads K and N with the Command key in the page, before a terminal reads them | `read`: `apps/desktop/src/renderer/renderer.ts:122` and `:402`, `apps/desktop/src/renderer/view.ts#commandKey` |
| A press of a tab's "×" sends `close` at once, and the daemon ends the process and takes the session off its lists | `read`: `apps/desktop/src/renderer/work-item-view.ts:287`, `apps/desktop/src/daemon/daemon.ts:308` |
| A session's `state` is `working`, `waiting`, `finished` or null, and null always for a kind that reports no state | `read`: `apps/desktop/src/shared/protocol.ts:20` and `:101` |
| xterm 6.0.0 has `attachCustomKeyEventHandler`, `registerLinkProvider`, `paste`, `input` and the option `linkHandler`. With no `linkHandler` set, a link a program prints with the OSC 8 sequence asks through the browser's `confirm` | `read`: `apps/desktop/node_modules/@xterm/xterm/typings/xterm.d.ts:163`, `:1025`, `:1072`, `:1102`, `:1275` |
| `@xterm/addon-web-links` 0.12.0 is the `latest` release and was published within a minute of `@xterm/xterm` 6.0.0, on 2025-12-22 | `executed`: `npm view @xterm/addon-web-links time dist-tags` and `npm view @xterm/xterm time` |
| Electron 45.3.3 has `webUtils.getPathForFile(file)`, which gives a dropped file's path and an empty string for a file that is not on disk, `webContents.setWindowOpenHandler`, the event `will-navigate` and `Menu.setApplicationMenu` | `read`: `apps/desktop/node_modules/electron/electron.d.ts:20870`, `:19582`, `:18621`, `:10199` |
| Claude Code inserts a line break on Ctrl+J, which is the byte `0a`, "in every terminal with no setup". Option+Enter is also a line break where the terminal sends Option as Meta, which a pane does (`macOptionIsMeta`, `work-item-view.ts:113`) | `read`: `https://code.claude.com/docs/en/terminal-config`, *Enter multiline prompts* and *Enable Option key shortcuts on macOS*, fetched 2026-11-20 |
| Claude Code takes an image that is dragged into its window or given as a path | `read`: `https://code.claude.com/docs/en/common-workflows`, *Work with images*, fetched 2026-11-20 |
| Whether Claude Code reads a path with a backslash before each of its spaces as an image | Nobody's finding. `frame/questions.md` Q1 names who measures it |
| No case of the suite presses a tab's "×" | `executed`: ``git grep -n -e '\.close"' -e '\.close`' -e 'tab \.close' -e '"\.close' efde55b -- apps/desktop/test`` printed nothing. The cases of `daemon.test.ts` send the protocol's `close` |

### Judgments the issue left open

- **Cmd+W where no pane is in front does nothing.** The issue's line reads "Cmd+W closes the pane in front, and does not close the window", and its second half carries no condition. Shift+Command+W closes the window.
- **The window's navigation is still guarded**, though a drop does not navigate today. The issue asks that "no window of Owlery's navigates to a page", and one guard in the main process holds that whatever a later change of the page or of a default does.
- **The first *Done when* line is met by the first table of this section** for what the debugging port can drive. Each phase sees its cases red before its code, which shows the same behaviour again at the commit the build starts from.

## Scope

In scope, as numbered items. The **pane in front** is the pane `work-item-view.ts` holds as `front`: the one with the keyboard, in the view on screen.

1. **The window shows its own page and nothing else.** The main process refuses every navigation of the window whose URL is not the URL the window already shows, so the reload of `renderer.ts:368` passes and nothing else does. It refuses every new window the page asks for. Both are set on the window `main.ts#createWindow` makes.
2. **A file dropped on a pane types its path.** A pane's element accepts a drag that carries files. At the drop, the window reads each file's path through the preload, in the order the drop gives them. It leaves out a file that has no path on disk and a path that holds a control character (a code below 32, or 127). It writes the paths that are left as one text: each path with a backslash before every ASCII character that is not a letter, a digit or one of `/ . _ - + = : , @ %`, the paths joined by one space, and one space after the last. A character outside ASCII is written as it is. The text is handed to that pane's terminal as a paste (`Terminal.paste`), so a program that asked for bracketed paste receives it as one. The pane that took the drop becomes the pane in front. A drop that leaves no path types nothing. A drop anywhere else in the window does nothing.
3. **A URL in a pane opens in the system browser on Command+click.** Each terminal screen loads `@xterm/addon-web-links`. A click on a link opens it only where the Command key is held (the Control key where the keyboard has none), and a click without it does what it does today. A link a program prints with the OSC 8 sequence is opened under the same rule, through the terminal's `linkHandler` option, in place of xterm's own question. The window asks the main process to open the address over a new channel. The main process opens an address only where it parses as a URL whose scheme is `http` or `https`, and answers whether it opened it.
4. **Who opens the address.** Where the app's environment holds `OWLERY_OPENER`, the main process runs that program with the address as its one argument, through `execFile` and no shell. Otherwise, in an app started in the background (`OWLERY_BACKGROUND=1`), it opens nothing and answers `false`. Otherwise it calls Electron's `shell.openExternal`. The main process takes `OWLERY_OPENER` out of its environment at load, as it takes `OWLERY_BACKGROUND`, so the daemon and the panes' processes start without it.
5. **Shift+Enter sends a line feed.** A press of Enter with the Shift key and no other modifier, outside a composition, sends the one byte `0a` to the pane, through the path a typed key takes, and the terminal sends nothing else for that press. Outside a composition means that the key event's `isComposing` is false and its `keyCode` is not 229. This holds for every kind of pane. Enter and Option+Enter send what they send today.
6. **The app has a menu of its own.** The main process sets the application menu before it makes the window. On macOS it holds: the app's menu with "About Owlery", the Services menu, "Hide Owlery", "Hide Others", "Show All" and "Quit Owlery"; "File" with "Close Window" on Shift+Command+W; and "Edit", "View" and "Window" with the items Electron's default menu holds today, as the probe's output lists them. On another platform "File" also holds "Quit". No item of the menu is bound to a key `view.ts#commandKey` reads.
7. **Cmd+W closes the pane in front.** `view.ts#commandKey` reads W with the Command key, under the conditions it reads K and N. The window then closes the pane in front, as a press of that pane's "×" does (item 8). Where no pane is in front, on any screen, the key does nothing. The window keeps the key from the terminal in both cases.
8. **Closing a pane whose session is working asks once.** A session is working where its `alive` is true and its `state` is `working`. A press of the "×" of such a pane's tab, or Cmd+W with such a pane in front, opens a dialog in the window. The dialog says "<the tab's label> is working. Closing the pane ends its session." and holds "Cancel", where the keyboard starts, and "Close pane". "Close pane" sends the `close` and closes the dialog. "Cancel" and Escape close the dialog and send nothing. Where the daemon no longer lists the pane while the dialog is open, the dialog closes. After the dialog closes, the keyboard goes to the pane in front. Any other pane closes at the first press, as today. While the dialog is open the window reads none of its keys: the renderer tells `commandKey` and `inboxKey` that a dialog is open where any `dialog` element of the page is open.
9. **The changelog fragment** `changelog.md` says what a person newly sees.

Out of scope.

- What Claude Code does with the byte and with the path. Items 2 and 5 fix what the pane's process receives. `frame/questions.md` Q1 names who measures Claude Code.
- An image that is on no disk: one dragged out of a browser, or held on the clipboard. It has no path to type.
- A drag that carries text and no file.
- A file whose name holds a control character. It is left out and nothing says so.
- A link that is not `http` or `https`, a file's path as a link, and a hint that names the key while the pointer is over a link.
- The kitty keyboard protocol and any key but Shift+Enter. xterm 6.0.0's typings name neither that protocol nor `modifyOtherKeys` (`executed`: `grep -n -i 'kitty\|modifyOtherKeys'` on `apps/desktop/node_modules/@xterm/xterm/typings/xterm.d.ts` printed nothing). Issue #35 holds the study.
- A confirmation for a shell pane in which a command runs. A shell pane reports no state, so the window cannot tell.
- A confirmation where issue #93's archive or delete ends a work item's panes. Its own dialogs name those sessions.
- Menu items for what the page reads as keys: the search, the "New work item" form, closing a pane. A menu item bound to a key takes that key before the page sees it.
- A press of Cmd+W, a press of Cmd+V and a drag from Finder by a person. No case can make them without taking the person's keyboard and pointer. `frame/questions.md` Q4 holds them.
- The release's version, which has already moved.

## User scenarios & acceptance *(mandatory)*

The built-app cases live in one new file, `apps/desktop/test/terminal-basics.test.ts`, with one start of the app through `BuiltApp.start`. The pane's process there is a stand-in for the shell, `test/fixtures/basics-shell.sh`. It asks for bracketed paste, prints one URL and one OSC 8 named link, and then writes every byte it is handed to a file, as `test/fixtures/receiver.sh` does. Without bracketed paste a paste and typed input write the same bytes, and no case could tell them apart.

| Scenario | Given / When / Then | Verifiable how |
|---|---|---|
| 1. The page asks to leave | Given the window on a work item's view. When the page sets `location.href` to the file URL of a temporary file. Then the window still shows its own page and the pane is still listed. When the page calls `location.reload()`. Then the page loads again and puts a screen in front | A case of `terminal-basics.test.ts`, seen red twice: without the guard, and with a guard that refuses every navigation. Cases of the pure function in the new `apps/desktop/test/navigation.test.ts` |
| 2. The page asks for a window | When the page calls `window.open` with a file URL. Then the call returns null and the debugging port lists one page | A case of `terminal-basics.test.ts`. Its red is shown with a handler that allows the window with `show: false`, so no window appears on the person's screen |
| 3. A file is dropped on a pane | Given a file whose name holds a space, a Korean syllable, a quote and the ending `.png`. When it is dropped on the pane. Then the pane's process receives the file's path as *Scope* item 2 writes it, with one space after it, between `ESC[200~` and `ESC[201~`, and the window still shows its own page | A case of `terminal-basics.test.ts` through `Input.dispatchDragEvent`, as `frame/questions.md` Q2 decides. Cases of `droppedText` in `apps/desktop/test/view.test.ts`: a path of safe characters alone, one with each escaped character, one in Korean, two paths, a path with a line feed, and no path |
| 4. A link is clicked with the Command key | Given the URL the pane printed, and `OWLERY_OPENER` naming a program that writes its argument to a file. When the URL is clicked with the Command key held. Then that file holds the URL, the debugging port lists one page, and the window shows its own page | A case of `terminal-basics.test.ts` |
| 5. A link is clicked without the key | When the URL is clicked with no key held. Then the opener's file holds nothing more | A case of `terminal-basics.test.ts` |
| 6. Which address opens, and who opens it | An `http` and an `https` address are handed to the opener. A `file:` address, a `javascript:` address and a text that is no URL are refused and the opener is not called. With a program named, the program is the opener. In the background with none named, nothing opens and the answer is `false`. Otherwise the system's opener is called | Cases of the new `apps/desktop/test/links.test.ts`, with the opener handed in. No case calls `shell.openExternal` |
| 7. Shift+Enter | When Enter is pressed with Shift in the pane. Then the pane's process receives `0a` and nothing else. Enter still gives `0d` and Option+Enter `1b0d` | A case of `terminal-basics.test.ts`. Cases of `paneKey` in `view.test.ts`: Shift+Enter, the same during a composition by `isComposing` and by key code 229, and with each other modifier |
| 8. Korean still arrives | The lines of `test/fixtures/korean-input.json` reach the pane's process as before | `apps/desktop/test/korean-input.test.ts`, run by itself in phase 2 |
| 9. The menu | The application menu, as Electron built it, holds no item whose accelerator is the Command key with K, N or W and no other modifier. It holds "Close Window" on Shift+Command+W, and items with the roles `copy`, `paste` and `quit` | A case of `terminal-basics.test.ts` that reads `Menu.getApplicationMenu()` through the main process's inspector, seen red against Electron's default menu |
| 10. Cmd+W | Given two panes of a work item, neither working. When Cmd+W is pressed. Then the pane in front is gone from the tabs, its process has ended, the other pane is in front, and the debugging port still lists the page. Given the inbox screen in front. When Cmd+W is pressed. Then the page is still listed and no pane closed | A case of `terminal-basics.test.ts`. Cases of `commandKey` in `view.test.ts` |
| 11. A working pane asks | Given a pane whose session is working. When its "×" is pressed. Then the dialog is open with the tab's label in its sentence, the keyboard is on "Cancel", and the pane is listed. When "Cancel" is pressed. Then the pane is listed and the dialog is closed. When Cmd+W is pressed. Then the dialog is open again. When "Close pane" is pressed. Then the pane is gone from the tabs | Cases of `closeAsks` in `view.test.ts`: alive and working asks, and waiting, finished, no state and an exited working session do not. A case of `terminal-basics.test.ts`, as `frame/questions.md` Q3 decides |
| 12. Any other pane closes at once | Given a shell pane. When its "×" is pressed. Then the pane is gone from the tabs and no dialog opened | A case of `terminal-basics.test.ts` |

## Data & interfaces

`apps/desktop/src/shared/ipc.ts`: `Channel` gains `openLink: "owlery:open-link"`. `OwleryApi` gains `openLink(url: string): Promise<boolean>`, which answers whether the main process opened the address, and `pathOf(file: File): string`, which gives a dropped file's path or an empty string.

`apps/desktop/src/preload/preload.ts` exposes both: `openLink` through `ipcRenderer.invoke`, and `pathOf` through `webUtils.getPathForFile`.

`apps/desktop/src/main/navigation.ts` is new and imports nothing of Electron. It exports the function that says whether a navigation stays on the page: it takes the URL asked for and the URL the window shows.

`apps/desktop/src/main/links.ts` is new and imports nothing of Electron. It exports three functions and the type `Opener`. The first is *Scope* item 3's: it takes an address and an opener and answers whether it opened the address. The second is item 4's: it chooses the opener from the program named, the background switch and the system's opener. The third reads `OWLERY_OPENER` and takes it out of an environment, as `background.ts#takeBackground` does for its variable.

`apps/desktop/src/main/menu.ts` is new and imports nothing of Electron. It exports the menu's template for a platform.

`apps/desktop/src/main/main.ts` sets the menu, puts the guard of item 1 on the window, and handles `Channel.openLink`.

`apps/desktop/src/renderer/view.ts` gains four functions. `droppedText(paths: readonly string[]): string` is item 2's text. `paneKey` takes a key event's `key`, its four modifiers, `isComposing` and `keyCode`, and returns `"lineFeed"` or null (item 5). `linkOpens` takes the click's Command and Control keys and whether the keyboard is a Mac's (item 3). `closeAsks(session: SessionInfo): boolean` is item 8's test. `commandKey` returns `"closePane"` for `KeyW` beside its two values.

`apps/desktop/src/renderer/work-item-view.ts`: `newScreen` attaches the key handler, loads the link add-on, sets `linkHandler`, and calls `takesDrops`, which listens for the drag and the drop. `initView` takes whether the keyboard is a Mac's, which decides the key a link's click is read with. `tabElement`'s "×" and a new exported function that closes the pane in front both go through one function, which asks where `closeAsks` holds. `apps/desktop/src/renderer/renderer.ts#onCommandKey` calls that exported function. `apps/desktop/src/renderer/index.html` gains the dialog, with the id `close-pane-dialog`.

`apps/desktop/package.json` gains the dependency `@xterm/addon-web-links` at `0.12.0`, pinned as the other xterm packages are, and `pnpm-lock.yaml` follows.

`apps/desktop/test/built-app.ts`: `BuiltApp.start` gains an option that also opens the main process's inspector, and `BuiltApp` gains a method that evaluates an expression there and a method `pages()`. The page and the main process are driven through one class, `DebugSession`.

`apps/desktop/src/shared/protocol.ts` and everything under `apps/desktop/src/daemon/` are not changed.

## Rule changes

- add
  file: docs/architecture.md
  section: Screen framework: Electron
  to: **The window shows Owlery's own page and nothing else, and no second window opens.** The main process refuses every navigation of the window but a reload of its own page, and refuses every new window. So nothing a pane prints and nothing a person drops on the window can replace the window or open a page of the web inside Owlery. A link a pane prints opens in the system browser, on a click with the Command key held, and only where its address is an `http` or `https` one. An app started with `OWLERY_BACKGROUND=1` opens no address in the system browser.
    check: apps/desktop/test/terminal-basics.test.ts apps/desktop/test/navigation.test.ts apps/desktop/test/links.test.ts

- add
  file: docs/architecture.ko.md
  section: 화면 프레임워크: Electron
  to: **창은 Owlery 자신의 화면만 보이고, 두 번째 창은 열리지 않습니다.** 메인 프로세스는 창이 자기 화면을 다시 읽는 것 말고는 어디로도 이동하지 못하게 막고, 새 창도 모두 막습니다. 그래서 칸에 찍힌 글자도, 사람이 창에 끌어다 놓은 것도 창을 바꾸거나 Owlery 안에 웹 페이지를 열지 못합니다. 칸에 찍힌 링크는 Command 키를 누른 채 클릭하면 시스템 브라우저에서 열리고, 주소가 `http`나 `https`일 때만 열립니다. `OWLERY_BACKGROUND=1`로 띄운 앱은 시스템 브라우저에서 어떤 주소도 열지 않습니다.
    check: apps/desktop/test/terminal-basics.test.ts apps/desktop/test/navigation.test.ts apps/desktop/test/links.test.ts

## Removes

| Removes | Coordinate | Where it lands, or why it can go |
|---|---|---|
| 1. The close of a pane whose session is working at the first press of "×" | `apps/desktop/src/renderer/work-item-view.ts#tabElement`, its listener on `close` and the comment above it | *Scope* item 8: the press opens the dialog, and "Close pane" sends the `close`. A pane that is not working still closes at the first press |

The work takes no file, no case and no rule out of the tree. Electron's default menu, with "Close Window" on Command+W, stops being the app's menu, and it was never in the tree. The rule `## Rule changes` adds, with its check line, takes nothing out in return: no rule and no case at `efde55b` holds the window to its own page.

Framed 2026-11-20 by framer, before the build.
