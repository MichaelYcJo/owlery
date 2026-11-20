# Design: keep the Mac awake while an agent works (#102)

## Grounding

The tree as read at `8bf9c68`. Every path below is under `apps/desktop/` unless it starts with `docs/` or `seal/`.

| Policy clause | What it fixes for this work |
|---|---|
| `docs/architecture.md` *Overall layout*, "The daemon stays alive while the app restarts or updates" (`read`) | The daemon is the process that is there while agents work. A block the app held would end at Quit, and Quit leaves the sessions running |
| `docs/architecture.md` *Overall layout*, "Agent state is judged from events, never guessed from what the terminal screen prints" (`read`) | "An agent works" is the state the daemon already keeps for each session: `SessionInfo.state` and `HeadlessInfo.state` (`src/shared/protocol.ts:96-134`). The work reads that state and judges nothing new |
| `docs/architecture.md` *Platforms and their order* (`read`) | The first version is the macOS desktop app only. The work holds the block on macOS and offers nothing on another platform |
| `docs/architecture.md` *Rules that keep it portable*, rule 1, cited by `src/shared/protocol.ts:1-4` (`read`) | The protocol carries no vendor's field and serves the phone later. The choice and whether the block is held travel as neutral fields, so the phone can show the same |
| `src/shared/appearance.ts:1-5` and `src/main/appearance.ts:1-4` (`read`) | The tree keeps a setting in one of two places. A client's own appearance is the main process's, in `appearance.json`, and "the daemon does not learn of it". The daemon's state is in its run directory: `work-items.json` and `last-look.json`, each written through `src/daemon/whole-file.ts#writeWholeFile` and sent to clients in `ready` |

What the tree and the machine answered, with how each was learned.

| Fact | How it was learned |
|---|---|
| Nothing in the tree blocks sleep or reads the power state | `executed`: `git grep -n -i -E 'caffeinate\|powerSaveBlocker\|pmset\|keep.?awake\|power-save\|idle sleep' 8bf9c68 -- . ':!seal/threads/1795178893-keep-awake'` printed nothing |
| The daemon runs as plain Node, started detached with `ELECTRON_RUN_AS_NODE=1`, and its bundle names no `electron` module | `read`: `src/main/daemon-client.ts:50-54`, `build.mjs:19-26` |
| The daemon exits by itself 60 seconds after no pane is alive, no headless session is working and no client is connected | `read`: `src/daemon/daemon.ts:605-610`, `src/daemon/main.ts:1-3` |
| A pane's state changes in three places, and each ends in `Daemon#broadcastInbox`: an agent's event (`daemon.ts:152-168`), the end of a silent start (`daemon.ts:478-482`), and the process's exit (`daemon.ts:453-464`). A pane's close does too (`daemon.ts:317-327`). A headless session's state changes only through `Daemon#headlessChanged` (`daemon.ts:427-430`) | `read` |
| An exited session keeps its last state, so `alive` has to be read beside `state` | `read`: `src/shared/protocol.ts:102` |
| `caffeinate -i -w <pid>` holds one assertion, `PreventUserIdleSystemSleep`, under its own process id. It exits by itself within a second of the watched process's end, and at once on SIGTERM. Neither probe process was left | `executed` on 2026-11-20: `sh test_tmp_caffeinate.sh` under the framer's scratch directory. Its output is `caffeinate.out` beside it. `pmset -g assertions` printed `pid 22206(caffeinate): … PreventUserIdleSystemSleep named: "caffeinate command-line tool"` while the hold stood |
| `-i` prevents idle sleep of the system. `-d` is the display's flag. `-s` prevents all sleep and holds only on AC power | `executed`: `man caffeinate`, the lines for `-d`, `-i`, `-s`, `-w` |
| A window reads a field an earlier daemon does not send as absent, and offers less: `PaneKindInfo.continues` | `read`: `src/shared/protocol.ts:27-28` |
| The sidebar's foot holds the status line and one control, the theme's: an icon with a `select` laid over it | `read`: `src/renderer/index.html:194-199` and `:408-414`, `src/renderer/theme.ts` |
| The status line's words are one function, `daemonStatus`, pinned by four expectations | `read`: `src/renderer/view.ts:323-327`, `test/view.test.ts:1189-1199` |
| A case pins the keys of `ready` | `read`: `test/daemon.test.ts:428` |
| A stand-in for `claude` reports a prompt in the cases of the built app, so a pane of the built app reaches `working` | `read`: `test/fixtures/claude-stand-in/`, `seal/threads/1795158088-terminal-basics/frame/questions.md` Q3 |
| The issue has no comment | `executed`: `gh issue view 102 --json body,comments` printed `"comments":[]` |
| That the process started with `ELECTRON_RUN_AS_NODE=1` cannot load Electron's `powerSaveBlocker` | nobody's finding: the framer recalls it from Electron's documentation and ran no probe, because the worktree holds no Electron binary (`node_modules/electron/path.txt` is absent). The choice in `frame/plan.md` does not rest on it alone |

## Scope

In scope, numbered for `frame/plan.md`:

1. **The choice.** The daemon keeps one choice of three values: `working` ("While an agent works"), `always` ("Always") and `never` ("Never"). It is `working` until a person chooses. The daemon keeps it in `keep-awake.json` in its run directory and reads it at its start. A file that holds none of the three values is read as `working`.
2. **When the daemon wants the Mac awake.** Under `never`, never. Under `always`, from its start to its end. Under `working`, while at least one pane is alive with the state `working`, or at least one headless session has the state `working`.
3. **The hold.** While the daemon wants the Mac awake it runs one child process, `/usr/bin/caffeinate -i -w <the daemon's own process id>`. It starts the child when the want of item 2 becomes true and ends it when the want becomes false and when the daemon closes. It runs one such child at most.
4. **A hold that ends by itself.** Where the child ends and the daemon did not end it, the daemon holds nothing and tells every client so. It starts another child at the next list of sessions the daemon sends to its clients, or the next change of the choice, that leaves the want true. The daemon sends that list at every change of a session's state and also when a branch gains a commit, so the new child never comes later than the next change of a session's state.
5. **The protocol.** `ready` carries the choice and whether the hold stands. A message of its own tells every client whenever either changes. A client's message sets the choice.
6. **Where the daemon holds.** The daemon process holds on macOS. On another platform it is given no way to hold, sends no such field in `ready`, and ignores a client's choice.
7. **The control.** The sidebar's foot gains a control beside the theme's, built the same way: an icon with the three choices laid over it. It shows the daemon's choice, and a person's choice goes to the daemon.
8. **The status line.** Where the daemon holds, the status line says so after the agents' count: `Daemon running, 1 agent, keeping the Mac awake`.
9. **A daemon that sends no such field.** Against a daemon of an earlier build, or one of item 6's other platforms, the window hides the control and the status line says nothing of the hold.

The hold follows the state the inbox shows. Where a pane is listed as `working` and its agent has stopped without an event, the Mac stays awake until the pane's next event or its end. That is the inbox's own error, and this work does not correct it.

"Always" does not keep the daemon alive. The daemon still exits by itself as `src/daemon/main.ts:1-3` states, and the hold ends with it. So "Always" holds while the window is open or a pane's process lives.

Out of scope:

- Keeping the display awake. The issue says the display may sleep, and `-i` leaves it.
- Overriding a closed lid. The work sets no `-s`, and changes no `pmset` value.
- A hold on Linux or Windows. `docs/architecture.md` *Platforms and their order* puts both after the first version.
- A long command in a shell pane. A shell pane reports no state (`src/daemon/pane-kinds.ts:11`), and the issue names agents.
- A settings screen. The window has two settings after this work, and each is one control in the foot.
- The release's version move. It has landed in `release/v0.0.1`.

## User scenarios & acceptance *(mandatory)*

A "holder" below is the function the daemon is given to hold the Mac awake (*Data & interfaces*). The cases of the `Daemon` class give it one that starts no process and counts its calls.

| Scenario | Given / When / Then | Verifiable how |
|---|---|---|
| 1. The first start | Given a run directory with no `keep-awake.json`. When a client says hello. Then `ready` carries `keepAwake` with `choice: "working"` and `held: false`, and the holder was not called | a case of `test/daemon.test.ts` |
| 2. A working pane holds | Given the choice `working` and two panes of a kind that reports state. When the first pane's agent sends a prompt. Then the holder is called once and every client receives `keepAwake` with `held: true`. When the second pane's agent sends a prompt. Then the holder is not called again | a case of `test/daemon.test.ts` |
| 3. The hold ends when no pane works | Given scenario 2's two working panes. When one sends `Stop`. Then the hold stands. When the other asks a permission, exits, or is closed. Then the hold is released once and every client receives `held: false` | a case of `test/daemon.test.ts`, one expectation for each of the three ends |
| 4. A headless session holds | Given the choice `working` and no pane. When a client asks a headless session. Then the hold stands while its state is `working`, and is released when it finishes and when it fails | a case of `test/daemon.test.ts` with `fakeAdapter` |
| 5. "Always" | Given no session. When a client sends the choice `always`. Then the hold stands, every client receives `choice: "always"` with `held: true`, and the daemon still asks to exit once it is idle. When the daemon closes. Then the hold is released | a case of `test/daemon.test.ts` with a short `idleExitMs` |
| 6. "Never" | Given a working pane and the hold. When a client sends the choice `never`. Then the hold is released. When another pane's agent sends a prompt. Then the holder is not called | a case of `test/daemon.test.ts` |
| 7. The choice outlives the daemon | Given a daemon whose client chose `always`. When the daemon closes and another starts on the same run directory. Then the second holds from its start, and its `ready` carries `choice: "always"`. Given a `keep-awake.json` that holds `{"choice":"sometimes"}`, or text that is no JSON. Then the choice is `working` | cases of `test/daemon.test.ts` |
| 8. A choice that is none of the three | Given the choice `working`. When a client sends `setKeepAwake` with `choice: "sometimes"`. Then no client receives a `keepAwake` message, and `keep-awake.json` is not written | a case of `test/daemon.test.ts` |
| 9. A hold that ends by itself | Given a working pane and the hold. When the holder reports that the hold was lost. Then every client receives `held: false`. When another pane's agent sends a prompt. Then the holder is called again and every client receives `held: true` | a case of `test/daemon.test.ts` |
| 10. A daemon given no holder | Given a daemon with no holder. Then `ready` has no `keepAwake` key, and a `setKeepAwake` changes nothing | the expectation at `test/daemon.test.ts:428` stands as it is, and one case more |
| 11. The child process | Given a short-lived process the case starts. When the real holder is called for that process's id. Then one process runs whose arguments are `/usr/bin/caffeinate -i -w <that id>`, read with `ps -o args= -p`. When the hold is released. Then that process is gone. When instead the watched process ends. Then the child ends by itself and the holder reports the hold lost | cases of `test/keep-awake.test.ts`, run on macOS alone. Each ends the processes it started by their ids |
| 12. The status line's words | Given two live agents. When the daemon holds. Then the words are `Daemon running, 2 agents, keeping the Mac awake`. When it does not. Then they are `Daemon running, 2 agents` | a case of `test/view.test.ts` |
| 13. The window | Given the built app, started once in the background. Then the foot's control offers "While an agent works", "Always" and "Never" in that order and shows the first, and the daemon has no `caffeinate` child. When the case chooses "Always". Then the status line reads `Daemon running, no agent, keeping the Mac awake`, and the daemon's one `caffeinate` child has the arguments `-i -w <the daemon's process id>`. When the page reloads. Then the control shows "Always". When the case chooses "Never". Then the child is gone and the status line reads `Daemon running, no agent`. After the app stops, no process has the child's id | one case of the built app in `test/keep-awake.test.ts`, with one `BuiltApp.start`. It reads the daemon's children with `ps -axo pid=,ppid=,args=` |
| 14. A daemon that sends no `keepAwake` | Given a `ready` with no `keepAwake`. Then the function that says what the control shows answers that it shows nothing | a case of `test/view.test.ts` |
| 15. The Mac itself | Given the built app as it ships, a working agent and the Mac's own idle sleep time. Then the Mac does not sleep past that time while the display does. When the lid closes. Then the Mac sleeps | no case can wait out the owner's idle time or close the lid: `frame/questions.md` Q1 |

## Data & interfaces

`src/shared/protocol.ts`:

- `type KeepAwakeChoice = "working" | "always" | "never"`.
- `interface KeepAwake { choice: KeepAwakeChoice; held: boolean }`, where `held` says whether the daemon's hold stands now.
- `ready` gains `keepAwake?: KeepAwake`. A daemon given no holder, and a daemon of an earlier build, send none, and a client reads the absence as "this daemon offers no such choice".
- A new server message, `{ type: "keepAwake"; keepAwake: KeepAwake }`, sent to every client whenever the choice or `held` changes.
- A new client message, `{ type: "setKeepAwake"; choice: KeepAwakeChoice }`. It has no answer of its own: the `keepAwake` message that follows a change is the answer. The daemon ignores a value that is none of the three.

`src/shared/keep-awake.ts` is new, as `src/shared/appearance.ts` is for the theme. It holds the three choices in the order the control offers them, each with the words a person reads, the default choice (`DEFAULT_KEEP_AWAKE`, "While an agent works"), and the function that says whether a value from a file or from another process is one of the three.

`src/daemon/keep-awake.ts` is new and imports nothing of the `Daemon` class:

- The function of *Scope* item 2: the choice, the panes and the headless sessions in, a boolean out.
- The store of *Scope* item 1. It writes `{"choice":"<value>"}` through `writeWholeFile`, holds the choice in memory before it writes, and with no run directory keeps it in memory alone, as `LastLook` does. A write that throws is logged as `daemon.ts:352-355` logs the look's, and the choice stands in memory.
- `type HoldAwake = (lost: () => void) => { release(): void }`. A call starts a hold, `release` ends it, and `lost` is called once where the hold ends and `release` was not called.
- The real holder for a process id, *Scope* item 3, `holdAwakeFor(pid, program)`, whose program is `/usr/bin/caffeinate` unless a case names one that cannot start. It starts the child with no shell and no input or output, and reports a child that could not start as a hold lost, so a Mac without the program leaves the daemon running.

`src/daemon/daemon.ts`: `DaemonOptions` gains `holdAwake?: HoldAwake`. The class settles the hold after every change of a pane's `alive` or `state`, of a headless session's `state`, and of the choice, and once at `listen`. `Daemon#close` releases it. `Daemon#handle` gains the case for `setKeepAwake`. `Daemon#checkIdle` is not changed.

`src/daemon/main.ts` gives the daemon the real holder with `process.pid` where `process.platform` is `darwin`, and none elsewhere.

`src/renderer/`:

- `shared.ts#held` gains `keepAwake: KeepAwake | null`, set at `ready` and at each `keepAwake` message.
- `view.ts#daemonStatus` takes a third argument, whether the daemon holds, and its expectations at `test/view.test.ts:1192-1198` pass `false`. `view.ts` gains the function of scenario 14, `keepAwakeControl(keepAwake | null)`, which answers the control's choice and its title, the words a person reads on hover, or `null` where the daemon sent no `keepAwake`.
- `keep-awake.ts` is new, as `theme.ts` is for the theme: it fills the control, shows the daemon's choice in it and in its `title` (`Keep awake: While an agent works`), and sends a person's choice.
- `index.html` gains the control in `#sidebar-foot`, before `#theme-control`: a `label` with the id `keep-awake-control` and the class `icon-button`, an icon drawn as the foot's other icon is, and a `select` with the id `keep-awake` and the `aria-label` "Keep awake". The label stands `hidden` in the page, and `renderer/keep-awake.ts#showKeepAwake` shows it when `ready` carries `keepAwake`.
- `renderer.ts` handles the `keepAwake` message and starts the control. `sidebar.ts` passes `daemonStatus` whether the daemon holds, and exports `showStatus`, which `renderer.ts` calls at each `keepAwake` message to draw the status line again.

The main process, the preload and `src/shared/ipc.ts` are not changed.

## Rule changes

- add
  file: docs/architecture.md
  section: Overall layout
  to: **The daemon keeps the Mac from idle sleep while an agent works.** A sleeping Mac stops every agent, and the notification of an agent that begins to wait does not come until a person wakes the Mac. The daemon holds the block because it knows each session's state and is there while the app is closed. It holds it as one child process, `caffeinate -i -w` with the daemon's own process id, so the block ends when the daemon ends, however it ends. The display may still sleep, and a closed lid still puts the Mac to sleep. A person chooses among "While an agent works", which is the default, "Always" and "Never". "Always" holds while the daemon runs, and does not keep the daemon from exiting once it has nothing left to do. The choice is the daemon's state: it is kept in the daemon's run directory and sent to every client, so the window and the phone show the same one.
    check: apps/desktop/test/keep-awake.test.ts apps/desktop/test/daemon.test.ts

- add
  file: docs/architecture.ko.md
  section: 전체 구성
  to: **데몬은 에이전트가 일하는 동안 Mac이 쉬다가 잠들지 않게 합니다.** Mac이 잠들면 에이전트가 모두 멈추고, 기다리기 시작한 에이전트의 알림은 사람이 Mac을 깨울 때까지 오지 않습니다. 데몬은 세션마다 상태를 알고 앱이 닫혀 있는 동안에도 살아 있으므로, 잠들지 않게 하는 일은 데몬이 맡습니다. 데몬은 자식 프로세스 하나로 이 일을 합니다. 자기 프로세스 ID를 넘긴 `caffeinate -i -w`입니다. 그래서 데몬이 어떻게 끝나든 데몬이 끝나면 Mac은 다시 잠들 수 있습니다. 화면은 꺼질 수 있고, 덮개를 닫으면 Mac은 전과 같이 잠듭니다. 사람은 "While an agent works", "Always", "Never" 가운데 하나를 고르고, 처음 값은 "While an agent works"입니다. "Always"는 데몬이 도는 동안 유지되고, 할 일이 없어진 데몬이 스스로 끝나는 것을 막지 않습니다. 이 선택은 데몬의 상태입니다. 데몬의 실행 디렉터리에 저장되고 모든 클라이언트에 전달되므로, 창과 휴대폰이 같은 값을 보여 줍니다.
    check: apps/desktop/test/keep-awake.test.ts apps/desktop/test/daemon.test.ts

## Removes

- nothing
  why: Nothing in the tree at `8bf9c68` blocks sleep, and no rule of `docs/` speaks of it (*Grounding*, the first fact), so the child process, the choice and the rule above replace nothing. The rule's check line names two files of cases and adds no gate, hook or CI step. The expectations of `daemonStatus` at `test/view.test.ts:1192-1198` gain an argument and keep their words.

Framed 2026-11-20 by framer, before the build.
