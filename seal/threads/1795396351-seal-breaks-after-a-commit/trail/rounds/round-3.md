# Review round 3: 1795396351-seal-breaks-after-a-commit

```seal
target: 3afa8a6, fixes 6027f8d..3afa8a6
```

This is a verifying round. It answers the two findings round 2 closed, and its code is the diff of the fixes after round 2's target `6027f8d`. That diff is the framer's fold at `e8769e0` (`frame/design.md` *Scope* item 9, `frame/plan.md`'s failure scenario of the chosen guarantee arm, and the orchestrator's row of *Judgments of the run*), the crafter's two cases at `77cfbaa`, the closing memo's row at `13198dc`, and the close blocks at `3afa8a6`. No file of `pr-check/` or of `apps/desktop/src/` changed in that range (executed: `git diff 6027f8d HEAD --stat -- pr-check apps/desktop/src` printed nothing). The round worked in a `git clone --no-local` of the worktree at `3afa8a6`, under the round's scratch directory, with `node_modules` linked from the worktree and `python3` resolved to Python 3.12 from a folder put first on `PATH`.

The work item's records were read whole at `3afa8a6`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md` and `pr.md`. No `pr.<lang>.md` stands, since `Commit and pull request language` is English. No `seal/parity.json` stands. The phase records were searched for statements on the fork of HEAD and the baseline, on `merge-base` and on a withheld verdict (executed: `grep -n -i` over `trail/phases/*.md`). They hold none that the fix diff touches.

Carried from rounds 1 and 2, and not re-derived: the merge resolution at `a53b22b`, the daemon's reading of *Scope* items 1 to 5, the window's places and the screenshots, and round 2's histories A to F and K. The fix diff touches none of them. Round 2's row of `## Not judged` on a history with two forks of HEAD and the baseline stands as round 2 wrote it. Re-opened because the closes stand on them: `pr-check/skills/code-review/scripts/chain_check.py:1104-1112` (the walk of the base's commits and its exclusion of the work item's directory), `:1120-1140` (`since_sealed_reason` for a newest block that is no seal), `:2354-2380` (`judge` up to `changed`) and `:2582` (`outcome` for a check that could not run). Round 2's probe G was written again from its `## Probes` row.

## Findings

None. Both closes hold, and the fix diff opens no defect.

## Confirmations

```seal
confirms: round-2#1
```
What holds: the two sentences of the frame now say what the code does where git names no fork of HEAD and the baseline. `frame/design.md:125` (*Scope* item 9) says the check stops before the arm, since `chain_check.py#changed` cannot diff the baseline against HEAD, and fails as "The seal check could not run". `frame/plan.md:47` says the same in the failure scenario of the chosen guarantee arm. It also says the walk needs the baseline's history in the checkout, which the workflow Owlery writes fetches whole.

The claims were checked against the code, read. `judge` calls `changed(root, args.baseline)` at `chain_check.py:2377`, and where it answers None prints "cannot diff against" and returns `COULD_NOT_RUN` (`:2378-2380`), before `declared_for_this_branch` and every arm below it. `outcome` gives exit 2, conclusion `failure` and `COULD_NOT_RUN_TITLE`, "The seal check could not run", where the check did not run (`:2582-2583`, `:2556`). `records-place.ts#workflowText` stands at `apps/desktop/src/daemon/records-place.ts:63`, and its checkout holds `fetch-depth: 0` at `:94`.

Executed, round 2's history G written again: a sealed branch judged against an orphan baseline `elsewhere`. `git merge-base HEAD elsewhere` exited 1 with no output. The check exited 2 with "chain-check: cannot diff against elsewhere". The same repository judged against `main` exited 0, so the stop comes from the baseline alone.

The class of statements was listed by a search of the work item's records, both READMEs and `pr-check/README.md` for "fork", case-insensitive (executed: `grep -n -o -i`). It printed `frame/plan.md:47`, `frame/design.md:125`, the orchestrator's row `frame/plan.md:128` and `README.md:40`. The README line is about a pull request from a GitHub fork, another sense. The docstring of `since_sealed` (`chain_check.py:1086-1087`) states the function alone, and it is true as it stands. The search is of one word, so it is a sample. *Data & interfaces* (`frame/design.md:224`) and *Removes* (`:284`) were read and say nothing of a missing fork.

The fold's close says `since_sealed`'s answer for a missing fork and its docstring stand unchanged. That holds: the range changed no file of `pr-check/`.

```seal
confirms: round-2#2
```
What holds: both branches round 2 named are now held by a case, and each case fails with only the guard it names removed.

- The exclusion of the work item's directory. The row "a merge of a base whose commits add and take back a file of the work item's directory alone" stands in scenario 9's table (`apps/desktop/test/pr-check.test.ts:705-713`) and expects `sealed` with exit 0. Executed: with `chain_check.py:1110` edited in the clone to `if path:`, the file failed one case, at `pr-check.test.ts:752`. The diff of the answers showed the new row alone, with the daemon still `sealed` and the check's exit 1 where 0 was expected. Every other row and case passed.
- The line for a newest block that is no seal. The outcome case now posts a withheld verdict followed by `mergeAsSealed(…, "revert")` (`pr-check.test.ts:524-531`). It reads the title "No seal at the head commit" and the line "the guarantee is behind HEAD: a commit of the base that a merge brought after the commit it names, `<7>`, touches `other.txt`, outside the work item's records". Executed: with the condition at `chain_check.py:1134` renamed in the clone to a kind no answer has, the file failed one case, at `pr-check.test.ts:531`. The arm then printed `follows_reason`'s sentence, "commit 2b781ac7 after it touches `other.txt`", in place of the pinned line. The title assertion above it still passed, so the line alone pins the branch.

With `chain_check.py` as `3afa8a6` holds it, all 22 cases of `test/pr-check.test.ts` passed (executed). The clone was restored after each mutant (executed: `git status --short` listed the two links alone).

The close's other claims were read against the diff. Both cases stand as round 2's paste-ready fix wrote them, word for word. The count of requests the outcome case sends went from 7 to 8 in the same commit (`pr-check.test.ts:551`), one for the new history. The close says each case was shown red by `seal mutate` at `:752` and `:531`. This round's mutants failed at those same two lines.

Each new case was read against its group. No other row of scenario 9's table has a base commit that touches only the work item's directory. So the new row holds the behaviour of *Scope* item 9, "touched a path outside the work item's directory", which no row held before. The rows already hold histories that scenario 9's text does not list, such as "a commit of the refused calls", so the new row does not contradict that text. In the outcome case, the withheld history at `:515-523` holds the `differs` line for a block that is no seal. The new history holds the `brought` line, which no other case holds. Its comment says no seal broke and the arm names the path the base's commit touched, and the assertions hold both.

What matched: the orchestrator's row of *Judgments of the run* (`frame/plan.md:128`) agrees with the records and the code. Round 2's two findings are both `regression: round-1#1` (`trail/rounds/round-2.md`). The check exits 2 before any arm where git names no fork (history G above). Rounds 1 and 2 each opened two findings, and the plugin counts a verifying round that opens something as a finding round (`skills/code-review/orchestration.md`, *A round that opens nothing needing a fix does not count*). The routing it names, a fold by the framer for finding 1 and a fix pass for finding 2 followed by one verifying round, is the one the commits show.

What matched, in part: the closing memo's row at `gaps.md:26` labels the whole suite, the typecheck and the documents' checks at the tree of both fix passes as unverified, and names the orchestrator. That label is honest. The row says each pass ran `test/pr-check.test.ts`, the unit files that read `pr-check/`, and the typecheck, and cites the close blocks of `round-1.md` and `round-2.md`. Round 2's close block holds all three. Round 1's close blocks name `pr-check.test.ts` and `seal mutate`, and no unit file beside it and no typecheck. No commit message of the range names them either (executed: `git log -1 --format=%B` on each commit of both fix passes, searched for "typecheck"). Round 2 read the earlier form of the row the same way. The part of the row that cites round 1 is a claim no record holds. No party acts on it, since the broad gate runs the typecheck whatever the row says, so it is no finding.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The whole suite, the repository-wide typecheck and the documents' checks of the `Broad gate` key at `3afa8a6`. This round ran `test/pr-check.test.ts` and its own probe alone. The fix pass's claim that the five other unit files that read `pr-check/` passed, and that the typecheck exited 0, was read and not run again | `seal/threads/1795396351-seal-breaks-after-a-commit/gaps.md:26` | the orchestrator, at the broad gate |
| Whether a history with two forks of HEAD and the baseline has `git merge-base` name one fork and the walk miss a commit of the base that the daemon's rounds read. Carried from round 2, which built no such history, and neither did this round | `pr-check/skills/code-review/scripts/chain_check.py:1104` | the orchestrator, by judging whether such a history is in reach of a work item's branch |

This round leaves nothing open. What comes due is the orchestrator's broad run at `3afa8a6`, and the sealer's spawn after it.

## Probes

| Command | Result |
|---|---|
| `node scripts/test-in-electron.mjs --project unit test/pr-check.test.ts`, from `apps/desktop` of the round's scratch clone at 3afa8a6 | Exit 0, 22 cases passed |
| The same file, with `chain_check.py:1110` edited in the clone to `if path:`, then restored | Exit 1, 1 failed and 21 passed: the case of scenario 9 at `pr-check.test.ts:752`, on the row "a merge of a base whose commits add and take back a file of the work item's directory alone", daemon `sealed`, check exit 1 |
| The same file, with `chain_check.py:1134` reading `if kind == "no such kind":`, then restored | Exit 1, 1 failed and 21 passed: the outcome case at `pr-check.test.ts:531`, the `brought` line missing, the summary holding "the guarantee is behind HEAD: commit 2b781ac7 after it touches `other.txt`" in its place |
| `node scripts/test-in-electron.mjs --project unit test/test_tmp_round3.test.ts`, the probe writing its answers to a file in the round's scratch directory | Exit 0. G: `git merge-base HEAD elsewhere` exit 1 and no output; the check against `elsewhere` exit 2 with "chain-check: cannot diff against elsewhere"; the same sealed branch against `main` exit 0 |
