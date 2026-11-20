# Design: restart the daemon, or quit it with its sessions, from the app's menu (#101)

## Grounding

The tree as read at `417368a`. Every path below is under `apps/desktop/` unless it starts with `docs/` or `seal/`. "The daemon" is Owlery's background process, which owns the terminal sessions. "The run folder" is the folder `run` under the app's user data folder, where the daemon writes `daemon.json`, the file a client finds it by. A "pane" is one terminal session, and a "headless session" is an agent asked one prompt with no terminal.

| Policy clause | What it fixes for this work |
|---|---|
| `docs/architecture.md` *Overall layout*, "The daemon stays alive while the app restarts or updates" (`read`) | A plain Quit keeps leaving the daemon and its sessions. The work adds a way to end the daemon that a person chooses, and changes nothing a person did not choose |
| `docs/architecture.md` *Conclusions*, "The UI is a thin shell that connects to the daemon only over WebSocket" (`read`) | The window keeps reaching the daemon over WebSocket alone. The main process, which already finds or starts the daemon (`src/main/main.ts:118-126`), is the one that stops it |
| `docs/architecture.md` *Rules that keep it portable*, rule 1, cited by `src/shared/protocol.ts:1-4` (`read`) | The protocol serves the phone later. The work adds nothing to it: which script the desktop app would start is a fact of the desktop alone |
| `docs/architecture.md` *Platforms and their order* (`read`) | The first version is the macOS desktop app. The two menu entries are placed on another platform as well, and no case builds the menu there, as `src/main/menu.ts:26-29` already states of that menu |
| `docs/roadmap.md` *Milestones*, the rule added by `seal/threads/1795046888-korean-input-test/frame/design.md` *Rule changes* (`read`) | A case that starts the built app does so with `OWLERY_BACKGROUND=1`, under which the window takes neither the keyboard nor a Dock icon. `test/built-app.ts#BuiltApp.start` sets it |

The policy root has no index (`docs/README.md` is absent, `executed`: `ls docs/README.md`), so each `file:` of *Rule changes* names the document directly, as the earlier designs do. The issue has no comment (`executed`: `gh issue view 101 --json title,body,comments` on 2026-11-20). `seal/follow-up.md` is absent, and the repository has published no release, so there is no *Process changes* table to read (`executed`: `gh release list`).

What the tree and the machine answered, with how each was learned.

| Fact | How it was learned |
|---|---|
| The app starts the daemon detached, with `OWLERY_RUN_DIR` set to its run folder, and attaches to any daemon that answers at the address and with the token `daemon.json` holds | `read`: `src/main/daemon-client.ts:8-22` and `:42-72`, `src/main/main.ts:30-31` |
| `daemon.json` holds `port`, `token` and `pid`. The daemon writes it whole after it listens, and removes it at its stop only while it still names that process | `read`: `src/daemon/discovery.ts:6-31`, `src/daemon/main.ts:28-37` and `:58-59` |
| The daemon stops on SIGTERM and SIGINT: it removes `daemon.json`, kills each live pane's process, stops each headless run, closes its clients and exits with code 0. The handler is in the commit that first added the daemon, `135fa4b`, and no later commit touched it, so a daemon of any build has it | `read`: `src/daemon/main.ts:28-37` and `:61-62`, `src/daemon/daemon.ts:211-221`. `executed`: `git log --oneline -S'SIGTERM' -- apps/desktop/src/daemon/main.ts` printed `135fa4b` alone |
| A daemon with one live pane exited 7 ms after SIGTERM with code 0. Its client's socket closed after 2 ms, `daemon.json` was removed, and the pane's process was gone one second later. A pane whose process ignores SIGHUP was still alive one second after the daemon exited | `executed` on 2026-11-20: `test_tmp_daemon_stop.mjs` under the framer's scratch directory, run once with Electron as Node against `dist/daemon.js` built in a `git clone --no-local` of `417368a`. Its output is `probe.out` beside it. The probe ended every process it started, by its id |
| Two builds of one tree write the same bytes to `dist/daemon.js` | `executed`: the same probe, which ran `build.mjs` twice and compared the SHA-256 of the file |
| Nothing in the tree identifies a build. The package's version is `0.0.1` for every build of the release, and the window tells an earlier daemon only by a list it does not send | `executed`: `git grep -n -i -E 'sha256\|createHash\|buildId\|build id\|BUILD_\|version' 417368a -- apps/desktop/src apps/desktop/build.mjs` printed three lines, all of `src/daemon/worktrees.ts`, which hash a delete's loss. `read`: `package.json`, `src/renderer/view.ts:158-171` |
| Nothing in `src/` signals a process or ends the daemon. The one `app.quit()` is the quit with the last window | `executed`: `git grep -n -i -E 'process\.kill\|SIGTERM\|SIGKILL\|app\.relaunch\|app\.exit\|\.quit\(' 417368a -- apps/desktop/src` printed `src/daemon/main.ts:61` and `src/main/main.ts:173` alone |
| #93's sentence for a daemon of an earlier build is `view.ts#EARLIER_DAEMON`: "Owlery's background process is from an earlier build. End its sessions and start Owlery again." `view.ts#daemonLists` gives it as `notice` where a `ready` or an `inbox` carries no `repositories`, `renderer.ts:938-943` keeps it as `held.daemonNotice`, and `sidebar.ts:85-90` shows it in place of the daemon's state, after a notice of the window's own | `read`: those lines, and `test/view.test.ts:1530-1542`, which pins the sentence |
| #93's dialog before an archive is drawn in the page: `index.html:666-679`, `renderer.ts:873-921`. It names each live pane by its tab's label and each working headless session by its prompt (`view.ts#archivalOf`, `view.ts#runningIn`), is drawn again at each list the daemon sends while it is open (`renderer.ts:930-935`), and opens with the keyboard on Cancel. A removal names a session with its work item: `<label> in <title>` and `Asked in <title>: <prompt>` (`view.ts#removalOf`) | `read` |
| When the daemon's socket closes, the window says "Reconnecting to the daemon…" and reloads after one second, and every load asks the main process to find or start the daemon | `read`: `src/renderer/renderer.ts:1228-1248`, `src/main/main.ts:118-126`. `seal/threads/1795015072-daemon/gaps.md` records the reload as chosen |
| The panes and the headless sessions, their answers among them, live in the daemon's memory alone. The repositories with their work items and the last look are files of the run folder | `read`: `src/daemon/daemon.ts:131-140`, `src/daemon/main.ts:20-21`, `test/daemon.test.ts:725` |
| The app builds its menu in the background too, and a case reads it through the main process's inspector | `read`: `src/main/main.ts:160-161`, `test/terminal-basics.test.ts:159-182`, `test/built-app.ts:217-225` |
| A built menu's item has `click`, a function, and the menu has `getMenuItemById` | `read`: `node_modules/electron/electron.d.ts:10227` and `:10302`, of Electron 45.3.3 |
| A case's app has a user data folder of its own under the system's temporary folder, so its run folder is not the person's. `BuiltApp#daemonPid` keeps the first process id it read and never reads the file again, and `BuiltApp#stop` signals that id | `read`: `test/built-app.ts:172-181` and `:252-299` |
| The lines the *Removes* search prints before the build | `executed`: `git grep -n -e 'from an earlier build\. End its sessions' -e 'EARLIER_DAEMON' 417368a -- apps/desktop` printed `src/renderer/view.ts:159`, `src/renderer/view.ts:169` and `test/view.test.ts:1531` |

Nobody measured whether a real Claude Code pane ends when its daemon stops. The run's rules let no probe and no case start a real `claude`, so `frame/questions.md` Q1 holds it for the owner's hand run.

## Scope

In scope:

1. **Stopping the daemon.** The main process stops the daemon of its own run folder and no other. It reads that folder's `daemon.json`, asks whether a daemon answers at that address with that token, and only where one does sends SIGTERM to the process the file names. It then waits until that process is gone, five seconds at most. Where no file stands or nothing answers, it signals nothing and the stop is done. Where the process outlives the wait, the stop fails with the sentence `Owlery's background process did not stop. It is process <pid>.` and nothing else is signalled.
2. **The main process's control.** The stop and the start are ordered in one place, one after the other: a request of the window for the daemon waits for a stop that is under way, and then finds or starts a daemon as today, and a stop waits for a start that is under way. From the moment a complete quit begins, such a request is answered with the failure `Owlery is quitting.` and starts no daemon. Where the stop of a complete quit fails, the app does not quit and such requests are served again.
3. **The menu.** The application menu gains "Restart Daemon…" and "Quit Owlery Completely…". Neither has a key. On macOS the app's menu ends with a separator, "Restart Daemon…", a separator, "Quit Owlery Completely…" and "Quit Owlery". On another platform "File" ends with a separator, "Restart Daemon…", a separator, "Quit Owlery Completely…" and the quit entry. Each new entry has an id, `restart-daemon` and `quit-completely`, by which the main process gives it its click.
4. **From the menu to the window.** A click tells the window which of the two was chosen. Where the app was not started in the background, the window is first brought forward as `src/main/forward.ts#comeForward` does it, so a window that a close hid is shown. In the background nothing is brought forward. Where no window is left, the click makes one and tells it once its page has loaded.
5. **The dialog.** The window opens one dialog for both entries, in the page, as #93's dialogs are. Nothing opens over another dialog. It holds a head, a sentence, the list "Running sessions that end", a line for a refusal, Cancel and one button. The keyboard starts on Cancel.
   - For the restart the head is `Restart the daemon`, the button `Restart`, and the sentence `A restart ends every running session and starts Owlery's background process again, from this build. The panes' tabs and the answers to what was asked go with the old process. Work items, their folders and their branches stay as they are.`
   - For the complete quit the head is `Quit Owlery completely`, the button `Quit`, and the sentence `This ends every running session, stops Owlery's background process and quits Owlery. The panes' tabs and the answers to what was asked go with the process. Work items, their folders and their branches stay as they are.`
   - The list names every running session the window holds: each live pane, then each working headless session. A session of a work item the window lists, archived or not, reads as a removal names it: `<tab's label> in <title>` and `Asked in <title>: <prompt>`. A live pane of no listed work item reads as its kind's label alone, and a working headless session of no listed work item as `Asked: <prompt>`. The list is hidden where no session runs, and the dialog still opens. It is drawn again at each list the daemon sends while the dialog is open.
6. **After the confirmation.** The window asks the main process to end the daemon, for a restart or for a quit, and its button stays off until the answer. A refusal is shown in the dialog. After a restart that succeeded the window reloads at once, and the load finds no daemon and starts the one of the running build, through the one path that starts a daemon today. After a complete quit that succeeded the app quits. Cancel ends nothing.
7. **The harness.** `test/built-app.ts#BuiltApp.daemonPid` reads `daemon.json` at each call and keeps no id, so `stop` and `stopNow` end the daemon the run folder names at that moment and never signal the id of a daemon that a restart already ended. `BuiltApp.leaveMain` closes the case's inspector session on the main process before a quit the case waits for, because a main process with an inspector session attached did not end after `app.quit()`.
8. **The daemon's build.** A build is named by the SHA-256 of the bytes of the daemon's script. The daemon reads its own script once, as it starts, and writes the value into `daemon.json` as `build`. Where it cannot read the script it writes no `build`. A `daemon.json` without `build` is read as before.
9. **The app's reading.** Each time the window asks for the daemon, the main process reads the script it would start and compares. The daemon is of another build where its `daemon.json` holds no `build`, or one that differs. The answer to the window carries that as `otherBuild`.
10. **The status line.** Where the daemon is of another build the status line says `Owlery's background process is from another build. Choose "Restart Daemon…" from the menu to replace it.`, in the place and the colour of #93's sentence, which it replaces. The discovery file is the sentence's one source: `view.ts#daemonLists` still gives no repository for a daemon that sends none, and gives no notice.

Out of scope:

- **A message of the protocol that stops the daemon.** A daemon of an earlier build would not know it, and that daemon is the one this work has to replace (`frame/plan.md` *Alternatives considered*, row B).
- **Replacing a daemon of another build without asking**, where none of its sessions runs. The issue asks for a sentence and a menu entry, and a person chooses.
- **A refusal where a session started after the person read the list.** A signal carries no list. The dialog shows the sessions as the daemon last listed them, and the stop ends what runs at that moment.
- **Ending a pane's process that ignores SIGHUP.** The daemon ends a pane at its stop as it does at a close and at an archive (`src/daemon/daemon.ts:211-221`, `src/daemon/pty.ts:114-116`). A stronger end belongs to all three (`frame/questions.md` Q1).
- **SIGKILL where the daemon outlives the wait.** By then no daemon answers that could prove the process id is still the daemon's.
- **A reconnect without the reload.** `seal/threads/1795015072-daemon/gaps.md` holds it, and this work reuses the reload.
- **A key for either entry.**

## User scenarios & acceptance *(mandatory)*

Each case is seen red before it is kept, as contract rule 15 states. Scenarios 10 to 13 are cases of one file, `test/daemon-restart.test.ts`, which starts the built app twice through `BuiltApp.start`, in the background and with the main process's inspector: once for scenarios 10 to 12 and once for scenario 13. Each pane's process there is the receiver of `test/fixtures/`, as in `test/work-item-menu.test.ts`, so no shell of the person's and no agent starts. The case signals only processes it started: the bystander daemon by the id its `spawn` returned, and the app's daemon through `BuiltApp.stop`.

| Scenario | Given / When / Then | Verifiable how |
|---|---|---|
| 1. A daemon that answers is stopped | Given a run folder whose `daemon.json` names a stand-in daemon the case started, which answers with the file's token. When the stop runs. Then it resolves, and that process is gone | a case of `test/daemon-client.test.ts` |
| 2. A file nothing answers for signals nobody | Given a `daemon.json` that names a live process the case started and a port where nothing listens. When the stop runs. Then it resolves and that process is still alive. Given no `daemon.json`. Then the stop resolves | cases of `test/daemon-client.test.ts`. The first is seen red with the question whether a daemon answers removed |
| 3. Another token signals nobody | Given a stand-in daemon that answers its own token alone, and a `daemon.json` that names its process and its port with another token. When the stop runs. Then that process is still alive | a case of `test/daemon-client.test.ts` |
| 4. A daemon that does not stop | Given a stand-in daemon that answers and ignores SIGTERM, and a wait of a few hundred milliseconds. When the stop runs. Then it rejects with `Owlery's background process did not stop. It is process <pid>.`, and the process is still alive. The case then ends it by its id | a case of `test/daemon-client.test.ts` |
| 5. The order of a stop and a start | Given a control whose stop and start are the case's own functions. When the window asks for the daemon while a stop is under way. Then the start runs after the stop has ended. When a complete quit begins. Then a request for the daemon is answered `Owlery is quitting.` and the start is not called, and after the stop the quit is called once. When the stop of a complete quit fails. Then the quit is not called, the answer is the stop's sentence, and the next request for the daemon calls the start. A request that names neither a restart nor a quit stops nothing | cases of `test/daemon-control.test.ts` |
| 6. The menu's entries | Given the template for macOS. Then the app's menu reads About Owlery, separator, services, separator, Hide Owlery, hideOthers, unhide, separator, Restart Daemon…, separator, Quit Owlery Completely…, Quit Owlery. Given the template for another platform. Then "File" reads Close Window, separator, Restart Daemon…, separator, Quit Owlery Completely…, quit. On each platform the two new entries have the ids of *Scope* item 3, no role and no accelerator | `test/menu.test.ts`: the expectations at `:20` and `:30` change, and one case is added |
| 7. The words | Given the restart, and given the complete quit. Then the function that words the dialog gives the head, the sentence and the button of *Scope* item 5. Given `otherBuild` true. Then the notice is the sentence of *Scope* item 10. Given false. Then it is empty | cases of `test/view.test.ts` |
| 8. The sessions named | Given two work items, one of them archived, each with a live pane, an exited pane, a working headless session, a finished one, and a live pane of no listed work item. Then the list holds the live panes as `<label> in <title>`, then the pane of no work item as its kind's label, then the working headless sessions as `Asked in <title>: <prompt>`, and no exited or finished session. Given no running session. Then the list is empty | cases of `test/view.test.ts` |
| 9. A daemon that sends no repositories | Given a `ready` without `repositories`. Then `daemonLists` gives no repository, no archived work item, and no `notice` key | `test/view.test.ts:1530-1542`, changed |
| 10. A restart in the built app | Given the built app, a work item with one live pane, and a bystander: a daemon the case started from `dist/daemon.js` with a run folder of its own. When the case calls the click of the entry `restart-daemon` in the main process. Then the dialog is open with the head `Restart the daemon`, it lists the pane as `<label> in <title>`, and the keyboard is on Cancel. When the case presses Cancel. Then `daemon.json` names the same process, which is alive. When the case clicks the entry again and presses Restart. Then the earlier daemon's process and its pane's process are gone, `daemon.json` names another process that is alive, and the status line reads `Daemon running, no agent`. The bystander's process is alive and its `daemon.json` still names it | `test/daemon-restart.test.ts`, the first start |
| 11. A daemon of another build in the built app | Given the first start's app as it started. Then `daemon.json` holds `build`, equal to the SHA-256 the case takes of `dist/daemon.js`, and the status line has no notice. When the case writes the app's `daemon.json` again without `build`, as a daemon of an earlier build leaves it, and reloads the page. Then the status line reads the sentence of *Scope* item 10. After the restart of scenario 10, which runs from here. Then `daemon.json` holds `build` again and the status line has no notice | `test/daemon-restart.test.ts`, the first start, before and through scenario 10 |
| 12. A plain Quit | Given the first start's app after scenario 10, with a live pane opened in the new daemon. When the case has the main process call `app.quit()`, which is what the quit entry's role runs. Then the app's process is gone, and the daemon's process and the pane's process are alive. `BuiltApp.stop` then ends the daemon | `test/daemon-restart.test.ts`, the end of the first start |
| 13. A complete quit in the built app | Given the built app, started a second time, and a work item with one live pane. When the case calls the click of the entry `quit-completely` and presses Quit in the dialog, whose head is `Quit Owlery completely` and which lists the pane. Then the app's process, the daemon's process and the pane's process are gone, and two seconds later the run folder holds no `daemon.json` | `test/daemon-restart.test.ts`, the second start |
| 14. The harness | Covered by scenarios 10 and 12: after the restart `BuiltApp.daemonPid` answers the new daemon's id, and `BuiltApp.stop` after scenario 12 leaves no process of the case | `test/daemon-restart.test.ts`, the first start |
| 15. A window that a close hid | Given the app as a person starts it on macOS, with its window closed. When the person chooses "Restart Daemon…". Then the window is shown with the dialog open | No case: an app that takes the front is one no agent starts. `gaps.md` *Not verified* names the owner as its answerer. `comeForward` itself is held by `test/forward.test.ts` |

## Data & interfaces

`src/daemon/discovery.ts`:

- `Discovery` gains `build?: string`. `readDiscovery` carries the value where the file holds a text there, and reads a file without it as it does today.
- `buildOf(scriptFile: string): string | undefined` gives the SHA-256 of the file's bytes as hexadecimal text, or nothing where the file cannot be read. It is the one definition of a build, and both sides call it.

`src/daemon/main.ts` passes `buildOf(process.argv[1])` to `writeDiscovery`. The value is taken once, before the daemon listens.

`src/main/daemon-client.ts`:

- `stopDaemon(runDir: string, timeoutMs = 5000): Promise<void>` is *Scope* item 1. It uses `readDiscovery` and `answers`, which the file already holds.
- `ensureDaemon` is not changed. Its answer carries `build` because `Discovery` does.

`src/main/daemon-control.ts`, a new module that imports nothing of Electron, as `src/main/background.ts` and `src/main/forward.ts` do, so its cases run without the app. It is *Scope* item 2. It is given the function that finds or starts a daemon, the function that stops one, and the function that quits the app. It offers the two things the main process's channels call: the request for the daemon, and the end of the daemon for `"restart"` or `"quit"`, which answers null or a refusal's sentence. A value that is neither is answered with the refusal `Owlery was asked for neither a restart nor a quit.` and stops nothing.

`src/shared/ipc.ts`:

- `DaemonConnection` gains `otherBuild: boolean`.
- `Channel` gains `endDaemon` and `daemonMenu`. `OwleryApi` gains `endDaemon(then: "restart" | "quit"): Promise<string | null>` and `onDaemonMenu(listener: (chosen: "restart" | "quit") => void): void`. `src/preload/preload.ts` gains both. `daemonMenu` is the first channel the main process sends on without being asked.

`src/main/menu.ts`: `MenuEntry` gains `id?: string`, and the template gains the entries of *Scope* item 3. The module still imports nothing of Electron. `src/main/main.ts` gives each entry that has an id its click before it builds the menu, answers the two channels through the control, and answers `otherBuild` through `src/main/daemon-client.ts#otherBuild(found, daemonScript)`, which compares the discovery it found with `buildOf` of the script it would start. The comparison stands in `daemon-client.ts` because `main.ts` imports Electron, so its cases run without the app.

`src/renderer/view.ts`:

- `EARLIER_DAEMON` and the `notice` of `daemonLists` go (*Removes*).
- It gains the function that gives the notice for `otherBuild`, the function that words the dialog for each of the two, and the function that lists the running sessions of *Scope* item 5 from the window's lists. The last reuses `runningIn`.

`src/renderer/index.html` gains the dialog, shaped as `#sessions-dialog` is. `src/renderer/renderer.ts` sets `held.daemonNotice` from the connection's `otherBuild` in `connect`, opens the dialog at `onDaemonMenu` (the main process tells a window that is still loading once its load ends), draws it again where the archive's dialog is drawn again, and does *Scope* item 6. `src/renderer/shared.ts` changes the comment of `held.repositories` and `held.daemonNotice` to say where the notice now comes from.

The protocol, `src/shared/protocol.ts`, and the daemon's class, `src/daemon/daemon.ts`, are not changed.

## Rule changes

- add
  file: docs/architecture.md
  section: Overall layout
  to: - **A person stops the daemon from the app's menu, and the app stops no daemon but its own run folder's.** A plain Quit leaves the daemon and its sessions running. "Restart Daemon…" and "Quit Owlery Completely…" name the running sessions first, and on the person's confirmation the app ends the daemon. It sends a signal to the process that `daemon.json` in its run folder names, and only after a daemon answered at that file's address with that file's token. The first entry then starts the daemon of the running build, and the second quits the app and starts none. The app signals because a daemon of any build ends at a signal, and a daemon of an earlier build would not know a message added to the protocol. The daemon writes the SHA-256 of the script it runs into `daemon.json`. Where that value differs from the script the app would start, the status line says the daemon is from another build and names "Restart Daemon…".
    check: apps/desktop/test/daemon-client.test.ts apps/desktop/test/daemon-restart.test.ts
- add
  file: docs/architecture.ko.md
  section: 전체 구성
  to: - **사람은 앱 메뉴에서 데몬을 멈추고, 앱은 자기 실행 폴더의 데몬만 멈춥니다.** 보통의 종료는 데몬과 세션을 그대로 둡니다. "Restart Daemon…"과 "Quit Owlery Completely…"는 실행 중인 세션을 먼저 이름으로 보여 주고, 사람이 확인하면 앱이 데몬을 끝냅니다. 앱은 실행 폴더의 `daemon.json`이 가리키는 프로세스에 신호를 보내며, 그 파일의 주소에서 그 파일의 토큰으로 데몬이 응답한 뒤에만 보냅니다. 앞의 항목은 이어서 지금 실행 중인 빌드의 데몬을 띄우고, 뒤의 항목은 데몬을 띄우지 않고 앱을 끝냅니다. 신호를 쓰는 까닭은 어느 빌드의 데몬이든 신호를 받으면 끝나지만, 프로토콜에 새로 넣은 메시지는 이전 빌드의 데몬이 알지 못하기 때문입니다. 데몬은 자기가 실행하는 스크립트의 SHA-256 값을 `daemon.json`에 적습니다. 그 값이 앱이 띄울 스크립트의 값과 다르면 상태 줄이 데몬이 다른 빌드의 것이라고 알리고 "Restart Daemon…"을 가리킵니다.
    check: apps/desktop/test/daemon-client.test.ts apps/desktop/test/daemon-restart.test.ts

## Removes

| Removes | Coordinate | Where it lands, or why it can go |
|---|---|---|
| #93's sentence for a daemon of an earlier build, which told the person to end the sessions and start Owlery again | `apps/desktop/src/renderer/view.ts#EARLIER_DAEMON` | The sentence of *Scope* item 10 replaces it. A daemon that sends no repositories also wrote no `build`, so the new sentence covers every daemon the old one named |
| The `notice` that the reading of a `ready` or an `inbox` gives | `apps/desktop/src/renderer/view.ts#daemonLists`, and its reader in `apps/desktop/src/renderer/renderer.ts#takeRepositories` | `held.daemonNotice` is set in `renderer.ts#connect` from the connection's `otherBuild`, so the sentence has one source |
| The pin of the old sentence and of the `notice` key | `apps/desktop/test/view.test.ts`, the cases under `describe("daemonLists")` | Scenarios 7 and 9 pin the new sentence and the reading without a notice |
| The process id `BuiltApp` keeps after its first read | `apps/desktop/test/built-app.ts#BuiltApp.daemonPid`, the field `daemon` | Nothing needs it: the file is read at each call (*Scope* item 7) |

The work adds one rule with a check line (*Rule changes*) and no gate, hook or CI step. What goes in return is the first row: the sentence that sent a person outside the app.

Framed 2026-11-20 by framer, before the build.
