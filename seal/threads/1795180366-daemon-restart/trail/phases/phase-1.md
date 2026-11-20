# Phase 1: 1795180366-daemon-restart

## What this phase found

**The frame holds for this phase.** Each coordinate `frame/design.md` *Grounding* and `frame/plan.md` *Technical context* give for *Scope* items 1 to 7 was opened at `74621a3` and stands where the frame says: `src/main/daemon-client.ts#answers` and `#ensureDaemon`, the request for the daemon in `src/main/main.ts`, `src/main/menu.ts#menuTemplate`, `src/main/forward.ts#comeForward`, `#sessions-dialog` in `src/renderer/index.html`, `renderer.ts#showArchive` with its redraw in `takeLists`, the reload in `renderer.ts#connect`, `view.ts#runningIn` and `#removalOf`, and `test/built-app.ts#BuiltApp.daemonPid` with the field `daemon`. The frame is wrong about the tree nowhere this phase reads it.

The phase's code is in `73cf3e6`. `9d0bede` widens one case and `c4c92e8` changes one comment.

### Decisions the frame left to the build

Each is judged against `frame/design.md`, at the section named.

- **A request that names neither a restart nor a quit is answered `Owlery was asked for neither a restart nor a quit.`** *Data & interfaces* asks for a refusal and gives it no words. The window never sends such a value, so the sentence is for a reader of a log.
- **The control runs every stop and every start in turn, a stop after a start too.** *Scope* item 2 states the one order a case needs, a start after a stop. `daemon-control.ts#daemonControl` keeps one queue for both, so a stop asked while a start is under way waits for the daemon that start finds. Without it the stop would read a run folder with no `daemon.json`, signal nothing, and the daemon would come up after a restart that answered as done. A case of `test/daemon-control.test.ts` holds it.
- **From the moment a complete quit begins, a second end of the daemon is refused with `Owlery is quitting.` too**, so the quit is called once (*Scope* item 2, scenario 5).
- **A working headless session of no listed work item reads `Asked: <prompt>`.** *Scope* item 5 names the reading of a pane of no listed work item and is silent on such a headless session, while it asks for every running session the window holds. The words are those `view.ts#archivalOf` gives a headless session without its work item's title.
- **A window whose page is still loading is told of the menu's choice once it has loaded.** *Scope* item 4 states this for a window the click made. `main.ts#tellDaemonMenu` does the same for the one window during a reload, where a message sent at once would reach no listener.
- **`main.ts#withClicks` gives an entry its click by its id**, and `menu.ts` exports the two ids as `RESTART_DAEMON` and `QUIT_COMPLETELY` (*Data & interfaces*, `src/main/menu.ts`).
- **The dialog is `#daemon-dialog`, and its function names are `view.ts#daemonEnding` for the words and `view.ts#runningSessions` for the list.** The type of the two choices is `ipc.ts#DaemonEnd`.
- **A process id below 1 in `daemon.json` is not refused.** `stopDaemon` signals the id only after a daemon answered with the file's token, and the file is the daemon's own, readable by the user alone. `gaps.md` *Not done* holds it.

### A departure from the frame: `BuiltApp.leaveMain`

**A main process whose inspector holds a session does not end at `app.quit()`.** The first run of scenario 12 called `electron.app.quit()` through `evaluateMain`, and the app's process was still there ten seconds later (`AssertionError: the app's process, still there: expected [ 3699 ] to deeply equal []`). With the inspector's session closed before the quit, the same case passed. `test/built-app.ts` therefore gains `BuiltApp.leaveMain`, which closes that session, and the two cases that quit the app call it: scenario 12 after it asked the main process to quit 200 ms later, and scenario 13 before it presses Quit. `frame/design.md` *Data & interfaces* names no such method. Phase 2 adds no quit, so it needs none.

### What each case was seen red against

Every new case ran red against the tree before the code it covers. The lines below are from the runs kept under the phase's scratch directory.

- `test/daemon-client.test.ts`, the five cases of `stopDaemon`: `TypeError: stopDaemon is not a function`, five times.
- `test/daemon-control.test.ts`: the file did not load, `Cannot find module '../src/main/daemon-control'`. That is one red for the file and none for a case, so each rule of the control has a mutant below.
- `test/menu.test.ts`: the two changed expectations and the three new cases failed, five of nine.
- `test/view.test.ts`: `daemonEnding is not a function` twice and `runningSessions is not a function` twice.
- `test/daemon-restart.test.ts`, before the main process gave the entries their clicks: `the window never showed the dialog before a restart` and `the window never showed the dialog before a complete quit`.

**The cases that assert something is not signalled were each seen red with their one guard removed** (contract rule 15), by `seal mutate`, one mutant alone so that the failing line could be read.

- With `!(await answers(named))` removed from `stopDaemon`, "signals nobody where nothing answers at the file's address" and "signals nobody where the daemon at the file's address does not answer the file's token" failed on `expect(alive(pid)).toBe(true)`, at `test/daemon-client.test.ts:185` and `:198`.
- With Cancel wired to the end of the daemon in `renderer.ts`, the restart case failed on `expect(named(runDir)).toBe(first)`, at `test/daemon-restart.test.ts:104`: Cancel had replaced the daemon.
- The plain Quit of scenario 12 passes against the tree before this work, since nothing there stops a daemon. With a SIGTERM to the run folder's daemon added to `before-quit` in `main.ts`, it failed on `expected [ false, false ] to deeply equal [ true, true ]`, at `test/daemon-restart.test.ts:140`.

**Two assertions of the built-app cases pin less than they read as pinning.**

- "No `daemon.json` two seconds after a complete quit" does not watch the refusal `Owlery is quitting.`. With that refusal removed from `daemonControl`, the complete quit's case passed (`SURVIVED`): the app is gone before its window reloads. The case of `test/daemon-control.test.ts` is what holds the refusal.
- "The bystander's process is alive" was not seen red. Its guard is that `stopDaemon` reads the run folder it is handed, and no one-line break makes the app read another folder. The two `signals nobody` cases hold the guard that a process is signalled only after its daemon answered.

### Mutation

`seal mutate`, each call from `apps/desktop/` at `73cf3e6` or later, with the cases named.

| File | Mutants | Cases | Verdict |
|---|---|---|---|
| `src/main/daemon-client.ts` | the answer's guard removed; the SIGTERM removed; the wait removed; the refusal's sentence reworded | `test/daemon-client.test.ts -t stopDaemon` | 4 red |
| `src/main/daemon-control.ts` | the refusal of a request while quitting removed; `quitting = false` after a failed stop removed; the queue's link removed; the refusal of neither removed; the quit called for a restart too; the refusal of a second end while quitting removed | `test/daemon-control.test.ts` | 6 red |
| `src/main/menu.ts` | the separator between the two entries removed; a key given to "Quit Owlery Completely…" | `test/menu.test.ts` | 2 red |
| `src/renderer/view.ts` | `alive` dropped for a pane of no listed work item; the restart's head reworded; `working` dropped for a headless session of no listed work item; the quit's button reworded; the listed work items' panes dropped | `test/view.test.ts -t "daemonEnding\|runningSessions"` | 3 red and 2 survived at `73cf3e6`. `9d0bede` adds an exited pane and an ended headless session of no listed work item to the case, and the two are red there |
| `src/main/main.ts` | a SIGTERM to the daemon at a plain quit; the control's stop replaced by one that does nothing | `test/daemon-restart.test.ts -t "a restart of the daemon"` | 2 red |
| `src/renderer/renderer.ts` | Cancel wired to the end of the daemon | `test/daemon-restart.test.ts -t "Restart Daemon"` | red |
| `test/built-app.ts` | `daemonPid` keeps the first id it read | the same | red, on `the daemon.json of a second daemon never came` |

Three units were not mutated on their own. Each mutant of a file the built app loads starts the app, and the run's rules ask for the fewest starts.

- `renderer.ts#showDaemonEnding` and the call of `window.owlery.endDaemon`: the restart case reads the dialog's head, list and button and the earlier daemon gone, and was red before the wiring.
- The reload at once after a restart, `window.location.reload()` in `renderer.ts#endDaemon`: by reading, no case tells it from the reload the lost socket brings one second later. `gaps.md` *Not verified* holds it.
- `src/preload/preload.ts`: the two channels. Without either, the dialog does not open or the daemon does not end, which the cases read.

**The harness's mutant showed what *Scope* item 7 is for.** With `daemonPid` keeping the first id, `BuiltApp.stop` signalled the id of the daemon the restart had ended and left the new daemon running, pid 94524, with the run folder already removed. Its environment named this worktree's receiver and a run folder under the system's temporary folder, and it had started 24 seconds earlier, so it was this phase's own. It was ended by that id with SIGTERM.

### The phase boundary

One command at `9d0bede`, from `apps/desktop/`: `node scripts/test-in-electron.mjs` over `test/daemon-client.test.ts`, `test/daemon-control.test.ts`, `test/menu.test.ts`, `test/view.test.ts`, `test/terminal-basics.test.ts`, `test/daemon-restart.test.ts`, `test/korean-input.test.ts`, `test/memory.test.ts`, `test/notification-click.test.ts`, `test/work-item-form.test.ts` and `test/work-item-menu.test.ts`. It exited 0 with 11 files passed, 503 cases passed and 1 skipped. The last five are there because they import `test/built-app.ts`, which the phase changed. `c4c92e8` changes a comment of `src/main/forward.ts` alone, and `test/forward.test.ts` passed after it. The repository's contribution guide names no test file that reads the whole tree.

`tsc --noEmit` over the fourteen TypeScript files the phase changed apart from `src/main/forward.ts`, whose change is a comment, with the options of `tsconfig.json`, exited 0 at `9d0bede`. One run before it was `tsc --noEmit` with no file named, which reads the whole project. The run's rules leave that to the orchestrator, so it is named here and in the hand-back and is no claim about the project.

After the runs, `ps` listed no daemon, no app and no pane process of this worktree, of a run folder under the temporary folder, or of the fixtures.

### For phase 2

- `BuiltApp.daemonPid` reads `daemon.json` at each call. Scenario 11 writes that file again without `build`: it keeps the daemon's `pid`, `port` and `token`, or `BuiltApp.stop` ends no daemon.
- The first `it` of `test/daemon-restart.test.ts` is scenario 10. Scenario 11's steps go before its first click and after its restart, and the status line it reads then, `Daemon running, no agent`, is already asserted there.
- `renderer.ts#connect` is where `held.daemonNotice` is set from `otherBuild`, and `main.ts` builds the answer of `Channel.daemon` from what `control.daemon()` resolves with.
