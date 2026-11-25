# Review round 2: 1795610689-214-delete-dialog-lists-read-cleanly

```seal
target: 44234e0c, fixes 50917a87..1afea14c
```

This is a verifying round. It reads the fix diff `50917a87..1afea14c` and the merge `44234e0c`. The fix diff holds the orchestrator's fold of findings 4 and 5 and its route row (`9ddfa5fe`), the fix pass's cases (`bd4dd780`), its `gaps.md` edits (`c99670ea`, `95093abd`) and the close blocks (`1afea14c`). The merge brings in `release/v0.0.5` at `5f58752b` (#247). The round read the work item's records whole at `44234e0c`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `pr.md`, both phase records and `trail/rounds/round-1.md`.

From round 1, the round carried the coordinates of `lossParts`, its two callers, the `dialog .loss` rules at `apps/desktop/src/renderer/index.html:573-577` and the cases of `apps/desktop/test/work-item-menu.test.ts`. It re-derived every verdict below at `44234e0c`. Round 1's finding 1 is closed `deferred #251`. Issue #251 is open and carries the defect, the paste-ready direction and a case to build (`gh issue view 251`, `executed`). It stands deferred there, and this round does not write it up again.

## Findings

### 1. `frame/plan.md` says #237 moves the version and that findings 4 and 5 stand in that file, and the target contradicts both

```seal
severity: should
location: `seal/threads/1795610689-214-delete-dialog-lists-read-cleanly/frame/plan.md:61`, `seal/threads/1795610689-214-delete-dialog-lists-read-cleanly/frame/plan.md:67`
evidence: executed `git log --oneline ab7a5730..5f58752b` and `git show 44234e0c:apps/desktop/package.json`; read `seal/threads/1795610689-214-delete-dialog-lists-read-cleanly/trail/rounds/round-1.md` findings 4 and 5
```

Why it matters: both sentences are in the frame, and the sealer reads the frame at the target.

- **The version.** *Operational impact* (line 61) says "The version does not move in this pull request. #237 moves it to 0.0.5." At `44234e0c`, `apps/desktop/package.json` already reads `"version": "0.0.5"`. The merge brought that from `release/v0.0.5`, where #247 moved it at `5f58752b`, the only commit between `ab7a5730` and `5f58752b`. That commit also moved the workflow's clone to `v0.0.5`. So the first sentence still holds against the base, but the second names the wrong pull request. The overlap row for #237 (line 56) says the same of #237, but that table is dated: line 49 says it read the worktrees "at `2026-11-25`". That row stays.
- **The route row.** The 2026-11-25 row of *Judgments of the run* (line 67) says "findings 4 and 5, located in this file alone, are folded by the orchestrator". The row stands in `frame/plan.md`, so "this file" reads as `frame/plan.md`. But round 1 located both findings in `frame/design.md` (lines 78, 82 and 84, and line 136), and the fold at `9ddfa5fe` changed that file. An agent that weighs whether a fold touched only the records reads the wrong file.

The search `git grep -n -e 'moves it to 0.0.5' -e 'located in this file' -- seal/threads/1795610689-214-delete-dialog-lists-read-cleanly/` is a sample (contract rule 19). The fix:

```markdown
None. No migration, no environment variable, no dependency and no compatibility break. The version does not move in this pull request: `release/v0.0.5` holds 0.0.5 since #247 (`5f58752b`).
```

```markdown
| 2026-11-25 | Round 1's finding 1 is deferred to issue #251; findings 2 and 3 go to the fix pass; findings 4 and 5, located in `frame/design.md` alone, are folded by the orchestrator as the round wrote them. | … (unchanged) | … (unchanged) |
```

In the second snippet, the two cells marked `… (unchanged)` keep their text as it stands at line 67. Only the words "in this file" change.

## Confirmations

```seal
confirms: round-1#2
```
What holds: the four facts now each have a case. The delete case reads the subject's `font-size` against `--size-second` and the path's against `--size-caption` (`apps/desktop/test/work-item-menu.test.ts:850-851`, expected at `:855`). Without `font-size: var(--size-second)` at `index.html:576`, the subject inherits the dialog's `--size-text`, 13px against 12px, so the fifth element is `false`. The long list's case writes a sixteen-character hash into the first drawn row and reads one start for every subject (`work-item-menu.test.ts:911-912`). With `subgrid` the whole column widens. With a grid per row, only the patched row's subject moves, which makes two starts. The `delete` view waits for the three heads of `QUEUED_HEADS` (`apps/desktop/test/screenshots.test.ts:284`, `:584`). So a scene without the untracked file, without `.env` or with another number of commits never satisfies the wait. These verdicts are `read`. The fix pass's `seal mutate` runs are carried as its `executed` claims and were not re-run. A built-app run would add nothing that reading leaves open. `git grep -n QUEUED_COMMITS_HEAD 44234e0c` prints only quotations in `round-1.md`, so no reader of the removed constant is left (`executed`). `cd apps/desktop && node scripts/test-in-electron.mjs test/screenshots.test.ts` passed 7 cases and skipped the built-app block (`executed`). `gaps.md` rows 2 and 6 now open with `closed`, which is the form the plugin's `lib/gaps.py` reads, and each second cell says what closed it. Rows 3, 4 and 5 cite round 1's *Confirmations*, which say what they cite. The header comment of `screenshots.test.ts:41-44` now names the two new heads. The two *Rule changes* `to:` texts keep "waits until the head of its commits counts 39", which is still a true part of the wait, as the close says.

```seal
confirms: round-1#3
```
What holds: `gaps.md:18` ends with "which the shot shows.", and the phrase "every kind of path list" stands in no line of `gaps.md` or of the frame at `44234e0c`. `git grep -n -F 'every kind of path list' 44234e0c -- seal/` prints `trail/phases/phase-2.md:5`, which is dated to `5aede9b3`, and the quotations in `round-1.md` (`executed`).

```seal
confirms: round-1#4
```
What holds: the three *Verifiable how* cells of `frame/design.md:78`, `:82` and `:84` name their cases by title, and each title stands at its case at `44234e0c`. The delete case is at `work-item-menu.test.ts:815`, "counts in each heading what the loss counts, …" is at `view.test.ts:742`, and the removal cases are at `work-item-menu.test.ts:999` and `:1032` (`executed`, `grep -n '^  it('`). Cell 78 lacks the comma the round's snippet had before "the case". The cell reads awkwardly but stays correct, so it is no finding.

```seal
confirms: round-1#5
```
What holds: `## Rule changes` of `frame/design.md` ends with the second operation's `check:` line. Run at `44234e0c`, `chain_check.py --worktree` printed no parse notice for the frame (`executed`). The fact the paragraph held still stands in *Grounding* (lines 11 and 15) and in *Scope* items 8 and 9.

What matched: the merge `44234e0c` changes no file this branch changes. Its files are `.github/workflows/owlery-seal.yml`, `apps/desktop/package.json`, `apps/desktop/test/heavy-run.test.ts` and the records of work item `1795613754-245-scenario-i-holds-pages-that-stay-resident` (`git diff --name-only 1afea14c 44234e0c`, `executed`). That work item has no `frame/design.md`, so no *Rule changes* of another item reaches a section this item cites. The one sentence the merge makes false is finding 1's.

The long list's case waits for a `scrollend` on the list it found before the wheel turn (`work-item-menu.test.ts:918-920`). An `inbox` that arrives between the turn and the rest replaces that list, which is the defect of issue #251, and the wait would then time out. Round 1 reviewed that step, and the fix diff did not change it, so the round names it here and opens no finding. The fix for #251 removes the cause.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The broad gate: the full suite, the typecheck and the comparison of `docs/*.md` with `docs/*.ko.md`. The suite is `unverified`. | `seal/config.json` `Broad gate` | the orchestrator |
| Round 1's open rows on the scene's effect on the other views' shots and on the temporary folder path in the six PNG files. The fix diff did not change them. | `trail/rounds/round-1.md` *Not judged* | the orchestrator |

## Probes

| Command | Result |
|---|---|
| `cd apps/desktop && node scripts/test-in-electron.mjs test/screenshots.test.ts` | exit 0: 7 passed, 1 skipped |
| `git grep -n QUEUED_COMMITS_HEAD 44234e0c` | quotations in `trail/rounds/round-1.md` only |
| `git diff --name-only 1afea14c 44234e0c` | three files outside `seal/`, none this branch changes, and the records of #245's work item |
| `gh issue view 251 --json title,state,body` | open, carrying round 1's finding 1 |
