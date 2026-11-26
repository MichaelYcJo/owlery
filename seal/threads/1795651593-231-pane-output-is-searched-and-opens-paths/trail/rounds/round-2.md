# Review round 2: 1795651593-231-pane-output-is-searched-and-opens-paths

```seal
target: 2db2bb29, fixes b960acf6..2db2bb29
```

This is the verifying round after round 1's fix pass. The code reviewed is the fix diff `b960acf6..2db2bb29`: `c3486212`, `f99803f1`, `f911a919`, `1ef33033` and `2db2bb29`. The base is still `release/v0.0.5` at `9f9ba1da`, the branch's cut.

The round read whole, at `2db2bb29`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `pr.md`, `trail/phases/phase-1.md` to `phase-3.md` and `trail/rounds/round-1.md`. `seal/config.json` gives English for the records and the pull request, so no `pr.<lang>.md` is owed, and none stands. No `seal/parity.json` stands.

What this round carried from round 1 rather than re-established: `git diff --stat b960acf6..2db2bb29` over `frame/`, `pr.md`, `changelog.md`, `routing.md` and `docs` printed nothing (executed). So round 1's confirmations of the six *Rule changes* `from:` texts, of the 13 quotes of `pr.md`, of the screenshots and of the other work items' frames stand on files no fix touched, and this round did not repeat them. The add-on's source was opened again, not carried. The fix pass's narrow set (the typecheck, `view.test.ts` with `themes.test.ts`, `terminal-basics.test.ts`) is its claim, `read` here: this round ran only the filtered cases named under *Probes*.

## Findings

### 1. After a step onto a match the add-on counted, the find bar still counts from the list it made before the pane's last lines, so it reads "2 of 2" where three match and leaves the new match unmarked

```seal
severity: should
location: `apps/desktop/src/renderer/work-item-view.ts:640-645`, `apps/desktop/test/terminal-basics.test.ts:1604-1620`, `seal/threads/1795651593-231-pane-output-is-searched-and-opens-paths/trail/phases/phase-2.md:16`
evidence: executed `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs --project app test/test_tmp_round2.test.ts -t "tmp:|while the pane keeps printing|scenarios D1"` in `apps/desktop`, and `git grep -n -F -e "printed since" -e "counts again" -e "count again" -- seal/threads/1795651593-231-pane-output-is-searched-and-opens-paths apps/desktop/src apps/desktop/test docs`; read the installed `@xterm/addon-search` 0.16.0 at `src/SearchAddon.ts:65-73`, `:96-112`, `:144-146`, `:171-187`, `src/SearchResultTracker.ts:82-110`, `src/SearchEngine.ts:167-203`
reopens: round-1#1
```

Why the close does not hold: round 1's finding named its class "a count the add-on gave from a list made before the last print", and said its fix reaches the class through `find`. The fix searches again only where the step's `resultIndex` is -1 (`work-item-view.ts:642`). That holds for the instance the finding's heading names. Its case went red at `terminal-basics.test.ts:1620` with the search again set aside and passed at the target (executed, *Probes*). The class has a second instance, which the condition leaves out.

Why it matters: the count is what the bar tells the person about the search. *Scope* item 8 of `frame/design.md` (line 73) makes it the match in front among all the matches, "3 of 17", and item 11 (line 76) outlines every match. An agent's pane redraws its working line more often than every 200 ms, so while the agent works, every "Next match" over a match it printed since the search reads a wrong count.

The grounds:

- A step with the same term and the same choices does not count again (`SearchAddon.ts:96-112`, `:171-187`, through `shouldUpdateHighlighting`). The add-on counts again on its own only 200 ms after the pane last printed (`:65-73`).
- A step that lands on a match the old list holds finds that match's index there and fires it with the old count (`SearchResultTracker.ts:82-90`, `:101-109`). `findCount` then reads the ordinal and the total from that old list. The matches printed since are in neither. They carry no mark either, since the marks are drawn from the same list (`SearchAddon.ts:144-146`).
- The probe ran it on the new A2 case's pane. The pane printed "owlprinted three" after the search, then a line every 50 ms. The probe pressed Enter, which is "Next match", the next older match. 600 ms later the count read "2 of 2". Three lines match, and the match in front is the oldest, so "3 of 3" is due. Once the printing stopped, the add-on counted again on its own and the count read "3 of 3".
- The same condition leaves out a step from "No match": its `resultCount > 0` bound keeps a step onto a match printed since at "No match", though the terminal selects that match (read, not run).

The fix: count again after every step under the limit, not only where the step's index is -1. The two calls are the ones `f99803f1` added, and they keep the match in front for the reason round 1 gave (`SearchEngine.ts:187-192`: with the term dropped, the search widens from the selection first). Each step then scans the terminal's lines once more, as each typed character already does. Past the limit the count reads "More than 1,000 matches" whatever was printed, so a step there is not counted again.

```ts
// apps/desktop/src/renderer/work-item-view.ts, in `find`, in place of lines 640-645:
  // The add-on counts its matches again only where the term or a choice changed, or 200 ms after the pane last printed. So a step is counted from the list it made before the pane's last lines: the match in front may be outside that list, and the matches printed since are left out of the count and carry no mark. After each step under the limit the match in front, the one the terminal holds selected, is searched for again with the term dropped, which finds that same match and counts and marks every match afresh in the same task, so the page never draws a stale count.
  if (step !== "fresh" && (screen.results?.resultCount ?? 0) <= FIND_LIMIT) {
    search.clearDecorations();
    search.findPrevious(query.term, findOptions(query));
  }
```

```ts
// apps/desktop/test/terminal-basics.test.ts, the case at :1604, renamed:
  it.runIf(process.platform === "darwin")("counts the matches the pane printed after the search at each step, while the pane keeps printing (scenario A2)", async () => {

// and inside its `try`, after the line at :1620:
      // A step onto a match counted before a fourth was printed counts the fourth too.
      writeFileSync(terminal, "owlprinted four\r\n");
      await new Promise((resolve) => setTimeout(resolve, 1_000));
      expect(await app.evaluate<string>(FIND_COUNT)).toBe("1 of 3");
      await enter(0);
      await app.until(`${FIND_COUNT} === "3 of 4"`, "the next older match, counted with the match printed since", 5_000);
```

Under the condition `f99803f1` wrote, the new step reads "2 of 3": the add-on's list holds three matches, and "two" is its second (read). So the fix pass can see the step red against the code at the target before it changes the condition.

The search above printed the statements of when the bar counts again. `view.ts:2053`, the docstring of `findCount`, stays true after the fix. `work-item-view.ts:640` is the comment the snippet replaces. `terminal-basics.test.ts:1612` says why the case keeps printing, and stays. `phase-2.md:16` states the old condition, and its sentence "The add-on also gives -1 for a match the pane printed since it last counted, and `find` then counts again before the page draws (review round 1, finding 1)." becomes:

```md
The add-on counts again only where the term or a choice changed, or 200 ms after the pane last printed, so a step is counted from a list made before the pane's last lines: it gives -1 for a match printed since, and leaves such matches out of the count. `find` counts again after every step under the limit, before the page draws (review round 1, finding 1, and review round 2, finding 1).
```

The search is a sample under contract rule 19: a statement in other words escapes it. The snippet stops at the steps. Between two steps, a pane that keeps printing still shows the count of the last step or search, and *Not judged* holds that for the owner.

```seal
verdict: fixed 1dc76ea1
answer: The reopen holds. `find` in `work-item-view.ts` now drops the term and searches again after every step under the limit, with the condition and comment the record's snippet gives, so a step onto a counted match also counts and marks the matches printed since, and a step from "No match" onto a match printed since is counted too. The case is renamed as the record gives it and gains the step that prints "owlprinted four" and presses Enter. That step failed against the round 1 condition before the fix (executed, exit 1, at `terminal-basics.test.ts:1625`, "the window never showed the next older match, counted with the match printed since"; the count it read was not printed, and the round's probe read "2 of 3"). After the fix `-t 'scenario A'` passed 6 (executed, exit 0). `seal mutate` putting round 1's condition back was red at the same line (executed, exit 0). On the timing note: both checks of the count before a step are gone, the "1 of 2" the round named and the "1 of 3" the record's step had. Each step now reads a count that is right whether or not the add-on counted again on its own during a stall of the printing, because `find` counts after the step either way, so no assertion rests on the gaps between the pane's lines. The 1 s waits stay, since a step must come after the lines are drawn, and the 50 ms printing stays, so that in the usual run the step meets the add-on's stale list. A stall can only make the case pass without meeting that list, never fail it. Phase 2's Decision 1 takes the record's sentence. `findCount`'s docstring stays true, as the record says. The finding's `git grep` for "printed since", "counts again" and "count again" over the work item's records, `apps/desktop/src`, `apps/desktop/test` and `docs`, run after `0ac63c38` (executed), prints only the new comment, `view.ts:2053`, the case's lines, `phase-2.md:16`, the plan's unrelated row on a search written here, and unrelated lines of other modules. It is a sample, and no frame statement needs a fold.
```

### 2. `gaps.md` drops the *Not verified* row on `screenTurns` instead of marking it closed

```seal
severity: should
location: `seal/threads/1795651593-231-pane-output-is-searched-and-opens-paths/gaps.md:9-10`
evidence: executed `git diff b960acf6..2db2bb29 -- seal/threads/1795651593-231-pane-output-is-searched-and-opens-paths/gaps.md`, `git grep -n -F "replay is drawn" -- seal/threads/1795651593-231-pane-output-is-searched-and-opens-paths/gaps.md` (exit 1); read the plugin's `skills/implement/SKILL.md` *4. The closing memo — only what the diff cannot show*
regression: round-1
```

The unit is `gaps.md` *Not verified*, which `1ef33033` changed. No row of `frame/plan.md` speaks of the memo's rows. The plugin's `skills/implement/SKILL.md` *4. The closing memo* closes an item by marking it, never by deleting it: its Item cell opens with the word `closed`. Round 1's *Confirmations* said the fix pass "may mark that row `closed` with this coordinate". The fix pass removed the row instead, and the answer of round 1's finding 3 gives the reason, "since `gaps.md` holds only what went out unproved". The defect came from reading the confirmation as leave to delete.

Why it matters: the settle and the sealer read the memo's closed rows as what was proved after the build. A row that left reads the same as a row tidied away, and only a reader of the diff tells the two apart. `skills/code-review/SKILL.md` *Two stages, in order* makes each row that left without the word `closed` a finding.

The diff removes the row between the Q2 row (line 9) and the Q3 row (line 10), and adds no line that carries it. The search printed no line, and no row of the file opens with `closed`.

The fix: put the row back where it stood, marked closed, with what closed it.

```md
| closed that a key typed while a returned pane's replay is drawn is dropped, and not sent, which is what makes the first key the pane's process receives mark the end of the return. The case stands on `screenTurns` in `apps/desktop/src/renderer/view.ts`, `read`, and no case removes that guard to show the time would read otherwise | review round 1, *Confirmations*, read: `screenTurns` in `apps/desktop/src/renderer/view.ts` answers `receiver()` as undefined while `unreplayed` holds, and `term.onData` in `apps/desktop/src/renderer/work-item-view.ts` sends nothing where the receiver is undefined |
```

The answer of round 1's finding 3, in `round-1.md`, is that round's record and stays as it is.

```seal
verdict: fixed 0ac63c38
answer: The row stands again where it stood, between the Q2 and Q3 rows of `gaps.md` *Not verified*, with its Item cell opening with `closed` and its second cell citing round 1's *Confirmations* and the two coordinates, as the record's row gives it. The read of the range, for the pass as a whole: after `0ac63c38` the pass read every hunk of `git diff 19879dbc..HEAD` over `apps/desktop/src`, and `gaps.md` *Not verified* (read). `changelog.md` was not printed after the last commit and is held, not read: no fix changes what it states. The narrow set at `0ac63c38`, one command through the machine's runner of heavy commands, passed: the typecheck (exit 0), `view.test.ts` with `themes.test.ts`, 586 cases (exit 0), and `terminal-basics.test.ts`, 35 cases (exit 0). The broad gate stays `unverified`, for the orchestrator.
```

## Confirmations

```seal
confirms: round-1#2
```
What holds: the step `f911a919` adds to the paste case holds the guard `turns.pane === pane` of `pasteImage` (`work-item-view.ts:703-709`). With the guard removed, the case went red at `terminal-basics.test.ts:1339`, where the third pane's process received a bracketed paste of the path, `1b5b3230307e…`. With the guard in place it passed (executed, *Probes*). The step reads the third pane on the screen it marked before the answer is released, so it reaches the guard and not a pane that never shared the screen (read, `:1321-1336`). The 500 ms wait after the release bears only on a mutant: with the guard in place nothing arrives to wait for. `gaps.md` *Not done* now holds the menu's guard alone, and `menuAct` returns before either paste where the screen's pane changed (`work-item-view.ts:488-499`, read), so its sentence is true. Phase 3's row P8 and its Decision 6 say the same (read).

```seal
confirms: round-1#3
```
What holds: `apps/desktop/measurements/memory.md:131` and `phase-1.md:68` give 9.4 MB, as `frame/design.md:151` does. 4,000 lines × 49 columns × 12 bytes is 2,352,000 bytes, about 2.4 MB a terminal, and 9.4 MB for four (read). The scene of 2026-11-19 printed about 300 lines a second (`memory.md:22`, read), so it already held 1,000 lines a terminal. Round 1's command, with "2.9 MB" added, printed those three lines and `memory.md:99`, an unrelated 18 MB, and no 11.8 MB or 2.9 MB (executed).

What matched, beside the three closes:

- The field `results` of `Screen` (`work-item-view.ts:102`) needs no fold of the frame. *Data & interfaces*, the paragraph "The find bar" (`frame/design.md:153`), names the pure functions of `view.ts`, the keys, the menu's act and the search options. It names no state that `work-item-view.ts` keeps. `Screen` is not exported (`work-item-view.ts:93`, read). The field crosses no module or process boundary, and no message, channel or exported type changes. So it is no interface the frame states, as the fix pass judged.
- The new A2 case leans on timing at one point, and it fails red there, never green. The check at `terminal-basics.test.ts:1618` reads that the add-on did not count again during one second. That holds only while every gap between two writes the window parses stays under 200 ms. The case writes every 50 ms, and the daemon forwards each read of the pane's output at once, with no batching of its own (`daemon.ts`, `watchProcess` and `sendOutput`, read). So a stall of about 150 ms in the test's process, the daemon or the window's renderer during that second makes the add-on count again, and the check fails on "2 of 3". The check cannot go: without it, such a stall would let the case pass with the fix removed. Here the case passed five runs in a row, and with the fix set aside it failed at `:1620` after its check passed (executed, *Probes*). Whether the Mac of CI stalls that long is a row of *Not judged*.
- The new A2 case and the step the paste case gains were read against their groups. No other find case of `terminal-basics.test.ts`, A1 to A5, steps after a print, and no other case holds a screen that passes to another pane during a paste. So neither covers only what its group already covers.
- The records against the target: phase 2's Decision 1 states the code at the target, and finding 1 rewrites it with the fix. Phase 3's P8 row, its Decision 6 and `gaps.md` *Not done* match the code. `findCount`'s docstring (`view.ts:2046-2057`) states what the add-on gives and stays true. `changelog.md` and `frame/design.md` *Scope* items 8 and 11 state the count and the marks the bar owes, and finding 1 is where the code falls short of them. This round found no other sentence of the records that the target contradicts.
- Outside the fix diff, this round opened the add-on's source, the daemon's output path, `menuAct`, `screenTurns` and the case helpers of `terminal-basics.test.ts`, each for a close above. It reviewed no other code.

## Not judged

| What | Location | Who answers |
|---|---|---|
| Between two steps, a pane that keeps printing shows the count of the last step or search, since the add-on counts again only 200 ms after the last print (`SearchAddon.ts:65-73` of 0.16.0). Counting again at every print would also move a selection the person made, as the first row of round 1's *Not judged* says. Whether the count should follow such a pane between steps is a question of the product | `apps/desktop/src/renderer/work-item-view.ts:584-594` | the owner's walk of release 0.0.5 |
| Whether the Mac of CI keeps every gap between the parsed writes of the A2 case under 200 ms for one second, which its check at `:1618` needs | `apps/desktop/test/terminal-basics.test.ts:1604-1625` | the orchestrator, at the broad gate and the pull request's checks |
| Round 1's other rows (Q1, Q3, Q4, Q5, an editor of the list on CI's Mac, the selection the add-on's own count replaces) stand on code and records this fix pass did not change, and carry as round 1 wrote them | `trail/rounds/round-1.md` *Not judged* | as round 1 names |
| The full suite, the repository's typecheck and the broad gate. This round ran filtered cases of one built-app file alone. The suite stays `unverified`, and `gaps.md` *Not verified* says so in its first row, which is honest | the whole tree | the orchestrator, at the broad gate |

## Probes

The probe file is `apps/desktop/test/test_tmp_round2.test.ts` in this round's clone. It is a copy of `terminal-basics.test.ts` that adds one case, `tmp: an older step onto a counted match while the pane keeps printing`, and runs the new A2 case with `repeats: 4`. Every built-app run went through the machine's runner of heavy commands, with `OWLERY_BACKGROUND=1`.

| Command | Result |
|---|---|
| `pnpm install --frozen-lockfile --prefer-offline` in the clone | exit 0 |
| `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs --project app test/test_tmp_round2.test.ts -t "tmp:\|while the pane keeps printing\|scenarios D1"` at `2db2bb29` | exit 1: the tmp case failed on `expected '2 of 2' to be '3 of 3'`, and printed that two marks of every match and the mark in front were drawn, and "3 of 3" once the printing stopped; the A2 case passed its five runs, and the paste case passed |
| The same file's two cases in `terminal-basics.test.ts`, `-t "once a step lands on it\|scenarios D1" --reporter=verbose`, with `turns.pane === pane` removed from `pasteImage` and `false &&` put before the condition of the search again in `find` | exit 1: the paste case failed at `:1339` on the third pane's bytes, `1b5b3230307e…`; the A2 case failed at `:1620`, `the window never showed the match printed after the search, counted with the others`, after its check at `:1618` passed. Both edits were taken back with `git checkout` |
| `git grep -n -F -e "11.8" -e "9.4 MB" -e "12 × 49" -e "2.9 MB"` over the work item's records and `apps/desktop/measurements` | `memory.md:99`, `:131`, `frame/design.md:151`, `phase-1.md:68` |
| `git grep -n -F "resultIndex: -1" -- apps/desktop`; `git grep -n -F "pasted-image" -- apps/desktop/test` | `view.test.ts:4168`, `:4170`, `:4171`; `terminal-basics.test.ts:1269`, `:1270`, `:1312`, `:1313` |
| `git grep -n -F -e "printed since" -e "counts again" -e "count again"` over the work item, `apps/desktop/src`, `apps/desktop/test` and `docs` | `view.ts:2053`, `work-item-view.ts:640`, `terminal-basics.test.ts:1612`, `phase-2.md:16`, and lines of other features |
| `git diff b960acf6..2db2bb29 -- gaps.md`; `git grep -n -F "replay is drawn" -- gaps.md` | the row on `screenTurns` removed and no line added that carries it; exit 1 |
| `git diff --stat b960acf6..2db2bb29` over `frame/`, `pr.md`, `changelog.md`, `routing.md` and `docs` | nothing printed |
