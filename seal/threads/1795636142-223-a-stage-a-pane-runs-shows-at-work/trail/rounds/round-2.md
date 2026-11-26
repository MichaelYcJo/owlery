# Review round 2: 1795636142-223-a-stage-a-pane-runs-shows-at-work

```seal
target: 3b513e82, fixes 7a3ec9ae..3b513e82
```

This round verifies the fix pass of round 1. The range `7a3ec9ae..3b513e82` holds round 1's record (`3211dd0a`), the framer's fold (`0934695f`), the fix (`b4ec592f`), the closing memo (`d6626b95`), the docstring of `stageTold` (`186c56d5`) and the close blocks (`3b513e82`). The code reviewed stays inside that diff: `apps/desktop/src/daemon/daemon.ts`, `apps/desktop/test/daemon.test.ts` and `apps/desktop/test/heavy-run.test.ts`. Of the work item's records, the range changes `changelog.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md` and `gaps.md`. Each change was read against the target. `routing.md` and the phase records are unchanged since `7a3ec9ae`, where round 1 read them whole, so their reading is carried from round 1 and not done again. The work item still holds no `pr.md` and no `pr.<lang>.md`. The round ran in a `git clone --no-local` of the branch worktree checked out at `3b513e82`.

Round 1's close commit `3b513e82` adds only the three close blocks to `trail/rounds/round-1.md` (read, `git show 3b513e82`). It changes no line of the findings.

## Findings

None. No close of round 1 fails to hold, and the fix diff adds no defect.

## Confirmations

```seal
confirms: round-1#1
```
What holds: `endSessions` drops the stage of each pane it ends and sends the lists before its wait (`apps/desktop/src/daemon/daemon.ts:2315-2321`). `dropStageOf` now says whether a stage stood (`daemon.ts:3013-3018`). The `closePane` and `onExit` callers ignore the answer and send the lists themselves, as before. Sending the lists before the wait is what a refused removal needs, since it throws before any broadcast of its own. An archive and a delete send the lists once more after their own change, which costs one extra send and changes nothing a client draws. The case at `apps/desktop/test/daemon.test.ts:4836` now tells a stage from the deaf pane before the removal. Right after the refusal it reads `paneStage` null, and it asserts that the pane's `exit` has not arrived, so the `onExit` drop cannot be what satisfies it. That reason for leaving out the `carried(...)` wait round 1 wrote is sound: the deaf pane exits by itself after 3 s, and a wait would pass on that exit. Executed: the case passed at `3b513e82`. With `if (dropped) this.broadcastInbox();` removed from the clone, it went red at `daemon.test.ts:4852` with "expected { kind: 'round', round: 1, …(1) } to be null", as the close says. The docstrings of `endSessions` (`daemon.ts:2300-2303`) and of `stageTold` (`daemon.ts:2982-2985`, `186c56d5`) name the drop and the refusal. Scope item 4 (`frame/design.md:42`) lists `endSessions` among the drops, and *Data & interfaces* names it too (read).

```seal
confirms: round-1#2
```
What holds: every statement round 1's search printed now names the close and the process's end. The four `to` values of `## Rule changes` match round 1's text: `frame/design.md:113`, `:118`, `:142` and `:147`. The same words now stand at `changelog.md:6`, `frame/design.md:52`, `frame/plan.md:11`, `:13` and `:19`, and `frame/questions.md:15`. Executed: the search `git grep -n -e 'the pane ends' -e "the pane's end" -e 'when that pane ends' -e '칸이 끝' 3b513e82 -- seal/threads/1795636142-223-a-stage-a-pane-runs-shows-at-work` prints only lines of `trail/rounds/round-1.md`, which quote the finding. The search reads these spellings alone and is a sample. Scope item 4 and scenario 5 (`frame/design.md:42` and the scenario row) now state the drop at an account change and why the pane stays. The case at `apps/desktop/test/daemon.test.ts:8651` changes a Claude Code pane's account while it holds a stage. It reads the first inbox after the change whose sessions list the pane under the new account, and in it the pane is alive and `paneStage` is null (read `daemon.test.ts:8651-8677`). `onExit` drops the stage at `daemon.ts:2639` and sends no lists on the replacing branch (`daemon.ts:2641-2646`), and `changeAccount` sends one inbox after the account is set (`daemon.ts:2049`). So that inbox carries the drop only where `onExit` dropped the stage before the branch returned. Executed: the case passed at `3b513e82`. Its red under the mutant the close names is read, not run.

```seal
confirms: round-1#3
```
What holds: the case at `apps/desktop/test/heavy-run.test.ts:285` is round 1's case. It adds a race against a 5 s timer, so the mutant `limit = undefined` fails on `expect(settled).toBe(true)` in seconds, not at the describe's timeout. The pending client connection settles once the cleanup destroys the server's sockets, so the mutant leaves no process open after the case. The row at `gaps.md:7` is marked `closed` and names the case and its red, and the row at `gaps.md:8` is closed with the account-change case. No row left the memo: both were rewritten in place with the word `closed` (read, the diff of `gaps.md`). Executed: the case passed at `3b513e82` with the rest of "the stage lines of the turn socket". The mutant's red at `heavy-run.test.ts:298` is read from the close, not run.

What matched: the fold `0934695f` changes only the sentences round 1's findings 1 and 2 named, and the Korean editions say what the English ones say (read). Every `from` of `## Rule changes` is unchanged, so round 1's check that each stands in its file carries.

## Not judged

| What | Location | Who answers |
|---|---|---|
| Q1's default: a stage a live pane's session leaves reads at work until the pane is closed or its process ends. Round 1's row stands unchanged. | `seal/threads/1795636142-223-a-stage-a-pane-runs-shows-at-work/frame/questions.md:15` | a person: the owner, through Q1 |
| The built-app batch and the built-app files `gaps.md` names. This round ran no built app. | `seal/threads/1795636142-223-a-stage-a-pane-runs-shows-at-work/gaps.md:10` | the orchestrator, at the broad gate |
| The suite as a whole, the typecheck and the broad gate (contract rule 2). The round leaves nothing open, so the orchestrator's broad run comes due, and the sealer's spawn after it. | `seal/config.json` `Broad gate` | the orchestrator, at the broad gate |

## Probes

| Command | Result |
|---|---|
| `node scripts/test-in-electron.mjs test/daemon.test.ts test/heavy-run.test.ts -t "the stage a pane's session runs\|drops the stage a changed pane's session told\|the stage lines of the turn socket"`, in `apps/desktop` of the round's clone at `3b513e82` | 2 files, 9 passed, 416 skipped, exit 0 |
| The same clone with `if (dropped) this.broadcastInbox();` removed from `endSessions`, then `node scripts/test-in-electron.mjs test/daemon.test.ts -t "drops the stage a pane told before the daemon ended it"` | exit 1: 1 failed at `test/daemon.test.ts:4852`, "expected { kind: 'round', round: 1, …(1) } to be null". The line was restored in the clone afterwards. |
