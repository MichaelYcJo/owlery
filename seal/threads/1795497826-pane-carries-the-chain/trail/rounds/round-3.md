# Review round 3: 1795497826-pane-carries-the-chain

```seal
target: 2da4f80, fixes b21a217..2da4f80
```

The range is `b21a217..2da4f80`. `1ea808e` adds one case to `apps/desktop/test/chain-command.test.ts` and closes round 2's finding 1. `2da4f80` commits the close block. No code changed, so the case is the one unit this round reviews.

Carried from round 2 without a fresh check: where the two arms of `baseOf` stand (`apps/desktop/src/daemon/chain.ts:287-288`) and where the sealer's diff is taken (`apps/desktop/src/daemon/stage-records.ts:304`). The verdict was reached again at `2da4f80`: the case was run at the head and against one mutant for each of its two claims.

## Findings

None.

## Confirmations

```seal
confirms: round-2#1
```
What holds: the case round 2 proposed stands at `chain-command.test.ts:248`, word for word as the record gave it.

Executed in the round's clone at `2da4f80`:

- The case passed at the head (Probes, row 1).
- With the branch arm of `chain.ts:288` returning the base branch's tip, the case failed at line 259. `owed` was refused with "The branch no longer holds c42dcfa, ..." and `BASE_RECORDED` (row 2). The fix pass claimed this, and this round saw it.
- With the diff the sealer is handed taken from the tip instead of the last shared commit (`stage-records.ts:304`, `diffBetween(..., true)` changed to `false`), the case failed at line 263, on "not to contain 'other.txt'" (row 3).

So each of the case's two claims fails when its own guard is removed, and the failing line names that guard.

The case was read against its group. The case at `:225` follows a recorded branch that did not move. The case at `:191` refuses a recorded commit the branch left. This case holds the one fact neither holds: a recorded branch that gained a commit the branch does not hold is still read from the commit the two last shared, by the step owed and by the sealer's diff.

What matched: the records that state the present were not changed by `b21a217..2da4f80`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md` and `pr.md`. `git diff --stat fabfd9e..2da4f80` over the work item's directory, without `trail/`, printed nothing. Round 2 read each of them whole at `fabfd9e`, and the one change since then is a case, which no sentence of them contradicts.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The whole suite, the repository-wide typecheck and the document counts of the `Broad gate` command, at `2da4f80`. This round ran one case three times and no broad run. The label `unverified` stays honest | the whole tree | the orchestrator, at the broad gate |
| Round 1's rows of *Not judged* other than the broad gate. Each is outside this fix diff, and this round left each where round 1 put it | `trail/rounds/round-1.md` *Not judged* | as round 1 names: the orchestrator, and the owner at the walk of #184 |

## Probes

| Command | Result |
|---|---|
| `node scripts/test-in-electron.mjs test/chain-command.test.ts -t "goes on where the base branch round 1"`, in `apps/desktop` of the round's clone at `2da4f80` | 1 passed, 13 skipped |
| The same command, with the branch arm of `chain.ts:288` replaced by `commit` | 1 failed, at `chain-command.test.ts:259`: "owed was refused: The branch no longer holds c42dcfa, ..." with `BASE_RECORDED` |
| The same command, with `chain.ts` restored and `stage-records.ts:304` reading `diffBetween(worktree, base.reads, step.commit, false)` | 1 failed, at `chain-command.test.ts:263`: "expected 'Run 1 of the sealer on the work item ...' not to contain 'other.txt'" |
