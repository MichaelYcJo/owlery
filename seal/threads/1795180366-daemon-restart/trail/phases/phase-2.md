# Phase 2: 1795180366-daemon-restart

## What this phase found

**The frame holds for this phase.** Each coordinate `frame/design.md` *Grounding*, *Data & interfaces* and *Removes* give for *Scope* items 8 to 10 was opened at `a51bbd3`, after the merge of #102. `src/daemon/discovery.ts#readDiscovery` and `#writeDiscovery`, the call of `writeDiscovery` in `src/daemon/main.ts`, `src/main/daemon-client.ts#ensureDaemon`, the answer of `Channel.daemon` in `src/main/main.ts`, `view.ts#EARLIER_DAEMON`, `view.ts#daemonLists`, `renderer.ts#takeRepositories` and `renderer.ts#connect` stand as the frame says. The merge moved the line numbers the frame gives for `view.ts`, `renderer.ts`, `sidebar.ts` and `test/view.test.ts`, which are dated to `417368a`. `sidebar.ts#showStatus` still shows `held.daemonNotice` in place of the daemon's state, and #102's third argument of `view.ts#daemonStatus` is read only where no notice stands.

The phase's code is in `a04db08`, with `changelog.md`. `9a323b7` changes four comments.

### Decisions the frame left to the build

Each is judged against `frame/design.md`, at the section named.

- **The comparison is `daemon-client.ts#otherBuild(found, daemonScript)`, and `main.ts` calls it.** *Data & interfaces* has `src/main/main.ts` compute `otherBuild` from the discovery it found and `buildOf` of the script. `main.ts` imports Electron, so no case loads it without the app. The comparison stands in `daemon-client.ts`, which a case loads directly, and `main.ts` passes it the discovery and the script's path at each request. `ensureDaemon` is not changed, as the frame states.
- **A daemon that wrote no `build` is of another build where the app cannot read its own script either.** *Scope* item 9 names two grounds, no `build` and one that differs. With neither side able to read a script, nothing says the two are one build, so `otherBuild` answers true. A case of `test/daemon-client.test.ts` holds it.
- **The function that gives the notice is `view.ts#daemonNotice(otherBuild)`.** *Data & interfaces* names no function. The sentence stands in that function alone, and `test/view.test.ts` pins it whole.
- **The daemon takes its build before it listens, from `process.argv[1]`, and passes `build` to `writeDiscovery` as it is.** Where the value is undefined, `JSON.stringify` writes no such key, which is *Scope* item 8's file without `build`. A case of `test/daemon.test.ts` reads the written file for it.
- **`readDiscovery` carries `build` only where the file holds a text there.** A number or another value is read as a file without a build (*Data & interfaces*, `Discovery`).
- **The cases of `readDiscovery` and `buildOf` are in `test/daemon.test.ts`, under `describe("discovery")`.** `frame/plan.md`'s phase 2 row names `test/daemon-client.test.ts` for a `daemon.json` with and without `build`. The cases of `readDiscovery` and `writeDiscovery` already stand in `test/daemon.test.ts`, and the crafter's rule adds a case to the group of the function it covers. `test/daemon-client.test.ts` holds the two cases of `otherBuild`, and its case of `ensureDaemon` now has the stand-in daemon write a `build` and reads it in the answer. The phase boundary therefore ran `test/daemon.test.ts` beside the plan's three files.
- **Scenario 11 reloads the page with `Page.reload` of the debugging port**, and sets the focus emulation again for the new page, since scenario 10 reads the keyboard's place after it. The rewritten `daemon.json` keeps the daemon's `pid`, `port` and `token`, as phase 1's record asked.

### What each case was seen red against

Every new or changed case ran red against the tree at `a51bbd3` before the code it covers. The runs are kept under the phase's scratch directory.

- `test/daemon.test.ts`, two cases of `describe("discovery")`: `expected { port: 4321, …(2) } to deeply equal { port: 4321, …(3) }` and `TypeError: buildOf is not a function`.
- `test/daemon-client.test.ts`: `TypeError: otherBuild is not a function` twice, and the case of `ensureDaemon` on `expected undefined to be '0a1b'`.
- `test/view.test.ts`: the two cases of `daemonLists` on `expected { …(3) } to deeply equal { …(2) }`, which is the `notice` key, and `TypeError: daemonNotice is not a function`.
- `test/daemon-restart.test.ts`, the first case, twice. Against `a51bbd3` it failed on `expect(written.build).toBe(build)`, at `:110`: `expected undefined to be '9ee17653…'`. With *Scope* item 8 built and items 9 and 10 not, it failed at `:115` on `the window never showed the status line's sentence for a daemon of another build`. That second red is the one red for both `main.ts`'s answer and `renderer.ts#connect`'s reading of it, which were absent together.

**One assertion of the built-app case was not seen red in the app.** "The status line says nothing of a daemon of the app's own build" (`notice: false` before the file is rewritten, and again after the restart) passes against the tree before this work, where nothing compares builds. Its guard is that `otherBuild` answers false for an equal build. The case of `test/daemon-client.test.ts` "is false where the daemon's daemon.json holds the build of the script the app would start" holds that guard, and went red with the comparison flipped (below). No mutant was run in the app for it, to keep the starts few.

### Mutation

`seal mutate` at `a04db08`, each call from `apps/desktop/`, several mutants of one file in one call. One mutant of `daemon-client.ts` was run again alone to read its failing line: `expected false to be true` at `test/daemon-client.test.ts:185`.

| File | Mutants | Cases | Verdict |
|---|---|---|---|
| `src/daemon/discovery.ts` | SHA-1 in place of SHA-256; `build` not carried by `readDiscovery`; a `build` that is no text carried; `buildOf` gives an empty text where the script cannot be read | `test/daemon.test.ts -t discovery` | 4 red |
| `src/main/daemon-client.ts` | the ground "no `build`" removed; the comparison flipped | `test/daemon-client.test.ts -t otherBuild` | 2 red |
| `src/renderer/view.ts` | the sentence reworded to "from an earlier build."; the sentence given for a daemon of the same build; a `notice` key given again by `daemonLists` | `test/view.test.ts -t "daemonNotice\|daemonLists"` | 3 red |

Three units were not mutated. Each is one line of a file the built app loads, a mutant of it starts the app, and each was absent at one of the two reds of `test/daemon-restart.test.ts` above: the `build` passed to `writeDiscovery` in `src/daemon/main.ts`, the `otherBuild` in the answer of `Channel.daemon` in `src/main/main.ts`, and `held.daemonNotice` set in `renderer.ts#connect`.

### The removal

`git grep -n -e 'from an earlier build\. End its sessions' -e 'EARLIER_DAEMON' -- apps/desktop` prints nothing at `9a323b7` and exits 1. The same search at `417368a` prints two lines of `src/renderer/view.ts` and one of `test/view.test.ts`, so the pattern finds the sentence where it stands. `frame/design.md` *Removes* rows 1 to 3 are done. Row 4 was phase 1's.

One statement of the old sentence stands outside `apps/desktop/` in a file this phase does not write: `seal/threads/1795152521-work-item-menu/changelog.md:17`, the fragment of #93, which the same release ships. It tells a reader that the status line says the old sentence. This work item's `changelog.md` says the new sentence replaces it.

### The phase boundary

One command, from `apps/desktop/`, over the tree `a04db08` holds: `node scripts/test-in-electron.mjs test/daemon-client.test.ts test/view.test.ts test/daemon-restart.test.ts test/daemon.test.ts test/work-item-menu.test.ts test/work-item-form.test.ts test/keep-awake.test.ts`. It exited 0 with 7 files and 602 cases passed. The first three are the plan's. `test/daemon.test.ts` was changed. `test/work-item-menu.test.ts` imports `src/renderer/view.ts`, and `test/work-item-form.test.ts` and `test/keep-awake.test.ts` read the status line's words or its notice in the built app.

Four case files load the built app and read nothing this phase changes by name: `test/korean-input.test.ts`, `test/memory.test.ts`, `test/notification-click.test.ts` and `test/terminal-basics.test.ts`. The phase did not run them, to keep the starts of the app few. `gaps.md` *Not verified* names them with the suite.

`9a323b7` followed that run. It changes comments in `src/main/main.ts`, `src/renderer/view.ts`, `src/shared/ipc.ts` and `test/daemon-restart.test.ts`. After it, `tsc --noEmit` over the twelve TypeScript files the phase changed, with the options of `tsconfig.json`, exited 0, `node build.mjs` exited 0, and `test/view.test.ts` with `test/daemon-client.test.ts` passed, 367 cases. The built-app files were not run again after the comments.

The phase started the app 7 times: twice for the reds of `test/daemon-restart.test.ts`, and 5 times in the boundary's command. After the runs, `ps` listed no daemon, no app, no pane process and no `caffeinate` of this worktree or of a run folder under the temporary folder.
