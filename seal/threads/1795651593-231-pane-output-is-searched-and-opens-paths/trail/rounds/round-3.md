# Review round 3: 1795651593-231-pane-output-is-searched-and-opens-paths

```seal
target: e21f3c58, fixes 2db2bb29..e21f3c58
```

This is the verifying round after round 2's fix pass. The code reviewed is the fix diff `2db2bb29..e21f3c58`: `19879dbc` (round 2's record), `1dc76ea1`, `0ac63c38` and `e21f3c58` (the close blocks). The base is still `release/v0.0.5` at `9f9ba1da`, the branch's cut.

The round read whole, at `e21f3c58`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `pr.md`, `trail/phases/phase-1.md` to `phase-3.md`, and `trail/rounds/round-1.md` and `round-2.md`. `seal/config.json` gives English for the records and the pull request, so no `pr.<lang>.md` is owed, and none stands. No `seal/parity.json` stands.

What this round carried from round 2 rather than re-established: `git diff --stat 2db2bb29..e21f3c58` lists `work-item-view.ts`, `terminal-basics.test.ts`, `gaps.md`, `phase-2.md` and `round-2.md`, and no file of `frame/`, `pr.md`, `changelog.md`, `routing.md` or `docs` (executed). So the confirmations of rounds 1 and 2 on those files stand on files no fix touched, and this round did not repeat them. The add-on's source was opened again, not carried. Round 2's coordinates in it were used as the places to open: `SearchAddon.ts:65-83`, `:96-112`, `:114-148`, `:171-191`, `SearchResultTracker.ts:96-110`, `SearchEngine.ts:167-228` and `SearchLineCache.ts:50-66` of 0.16.0.

## Findings

No finding. Both of round 2's closes hold, and the fix diff adds no unit that a case leaves unread.

## Confirmations

```seal
confirms: round-2#1
```
What holds: `find` in `apps/desktop/src/renderer/work-item-view.ts:640-644` searches again with the term dropped after every step under the limit. The condition and the comment are the ones round 2's snippet gave (read). Since the condition no longer asks for `resultIndex` -1 or a count above 0, a step onto a match the add-on counted is counted afresh. So is a step from "No match" onto a match printed since. The step's own `findPrevious` or `findNext` searches the terminal's lines as they stand, so it finds that match, and the second search starts from it (`SearchEngine.ts:187-202`, read).

The case pins the fix. With round 1's condition put back, the A2 case failed at `terminal-basics.test.ts:1625`, "the window never showed the next older match, counted with the match printed since" (executed, exit 1, *Probes*). With the fix it passed (executed, exit 0). This reruns the `seal mutate` the fix pass claimed, and gives the same line.

The orchestrator asked whether the case still pins the fix now that the checks before each step are gone. The case can pass without the fix in one kind of run: one where the pane's output stops for 200 ms or more during the second 1 s wait. The add-on then counts again on its own (`SearchAddon.ts:65-73`). The step then lands on a list that already holds "four", and reads "3 of 4" without the fix. With round 1's fix removed as well, the first step passes without its fix only where the first wait holds such a gap. So a false pass needs a defect and such a gap in the same run.

A normal run meets the stale list. The probe printed a match and then a line every 50 ms, for ten steps in a row. It read the count before each step and after it. Each of the ten counts read before a step was the count from before the print, "1 of 2 -> 1 of 2", "1 of 3 -> 1 of 3" and so on. So the add-on had not counted again in any of the ten seconds. Each step then read the new total, "1 of 3" up to "11 of 12" (executed, *Probes*). Round 2's five runs met the stale list too, by its check at the old `:1618`.

The trade the fix pass made is sound. Before the change, a gap like this failed the fixed code at a check before the step. Now the same gap can let the case pass in a run where the fix is missing. A false red on CI blocks every pull request, and a false pass needs a defect and a gap in the same run. The comment at `:1612` says what the case now rests on, and it is true (read). The row on CI's Mac in *Not judged* is rewritten for the new risk.

The cost of a search after every step was measured in the built app. The probe set the scrollback, printed the lines, and timed the synchronous part of one Enter in the bar's field: the step and the search again. The page draws at its next frame, and that frame was not timed. All times are in milliseconds (executed, *Probes*):

| Lines held | Term | Pane idle | Pane printing every 50 ms |
|---|---|---|---|
| 5,000 | 1,000 matches | 5.6 to 7.6 | 6.5 to 9.3 |
| 5,000 | 3 matches | 0.4 to 3.1 | 3.4 to 7.3 |
| 50,000 | 1,000 matches | 7.3 to 9.9 | 35.7 to 46.8 |
| 50,000 | 3 matches | 3.0 to 26.5 | 42.0 to 67.6 |

At the default of 5,000 lines, a step costs under 10 ms, which is less than one frame. At 50,000 lines, while the pane prints, a step costs up to about 70 ms. The add-on's line cache is dropped at every line feed (`SearchLineCache.ts:50-66`), so each step translates every line again. A single press at that cost reads as a short lag, not as a stall. A held Enter repeats faster than that, so at 50,000 lines in a printing pane the steps fall behind the key. A typed character already pays the same scan, since a fresh search counts every match too (`SearchAddon.ts:114-148`). *Data & interfaces* of `frame/design.md` and `frame/plan.md` *A second cost* accept larger costs at 50,000 lines for the person who sets them. So this is no finding.

What the condition leaves: past the limit, a step is not counted again. A stale list of 1,001 matches can therefore say "More than 1,000 matches" for a few hundred ms, where a full scrollback has since dropped lines below that number. This needs more than 1,000 matches and a pane that keeps printing. It is the same staleness as between two steps, which round 2's *Not judged* gives to the owner (read: `work-item-view.ts:641`, `SearchAddon.ts:65-73`).

Phase 2's Decision 1 (`phase-2.md:16`) now states the code at the target: the add-on counts again only at a changed term or choice, or 200 ms after the last print, and `find` counts again after every step under the limit. `findCount`'s docstring (`view.ts:2046-2057`) stays true. `git grep -n -F -e "printed since" -e "counts again" -e "count again" -e "every step"` over the work item's records outside `trail/rounds`, `apps/desktop/src`, `apps/desktop/test` and `docs` printed `view.ts:2053`, `work-item-view.ts:640`, `terminal-basics.test.ts:1612`, `:1618` and `:1625`, `phase-2.md:16`, the plan's row on a search written here, and lines of other features (executed). Each of the lines that speaks of the bar states the code at the target. The search is a sample under contract rule 19.

```seal
confirms: round-2#2
```
What holds: `gaps.md:10` stands again between the Q2 row and the Q3 row of *Not verified*. Its Item cell opens with `closed`, and its second cell cites round 1's *Confirmations* and the two coordinates, word for word as round 2's snippet gave them (read). `git diff 2db2bb29..e21f3c58` over `gaps.md` adds that line and removes none (executed). The coordinates the row names hold at the target: `screenTurns` in `view.ts` answers `receiver()` as undefined while `unreplayed` holds (`view.ts:2829-2862`). `term.onData` in `work-item-view.ts:813` sends nothing where the receiver is undefined (read).

What matched, beside the two closes:

- The new step of the A2 case was read against its group. No other case of `terminal-basics.test.ts`, A1 to A5 among them, steps onto a counted match after the pane printed another. So it covers what no case of the group covers.
- The fix pass's account of the narrow set (the typecheck, `view.test.ts` with `themes.test.ts` at 586 cases, `terminal-basics.test.ts` at 35) is its claim, `read` here. This round ran the A2 case and its own probe cases alone.
- The work item's records were read against the target, as listed above. This round found no sentence of them that the target contradicts. `pr.md` quotes only *Scope* items and Q1 and Q3, and no fix changed those.
- Outside the fix diff, this round opened only the add-on's source and the coordinates of the `gaps.md` row, each for a close above. It reviewed no other code.

## Not judged

| What | Location | Who answers |
|---|---|---|
| Whether the Mac of CI leaves a gap of 200 ms or more in the pane's output during one of the A2 case's 1 s waits. A run with the fix passes either way. Such a gap only lets a run with a defect pass, so it bears on what one green run of the case proves, not on whether the case fails | `apps/desktop/test/terminal-basics.test.ts:1604-1629` | the orchestrator, at the broad gate and the pull request's checks |
| Round 2's row on the count a pane that keeps printing shows between two steps, and round 1's other rows, stand on code and records this fix pass did not change. They carry as those rounds wrote them | `trail/rounds/round-2.md` and `round-1.md`, *Not judged* | as those rounds name |
| The full suite, the repository's typecheck and the broad gate. This round ran filtered cases of one built-app file and its own probe file alone. The suite stays `unverified`, and the first row of `gaps.md` *Not verified* says so, which is honest | the whole tree | the orchestrator, at the broad gate |

## Probes

The probe file is `apps/desktop/test/test_tmp_round3.test.ts` in this round's clone. It is a copy of `terminal-basics.test.ts` that adds two cases: `tmp: how often a step meets the add-on's stale list while the pane keeps printing` and `tmp: what a step costs at 5,000 and at 50,000 lines`. Every built-app run went through the machine's runner of heavy commands, with `OWLERY_BACKGROUND=1`.

| Command | Result |
|---|---|
| `pnpm install --frozen-lockfile --prefer-offline` in the clone | exit 0 |
| `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs --project app test/test_tmp_round3.test.ts -t "tmp:\|while the pane keeps printing"` at `e21f3c58` | exit 1. The A2 case passed. The stale-list case passed: all ten counts read before a step were the count from before the print, and each step read the new total. The cost case failed on its own wait, which read " of 1000" where the bar writes "1,000" |
| The same file, `-t "tmp: what a step costs"`, with that wait corrected | exit 0. The times are in the table under the first confirmation |
| `terminal-basics.test.ts -t "while the pane keeps printing"`, with round 1's condition put back in `find` | exit 1, at `:1625`, "the window never showed the next older match, counted with the match printed since". The edit was taken back with `git checkout` |
| `git diff --stat 2db2bb29..e21f3c58`; `git diff 2db2bb29..e21f3c58 -- gaps.md` | the five files above; one line added to `gaps.md` and none removed |
| `git grep -n -F -e "printed since" -e "counts again" -e "count again" -e "every step"` over the work item, `apps/desktop/src`, `apps/desktop/test` and `docs` | the lines named under the first confirmation, and lines of other features |
