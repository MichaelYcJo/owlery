# Review round 3: 1795559735-heavy-commands-wait-their-turn

```seal
target: fddb06c7, fixes 7593607b..fddb06c7
```

This is a verifying round. It reviewed every commit after round 2's target `7593607b`, up to HEAD `fddb06c7`. Those commits are round 2's record `8535cd5a`, the fix `f650e671`, the change to `gaps.md` line 7 at `c684e249`, and the fix pass's close of round 2 at `fddb06c7`. The base stays `origin/release/v0.0.4` at `5cb81763`. The fix diff touches `apps/desktop/test/heavy-run.test.ts`, `apps/desktop/test/chain-command.test.ts`, `gaps.md` and `trail/rounds/round-2.md` (`git diff --stat 7593607b..HEAD`, executed).

The round read `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md` and `pr.md` whole at `fddb06c7`. No `pr.<lang>.md` stands, because `seal/config.json` names English for the pull request. The fix diff changed no frame file, no phase record, `changelog.md` or `pr.md`. Each quote of `pr.md` cites a section that the fix diff did not touch. No sentence of these records is contradicted by the fix diff's tests. The one row the diff changed, `gaps.md:7`, now names the fix passes of rounds 1 and 2. That label is honest: no record claims a run of the whole suite after `f650e671`.

The round carried these facts from round 2 and did not establish them again: the coordinates of the giver, the keeper and the runner; the precondition that `$OUT` in both cases of `heavy-run.test.ts` is the fixture's base folder, which `repositories.ts:32` removes whole; and round 2's note that scenario I's duration bound at `heavy-run.test.ts:152-153` holds no length above zero. The round re-ran round 2's probe of finding 1 in its own clone at `fddb06c7`. It also forced each of the five gate and hold cases to fail before its release, with the guards in place and with them removed (`## Probes`).

The class of finding 1 was enumerated from the branch's diff: `git diff 5cb81763..HEAD -- apps/desktop` lists every added line holding `sleep`. Five are shell wait loops: `heavy-run.test.ts:26`, `heavy-run.test.ts:118`, `chain-command.test.ts:212`, `chain.test.ts:2430` and `chain.test.ts:2474`. No other added command sleeps or loops (executed). A loop that waits without `sleep` would escape this search, so the list is a sample. The loops of `daemon.test.ts:4597` and `daemon.test.ts:4732` stand at the base and are filed as issue #219. This round does not raise them.

## Findings

None. This round leaves no finding open. What comes due is the orchestrator's broad run, and then the sealer's spawn.

## Confirmations

```seal
confirms: round-2#1
```
What holds: the fix pass claimed that both loops of `heavy-run.test.ts` and the gate loop of `chain-command.test.ts` now end once their folder is gone. `heavy-run.test.ts:26` and `heavy-run.test.ts:118` loop `while [ -d "$OUT" ] && [ ! -e ... ]`, and `chain-command.test.ts:212` loops `while [ -d "$HOME" ] && [ ! -e "$HOME/go" ]`. Read. `commandOn` sets `HOME` to `made.base` and pushes `made.remove` as a cleanup (`apps/desktop/test/chain-command-run.ts:42-43`, `:57`). Read. The cleanups run in reverse order, so the turn server's close runs before the folder is removed. `TurnServer.close` destroys every connection and then resolves (`apps/desktop/src/daemon/turn-socket.ts:199-202`), so no cleanup waits on a command that still loops. Read. The round forced all five cases to fail before their release, at `heavy-run.test.ts:56`, `heavy-run.test.ts:124`, `chain-command.test.ts:216`, `chain.test.ts:2451` and `chain.test.ts:2487`. With the guards in place, no shell and no `python3` child was left, and vitest closed without a timeout. With the three guards removed, three shells were left with parent 1, one of them with an 80 MB `python3` child, and vitest printed "close timed out after 10000ms". Executed. That matches the fix pass's claim of three left without the guard and none with it. Unmutated, `heavy-run.test.ts` and `chain-command.test.ts` passed 24 of 24 at `fddb06c7`. Executed.

What matched: the fix pass judged that the gate loops of `chain.test.ts:2430` and `chain.test.ts:2474` need no guard, because the daemon's close stops each gate's process group at cleanup. `Daemon.close` calls `stopGate(id, "daemon", ...)` for every entry of `this.gates` and waits for each stop (`apps/desktop/src/daemon/daemon.ts:801-804`, `:812`). `gateRun` puts the gate into `this.gates` before it asks for a turn (`daemon.ts:3513`). A gate that still waits is aborted, and it checks `this.closed` before `startGate` runs (`daemon.ts:3746-3749`, `:3537`, `:3547`). A gate that runs is ended by `gate.process.stop()`, which signals the command's process group and kills it after a wait (`apps/desktop/src/daemon/gate.ts:83-84`, `:143-151`). `standing` pushes `d.close()` after the repository's removal, and `outside()` pushes the removal of `$OUT` before `standing` runs (`apps/desktop/test/chain-run.ts:298`, `:339`; `apps/desktop/test/chain.test.ts:2284-2287`). So the daemon closes before `$OUT` is removed. Read. In the forced failure of both `chain.test.ts` cases, which have no guard, no loop was left. Executed. Round 2's `## Not judged` row on these loops is answered by this.

What matched: the comments the fix added state what the code does. `heavy-run.test.ts:25` says nothing else stops the command, and round 2's probe left the shell under parent 1 after the run. `chain-command.test.ts:211` says the gate runs in this process with no daemon to stop it, and `commandOn` runs `chainCommand` in the test's own process. Read.

What matched: the fix diff adds no case, so no new test was read against its group. No test file declares `TARGET`, so no pairs were read.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The whole desktop suite, the repository-wide typecheck and the rest of the `Broad gate` command at `fddb06c7`. Rule 2 of the agent contract keeps them from this round | `seal/config.json:5`, `seal/threads/1795559735-heavy-commands-wait-their-turn/gaps.md:7` | the orchestrator, at the broad run |
| A test process that dies before its cleanups run removes no folder, so the guarded loops would still run. Round 2's snippet stated this precondition, and no case covers it | `apps/desktop/test/heavy-run.test.ts:26`, `apps/desktop/test/heavy-run.test.ts:118`, `apps/desktop/test/chain-command.test.ts:212` | nobody this release: it is a limit of the guard, not a behaviour the frame states |
| The rows of `gaps.md` on the built app's pane, display, second run, scenario I under load and the inbox line. The fix diff left them unchanged | `seal/threads/1795559735-heavy-commands-wait-their-turn/gaps.md:8-12` | the orchestrator, as each row names |
| Q13, Q14, Q15 and Q17, which are still open as earlier rounds left them | `seal/threads/1795559735-heavy-commands-wait-their-turn/frame/questions.md:34-38` | the owner, or the measurement each row names |

## Probes

| Command | Result |
|---|---|
| `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/heavy-run.test.ts test/chain-command.test.ts test/chain.test.ts -t 'scenario C\)\|scenario I\)\|scenarios F, G and H\|runs one broad gate at a time across repositories\|\(scenario F\)'`, in the round's clone at `fddb06c7`. Five cases were forced to fail before their release: `heavy-run.test.ts:56` wants a said line, `heavy-run.test.ts:124` wants 640 MiB within 8 seconds (round 2's mutation), and `chain-command.test.ts:216`, `chain.test.ts:2451` and `chain.test.ts:2487` each hold a failing `expect`. Then `pgrep -fl 'do sleep 0\.05'` and `pgrep -fl 'python3 -c "b = bytearray'` | 5 of 193 cases failed, 188 were skipped, and each failed at its probe line. vitest closed without a timeout. Neither `pgrep` listed anything |
| The same command and the same forced failures, with the `[ -d "$OUT" ]` guards of `heavy-run.test.ts:26` and `:118` and the `[ -d "$HOME" ]` guard of `chain-command.test.ts:212` removed. Then `ps -axo pid,ppid,etime,rss,command` | 5 cases failed at the same lines. vitest printed "close timed out after 10000ms" and "something prevents the main process from exiting". Three shells were left with parent 1: the `holds` loop, scenario I's loop with an 80 MB `python3` child, and the gate loop that waits on `$HOME/go`. None of `chain.test.ts`'s loops was left. The round stopped all four processes by their process ids |
| `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/heavy-run.test.ts test/chain-command.test.ts`, in the same clone restored to `fddb06c7` | 2 files, 24 of 24 cases passed. `pgrep -fl 'do sleep 0\.05'` listed nothing |
