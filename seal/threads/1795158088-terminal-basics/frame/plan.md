# Implementation Plan: 1795158088-terminal-basics

## Technical context

The tree as read at `efde55b`.

**What the work builds on.**

- `apps/desktop/src/main/main.ts#createWindow` (lines 22 to 43) makes the one window, with `contextIsolation`, `sandbox` and no `nodeIntegration`. The handlers of the window's channels stand under `app.whenReady` (lines 45 to 77). `main.ts` builds no menu and guards no navigation.
- `apps/desktop/src/main/background.ts` reads `OWLERY_BACKGROUND` and takes it out of the environment. It imports nothing of Electron, and `test/background.test.ts` reads it without the app. `apps/desktop/src/main/pick-folder.ts` takes the native dialog as a function handed in, and `test/pick-folder.test.ts` hands in a stand-in. The new modules of `frame/design.md` *Data & interfaces* follow both.
- `apps/desktop/src/renderer/work-item-view.ts#newScreen` (lines 102 to 146) makes a terminal and wires what it hands the window: `term.onData` sends to the pane `turns.receiver()` names (lines 130 to 133). A paste and the line feed of *Scope* item 5 go through that same path, so `view.ts#screenTurns` keeps deciding which pane receives them, and nothing is sent while a replay is drawn.
- `work-item-view.ts#tabElement` (lines 271 to 290) draws a tab and sends `close` at line 287. `front` (line 31) is the pane in front.
- `apps/desktop/src/renderer/renderer.ts#onCommandKey` (lines 122 to 129) acts on `view.ts#commandKey`, and is registered on the capture phase at line 402, so it reads a key before a terminal does. It tells `commandKey` that a dialog is open from `workItemDialog.open` alone (line 123), and `onKey` does the same at line 143.
- `apps/desktop/test/built-app.ts#BuiltApp.start` (lines 121 to 144) starts the built app with a user data folder of its own and `OWLERY_BACKGROUND=1`, and speaks to the page through the debugging port. `apps/desktop/test/korean-pane.ts#openReceiverPane` opens a shell pane through the form, and `Received` reads the bytes the pane's process was handed.

**Constraints every party of this work item keeps.**

- The owner runs Owlery from the main clone `/Users/michael/Documents/GitHub/owlery`, on `release/v0.0.1`, with a daemon (pid 95337 on 2026-11-20) that uses `~/Library/Application Support/@owlery/desktop/`. No party builds, tests or commits in the main clone: `test/built-app.ts#buildApp` rewrites the `dist` of the tree it runs in. No party stops that daemon, reads or writes that folder, or creates a work item or a branch in a repository of the owner's.
- Every start of the app by an agent sets `OWLERY_BACKGROUND=1`, through `BuiltApp.start`, and a phase makes as few starts as its verification needs.
- No case and no probe opens a URL in the owner's browser. The opener is handed in: a function in `test/links.test.ts`, and the program `OWLERY_OPENER` names in `test/terminal-basics.test.ts`. No case calls `shell.openExternal`.
- No case shows a second window on the owner's screen. Scenario 2's red is shown as its row states.
- The branch is never rebased, no hook is skipped, and no party pushes.
- The work carries no move of the version.

**What the framer's probe left.** The first run of Electron's launcher in this worktree downloaded Electron's binary into `node_modules/.pnpm/electron@45.3.3/node_modules/electron/dist`, as the first run of the suite in a worktree does. The clone, the probe and its output stay under the framer's scratch directory.

**The failure scenario of the chosen approach.** Cmd+W closes a pane only while no menu item is bound to that key, because a menu item takes its key before the page sees it. In six months a work item adds a menu item for something the page reads as a key, such as "New Work Item" on Command+N. The page then never sees that key, the form's key stops working, and no case that types through the debugging port notices, because that port sends a key to the page past the menu. Scenario 9's case is what holds this: it reads the menu Electron built and fails where an item is bound to a key `commandKey` reads. The second scenario is an upgrade of xterm that changes when it calls a custom key handler, or of the link add-on apart from xterm. Scenario 7's case reads the exact bytes, and scenario 8's file reads a composition, so either upgrade fails a case.

## Alternatives considered

| Approach | Failure scenario | Verdict |
|---|---|---|
| **Cmd+W: the page reads the key, and no menu item is bound to it.** Keeps the structure of `renderer.ts:402`, where the page reads the Command keys | A later menu item takes a key the page reads, as *Technical context* states | Chosen. The premise that keeps the structure: a key no menu item claims reaches the page, and only a key sent to the page can be a case. Checked: the probe's keys reached the pane's process through the debugging port, and Electron's default menu binds neither K nor N with the Command key, which the page reads today (`frame/design.md` *What the first four do today*). A person's press of Cmd+W under the new menu is `frame/questions.md` Q4 |
| **Cmd+W: a menu item "Close Pane" bound to the key, which tells the page over a new channel.** Replaces that structure: every Command key would move to the menu in time | The debugging port cannot press a menu's key, so the path a person uses has no case, or the page also reads the key and two paths do one thing. It adds a channel from the main process to the page, where `ipc.ts` holds none today | Rejected. The menu would show the key beside the item, which is what this gives up |
| **Shift+Enter sends `0a`, the byte of Ctrl+J** | A program that reads `0a` as Enter submits, as today. A shell does | Chosen. Claude Code's documentation names Ctrl+J as the line break that works "in every terminal with no setup" (`frame/design.md` *What the tree and the installed versions answer*) |
| Shift+Enter sends `1b0d`, the bytes of Option+Enter | A program that reads Escape by itself takes the first byte as a cancel: a dialog of a CLI closes, and vi leaves its insert mode | Rejected. It is `frame/questions.md` Q1's second option, should the measurement find that `0a` submits |
| Shift+Enter sends the kitty keyboard protocol's sequence | xterm 6.0.0 does not implement that protocol, so the pane cannot know whether the program asked for it, and a shell prints the sequence as text | Rejected. Issue #35 holds it |
| **A dropped path is written with backslashes** | A program that does not read a backslash as an escape sees them in the name | Chosen. A path of safe characters alone is typed as it is, which is the form Claude Code's documentation names. By the framer's recollection, which nobody opened, Terminal.app types a dropped file's path with backslashes, so the escaped form would be the one Claude Code's "drag and drop an image" meets in Apple's terminal. `frame/questions.md` Q1 measures whether Claude Code reads the escaped form |
| A dropped path is written inside single quotes | Every path carries quotes, the one of safe characters too, so a program that does not strip them reads no path at all | Rejected |
| **The link add-on `@xterm/addon-web-links`** | It is a second package to keep at the version that pairs with xterm | Chosen. It finds a URL that wraps onto the next row, which a provider of the work's own would have to build again |
| A link provider of the work's own, through `registerLinkProvider` | A URL that wraps, a URL in brackets and a URL beside wide characters each become a defect of Owlery's | Rejected |
| **The opener is a program the environment names, and the background opens nothing without one** | An environment variable nobody documents. `changelog.md` and the comment on the function name it | Chosen. The case then clicks a real link and reads what reached the opener, and an app an agent starts cannot open the owner's browser whatever a case does |
| The case replaces `shell.openExternal` in the main process through its inspector | Where the replacement misses, because the bundle bound the function earlier, the case opens the owner's browser and passes | Rejected |
| No case clicks a link: the pure functions are cases, and the join is read | The join from the terminal's click to the main process is what a person uses, and it has no case | Rejected |
| **The confirmation is a `dialog` element of the page**, as the "New work item" form is (`index.html:504`) | One more dialog whose open state the keys have to respect. *Scope* item 8 makes the renderer read every open dialog | Chosen. A case can press its buttons through the debugging port, and it is drawn in the app's theme |
| The confirmation is the main process's `dialog.showMessageBox` | A native box cannot be pressed through the debugging port, and it shows on the owner's screen in a background start | Rejected |
| The confirmation is `window.confirm` | It blocks the page while it is open, so the daemon's messages wait, and it is a native box as above | Rejected |
| **The navigation guard is added**, though a drop does not navigate today | One more handler to keep. It has to let the reload of `renderer.ts:368` through, which scenario 1 holds | Chosen. The issue asks that no window navigates, and Electron's default alone would hold it only until an option or a version changes |
| No guard: rely on `navigateOnDragDrop` being `false` | A later link, a later `window.open` or a changed default navigates the one window, and the panes are gone from the person's sight | Rejected |
| **The menu is read as Electron built it**, through the main process's inspector | `BuiltApp` gains an option and a method | Chosen. A role brings its own accelerator, such as `close` with Command+W, and only the built menu shows it |
| The menu's template is a case by itself | The case has to know which roles bring which keys, and a role that brings Command+W in a later Electron passes it | Rejected |
| **The guard, the menu, Cmd+W and the confirmation are built before the drop, the link and Shift+Enter** | The later phase starts from the earlier one's commit, and both add cases to one file | Chosen. Each phase leaves the app working, and the earlier one holds the parts in which a defect would lose the window or a session, which `routing.md` *Why this way* names as the reason for the review rounds |
| Everything in one phase | One spawn holds the main process, the page's keys, the terminal's handlers and a new dependency, and its phase record is the only place a finding of the first half reaches the second | Rejected |

## Phases

| Phase | Delivers | Verified by | Status |
|---|---|---|---|
| 1 | `frame/design.md` *Scope* items 1, 6, 7 and 8, with `## Removes` row 1: the guard on the window, the menu, Cmd+W and the confirmation. The new file `test/terminal-basics.test.ts` with its one start of the app, and the inspector option of `test/built-app.ts` | Scenarios 1, 2, 9, 10, 11 and 12 as cases, each seen red before its code, and scenarios 1 and 2 as their rows state. The cases of `commandKey` and `closeAsks` in `test/view.test.ts` and the new `test/navigation.test.ts`, each file run by itself. `test/terminal-basics.test.ts` run by itself. `frame/questions.md` Q3 is decided here and written into `trail/phases/phase-1.md` | `ec84d9c` |
| 2 | *Scope* items 2, 3, 4, 5 and 9: the drop, the link with its opener, Shift+Enter, the dependency `@xterm/addon-web-links`, and the changelog fragment `changelog.md` | Scenarios 3, 4, 5, 6 and 7 as cases, each seen red before its code. The cases of `droppedText`, `paneKey` and `linkOpens` in `test/view.test.ts` and the new `test/links.test.ts`, each file run by itself. `test/terminal-basics.test.ts` run by itself. Scenario 8: `test/korean-input.test.ts` run by itself. `frame/questions.md` Q2 is decided here and written into `trail/phases/phase-2.md`. Q1 and Q4 go into `gaps.md` *Not verified* with the owner as their answerer, unless the phase measured Q1 | |

Each phase leaves the app working. After phase 1 the window has its menu and asks before it ends a working session, and a pane still takes no drop, no link and no Shift+Enter. The suite, the lint and the typecheck are the orchestrator's broad gate and no phase runs them.

## Overlap with the release

The spawn names #93, #31, #94 and #96. #93's frame was read as committed on its branch at `a6ff91f`, with the list of files its two closed phases changed against `95decb6`. #31's frame was read as committed at `71819c0`. #94's `frame/design.md` and `frame/plan.md` were read in its worktree on 2026-11-20, where they stood uncommitted above `30c2e59`. #96 has no branch and was read as the spawn states it.

| Work item | Where both change | Merges first | Grounds |
|---|---|---|---|
| #31, the notification click | `src/shared/ipc.ts`, the `Channel` list and `OwleryApi`; `src/preload/preload.ts`, the `api` object; `src/main/main.ts`, the handlers under `app.whenReady`. Each side adds an entry beside the other's. `src/renderer/work-item-view.ts`: #31 gives `enterView` an optional pane, and this work changes `newScreen` and `tabElement`. `src/renderer/renderer.ts`: #31 changes `takeLists` and `openView`, and this work `onCommandKey`. A fact: #31's main process brings nothing forward in a background start, and this work's opens no address there, so both keep an agent's start off the owner's screen | #31 | #31 is one phase with no review rounds, so it is sealed first, and its frame states the same order. This work merges the release branch inside review rounds it spends anyway |
| #94, the continue pane | `src/renderer/work-item-view.ts`: #94 changes `showPaneButtons`, and this work changes `newScreen` and `tabElement`. `src/renderer/view.ts` and `test/view.test.ts`: both add functions and cases. A fact #94's frame reads: it expects this work to treat a Claude Code pane specially. This design does not: the drop, the link and Shift+Enter hold for every kind, and the confirmation reads `state` and not the kind, so a continuing pane needs no case here | #94 | #94 is one small diff and its frame states the same order. Where this work is sealed first, each meeting is an addition beside an addition and either order holds the files |
| #93, the work item menu | `src/shared/ipc.ts`, `src/preload/preload.ts` and `src/main/main.ts`, as with #31. `src/renderer/view.ts#commandKey`: #93 adds `menuOpen` to its second argument, and this work adds the value `"closePane"`. `src/renderer/renderer.ts`: #93 adds a function `dialogOpen` that reads `dialog[open]` and passes it to `commandKey` and `inboxKey`, which is the read *Scope* item 8 asks for, and both change `onCommandKey`. `src/renderer/index.html`: both add a `dialog`. `test/view.test.ts`: both add cases of `commandKey`. A rule of #93 that reads this work: its *Scope* item 5 says the window reads none of its other keys while a menu is open, so after its merge Cmd+W is not read while a menu is open, which `commandKey`'s `menuOpen` gives it without more code. Its item 21 ends a work item's panes at an archive and a delete through its own dialogs, and no press of "×" is among them | #95 | #93 has four phases unbuilt and its rounds after them, so this work is sealed first. #93 then merges the release branch inside phases it spends anyway, keeps its own `dialogOpen` in place of this work's read, and adds a case of `commandKey` for `KeyW` with a menu open |
| #96, the fetch before a start | Nothing: by the spawn it waits for #93, and by #31's and #94's frames it changes how the daemon cuts a branch. This work changes nothing of the daemon | Either | The two do not meet |

The order this states is #31, #94, #95, then #93.

## Operational impact

One dependency is added: `@xterm/addon-web-links` at `0.12.0`. A worktree that takes this work runs `pnpm install` before it builds.

The app reads one new variable of its environment, `OWLERY_OPENER`: the path of a program the main process runs with an address as its one argument, in place of the system's opener. The app takes it out of its environment once it has read it. An app started with `OWLERY_BACKGROUND=1` and without `OWLERY_OPENER` opens no address.

Two keys change for a person. Cmd+W no longer closes the window: it closes the pane in front, and does nothing where none is. Shift+Command+W closes the window. Shift+Enter in a pane sends a line feed where it sent a carriage return.

The suite gains one start of the built app, in `test/terminal-basics.test.ts`, with the window opened in the background as `test/korean-input.test.ts` opens it.

No migration, and no change of the daemon or of its protocol: a daemon of the build before this one works with this window. The version does not move.

## Judgments of the run

| Date | Judgment | Grounds | Judged against |
|---|---|---|---|
| | | | |
