# Review round 2: 1795400730-seal-back

```seal
target: 53cd158, fixes ced78af..53cd158
```

This is the verifying round over fix pass 1. It reads each close of round 1 against the code at `53cd158`, and it reads the whole fix diff `ced78af..53cd158` as new code. The diff changes seven files: `apps/desktop/src/renderer/shared.ts`, `apps/desktop/test/seal-back-view.test.ts`, the comment in `pr-check/skills/code-review/scripts/chain_check.py`, and the work item's `frame/design.md`, `gaps.md`, `pr.md` and `trail/rounds/round-1.md`. The work item's `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md` and `pr.md` were read whole at `53cd158`. No `pr.<lang>.md` stands, and none is owed: `Commit and pull request language` is English. The four phase records were read for their coordinates.

Carried from round 1 and not established again: the count of finding headings that hold a backtick (61 of 171), the coordinates of #44's records that leave a broken seal's sentence as written (`seal/threads/1795396351-seal-breaks-after-a-commit/gaps.md:34` and its `trail/rounds/round-1.md:164`), and the screenshots at `39991c3` as the set `pr.md` links. The fix diff adds no screenshot. Every verdict below was reached in this round.

Three of round 1's four closes hold. The fourth, finding 3, moved the deferral's home from #44 to "the owner". By the time `gaps.md` was rewritten, the owner had already answered with issue #176, and neither record names it (finding 1).

## Findings

### 1. The records still say the broken seal's backticks wait on the owner, though the owner answered with issue #176 before `gaps.md` was rewritten

```seal
severity: should
location: `seal/threads/1795400730-seal-back/gaps.md:28`, `seal/threads/1795400730-seal-back/pr.md:18`
evidence: executed `gh issue view 176 --repo MichaelYcJo/owlery --json title,body,createdAt,comments`, `git log --format='%h %cI' ced78af..53cd158`; read `seal/threads/1795400730-seal-back/gaps.md:28`, `seal/threads/1795400730-seal-back/pr.md:18`
reopens: round-1#3
```

Why it matters: round 1's finding 3 asked the records to name the true home of the backticks that the view's foot and the approval line still show. The close moved that home from #44 to the owner. The owner had already decided. Issue #176 was opened at 2026-11-24T02:21:10Z. Its body says: "the owner chose on 2026-11-24 to draw it as the back does", and its *Done when* asks for the view's foot and the approval line to draw the sentence "with its code in the fixed-width face and no backtick". So the defect finding 3 named still stands: the deferral names a home that will not make the change.

Each record gets it wrong in its own way:

- `gaps.md:28`, *Not done*, the paragraph of phase 4, was rewritten at `2160ec8` (2026-11-24T11:24:24+09:00), three minutes after #176 was opened. It says: "The orchestrator carries the question to the owner, so this work leaves both places as they are." The settle decides every open row of `gaps.md`. A settle that reads this sentence finds a question with no issue number and may file a second issue for work #176 already holds.
- `pr.md:18` was rewritten by the orchestrator at `5cdb72a` (11:20:14+09:00), one minute before #176 was opened. It is now out of date. It tells the pull request's reader that #44 "left how a broken seal's sentence is drawn to the owner", so the reader concludes nothing is filed.

The backticks themselves are not this finding: the owner gave them to #176. The finding is the two sentences that name where they went. These are the only two statements of the deferral in the work item's present records (executed: `grep -n -i "backtick\|#176\|to the owner"` over `routing.md`, `frame/*.md`, `gaps.md`, `changelog.md` and `pr.md`). `trail/phases/phase-3.md` and `phase-4.md` are dated records and stay as they are.

```markdown
Phase 4: the right column's foot and the approval line show a broken seal's sentence with its backticks as written, where the back draws the words between them as code. Phase 3 found it. Issue #44, which merged, left that sentence as written on purpose, and its records left how a broken seal's sentence is drawn to the owner (#44's `frame/questions.md` Q1). On 2026-11-24 the owner chose to draw it as the back does, in issue #176, a work item of its own, so this work leaves both places as they are.
```

`pr.md:18`:

```markdown
The view's foot and the approval line still show a broken seal's sentence with its backticks, where the back sets the code in the fixed-width face. #44 left them so on purpose, and the owner has since chosen to draw them as the back does, in #176, a work item of its own. This work leaves them.
```

```seal
verdict: fixed 5d562fd
answer: `gaps.md` *Not done*, the row of phase 4, and `pr.md` line 18 now name issue #176, where the owner chose on 2026-11-24 to draw a broken seal's sentence as the back does, with the words the round proposed. The orchestrator made the change; it touches the work item's records alone.
```

## Confirmations

```seal
confirms: round-1#1
```
What holds: the comment above `SECTION_OPEN` (`pr-check/skills/code-review/scripts/chain_check.py:1887-1892`) now says that no arm reads another line of the body, "neither the back of the seal, which the daemon writes between markers of its own below the seal section, nor the lines the person writes". `frame/design.md:108`, *Scope* item 25, says that this comment is the one change the work makes in `pr-check/` and that no behaviour of the check changes. The target agrees: `git diff --stat 2737ceb..53cd158 -- pr-check` lists `chain_check.py` alone, with four lines added and two removed, all inside the comment (executed). The other statements of "every other line is the person's" were listed with `git grep -n -i` on the phrases "the person's to edit", "other line of the body", "rest of the body" and their Korean forms (executed). That search is a sample of the spellings. It found `chain_check.py:85`, which is true as written. It found #43's `changelog.md:17`, which already names the back's section. It found #43's frame and round records, which are dated. And it found this work's own *Rule changes* rows that rewrite `docs/architecture.md` at the settle. Read.

```seal
confirms: round-1#2
```
What holds: `findingLine` now draws the symptom with `withCode("says", line.says)` (`apps/desktop/src/renderer/shared.ts:465`), and `backParts` draws a breaking commit's subject with `withCode("subject", ...)` (`shared.ts:503`). Where a text has no backtick, `withCode` makes the same `span` with the same class and one text node, as `part` did (`shared.ts:89-117`). So the scene's shots, whose heading and breaking subject hold no backtick, draw the same pixels.

Executed: this round's mutant run below drew the built app with the fix in place. It passed `test/seal-back-view.test.ts:211-212` before it failed at line 240. Line 211 reads `#back .finding .says code` as `feature.txt`, and line 212 says the back shows no backtick.

The subject half was read and not executed. Line 244 is the only assertion that reads `#back .broken-by .subject code`. With the subject drawn by `part`, the steps before it draw the same as at the baseline, so a mutant fails there. The fix pass's `seal mutate` output in its scratch directory shows the baseline passed and both mutants red, with no failing line printed.

The class was listed again by taking apart every `part(` call in `backParts`, `roundPart`, `findingLine`, `stageLines` and `stageLine` (`shared.ts:434-540`). Each one is one of:

- a word the composition writes: the stage cells, the captions, `names` (`apps/desktop/src/shared/seal-back.ts:185-190`) or `converted`;
- the severity;
- the `back-waits` sentence, which is `BACK_READING` or one of the daemon's errors at `apps/desktop/src/daemon/daemon.ts:1347` and `:1350`.

The symptom and the subject were the two texts from a record or from git, and both now go through `withCode`. Read.

```seal
confirms: round-1#4
```
What holds: round 1's probe was run again on the fixed tree. With `|| backAsked.key !== key` removed from `apps/desktop/src/renderer/work-item-view.ts:1097`, `test/seal-back-view.test.ts` fails at line 240, the new step's wait, with "the window never showed the sealed work item's back drawn again as broken", exit 1 (executed, one start of the built app, *Probes*). Round 1 saw the same probe pass all 498 tests. The new step is the only case that holds the guard: round 1's `git grep -n "readSealRecords" -- test` names no other window case, and the fix diff adds no test file. The step adds no start of the built app: it breaks a seal already in the case's scene.

What matched in the rest of the fix diff:

- The new step's commit is made under the repository's own identity, with signing off. `test/repositories.ts:12-16` sets `user.name`, `user.email` and `commit.gpgsign` on the temporary repository, and the work item's worktree shares that configuration. It reaches no remote. Read.
- `commitSealedAfterAFix` puts `SYMPTOM` in place of finding 1's heading, and throws where `roundRecord` no longer writes that heading (`test/seal-back-view.test.ts:56-58`). So a later change to `test/chain-run.ts#findingSection` stops the case. Without that throw, the case would quietly lose its backticked symptom. Read.
- The breaking commit `later.ts` follows the two closing-record commits after the sealed commit, so `firstCommitOutside` names it, as line 243 asserts. Read against `test/seal-back-view.test.ts:63-69`.
- `gaps.md:18`, the row fix pass 1 added, holds as written. The scene's heading is "The greeting of line 1 misses its full stop" (`test/chain-run.ts:347`). The breaking subject is `add avatars.ts`, from `AFTER_THE_SEAL` (`test/screenshots.test.ts:167`) through `commitFile` (`test/repositories.ts:60`). Neither holds a backtick. Apart from `test/screenshots.test.ts`, no test file draws a back (executed: `git grep -l -e "backParts" -e '#back' -e "Back of the seal" -e "tab.back" -- test`, where the three other matches name `openView` alone).
- The two new assertions sit in the one built-app case of `test/seal-back-view.test.ts`, and each holds a guard no other case holds: the fixed-width symptom and subject, which *Scope* item 20 and the row "The back of the seal" of `docs/design.md:454` state, and the asking again of *Scope* item 19.
- `frame/design.md:108` and the round-1 close blocks agree with the target. `changelog.md` and the rest of `pr.md` did not change in the fix diff, and nothing in the fix diff contradicts them. Read.
- The crafter's label is honest: `gaps.md:18` names the orchestrator's broad gate as the answerer for the files the fix pass did not run, and no close claims a broad run.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The broad gate at the head `53cd158`. This round ran one built-app case against a mutant and did not run the case green at the head; the fix pass's `seal mutate` baseline is that claim | the suite | the orchestrator's broad run, then the sealer's spawn |
| How GitHub draws the back's section, carried from round 1 | `apps/desktop/src/daemon/github.ts#backSection` | the walk of issue #48 (`frame/questions.md` Q4) |
| `frame/questions.md` Q1 to Q3, carried from round 1 | `seal/threads/1795400730-seal-back/frame/questions.md` | the owner |
| A symptom whose backticks do not pair stays as written: `view.ts#codeParts` draws an unpaired backtick as text, so the back then shows it, while GitHub may draw the same heading in the body otherwise | `apps/desktop/src/renderer/view.ts:578-591` | the orchestrator, if a proofer ever writes such a heading |

## Probes

| Command | Result |
|---|---|
| `OWLERY_BACKGROUND=1 pnpm test test/seal-back-view.test.ts` in `apps/desktop`, through the Electron lock, in a clone at `53cd158` after `pnpm install --offline --frozen-lockfile`, with `\|\| backAsked.key !== key` removed from `work-item-view.ts:1097` (one start of the built app) | 1 failed at `test/seal-back-view.test.ts:240`, "the window never showed the sealed work item's back drawn again as broken", exit 1. The edit was put back with the edit tool, and `git diff --quiet` in the clone exited 0 |
| `gh issue view 176 --repo MichaelYcJo/owlery --json title,body,createdAt,comments` | created 2026-11-24T02:21:10Z, no comment; the body records the owner's choice to draw the sentence as the back does |
| `git log --format='%h %cI' ced78af..53cd158` | `5cdb72a` at 11:20:14+09:00, `2160ec8` at 11:24:24+09:00 |
| `git diff --stat 2737ceb..53cd158 -- pr-check` | `chain_check.py` alone, 4 lines added and 2 removed |
| `git grep -l -e "backParts" -e '#back' -e "Back of the seal" -e "tab.back" -- test` | `approval-line`, `decisions-and-questions`, `screenshots`, `seal-back-view` and `terminal-basics` test files; the three that are not the back's own match `openView` alone |
