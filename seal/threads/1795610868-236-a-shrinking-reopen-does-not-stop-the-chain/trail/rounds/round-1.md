# Review round 1: 1795610868-236-a-shrinking-reopen-does-not-stop-the-chain

```seal
target: 733a3b397fcbcf343261fb66dd7ee10d8fa5b676 against release/v0.0.5
```

The round read the branch against `release/v0.0.5` at `ab7a5730`. It read the diff of the three bundle files and `apps/desktop/test/role-bundle.test.ts`, and each record of the work item whole at the target: `routing.md`, the three frame files, `gaps.md`, `changelog.md`, `pr.md` and both phase records. No earlier round stands, so this round carries no fact from one, and every fact below was established in this round. No `seal/parity.json` stands, and the records language is English, so no `pr.<lang>.md` is owed.

## Findings

### 1. The exemption from the third signal takes records-only findings out of the last round's count alone, so a judge can still count them in the round before and read a heavier code round as converging

```seal
severity: should
location: `apps/desktop/role-bundle/agents/orchestrator.md:105-107`, `apps/desktop/test/role-bundle.test.ts:201`, `seal/threads/1795610868-236-a-shrinking-reopen-does-not-stop-the-chain/frame/design.md:39`, `seal/threads/1795610868-236-a-shrinking-reopen-does-not-stop-the-chain/changelog.md:8`
evidence: executed `git grep -n -F "last round's open findings" -- .`; read `apps/desktop/role-bundle/agents/orchestrator.md:96-97`, `apps/desktop/role-bundle/agents/orchestrator.md:102-107`
```

Why it matters: the third signal compares two counts. It holds where "The last round's open findings are no fewer and no lighter than those of the round before it" (`orchestrator.md:96-97`). The new paragraph says that a finding located in the records "is not counted among the last round's open findings" (`orchestrator.md:105-106`). It says nothing of the round before. So the sentence has two readings, and they give opposite answers. Take a round before that held one `should` finding in the code and two in the records, and a last round that holds one new `must` finding in the code at another location, with no `reopens:` line. Read literally, the last round counts one finding and the round before counts three, so the last round is fewer and the third signal does not hold. No other signal holds either, so the answer is `yes`. Read as both rounds' counts, each round counts one, and the last is heavier, so the third signal holds and the answer is `no`. A heavier round in the code is what the signal exists to stop on. The paragraph's own heading, "counts toward none of the first four signals", supports the second reading, and the sentence that applies it supports the first. The text that agents act on has to have one reading (the bundle's `skills/writing-style/SKILL.md` *에이전트와 검사가 읽는 글은 한 가지로만 읽히게 쓴다*). Its statements, listed by the `git grep` on the evidence line, a sample under contract rule 12: `orchestrator.md:106`, its pin at `role-bundle.test.ts:201`, *Scope* item 4 at `frame/design.md:39` ("not in the count of the last round's open findings"), which says what the work does and so states the present, and the changelog at `changelog.md:8` ("by the count of the last round's open findings"). The hit at `orchestrator.md:96` is the signal itself, and it stays. A statement of the fact in other words would escape the search.

```markdown
<!-- apps/desktop/role-bundle/agents/orchestrator.md, lines 104-107, replacing the sentence that opens "Such a finding holds no signal" -->
finding holds no signal by its `reopens:` line or its `regression:` line,
is counted neither among the last round's open findings nor among those of
the round before it, and is not one of two findings at one location or on
one rule of the frame two rounds in a row.
```

```ts
// apps/desktop/test/role-bundle.test.ts, line 201, the pin of the same sentence
      "Such a finding holds no signal by its `reopens:` line or its `regression:` line, is counted neither among the last round's open findings nor among those of the round before it, and is not one of two findings at one location or on one rule of the frame two rounds in a row.",
```

```markdown
<!-- frame/design.md line 39, Scope item 4: "not in the count of the last round's open findings" becomes -->
not in the count of open findings of the last round or of the round before it,

<!-- changelog.md line 8: "by the count of the last round's open findings" becomes -->
by the counts of open findings that the last round and the round before it are compared on,
```

The frame line is not the crafter's to write (`agents/crafter.md` *Before you hand back, ...*), so a crafter's pass names it for the orchestrator to fold, and a pane's session corrects it itself (`skills/implement/fix-pass.md` *The narrow set, then the read of the range*).

```seal
verdict: fixed 02b2302b
answer: `orchestrator.md:104-109` now says a finding located in the records "is counted neither among the last round's open findings nor among those of the round before it", and adds "So the third signal compares the findings of the two rounds that are located outside the records."; both sentences are pinned in the orchestrator's case (`role-bundle.test.ts:207-208`), and each went red in `seal mutate` with only its change undone, the first by restoring the old wording and the second by deleting it, each failing on its own pin (executed). `changelog.md:8` now names "the counts of open findings that the last round and the round before it are compared on" and says that the third signal compares the two rounds' findings outside the records. `frame/design.md` *Scope* item 4 was folded at `81d728a2`. The search the pass ran is the evidence line's `git grep -n -F "last round's open findings" -- .`, rerun at `02b2302b`, a sample: it prints `orchestrator.md:96`, the signal itself, which stands; `orchestrator.md:106` and `role-bundle.test.ts:207`, the new sentence and its pin; and this record's own lines. Beyond the finding's `location:` lines the pass corrected no place. For the orchestrator to fold: `frame/design.md:40`, *Scope* item 4, says "a round heavier in the code than the round before still holds it", where the third signal holds only where the last round's findings outside the records are no fewer and no lighter, so a last round of one `must` against a round before of two `should` is heavier and does not hold it; the changelog says "no fewer and no lighter".
```

### 2. The crafter is told to correct a fact at every place that states it, though its Job withholds the frame and the daemon drops what a crafter hands back, so the convergence rule's grounds fail for a crafter's pass

```seal
severity: should
location: `apps/desktop/role-bundle/agents/crafter.md:189-194`, `apps/desktop/role-bundle/agents/crafter.md:16-26`, `apps/desktop/role-bundle/agents/orchestrator.md:109-113`
evidence: read `apps/desktop/role-bundle/agents/crafter.md:16-26`, `apps/desktop/role-bundle/agents/crafter.md:179-194`, `apps/desktop/role-bundle/agents/orchestrator.md:109-113`, `apps/desktop/src/daemon/daemon.ts:3289-3302`, `apps/desktop/src/daemon/stage-records.ts:214-240`; executed `git show f131e16b^:seal/threads/1795591289-225-the-broad-gate-hands-a-panes-owlery/trail/rounds/round-2.md` and the same for `round-3.md`
```

Why it matters: the new sentence says that "a finding that corrects a fact ... is corrected at every place that states that fact" (`crafter.md:189-192`). Two sentences above it, the same rule says to fix "every statement HEAD contradicts in a file your *Job* lets you write", and to name each one "that stands in a file you do not write, `routing.md` or any line of the frame but your Status cell ... in the hand-back ... for the orchestrator to fold" (`crafter.md:179-183`). The *Job* names no frame line but the Status cell (`crafter.md:16-26`), and it ends "a write not named here is a write you do not make". The new sentence does not say which of the two governs a place that stands in the frame. So a crafter either writes the frame, against its Job, or names the place in its hand-back. In the daemon's chain the second path ends at once. `Daemon#runFixPass` hands the crafter's answer to `recordFixPass` (`daemon.ts:3293-3299`), and `recordFixPass` reads only its `asks` from it (`stage-records.ts:224`, `asksOf(given.answer)`). No party folds the rest. The frame is where such facts stand: #225's round 2 and round 3 findings were each located at `changelog.md` and `frame/design.md` (executed, the `git show` on the evidence line). The new paragraph of `orchestrator.md` stands its exemption on the claim that "the fix pass that closes it reads the work item's records whole and corrects the fact at every place that states it" (`orchestrator.md:109-112`). For a crafter's pass on a fact that the frame also states, under the reading the Job supports, that claim does not hold. The run then reopens the same finding until round 6, which `ROUNDS_CEILING` sets, as #225 did by hand. This is the stop the work removes, with no signal left to catch it. The pane's session is not affected, since `fix-pass.md:53-57` gives it every file of the work item's directory that the rule names.

The fix either gives the crafter the frame lines that state the corrected fact, or narrows the orchestrator's grounds to the pane's session and leaves the crafter's case as a signal. The first keeps the rule the work chose (`frame/plan.md` *Alternatives considered*, row B), so the snippet takes it:

```markdown
<!-- apps/desktop/role-bundle/agents/crafter.md, Job, lines 25-26, which follow "and in" at the end of line 24 -->
a fix pass one close block under each open finding and, where a finding
corrects a fact, each line of the work item's records that states that
fact, a line of the frame among them; a write not named here is a write
you do not make.

<!-- apps/desktop/role-bundle/agents/crafter.md, after the sentence that ends "which is a sample and is called one." at line 194 -->
A place in a line of the frame is corrected too, since your *Job* gives
you that line in a fix pass, and the close block's `answer:` of the
finding names it.
```

The fix pass owes a pin of each new sentence in the case at `apps/desktop/test/role-bundle.test.ts:157`, seen red with only its sentence deleted. Where the pass takes the second fix, the sentence at `orchestrator.md:109-112` and its pin at `role-bundle.test.ts:203` change instead. The other statements of "every place that states" that the `git grep -n -F "every place that states" -- .` of this round printed are `changelog.md:6`, `frame/design.md:37` and `pr.md:4`. Each stays true under the first fix, and `changelog.md:6` owes a clause that the crafter corrects a frame line in such a pass.

```seal
verdict: fixed 02b2302b
location: `apps/desktop/test/role-bundle.test.ts:168-173`, `seal/threads/1795610868-236-a-shrinking-reopen-does-not-stop-the-chain/changelog.md:6`
answer: The pass took the first fix, as `frame/design.md` *Scope* item 8 (folded at `81d728a2`) designs it, and `orchestrator.md:109-113` stays as it reads. `agents/crafter.md` *Job* (`:24-29`) now gives a fix pass "each line of the work item's records that states the fact a finding corrects, a line of the frame among them", to rewrite to what HEAD gives or remove, with no new account of what was built. In *Before you hand back, ...* the sentence that names what goes to the hand-back now says "`routing.md` or a line of the frame your *Job* does not give you" in place of "any line of the frame but your Status cell", which the new *Job* made false in a fix pass, and after "which is a sample and is called one." (`:196-201`) two sentences say that in a fix pass a place in a frame line is corrected too, and that each item the rule has the crafter name in the hand-back goes into the `answer:` of the finding's close block, or of the last close block, since no party of the owl chain folds a fix pass's hand-back. The five sentences are pinned in the case at `role-bundle.test.ts:157`, at `:168-173`, and each went red in one `seal mutate` batch with only its change undone, each failing on its own pin (executed). `changelog.md:6` gains the clause. The search the pass ran, a sample: `git grep -n -e "every place that states" -e "for the orchestrator to fold" -e "any line of the frame but" -- .`, and a grep of the bundle for "a write you do not make", "Status cell", "line of the frame" and "framer" with "writ" or "fold". Beyond the `location:` lines it corrected no place. Those that stand: `orchestrator.md:113`, which now holds for a crafter's pass; `changelog.md:6`, `pr.md:4`, `gaps.md:7` and `frame/design.md:18`, `:38`, `:44` and `:113`, which state the rule as the work now holds it or the tree at the commit they are dated to; and `skills/implement/SKILL.md:287` of the bundle, whose table names the framer as the writer of `frame/design.md`, which the correction of a line by a fix pass's maker, given by `agents/crafter.md` *Job* and `skills/implement/fix-pass.md`, does not make false. `docs/` holds no statement of the crafter's writes.
```

### 3. The changelog and the plan say the rule answers yes "before rounds 2 and 3", where the daemon asks after each of those rounds, before its fix pass

```seal
severity: should
location: `seal/threads/1795610868-236-a-shrinking-reopen-does-not-stop-the-chain/changelog.md:8`, `seal/threads/1795610868-236-a-shrinking-reopen-does-not-stop-the-chain/frame/plan.md:18`
evidence: executed `git grep -n -F "before rounds 2 and 3" -- .`; read `apps/desktop/src/daemon/chain.ts:721`, `apps/desktop/src/daemon/chain.ts:433-445`, `docs/architecture.md:320`
```

Why it matters: the changelog ends its bullet with "On records shaped like #225's run, the rule answers `converging: yes` before rounds 2 and 3" (`changelog.md:8`), and the plan's row B says "it gives `yes` before rounds 2 and 3, and no judgment is owed after round 4" (`plan.md:18`). The daemon asks the judgment after a round, before the fix pass on that round's record. `chain.ts#convergencePrompt` opens "The judgment after review round" (`chain.ts:721`), `gateBefore` returns nothing at round 1 (`chain.ts:433-445`), and `docs/architecture.md:320` says the daemon asks "before the fix pass on that round's record". No judgment is asked before round 2 runs. The same plan row writes "after round 4" for the judgment after round 4, so the row uses both conventions. The changelog fragment becomes the release note a person reads. The `git grep` on the evidence line printed these two places alone. It is a sample, and the design's Grounding row at `frame/design.md:23` already says "Before round 2's fix pass".

```markdown
<!-- changelog.md line 8, the last sentence -->
On records shaped like #225's run, the rule answers `converging: yes` after rounds 2 and 3, before the fix pass on each one's record.

<!-- frame/plan.md line 18, row B, the Verdict cell's third sentence -->
On #225's records it gives `yes` after rounds 2 and 3, before the fix pass on each one's record, and no judgment is owed after round 4.
```

The plan line is not the crafter's to write, so the orchestrator folds it from a crafter's hand-back.

```seal
verdict: fixed 02b2302b
answer: `changelog.md:8` now ends "the rule answers `converging: yes` after rounds 2 and 3, before the fix pass on each one's record", the paste-ready text. `frame/plan.md:18`, row B, was folded at `81d728a2` and reads the same. The search the pass ran is the evidence line's `git grep -n -F "before rounds 2 and 3" -- .`, rerun at `02b2302b`, a sample: it prints this record's own lines alone. Beyond the finding's `location:` lines the pass corrected no place; the read of the records found `changelog.md:3` ("before round 3's fix pass") and `changelog.md:10` ("before the fix pass on round 2 or a later round"), which already use the convention the fix takes.
```

### 4. The design's Grounding places `ROUNDS_CEILING = 6` at `chain.ts:50`, where line 50 is blank at the commit it is dated to

```seal
severity: should
location: `seal/threads/1795610868-236-a-shrinking-reopen-does-not-stop-the-chain/frame/design.md:10`
evidence: executed `git show 9325cb64:apps/desktop/src/daemon/chain.ts`, read at lines 46-52; executed `git grep -n -F "chain.ts:50" -- .`
```

Why it matters: *Grounding* is dated to `9325cb64`, and its row at `frame/design.md:10` cites "`ROUNDS_CEILING = 6` (`chain.ts:50`)". At `9325cb64`, and unchanged at the target, `chain.ts:46` holds `CHAIN_STAGES_KEPT = 50`, line 50 is blank, line 51 is the ceiling's comment, and `ROUNDS_CEILING = 6` stands at `chain.ts:52`. The name is right and the line is not, so a reader who opens the line finds another fact. The `git grep` printed this one place. `frame/plan.md:11` names the constant without a line.

```markdown
<!-- frame/design.md line 10 -->
`ROUNDS_CEILING = 6` (`chain.ts:52`)
```

```seal
verdict: fixed 81d728a2
answer: The framer's fold at `81d728a2` rewrote `frame/design.md:10` to cite `ROUNDS_CEILING = 6` at `chain.ts:52`, and the same row's `gateBefore` at `chain.ts:456-463`; this pass changed no line for it. The evidence line's `git grep -n -F "chain.ts:50" -- .`, rerun at `02b2302b`, prints this record's own lines alone, a sample.
```

## Confirmations

What matched: the claim of `trail/phases/phase-1.md` and *Scope* item 1 that the read now binds whoever makes the pass. `skills/implement/fix-pass.md:50-61` binds the crafter and a pane's session that records the pass with `--by the session`, and says what the crafter's *Job* and hand-back stand for in a pane. The makers of a fix pass form a closed set, listed from what can make one: `skills/implement/SKILL.md:410` ("the crafter's or a session's") and `skills/seal/SKILL.md:75-81` (`--by` takes the crafter's id or `the session`). The README's two launches show the only session that reads the bundle outside a role to be a pane's session (`apps/desktop/role-bundle/README.md:5-15`). The plan's search for "A crafter then" printed nothing (executed, exit 1). (read and executed)

What matched: *Scope* items 3 and 5 at `fix-pass.md:75-81` and `orchestrator.md:121-134`. The sentence "costs one stop and no work" is gone, and the plan's search printed nothing (executed, exit 1). The phase 2 departure, "before anything else stops it" in place of "before the ceiling", is grounded: `apps/desktop/src/daemon/chain-command.ts` applies no ceiling (the design's row; issue #246, executed `gh issue view 246`, open in release 0.0.6). The phase 2 claim that `role-bundle.test.ts:152` refuses "the daemon's chain" in the bundle holds (read). (read and executed)

What matched: the claims that each new pin was seen red with only its sentence deleted (`trail/phases/phase-1.md`, seven mutants; `trail/phases/phase-2.md`, eleven). This round did not re-run `seal mutate`. It counted each pinned sentence in its file, with each run of white space read as one space as the case reads it, and each of the eighteen occurs once (executed, a read script over `role-bundle.test.ts` and the three bundle files). So deleting one sentence leaves no second copy to keep its pin green. The new case of `the role bundle` at `role-bundle.test.ts:157` covers sentences no other case of its group pins, and the orchestrator's case keeps every pin it held at the base (read, `git diff ab7a5730..HEAD -- apps/desktop/test/role-bundle.test.ts`). (executed and read)

What matched: the design's *Grounding* on #225's run. Round 1's three findings stand at `frame/design.md:27`, `daemon.ts:285` and `changelog.md:3`/`:5`. Round 2's one finding at `changelog.md:3` and `frame/design.md:8` reopens round-1#3, and round 3's at `changelog.md:5` and `frame/design.md:10` reopens round-2#1. Round 4 raises none (executed, `git show f131e16b^:` of each record). The fix commits `17a73729`, `ca92695b` and `bf1b6bf6` changed the records alone, and `0d0b3e72` changed `daemon.ts` (executed, `git show --stat`). Under the new rule, read with finding 1's fix, both judgments of that run answer `yes`. The other dated code coordinates hold at `9325cb64`: `chain.ts:204-206`, `chain.ts:734`, `daemon.ts:3134` and `daemon.ts:3315` (executed). (executed)

What matched: the issues the records name. MichaelYcJo/AgenticSeal#1623 is open under the title *The paired AgenticSeal issue* gives, #246 is open in release 0.0.6 as `frame/plan.md` *Judgments of the run* says, and #245 is the heavy-run case's issue (executed, `gh issue view`). Each quote of `pr.md` stands in the frame at the coordinate it names (read). No sentence of `docs/` states the convergence signals or what a `no` costs, and `docs/architecture.md:301`, `:308` and `:320` stay true, which bears out `## Rule changes` (executed, `git grep -n -i -E "converg|reopen" -- docs README.md apps/desktop/role-bundle`, a sample). (executed and read)

`gaps.md` is new in this range, so no row of it left. Its row on `test/heavy-run.test.ts` scenario I is the machine's memory, filed as #245, and this round raises nothing on it.

## Not judged

| What | Location | Who answers |
|---|---|---|
| Whether the orchestrator and a pane's session, judging by the new text, answer `yes` on records shaped like #225's run and `no` on a code fix that did not hold, and whether a fix pass follows the new read and search | `seal/threads/1795610868-236-a-shrinking-reopen-does-not-stop-the-chain/gaps.md:7-8` | The owner's walk (#184) |
| The two built-app cases of `role-bundle.test.ts`, "is what the built daemon launches a role with" and "is what the built daemon launches a Claude Code pane on the owl chain with". In this round's run both failed before any assertion on the bundle, on the daemon's `posix_spawnp failed` in this round's sandbox, so the run says nothing of the diff. `trail/phases/phase-2.md` claims the end-of-phase built-app batch passed at `bfbc96a1`, and this round read that claim without running it | `apps/desktop/test/role-bundle.test.ts:340`, `apps/desktop/test/role-bundle.test.ts:375` | The orchestrator, in the built-app batch at the end of the fix pass |
| The whole suite, the repository-wide lint and the typecheck at the target, `unverified` | the work item's head | The orchestrator's broad gate |

## Probes

| Command | Result |
|---|---|
| `cd apps/desktop && node scripts/test-in-electron.mjs test/role-bundle.test.ts` | 19 cases: 17 passed, the new case and the changed orchestrator case among them; 2 built-app cases failed on `posix_spawnp failed` (exit 1) |
| A read script that counts each pinned sentence of the two cases in its flattened bundle file | each of the 18 sentences occurs once |
| `python3 skills/code-review/scripts/chain_check.py --baseline ab7a5730 --root <the branch worktree> --worktree`, before the record was written | exit 0; no notice at a line of `frame/design.md` naming a test pin or a copy |
