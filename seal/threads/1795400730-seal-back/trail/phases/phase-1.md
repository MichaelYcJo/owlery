# Phase 1: 1795400730-seal-back

## What this phase found

**The frame holds for this phase.** Every coordinate `frame/design.md` *Scope* items 1 and 2 and `frame/plan.md` *Technical context* name for the ledger and the chain's run stood at the build's base `90184d5` (read): `protocol.ts#LedgerEntry` at line 521, `ledger.ts#entryOf`, `daemon.ts#beginHeadless` at line 1630, its call in the `ask` case at line 1247 and in `#runStage` at line 2301, `#enter` at line 1694 and the gate's `Ledger#add` in `#runGate` at line 2609. `daemon.ts#runPullRequest` holds no call of `Ledger#add`, so the pull request stage writes no entry, as *Scope* item 2 says. No other place builds a `LedgerEntry`: `pnpm run typecheck`, which reads `src` and `test`, passed once the field was required (executed).

**The spawn named this phase and its scenarios otherwise than the plan does.** The spawn called the phase "The ledger names the round" and named scenarios 1, 2 and 21. `frame/plan.md` *Phases* names it "The ledger names the chain's stage", verified by scenarios 1 and 2, and puts scenario 21 in phase 2, since its *Verifiable how* is a case of `test/seal-back.test.ts`, which composes the back. This phase built to the plan, which ranks above the spawn (plugin `skills/implement/SKILL.md` *1. Read the documents that outrank the code first*). What scenario 21 needs of the ledger, a ruling's entry told from a judgment's of the same round and pair, is the ruling clause of scenario 1, and the case below pins it.

**One departure from scenario 1's *Given*.** The scenario's chain runs through the fake adapter "told to report a usage". The case that holds it, the first case of "a work item's chain" in `test/chain.test.ts`, runs with an adapter that reports no usage. The field `chain` is written from the stage and reads nothing of the usage, so a usage would add nothing the case could fail on. Scenario 16, in phase 4, is where a usage is summed.

**Decisions made while building, each with its grounds.**

- **`beginHeadless` takes the chain's stage as its fourth parameter, after the role.** It is typed `LedgerEntry["chain"]`: `{ kind, round }` from `runStage`, and null from the `ask` case. `HeadlessSession` keeps it as `chain`, beside `repo` and `branch`, and `enter` writes it. Judged against `frame/design.md` *Scope* item 2.
- **A whole round is a whole number of 0 or more.** `ledger.ts#chainOf` reads `chain` as null where the line holds none or holds null, and as a kind of `CHAIN_STAGE_KINDS` with a round that `Number.isInteger` takes and that is not below 0. Any other value makes the line no entry. Round 0 is read, since no document names a first round for the ledger and the store's reader of a chain's stage takes any number (`chain.ts#isChainStage`). Judged against `frame/design.md` *Data & interfaces*, the bullet on `ledger.ts`, "a whole number".
- **The round's rule is one type predicate, `isWhole`.** The first commit, `5c1c88e`, tested `typeof round !== "number"` before `Number.isInteger(round)`. `Number.isInteger` already refuses a value that is no number, so the first test refused nothing of its own and a mutant that removed it could not go red. The second commit, `abb63f4`, puts the rule in one predicate, so that each part of it refuses a line the case holds.
- **`chain` stands after `stage` in each line the daemon writes.** The cases of `test/daemon.test.ts` compare the file's text with `JSON.stringify` of an entry they build, so the order of the fields is part of what they pin.
- **The cases were added to their groups, and no case was written new.** Each scenario's clause has a case whose group already holds it:
  - Scenario 1, the chain: the first case of "a work item's chain" in `test/chain.test.ts` runs round 1, a fix pass, round 2, the gate and the seal, and now reads the five entries' `stage` and `chain`. The gate's case "runs the repository's command once the rounds settle" pins the gate's whole entry, which now holds `{ kind: "gate", round: 1 }`.
  - Scenario 1, the ruling: the case "has a proofer's question ruled on before the fix pass" runs a ruling and a judgment after round 2, both as the orchestrator's one pair, and now reads that their entries name `ruling` 2 and `judgment` 2.
  - Scenario 1, the `ask`: the case "keeps one entry for each session that ends, with a role and without" of `test/daemon.test.ts` now holds `chain: null` for both entries, and its list of an entry's fields holds `chain`. The case "outlives the daemon" holds `chain: null` in the line it compares.
  - Scenario 2: the case "reads as an entry only a line with every field in its type" of `test/ledger.test.ts` now holds eight lines whose `chain` is of another shape, which it counts as unread, lines of each kind it reads, a `chain` with a field the protocol does not name, and a line with every field but `chain`, which it reads with `chain` null. The helper `entry` of that file gives each entry `chain`, so every other case of the file round-trips the field.

**How the cases were seen red.** Executed, against the code at `90184d5`, after the cases were written and before any source change, through the Electron lock, with `pnpm test test/ledger.test.ts test/daemon.test.ts test/chain.test.ts -t "Ledger|the ledger|runs two rounds, one fix pass|has a proofer's question ruled|runs the repository's command once the rounds settle"`: 14 failed and 12 passed. Each failure is on a line that reads `chain`. In `test/chain.test.ts` the three cases failed at lines 937, 1895 and 2181, the new reads of the ledger. In `test/daemon.test.ts` the two cases failed at lines 5298 and 5319, the entries with `chain: null`. In `test/ledger.test.ts` 9 of 11 cases failed, where the old reader dropped `chain` from what it gave or took a line whose `chain` was of another shape.

**Mutation runs.** Executed with `seal mutate`, one mutant to a run, after the commits `5c1c88e` and `abb63f4`. Every mutant was red, and each run's failing cases were read.

| File | Mutant | Red in |
|---|---|---|
| `ledger.ts` | an absent `chain` no longer read as null | the case of scenario 2, on the line an earlier build wrote |
| `ledger.ts` | the kind's test removed | the same case, on the kind `build` |
| `ledger.ts` | `Number.isInteger` replaced by a test of the type | the same case, on the round 1.5 |
| `ledger.ts` | `>= 0` made `> 0` | the same case, on the gate's round 0 |
| `ledger.ts` | the test of the round's sign removed | the same case, on the round -1 |
| `ledger.ts` | `chain === undefined` removed from `entryOf` | the same case, on the unread count |
| `ledger.ts` | the value returned whole in place of `{ kind, round }` | the same case, on the field `more` |
| `daemon.ts` | `enter` writes `chain: null` | the two cases of a chain in `test/chain.test.ts` |
| `daemon.ts` | `runStage` hands the kind `round` for every stage | the same two cases |
| `daemon.ts` | `runStage` hands the round 1 for every stage | the same two cases |
| `daemon.ts` | the `ask` case hands round 1 in place of null | the two ledger cases of `test/daemon.test.ts` |
| `daemon.ts` | the gate's entry names no chain's stage | the first chain case and the gate's case |
| `daemon.ts` | the gate's entry names round 1 | the first chain case, whose gate follows round 2 |
| `daemon.ts` | the session keeps no `chain` | the two ledger cases of `test/daemon.test.ts` and the two chain cases |

The `ledger.ts` mutants ran `pnpm test test/ledger.test.ts` and the `daemon.ts` ones `pnpm test test/daemon.test.ts test/chain.test.ts -t` with the pattern above, each through the Electron lock. One earlier attempt of two `ledger.ts` mutants split each pair on `|`, which the code holds, so the file it wrote did not parse and the red it gave measured nothing. Those two were run again with whole pairs, and the table holds those runs.

**The phase's narrow run.** Executed at `abb63f4`, in `apps/desktop`, through the Electron lock: `pnpm test test/ledger.test.ts test/daemon.test.ts test/chain.test.ts test/gate.test.ts test/pr-check.test.ts test/pull-request.test.ts test/seal-state.test.ts`. 7 files and 562 cases passed, in 329 s. The set is the three files the phase changed and each other file that imports `daemon.ts`, directly or through `test/chain-run.ts`, and starts no built app (executed: `git grep -l -E 'src/daemon/daemon"|from "\./chain-run"' -- test`, less the files that call `BuiltApp`). `test/role-session.test.ts` imports it too and is left out, since without its two variables every case of it is skipped and it would examine nothing. The files that start the built app, and those that read `protocol.ts` alone, were not run, and `gaps.md` holds them. The repository names no tree-wide test files: it holds no contribution guide, and no test file globs `src/daemon` or `src/shared`.

**What phase 2 needs.** An entry whose `chain` is null is a session outside the chain. The pull request stage has no entry. The gate's entry names the kind `gate` with the round `runGate` is given, the last round recorded. A ruling on a sealer's question carries the seal's round, and stands after the sealer's entry in the ledger, since `Ledger#read` gives entries in the order they were added, which is the order the stages ended.
