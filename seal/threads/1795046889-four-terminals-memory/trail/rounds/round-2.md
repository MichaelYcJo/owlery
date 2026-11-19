# Review round 2: 1795046889-four-terminals-memory

```seal
target: 8a65c82 against 7ec75d3
```

This round reads the diff from `7ec75d3`, round 1's last commit, to `8a65c82`. That range holds two things. The first is the fix pass over round 1: `d9c58ac`, `35aab18`, `9849e41` and `b8f9fc7`, with the close blocks at `d8a82b6`, and finding 4's close at `8f8daea`, which stands before the range and whose cell this round reads in the tree. The second is phase 2 as `frame/plan.md` *Phases* row 2 gives it: the build commit `30c8327`, the phase record and the closing memo at `03944ad`, and the orchestrator's fold at `8a65c82`. The branch's base is `release/v0.0.1` at `ea78b7b`. The crafter amended its first phase 2 commit, `1367be7`, into `30c8327`; the amend changed `apps/desktop/test/daemon.test.ts` alone, and `git grep -n 1367be7` at the target printed nothing, so no record cites the commit that left the branch.

Carried from round 1, not re-derived: the reading of the measurement's driving code (`openWorkItem`, `addPane`, `untilInFront`, `STEPS`, `PAGE_READ` and `measure` outside the two lines the fix pass changed), and the probe facts of `frame/design.md` *Grounding*, dated to `7e33c8a`. Re-derived: every verdict below. `seal/parity.json` is not declared, `seal/config.json` has no `Pact` key, and `Record language` is English. The work item holds no `changelog.md` and no `pr.<lang>.md`: `Commit and pull request language` is English, and the plugin's `docs/layout/the-record-layout.md` *A commit after the build brings its changelog fragment along* gives the fragment to the build's last phase, which is phase 4.

The round started the Owlery app zero times. The test runner, `scripts/test-in-electron.mjs`, runs Electron's binary with `ELECTRON_RUN_AS_NODE=1` (`scripts/test-in-electron.mjs:13-15`), which opens no window. Every run below was made in a `git clone --no-local` of the worktree at `8a65c82`, in the round's scratch directory, with its own `pnpm install --offline`.

## Findings

### 1. "drops the rest of the line a cut falls in where the cut is in the middle of one piece of output" covers nothing the other six `OutputBuffer` cases do not

```seal
severity: should
location: `apps/desktop/test/daemon.test.ts:1512-1516`
evidence: executed `seal mutate src/daemon/buffer.ts` with nine mutants, once with `--tests` running the six other `OutputBuffer` cases (`-t "OutputBuffer (keeps|opens|counts|cuts|drops the rest of a long)"`) and once running this case alone (`-t "middle of one piece"`), from `apps/desktop` in the clone; read `apps/desktop/test/daemon.test.ts:1504-1533`
```

Why it matters: the case feeds `"abcdef\ngh\nij"` into a buffer of 8 and expects `"gh\nij"`. The case "counts what it keeps after it dropped a line's rest" at `daemon.test.ts:1528-1533` opens with the same append into the same size. The case "opens at the first character after a line break" at `daemon.test.ts:1504-1510` takes the same path twice: a cut inside one piece of output, the line break in that same piece, and a rest kept after it. Of the nine mutants, the six other cases turned eight red. This case turned three red: the rest of the line not dropped, the rest kept with its line break, and the kept rest left out of the pieces. The six other cases turned all three of those red as well. The one mutant the six left green starts `dropped` at `"\n"`, and it is equivalent: the loop at `buffer.ts:21-32` sets `dropped` on every pass that removes a character, and a cut always removes one. Nine mutants are a sample of the mutants, so the reading of the two other cases above is the ground and the run is its probe. The case holds a fact the frame states, scenario 8 and *Scope* item 5, so the exception for a case that holds no frame fact does not apply. The phase record's sentence on it, at `trail/phases/phase-2.md:24`, is dated to `30c8327` and stays.

```ts
// apps/desktop/test/daemon.test.ts: delete lines 1512-1516, the case "drops the rest of the line a cut falls in where the cut is in the middle of one piece of output".
```

```seal
verdict: fixed 1dbc049
answer: The finding holds, and the case is deleted. The first append of "opens at the first character after a line break" takes the same path: a cut inside one piece, the line break in that piece, and a rest kept after it. "counts what it keeps" does not see that path alone, because its second append cuts through the same characters whether or not the first dropped the line's rest. At `b849075`, `seal mutate src/daemon/buffer.ts` with the three mutants the deleted case had turned red (the rest not dropped, the rest kept with its line break, the kept rest left out of the pieces) read all three red under the six cases that stay.
```

### 2. The comment of the escape sequence case puts the cut in the colour sequence that opens the second line, and it falls in the one that closes it

```seal
severity: should
location: `apps/desktop/test/daemon.test.ts:1507`
evidence: executed `node -e` over the case's two appends, which printed a first piece of 19 characters and, for the cut before phase 2, a remnant `"[0m\r\n"`; executed `node scripts/test-in-electron.mjs test/daemon.test.ts` against the `src/` of `d8a82b6`, which failed the case on `expected '[0m\r\nthree\r\nfour' to be 'three\r\nfour'`; read `apps/desktop/test/daemon.test.ts:1504-1510`, `apps/desktop/src/daemon/buffer.ts:15-36`
```

Why it matters: the comment says "The count of characters puts the cut inside the colour sequence that opens the second line." The second line is `\u001b[31mtwo\u001b[0m`, and the sequence that opens it is `\u001b[31m`. The first append is 19 characters into a buffer of 16, so it is already cut: at the target it loses `one` and the line break after it, and before phase 2 it lost `one`. The second append then puts the cut after the escape character of `\u001b[0m`, the sequence that closes the line. Both trees put it there, and the red run before the phase shows the remnant `[0m`. The case still pins scenario 8. The comment, though, describes another fixture than the one it stands over, and the next person who edits the buffer's cases and moves the fixture to match the comment loses the case's point. The snippet replaces line 1507 and is the case's one statement of where the cut falls; the case's name says nothing about which sequence.

```ts
    // The first piece is already over the size and loses its first line. The second puts the cut inside `\u001b[0m`, the colour sequence that closes the line `two`.
```

```seal
verdict: fixed b849075
answer: The finding holds, and the snippet replaced the comment as written. The fix pass read both appends by hand before applying it: the first piece is 19 characters in a buffer of 16 and loses `one` with its line break, and the second append's nine dropped characters end on the escape character of `\u001b[0m`. The case's code is unchanged, and `test/daemon.test.ts` passed whole at `b849075`, 91 cases.
```

## Confirmations

```seal
confirms: round-1#1
```
What holds: `unread` at `apps/desktop/test/memory.ts:107-111` names every process of the app that has no number from `footprint`, by kind and process id, and `measure` throws its sentence at `memory.ts:396-397`, before the sample is pushed. The docstring of `sums` at `memory.ts:113` now names a pane's process alone, as the finding asked. The two cases at `memory.test.ts:114-131` read the sentence whole and the null. Round 1's `evidence: executed` line was run again: `git grep -n -e "bytes.has" -e "bytes.get" -- apps/desktop/test/memory.ts` now prints line 108, inside `unread`, and lines 116 and 117 in `sums`, and the old test of two processes at line 389 is gone. `seal mutate test/memory.ts` with two mutants, `unread` taking only a missing main process and `unread` always null, turned both red under the file's 26 cases. Claimed in the close: a stub, `d9c58ac` and four mutants each showed the cases red; the crafter's `fix1b-red.txt` and `fix1b-mutate.txt` say so, `read`. The throw in `measure` has no case, because it needs a launch, and `gaps.md:29` says no launch has been made since the rule. `executed` and `read`.

```seal
confirms: round-1#2
```
What holds: `memory.test.ts:254-255` reads `planOf(process.env)` only under `MEASURE`. Round 1's probe was run again: `env -u OWLERY_MEASURE_MEMORY OWLERY_MEMORY_RUNS=0 node scripts/test-in-electron.mjs test/memory.test.ts` from `apps/desktop` exited 0 with 26 passed, where round 1 read exit 1 and no tests. The same command with `OWLERY_MEMORY_SCENARIOS=nonesuch` in place of the runs exited 0 with 26 passed. `executed`.

```seal
confirms: round-1#3
```
What holds: the case "takes no process of another app" is gone. The two cases the finding named stand at `memory.test.ts:89` and `memory.test.ts:100`. The crafter's `fix3-mutate-app.txt` and `fix3-mutate-panes.txt` show each failing alone on its own list with the parent test removed from `splitProcesses`, `read`.

```seal
confirms: round-1#4
```
What holds: `awk -F'|' 'NR>=63 && NR<=68 {print NR": "NF-2" cells"}'` over `frame/plan.md` printed four cells for every row of *Phases*, and row 1's fourth cell is `aeaa1e0`. Row 2's is `30c8327`, the phase's commit. `executed`.

What matched: the phase's cases were red before its code. Claimed at `trail/phases/phase-2.md:20-24`: five cases failed against `d8a82b6` with the cases added. This round checked out the `src/` of `d8a82b6` in the clone beside the target's `test/daemon.test.ts` and ran the file. It exited 1, with the same five failed and 87 passed, and the clone's `src/` was put back to `8a65c82` after. `executed`.

What matched: the narrow set at the target. `node scripts/test-in-electron.mjs test/daemon.test.ts test/memory.test.ts`, with the three measurement variables unset, exited 0 with 118 passed. Issue #23's `silentStart` cases are among them. `executed`.

What matched: scenarios 12, 13 and 14 at the target. `git grep -n -e 'process exited' -- apps/desktop/src/renderer` and `git grep -n -i -e claude -- apps/desktop/src/renderer` printed nothing and exited 1. `git grep -n -e 'new Terminal(' -- apps/desktop/src` printed `src/renderer/work-item-view.ts:85` alone. The whole tree's `process exited` lines are the daemon's at `daemon.ts:422` and the cases', so no other client of the protocol writes a line of its own. `executed`.

What matched: the drive read the target's bytes. `shasum -c` of the crafter's `driven-tree.sha`, run in the clone's `apps/desktop`, read the five files under `src/` as OK. The crafter's `drive.txt` holds the rows `drive-ready`, `no-line-break` and `[process exited with code 7]`, one exit line, no canvas, and an empty list of processes left, as `trail/phases/phase-2.md:40-43` says. `background=true` there is `!app.focusedAtStart`, which `test/built-app.ts:146-148` gives as what `document.hasFocus()` answered. `executed` and `read`.

What matched: `detach` against *Scope* item 3, the reading `gaps.md:14` names this round for. `Daemon#handle` at `daemon.ts:279-282` deletes the id from the client's own set and returns. For a session the client does not receive, `Set#delete` finds nothing. For a session the daemon does not list, the handler reads no list and sends nothing. A `detach` sent before `ready` waits in `early` with every other message (`daemon.ts:201`, `daemon.ts:231`). No other client's set is reached, and only a client that sent the token reaches `handle` (`daemon.ts:188-198`). A detached client still gets `exit` and the inbox, which `broadcast` sends to every client, and the protocol's comment at `protocol.ts:140` names only output. `attach` at `daemon.ts:270-277` sends the replay and adds the client in one synchronous handler, so between a `detach` and the next `attach` no output is lost or drawn twice. `read`.

What matched: the exit line is the session's last output. `print` at `daemon.ts:411-415` is the one place that appends to a session's kept output; `git grep -n "output.append" -- apps/desktop/src` prints line 412 alone. The exit line goes through it only while the session is listed, before `exit` is broadcast (`daemon.ts:420-425`). node-pty 1.1.0 holds its exit until its socket closes, because "Sometimes a data event is emitted after exit" (`node_modules/node-pty/lib/unixTerminal.js:66-80` in the clone), so the pane's own output does not follow the line. `read`.

What matched: the window. `renderer.ts:251-253` returns at `exit` with a comment, and `work-item-view.ts#write` at `work-item-view.ts:312` takes `"replay"` and `"output"`. Since `kind` is now one of two, the test `kind === "output"` on line 317 always holds where it is read; it is no defect. The line now stands in the daemon, which `docs/architecture.md:266` asks of the protocol: "no state lives on the UI side". The row of #18's records at `seal/threads/1795043695-inbox-first-window/gaps.md:50`, where an exit that arrived before the replay was drawn above it, no longer describes the tree: the line is now `output`, which `write` drops while the replay is awaited, and the replay holds it. That row is another work item's and goes to the settle. `read`.

What matched: the cut against *Scope* item 5 as the fold at `8a65c82` words it. `buffer.ts:20-35` remembers the last character the count dropped and drops through the next line break unless that character is `\n`. Where nothing kept holds a line break, `dropLineRest` at `buffer.ts:43-50` returns and the count stands. The *Removes* row on the old case says "the case is rewritten for it". The crafter kept its bytes under a new name, and `trail/phases/phase-2.md:32` names that; the case now pins item 5's last sentence, so the change holds what the row needs. `read`.

What matched: the records against the target. `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `pr.md` and `trail/phases/phase-2.md` were read whole at `8a65c82`, and `trail/phases/phase-1.md` and `trail/rounds/round-1.md` for their coordinates. The fold's two edits hold: `frame/design.md:70` on a closed pane's end matches `daemon.ts:419-425`, and `frame/design.md:127` on the cut matches `buffer.ts`. *Operational impact*'s sentence that an earlier daemon ignores `detach` holds at `daemon.ts:330-331`, the `default` of `handle`. The diff of `gaps.md` takes no row out: the suite's row is reworded in place, and three rows and two paragraphs of *Not done* are added. Each of the five quotes of `pr.md` stands word for word at the start of the Judgment cell of `frame/plan.md` *Judgments of the run* that its line names, rows 3, 6, 5, 2 and 1. The suite, the typecheck and the broad gate are labelled not verified with the orchestrator as answerer at `gaps.md:12`, which is honest. `read`.

What matched: the fix pass's own unit. `unread` is new code, and the error sentence it returns is pinned whole by `memory.test.ts:114-125`, as contract rule 14 asks. `gaps.md:29` names the one new failure path it adds: a helper that Chromium starts and ends between `ps` and `footprint` fails the launch. That is the behaviour round 1's finding asked for, and nobody has seen it happen. `read`.

## Not judged

| What | Location | Who answers |
|---|---|---|
| A program that prints no line break for 256K characters, as a full-screen program that places its cursor may, loses nearly all its kept output at its first line break: the case at `daemon.test.ts:1542-1548` pins that `"cdefghijkl"` becomes `"mn"`. *Scope* item 5's words cover it, and `frame/plan.md` *Technical context*'s failure scenarios name a full-screen program drawn from the middle of its stream, not one drawn from almost nothing. Whether a failure scenario should name it | `apps/desktop/src/daemon/buffer.ts:43-50`, `frame/plan.md:24` | the orchestrator, at the next fold |
| The `tsc` over the six changed files that `trail/phases/phase-2.md:45` reports; this round ran no typecheck (contract rule 2) | `trail/phases/phase-2.md:45` | the orchestrator, at the broad run |
| The desktop suite, the typecheck and the broad gate (contract rule 2) | `seal/config.json` `Broad gate` | the orchestrator, at the broad run |
| A person's start of the measurement, and the throw in `measure` on a real launch. The round makes no start of the app | `apps/desktop/test/memory.ts:396-397`, `gaps.md:7`, `gaps.md:29` | the owner, at the machine, and phase 3's and phase 4's runs |
| The window with the exit line gone, for a terminal drawn with WebGL and for a pane that exited while hidden | `gaps.md:13` | phase 3's drive of scenario 7 |

## Probes

| Command | Result |
|---|---|
| `pnpm install --frozen-lockfile --offline` in the clone | exit 0; `electron-rebuild` rebuilt `node-pty` |
| `node scripts/test-in-electron.mjs test/daemon.test.ts test/memory.test.ts`, the three measurement variables unset, from `apps/desktop` | exit 0, 2 files, 118 passed |
| `env -u OWLERY_MEASURE_MEMORY OWLERY_MEMORY_RUNS=0 node scripts/test-in-electron.mjs test/memory.test.ts` | exit 0, 26 passed |
| `env -u OWLERY_MEASURE_MEMORY OWLERY_MEMORY_SCENARIOS=nonesuch node scripts/test-in-electron.mjs test/memory.test.ts` | exit 0, 26 passed |
| `git checkout d8a82b6 -- apps/desktop/src` in the clone, `node scripts/test-in-electron.mjs test/daemon.test.ts`, then `git checkout 8a65c82 -- apps/desktop/src` | exit 1, 5 failed and 87 passed: the detach case, the exit line case and three `OutputBuffer` cases; the clone's status was clean after |
| `seal mutate src/daemon/buffer.ts`, nine mutants, `--tests` the six `OutputBuffer` cases other than finding 1's | baseline green; eight red; the mutant starting `dropped` at `"\n"` survived |
| `seal mutate src/daemon/buffer.ts`, the same nine mutants, `--tests` finding 1's case alone | baseline green; three red, six survived |
| `seal mutate test/memory.ts`, two mutants of `unread`, `--tests` the file's cases with the measurement off | baseline green; both red |
| `node -e` over the two appends of the case at `daemon.test.ts:1504-1510` | 19 characters in the first piece; `"[0m\r\n"` left of it by the cut before phase 2, at the second append |
| `awk -F'\|' 'NR>=63 && NR<=68 {print NR": "NF-2" cells"}'` over `frame/plan.md` | four cells on each of the six lines |
| `git grep` of `process exited`, `claude` and `new Terminal(` at the target, and of `bytes.has`, `bytes.get`, `output.append` and `1367be7` | as the confirmations above give them |
| `shasum -c` of the crafter's `driven-tree.sha` in the clone's `apps/desktop` | five files OK |
| `pgrep -fl` for the clone's path, and a listing of the temporary folder for `owlery-*`, after the runs | nothing found |
