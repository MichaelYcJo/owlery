# Review round 2: 1795559733-built-app-files-share-one-app

```seal
target: 4a89817c, fixes e3e20826..4a89817c
```

This is a verifying round. Its code bound is the diff `e3e20826..4a89817c`: `1175bb66`, the fix pass for both findings of round 1, `837676e5`, the close blocks, and `4a89817c`, the framer's rewrite of `frame/design.md:42` and `frame/plan.md:18`. What round 1 established outside that diff was carried and not established again: the enumeration of launches, the two skipped files, the frame's coordinates and the quotes of `pr.md`. None of the files the coordinate of a carried fact names changed in the diff (executed: `git diff --stat e3e20826..4a89817c`). Of the work item's records, this round read whole at `4a89817c` the three the diff changes, `frame/design.md`, `frame/plan.md` and `gaps.md`, with `changelog.md` and the close blocks of `trail/rounds/round-1.md`. It did not read again `routing.md`, `frame/questions.md` or `pr.md`, which the diff does not touch, as the spawn prompt narrowed it to what the commits touch.

## Findings

No finding is open. Both closes hold.

## Confirmations

```seal
confirms: round-1#1
```
What holds: the published file names the helper's wait steps where a reader meets the numbers, and the printed tables say the same (read, and executed). `apps/desktop/measurements/built-app-launch.md:15` adds the Waits row: the start asks the debugging port every 200 ms, the stop and part 2 of a reset look for the end every 50 ms, and part 2's 50 and 51 ms are one step each. Each rate matches the helper: `test/built-app.ts:48` sleeps 50 ms in `untilGone`, which `end` calls at `:340` and `:342` and the reset's part 2 calls at `launch.ts:250`, and `listed` sleeps 200 ms at `:360`. The row departs from the given text at one place. It says "at every start and stop of the built app in the suite" where the given row said "for every built-app file", and the close's reason holds: five built-app files start no app in a run of the suite, as round 1 counted. The footer at `apps/desktop/test/launch.ts:139` and its pin at `apps/desktop/test/launch.test.ts:137` carry one sentence. The pin's case passes at `4a89817c` and fails against the old footer with the pin as it stands, on the footer line alone (executed, both rows of `## Probes`). No timing code changed, so the published numbers stay those of the run at `def06e3f`, as the Commit row says.

```seal
confirms: round-1#2
```
What holds: no record of the work item and no published file now states a cause of the load, and the decision stands on the bound (read). `built-app-launch.md:32` says what raised the load is not known, and `:39` says the two readings cannot tell where the load fell and gives the 688 ms bound. `changelog.md:6` reads "the machine's load read before and after each run". `frame/design.md:42`, rewritten by the framer in `4a89817c`, says that what raised the load is not known and that the launches ran before the resets. It rests the decision on the same bound, under the 1 s of phase 1's stop. `frame/plan.md:18` cites that paragraph by its opening words, which still open it. `gaps.md:10`, which the close names, now gives the readings as before and after and rests its close on the bound. A search for the two claims' words found no other statement outside the round records (executed: `git grep -n -e 'busy machine' -e 'saving larger' -e 'during both runs' -e 'load during' -e 'Other worktrees' HEAD -- apps seal docs README.md`). It found only `built-app-launch.md:32`, which is the corrected sentence, and two comments of `chain.test.ts` and `pull-request.test.ts` on unrelated time limits. The search is a sample of spellings.

What matched: the units new in the fix diff hold. `gaps.md:9` now closes the row of the two skipped files on round 1's reading, `pane-session.test.ts:75` and `role-session.test.ts:56` (read; carried from round 1, whose coordinates did not change). The Commit row of `built-app-launch.md:10` now says that both commits it names stand on the pull request's branch and leave the base's history at the squash. It answers the row round 1 left in `## Not judged`, and it agrees with `routing.md:22`, which says the pull request merges by squash (read at `e3e20826`, unchanged since).

One sentence of the fix reads loosely without being wrong. `built-app-launch.md:39` ends "That is under the 1 s at which the work would have built no further", and the published file names no work and no 1 s elsewhere, so after the settle a reader cannot place the threshold. No reader acts on it differently, since the decision is stated in *What the numbers decide*, so it opens no finding.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The suite, the typecheck and the rest of the broad gate at `4a89817c`, which stay `unverified` | `seal/config.json` `Broad gate` | the orchestrator, at the broad run, and then the sealer |
| Whether the shared app is built against this measurement | `frame/questions.md` row Q1 | the owner |
| Whether the open app's memory goes on growing past ten resets | `gaps.md:11` | the owner, as `gaps.md` names |

## Probes

The runs were made in round 1's clone under the work item's scratch directory, moved to `4a89817c`, with their output under `round-2/`. The second is a probe: the footer at `launch.ts:139` was set back to its text at `e3e20826` through the `Edit` tool, run once, and restored with `git checkout`.

| Command | Result |
|---|---|
| `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/launch.test.ts -t 'prints the app itself in MB' --reporter=verbose`, in `apps/desktop`, with `OWLERY_MEASURE_LAUNCH` unset, at `4a89817c` | exit 0: the footer's case passed under the project `app`, and the file's other 19 cases were filtered out as skipped |
| The same command, with the footer at `launch.ts:139` set back to its text at `e3e20826` | exit 1: the footer's case failed at `launch.test.ts:130`, and the diff Vitest printed differs on the footer line alone, the expected sentence with "read every 10 ms" against the received old one. The clone's `git status` was clean after the restore |
