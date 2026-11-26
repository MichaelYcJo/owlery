# Review round 1: 1795653549-246-a-panes-chain-stops-at-the-round-ceiling

```seal
target: 06aaf735 against release/v0.0.5
```

The base is `release/v0.0.5` at `9f9ba1da`, which is the merge base of the target. This is round 1, so no earlier round handed over a coordinate or a verdict. Every fact below was established in this round.

The round read these records whole at `06aaf735`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `pr.md` and `trail/phases/phase-1.md`. `seal/config.json` names English for both `Record language` and `Commit and pull request language`, so no `pr.<lang>.md` is owed, and none stands. No `seal/parity.json` stands, so no parity comparison was owed. The code under review is the diff `9f9ba1da..06aaf735` under `apps/`, together with the one-line change to #236's `changelog.md`.

## Findings

### 1. No case reaches the ceiling at the command's own default, so a pane can ship with no ceiling and every case stays green

```seal
severity: should
location: `apps/desktop/test/chain-command.test.ts:166-207`, `apps/desktop/src/daemon/chain-command.ts:273`
evidence: executed `node scripts/test-in-electron.mjs test/chain-command.test.ts` in `apps/desktop`, with `chain-command.ts:273` patched so that `ceilingOf` falls back to `Number.POSITIVE_INFINITY` in place of `ROUNDS_CEILING`: exit 0, 19 of 19 cases passed; executed `git grep -n -F 'ROUNDS_CEILING' -- apps/desktop/test`, which prints `chain.test.ts:19` and `chain.test.ts:439` alone
```

Why it matters: Issue #246 is the bound on a pane's rounds, and that bound is the fallback at `chain-command.ts:273`: `context.roundsCeiling ?? ROUNDS_CEILING`. The built command never passes `roundsCeiling`. `chain-main.ts` builds its context with no such key, as `frame/design.md` *Scope* item 4 says it should ("`chain-main.ts` passes none"). So in a real pane the ceiling the person meets is the fallback alone.

Every new case passes `roundsCeiling: 2` (`chain-command.test.ts:167` and `:194`). No case runs the command with the ceiling left out. The probe removed the fallback, and every case of the command's module still passed. The pane would then go back to having no ceiling, which is the defect the issue names, and nothing would refuse it.

*Scope* item 4 states this as a fact of the frame ("The command reads `chain.ts#ROUNDS_CEILING`"), and *Scope* item 8 puts the cases of items 1 to 5 into `chain-command.test.ts`. So this is the *Regression test* row's `should` (`skills/code-review/SKILL.md` *Probes and regression tests*): the diff changes a behaviour, and no case holds it. The phase's ten mutants (`trail/phases/phase-1.md:24-36`) include "`roundsCeiling` ignored". That mutant checks the other direction: a context that names a ceiling is obeyed. None of the ten drops the default.

`chain.test.ts:439` pins `ROUNDS_CEILING` at 6, but only for the daemon. It does not pin that the command reads that constant.

The fix is one more case in the group of the two new ceiling cases, with `ROUNDS_CEILING` added to the file's import from `../src/daemon/chain` (`chain-command.test.ts:8`). It reuses the helper `findingTo` that the diff added. It was seen red by this round's probe, which is the mutant the case names. The fix pass shows it red again with only the fallback removed, as contract rule 15 asks.

```ts
// chain-command.test.ts:8: add ROUNDS_CEILING to the import from "../src/daemon/chain".
import { BASE_RECORDED, ROUNDS_CEILING, earlierRunSays, stoppedSays, twiceFailedWhy } from "../src/daemon/chain";

// After the case at :193, in `describe("the chain command", ...)`.
it("stops at the daemon's ceiling of rounds where the command's context names none, as the built command runs (issue #246)", async () => {
  const on = commandOn(cleanups);
  await findingTo(on, ROUNDS_CEILING);
  expect(await on.said(["owed"])).toEqual({ step: "ceiling", round: ROUNDS_CEILING, ceiling: ROUNDS_CEILING, open: [1] });
});
```

```seal
verdict: fixed 95d3c2f3
answer: The finding holds, read: `chain-main.ts` passes no `roundsCeiling`, so a pane meets only the fallback at `chain-command.ts:273`, and every case of the command named a ceiling of 2. `95d3c2f3` applies the paste-ready case after the refusal case, in the group of the two ceiling cases, and adds `ROUNDS_CEILING` to the file's import from `../src/daemon/chain`. The fix reads true against `frame/design.md` *Scope* item 4 and *Data & interfaces*: the command reads `ROUNDS_CEILING` where its context names no ceiling. The case's title adds "and hands each fix pass below it". The helper `findingTo` already asserts that `owed` hands the step `fix-pass` at each round below the ceiling, so a fallback lower than `ROUNDS_CEILING` fails as well. No unit is added, since only the tests read the new case. Seen red (executed, at `95d3c2f3`): `seal mutate src/daemon/chain-command.ts --replace "context.roundsCeiling ?? ROUNDS_CEILING" "context.roundsCeiling ?? Number.POSITIVE_INFINITY" --tests "node scripts/test-in-electron.mjs test/chain-command.test.ts -t \"context names none\""` reported `red`, exit 0. The failing line is the new case's last `expect`, which got the step `fix-pass` of round 6 where `ceiling` was expected. That is the removed default. The file was restored from the held bytes, and `git status --short` printed nothing. Narrow set (executed, at `95d3c2f3`): `node scripts/test-in-electron.mjs test/chain-command.test.ts` in `apps/desktop`, exit 0, 20 of 20 passed. This fix changes only that file, which no other test file imports. The read of the range and the records (read, after `95d3c2f3`): `git diff 06aaf735..HEAD` holds this case and the round record. `routing.md`, the three frame files, `gaps.md` and `changelog.md` were read whole, and none states anything HEAD contradicts. The fix changes no shipped behaviour, so `changelog.md` and `gaps.md` stay as they read. The search for the fact (executed): `git grep -n -e 'roundsCeiling' -e 'ceiling of 2' -e 'default ceiling' -e 'low round'` over the work item's directory and `apps/desktop/test`, round records left out. It prints `chain-command.test.ts:167` and `:194`, which name a ceiling of 2 as their cases ask. It prints `chain.test.ts:1978`, the daemon's case. It prints `frame/design.md:22`, `:38`, `:52`, `:62` and `:88`, each of which still reads true. It prints `trail/phases/phase-1.md:15` and `:31`, which record phase 1 at `68ebf8fe`, and a fix pass writes no phase record. That search is a sample: a statement in other words was not reached.
```

## Confirmations

What matched: *Scope* item 1. `owed` asks `chain.ts#gateBefore` through one function, `ceilingStops` (`chain-command.ts:285-287`). It passes no stored stage, `judged: true` and `first: word === step.round`. Where the answer is `ceiling`, it returns `{ step, round, ceiling, open }` (`:311`) before `handed` runs, so no prompt or rules file is written. The command makes no comparison of a round with the ceiling of its own. I read `gateBefore` (`chain.ts:463-470`) for these inputs. With no stages, `passedBefore` is false. A round at or past the ceiling then answers `ceiling` unless `first` is true, and `judged: true` makes every round below the ceiling answer `none`. So the claim in the doc comment at `chain.ts:455-457`, that the command is answered the ceiling or nothing, holds. Read.

What matched: *Scope* items 2 and 3. `personsWord` (`chain-command.ts:265-270`) refuses any value that does not match `^[1-9]\d*$` and gives the usage. `fixPass` (`:374-383`) checks `--by`, then the form of the word, then the step it owes. After that comes the ceiling check, which throws the sentence of `ceilingRefusesSays` before `fixPassStage` runs. So a refusal commits nothing and leaves the close blocks in the worktree, which `chain-command.test.ts:193-207` pins with ` M <record>`. The frame's acceptance rows are all held by cases: the stop, the absence of any change below the ceiling, the person's word, a word for another round, a word for the next round, the refusal of a pass past the stop, an unattended run, and a value that is no round number. They sit at `chain-command.test.ts:166-191`, `:193-207` and `:508-521`. Executed: `node scripts/test-in-electron.mjs test/chain-command.test.ts test/role-bundle.test.ts -t "the chain command|the role bundle"` in `apps/desktop`, exit 0, 35 passed and 4 skipped. The skipped cases are the built-app groups, which the `-t` pattern leaves out.

What matched: the claim that standing is read at the head and not from the worktree. `chain.ts#standingOf` (`:506-521`) reads each round record through `fileAt(worktree, head, ...)`. So close blocks that a pass appended but did not commit do not empty `open`, and they do not let a pass slip past the ceiling check in `fix-pass`. Read.

What matched: *Scope* items 6 and 7. In `role-bundle/skills/seal/SKILL.md`, the `ceiling` row stands at line 43, the *What you judge* bullet at `:90-95` and the *Automation* paragraph at `:112-114`. Each says what *Scope* item 6 asks. `orchestrator.md:118-119` names both launches. `role-bundle.test.ts:163-175` pins each new sentence, and `:104` adds `--persons-word <round>` to the list. The new text never uses "the daemon's chain", which `role-bundle.test.ts:156-159` refuses. Read and executed in the run above.

What matched: *Scope* items 9 and 11. The comments at `chain.ts:52`, `chain.ts:440-457` and `chain-command.ts:1-14` now name the command, and so do the new docs of `owed` and `fixPass`. Executed: `git grep -n -i 'no ceiling' -- seal docs apps` at the target finds no fragment or policy line that says a pane applies no ceiling. It does find #236's frame and records (`frame/questions.md:18`, `pr.md:11` and others), which state what that work item did at its own commit, as *Scope* item 11 leaves them. The #236 bullet lost only its last sentence (`seal/threads/1795610868-236-a-shrinking-reopen-does-not-stop-the-chain/changelog.md:10`). Read in the diff.

What matched: the account in `trail/phases/phase-1.md`. Its claim that `owed` had no doc comment at `740b9d93` holds, because the diff adds one and removes no line there. Its claim about which test files import `chain-command.ts` or `chain-command-run.ts` holds as well. Executed: `grep -l` over `apps/desktop/test/*.ts` names `chain-command-run.ts`, `chain-command.test.ts`, `heavy-run.test.ts`, `pr-check.test.ts` and `role-bundle.test.ts`, which is the phase's set without `chain.test.ts`, and the phase ran `chain.test.ts` beside them. The phase's run of 240 cases and its 18 mutants are claims that this round did not re-run. The label `unverified` that `gaps.md:9` puts on the suite, the typecheck and the broad gate is honest: the phase names what it ran and leaves the rest to the orchestrator's broad run.

What matched: the frame's rule change. Its `from:` sentences stand word for word in `docs/architecture.md:311` and `docs/architecture.ko.md:311`. Executed with `grep -n -F`. #235's unsettled rule changes edit other sentences and the `check:` line of the same paragraph (`seal/threads/1795610687-235-stage-prompts-name-the-worktree/frame/design.md:68-90`), so the two `from:` texts do not overlap. `chain_check.py --worktree` printed no notice of a test pin or a copy at this work item's `frame/design.md`.

What matched: `changelog.md` and `pr.md` agree with the code and the frame. The quotes in `pr.md` match *Scope* items 1 to 5 and 11, and Q1 with its default, word for word. Read.

A note outside the findings, as a coordinate for the sealer and not a defect at this target: #150's frame on its own branch (`b1788ed`, framed after this frame's `fc4ea7b6`) names #246 in its *Overlap* table as touching `chain-command.ts`, and answers "Either" for which merges first. This work's `frame/plan.md:45` says that #150 had no frame yet and does not meet this work. That was true at the framer's read. At the target, `chain-command.ts` holds no call of `commitRecords` (executed: `grep -n commitRecords`), so neither item constrains the order of merging.

## Not judged

| What | Location | Who answers |
|---|---|---|
| Whether a real pane's session stops at the step `ceiling`, tells the person, and passes `--persons-word` only after the person's word, under `Automation` `yes` as well. No real `claude` session ran in this round. | `gaps.md:7`, `frame/questions.md` Q2 | The owner's walk (#184) |
| Whether a bound that the session passes by typing the person's word is enough (`frame/questions.md` Q1, built on its default) | `frame/questions.md:17` | The owner |
| The full suite, the repository's typecheck and the broad gate at the head. This round ran one narrow set and one probe, and no built-app file. | `gaps.md:9` | The orchestrator's broad run |

## Probes

| Command | Result |
|---|---|
| `node scripts/test-in-electron.mjs test/chain-command.test.ts`, in `apps/desktop`, with `chain-command.ts:273` patched by the `Edit` tool so that the fallback ceiling is `Number.POSITIVE_INFINITY` | Exit 0, 19 of 19 cases passed. No case of the command's module notices a pane that has no default ceiling. The patch was reverted with the `Edit` tool, and `git status --short` then printed nothing. |
