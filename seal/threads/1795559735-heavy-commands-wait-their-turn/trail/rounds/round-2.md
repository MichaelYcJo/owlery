# Review round 2: 1795559735-heavy-commands-wait-their-turn

```seal
target: 7593607b, fixes 9834f7bb..7593607b
```

This is the verifying round. It reviewed every commit after round 1's target `9834f7bb`, up to HEAD `7593607b`. Those are the framer's fold `90e62e90`, the crafter's fixes `6fc85e03`, `e03117aa`, `db681098`, `a415bc8a`, `7dd4c944` and `92df8087`, the fix pass's record `0f0e2665`, and the framer's fold of finding 1 at `7593607b`. The base stays `origin/release/v0.0.4` at `5cb81763`, and the commits the merge `11dd825e` brought from the release are not this work's.

It read `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md` and `pr.md` whole at `7593607b`. No `pr.<lang>.md` stands, since `seal/config.json` names English for the pull request. No phase record changed after `9834f7bb`. Each quote of `pr.md` was found word for word in its source, with runs of whitespace collapsed. The sections they cite did not move.

Carried from round 1 and not re-established: the coordinates of the giver, the keeper and the runner, and the list of the protocol's messages that finding 6 read. Also carried, from the fix pass's account and not re-run: that `seal mutate` read red for the peak's `Math.max` in `watchMemory` and for the observer each removed. The round re-ran finding 1's probe, finding 3's mutation and a mutation of each other fix in a clone of the branch at `7593607b` (`## Probes`).

Scenario I's acceptance row (`frame/design.md:101`) asks for a duration above zero. The case at `apps/desktop/test/heavy-run.test.ts:152-153` now holds `startedAt <= released <= endedAt`, which a run of no length would pass. No behaviour the diff changed rests on it, so it is no finding.

## Findings

### 1. Scenario I's case leaves its command running forever where its wait for a reading fails

```seal
severity: should
location: `apps/desktop/test/heavy-run.test.ts:118`, `apps/desktop/test/heavy-run.test.ts:26`
evidence: executed `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/test_tmp_round2.test.ts test/machine-turns.test.ts test/heavy-run.test.ts test/chain-command.test.ts` in the round's clone, with the wait at `apps/desktop/test/heavy-run.test.ts:124` mutated to a threshold of 640 MiB and 8 seconds, then `pgrep -fl 'hold\.go'` and `ps -o pid,ppid,etime,rss,command`; read `apps/desktop/test/repositories.ts:32`, `apps/desktop/test/chain-run.ts:130`, `apps/desktop/test/daemon.test.ts:143`, `apps/desktop/src/daemon/chain-command.ts:570-576`
regression: round-1#4
```

Why it matters: the unit is scenario I's case, which `e03117aa` rewrote. Its command now holds the array until the case writes `$OUT/hold.go` (`heavy-run.test.ts:118`). The case writes that file only once its wait at `:124` has seen a reading above 64 MiB. Where that wait times out, the case fails and never writes the file.

`frame/plan.md` phase 3 asks for scenario I's line "with a command that holds memory for longer than one reading". The fix made the hold last until the case releases it, so the command's end now depends on the case reaching that write. The old command slept 6.5 seconds and ended by itself.

The cleanup then removes the fixture's whole folder (`repositories.ts:32`), `$OUT` among it, so `hold.go` can never appear. `runLine` starts the shell as a child of the test's process, not as a process group that anything stops (`chain-command.ts:572`). The probe made the wait fail. After vitest exited, the shell was still running:

- the shell had parent 1 and looped on `sleep 0.05`, about 20 starts a second, in a folder that no longer existed;
- its `python3` child held 80 MB, and would hold it for the 600 seconds it sleeps;
- vitest printed "close timed out after 10000ms" and "something prevents the main process from exiting".

The python child ends after 600 seconds. The shell never ends. The case exists to catch a failure under load. When it fails that way, it leaves a process that adds load until the machine restarts, which is the load issue #134 exists to bound. The repository's own stand-ins guard the same loop with `&& [ -e "$0" ]`, so it ends when its file is removed (`chain-run.ts:130`, `daemon.test.ts:143`).

The helper `holds` at `heavy-run.test.ts:26` has the same loop and the same cause. Phase 2 built it, and scenario C's case at `:50` uses it with `$OUT` set to the fixture's folder. The list came from `git grep -n 'while \[ ! -e'` over `apps/desktop/test`, so it is a sample. That search also found the gate commands at `apps/desktop/test/chain.test.ts:2430`, `apps/desktop/test/chain.test.ts:2474` and `apps/desktop/test/chain-command.test.ts:211`. Those run through `startGate`, which starts its own process group. This round did not read whether a stop at cleanup ends them, so they are not in this finding's location.

```ts
// apps/desktop/test/heavy-run.test.ts:25-26
/** A command that marks its start in `$OUT` with its name, waits until a file of that name ending `.go` stands there or `$OUT` is gone, and marks its end. */
const holds = (name: string): string => `touch "$OUT/${name}.started"; while [ -d "$OUT" ] && [ ! -e "$OUT/${name}.go" ]; do sleep 0.05; done; touch "$OUT/${name}.ended"`;

// apps/desktop/test/heavy-run.test.ts:117-118
    // The shell starts a child that holds 64 MiB until the case has seen a reading of the memory find it, so no reading's time decides the case. A case that fails before then removes `$OUT`, which ends the hold.
    naming(item.worktree, { hold: `python3 -c "b = bytearray(64 * 1024 * 1024); import time; time.sleep(600)" & while [ -d "$OUT" ] && [ ! -e "$OUT/hold.go" ]; do sleep 0.05; done; kill $!; exit 4` });
```

Precondition: `$OUT` is a folder the case's cleanup removes whole. In both cases it is `stood.made.base`, which `temporaryRepository`'s `remove` deletes (`repositories.ts:32`). A test process that dies before its cleanup runs removes nothing, and the snippet does not cover that. The fix is to be seen red with the round's probe: with the `[ -d "$OUT" ]` guard removed, `pgrep -fl 'hold\.go'` lists the shell after the run. With the guard in place, it lists nothing.

```seal
verdict: fixed f650e671
location: `apps/desktop/test/heavy-run.test.ts:26`, `apps/desktop/test/heavy-run.test.ts:118`, `apps/desktop/test/chain-command.test.ts:212`
answer: Both loops of `heavy-run.test.ts`, and the in-process gate command of `chain-command.test.ts:212`, which no daemon stops, now also end once `$OUT` or `$HOME` is gone; with each case forced to fail before its release, three looping shells were left without the guard and none with it. The daemon's gate commands at `chain.test.ts:2430` and `:2474` need no guard, since the daemon's close at cleanup stops their process group, and the same forced failure left none of them.
```

## Confirmations

```seal
confirms: round-1#1
```
What holds: the giver reads the load again once a second run's wait ends, gives that reading as the turn's `load`, and starts the turn's highest load from it through `Turn.restart` (`apps/desktop/src/daemon/turn-socket.ts:112-115`, `apps/desktop/src/daemon/machine-turns.ts:64`, `apps/desktop/src/daemon/machine-turns.ts:210`). Round 1's probe was written again as `test_tmp_round2.test.ts`. At `7593607b` the kept line read `{"waits":true,"load":2,"highestLoad":2,"over":false}`, where round 1 read 9, 9 and `true`. With the `restart` call removed, the new case of `apps/desktop/test/machine-turns.test.ts` failed at `:234` with `highest: 9` where it wants 3, and the probe failed too. Executed. The socket's `turn` message sends the same `turn.load` (`turn-socket.ts:275`). The two sentences of the earlier run read the first run's `turn.load`, which is no second run's (`apps/desktop/src/daemon/chain-command.ts:415`, `apps/desktop/src/daemon/daemon.ts:3570`). `machine-turns.ts:210` is the one place a `Turn` is built (`git grep -n "highest: () =>"`, executed). Read. The framer's fold of `frame/design.md:121` and `:123` states what the code does. Read.

```seal
confirms: round-1#2
```
What holds: `run` copies the environment and deletes `ELECTRON_RUN_AS_NODE` before the command starts (`apps/desktop/src/daemon/chain-command.ts:600-605`). With the `delete` removed, the new case of `apps/desktop/test/heavy-run.test.ts` failed at `:201` with `expected '1' to be 'unset'`. Executed. The answer says the command's other children are `git` and `ps`, and that `gate` already runs through `gateEnvironment`. `grep -n "spawn\|execFile\|startGate"` over `chain-command.ts` lists `git` at `:112`, `startGate` with `gateEnvironment` at `:400`, and `runLine` at `:572`. `watchMemory`'s `ps` lives in `heavy-runs.ts`. Executed. The comment names `pty.ts#terminalEnv`, which stands at `apps/desktop/src/daemon/pty.ts:62`. Read.

```seal
confirms: round-1#3
```
What holds: round 1's mutation, `const ended = !alone && ran !== null ? endedWith(end, late) : null;` at `apps/desktop/src/daemon/chain-command.ts:414`, now fails the case at `apps/desktop/test/chain-command.test.ts:245`, the calm gate's assertion. Executed. The case's new name names scenarios F, G and H. Read.

```seal
confirms: round-1#4
```
What holds: `watchMemory` hands each reading that found the process to an observer once it is kept (`apps/desktop/src/daemon/heavy-runs.ts:113-125`). `CommandContext.memoryRead` passes the observer through `run` and `runLine` (`apps/desktop/src/daemon/chain-command.ts:62-63`, `:570-573`, `:605`). The case waits on a reading above 64 MiB before it releases the hold, so no reading's time decides it. Read. It passed at `7593607b`. Executed. The title at `apps/desktop/test/heavy-run.test.ts:113` and the row at `gaps.md:11` were rewritten, and the row is marked closed. Read. The release the fix added leaves the command running where the case fails, which is finding 1 of this round.

```seal
confirms: round-1#5
```
What holds: `frame/design.md` *Rule changes* holds no operation on `docs/design.md`. *Scope* item 13 says this pull request rewrites the row in place. Read. `git grep -c "Heavy commands at once" -- docs/design.md docs/design.ko.md` prints 1 for each edition. Executed.

```seal
confirms: round-1#6
```
What holds: the comment of `setCaps` names a limit on heavy commands over the machine's cores "where it read them" (`apps/desktop/src/shared/protocol.ts:945`). That matches `capRefusal`, which bounds the limit only where `cores` is given (`apps/desktop/src/shared/machine.ts:173-178`), and the daemon passes `this.reading?.cores` (`apps/desktop/src/daemon/daemon.ts:1654`). The comment of `machine` names the queue of heavy commands (`apps/desktop/src/shared/protocol.ts:988`). Read.

```seal
confirms: round-1#7
```
What holds: *Scope* item 14 and the key's example in *Data & interfaces* name `test`, `test:app` and `install` (`frame/design.md:74`, `frame/design.md:112`). `frame/plan.md` phase 4 now cites the commands item 14 names. The case at `apps/desktop/test/records-place.test.ts:197` is named for three and asserts three at `:215`. Read. It passed at `7593607b`. Executed.

What matched: each new case of the fix diff was read against its group. The giver's case in `apps/desktop/test/machine-turns.test.ts:221` stands beside the calm wait's cases, as round 1 asked. No earlier case read a second run's kept line. The runner's case at `apps/desktop/test/heavy-run.test.ts:196` is the only one that gives the runner an environment of its own. The calm gate at `apps/desktop/test/chain-command.test.ts:240-246` is the chain command's first case of scenario G. No test file declares `TARGET` (`grep -n TARGET`, executed), so no pairs were read. Read.

What matched: `gaps.md:7` labels the whole suite, the typecheck and the rest of the `Broad gate` command `unverified`, now after round 1's fix pass too, with the orchestrator to answer. That label is honest: no record of the fix pass claims a run of the whole suite. Read.

What matched: `changelog.md:11` says the line keeps "the load at its start and the highest during it". After `6fc85e03` that holds for a second run too. Read.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The whole desktop suite, the repository-wide typecheck, among them whether `Turn` with its new member `restart` and the copied environment of `run` type-check, and the rest of the `Broad gate` command at `7593607b`. Rule 2 of the agent contract keeps them from this round | `seal/config.json:5` | the orchestrator, at the broad run |
| Whether scenario I's case holds under the broad gate's load, which `gaps.md:11` hands on | `seal/threads/1795559735-heavy-commands-wait-their-turn/gaps.md:11` | the orchestrator, at the broad gate |
| The rows of `gaps.md` on the built app's pane, display, second run and inbox line, which the fix diff left as they were | `seal/threads/1795559735-heavy-commands-wait-their-turn/gaps.md:8-10`, `seal/threads/1795559735-heavy-commands-wait-their-turn/gaps.md:12` | the orchestrator, as each row names |
| Q13, Q14, Q15 and Q17, which stand open as round 1 left them | `seal/threads/1795559735-heavy-commands-wait-their-turn/frame/questions.md:34-38` | the owner, or the measurement each row names |
| The daemon's scenario G. Finding 3's fix touched only the chain command's file, so the daemon's case was not mutated again | `apps/desktop/test/chain.test.ts` | nobody this release: no fix touched it, and the phase 3 mutations stand |
| Whether a stop at cleanup ends the gate commands of `chain.test.ts:2430`, `chain.test.ts:2474` and `chain-command.test.ts:211`, which wait on a `.go` file in a removed folder as finding 1's do | `apps/desktop/test/chain.test.ts:2430`, `apps/desktop/test/chain-command.test.ts:211` | the fix pass of finding 1, by reading `gate.ts#startGate`'s stop at a case's cleanup |

## Probes

| Command | Result |
|---|---|
| `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/test_tmp_round2.test.ts test/machine-turns.test.ts test/heavy-run.test.ts test/chain-command.test.ts test/records-place.test.ts`, in the round's clone at `7593607b` | 5 files, 67 of 67 cases passed. The probe's kept line read `{"waits":true,"load":2,"highestLoad":2,"over":false}` |
| The same command without `test/records-place.test.ts`, in the same clone with four mutations: the `given.restart(load)` call of `turn-socket.ts:114` removed, the `delete env.ELECTRON_RUN_AS_NODE` of `chain-command.ts:602` removed, round 1's mutation of `chain-command.ts:414`, and the wait at `heavy-run.test.ts:124` given a threshold of 640 MiB and 8 seconds | 5 of 36 cases failed, each at its own line: the probe; `machine-turns.test.ts:234`, `highest: 9` for 3; `heavy-run.test.ts:201`, `'1'` for `'unset'`; `chain-command.test.ts:245`; and `heavy-run.test.ts:124`, `timed out`. vitest printed "close timed out after 10000ms" |
| `pgrep -fl 'hold\.go'` before and after that run, then `ps -o pid,ppid,etime,rss,command` on what it listed | Nothing before. After: one shell running `python3 ... while [ ! -e "$OUT/hold.go" ] ...` with parent 1, running `sleep 0.05`, with a `python3` child of 80 MB resident memory, in a folder that no longer existed. The round stopped both by their process ids |
