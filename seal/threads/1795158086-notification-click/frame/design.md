# Design: a click on a notification opens the work item that waits (#31)

The ticket is issue #31.

## Grounding

The tree as read at `ce9c41d`.

| Policy clause | What it fixes for this work |
|---|---|
| `docs/roadmap.md` *Milestones*, row 1, "An OS notification when a session waits for the person or finishes", and its *Done when*, "a notification arrives when the session waits" | The notification is owed. No document says what a click on it does, so this work decides it from the issue |
| `docs/roadmap.md` *Milestones*, row 2, which the issue cites | The row names no notification. The issue was planned for milestone 2 and the owner moved it into release 0.0.1, so the row fixes nothing for this work |
| `docs/product.md` *Foundation: the inbox, the AgenticSeal process and the back of the seal, with terminals on call*, "The app uses one window" | One window comes forward. This work opens no second window |
| `docs/architecture.md` *State lives in three places* | Which view a click opens is the window's own state. This work adds nothing to the daemon and nothing to the protocol |
| `docs/product.md` *What we deliberately don't do* | Nothing there forbids a notification that opens a view |
| The plugin's `skills/implement/SKILL.md` *Document layout — two roots, three lifetimes* | The subject of this work is the code, so a rule it changed would stand in `## Rule changes`. It changes none |

What the reading gave. Each fact is labelled as it was got.

- `executed`: `gh issue view 31 --json title,body,comments,labels,milestone` on 2026-11-20 gave an open issue in the milestone "release: 0.0.1". Its *Done when* holds one line: "A click on the notification brings the window forward and opens that work item's view." Its one comment is the note of 2026-11-20 that the owner moved the issue into release 0.0.1. The comment changes nothing of the request.
- `read`: the spawn's account that the orchestrator told the owner a Dock badge "can go in the same place" and that the owner did not decide it. Nobody but the orchestrator opened those words. The *Done when* line names no badge, so a badge is out of scope.
- `executed`: `git grep -n -e 'new Notification' -e 'onclick' -e 'app\.focus' ce9c41d -- apps/desktop/src` printed one line, `apps/desktop/src/renderer/renderer.ts:171`. The window raises every notification there, and nothing in the tree reads a click on one or brings a window forward.
- `read`, `apps/desktop/src/renderer/renderer.ts`, whole:
  - `takeLists` (`:163-177`) runs at each `inbox`. For each session it calls `view.ts#notificationFor` and, where that gives one, makes a web `Notification` with a title and a body and keeps no reference to it.
  - `openView(workItemId)` (`:80-84`) puts a work item's view in front of any screen, the view of another work item among them.
  - The case `ready` of `onMessage` raises no notification, and the window reloads one second after its connection to the daemon closes (`:365-369`). A notification raised before a reload therefore belongs to a page that is gone.
- `read`, `apps/desktop/src/renderer/view.ts#notificationFor` (`:720-734`): a notification is given when a session's state becomes `waiting` or `finished`, and never while its pane is on the stage of a focused window. Its title is the work item's title, or the pane's tab label for a session without a work item. This work does not change the function.
- `read`, `apps/desktop/src/renderer/work-item-view.ts`: `enterView` (`:343-349`) names the work item whose view is drawn. `showView` (`:299-340`) draws the pane `view.ts#stageOf` gives as the one in front, which is the first listed pane of `recent`, the panes that were in front of that work item. `broughtToFront` (`:84-86`) puts a pane first in `recent` and is not exported. Where the work item is not listed, `showView` calls `leave`, which opens the inbox screen.
- `read`, `apps/desktop/src/shared/protocol.ts:99`: a session's `workItemId` is a number or `null`. `apps/desktop/test/daemon.test.ts:183-192` starts such a pane, so a session without a work item exists.
- `read`, `apps/desktop/src/shared/ipc.ts`, `apps/desktop/src/preload/preload.ts` and `apps/desktop/src/main/main.ts`, whole: the window is sandboxed and reaches the main process through four channels. None shows or focuses the window. `main.ts` reads `OWLERY_BACKGROUND` once into `background` (`:18`), and under it the app is an accessory app whose window is shown with `showInactive` (`:20`, `:41`). `apps/desktop/src/main/pick-folder.ts` takes Electron's dialog as an argument, so its cases run without Electron.
- `read`, `apps/desktop/node_modules/electron/package.json` and `electron.d.ts` of the installed version, 45.3.3: a window declares `isMinimized()`, `restore()`, `show()` and `focus()` (`electron.d.ts:3449`, `:3566`), and `app.focus(options?: FocusOptions)` takes `steal: boolean`, "Make the receiver the active app even if another app is currently active", for macOS (`:1264`, `:22916-22923`).
- `read`, `apps/desktop/src/daemon/daemon.ts`: `agentEvent` (`:152-168`) changes a session's state only for a kind that reports its state, and sends an `inbox` at each change. A pane of such a kind that sent no event for ten seconds after its start becomes `waiting` (`:34`, `:469-473`), and its first event cancels that timer (`:154`).
- `read`, `apps/desktop/src/daemon/hooks.ts`: an event reaches the daemon as the pane's id on one line and the hook's JSON after it, written to the socket `hooks.sock` in the daemon's run folder (`parseEvent`, `:89-103`). `claudePaneCommand` (`:83-86`) runs the Claude Code kind's pane as `$SHELL -l -i -c 'exec claude …'`.
- `read`, `apps/desktop/test/fixtures/receiver.sh`: the script reads none of its arguments. An app started with `SHELL` set to it therefore starts no `claude` for a pane of the Claude Code kind, and that pane still reports the state the hook socket is fed.
- `read`, `apps/desktop/test/built-app.ts` and `apps/desktop/test/work-item-form.test.ts`: a case builds the app, starts it once with `BuiltApp.start` under `OWLERY_BACKGROUND=1` with a user data folder of its own, and drives the page through the debugging port. `Emulation.setFocusEmulationEnabled` makes the page report the focus.
- `read`, `seal/threads/1795019054-inbox/gaps.md:23` and `seal/threads/1795043695-inbox-first-window/frame/design.md:168`: both earlier work items left the click to issue #31 and decided nothing of it. `seal/threads/1795019054-inbox/trail/phases/phase-2.md:55` records the way a notification was read without raising one: `window.Notification` replaced by a recorder in the page, and a hook's payload fed to the daemon's socket.
- `executed`, `ls` at `ce9c41d`: `seal/follow-up.md` and `docs/README.md` do not exist. `gh release view --json body --jq .body` printed "release not found". `git grep -n '### Process changes' -- 'seal/threads/*/changelog.md'` printed nothing.
- `read`: of the unsettled designs' `## Rule changes`, the one that names a notification is the design of issue #93, which adds a sentence after "a notification arrives when the session waits" in `docs/roadmap.md` *Milestones* and keeps that sentence. No unsettled rule change states what a click does.
- Not established by the framer: that macOS delivers a person's click on the notification to the page's `Notification` object in this Electron, for a banner and for an entry of Notification Center. `frame/questions.md` Q1 holds it, with the reason no probe could run.
- The framer ran no check of the repository's: no test, no typecheck, no lint and no broad gate. The app was not started, and no probe was written.

## Scope

In scope, as numbered items.

1. **A notification answers a click.** Each notification `renderer.ts#takeLists` raises gets a handler for its click. The handler does items 2 to 5, for the session whose change of state raised the notification.
2. **The window comes forward.** The window asks the main process, over a new channel, to bring it forward. As the app ships, the main process restores the window where it is minimized, shows it, gives it the focus and makes Owlery the active app, and answers `true`. In an app started in the background, under `OWLERY_BACKGROUND=1`, the main process brings nothing forward and answers `false`, so a start a test or an agent makes still takes neither the system's focus nor the person's keyboard. Where the window that asked is gone, it answers `false`.
3. **The work item's view opens.** Where the session has a work item and the window's list still holds that work item at the click, the window puts that work item's view in front, of any screen, the view of another work item among them.
4. **The pane that raised the notification is in front of that view.** Where the daemon still lists the session's pane at the click, that pane is the one in front, as after a press of its tab. Where the pane is closed, the view opens as it opens from the inbox.
5. **A click that opens no view.** For a session without a work item, and for a work item the window's list no longer holds, the window comes forward and the screen in front stays.
6. **The "New work item" form stays.** Where the form is open at the click, it stays open with what it holds, and the view is drawn behind it.
7. **The changelog fragment** `changelog.md` says what a person newly sees.

Out of scope.

- A badge on the Dock icon. The issue's *Done when* does not name one, and the owner did not decide it.
- A click on a notification whose page is gone: one raised before the window reloaded or was closed. No handler is left for it, and macOS at most makes Owlery the active app. `frame/plan.md` *Technical context* names this as the failure scenario, and *Alternatives considered* the design that would cover it.
- When a notification is raised and what it says. `view.ts#notificationFor` is not changed.
- Taking a work item's other notifications out of Notification Center once its view opens.
- Bringing the window forward in an app started in the background.

## User scenarios & acceptance *(mandatory)*

| Scenario | Given / When / Then | Verifiable how |
|---|---|---|
| 1. What a click opens | Given a session of a listed work item whose pane is listed, then the click opens that work item with that pane. Given the same session and its pane no longer listed, then it opens the work item with no pane named. Given a session whose work item is not in the list, and given a session without a work item, then it opens nothing | Cases in `apps/desktop/test/view.test.ts` on the function *Data & interfaces* names |
| 2. The window comes forward | Given a minimized window of an app as it ships, then the window is restored, shown and focused, the app is made the active app, and the answer is `true`. Given a window that is not minimized, then it is not restored and the rest holds. Given an app started in the background, then nothing of the window and nothing of the app is called, and the answer is `false`. Given no window, then nothing is called and the answer is `false` | Cases in a new `apps/desktop/test/forward.test.ts`, on the function *Data & interfaces* names, with a window and an app that record their calls. The file imports nothing of Electron |
| 3. The click in the built app | Given the built app started in the background on a temporary repository, with `window.Notification` replaced by a recorder before any pane starts; a work item "Alpha" with a pane of the Claude Code kind and, started after it, a pane of the shell kind; and a work item "Beta" whose view is in front. When the daemon's hook socket is fed `UserPromptSubmit` and then `PermissionRequest` for Alpha's Claude Code pane, then the recorder holds one notification titled "Alpha" with the body "Waiting for you". When that notification's click handler is called, then the view on screen is Alpha's, the tab marked `active` is the Claude Code pane's, and `window.owlery.comeForward()` answers `false`. Given the inbox screen in front and the "New work item" form open, when `Stop` is fed and the second notification's handler is called, then Alpha's view is displayed and the form is still open | One new file `apps/desktop/test/notification-click.test.ts`, which starts the app once with `BuiltApp.start` and drives it through the debugging port. `SHELL` is the receiver of `test/fixtures/receiver.sh`, so no agent and no shell of the person's starts. The first event ends the pane's silent start, so the second is the change of state |

A person's click on a real macOS notification is verified by no scenario: no agent raises a notification on the owner's screen or presses one. It is `unverified`. `frame/questions.md` Q1 names the measurement and who makes it.

## Data & interfaces

`apps/desktop/src/shared/ipc.ts`: `Channel` gains `comeForward: "owlery:come-forward"`, and `OwleryApi` gains `comeForward(): Promise<boolean>`, which answers whether the main process brought the window forward. `apps/desktop/src/preload/preload.ts` exposes it with `ipcRenderer.invoke`.

`apps/desktop/src/main/forward.ts` is new and imports nothing of Electron. It exports the function of *Scope* item 2. The function takes the window that asked, or nothing where it is gone, as an object with `isMinimized`, `restore`, `show` and `focus`; whether the app started in the background; and a function that makes the app the active one. It returns the answer.

`apps/desktop/src/main/main.ts` handles the channel: it finds the window with `BrowserWindow.fromWebContents(event.sender)`, as the `pickFolder` handler does, and passes `background` and `() => app.focus({ steal: true })`.

`apps/desktop/src/renderer/view.ts` gains one function, beside `notificationFor`. It takes a session's `id` and `workItemId`, the listed work items and the listed sessions, and returns `{ workItemId: number; pane: number | null }` or `null`, as *Scope* items 3 to 5 state. `notificationFor` keeps its signature and its body.

`apps/desktop/src/renderer/work-item-view.ts#enterView` takes an optional pane, which it puts first among the panes that were in front of that work item. `apps/desktop/src/renderer/renderer.ts#openView` takes the same optional pane and passes it on. `renderer.ts#takeLists` assigns the handler to the notification's `onclick` property, which is what the recorder of scenario 3 calls. The handler calls `window.owlery.comeForward()` and then `openView` with what the function of `view.ts` returns for the lists the window holds at the click.

`apps/desktop/src/shared/protocol.ts` and everything under `apps/desktop/src/daemon/` are not changed.

## Rule changes

- nothing
  why: `docs/roadmap.md` *Milestones* row 1 states that a notification arrives, and the work keeps that. No section of `docs/` states what a click on a notification does, and the row lists what a milestone builds at a coarser grain than one click. What a person newly sees is named in `changelog.md`.

## Removes

The work adds no gate, check, hook or mark, so nothing is owed for one in return. It adds one start of the built app to the suite, in scenario 3's file, and takes no case out in return: no case at `ce9c41d` reaches `renderer.ts#takeLists`, which only a case that loads the window reaches.

- nothing
  why: the work adds a handler, a channel and two functions, and takes no code, no case and no sentence of a document out of the tree.

Framed 2026-11-20 by framer, before the build.
