# Review round 2: 1795397381-summary-of-seals

```seal
target: f5d55c1, fixes 51f2f38..f5d55c1
```

This round verifies round 1's closes. Its code target is the diff `51f2f38..f5d55c1`, read in the branch's worktree at `f5d55c1` and read only. The diff holds the fix pass's commits `6c491a7`, `f71886c`, `5f48725` and `bbfab3c`, the orchestrator's `f907dd5` and `926ef43`, and the close blocks at `f5d55c1`. The code it changes is `apps/desktop/src/renderer/view.ts` (`summaryControls` alone), `apps/desktop/test/decisions-and-questions.test.ts` and one case of `apps/desktop/test/view.test.ts` (executed: `git diff --stat 51f2f38 HEAD -- apps/desktop/src` names `view.ts` alone). No probe and no test ran, so no clone was made. The work item's records were read whole at `f5d55c1`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `pr.md`, `trail/phases/phase-1.md` to `phase-3.md`, and `trail/rounds/round-1.md`. No `pr.<lang>.md` stands, since `Commit and pull request language` is English. The tree holds no `seal/parity.json`, and `config.json` under the `seal/` root holds no `Pact` key.

Carried from round 1 and not re-established, since the fix diff touches none of them: its confirmations of *Scope* items 1 to 4, 8, 9 and 12 to 14 (`sealSinceLook`, `changeOf`, `changedSet`, the daemon's `seal` field, `lookOf`, the sentence and the order), and the coordinate `last-look.ts:209`. Phase 1's timings and phase 3's mutation results stay carried as round 1 carried them. Round 1's executed search was run again: `git grep -n 'changedSetAfter\|redrawSummary' -- apps/desktop/test` still names `view.test.ts` alone, and the built-app case now holds the join without naming the function (round-1#1 below).

Axes named for this round beyond the table: whether the hold the fix puts on the daemon's git catches the one command it names and nothing else, what a case that fails before its release leaves running, whether the hint says the line Enter opens under each label on the committed screenshots, and whether the release's other fragments still hold against the new hint.

## Findings

No finding. Each of round 1's five closes holds, and the fix diff opens no defect this round found.

## Confirmations

```seal
confirms: round-1#1
```
What holds: claimed in the close: the first case holds the daemon's `git show` of the fourth work item's guarantee, so `ready` goes out without that seal, and the case reads the join after the release. Read, and it holds. The stand-in `git` of `test/chain-run.ts#heldGit` (lines 98 to 120) goes first on `process.env.PATH` (line 113). `BuiltApp.start` builds the app's environment from `process.env` (`built-app.ts:196`), and the app starts its daemon with `{ ...process.env, ... }` (`daemon-client.ts:53`). The daemon's git runs as `execFile("git", args, { cwd, ... })` (`worktrees.ts:42-44`), so `$1` is the subcommand and `pwd -P` is the worktree. `fileAt` runs `show` (`worktrees.ts:1016-1018`). The worktree path the condition compares stands on `realpathSync` (`repositories.ts:24`). `sealAt` reads the guarantee first (`seal-state.ts:62-64`). Every other caller of `fileAt` is a chain step or the pull request's check: `daemon.ts#runChain` (line 2140), `#runFixPass` (line 2377), `#runSeal` (line 2502), `#runPullRequest` (line 2679), `chain.ts` lines 407 to 429 under `standingOf`, and `github.ts` lines 408 and 419. No chain runs in this file. So the comment's claim at `decisions-and-questions.test.ts:129` holds: no other `git show` runs in the fourth's worktree before the release. The case waits for the held command to arrive (line 159) and fails where it never does (line 160). Then it reads the summary without Delta, "2 new" and Delta's title not strong (lines 162 to 165). After the release it reads the sentence with the seal, the summary still in front, Delta first, "3 new" and the strong title (lines 168 to 172). The close's three mutants failed at lines 168, 171 and 172, and those are the assertions at `f5d55c1` that each mutant's guard reaches (read). The mutants were not run again here. With the join taken off `takeLists`, the sentence at line 168 cannot come, and that follows from reading. The new unit, the hold, leaves nothing waiting. `afterAll` runs the release from `cleanups` before `app.stop()` (lines 150 to 154), and the stand-in ends its wait once its script is gone (`chain-run.ts:112`). So a case that fails before line 167 leaves no held git. The top comment (lines 15 to 18) and the second case's comment (line 280) now say the join. `gaps.md:13` is closed in place and names the case. `trail/phases/phase-3.md:39` stays as phase 3 wrote it, and it still states what phase 3's starts did. Frame scenario 13 is still two cases in the one start.

```seal
confirms: round-1#2
```
What holds: `view.ts#summaryControls` (lines 1418 to 1420) gives "Enter opens the first question." under "Answer the first question" and keeps "Enter opens the first that needs you." under "Open the first that needs you". The docstring (lines 1408 to 1410) says the hint names the line Enter opens. `summary.ts:86` draws `controls.hint` and holds no hint of its own. The pins at `view.test.ts:3265` and `:3273` take each label's hint, and a swap of the two fails each `toEqual` (read). The six summary files did not change after `5f48725` (executed: `git diff --stat 5f48725 HEAD` on `screenshots/` printed nothing). Read: `night-watch-dark-summary.png` and `desk-light-summary.png` show "Answer the first question" with "Enter opens the first question." beside it, over a broken line that stands before the line with the question. `pr.md:20-25` link the six files at `5f487258d49ec89c3709fcabbe5855373f65d91d`. `changelog.md:10` and `frame/design.md:194-195` name both hints. `seal/threads/1795340000-design-system/changelog.md:11` was read again against the new hint. It says the summary's hint says "Enter opens the first that needs you." in a list of the places where the words "needs you" now stand. The hint still says those words under the label that names that state, so the bullet stays true, as round 1's grounds said. `trail/phases/phase-2.md:15` stays a record of phase 2's judgment.

```seal
confirms: round-1#3
```
What holds: the close departs from the paste-ready fix, and its grounds hold. `sealSinceLook` returns null for a broken seal under a merged pull request (`view.ts:1227`). `changeOf` counts a rise of new commits as a change wherever both sides carry a count (`view.ts:1279`, `:1282`). So the paste-ready "It opens no summary" would have been false where the breaking commit raised the count. A change's sentence opens with `STATE_IN_CHANGE[line.state]` where no seal is said (`view.ts:1271`), so "Finished." is the state's word and not the only one. `changelog.md:8` now says each of these. Its claim that the seal still shows as broken stands on `summary.ts:74`, which the fix diff did not touch (read).

```seal
confirms: round-1#4
```
What holds: `pr.md:10` now says that "Answer the first question" opens the first line that waits on a question, a call to allow or its agent's own question. That is `waitsOnAnAnswer` at `view.ts:1398-1400`, which the fix diff did not change (read). The sentence agrees with `changelog.md:10`. Round 1's location was in `pr.md` alone, so no code commit was owed.

```seal
confirms: round-1#5
```
What holds: `seal/threads/1795396351-seal-breaks-after-a-commit/changelog.md:14` no longer has the last look carry `seal`. The bullet agrees with `last-look.ts:209`, which the fix diff did not touch (executed: the diff's stat over `apps/desktop/src` names `view.ts` alone). It also agrees with this work's `changelog.md:13`, the one place that states what the look keeps (read).

What matched: the fold at `926ef43` adds the two hints to `frame/design.md` *Data & interfaces*, the table of the window's words, as `view.ts:1419-1420` give them. No other sentence of the frame states the hint. `frame/questions.md`, `frame/plan.md` and `routing.md` did not change in the fix diff, and no sentence of theirs that states the present is contradicted at `f5d55c1` (read).

What matched: the remaining rows of `gaps.md` that name the proofer are unchanged by the fix diff. Round 1 answered them: row 12 in its prose, and rows 15 and 16 under its *Not judged* and in its prose. Each `## Not verified` row that stood at `51f2f38` still stands at `f5d55c1`: the fix diff closes row 13 in place and takes out none (read: `git diff 51f2f38 HEAD` of `gaps.md`).

## Not judged

| What | Location | Who answers |
|---|---|---|
| The broad gate at `f5d55c1`: the full suite, the typecheck and the documents' checks. The fix pass ran `decisions-and-questions.test.ts`, the cases of `summaryControls` and the screenshot run, and it declined the typecheck under contract rule 2, which is the honest label. The other built-app files that load `view.ts` stay as `gaps.md:10` and `gaps.md:14` leave them | `apps/desktop/test/`, `apps/desktop/src/renderer/view.ts` | the orchestrator's broad run |
| Whether the first case's wait for the held command (up to 10 s, `decisions-and-questions.test.ts:159`) and its later waits hold under the broad gate's load. The fix pass ran the file through the lock, and this round started no built app | `apps/desktop/test/decisions-and-questions.test.ts:156-172` | the orchestrator's broad run |
| Round 1's rows on how the window sets a commit, on the hello's read under load, and on `frame/questions.md` Q1 to Q3. The fix diff touched none of them | `trail/rounds/round-1.md` *Not judged* | as round 1 names: the owner, and the orchestrator |

This round leaves nothing open. What comes due is the orchestrator's broad run, and the sealer's spawn after it.

## Probes

| Command | Result |
|---|---|
| `git grep -n 'changedSetAfter\|redrawSummary' -- apps/desktop/test`, round 1's search run again | Only `apps/desktop/test/view.test.ts` names `changedSetAfter`, at its import and in the case at lines 2117 to 2132 |
| `git diff --stat 51f2f38 HEAD -- apps/desktop/src` | `apps/desktop/src/renderer/view.ts` alone, 6 lines in and 3 out |
| `git diff --stat 5f48725 HEAD -- seal/threads/1795397381-summary-of-seals/screenshots` | No output: the six summary files are the ones `5f48725` commits |
| `python3 skills/code-review/scripts/chain_check.py --baseline 3868fa8 --root <the branch worktree> --worktree`, before this record, with a stand-in `gh` first on `PATH` that fails every call | Exit 0. It asked for a verifying round for round 1's findings 1, 2, 3 and 5 and for the commits after round 1's target. It refused the absent gate record and guarantee, and printed no notice on `frame/design.md` |
| The same command after this record | Exit 0. It refused the absent gate record and guarantee, and nothing else |
