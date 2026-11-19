# Review round 3: 1795046889-four-terminals-memory

```seal
target: 6d0c3d4 against 0e53e06
```

This round reads the diff from `0e53e06` to `6d0c3d4`. The range holds three things. The first is the fix pass over round 2: `1dbc049` and `b849075`, with the close blocks at `9747e82`. The second is the bound of 4,096 characters on the drop of a line's rest, `b63cf31`. The third is phase 3 as `frame/plan.md` *Phases* row 3 gives it: the daemon's `resize` guard at `38dce05`, the build commit `5814c92`, the phase record and the closing memo at `1bcf1ad`, and the orchestrator's fold at `6d0c3d4`. `0e53e06` itself, the fold that states the bound in `frame/design.md` *Scope* item 5 and adds row 7 of *Judgments of the run*, stands before the range; both of its edits were read in the whole-file reads below. The crafter amended `3a0f31e` into `b63cf31` and `427cc37` into `5814c92`. `git grep -n -e 3a0f31e -e 427cc37 6d0c3d4` printed nothing and exited 1, so no record cites a commit that left the branch.

Carried from rounds 1 and 2, not re-derived: the reading of the measurement's driving code in `apps/desktop/test/memory.ts`, the probe facts of `frame/design.md` *Grounding*, dated to `7e33c8a`, and round 2's reading of `Daemon#handle` for `detach`, `attach` and `close` (`daemon.ts:270-293` at the target, unchanged in this range). Re-derived: every verdict below. `seal/parity.json` is not declared, `seal/config.json` has no `Pact` key, and `Record language` is English. The work item holds no `changelog.md` and no `pr.<lang>.md`; phase 4 is the build's last phase and brings the fragment.

The round started the Owlery app zero times. Every run below was made in a `git clone --no-local` of the worktree at `6d0c3d4`, in the round's scratch directory, with its own `pnpm install --frozen-lockfile --offline`. The test runner, `scripts/test-in-electron.mjs`, runs Electron's binary as Node, which opens no window.

## Findings

### 1. An answer the terminal gives to a pane's output after its screen passed to another pane is typed into that other pane

```seal
severity: must
location: `apps/desktop/src/renderer/work-item-view.ts:121-123`, `apps/desktop/src/renderer/work-item-view.ts:139-148`, `seal/threads/1795046889-four-terminals-memory/frame/design.md:64`
evidence: read `apps/desktop/src/renderer/work-item-view.ts:119-158`, `apps/desktop/src/renderer/work-item-view.ts:376-392`, `node_modules/.pnpm/@xterm+xterm@6.0.0/node_modules/@xterm/xterm/src/common/input/WriteBuffer.ts:103-130`, `node_modules/.pnpm/@xterm+xterm@6.0.0/node_modules/@xterm/xterm/src/common/input/WriteBuffer.ts:210-238`, `node_modules/.pnpm/@xterm+xterm@6.0.0/node_modules/@xterm/xterm/src/common/services/CoreService.ts:61-80`, `node_modules/.pnpm/@xterm+xterm@6.0.0/node_modules/@xterm/xterm/src/common/InputHandler.ts:2653-2662`, and phase 3's scratch `drive-sent.txt`
```

Why it matters: the screen's `onData` handler at `work-item-view.ts:121-123` sends what the terminal hands it to `screen.pane`, read at the moment the handler runs. A person's keys reach it at once. The terminal's answer to a program's question does not. xterm.js 6.0.0 parses a write later: `WriteBuffer#write` schedules the parse with `setTimeout` (`WriteBuffer.ts:123-124`), and a parse that runs past 12 ms stops and schedules the rest with `setTimeout` again (`WriteBuffer.ts:226-238`). The answer, such as the cursor report `ESC [ <row> ; <col> R` (`InputHandler.ts:2659-2662`), fires `onData` from inside that parse (`CoreService.ts:61-80`). `giveBack` and `take` at `work-item-view.ts:139-158` move `screen.pane` at once, in the task of the press. The comment at `work-item-view.ts:155` already reasons that the terminal may still have the leaving pane's output to draw at the hand-over. So where pane A's first replay since load, or a live `output` of A, is still being parsed when a press hands A's screen to pane B, each answer to a question in the rest of A's output is sent as `input` for B, with no mute: `screen.muted` is 0 for a first replay and for output (`work-item-view.ts:382-385`). A replay of 256K characters is parsed across several 12 ms slices, so a press within that span is enough. The drive shows that such answers are real traffic: each pane's first replay was answered with `input <id> "\u001b[2;1R"` (phase 3's scratch, `drive-sent.txt`). In the drive the next press came seconds later, so no answer crossed over. Before this work each pane had its own terminal, and an answer could only go to its own pane. *Scope* item 2 sends a person's keys to "the pane that holds the screen at that moment", and the answers of a pane's first replay to that pane. It sends no pane another pane's answers. Bytes typed into an agent's prompt as if a person had typed them are a defect to fix before merge.

The fix tracks, in the order of the terminal's writes, which pane's output the terminal has reached. It sends nothing until the terminal has drawn what it was handed before the current pane took the screen. A person's keys in that span are dropped as they are while a later replay is drawn. It assumes that `Terminal#write` with an empty string still runs its callback in order: `CoreTerminal.ts:145-147` hands it to `WriteBuffer#write`, which pushes every chunk with its callback (`WriteBuffer.ts:126-129`) and calls the callback once that chunk is parsed (`WriteBuffer.ts:221-222`). The snippet changes `apps/desktop/src/renderer/work-item-view.ts` and the bullet of `frame/design.md:64`. The bullet below also carries finding 2's correction. The fix pass also owes the same span to the two other statements of what a screen does not send: the paragraph of `gaps.md` *Not done* that opens "While the terminal draws a later replay", and the last failure scenario of `frame/plan.md` *Technical context* (`frame/plan.md:33`). The pool's wiring has no case (`gaps.md`, the row on the pool's wiring), so the fix pass names how it showed the crossing gone.

```ts
// apps/desktop/src/renderer/work-item-view.ts, interface Screen: add after `pane`.
  /** The pane whose output the terminal has reached, in the order of its writes. It becomes the pane on the screen only once the terminal has drawn what the pane before it was handed. */
  drawing: number | undefined;

// newScreen(): the screen and its handler.
  const screen: Screen = { term, fit, element, pane: undefined, drawing: undefined, muted: 0 };
  // What a person types and what the terminal answers a program's question with arrive here alike. An answer arrives when the terminal parses the question, which can be after the screen passed to another pane, so nothing is sent until the terminal has reached the output of the pane on the screen.
  term.onData((data) => {
    if (screen.pane !== undefined && screen.drawing === screen.pane && screen.muted === 0) send({ type: "input", id: screen.pane, data });
  });

// take(): after `screen.pane = pane;`.
  // The terminal reaches this pane's output only after what it was handed before.
  screen.term.write("", () => {
    screen.drawing = pane;
  });
```

```markdown
   - What a person types into a screen, and each size the screen takes, goes to the pane that holds the screen at that moment. A free screen sends nothing. What the terminal answers to a question a replay holds is sent only for the first replay the window draws of a pane since it loaded. While the terminal draws a later replay, or still draws output of the pane that held the screen before, the screen sends nothing a person types or the terminal answers. A size it takes still goes to its pane.
```

### 2. The frame says a screen drawing a later replay sends nothing, and the screen still sends each size it takes

```seal
severity: should
location: `seal/threads/1795046889-four-terminals-memory/frame/design.md:64`
evidence: read `seal/threads/1795046889-four-terminals-memory/frame/design.md:64`, `apps/desktop/src/renderer/work-item-view.ts:121-128`, `apps/desktop/src/renderer/work-item-view.ts:387-391`, `apps/desktop/src/renderer/work-item-view.ts:405-408`
```

Why it matters: the bullet ends "While the terminal draws a later replay, the screen sends nothing." The fold at `6d0c3d4` wrote it. The mute in the tree gates `onData` alone (`work-item-view.ts:121-123`). `onResize` at `work-item-view.ts:124-128` sends `resize` whatever `screen.muted` holds. So a fit from the stage's `ResizeObserver` (`work-item-view.ts:405-408`) during a later replay tells the pane its size. That is the right behaviour, and the same bullet opens by sending each size the screen takes to its pane. The last sentence reads against it. Phase 4 builds the tiles and the window's guard on exited panes' sizes from this bullet, and a builder who reads "sends nothing" can mute sizes too. The other statements of the mute say what a person types and no more: the comment at `work-item-view.ts:387`, `gaps.md` *Not done* and `frame/plan.md:33`. They hold. Finding 1's snippet rewrites the same bullet and carries this correction. Where finding 1 is rejected, the bullet is this.

```markdown
   - What a person types into a screen, and each size the screen takes, goes to the pane that holds the screen at that moment. A free screen sends nothing. What the terminal answers to a question a replay holds is sent only for the first replay the window draws of a pane since it loaded. While the terminal draws a later replay, the screen sends nothing a person types or the terminal answers. A size it takes still goes to its pane.
```

### 3. Two `replayStep` cases hold nothing the case of two replays does not hold

```seal
severity: should
location: `apps/desktop/test/view.test.ts:493-500`
evidence: executed `seal mutate src/renderer/view.ts` with five mutants of `replayStep`, once with `--tests` running the case "writes the last of two replays" alone and once running the two cases at `view.test.ts:493-500` alone, from `apps/desktop` in the clone; read `apps/desktop/test/view.test.ts:492-515`, `apps/desktop/src/renderer/view.ts:578-581`
```

Why it matters: "writes the replay the window asked for, and the output after it" at `view.test.ts:493-496` asserts `replayStep(1, "replay")` and `replayStep(0, "output")`. "drops output that arrives before the replay, which holds it" at `view.test.ts:498-500` asserts `replayStep(1, "output")`. The case at `view.test.ts:502-510` makes all three calls with the same arguments and expects the same results, at its second, third and fourth steps. Run as a probe, five mutants of `replayStep` all turned red under that case alone. Under the two cases alone, two turned red, and those two were red under the third case as well. The other three survived: the replay written for any count above zero, the count cleared at any replay, and every replay written. The two cases hold a fact the frame states, scenario 6 and *Scope* item 4, so the exception for a case that holds no frame fact does not apply. The phase record's sentence that "The four `replayStep` cases each failed on its own `toEqual`" is dated to its run and stays. The snippet deletes the two cases and gives the case that stays a name that says what it holds. The `seal mutate` run listed in `trail/phases/phase-3.md` names no case, so no other statement of them stands.

```ts
// apps/desktop/test/view.test.ts: delete lines 493-500, the cases "writes the replay the window asked for, and the output after it" and "drops output that arrives before the replay, which holds it", and rename the case at line 502:
  it("drops output that arrives before the last replay asked for, writes that replay alone, and writes the output after it, where a pane was attached, detached and attached again before either replay arrived", () => {
```

## Confirmations

```seal
confirms: round-2#1
```
What holds: the case "drops the rest of the line a cut falls in where the cut is in the middle of one piece of output" is gone, and `grep -c "middle of one piece" test/daemon.test.ts` printed 0. Round 2's `evidence: executed` line was run again on the buffer as it stands after `b63cf31`. The three mutants the deleted case had turned red were written for the new `dropLineRest`: the call of `dropLineRest` removed, the rest kept with its line break, and the kept rest left out of the pieces. Under the eight `OutputBuffer` cases that remain, all three were red. `executed`.

```seal
confirms: round-2#2
```
What holds: the comment at `daemon.test.ts:1520` is the snippet word for word, and the case's code at `daemon.test.ts:1517-1523` is unchanged. Round 2's `node -e` reading of the two appends is carried: the fixture did not change. `read`.

What matched: the bound of 4,096 characters against *Scope* item 5 and row 7 of *Judgments of the run*. `buffer.ts:49-64` reads at most `LINE_REST_MAX` characters kept and drops `before + found + 1` of them. That sum is at most 4,096, because `found` is an index into a slice of `LINE_REST_MAX - before` characters. That matches "loses at most 4,096 characters to the cut". `append` at `buffer.ts:21-42` is unchanged. The two new cases were worked through by hand: in "drops through a line break that is the 4,096th character it keeps", the line break of the first buffer is at index 4,095 of the kept output and that of the second at index 4,096, so the first is found and the second is not. In "keeps what the count of characters left", the first piece kept is 5,998 characters, so the loop ends before the piece with the line break. `frame/design.md:127` in *Data & interfaces* says the same. The comment at `buffer.ts:9-13` says it too. `read`, and `executed` in the narrow run below.

What matched: the daemon's `resize` guard. `daemon.ts:327-332` sets a size only where `session.info.alive` holds, and `alive` turns false at the process's exit (`daemon.ts:420`). With `src/daemon/daemon.ts` of `b63cf31` checked out beside the target's cases, the case "takes a size sent for a session whose process exited, changes nothing, and goes on answering" failed on a timeout with `Error: ioctl(2) failed, EBADF` under it, as `trail/phases/phase-3.md:46` says. The file was put back to `6d0c3d4` after. Claimed in the phase record: a write to such a pseudo-terminal throws nothing. The crafter's `drive-sent.txt` holds `input 7` sent to the exited pane after the reload, followed by `close 7`, which the daemon answered with an `inbox` of three tabs (`drive.txt`). So the claim holds for one write. `executed` and `read`.

What matched: the pool against *Scope* item 2 and *Data & interfaces*. `screenMoves` at `view.ts:556-568` places a new screen at `after.length`, and `stageShows` at `work-item-view.ts:161-168` makes it with `newScreen`, which pushes at `pool.length`. The two are equal, because `holds` is read from the pool in the same call. `giveBack` sends `detach` and writes `ESC c`. xterm parses it in order and runs `fullReset` (`InputHandler.ts:351`, `InputHandler.ts:3324-3327`), which calls `reset` (`CoreBrowserTerminal.ts:166`). `reset` keeps the size (`CoreBrowserTerminal.ts:1268-1287`). `WriteBuffer` has no reset, so a write queued after the reset is kept. `take` fits the screen while it is free, so `onResize` sends nothing, and then sends the size once and `attach`. The mute's callback runs right after its chunk is parsed (`WriteBuffer.ts:221-222`), so the next pane's first replay on the same screen is parsed unmuted. Each way *Scope* item 2 says a pane leaves the stage was walked through in `renderer.ts`: another tab (`tabElement`, `showView`), another work item's view (`openView`), the summary, the inbox and the history (`openSummary`, `openList`, both through `leaveView`), a closed pane (`takeLists`, `dropClosed`, then `showView`), and a view whose work item is no longer listed (`showView`, `leave`, `openList`). "Side by side" is phase 4's. `detachUnshown` at `work-item-view.ts:336-338` runs after `takeStarted` at `renderer.ts:213-217`, so a pane that `takeStarted` put on the stage holds a screen and is not detached. `paneTabs` at `view.ts:525-527` lists every session of the work item. `read`.

What matched: the phase record's numbers and drive against the scratch it names. The `eight-in-turn` rows of `measure.txt` are 480.7, 481.3 and 471.2 MB, with one terminal and three canvases, and the by-kind row is the one in `trail/phases/phase-3.md:16`. `shasum -c` of `measured-tree.sha` and of `driven-tree.sha`, run in the clone's `apps/desktop`, read every file as OK. `apps/desktop` holds the same bytes at `5814c92` as at `6d0c3d4`. `drive.txt` lists thirteen `attach` and thirteen `detach` up to the inbox, as the record says. `boundary.txt` holds 3 files, 282 passed and 1 skipped. The record's sentence "Panes 1 to 7 were each sent the cursor's place once" reads the panes' own files. The window's frames also hold a second `input 7` after the reload, which went to pane 7 after its process had exited, so its file could not record it. That is the first replay since a load, as *Scope* item 2 states, and no defect. `executed` and `read`.

What matched: scenarios 12, 13 and 14 at the target. `git grep -n -e 'new Terminal(' -- apps/desktop/src` printed `apps/desktop/src/renderer/work-item-view.ts:98` alone, the file that holds the pool. `git grep -n -e 'process exited' -- apps/desktop/src/renderer` and `git grep -n -i -e claude -- apps/desktop/src/renderer` printed nothing and exited 1. `executed`.

What matched: the narrow set at the target. `node scripts/test-in-electron.mjs test/view.test.ts test/daemon.test.ts`, with `OWLERY_MEASURE_MEMORY` unset, exited 0 with 2 files and 250 passed. `executed`.

What matched: the records against the target. `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `pr.md` and `trail/phases/phase-3.md` were read whole at `6d0c3d4`, and `trail/phases/phase-1.md`, `trail/phases/phase-2.md` and the two earlier rounds for their coordinates. The fold's sentences on the `resize` guard, `detachUnshown` and the window's guard for phase 4 (`frame/design.md:127`, `frame/design.md:134-135`) match the tree. The *Operational impact* paragraph on a daemon before `38dce05` and rows 8 and 9 of *Judgments of the run* match it too. The one sentence the tree contradicts is finding 2's. The diff of `gaps.md` takes no row out: two rows are closed in place with the word `closed`, the WebGL part of the first moves to a new row, four rows are reworded in place, and the *Not done* paragraph on the search's cost is reworded in place. `pr.md` is unchanged in the range. Each of its five quotes stands word for word at the start of the Judgment cell that its line names, rows 3, 6, 5, 2 and 1. `gaps.md` labels the suite, the typecheck and the broad gate not verified, with the orchestrator as answerer, which is honest. `read`.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The Korean input case at `5814c92`, which types into the pool's first screen. The round makes no start of the app; the crafter's `boundary.txt` is read above | `apps/desktop/test/korean-input.test.ts` | the orchestrator, at the broad run |
| The `tsc` over the window's and the daemon's changed files that `trail/phases/phase-3.md:63` reports; this round ran no typecheck (contract rule 2) | `trail/phases/phase-3.md:63` | the orchestrator, at the broad run |
| The desktop suite, the typecheck and the broad gate (contract rule 2) | `seal/config.json` `Broad gate` | the orchestrator, at the broad run |
| What a screen drawn with WebGL shows after a hand-over, and what an agent's CLI does on a pooled screen | `gaps.md`, the rows on WebGL and on an agent's CLI | phase 4's drive, and the owner with a real session |
| Whether a `resize` sent between a process's exit and the daemon's `onExit` reaches a closed pseudo-terminal, as the *Not done* paragraph on an exited pane's size says it could. This round did not read when node-pty 1.1.0 closes the descriptor | `gaps.md`, *Not done*, the paragraph that opens "The window does not hold back the size" | phase 4's builder, who builds the window's guard |

## Probes

| Command | Result |
|---|---|
| `pnpm install --frozen-lockfile --offline` in the clone | exit 0 |
| `node scripts/test-in-electron.mjs test/view.test.ts test/daemon.test.ts`, `OWLERY_MEASURE_MEMORY` unset, from `apps/desktop` | exit 0, 2 files, 250 passed |
| `node scripts/test-in-electron.mjs test/daemon.test.ts -t OutputBuffer` | exit 0, 8 passed, 86 skipped |
| `seal mutate src/daemon/buffer.ts`, three mutants (the call of `dropLineRest` removed, the rest kept with its line break, the kept rest left out of the pieces), `--tests` the `OutputBuffer` cases | baseline green; three red |
| `git checkout b63cf31 -- apps/desktop/src/daemon/daemon.ts`, the resize case alone, then `git checkout 6d0c3d4 -- apps/desktop/src/daemon/daemon.ts` | exit 1, the case timed out with `ioctl(2) failed, EBADF` under it; the clone's status was clean after |
| `seal mutate src/renderer/view.ts`, five mutants of `replayStep`, `--tests` the case "writes the last of two replays" alone | baseline green; five red |
| `seal mutate src/renderer/view.ts`, the same five mutants, `--tests` the two cases at `view.test.ts:493-500` alone | baseline green; two red, three survived |
| `shasum -c` of phase 3's `measured-tree.sha` and `driven-tree.sha` in the clone's `apps/desktop` | every file OK |
| `git grep` of `new Terminal(`, `process exited`, `claude` at the target, and of `3a0f31e` and `427cc37` | as the confirmations give them |
