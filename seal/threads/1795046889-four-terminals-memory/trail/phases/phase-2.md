# Phase 2: 1795046889-four-terminals-memory

## What this phase found

**The frame holds for this phase.** Every path `frame/design.md` *Data & interfaces* and *Removes* name for it was opened at `d8a82b6`, the commit the phase started from: `src/shared/protocol.ts`, `src/daemon/daemon.ts` (`Daemon#clients`, `Daemon#handle`, `Daemon#startSession` with issue #23's `silentStart`), `src/daemon/buffer.ts`, `src/renderer/renderer.ts#onMessage`, `src/renderer/work-item-view.ts#write`, and `test/daemon.test.ts` with its `describe("OutputBuffer")`. One sentence of *Data & interfaces* reads wider than what was built, and the hand-back names it for the fold: "`buffer.ts#append` drops to the next line break after a cut". A cut that falls at a line's start drops nothing more, as *Scope* item 5 words it.

**Decisions made while building.** Each is the work's, judged against `frame/design.md` *Scope* items 3 and 5.

- **The exit line is the bytes the window wrote:** `\r\n[process exited with code <N>]\r\n`. The line break before it puts it on a line of its own whether or not the pane's last output ended a line. It goes through `print`, the one function in `Daemon#startSession` that keeps a session's output and sends it, which the pane's own output now goes through too.
- **The line is sent before `exit`.** A client draws it before it learns of the end. A case holds the order.
- **A pane a client closed gets no exit line.** `close` takes the session off the lists before its process ends, and the daemon tells nobody of that end today. The line stands inside the same test as the `exit` message, so a closed pane's clients are sent neither. Item 5 does not name this case.
- **A cut at a line's start keeps that line.** The buffer remembers the last character the count of characters dropped. Where it is a line break, nothing more is dropped. Item 5 says the buffer drops "the rest of the line the cut falls in", and such a cut falls in no line.
- **A line break is `\n`.** A carriage return alone does not end a line for the cut.
- **A kept output with no line break stays cut by the count**, as item 5 says. When a line break arrives later, the next cut drops the rest of that long line.
- **`detach` deletes the session from the client's set and does nothing else.** For a session the client does not receive, or one the daemon does not list, the deletion finds nothing. No case holds that sentence of item 3: it asserts that nothing happens, the tree before the phase passes it, and the code has no guard to remove that would show it red. It is `read`.
- **The window reads `exit` for nothing**, as *Data & interfaces* says. The `case "exit"` of `renderer.ts#onMessage` stays, with a comment, and returns.

**What the cut costs.** `executed` once, probe `test_tmp_buffer.test.ts` in this phase's scratch: with 256K characters kept, an append took 0.02 microseconds where the output holds line breaks. It took 29 microseconds for pieces of 64 characters and 6 for pieces of 4,096 where the kept output holds no line break at all, because each append then searches every kept piece for one. Nothing was built to lower that.

**Each case was seen red before its code, or with its guard removed.** `executed` against the tree of `d8a82b6` with the cases added (`p2-red.txt`): five failed, each on its own assertion.

- "sends a client that detached no further output …" failed on the two `output` messages the detached client was still sent.
- "ends a session's output with the exit line …" failed on `expected 'last' to be 'last\r\n[process exited with code 3]\r\n'`.
- Three `OutputBuffer` cases failed on text that opened inside a line: `'[0m\r\nthree\r\nfour'`, `'ef\ngh\nij'` and `'fghijkl\nmn'`.

Four cases and one assertion pass against that tree, so each was shown red at `30c8327` with `seal mutate`, one guard broken, and its failing line read (`mutate-b1.txt`, `mutate-b3.txt`, `mutate-b4.txt`, `mutate-b7.txt`, `mutate-b8.txt`, `mutate-d4.txt`).

- "keeps all of the output while it is within its size": with the line's rest dropped on every append, it failed on `expected '' to be 'ab\ncdef\n'`.
- "keeps a line whole where the cut falls at its start …": with the test of the last dropped character removed, it failed on `expected 'gh' to be 'def\ngh'`. With that character forgotten for a cut inside one piece, it failed on `expected 'fg' to be 'de\nfg'`.
- "counts what it keeps after it dropped a line's rest …": with the kept rest left out of the count, it failed on `expected 'gh\nijklmnop' to be 'ijklmnop'`.
- The assertion added to "closes a pane: its process ends, and the session is in no later list", that no output of a closed pane holds an exit line: with a line printed outside the test of the lists, it failed on that assertion, `test/daemon.test.ts:854`.
- "cuts at the count of characters where what it keeps holds no line break" is the case `frame/design.md` *Removes* names, kept under a new name with its bytes unchanged. With a kept output that holds no line break emptied, it failed on `expected '' to be 'cdefghijkl'` (`mutate-b8.txt`).

**`seal mutate` at `30c8327`, every mutant red.** `executed`, eight mutants of `src/daemon/buffer.ts` in one call (`mutate-buffer.txt`) and six of `src/daemon/daemon.ts` in another (`mutate-daemon.txt`). Of the buffer: the test of the last dropped character removed, the drop of the line's rest removed, that drop made on every append, the last dropped character forgotten in each of the two branches of the cut, the line break kept at the opening, the count without the kept rest, and a kept output with no line break emptied. Of the daemon: `detach` doing nothing, `detach` taking the session from every client, no exit line, an exit line for a closed pane, an exit line with no line break before it, and output that is sent and not kept. The window's two changed lines have no mutant, because each would be a start of the app.

**Scenario 13.** `executed` at `30c8327`: `git grep -n -e 'process exited' -- apps/desktop/src/renderer` printed nothing and exited 1. The same search at `d8a82b6` printed line 252 of `src/renderer/renderer.ts`. `git grep -n -i -e claude -- apps/desktop/src/renderer` printed nothing and exited 1.

**The drive.** `executed` once, on the working tree that `30c8327` then committed: `shasum -c` at that commit read the five changed files under `src/` as the bytes the drive built (`driven-tree.sha`). The script is `test_tmp_drive.test.ts` in this phase's scratch, run as `TMPDIR=/private/tmp/claude-501 OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs --root <scratch> --dir <scratch> test_tmp_drive.test.ts` from `apps/desktop`, and its output is `drive.txt`.

- It built `dist/`, started the app through `BuiltApp.start` with `SHELL` set to `exiter.sh`, which prints `drive-ready`, waits three seconds, prints `no-line-break` with no line break and exits with code 7.
- It told the page that it has the focus, refused WebGL to the page's canvases from the debugging port and reloaded, so the terminal kept the DOM renderer, whose rows hold the text. The page held no canvas.
- It made a work item with a shell pane through the form and read the rows of the terminal in front 1.5 seconds after the exit line showed. The rows that hold text were `drive-ready`, `no-line-break` and `[process exited with code 7]`: the line once, last, on a line of its own. The pane's tab was still there.
- The app answered `document.hasFocus()` with false at its start. `BuiltApp#stop` left no process.

**The *Phase boundary* set.** `executed` at `30c8327`, one command from `apps/desktop`: `TMPDIR=/private/tmp/claude-501 OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/daemon.test.ts test/last-look.test.ts test/view.test.ts test/korean-input.test.ts test/agent-events.test.ts test/agent-state.test.ts test/pane-kinds.test.ts test/work-items.test.ts test/worktrees.test.ts`, exit 0, 9 files, 330 cases passed and 1 skipped (`boundary.txt`). `test/daemon.test.ts` holds the plan row's cases and issue #23's `silentStart` cases, which pass. `test/last-look.test.ts` and `test/view.test.ts` import `src/shared/protocol.ts`, the five after `korean-input` import a module that imports it, and `test/korean-input.test.ts` starts the app built from the changed daemon and window. The skipped case is the typed run. No test file globs a folder the phase changed, and the repository has no contribution guide, so the set has no tree-wide file. `tsc -p` over the six changed files with the package's options exited 0.

**The app was started twice, each under `OWLERY_BACKGROUND=1` with its user data folder under `/private/tmp/claude-501/`:** the drive's start and the Korean case's one. After the last, `pgrep -fl "perf-9/apps/desktop|dist/daemon.js|exiter.sh|printer.sh|receiver.sh"` found nothing, and `/private/tmp/claude-501/` held no folder whose name starts with `owlery-`.

**What the next phases need.**

- Nothing in the window sends `detach` yet. Phase 3's pool sends it when a pane gives its screen back.
- `work-item-view.ts#write` takes `"replay"` and `"output"` alone. An exited pane's replay ends with the exit line, so phase 3 writes nothing at `exit` for a pane that takes a screen after its process ended.
- A drive that reads a terminal's text refuses WebGL from the debugging port and reads `#stage .pane:not([hidden]) .xterm-rows > div`. The runner takes a script outside the package with `--root` and `--dir` set to the script's folder, and prints what the script hands to `process.stdout.write`.
- A daemon keeps the exit line in the output of a session that ended. A session a client closed while its process ran has none, and is on no list.
