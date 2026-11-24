# Review round 2: 1795498003-interrupted-turn-stays-working

```seal
target: b364022, fixes 9380d1f..aa2b2c5
```

This is the verifying round. The code it reviews is the fix diff `9380d1f..aa2b2c5`: `190b9da` (the comment at `apps/desktop/src/daemon/session-log.ts:121` and a new case with a `vi.mock` of `node:fs` in `apps/desktop/test/session-log.test.ts`), `bc4f801` (the row at `gaps.md:11`), `ec9f3ed` (the fold of *Scope* item 1) and `aa2b2c5` (the closes in `trail/rounds/round-1.md`). It also reads the merge `b364022` of `origin/release/v0.0.3` at `09ff5ad` (#183, PR #189) for conflicts with this branch's work, and nothing more of #183, which was reviewed and sealed on its own pull request.

Stage 1 read `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md` and `pr.md` whole at `b364022`, then the three phase records and `trail/rounds/round-1.md`. No `pr.<lang>.md` stands, and `seal/config.json` sets `Commit and pull request language` to English, so none is owed. `seal/parity.json` does not stand, so no parity comparison is owed.

Carried from round 1 and not established again: where the watch's two start paths stand (`session-log.ts:43-58`), the daemon's own once-a-pane message (`apps/desktop/src/daemon/daemon.ts:1900-1903` at `9380d1f`, now the `failed` callback of `Daemon#followLog`), round 1's reading of the 16 KB bound, and its account of the fixture's redaction other than the `<signature>` placeholder. Re-established this round: each verdict below, the guard's case run and seen red, the fixture's placeholders in its `user` and `assistant` lines, each quote of `pr.md`, and the merge.

## Findings

This round opens no finding.

## Confirmations

```seal
confirms: round-1#1
```
What holds: the comment at `apps/desktop/src/daemon/session-log.ts:121` now says what the code does. A log that stands when the watch starts is watched and nothing more (`session-log.ts:44-47`). Only a log that came to stand after the watch began is watched and then read at once (`session-log.ts:52-54`), so only there can a refused watch be followed by a failed read. The row at `gaps.md:11` is closed in place with the word `closed`, states both paths the same way, and names the case as its proof. No row left the memo. The fix pass claimed the case passes and goes red at `session-log.test.ts:110` with the guard deleted. Executed in the round's clone at `b364022`: `node scripts/test-in-electron.mjs test/session-log.test.ts` passed 4 of 4. With `if (this.ended) return;` deleted from `SessionLogWatch#fail`, the same command failed only the new case, at `test/session-log.test.ts:110:72`, where the failures gained `"EMFILE: too many open files, open"`. That is the guard's own effect, so the case pins the guard and nothing else holds it. The source was restored after the run. Round 1's row in `## Not judged` asked whether the case runs under vitest in Electron's Node: it does, as just stated. Round 1's account at `trail/phases/phase-2.md:32` still reads "reached only where `fs.watch` refuses a file that stands, which no case can cause". It is a phase record, round 1 let the fix pass leave it as history, and `gaps.md:11` is what states the present.

```seal
confirms: round-1#2
```
What holds: `frame/design.md:48` now ends "with its paths replaced and each thinking block's signature replaced by `<signature>`", and the diff of `ec9f3ed` changes that sentence alone. Executed: `python3 -I` over `apps/desktop/test/fixtures/claude-interrupted-turn.json`, listing each placeholder of the form `<name>` in every log line whose `type` is `user` or `assistant`. The eight such lines hold `<cwd>`, and the assistant's thinking line at `at` 7905 also holds `<signature>`. No other placeholder stands in them and none carries `redactedCharacters`, so the sentence now states every change the fixture makes to those lines.

What matched: the new case read against its group. The other three cases of `describe("SessionLogWatch")` (`apps/desktop/test/session-log.test.ts:49-99`) cover the lines handed on, the end, the wait and its running out, and none reaches the guard, so the new case covers what the group did not. The mock refuses `watch` and `openSync` only while `refuse.on` is set. The case sets it after `writeFileSync` has written the log, and before the poll at 100 ms looks for it. The cleanup that clears it is pushed last, so `afterEach` runs it first, before the watch's `end` and the folder's removal. Every other case watches and reads through the real functions, as the comment at `session-log.test.ts:7` says. Executed and read.

What matched: the merge `b364022`. `git show --cc b364022` shows no resolved hunk. Executed: `git diff --raw` of `aa2b2c5..b364022` gives the same blob for every path as `c82c611..09ff5ad`, and `09ff5ad..b364022` the same as `c82c611..aa2b2c5`, so each side's files pass through the merge unchanged. The two sides share no path. `09ff5ad` changes `apps/desktop/package.json`, `apps/desktop/src/renderer/themes.css`, `apps/desktop/test/theme-controls.test.ts`, `docs/design.md`, `docs/design.ko.md` and its own work item's directory. That is what `frame/plan.md` *Overlap with the release* says of #183: marks in `docs/design.md` and the themes, and the version move that *Operational impact* leaves to #183. The new Night watch marks keep "An open eye with its pupil needs the person", so an interrupted session is still drawn as every waiting session is, as `frame/design.md` *Out of scope* says. `docs/design.md` *The voice of the window's words*, which *Grounding* cites, is not in the merge's diff. Executed and read.

What matched: `pr.md`. Each of its seven quotes stands word for word, with runs of white space collapsed, at the coordinate it names in `frame/design.md` and `gaps.md` at `b364022`. The `gaps.md` rows it calls the second and the third are still the rows on an Esc during a running command and on the log written after the first prompt. Executed.

What matched: `changelog.md` and the fixes. No item of the changelog is changed by the fix diff. Its item on a log that cannot be read says "The daemon's log says so once for the pane", and the guard pinned by the new case is one of the things that holds that. Read.

What matched: the records that state the present, at `b364022`. `routing.md`, `frame/questions.md` and `frame/plan.md` are unchanged by the fix diff and the merge. The sentences of `frame/design.md` and `frame/plan.md` dated to `29eaf46`, such as "`seal/threads/` holds this work item alone", state that commit. #183's directory, which the merge adds, does not contradict them. Read.

Two points stand outside the findings. First, the guard at the head of `SessionLogWatch#fail` has one more reach than round 1 named. Round 1 wrote that a refused watch followed by a refused read "is the one way the guard is reached". `Daemon#followLog` ends the watch from inside the line callback when it reads an interruption, and `SessionLogWatch#read` (`session-log.ts:88`) still calls `readSync` to the log's end. A failed `readSync` there would reach the guard too, and the guard keeps the daemon from printing that the log is not read after it read the interruption. The new comment at `session-log.ts:121` names one reason and does not say it is the only one, and the new case pins the guard whatever the path, so this opens no finding. Second, the row at `gaps.md:10` on the 16 KB bound still stands open with the proofer as its answerer. Round 1 answered it under its `## Confirmations`, and closing the row is the fix pass's or the orchestrator's act, not this round's.

## Not judged

| What | Location | Who answers |
|---|---|---|
| Whether the new `vi.mock` block's casts typecheck. The fix pass claimed `tsc --noEmit -p .` in `apps/desktop` passed. A typecheck is part of the broad gate under contract rule 2, so this round did not run one | `apps/desktop/test/session-log.test.ts:9-23` | the orchestrator's broad run |
| The full suite, the typecheck and the lint at `b364022`, which now holds #183's work beside this branch's. This round ran one test file | the whole package | the orchestrator's broad run, and then the sealer |
| Carried from round 1: whether a hook event fired inside a subagent names the main session's log or the subagent's own as `transcript_path` (`apps/desktop/src/daemon/daemon.ts#followLog`). No real `claude` was started | `apps/desktop/src/daemon/daemon.ts` | the orchestrator, who may add an Esc during a subagent to the owner's walk of release 0.0.3 (#184) |
| Carried from round 1: the `seal mutate` results that `phase-2.md` and `phase-3.md` report | `apps/desktop/src/daemon/` | the sealer |

This round leaves no finding open. What comes due is the orchestrator's broad run at `b364022`, and the sealer's spawn after it.

## Probes

| Command | Result |
|---|---|
| In the round's clone at `b364022` (`<scratchpad>/1795498003-interrupted-turn-stays-working/round-2/clone`, with the worktree's `node_modules` linked in), from `apps/desktop`: `node scripts/test-in-electron.mjs test/session-log.test.ts` | Test Files 1 passed, Tests 4 passed, exit 0 |
| The same command, after `if (this.ended) return;` was deleted from `SessionLogWatch#fail` in the clone with the `Edit` tool | exit 1. Tests 1 failed, 3 passed. The failed case is "fails once where a log that stood only after it began can be neither watched nor read", at `test/session-log.test.ts:110:72`, where the failures received `"EMFILE: too many open files, watch"` and `"EMFILE: too many open files, open"`. The line was restored after the run |
| `python3 -I` over `apps/desktop/test/fixtures/claude-interrupted-turn.json`, listing the placeholders in each log line whose `type` is `user` or `assistant` | 8 lines. Each holds `<cwd>`, the assistant's thinking line at `at` 7905 also holds `<signature>`, and none carries `redactedCharacters` |
| `git diff --raw` over `c82c611..09ff5ad` against `aa2b2c5..b364022`, and over `c82c611..aa2b2c5` against `09ff5ad..b364022`, comparing each path's blob | Each pair gives the same blob for every path, and the two sides share no path |
| `python3 -I` over `pr.md`, finding each quote in the file its coordinate names, with runs of white space collapsed | 7 of 7 found |
