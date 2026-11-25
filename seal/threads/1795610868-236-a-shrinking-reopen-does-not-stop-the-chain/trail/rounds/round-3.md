# Review round 3: 1795610868-236-a-shrinking-reopen-does-not-stop-the-chain

```seal
target: 8265a42dd1e83fbda27c91ec8e1d446170407b98, fixes 6ae3535b9382fadc3233b02b7fafaadbb0bbfe6f..8265a42dd1e83fbda27c91ec8e1d446170407b98
```

A verifying round. It answers the two closes of round 2. It reads what the framer's fold `558712ac` and the fix `90d035c1` changed: `agents/crafter.md` *Job*, its pin at `role-bundle.test.ts:175`, `changelog.md:6`, `gaps.md:11`, *Scope* item 8, plan row M, the two frame sentences the merge had left behind, and the new quote in `pr.md`. It also read each record of the work item whole at the target. The commits `adfd8343` and `8265a42d` hold round 2's record and its closes alone.

Carried from round 2 and not established again: what the merge of `6ae3535b` brought, and that the merged texts of #235 and this work do not contradict each other. The range changes no line of #235's sentences (executed, `git diff 6ae3535b HEAD --stat -- apps` lists `agents/crafter.md` and `role-bundle.test.ts` alone).

## Findings

No finding.

## Confirmations

```seal
confirms: round-2#1
```
What holds: `crafter.md:24-28` now gives a fix pass "one close block under each open finding, and each line of the three frame files that states the fact a finding corrects". The comma sets the lines apart from the close blocks. "The three frame files" is the phrase the whole-read rule uses for the frame beside `routing.md` (`crafter.md:179`). So the *Job* no longer reaches `routing.md`, and it agrees with the *Never* list (`crafter.md:97`), with "`routing.md` or a line of the frame your *Job* does not give you" (`crafter.md:186-187`), and with the frame's scenario row (`frame/design.md:67`) (read). The pinned sentence occurs once in the flattened file, and the cases of `the role bundle` pass (executed). The close's claim that the pin went red with only the old wording restored was read, not re-run. *Scope* item 8's bullet (`frame/design.md:45`, after `558712ac`) and `changelog.md:6` state the same scope. The evidence line's `git grep -n -F "a line of the frame among them" -- .`, rerun at the target, prints the round records' own lines alone (executed). Plan row M (`frame/plan.md:29`) quotes the old wording as the alternative it rejects, and stands.

```seal
confirms: round-2#2
```
What holds: `gaps.md:11` opens with `closed` and says that #247 rewrote the case to random pages written every 50 ms (`heavy-run.test.ts:118-119`, read). It also says that the whole suite stays the broad gate's by the row above (`gaps.md:10`). The answerer cell departs from the paste-ready text, which wrote "#245, closed by #247". It names #247 at `5f58752b` and says that #245 stays open until the release reaches `main`, and both facts hold (executed, `gh issue view 245` prints `OPEN`, and `gh pr view 247` prints `MERGED` at `5f58752b`). The departure corrects a fact the paste-ready text stated wrongly. `git grep -n -F "zeroed" --` over the work item's directory prints the closed row, `trail/phases/phase-2.md:30`, a record of that phase, and round 2's own lines (executed).

What matched: the fold `558712ac` outside round 2's findings. *What the daemon could do beyond the issue* item 1 (`frame/design.md:80`) now says #235 merged as #252 at `f5ee5ba7`, into this branch at `6ae3535b`, "so nothing waits on it". The plan's *Overlap with the release* says the same, and its #235 row says round 2 read the merge. Both hold (read, against `git log` of the range). `pr.md:8` quotes *Scope* item 8's bold lead word for word (read, against `frame/design.md:44`). The new *Judgments of the run* row cites the plugin's `skills/code-review/orchestration.md` *A regression is routed by comparing the fix with the frame*, and that heading stands in the installed plugin (executed, `grep -n`). `frame/questions.md:11` points round-2#1 at row M, which stands (read).

What matched: the *Job*'s sentence "You rewrite such a line to what HEAD gives, or remove it" kept its words through `90d035c1`, which only re-wrapped it. This round asked whether it reaches a line of a frame section dated to the framer's commit, where HEAD is not the measure. The rule the *Job* serves, at `crafter.md:180-184`, says that such a section states its commit and that a sentence of it saying what the work does states the present. So a line that states the corrected fact as of the present is the one the *Job* gives (read).

This round leaves no finding open. What comes due is the orchestrator's broad run, then the sealer's spawn after it.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The built-app cases of `role-bundle.test.ts`, which compare `dist/bundle` with the tree, after `90d035c1` changed `agents/crafter.md`. The close of round-2#1 rests on a text pin, so this round ran the unit cases alone | `apps/desktop/test/role-bundle.test.ts:281` | The orchestrator's broad run and its built-app batch |
| The whole suite, the repository-wide lint and the typecheck at the target, `unverified` | the work item's head | The orchestrator's broad gate |
| Whether a crafter, a pane's session and the orchestrator follow the new text | `seal/threads/1795610868-236-a-shrinking-reopen-does-not-stop-the-chain/gaps.md:7-9` | The owner's walk (#184) |

## Probes

| Command | Result |
|---|---|
| `cd apps/desktop && node scripts/test-in-electron.mjs test/role-bundle.test.ts -t "the role bundle"` | 15 passed, 4 skipped by the filter (exit 0) |
| A read script that counts the new *Job* pin's sentence in the flattened `agents/crafter.md` | it occurs once |
| `git grep -n -F` on "a line of the frame among them", "the three frame files" and "zeroed" at the target | as the confirmations above name |
