# Review round 2: 1795505927-the-repository-checks-its-own-seal

```seal
target: 9cb0c72, fixes d1294ff..9cb0c72
```

This is the verifying round. Its target is the diff of the fix pass, `d1294ff..9cb0c72`. The diff has three commits. `8b5830c` changes the two stand-ins for AgenticSeal's `hygiene.yml`. `f3c2643` changes `pr.md:14`. `9cb0c72` appends round 1's two close blocks. No commit touches a source file, `pr-check/` or the workflow.

Carried from round 1 rather than established again: where the stand-ins live (`apps/desktop/test/records-place.test.ts:16`, `apps/desktop/test/daemon.test.ts:6904`), and that the job id of the plugin's template is `hygiene`. This round ran round 1's `evidence: executed` command for finding 2 again: `git show 66b3991:.github/workflows/hygiene.yml` prints `jobs:` and `hygiene:` at lines 55 and 56.

The work item's records were read against the target. `git diff --stat 8a68af3 9cb0c72` over the work item's directory, leaving out `trail/rounds/`, names `pr.md` alone (executed). So `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md` and the phase records are the bytes round 1 read whole at `8a68af3`. The fix diff changes no file they describe but the two test lines, which none of them states. `pr.md` was read whole again at `9cb0c72`. Its quotes at lines 3 to 9 are unchanged and still stand word for word at their coordinates in `frame/design.md`.

Both closes hold, and the fix diff brings no new finding.

## Findings

## Confirmations

```seal
confirms: round-1#1
```
What holds: `pr.md:14` now reads "This pull request runs its own `.github/workflows/owlery-seal.yml`, which fetches the check from `release/v0.0.3`, so the check posts under the earlier name `Owlery seal` this once". This is round 1's paste-ready sentence word for word (read, `f3c2643`). It agrees with `frame/design.md:119`, scenario 11, and with `frame/plan.md:65`. The rest of the line is unchanged. Executed: `git grep -n` for the old wording, "checked by `release/v0.0.3`'s workflow", over `9cb0c72` prints only round 1's quote of it at `trail/rounds/round-1.md:21`. That quote is history and no statement of the present. `pr.md` stays a quote list and a section for the owner, with no new claim.

```seal
confirms: round-1#2
```
What holds: both stand-ins now open their job as `hygiene`: `apps/desktop/test/records-place.test.ts:16` and `apps/desktop/test/daemon.test.ts:6904` (read, `8b5830c`). Each changes the id and no other byte. The docstring at `records-place.test.ts:15`, "as its 0.38.4 template writes it", now holds. The daemon reads AgenticSeal's workflow by the script path it runs (`apps/desktop/src/daemon/records-place.ts:22-24`), so the id moves no assertion.

Executed:
- `records-place.test.ts` passed whole: 30 cases, among them the five that write the stand-in at lines 114, 147, 154, 514 and 630.
- The one case of `daemon.test.ts` that writes the stand-in, at line 6929, ran as the *Probes* table says.
- `git grep -n` for the text `jobs:\n  seal:` under `apps/` and `pr-check/` at `9cb0c72` prints nothing and exits 1. So no stand-in in the tree still writes a job `seal`. The one other line that names such a job, `records-place.test.ts:813`, asserts that `workflowText` writes none.

The close leaves the claim at `trail/phases/phase-2.md:15` as the phase wrote it and corrects it in the close's answer, as round 1's grounds said it would.

What matched: the fix diff adds no unit and no case. The two changed lines are inputs of existing cases, and the cases' expectations do not read the id. So no new test is owed against its group, and none was added.

## Not judged

| What | Location | Who answers |
|---|---|---|
| Whether GitHub runs `owlery-seal.yml` on this pull request, the job `records` passes with the check of `release/v0.0.3`, and the check is posted (scenario 11, Q2) | `seal/threads/1795505927-the-repository-checks-its-own-seal/frame/questions.md:21` | the orchestrator, with `gh pr checks` once the pull request is ready |
| The full suite, the whole typecheck, and the counts of headings and table rows over every document pair. This round ran one file and one case, and labels the suite `unverified` | `seal/config.json` `Broad gate` | the orchestrator's broad gate |

## Probes

| Command | Result |
|---|---|
| `OWLERY_BACKGROUND=1 pnpm test test/records-place.test.ts`, in `apps/desktop` of the round's `git clone --no-local` at `9cb0c72` | 1 file, 30 cases passed, exit 0. The file does not start the built app |
| `OWLERY_BACKGROUND=1 pnpm test test/daemon.test.ts -t "launches a Claude Code pane of a work item whose worktree holds Owlery's workflow"`, in the same clone at `9cb0c72` | 1 case passed, 341 skipped, exit 0. The `pgrep -fl vitest` in the same command found another worktree's `daemon.test.ts` run that had started again after this round's wait loop saw none, and the command did not stop on it. So the case ran beside that run. Overlap can only fail a case with `posix_spawnp failed.`, never pass one, so the pass stands. The other run was not this round's and was left alone |
