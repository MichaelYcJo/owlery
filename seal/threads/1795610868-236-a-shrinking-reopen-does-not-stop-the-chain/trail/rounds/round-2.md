# Review round 2: 1795610868-236-a-shrinking-reopen-does-not-stop-the-chain

```seal
target: 6ae3535b9382fadc3233b02b7fafaadbb0bbfe6f, fixes 733a3b397fcbcf343261fb66dd7ee10d8fa5b676..6ae3535b9382fadc3233b02b7fafaadbb0bbfe6f
```

A verifying round. It answers the four closes of round 1, and reads the code the range changed: the framer's fold `81d728a2`, the fix `02b2302b` and `41f1f953`, the closes `763d6225`, the orchestrator's fold `d712086b`, and the merge `6ae3535b` of `release/v0.0.5` at `f5ee5ba7`. The merge brought #247 (#245's case of `test/heavy-run.test.ts`) and #252 (#235: the stage prompts name the worktree, with the definitions that say so). The round read the merged `agents/crafter.md`, `agents/orchestrator.md`, `skills/implement/fix-pass.md` and `test/role-bundle.test.ts` as one text, and each record of the work item whole at the target.

Carried from round 1 and not established again: the facts of #225's run (its round records and fix commits), and the frame's dated coordinates that round read at `9325cb64`, other than the two the fold rewrote. Opened again at the target: `stage-records.ts:224`, which still reads a fix pass's answer for its questions alone (`asksOf(given.answer)`), and `chain-command.ts:323-332`, where `fix-pass` takes no answer at all.

## Findings

### 1. The crafter's widened Job gives it each line of the work item's records that states a corrected fact, `routing.md` among them, where its Never list and its whole-read rule forbid `routing.md`

```seal
severity: should
location: `apps/desktop/role-bundle/agents/crafter.md:25-29`, `apps/desktop/role-bundle/agents/crafter.md:98`, `apps/desktop/role-bundle/agents/crafter.md:187-188`, `apps/desktop/test/role-bundle.test.ts:175`, `seal/threads/1795610868-236-a-shrinking-reopen-does-not-stop-the-chain/frame/design.md:45`, `seal/threads/1795610868-236-a-shrinking-reopen-does-not-stop-the-chain/frame/design.md:67`, `seal/threads/1795610868-236-a-shrinking-reopen-does-not-stop-the-chain/changelog.md:6`
evidence: read `apps/desktop/role-bundle/agents/crafter.md:25-29`, `apps/desktop/role-bundle/agents/crafter.md:98`, `apps/desktop/role-bundle/agents/crafter.md:178-188`, `seal/threads/1795610868-236-a-shrinking-reopen-does-not-stop-the-chain/frame/design.md:45`, `seal/threads/1795610868-236-a-shrinking-reopen-does-not-stop-the-chain/frame/design.md:67`; executed `git grep -n -F "a line of the frame among them" -- .`, `git grep -n -F "routing.md" -- apps/desktop/role-bundle/agents/crafter.md`
regression: round-1#2
```

Why it matters: the *Job* that `02b2302b` wrote gives a fix pass "each line of the work item's records that states the fact a finding corrects, a line of the frame among them" (`crafter.md:25-27`). The work item's records include `routing.md`. The rule in the same file lists it first among the files of `seal/threads/<work-item-id>/` that it reads whole (`crafter.md:180`). The same file also forbids it twice. Its *Never* list says "Ask a person anything, or write `routing.md`" (`crafter.md:98`). Its whole-read rule names `routing.md`, unqualified, as "a file you do not write" (`crafter.md:187-188`). The fix qualified the frame in that sentence, as "a line of the frame your *Job* does not give you", and left `routing.md` bare. So a crafter whose finding corrects a fact that `routing.md` also states has two readings: the *Job* tells it to rewrite that line, and the *Never* list forbids it. The frame takes the second reading. Its scenario *A crafter's fix pass meets the fact in a frame line* says "an item it may not write, such as a line of `routing.md`, it names in a close block's `answer:`" (`frame/design.md:67`). The *Job*'s words follow *Scope* item 8's own bullet (`frame/design.md:45`), and the fix copied them. So the defect came from the frame's item 8, whose bullet says "the work item's records" where its scenario row means the frame, and the fix pass applied that bullet as written. The close of round-1#2 still holds for the frame: a crafter now writes the frame line, and names in a close block what no party folds. Only the scope of the *Job*'s new write is wrong. The parse of the *Job* sentence is also loose: "one close block under each open finding and each line of the work item's records" can be read as a close block under each line. The comma in the fix below closes that reading.

The `git grep` on "a line of the frame among them" printed `role-bundle.test.ts:175`, `changelog.md:6`, `frame/design.md:45` and two lines of `trail/rounds/round-1.md`, which are round 1's own record and stay as they read. The search is a sample. The second search lists every `routing.md` line of `crafter.md`: `:35`, `:40` and `:41` read it and stand, and `:98`, `:180` and `:187` are the ones this finding weighs. The fix narrows the *Job* to the three frame files, which is what *Scope* item 8's title and scenario say. `gaps.md` and `changelog.md` are already the crafter's writes.

```markdown
<!-- apps/desktop/role-bundle/agents/crafter.md, Job, lines 24-29 -->
`changelog.md` where `frame/plan.md` *Operational impact* names one, and in
a fix pass one close block under each open finding, and each line of the
three frame files that states the fact a finding corrects. You rewrite
such a line to what HEAD gives, or remove it, and write no new account of
what was built into it. A write not named here is a write you do not make.
```

```ts
// apps/desktop/test/role-bundle.test.ts, line 175, the pin of the same sentence
      ["agents/crafter.md", "and in a fix pass one close block under each open finding, and each line of the three frame files that states the fact a finding corrects."],
```

```markdown
<!-- frame/design.md line 45, Scope item 8, the Job bullet: "each line of the work item's records that states the fact a finding corrects, a line of the frame among them" becomes -->
each line of the three frame files that states the fact a finding corrects

<!-- changelog.md line 6: "gives it each line of the work item's records that states the fact a finding corrects, a line of the frame among them," becomes -->
gives it each line of the three frame files that states the fact a finding corrects,
```

With these, `crafter.md:98` and `crafter.md:187-188` stand as they read, and `frame/design.md:67` agrees with the *Job*. The pin owes a run seen red with only its sentence restored to the old wording.

### 2. The closing memo still asks whether scenario I passes with a zeroed 64 MiB `bytearray`, a case the merged #247 replaced

```seal
severity: should
location: `seal/threads/1795610868-236-a-shrinking-reopen-does-not-stop-the-chain/gaps.md:11`
evidence: read `seal/threads/1795610868-236-a-shrinking-reopen-does-not-stop-the-chain/gaps.md:10-11`, `apps/desktop/test/heavy-run.test.ts:118-119`; executed `git show --stat 5f58752b`
```

Why it matters: the row at `gaps.md:11` asks "Whether `test/heavy-run.test.ts` ... (scenario I) passes on a machine whose memory compressor leaves a zeroed 64 MiB `bytearray` resident", with the broad gate as its answerer. The merge brought #247 (`5f58752b`), which rewrote that case. It now holds 64 MiB of random bytes and writes a byte of each page every 50 ms, "so memory pressure finds them neither compressible nor idle" (`heavy-run.test.ts:118-119`). The zeroed `bytearray` the row describes is no longer in the tree. The question is #245's, which #247 closed. The sealer and the settle read open rows of `## Not verified` as owed. The whole suite at the head, the new case among them, is already the broad gate's by the row at `gaps.md:10`. A row is closed by marking it, never by deleting it (the bundle's `skills/implement/SKILL.md` *4. The closing memo*, "An item is closed by marking it").

```markdown
<!-- gaps.md line 11, the whole row -->
| closed whether `test/heavy-run.test.ts` "keeps one line for the run in the run folder's file ... (scenario I)" passes on a machine whose memory compressor took a zeroed 64 MiB `bytearray`: in phase 2 it timed out there (`trail/phases/phase-2.md`). #247, merged into this branch at `6ae3535b`, rewrote the case to hold random pages it writes every 50 ms (`heavy-run.test.ts:118-119`), and the broad gate runs it with the whole suite (the row above). This work item's range changes neither the case nor the code it covers. | #245, closed by #247 (`5f58752b`) |
```

## Confirmations

```seal
confirms: round-1#1
```
What holds: `orchestrator.md:104-118` leaves a finding located in the records out of both counts: it "is counted neither among the last round's open findings nor among those of the round before it". The new sentence "So the third signal compares the findings of the two rounds that are located outside the records" leaves one reading. On round 1's example (a round before with one code `should` and two records findings, a last round with one code `must`), both counts are one, the last is heavier, and the signal holds. *Scope* item 4 (`frame/design.md:40`, after `d712086b`) and `changelog.md:8` say the same, with "no fewer and no lighter" as the signal reads. The evidence line's `git grep -n -F "last round's open findings" -- .`, rerun at the target, prints `orchestrator.md:98` (the signal), `orchestrator.md:108` and its pin `role-bundle.test.ts:213`, and round 1's own lines (executed). Each of the two pins occurs once in the flattened file, and the orchestrator's case passes (executed). The close's claim of a red run in `seal mutate` was read, not re-run.

```seal
confirms: round-1#2
```
What holds: a crafter's fix pass now writes the frame line that states the fact a finding corrects (`crafter.md:25-29`, `:200-201`), and puts in a close block's `answer:` what its hand-back would name (`crafter.md:201-205`). In the daemon's chain nothing reads the hand-back (`stage-records.ts:224`), and in a pane `fix-pass` takes no answer (`chain-command.ts:323-332`), so this is the only place where a next round reads it. Under that text the grounds at `orchestrator.md:114-118` hold for a crafter's pass on the frame. The five new pins occur once each, and the case at `role-bundle.test.ts:163` passes (executed). The scope of the *Job*'s new write over-reaches into `routing.md`. That is finding 1 above, in the unit this fix changed. `gaps.md:8` names what no run shows of the new text, with the owner's walk as its answerer.

```seal
confirms: round-1#3
```
What holds: `changelog.md:8` ends "after rounds 2 and 3, before the fix pass on each one's record", and `frame/plan.md:18`, row B, reads the same after `81d728a2`. Rerun at the target, the evidence line's `git grep -n -F "before rounds 2 and 3" -- .` prints round 1's own lines alone (executed).

```seal
confirms: round-1#4
```
What holds: `frame/design.md:10` now cites `ROUNDS_CEILING = 6` at `chain.ts:52` and `gateBefore` at `chain.ts:456-463`. Both hold at `9325cb64`, the commit the section is dated to: line 52 holds the constant, and lines 456 to 462 hold the function (executed, `git show 9325cb64:apps/desktop/src/daemon/chain.ts`). Rerun at the target, `git grep -n -F "chain.ts:50" -- .` prints round 1's own lines alone (executed).

What matched: the merged text of the two work items. #235's sentences, `orchestrator.md:35-38` (step 1), `crafter.md:63-76` (step 9) and `fix-pass.md:7-9` (the opening paragraph), say where a role works and commits. This work's sentences say what a fix pass reads, writes and names, and when the rounds converge. Neither states a fact the other contradicts. The convergence rule's test of location, "every path its `location:` lines name stands in the work item's directory", reads paths the merged `convergencePrompt` still hands the judge: the work item's directory on its own line (`chain.ts:743`), with every path read from the worktree's top (`orchestrator.md:35-37`). In the merged `role-bundle.test.ts`, #235's loop (`:150-154`) and this work's case (`:163`) stand apart. #235's loop pins `crafter.md` and `orchestrator.md` against "the folder the session starts in", and neither file holds it. The file's 19 cases pass, the built-app cases among them (executed). The plan's row on #235 asked that the merged file be read there before it is trusted, and it now has been. (read and executed)

What matched: no rule that #235's `## Rule changes` writes into `docs/architecture.md` *Code runs the order, the orchestrator judges* states a convergence signal, what a `no` costs or who makes a fix pass's read, so this work's `- nothing` stands (read, `seal/threads/1795610687-235-stage-prompts-name-the-worktree/frame/design.md` `## Rule changes`). No row of `gaps.md` left in the range, and `41f1f953` added one (executed, `git diff 733a3b39 HEAD -- .../gaps.md`).

Two sentences of the frame are left behind by the merge, and neither is a finding, since no reader acts on them wrongly. *What the daemon could do beyond the issue* item 1 (`frame/design.md:80`) says the item "waits for #235's merge", and #235 has merged. `frame/plan.md` *Overlap with the release* says #235's frame "stands folded at `d5b04a8a` on its branch", and that work item's directory now stands on this branch. The pull request body's first part, `pr.md`, quotes *Scope* items 1 to 5 and not item 8, the crafter's widened *Job*. That is the orchestrator's choice of quotes, and no rule asks `pr.md` to quote every item.

## Not judged

| What | Location | Who answers |
|---|---|---|
| Whether a crafter, a pane's session and the orchestrator follow the new text: the whole read, the frame line a crafter now corrects, the `answer:` that holds what a hand-back would name, and the judgment on records like #225's | `seal/threads/1795610868-236-a-shrinking-reopen-does-not-stop-the-chain/gaps.md:7-9` | The owner's walk (#184) |
| The whole suite, the repository-wide lint and the typecheck at the target, `unverified`. `test/heavy-run.test.ts` was not run in this round | the work item's head | The orchestrator's broad gate |

## Probes

| Command | Result |
|---|---|
| `cd apps/desktop && node scripts/test-in-electron.mjs test/role-bundle.test.ts` | 1 file, 19 cases passed, the two built-app cases among them (exit 0) |
| A read script that counts each pinned sentence of the two cases in its flattened bundle file | each of the 24 sentences occurs once |
| `git grep -n -F` on "last round's open findings", "before rounds 2 and 3", "chain.ts:50", "every place that states" and "a line of the frame among them" at the target | as each confirmation and finding above names |
