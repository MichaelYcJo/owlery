# Implementation Plan: keep the Mac awake while an agent works (#102)

## Technical context

The tree as read at `8bf9c68`. Every path below is under `apps/desktop/` unless it starts with `docs/` or `seal/`.

The work builds on four things the tree already has.

- **The daemon's own state of each session.** `SessionInfo.alive` and `SessionInfo.state` for a pane, `HeadlessInfo.state` for a headless session (`src/shared/protocol.ts:96-134`). Every change of a pane's passes through `Daemon#broadcastInbox`, and every change of a headless session's through `Daemon#headlessChanged` (`frame/design.md` *Grounding*, the fact on where a state changes). The hold is settled at those two places, at the choice's change and at `listen`.
- **The daemon's files in its run directory.** `LastLook` (`src/daemon/last-look.ts:89-126`) is the shape the choice's store follows: read at construction, held in memory before the write, written through `writeWholeFile`, and kept in memory alone where the daemon is given no run directory.
- **An option a case replaces.** `DaemonOptions` already takes `roleAdapter`, `commandFor`, `now` and `random` so that a case of `test/daemon.test.ts` starts no real agent. The holder is one more such option, and the class's cases give it one that starts no process.
- **The theme's control.** `src/renderer/theme.ts` and `#theme-control` in `src/renderer/index.html:410-413` are the shape the new control follows. The theme's choice goes to the main process, and the new one goes to the daemon.

Constraints on the cases, from the owner's standing rules for this run:

- One `BuiltApp.start` in the whole work, in scenario 13's case, and it starts in the background as `BuiltApp.start` does by default (`test/built-app.ts:179`).
- A case that holds a real block ends it before the case ends, and ends each process it started by that process's id. Scenario 11's cases hold for about a second each. Scenario 13's case holds between its choice of "Always" and its choice of "Never", and `BuiltApp#stop` ends the daemon in a `finally`, which ends the child.
- No case starts a real `claude`, the system browser or Finder, reads the person's clipboard, or reads or writes the person's own user data folder. No case creates a work item in a repository of the owner's: scenario 13 needs no work item and no pane.
- `pmset -g assertions` only reads, and a case may run it. Scenario 11 and scenario 13 do not need it: the child's arguments are the claim, and `frame/design.md` *Grounding* holds what those arguments make the system do.

Two facts about the worktree and the suite the build should expect:

- The worktree has no Electron binary: `node_modules/electron/path.txt` is absent (`executed`: `ls apps/desktop/node_modules/electron/`). The suite runs inside Electron (`scripts/test-in-electron.mjs`), so the build installs before its first case.
- After phase 1, any case of the built app whose pane reaches `working` holds a real block while that pane works. `test/terminal-basics.test.ts` has such cases, through the stand-in for `claude`. The block ends when the pane stops working, and at the latest when `BuiltApp#stop` ends the daemon.

What breaks in six months:

- **A pane the inbox lists as working while its agent has stopped keeps the Mac awake.** The hold follows `SessionInfo.state`, and that state moves only on an event. A laptop left open on battery then stays awake until the pane's next event or its end. The status line says that Owlery is keeping the Mac awake, and "Never" ends it. The repair belongs to the state, not to the hold.
- **A child that something else ends is not replaced at once.** The daemon starts another only at the next change of a state or of the choice (`frame/design.md` *Scope* item 4). Until then the status line says nothing of a hold, which is true.
- **A macOS without `/usr/bin/caffeinate`.** The holder reports the hold lost, the daemon runs on, and the status line never says the Mac is kept awake. Scenario 11's cases fail on that macOS and name the program.

## Alternatives considered

| Approach | Failure scenario | Verdict |
|---|---|---|
| The daemon holds the block as a child process, `caffeinate -i -w <its own pid>` | The three failures of *Technical context* | Chosen. The daemon is the one process that knows every session's state and is there while the app is closed. `-w` ends the block when the daemon ends by any means, a kill among them, so no timer and no cleanup step guards it (`frame/design.md` *Grounding*, the probe) |
| The app's main process holds it with Electron's `powerSaveBlocker` | A person quits the app and leaves an agent working, which Quit allows (`src/main/main.ts:150-153`, `docs/architecture.md` *Overall layout*). The block ends at Quit and the Mac sleeps under the agent, which is the issue's own failure. The main process also holds no connection to the daemon, so the window would have to relay each state over a new IPC channel, and the phone could not show or set anything | Rejected |
| The daemon calls `powerSaveBlocker` itself | The daemon runs as plain Node and its bundle names no Electron module (`frame/design.md` *Grounding*). Making it an Electron process changes how every pane and headless session is started | Rejected |
| The daemon takes the assertion through IOKit in a native module | A second native dependency to rebuild for Electron's ABI at every install, beside `node-pty` (`package.json`, `postinstall`). `caffeinate` takes the same assertion and ships with macOS | Rejected |
| One `caffeinate -i -t <seconds>` that the daemon renews on a timer | A timer in the daemon, and a block that outlives a killed daemon by up to the timeout. `-w` has neither | Rejected |
| `caffeinate -i` around each pane's command | The block would follow a pane's life and not its agent's state, so a pane that waits for a person all night keeps the Mac awake. It also changes `commandFor` for every kind of pane | Rejected |
| The choice is the daemon's state: `keep-awake.json` in the run directory, sent in `ready`, set by a client's message | A file more in the run directory. A daemon of an earlier build knows nothing of it, so the window hides the control there (`frame/design.md` *Scope* item 9) | Chosen. The daemon acts on the choice while no client is connected, and `src/shared/appearance.ts:1-5` draws the line: a client's own appearance stays with the client, and this is no appearance. The phone then shows and sets the same value |
| The choice is the app's, kept by the main process beside `appearance.json` and sent by the window at each hello | The daemon holds no choice until a window connects, and two clients that hold different values each overwrite the other's at their hello | Rejected |
| Replace the daemon's one file for each state with one `settings.json` for every setting of the daemon | The daemon has one setting after this work. The other two files are a list and a record, each with its own reader of old shapes (`src/daemon/last-look.ts:94-96`), and #93 replaces one of them on its branch. A shared file would put this work inside that change | Rejected. The premise that keeps the structure, checked: each file has one writer and one shape, `read` at `src/daemon/work-items.ts` and `src/daemon/last-look.ts` |
| Replace the status line's one sentence with a mark of its own for the hold, such as an icon in the foot | The issue asks that the status line show it. A mark would also stay in view while the line shows a notice, which the sentence does not | Rejected. The premise that keeps the sentence, checked: `daemonStatus` is the one function that words the line where the window has nothing else to say (`src/renderer/view.ts:323-327`), and the control's `title` names the choice at any time |
| Replace the foot's controls with a settings screen that holds the theme and this choice | A new screen, its key and its place in the sidebar, for two controls | Rejected. The premise, checked: the foot holds one control at `8bf9c68` (`src/renderer/index.html:408-414`) and has room for a second |
| Under "Always", the daemon never exits by itself | A daemon nobody can reach stays for ever and keeps the Mac awake with nothing running, until #101 gives a way to stop it | Rejected. `Daemon#checkIdle` is not changed |

## Phases

| Phase | Delivers | Verified by | Status |
|---|---|---|---|
| 1 | `frame/design.md` *Scope* items 1 to 6: the choice and its file, the want, the hold and its child process, the protocol's three additions, and the holder given to the daemon on macOS. After this phase the Mac stays awake while an agent works, under the default choice | The cases of scenarios 1 to 11, each seen red before it is kept: `node scripts/test-in-electron.mjs test/keep-awake.test.ts test/daemon.test.ts`, run from `apps/desktop/` | `21cc0d0` |
| 2 | `frame/design.md` *Scope* items 7 to 9: the control in the sidebar's foot, the status line's words, and the window against a daemon that sends no `keepAwake` | The cases of scenarios 12 to 14, each seen red before it is kept: `node scripts/test-in-electron.mjs test/view.test.ts test/keep-awake.test.ts`, run from `apps/desktop/`. Scenario 15 goes into `gaps.md` *Not verified* with the owner as its answerer (`frame/questions.md` Q1) | |

## Overlap with the release

Both items below meet this work. #93 merges first, then this work, then #101.

| Work item | Where both change | Merges first | Grounds |
|---|---|---|---|
| #93, `feat/93-a-work-item-cannot-be-renamed-archived-or-deleted`, read at `dc715b7` | `src/shared/protocol.ts`: the `ready` message and both unions of messages. `src/daemon/daemon.ts`: `Daemon#handle` and the options. `src/daemon/main.ts`: the comments beside the daemon's options. `src/renderer/shared.ts#held`, `src/renderer/renderer.ts` at the `ready` case, `src/renderer/view.ts`, `src/renderer/index.html`, `test/daemon.test.ts` and `test/view.test.ts`. `src/renderer/sidebar.ts#showStatus`: #93 rewrites its two lines to put a notice about the daemon before the daemon's state, and this work passes `daemonStatus` a third argument in the same call | #93 | #93 is in its last review rounds with a diff of about 7,000 lines, and this work has no review round. Were this work merged first, #93 would resolve the meeting after its last round and owe a round that reads it. With #93 first, this branch merges `release/v0.0.1` into itself before its sealer reads it, and the sealer reads the result. The build keeps the meeting small: the logic stands in the three new modules, and each edit to a shared file adds lines and rewrites none but the call of `daemonStatus` |
| #101, not started, read from its issue | `src/shared/protocol.ts` and `src/daemon/daemon.ts`, where #101 adds a way to stop the daemon. The status line, where #101 says that the daemon is of another build. A fact #101 reads: a daemon that is stopped or restarted must leave no block behind. `Daemon#close` releases the hold and `-w` ends the child of a killed daemon, so #101 has nothing to add for it | #102 | #101 starts after #93 merges, and this work is the smaller and will be sealed while #101 is framed. #101's frame then reads the hold and the status line's new words in the tree |

## Operational impact

- No migration, no new environment variable and no new dependency. `caffeinate` ships with macOS.
- The daemon's run directory gains `keep-awake.json` once a person chooses. A build before this work ignores the file.
- The daemon has one child process more while it holds.
- A window of this build attached to a daemon of an earlier build shows no control and holds nothing, until that daemon is replaced. The owner's running daemon is such a one. #101 gives the menu item that replaces it.
- This pull request does not move the version: the move has landed in `release/v0.0.1`.

## Judgments of the run

| Date | Judgment | Grounds | Judged against |
|---|---|---|---|
| | | | |
