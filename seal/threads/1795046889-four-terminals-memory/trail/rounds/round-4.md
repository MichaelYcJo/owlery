# Review round 4: 1795046889-four-terminals-memory

```seal
target: 626d036 against 742407c
```

This round reads the diff from `742407c`, round 3's record, to `626d036`. The range holds three things. The first is the fix pass over round 3: `72e15fc` and `58118b0` for finding 1, `e0582fc` for finding 3, and the close blocks at `88a7474`; finding 2 was closed by the orchestrator at `e1d3705` after its fold at `75f1f87`. The second is phase 4 as `frame/plan.md` *Phases* row 4 gives it: the code and its cases at `f37bb25`, where the measurement ran, and the records at `f04c979`, with `apps/desktop/measurements/memory.md`, `changelog.md` and `trail/phases/phase-4.md`. The third is the orchestrator's fold at `75f1f87` and `pr.md` at `626d036`. `git diff --stat f37bb25..626d036 -- apps` lists `apps/desktop/measurements/memory.md` and one docstring of `apps/desktop/src/renderer/view.ts`, so the code under review is the code that was measured.

Carried from rounds 1 to 3, not re-derived: the reading of the measurement's driving code that phase 4 did not change (`openWorkItem`, `addPane`, `untilInFront`, `untilPrinters`, `PAGE_READ`, `footprintsOf`, and `measure` outside the lines of the layout read), round 2's reading of `Daemon#handle` for `detach`, `attach` and `close`, round 3's reading of the reset at a hand-over (`InputHandler.ts`, `CoreBrowserTerminal.ts`), and the probe facts of `frame/design.md` *Grounding*, dated to `7e33c8a`. Re-derived: every verdict below. `seal/parity.json` is not declared, `seal/config.json` has no `Pact` key, `Record language` is English, and `Commit and pull request language` is English, so the work item holds no `pr.<lang>.md`.

The round started the Owlery app zero times. Every run below was made in a `git clone --no-local` of the worktree at `626d036`, in the round's scratch directory, with its own `pnpm install --frozen-lockfile --offline`. The test runner, `scripts/test-in-electron.mjs`, runs Electron's binary as Node, which opens no window, and `memory.test.ts` without `OWLERY_MEASURE_MEMORY` starts no app.

## Findings

### 1. When the pane in front closes, the window brings in front the pane that was in front before it, an exited one included, and the phase record says the old rule holds

```seal
severity: should
location: `apps/desktop/src/renderer/work-item-view.ts:212`, `seal/threads/1795046889-four-terminals-memory/trail/phases/phase-4.md:23`
evidence: read `apps/desktop/src/renderer/work-item-view.ts:83-86`, `apps/desktop/src/renderer/work-item-view.ts:204-215`, `apps/desktop/src/renderer/work-item-view.ts:325-336`, `apps/desktop/src/renderer/view.ts:529-538`, `apps/desktop/src/renderer/view.ts:555-565`, `apps/desktop/src/renderer/renderer.ts:145-158`, and `git show 742407c:apps/desktop/src/renderer/work-item-view.ts`, lines 35, 176-184 and 292
```

Why it matters: the phase record claims at `phase-4.md:23` that "`stageOf` asks `paneInFront` with the most recent pane, so where the pane with the keyboard closes, the most recent live pane comes in front, as before the work". The tree does something else. `takeLists` calls `dropClosed` before `showView` (`renderer.ts:155-158`). `dropClosed` now takes every pane the daemon no longer lists out of `recent` (`work-item-view.ts:212`). So when `showView` runs, `recent[0]` is the pane that was in front before the closed one, and `paneInFront` returns it because it is still a tab (`view.ts:535-536`), alive or exited. The fallback to the most recent live pane (`view.ts:537-538`) is reached from the window only where `recent` is empty, after a load, and never after a close. Before the work, `dropClosed` left `lastInFront` alone (`742407c`, lines 176-184), so `lastInFront` still named the closed pane, and `paneInFront` fell back to the most recent live pane (`742407c`, line 292). An example: tabs 1 and 3 run and tab 2 has exited. A person reads pane 2's last screen, then goes to pane 3 and closes it. Before the work pane 1 came in front. Now pane 2 comes in front, an exited pane, while a live one is there. `frame/design.md` *Scope* item 1 keeps the stage "as today" where "Side by side" is not pressed, and no line of the frame or of `changelog.md` names a new rule for which pane follows a close. The stageOf case "counts a pane no longer among the tabs as never in front" (`view.test.ts:498-500`) pins the fallback in `stageOf` for a closed pane at the head of `recent`, which the window no longer hands it.

The snippet restores the rule the phase record states. `stageOf` already drops every pane of `recent` that is not a tab (`view.ts:562`), so a closed pane left in `recent` is never shown. With the line gone, `phase-4.md:23` holds and no other statement changes. The statements of the rule were listed from `git grep -n -e recent -e 'most recent live' -- apps/desktop/src/renderer seal/threads/1795046889-four-terminals-memory`. Among the lines it printed they are the comment on `recent` at `work-item-view.ts:32`, the docstrings of `paneInFront` and `stageOf` (`view.ts:530-533`, `view.ts:545-553`), and `phase-4.md:23`; `phase-3.md:59` is dated to phase 3's drive. Each holds once the line is gone. Where the fix pass judges the new behaviour the better one instead, it owes the rewrite of `phase-4.md:23` and a bullet of `changelog.md`, because a person then sees a different pane come in front after a close. The window's wiring has no case (`gaps.md`, the row on the pool's wiring), so the fix pass names how it showed the change.

```ts
// apps/desktop/src/renderer/work-item-view.ts, dropClosed(): delete line 212,
//   for (const [workItemId, panes] of recent) recent.set(workItemId, panes.filter((pane) => listed.has(pane)));
// and leave in its place:
  // A closed pane stays in `recent`: `stageOf` shows no pane that is not a tab, and where the closed pane was the one in front, `paneInFront` then brings the most recent live pane in front, as the window did before this work.
```

### 2. The changelog says the window holds a terminal only for a pane on screen, and the window keeps up to four terminals after their panes leave

```seal
severity: should
location: `seal/threads/1795046889-four-terminals-memory/changelog.md:9`
evidence: read `seal/threads/1795046889-four-terminals-memory/changelog.md:9`, `apps/desktop/src/renderer/work-item-view.ts:24`, `apps/desktop/src/renderer/work-item-view.ts:165-171`, `apps/desktop/src/renderer/work-item-view.ts:350-357`, `apps/desktop/measurements/memory.md:73`, `apps/desktop/measurements/memory.md:100`, `seal/threads/1795046889-four-terminals-memory/frame/design.md:65`
```

Why it matters: the bullet opens "**The window holds a terminal only for a pane on screen.**" and goes on "A pane that leaves the screen hands its terminal to the next pane". The tree keeps each screen it made, hidden, for the window's life (`work-item-view.ts:24`). `giveBack` hides the screen and leaves it in the pool (`work-item-view.ts:165-171`), and `leaveView` gives every screen back without disposing of one (`work-item-view.ts:350-357`). *Scope* item 2 says so (`frame/design.md:65`). The measurement shows it: `inbox-after-four` holds 4 terminals, none displayed (`memory.md:73`), and reads 257.8 MB against 156.4 MB on the inbox before any view (`memory.md:100`). A person who reads the release notes takes it that leaving a view gives its terminals' memory back, and the published table says it does not. The rest of the bullet holds. `changelog.md` holds no other statement of the pool; `measurements/memory.md:99-100` and `frame/plan.md:30` say the same as the tree.

```markdown
- **A pane that is not on screen holds no terminal in the window.** A pane that leaves the screen gives its terminal back, the next pane that comes on screen takes it, and the daemon keeps the pane's output. When the pane comes back, the window draws that output again. Eight panes each shown once read 480.3 MB, where they read 764.5 MB before. The window keeps the terminals it made, up to four, for the panes that come next, so with the inbox in front after four tiles it still holds them and reads 257.8 MB, against 156.4 MB before any view was opened.
```

### 3. The `stageOf` case of a view with more tabs holds nothing the case of a pressed tab beside it does not hold

```seal
severity: should
location: `apps/desktop/test/view.test.ts:483-490`
evidence: executed `seal mutate src/renderer/view.ts` with fourteen mutants of `stageOf`, once for each of its six cases run alone with `--tests "node scripts/test-in-electron.mjs test/view.test.ts -t <the case's name>"`, from `apps/desktop` in the clone (the probe files `test_tmp_stageof_mutants.sh` and `test_tmp_stageof_mutants_2.sh` in the round's scratch); read `apps/desktop/test/view.test.ts:467-501`, `apps/desktop/src/renderer/view.ts:555-565`
```

Why it matters: "puts the four panes most recently in front on the stage of a view with more tabs, in the tabs' order" (`view.test.ts:483-485`) asserts one call on six tabs with all six in `recent`. "puts a pressed tab that was not shown in place of the shown pane least recently in front" (`view.test.ts:487-490`) makes the same kind of call on the same six tabs. Its `recent` holds five panes, so one tab was never in front. Fourteen mutants of `stageOf` were run under each of the six cases alone. The case of more tabs turned five red: a cap of three, no cap, the panes shown in their rank and not the tabs' order, the pane in front taken from the least recent pane, and the dedup removed. The case of a pressed tab turned all five red, and a sixth as well: the tabs never in front ranked before the panes that were. No mutant was red under the case of more tabs alone. The other four cases each turned at least one mutant red that no other case did: the control not read, the tabs never in front in rising order, a stage of three where a view has four tabs, and the panes of `recent` that are no longer tabs kept in the ranking. The case holds a fact the frame states, *Scope* item 1 and scenario 2, so the exception for a case that holds no frame fact does not apply. The case that stays carries a name that says both facts. The phase record's sentence that "the six `stageOf` cases each failed on its own `toEqual`" is dated to its run and stays. Nothing else names the case: `git grep -n "most recently in front on the stage" -- apps seal` printed the case's own line alone.

```ts
// apps/desktop/test/view.test.ts: delete lines 483-485, the case "puts the four panes most recently in front on the stage of a view with more tabs, in the tabs' order", and rename the case at line 487:
  it("puts the four panes most recently in front on the stage of a view with more tabs, in the tabs' order, so a pressed tab that was not shown takes the place of the shown pane least recently in front", () => {
```

### 4. The phase record says the vendor search counts lines in three files of the daemon, and it counts lines in seven

```seal
severity: should
location: `seal/threads/1795046889-four-terminals-memory/trail/phases/phase-4.md:62`
evidence: executed `git grep -c -i -e claude -- apps/desktop/src/daemon` and `git grep -c -i -e claude f37bb25 -- apps/desktop/src/daemon` in the worktree; read `seal/threads/1795046889-four-terminals-memory/trail/phases/phase-4.md:62`
```

Why it matters: the record says of `git grep -n -i -e claude -- apps/desktop/src/renderer` that "The last search counts lines in three files of `apps/desktop/src/daemon`, so it can find the word." Aimed at `apps/desktop/src/daemon`, the same search counts lines in seven files at `f37bb25` and at `626d036`: `adapters/claude.ts`, `adapters/fake.ts`, `agent-events.ts`, `hooks.ts`, `main.ts`, `pane-kinds.ts` and `pty.ts`. The sentence is the record's evidence that scenario 14's empty search can fail, and the sealer reads it as a count it can check. Its conclusion holds and its count does not. Phase 3's record words the same check without a count (`phase-3.md:65`), and no other sentence of the work item states the count.

```markdown
**Scenarios 12 to 14.** `executed` at the same tree. `git grep -n -e 'new Terminal(' -- apps/desktop/src` printed `apps/desktop/src/renderer/work-item-view.ts:106` alone. `git grep -n -e 'process exited' -- apps/desktop/src/renderer` and `git grep -n -i -e claude -- apps/desktop/src/renderer` each printed nothing and exited 1. Aimed at `apps/desktop/src/daemon`, the last search counts lines in seven files, so it can find the word.
```

## Confirmations

```seal
confirms: round-3#1
```
What holds: no pane is sent what the terminal hands the window until the terminal has drawn everything it was handed before that pane's turn on the screen. `view.ts#screenTurns` counts the screen's turns (`view.ts:644-681`). `take` hands the terminal an empty piece whose callback marks that turn as reached, and `receiver` names the pane only where the turn reached is the turn of the pane on the screen and nothing muted is being drawn (`view.ts:679`). `work-item-view.ts:130-133` sends `input` only to `receiver()`. That the callback of an empty piece runs in its place among the others: `WriteBuffer#write` pushes every piece with its callback, whatever its length, and `_innerWrite` runs each callback once its piece is parsed, in order (`@xterm/xterm` 6.0.0, `src/common/input/WriteBuffer.ts:103-130` and the loop after line 160). The path that parses at once after a person's input does so only where nothing waits to be parsed, so the order holds there as well. With `receiver` turned back to the tree's logic before the fix, `muted === 0 ? pane : undefined`, three of the six `screenTurns` cases failed: the crossing on `expected [ [ 5, 'answer to where?' ] ] to deeply equal []`, the keys on `expected [ [ 5, 'a' ], [ 5, 'b' ], [ 5, 'c' ] ]`, and the earlier turn. With round 3's snippet in place, which compares the pane reached with the pane on the screen, only the earlier turn's case failed, on `expected [ [ 4, 'answer to where?' ] ] to deeply equal []`. That is the case the fix pass gave for rewriting the snippet, and it holds. The file was put back to `626d036` after both runs. The statements the finding named are rewritten: `frame/design.md:64`, `frame/plan.md:33`, and the paragraph of `gaps.md` *Not done* that opens "While the terminal draws a later replay". Phase 4's drive frames in its scratch `drive-sent.txt` show five `input 2` frames, then `detach 2`, `resize 3 98x54` and `attach 3`, and then `input 3 "y"`, the key, which `drive.txt` B9 reads as no answer crossing. `executed` and `read`.

```seal
confirms: round-3#2
```
What holds: the fourth bullet of `frame/design.md` *Scope* item 2 (`design.md:64`) now ends "the screen sends nothing a person types or the terminal answers. A size it takes still goes to its pane where that pane's process runs." The tree matches it. `onResize` at `work-item-view.ts:134-138` sends `resize` whatever the screen's turns hold, where `tellsSize` lets it. `read`.

```seal
confirms: round-3#3
```
What holds: the two `replayStep` cases are gone, and the case that stays carries the snippet's name (`view.test.ts:543`). Round 3's three survivors were written again from its record: a replay written for any count above zero, the count cleared at any replay, and every replay written. `seal mutate src/renderer/view.ts` ran them under the case that stays, alone, and all three were red. `executed`.

What matched: `stageOf` against *Scope* item 1 and scenario 2. Not pressed, it returns the pane in front alone (`view.ts:556-558`). Pressed, it ranks the pane in front, then `recent` among the tabs, then the tabs never in front with the newest first, takes four, and returns them in the tabs' order (`view.ts:559-564`). `broughtToFront` puts a pressed tab, a pane this window starts and a pane pressed inside a tile at the head of `recent` (`work-item-view.ts:84-86`, `:139-143`, `:280-284`, `:364`). Moving a pane that is already among the four to the head of `recent` leaves the set of four unchanged, so a press inside a tile changes no tile. `sideBySide` is a module variable, false at each load and read by every view (`work-item-view.ts:35`). The tiles' rules in `index.html` place two panes in two columns and three or four in two columns and two rows, and the third of three spans both columns. The right column keeps its width, which is the owner's Q4 (a). The phase record's choice for the tabs never in front, `phase-4.md:24`, is a decision of the build where *Scope* item 1 names no order. `read`, and `executed` in the narrow run below.

What matched: the notification over every pane on the stage. `takeLists` passes `onStage(session.id) && document.hasFocus()` as `inFront` (`renderer.ts:150-153`). `onStage` asks the pool, which holds only the panes on the stage of the view on screen, because `leaveView` gives every screen back (`work-item-view.ts:200-202`, `:350-357`). `notificationFor` is unchanged but for its docstring. The drive's B6 and B7 in `drive.txt` read no notification with the waiting pane on the stage and one with the inbox in front. `read`.

What matched: the size held back for an exited pane. `tellsSize` answers true only where the daemon lists the pane with `alive` (`view.ts:568-570`). `take` and `onResize` both ask it (`work-item-view.ts:136`, `:159`). In the drive's frames after pane 1's exit, `attach 1` stands with no `resize 1`, and every other pane taken has its `resize` (`drive.txt` B8). `read`.

What matched: the measurement and its file against the crafter's scratch. `apps/desktop/measurements/memory.md:61-93` holds every row of phase 4's `measure-fours.txt` and `measure-rest.txt` as printed, and both outputs open "at commit f37bb25" with no word of changes. The highest samples of `four` are 499.0, 500.9 and 503.4 MB, and two runs hold a sample over 500 MB, as the file's first lines say. `four-after-eight` at 519.4 MB is 3.2% over 503.4, inside scenario 11's 5%. The numbers in *What the tables show* follow from the tables: 45 to 49 MB over `one`, 9 to 16 MB over `four`, and about 18 MB more in the daemon. The file leaves out the third table the tool prints, the sizes of each run. In both outputs every kept run of a scenario has the same sizes, and the file's *What was measured* states each of them: the window, the stage at 764 by 788.8, one terminal at 728 by 766.8 and 102 by 54, a tile at 358 by 380.4 and 49 by 27 with WebGL or 47 by 27 with the DOM renderer, and two device pixels to a pixel. `shasum -c` of phase 4's `measured-tree.sha`, run in the clone's `apps/desktop` with `src` and `test` checked out at `f37bb25`, read every file as OK. `node build.mjs` at `f37bb25` and again at `626d036` each built a `dist/` that `shasum -c` of phase 4's `dist-at-f37bb25.sha` read as OK, so the docstring changed after the measurement changes no built byte. Q3 (a): the diff changes no renderer, no window size and no cap of what a person sees for the number (`git diff --stat 742407c..626d036` lists no file under `apps/desktop/src/main`, and `newScreen` still loads `WebglAddon`). `executed` and `read`.

What matched: the new cases of the measurement against their group. The case of the third table, the case of a run with no terminal, and the case of the line over the tables each hold a branch no other case reaches: the sizes row, its two "none" cells, and the words on changes not committed. Phase 4's `mutate-memory.txt` reads nine mutants red. `read`.

What matched: the six `screenTurns` cases against each other. Each reaches a state the others do not: a free screen, the answer to the leaving pane's question, a key typed between the reset and the empty piece, a pane that takes the screen again, a muted piece, and the order of the writes. The two runs under finding round-3#1 above separate three of them by what fails. `read` and `executed`.

What matched: scenarios 12, 13 and 14 at the target. `git grep -n -e 'new Terminal(' -- apps/desktop/src` printed `apps/desktop/src/renderer/work-item-view.ts:106` alone. `git grep -n -e 'process exited' -- apps/desktop/src/renderer` and `git grep -n -i -e claude -- apps/desktop/src/renderer` each printed nothing and exited 1. `executed`.

What matched: the records against the target. `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `pr.md` and `trail/phases/phase-4.md` were read whole at `626d036`, and `trail/phases/phase-1.md` to `phase-3.md` and the three earlier rounds for their coordinates. Besides findings 1, 2 and 4, no sentence among them is contradicted by the tree. The fold's sentences on `onStage`, `screenTurns` and the third table (`design.md:80`, `:131-132`) match the tree. So do Q2's answer and the *Technical context* line on 503.4 MB (`plan.md:32`). The diff of `gaps.md` takes no row of `## Not verified` out: two rows are closed in place with the word `closed`, the WebGL row is split into a closed row and a new open one, three rows are reworded in place, and two rows are added. The paragraph of *Not done* on `paneOnScreen` left, and it describes a name that left the tree. Each of the five quotes of `pr.md` stands word for word at the start of the Judgment cell of the row it names (rows 3, 6, 5, 2 and 1 of *Judgments of the run*). Its first line matches issue #9's first *Done when* line, which `gh issue view 9 --json title,body,state` printed with the issue still open. `gaps.md` labels the suite, the typecheck and the broad gate not verified, with the orchestrator as answerer, which is honest. `read` and `executed`.

What matched: the narrow set at the target. `node scripts/test-in-electron.mjs test/view.test.ts test/memory.test.ts test/themes.test.ts`, with `OWLERY_MEASURE_MEMORY` unset, exited 0 with 3 files and 205 passed. `executed`.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The Korean input case, which types into a pooled screen whose `onData` now asks `screenTurns`. The round makes no start of the app; phase 4's `boundary.txt` reads 4 files, 237 passed and 1 skipped | `apps/desktop/test/korean-input.test.ts` | the orchestrator, at the broad run |
| The desktop suite, the typecheck and the broad gate, and the `tsc` phase 4 reports over its six files (contract rule 2) | `seal/config.json` `Broad gate`; `trail/phases/phase-4.md:58` | the orchestrator, at the broad run |
| How two tiles and three look on screen, and how the tiles, their rule and the tabs look in the Letter theme. The round read the rules of `index.html` and put nothing on screen | `apps/desktop/src/renderer/index.html`, the rules of `#stage[data-tiles]`; `gaps.md`, the rows on the pool's wiring and on the Letter theme | the owner at the window |
| Whether the published number holds for a start a person makes (`frame/questions.md` Q5) | `gaps.md`, the first row | the owner, at the machine |

## Probes

| Command | Result |
|---|---|
| `pnpm install --frozen-lockfile --offline` in the clone | exit 0 |
| `node scripts/test-in-electron.mjs test/view.test.ts test/memory.test.ts test/themes.test.ts`, `OWLERY_MEASURE_MEMORY` unset, from `apps/desktop` | exit 0, 3 files, 205 passed |
| `shasum -c` of phase 4's `measured-tree.sha` with `src` and `test` at `f37bb25` | every file OK |
| `node build.mjs` at `f37bb25` and at `626d036`, each followed by `shasum -c` of phase 4's `dist-at-f37bb25.sha` | exit 0 twice; every file OK twice; the clone's status clean after |
| `receiver` of `screenTurns` turned to `muted === 0 ? pane : undefined`, then `-t screenTurns` | exit 1, 3 failed and 3 passed |
| `receiver` of `screenTurns` turned to round 3's snippet, the pane reached against the pane on the screen, then `-t screenTurns`, then `git checkout 626d036 -- src/renderer/view.ts` | exit 1, 1 failed (the earlier turn) and 5 passed; the clone's status clean after |
| `seal mutate src/renderer/view.ts`, round 3's three surviving `replayStep` mutants, `--tests` the `replayStep` case that stays | baseline green; three red |
| `sh test_tmp_stageof_mutants.sh`: eleven mutants of `stageOf` under each of its six cases alone | the case of more tabs turned 5 red, all of them red under the case of a pressed tab, which turned 6; the other four cases 2, 4, 5 and 8 |
| `sh test_tmp_stageof_mutants_2.sh`: three more mutants (tabs never in front dropped, an empty view that lists tabs, a stage one short of a small view) under each case alone | the case of more tabs and the case of a pressed tab turned none red; the stage one short was red under the case of a view of up to four tabs alone |
| `git grep -c -i -e claude -- apps/desktop/src/daemon`, at the worktree and at `f37bb25` | seven files at each |
| `git grep` of `new Terminal(`, `process exited`, `claude`, `paneOnScreen` and `lastInFront` at the target | as the findings and the confirmations give them |
