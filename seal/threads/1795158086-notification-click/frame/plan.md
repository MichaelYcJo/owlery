# Implementation Plan: a click on a notification opens the work item that waits (#31)

## Technical context

The tree as read at `ce9c41d`.

The work builds on the desktop package `apps/desktop`. Every path below is under it.

- `src/renderer/renderer.ts:163-177`, `takeLists`, and its line `:171`, which raises the notification and keeps no reference to it. `:80-84`, `openView`.
- `src/renderer/view.ts:720-734`, `notificationFor`, which this work leaves as it is.
- `src/renderer/work-item-view.ts:343-349`, `enterView`, and `:84-86`, `broughtToFront`, which a press of a tab calls (`:281-285`).
- `src/shared/ipc.ts`, `src/preload/preload.ts` and `src/main/main.ts:47-65`, the channels and their handlers. `src/main/pick-folder.ts` and `src/main/background.ts` are the shape a function of the main process takes where a case reads it without Electron.
- `test/built-app.ts`, `BuiltApp`; `test/repositories.ts#temporaryRepository`; `test/fixtures/receiver.sh` with `test/korean-pane.ts#RECEIVER`; `test/work-item-form.test.ts`, the file a case that drives the form starts from.

Constraints the tree sets.

- The window is sandboxed (`src/main/main.ts:33-38`), so it cannot show or focus itself through Electron. What the main process does for it goes over a channel of `src/shared/ipc.ts`.
- `src/renderer/view.ts` and `test/view.test.ts` hold what the window decides, and `renderer.ts` the calls. The decision of which view a click opens is therefore a function of `view.ts` with its cases, and the handler in `renderer.ts` only calls.
- A pane on the stage of a focused window raises no notification (`src/renderer/view.ts:727`). Scenario 3 therefore changes a state while another screen is in front.
- A pane of the Claude Code kind becomes `waiting` by itself ten seconds after a silent start (`src/daemon/daemon.ts:469-473`). Scenario 3 feeds an event first, which cancels that timer.

Constraints of the run, which every party of this work item keeps.

- The owner runs Owlery from the main clone `/Users/michael/Documents/GitHub/owlery`, on `release/v0.0.1`, with a daemon (pid 95337 on 2026-11-20) that uses `~/Library/Application Support/@owlery/desktop/`. No party builds, tests or commits in the main clone, because `test/built-app.ts#buildApp` rewrites the `dist` of the tree it runs in. No party stops that daemon, reads or writes that folder, or creates a work item or a branch in a repository of the owner's. The work is built, tested and committed in the worktree `/Users/michael/Documents/GitHub/owlery-31` alone.
- Every start of the app by an agent goes through `BuiltApp.start`, which sets `OWLERY_BACKGROUND=1` and gives the app a user data folder of its own. The starts are as few as the verification needs: the new file of scenario 3 starts the app once for each run of the file, and the builder runs that file by itself, once to see it red and again as the code stands.
- No case raises a real macOS notification on the owner's screen. Scenario 3 replaces `window.Notification` in the page with a recorder before any pane starts, so the window's `new Notification` makes a recorded object and nothing reaches macOS. The click is driven by calling the recorded object's `onclick` through the debugging port, which runs the handler the window assigned. The events that change a state are fed to the daemon's hook socket in the started app's own run folder, `<userData>/run/hooks.sock`.
- An app started in the background brings nothing forward (`frame/design.md` *Scope* item 2), so the click of scenario 3 takes neither the system's focus nor the owner's keyboard.
- The branch is never rebased, no hook is skipped, and nothing is pushed by an agent.

**The failure scenario of the chosen approach.** The handler lives in the page that raised the notification. The window reloads whenever its connection to the daemon closes (`src/renderer/renderer.ts:365-369`), which every replacement of the daemon causes, and a notification raised before the reload stays in Notification Center with no handler behind it. A person who presses it hours later gets Owlery made active at most, and no view. The same holds once the window is closed, since on macOS the app stays without one. The design that covers both raises the notification in the main process, and *Alternatives considered* holds it. The second weakness is that the click's arrival at the page is established by no run of this work (`frame/questions.md` Q1): if macOS or Electron does not deliver it, the cases pass and a person's click still opens nothing. The third is `app.focus({ steal: true })`: it takes the front from whatever app the person is in, which is right after a press on Owlery's own notification and wrong if a later change calls the channel from anywhere else.

## Alternatives considered

| Approach | Failure scenario | Verdict |
|---|---|---|
| **The page's `Notification` gets an `onclick`, which asks the main process over a channel to bring the window forward and opens the view in the page, chosen.** This keeps the structure at `ce9c41d`, in which the window raises the notification | See *Technical context* | Chosen. The premise that keeps the structure is that a notification is raised only by a loaded page, which then holds the object a click arrives at. The first half is checked: `git grep` finds one `new Notification`, in `renderer.ts#takeLists` (`frame/design.md` *Grounding*, `executed`). The second half, the click's arrival, is `frame/questions.md` Q1 and is not checked |
| The main process raises the notification with Electron's own `Notification` class and holds its `click`; the window sends it what to raise and is told which view to open. This replaces the structure | A click still opens the view after the page reloaded, and can open a window where none is left. It moves the raising out of `renderer.ts#takeLists`, adds a channel each way, and puts the recorder of the earlier phase records out of use, so a case needs another way to read a notification without raising one. It also meets issue #93's mute, which is read in the window | Rejected for this release, for its size beside one *Done when* line. It is the next step where Q1's measurement fails or the reload's loss is met in use |
| The handler calls `window.focus()` in the page, with no channel | Whether a sandboxed page's `window.focus()` raises an Electron window is not written in the installed declarations, and a probe of it would take the owner's focus. It cannot restore a minimized window or make the app active | Rejected |
| The channel shows the window with `showInactive` in an app started in the background | A window an agent's start made moves on the owner's screen at a click a case drives | Rejected for doing nothing there |
| The click opens the work item's view and leaves the pane in front as it was | Where a work item holds several panes, the person lands on another pane than the one that waits and has to find it among the tabs | Rejected. The pane is named with one optional argument of `enterView` |
| The click handler decides inline in `renderer.ts`, with no function in `view.ts` | A work item gone from the list and a closed pane are reached by no case, since the tree at `ce9c41d` deletes no work item, and `view.ts` and `test/view.test.ts` are then not touched beside issue #93 | Rejected. The two files gain one function and its cases, which issue #93's merge keeps beside its own |
| Scenario 3's case added to `test/work-item-form.test.ts`, which already starts the app | No second start of the app for this work, but a failure of the click fails the form's file, and the form's cases would run with `window.Notification` replaced | Rejected for a file of its own with one start, in the background |
| The click driven by a real notification and a press through the system's accessibility | It raises a notification on the owner's screen and moves the owner's pointer | Rejected. The spawn forbids it |
| A badge on the Dock icon in the same change | Nothing in the issue's *Done when* asks for it, and the owner did not decide it | Rejected, out of scope |

## Phases

| Phase | Delivers | Verified by | Status |
|---|---|---|---|
| 1 | `frame/design.md` *Scope* items 1 to 7, in `src/shared/ipc.ts`, `src/preload/preload.ts`, `src/main/forward.ts`, `src/main/main.ts`, `src/renderer/view.ts`, `src/renderer/work-item-view.ts` and `src/renderer/renderer.ts`, with the changelog fragment `changelog.md` | Scenarios 1 and 2 as cases, each seen red before its code. Scenario 3 as the new file, run by itself, seen red at the first notification's handler before `renderer.ts` assigns one | |

The phase leaves the app working: a notification is raised as at `ce9c41d`, and a click on it now does something.

## Overlap with the release

The spawn names four other open work items of `release/v0.0.1`. Issue #93's frame was read as committed on its branch at `a6ff91f`, with the diff of its two closed phases against `85c381a`. Issues #94 and #95 had a `routing.md` and no frame on 2026-11-20, so their issues were read. Issue #96 waits for #93 and has no branch.

| Work item | Where both change | Merges first | Grounds |
|---|---|---|---|
| #93, the work item menu | `src/shared/ipc.ts`, the `Channel` list and `OwleryApi`; `src/preload/preload.ts`, the `api` object; `src/main/main.ts`, the handlers under `app.whenReady`; `src/renderer/view.ts` and `test/view.test.ts`, where #93 changes `notificationFor` for a muted work item and this work adds a function beside it; `src/renderer/renderer.ts`, where #93 changes `takeLists`'s parameter and this work its line that raises the notification. #93 also changes a fact this work reads: an archived or deleted work item leaves the window's list, and a muted one raises no notification | #31 | This work is one phase with no review rounds, so it is sealed first, and #93 has four phases left in which it merges the release branch anyway. Each meeting is an addition beside an addition, kept whole on both sides. *Scope* item 5 already holds for a work item that left the list, so #93 owes this work no code |
| #95, the terminal basics | `src/main/main.ts`, where #95 adds the app's menu and a guard on navigation; `src/renderer/renderer.ts` and `src/renderer/work-item-view.ts`, where #95 reads keys and a drop; `src/shared/ipc.ts` and `src/preload/preload.ts` where #95 adds a channel. #95 was not framed when this was read, so the files are those its issue implies | #31 | #95 runs through review rounds and is sealed later. It merges the release branch inside rounds it spends anyway |
| #94, the continue pane | No file. #94 changes how a Claude Code pane's command is built in `src/daemon/hooks.ts`, and scenario 3's case reads that the command is `$SHELL` with arguments the receiver ignores | #31 | Either order holds the files. With #31 first, #94's own run of the new file after it merges the release branch shows whether its command still starts the receiver |
| #96, the fetch before a start | Nothing: it changes how the daemon cuts a branch, and this work changes nothing of the daemon | Either | The two do not meet |

## Operational impact

No migration, no environment variable and no dependency. The protocol between the window and the daemon is not changed, so a daemon of an earlier build that is still alive serves this build's window as before. The window and the main process gain one channel, `owlery:come-forward`, and both ship in the one app. The version does not move: the release's version moved before this work item. Phase 1's commit adds `changelog.md`.

## Judgments of the run

| Date | Judgment | Grounds | Judged against |
|---|---|---|---|
| | | | |
