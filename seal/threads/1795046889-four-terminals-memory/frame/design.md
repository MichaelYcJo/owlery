# Design: four visible terminals keep the app under about 500 MB

The ticket is issue #9.

## Grounding

The tree as read at `69b25ba`. The window this work changes is the one issue #18 builds, so the window's and the daemon's code was read on `feat/18-the-app-opens-on-a-pane-of-terminals` at `edb2a28`, where phases 1 to 3 of #18 are built and phase 4, the summary screen, is not. A coordinate of `apps/desktop/src/renderer/`, of `src/daemon/daemon.ts` or of `test/view.test.ts` in this file is a coordinate at `edb2a28` unless the sentence names `69b25ba`. The build starts after #18 merges (`frame/plan.md` *Overlap with the release*).

| Policy clause | What it fixes for this work |
|---|---|
| `docs/architecture.md` *Memory design*, first paragraph | The target is the app itself under about 500 MB. Memory grows with what works now and not with the work items left open |
| `docs/architecture.md` *Memory design*, row 1 | A terminal screen and a WebGL context exist only for as many panes as are visible, and they are reused. The daemon holds the output of a hidden terminal. The window #18 builds keeps one screen per pane it ever showed (*Scope* item 2) |
| `docs/architecture.md` *Memory design*, row 2 | The window holds 1,000 lines of history. `renderer.ts#terminalFor` already sets `scrollback: 1000`, and this work keeps it. Fetching older lines from the daemon and a log on disk is not built (*Scope* item 9) |
| `docs/architecture.md` *Memory design*, row 3, and its last paragraph | One window and no built-in browser, which `src/main/main.ts` holds today. Chromium's limit of 16 GPU terminals and the renderer's memory cap are not raised |
| `docs/architecture.md` *Memory design*, row 4, and `docs/roadmap.md` *Done criteria*, row 4 | The agents' processes are counted apart. The criterion is checked by "the published measurement of the app itself" |
| `docs/product.md` *Where performance differs*, row 2 and the sentence above the table | The 500 MB is a hypothesis of which "none … has been measured yet", grounded on 460 to 492 MB for four WebGL terminals in a bare Electron window. This work measures it in the app, so that sentence changes (`## Rule changes`) |
| `docs/architecture.md` *Overall layout*, "Agent state is judged from events", and *Rules that keep it portable*, rule 1 | The protocol's new message names no vendor, and nothing here reads a terminal's screen for state |
| `docs/roadmap.md` *Open decisions*, "The numbers of lightness beyond 500 MB" | A cap on the resources of hidden terminals is set by the owner "after the first measurement of milestone 1". This work is that measurement and sets no such cap |

What reading and probes gave, each labelled:

- `executed`: `gh issue view 9 --json body,comments,title` on 2026-11-19 gave the body the frame is drawn from and no comment.
- `read`: `seal/threads/1795046889-four-terminals-memory/routing.md` at `69b25ba`.
- `executed`: `ls seal/follow-up.md seal/parity.json docs/README.md` found none of the three. The policy root has no index, so each `file:` of `## Rule changes` was picked from `ls docs`. `gh release view --json body --jq .body` answered "release not found". `grep -n 'Process changes' seal/threads/*/changelog.md` printed nothing.
- `read`: `/Users/michael/Documents/GitHub/owlery/etcs/research/memory.md`, whole, and `etcs/bench/electron/measure.js` and the first 120 lines of `main.js` beside it. They are in the owner's main checkout, not committed, and nothing of them is copied into the tree. They give the earlier measurement's method, taken on 2026-11-17 on an M3 Pro MacBook: Electron 45.3.3 and xterm.js 6.0.0, one window of 1200 by 800, each terminal printing 300 lines a second, the sum of macOS `phys_footprint` over the app's process tree read with `footprint --noCategories -f bytes`, sampled 20, 25 and 30 seconds after launch. They give 80 MB for an empty window, 417 MB for one WebGL terminal and 460 MB for four with 1,000 lines of history, of which the GPU process held 336 MB. That window ran no daemon.
- `read`, from the same uncommitted file: a hidden WebGL canvas keeps its buffers in Chromium, and the first WebGL terminal costs the GPU process most of what four cost. Nobody measured either in this app.
- `read`: `apps/desktop/src/renderer/renderer.ts`, lines 20 to 180, 345 to 435, 470 to 500 and 515 to 644, `src/renderer/view.ts`, lines 125 to 170, and the pane area's rules and elements of `src/renderer/index.html`, at `edb2a28`. `renderer.ts#terminalFor` makes one `Terminal` with a `FitAddon` and a `WebglAddon` the first time a pane is in front, and `renderer.ts#remove` disposes of it only when the daemon no longer lists the pane. `renderer.ts#showView` hides every pane's element but the one in front.
- `read`: `apps/desktop/src/daemon/daemon.ts`, lines 20 to 170, 200 to 262, 326 to 356 and 425 to 450, at `edb2a28`, and `src/daemon/buffer.ts`, `src/shared/protocol.ts`, `src/main/main.ts`, `src/main/daemon-client.ts`, `src/daemon/main.ts`, `build.mjs` and `scripts/test-in-electron.mjs` at `69b25ba`, whole. A client receives a session's output from the `start` or the `attach` it sent until it disconnects: the protocol has no message that ends it. A session that exited stays on the daemon's lists, with its output, until a client sends `close`. `OutputBuffer#append` drops the oldest output by a count of characters, so a replay can open inside an escape sequence.
- `read`: `@xterm/addon-webgl` 0.19.0, the version `apps/desktop/package.json` pins, in `src/WebglRenderer.ts`, lines 138 to 150, in the checkout of #18's branch. Disposing of the renderer removes its canvas and its render layers and does not call `WEBGL_lose_context`, so when a disposed context's memory returns is the browser's to decide. A screen that is reused disposes of nothing.
- `read`: `seal/threads/1795043695-inbox-first-window/frame/design.md`, *Scope* items 1 to 16 and `## Removes`, `frame/plan.md`, lines 1 to 30 and 56 to 135, and `frame/questions.md`, whole, at `edb2a28`. *Scope* item 6 there keeps a terminal the window made, hidden, until its pane closes, and item 16 hands disposing of a hidden terminal, a `detach` message and several panes side by side to this issue. Its plan's row on disposing of a view's terminals names the two costs of attaching again: the daemon goes on sending a detached pane's output, and a replay can open inside an escape sequence.
- `read`: `seal/threads/1795015072-daemon/gaps.md` at `69b25ba`. The daemon keeps 256K characters of each session's output in memory, and the log on disk comes later.
- `executed`: `git grep -n -i -e footprint -e getAppMetrics edb2a28 -- apps` printed nothing and exited 1, and so did the same search at `69b25ba`. `git grep -n -i -e detach -e 'side by side' -e split edb2a28 -- apps/desktop/src` printed five lines, each on the daemon's process or a headless session "detached" from something. Nothing in the tree measures memory, ends a client's receiving of a session, or shows two panes at once.
- `executed`, the searches of scenarios 12 to 14, at `69b25ba`: `git grep -n -e 'new Terminal(' 69b25ba -- apps/desktop/src` printed line 68 of `src/renderer/renderer.ts` and no other. `git grep -n -e 'process exited' 69b25ba -- apps/desktop/src/renderer` printed line 374 of `src/renderer/renderer.ts`, which is line 590 at `edb2a28` and which the build removes (`## Removes`). `git grep -n -i -e claude 69b25ba -- apps/desktop/src/renderer` printed nothing and exited 1. Each search names a folder of `apps/desktop/src`, so none reads this work item's directory.
- `executed`: `footprint --noCategories -f bytes <pid> <pid>` on macOS 26.5 prints one `Footprint: <N> B` line per process, the form the earlier measurement parsed.
- `executed`: the path of the hook socket under this framer's scratch directory is 167 bytes (`printf … | wc -c`), over the 104 bytes macOS allows, so the built app's daemon cannot start there (issue #19) and no probe of the built app ran. No commit holds a window that shows four terminals either. Whether four visible terminals stay under 500 MB is therefore a row of `frame/questions.md`.
- `executed`: `git rev-parse` gave `56ce302` for `fix/19-the-daemon-dies-where-its-socket-path-is-too-long` and `1c2acea` for `test/10-no-test-types-korean-into-a-pane`. Each holds its `routing.md` and no frame, so each was judged from its issue and its routing.
- Nobody's finding, relayed by the orchestrator's spawn prompt: the owner chose that every crafter phase of this work runs on Fable 5.2 and the sealer on Opus 5.5. The orchestrator answers for it.

## Scope

1. **A work item's view shows up to four of its panes at once.** The pane bar of #18 gains one control, "Side by side", a button that is pressed or not.
   - Not pressed, the stage holds the terminal of the tab in front, as #18 builds it.
   - Pressed, the stage holds the work item's panes as tiles, each a terminal fitted to its tile. Two panes stand in two columns. Three or four stand in two columns and two rows, and the third of three spans both columns. A work item with more tabs than four shows the four that were most recently in front in that view, in the tabs' order.
   - The tab of every pane on the stage is marked as shown, and the tab of the pane that has the keyboard is marked as in front. A press on a tab that is not on the stage puts its pane there, in place of the shown pane least recently in front. A press inside a tile gives that pane the keyboard.
   - Whether the control is pressed is the window's own state, one for every view, off at each load.
   - A session that starts to wait is not notified while its pane is on the stage of a focused window, whether or not it has the keyboard. `notificationFor` decides as today, and its caller passes that as `inFront`.
   - How a person puts four terminals on screen is `frame/questions.md` Q1, and this item is its default.
2. **A terminal screen exists only for a pane on the stage, and is reused.** A screen is one `Terminal` with its `FitAddon`, its `WebglAddon` and its element. The window holds a pool of them.
   - A pane that goes onto the stage takes a free screen, and a new one is made only where none is free. The pool therefore never holds more screens than the most panes that were on the stage at once, which item 1 caps at four.
   - A pane that leaves the stage gives its screen back: the window sends `detach` for it, resets the terminal and hides the element. A pane leaves the stage when another tab takes its place, when "Side by side" is released, when the view of another work item opens, when the inbox screen or #18's summary screen comes in front, and when it is closed.
   - A pane that takes a screen is attached as #18 attaches a new terminal: the screen is fitted, the process is told the size, the window sends `attach`, and the replay is written into the reset terminal.
   - A free screen stays in the pool, hidden, for the window's life. The measurement reports what the pool holds while the inbox is in front (item 6).
3. **A hidden pane's output stays with the daemon.** The protocol gains the client message `detach`. After it, the daemon sends that client no output of that session until the client attaches again. The session, its process and its kept output are untouched. A `detach` for a session the client does not receive, or that the daemon does not list, changes nothing and is answered with nothing.
4. **A pane shown again draws its output once.** Where a pane leaves the stage and returns before the first replay arrived, two replays are on their way. The window writes the last one it asked for and no other, and drops output that arrives before it, as #18's guard drops it for one replay.
5. **An exited pane keeps its tab and its last screen without the window holding a terminal for it.**
   - When a session's process exits, the daemon appends the line `[process exited with code <N>]`, on a line of its own, to the session's kept output and sends it as `output` to the clients that receive the session. A replay of an exited session therefore ends with it. The window writes nothing of its own at `exit`.
   - The tabs of a work item's view are its sessions as the daemon lists them, alive or exited, in the order of their ids. An exited pane shows a tab after a reload as well, where #18 shows none for a pane whose terminal the window does not hold, and its close control takes it off the daemon's lists.
   - A replay opens at the start of a line. Where `OutputBuffer` drops old output, it also drops the rest of the line the cut falls in, so what it keeps never opens inside an escape sequence that stands on one line. Where what it keeps holds no line break, the cut stays where the count of characters puts it.
6. **The measurement is a script in the tree**, `apps/desktop/scripts/measure-memory.mjs`, run as `pnpm run measure:memory` from `apps/desktop`. It is macOS's alone, as v0.1 is, and it joins no check: `pnpm run check` and the `Broad gate` do not run it, because it opens a window and takes minutes.
   - It builds nothing. It starts the built app with a user data folder and a worktrees folder of its own, reads the daemon's address from that run folder, creates work items and shell panes as a second client of the daemon, and moves the window through its own controls over Chromium's debugging port.
   - Each pane prints about 300 lines a second of text with colour escapes, the rate of the earlier measurement, from before the first sample to the last.
   - It takes a sample of the sum of `phys_footprint`, read with `footprint`, 20, 25 and 30 seconds after the scenario's last step. At each sample it reads from the page that the document is visible and the window has the focus, and how many terminals and canvases the page holds. A sample taken while the page was hidden is thrown away with its run.
   - The app itself is the Electron main process, every process below it, and the daemon. The processes below the daemon are the panes' and are summed apart: the shells here, and an agent's CLI in use.
   - Its scenarios are these. `inbox`: the app as it opens, no view opened. `one`: one pane on the stage. `eight-in-turn`: eight panes in two work items, each put in front once, the last one left on the stage. `four`: four panes side by side. `four-after-eight`: the panes of `eight-in-turn` each shown once, then four of them side by side. `inbox-after-four`: `four`, then the inbox screen in front. Each scenario is a launch of its own.
   - It prints one table row per scenario and run, and for the last sample of each run the footprint of each process by its kind: main, renderer, GPU, utility, daemon. It ends by closing the panes, quitting the app, stopping the daemon by the process id it read, and removing its folders.
7. **The number and its method are written in one file**, `apps/desktop/measurements/memory.md`: the date, the commit, the machine and its displays with their scale, the versions of macOS, Electron and xterm.js, the window's size, what counts as the app itself and what is summed apart, the command, and the script's tables. The criterion's number is the highest sample of scenario `four` over three runs. The file says in its first lines whether that number is at or under 500 MB. The changelog fragment carries the number and the file's path.
8. **The window names no vendor**, as today, and the new message carries none.
9. Out of scope, each with its reason:
   - A screen state the daemon parses and keeps for each terminal, in place of the raw output it replays. `docs/architecture.md` *Measure before building* asks for the daemon's CPU cost of parsing output to be measured first, and nobody has. `frame/plan.md` *Alternatives considered* holds the row.
   - The log on disk, and fetching lines older than the window's 1,000 from the daemon. The issue cites the rule's first sentence, which `scrollback: 1000` holds, and the log is the daemon work item's named follow-up (`seal/threads/1795015072-daemon/gaps.md` *Not done*).
   - The other measurements of `docs/architecture.md` *Measure before building*: the switching latency of a reused screen, and the GPU memory of one terminal with the DOM renderer and on a 4K display. The script's per-process table gives the WebGL number at this app's pane size on the machine that runs it, and no more.
   - A cap on the resources of hidden terminals, the startup time and the install size (`docs/roadmap.md` *Open decisions*, the owner's after this measurement).
   - Dragging a split, resizing a tile, tiles of more than one work item, and keeping the layout across a reload. `frame/questions.md` Q1 names the first as an option.
   - Disposing of a free screen. The pool is bounded by item 1's cap, and `@xterm/addon-webgl` 0.19.0 releases a disposed context only when the browser collects it (`## Grounding`).
   - Windows and Linux. `footprint` is macOS's, and v0.1 is the macOS app.

## User scenarios & acceptance *(mandatory)*

"The drive" is one run of the built app through the debugging port, as the earlier work items drove it, with a second client reading the daemon.

| Scenario | Given / When / Then | Verifiable how |
|---|---|---|
| 1. Four terminals on screen | Given a work item with four live panes and its view on screen, when "Side by side" is pressed, then the stage shows four tiles, each with a terminal that prints its own pane's output, and the page holds four terminals; when it is released, then the stage shows the pane in front alone and the window has sent `detach` for each of the others | The drive: the count of `.xterm` elements that are displayed, each tile's size, the frames of the window's WebSocket |
| 2. Which panes are on the stage | Given a view's tabs, the order they were last in front and whether "Side by side" is pressed, the function gives the panes on the stage as *Scope* item 1 states them: the one in front, or the most recently in front up to the cap, in the tabs' order; a pressed tab that is not shown replaces the shown one least recently in front | Cases, each seen red before its code |
| 3. A screen is reused | Given screens that hold panes and the panes the stage now shows, the function gives each new pane a free screen before it asks for a new one, keeps a pane that stays on its screen, and names the screens to give back | Cases, each seen red before its code |
| 4. Hidden panes hold no screen | Given the panes of scenario `eight-in-turn` (*Scope* item 6), when each is put in front once, then the page never holds more than one terminal and one canvas, and a pane shown again draws the output it printed while hidden | The drive; the script's table for `eight-in-turn`, which gives the count of terminals and canvases |
| 5. The daemon stops sending to a client that detached | Given two clients that receive a session, when one sends `detach`, then it receives no further `output` of that session and the other still does; when it sends `attach` again, then it receives a `replay` that holds what was printed meanwhile, and output after it | Cases, each seen red before its code |
| 6. One replay is drawn | Given a pane attached, detached and attached again before any replay arrived, when both replays and output between them arrive, then the first replay and that output are dropped and the second replay is written | A case on the function that decides it, seen red before its code |
| 7. An exited pane keeps its last screen | Given a pane whose process exits while it is hidden, when its tab is pressed, then the terminal shows the output it printed and, last, `[process exited with code <N>]`; after a reload its tab is still there, and its close control removes it | Cases on the daemon's replay and on `paneTabs`, each seen red before its code; the drive |
| 8. A replay opens at a line's start | Given a buffer that dropped old output, its text opens at the first character after a line break | A case, seen red before its code |
| 9. Nobody is notified of a pane they are looking at | Given a focused window with panes side by side, when the agent of a pane that does not have the keyboard starts to wait, then no notification is shown; with the inbox in front, one is | The drive with `Notification` recorded, as scenario 15 of #18 records it; `notificationFor` and its cases are unchanged |
| 10. The app itself under about 500 MB with four terminals visible | Given the built app at the phase's commit, when `pnpm run measure:memory` runs scenario `four` for the runs *Scope* item 7 names, then every sample's sum for the app itself is at or under 500 MB, and `apps/desktop/measurements/memory.md` holds the number, the per-process table and the method of that item | Executed by phase 3's builder, and again by the sealer, who reads its own run against the file |
| 11. Memory does not grow with hidden panes | The highest sample of `four-after-eight` is within 5% of the highest of `four`, and `eight-in-turn` after this work is under `eight-in-turn` before it | The script's tables: phase 1's run on the window as #18 leaves it, and phase 3's |
| 12. One place makes a terminal | `git grep -n -e 'new Terminal(' -- apps/desktop/src` prints one line, in the file that holds the pool. At `69b25ba` it prints line 68 of `src/renderer/renderer.ts`, which the build keeps or moves into that file | Executed |
| 13. The window writes no exit line | `git grep -n -e 'process exited' -- apps/desktop/src/renderer` prints nothing. At `69b25ba` it prints line 374 of `src/renderer/renderer.ts`, which `## Removes` names | Executed |
| 14. The window names no vendor | `git grep -n -i -e claude -- apps/desktop/src/renderer` prints nothing, as at `69b25ba` | Executed |

## Data & interfaces

In `apps/desktop/src/shared/protocol.ts`:

- Client: new `{ type: "detach"; id: number }`. It has no answer.
- `exit` stays as it is. The window reads it for nothing it draws.

In `apps/desktop/src/daemon/`: `daemon.ts` handles `detach` by taking the session out of the set of that client (`Daemon#clients`), and at a process's exit appends the exit line through the path a pane's own output takes. `buffer.ts#append` drops to the next line break after a cut. Their cases go in `apps/desktop/test/daemon.test.ts`, where the buffer's and the replay's cases are.

In `apps/desktop/src/renderer/`:

- The decisions are pure functions with cases in `apps/desktop/test/`, as `view.ts` holds the window's others: the panes on the stage (scenario 2), the screens they take and give back (scenario 3), and which replay is written (scenario 6). `paneTabs` loses its `held` parameter. The builder names the functions and may give them a module of their own beside `view.ts`; a name is a line of the phase record.
- `renderer.ts` holds the pool in place of the map of one terminal per pane, and builds the tiles. `index.html` gains the "Side by side" button in `#pane-bar` and the stage's rules for the tiles.

`apps/desktop/scripts/measure-memory.mjs`, and the script `measure:memory` in `apps/desktop/package.json`. It takes the scenarios to run, the count of runs and a user data folder as arguments, and uses `ws`, which the package already depends on, for both the daemon and the debugging port. `apps/desktop/measurements/memory.md` is written by the builder from the script's output.

## Rule changes

- change
  file: docs/product.md
  section: Where performance differs
  from: Everything below is a hypothesis, and none of it has been measured yet.
  to: Everything below is a hypothesis. Only the second has been measured in the app itself, and `apps/desktop/measurements/memory.md` holds its number, its date and its method. The others have not been measured yet.

- change
  file: docs/product.ko.md
  section: 성능에서의 차이
  from: 아래는 모두 가설이고, 아직 재지 않았습니다.
  to: 아래는 모두 가설입니다. 이 가운데 둘째만 앱 자체에서 쟀고, 그 숫자와 잰 날짜, 재는 방법은 `apps/desktop/measurements/memory.md`에 있습니다. 나머지는 아직 재지 않았습니다.

- add
  file: docs/architecture.md
  section: Memory design
  to: A work item's view shows at most four panes at once, the count the 500 MB target is measured at. The other panes of the work item stay as tabs, and a pane that is not on screen holds no terminal screen in the window.

- add
  file: docs/architecture.ko.md
  section: 메모리 설계
  to: 작업 하나의 화면은 칸을 한 번에 넷까지만 보입니다. 500 MB 목표를 잰 개수가 넷이기 때문입니다. 그 작업의 나머지 칸은 탭으로 남고, 화면에 없는 칸은 창 안에 터미널 화면을 두지 않습니다.

## Removes

The coordinates are at `edb2a28` (`## Grounding`). The work adds one script that joins no gate and no check, so nothing is owed for it in return.

| Removes | Coordinate | Where it lands, or why it can go |
|---|---|---|
| The terminal a pane keeps, hidden, from the first time it is in front until it closes | `apps/desktop/src/renderer/renderer.ts` (`panes`, `terminalFor`, `remove`, and the loop of `showView` that hides every pane's element but one) | The pool of screens (*Scope* item 2). #18's frame keeps the terminal "as today" and hands its disposal here (`seal/threads/1795043695-inbox-first-window/frame/design.md` *Scope* items 6 and 16) |
| The exit line the window writes | `apps/desktop/src/renderer/renderer.ts#onMessage`, case `exit` | The daemon's kept output (*Scope* item 5) |
| The tab an exited pane has only while the window holds its terminal, with the `held` parameter and its cases | `apps/desktop/src/renderer/view.ts#paneTabs`, `apps/desktop/test/view.test.ts` (`describe("paneTabs")`, the cases that pass a set of held panes) | Every listed session of the work item has a tab (*Scope* item 5) |
| The cut of kept output at a character, and the case that pins it | `apps/desktop/src/daemon/buffer.ts#append`, `apps/desktop/test/daemon.test.ts` (`describe("OutputBuffer")`, "keeps the most recent output up to its size") | The cut at a line's start (*Scope* item 5); the case is rewritten for it |
| A client's receiving of a session for as long as it is connected | `apps/desktop/src/daemon/daemon.ts` (`Daemon#clients`, which only gains sessions) | `detach` (*Scope* item 3) |

Framed 2026-11-19 by framer, before the build.
