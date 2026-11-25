# Review round 4: 1795610868-236-a-shrinking-reopen-does-not-stop-the-chain

```seal
target: 8964e4d2983fbc26306a27ebe786a043f8896655, fixes 8265a42dd1e83fbda27c91ec8e1d446170407b98..8964e4d2983fbc26306a27ebe786a043f8896655
```

A verifying round. Round 3 closed no finding, so this round answers no close. It reads the repair `302e8886`, which the sealer's withheld verdict asked for (`26de7c42`, the newest block of `guarantee.md`), and the orchestrator's fold of *Scope* item 4 at `8964e4d2`. It also reads the base merge `60ab07c5`, and each record of the work item whole at the target. `1de4cbb1` holds the broad gate's record alone, `run: 60ab07c5 against 943b1bfd`.

The sealer's verdict found a defect that rounds 1 to 3 let through. Round 1's finding 1 asked for records-only findings to leave both counts of the third signal, and its paste-ready text did not say what the signal does when neither round has a finding outside the records. Round 1's confirmations went on to claim that "Under the new rule, read with finding 1's fix, both judgments of that run answer `yes`". That claim was not walked to its end. Before round 3's fix pass on #225's records, both rounds have none outside the records, and none is no fewer and no lighter than none. So the rule as rounds 2 and 3 confirmed it held the signal and answered `no`. This round walks the rule on each case instead of reading its sentences alone.

Carried from rounds 2 and 3 and not established again: the merged texts of #235 and this work, and the closes of round 2. The base merge changes no file of the bundle and no line of `role-bundle.test.ts` (executed, `git diff e44bcc60 60ab07c5 --stat -- apps/desktop/role-bundle apps/desktop/test/role-bundle.test.ts` prints nothing). The work items it brought, #237, #242 and #214, cite none of `agents/orchestrator.md`, `agents/crafter.md` or `skills/implement/fix-pass.md` in their frames or fragments (executed, `git grep -l` over their directories, which prints a round record of #214 alone).

## Findings

No finding.

## Confirmations

What matched: the repair answers the case the sealer named, and keeps the code side. `orchestrator.md:110-113` now says "Where the last round has no open finding located outside the records, the third signal does not hold." The rule was walked on each case below, signal by signal (read, `orchestrator.md:93-114`).

- **#225's records, after round 2.** Round 1 left one finding outside the records (`daemon.ts:285`) and two in them. Round 2 left one, in the records, with `reopens: round-1#3`. The first signal does not hold: the `reopens:` line is a records-only finding's. The second does not hold: no `regression:` line. The third does not hold: round 2 has no finding outside the records, which the new sentence answers, and its none is fewer than round 1's one in any case. The fourth does not hold: the two findings at `changelog.md:3` stand in the records. The fifth does not hold: nothing was closed `rejected`. So the answer is `yes`.
- **#225's records, after round 3.** Rounds 2 and 3 each have one finding, in the records, and round 3's carries `reopens: round-2#1`. The first, second, fourth and fifth signals fail as above. The third is the none-against-none case, which the new sentence answers: it does not hold. So the answer is `yes`, where the text at round 3's target answered `no`.
- **The code side, a heavier round.** The design's scenario (`frame/design.md:68`) gives a round before with one `should` outside the records and two in them, and a last round with one `must` outside. The last round has a finding outside the records, so the new sentence does not apply. One against one is no fewer, and `must` is no lighter, so the third signal holds and the answer is `no`.
- **The code side, a fix that did not hold.** A finding outside the records with a `reopens:` line holds the first signal, which the new sentence does not touch. So the answer is `no` (`frame/design.md:69`).
- **A `rejected` finding raised again in the records.** The fifth signal holds for every finding (`orchestrator.md:113-114`), so the answer is `no`.

The two #225 facts the walk stands on are carried from round 1, which read them with `git show f131e16b^:` of each round record: the locations and `reopens:` lines of rounds 1 to 3.

The sentence leaves one reading next to "So the third signal compares the findings of the two rounds that are located outside the records" (`orchestrator.md:110-111`): it names the one case where that comparison is not made. Its pin at `role-bundle.test.ts:215` holds it. The sentence occurs once in the flattened file, and the cases of `the role bundle` pass (executed). The claim that the pin was seen red was read, not re-run. `changelog.md:8` and *Scope* item 4 (`frame/design.md:40`, after `8964e4d2`) state the same rule, and the latter names the sealer's verdict as its source. The changelog's claim at `:8`, that on #225's records the rule answers `yes` after rounds 2 and 3, now holds by the walk above. So do plan row B (`frame/plan.md:18`) and the scenario at `frame/design.md:66`, the three statements the sealer's verdict named. `git grep -n -F "no fewer and no lighter" -- .` lists the signal itself (`orchestrator.md:98`), `changelog.md:8`, `frame/design.md:24` (*Grounding*, the old rule, dated to `9325cb64`) and `frame/design.md:40`, and none of them contradicts the new sentence (executed). The search is a sample.

What matched: no other statement of the third signal needs the new case. `frame/plan.md` row B1 states the alternative rounds 1 and 2 rejected, and it stands. `gaps.md:9` leaves the model's judgment on these records to the owner's walk, and the walk above is a reading of the text, not a run of the model (read).

This round leaves no finding open. What comes due is the orchestrator's broad run at the head after the repair, then the sealer's spawn after it.

## Not judged

| What | Location | Who answers |
|---|---|---|
| Whether the orchestrator and a pane's session, as models, answer `yes` on #225's records and `no` on the code cases above. This round walked the text, and no model was run | `seal/threads/1795610868-236-a-shrinking-reopen-does-not-stop-the-chain/gaps.md:9` | The owner's walk (#184) |
| The built-app cases of `role-bundle.test.ts`, which compare `dist/bundle` with the tree after `302e8886` changed `agents/orchestrator.md` | `apps/desktop/test/role-bundle.test.ts:281` | The orchestrator's broad run and its built-app batch |
| The whole suite, the repository-wide lint and the typecheck at the target, `unverified`. The gate record names `60ab07c5`, before the repair | the work item's head | The orchestrator's broad gate |

## Probes

| Command | Result |
|---|---|
| `cd apps/desktop && node scripts/test-in-electron.mjs test/role-bundle.test.ts -t "the role bundle"` | 15 passed, 4 skipped by the filter (exit 0) |
| A read script that counts the new sentence in the flattened `agents/orchestrator.md` | it occurs once |
| `git grep -n -F "no fewer and no lighter" -- .` at the target | as the confirmations above name |
