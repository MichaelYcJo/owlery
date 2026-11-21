# Guarantee: 1795268298-desktop-suite-in-ci

Audited `9bb48d0` against `1db6c1f` (`origin/release/v0.0.2`, resolved as `release/v0.0.2@{upstream}`). `trail/gate.md`'s newest run is `1459647`, an ancestor of HEAD, and the one commit after it, `9bb48d0`, touches only `seal/threads/1795268298-desktop-suite-in-ci/trail/gate.md` (executed: `git log --no-merges --name-only 1459647..HEAD ^1db6c1f`). `seal pr-body 1795268298-desktop-suite-in-ci --body <pr-body.md> --check` exited 0 (executed). No `seal/parity.json` stands, so no comparison with an original is owed. The re-runs below ran in a clone at `9bb48d0` under the scratchpad, `1795268298-desktop-suite-in-ci/at-base/`, one case or one probe file at a time.

## Claims re-run

| Claim | Source | Command | Result |
|---|---|---|---|
| The runner's retry: without `CI` a case that fails only at its first run fails; with `CI=1` it passes at its retry, and a case that fails at every run fails with `(retry x1)` | `trail/phases/phase-1.md:22` | probe `test/test_tmp_retry.test.ts` (two cases: one fails at its first run only, one always), `env -u CI node scripts/test-in-electron.mjs test/test_tmp_retry.test.ts --reporter=verbose`, then the same with `CI=1` | holds (executed): without `CI` both failed, exit 1; with `CI=1` the first passed `(retry x1)` and the second failed `(retry x1)`, exit 1 |
| The reconnecting-client case pins each line once: doubling the replay's text in `src/daemon/daemon.ts` turns it red with `expected 2 to be 1` | `trail/phases/phase-1.md:18` | `node scripts/test-in-electron.mjs test/daemon.test.ts -t "sends a reconnecting client each line once"` at HEAD, then with `data: session.output.text() + session.output.text()` at `src/daemon/daemon.ts:644`, file restored after | holds (executed): passes at HEAD; red with the replay doubled, `AssertionError: expected 2 to be 1` at `test/daemon.test.ts:261:80` |
| The five-burst case still prints lines after its attach, 150 ms after the client's ready | `trail/phases/phase-1.md:18` | the same command with `this.sendOutput(id, data)` sent twice in `print` (`src/daemon/daemon.ts:938`), file restored after | holds locally (executed): red, `expected 2 to be 1` at `test/daemon.test.ts:261:80`, so live lines reached the client after its attach; on the runner it is the runs' account (read) |
| The helper fails a background start whose page is not 1440 by 900: a 1400-wide window turns `test/keep-awake.test.ts` red at the start's size check | `trail/phases/phase-1.md:16` | `...WINDOW_SIZE, width: 1400,` in `src/main/main.ts`, `node build.mjs`, `node scripts/test-in-electron.mjs test/keep-awake.test.ts -t "offers the three choices"`; then restored, rebuilt, the same case | holds (executed): red, `Error: the window's page is 1400 by 900 and not 1440 by 900` at `BuiltApp.start test/built-app.ts:193:84`; passes with HEAD's code |
| The workflow's first run on `macos-26-arm64` failed 18 cases, 15 of `terminal-basics` and 3 of `work-item-menu` | `pr.md:7`, `trail/phases/phase-1.md:7` | `gh run view 44909892650 --log` (head `f51dae9`, failure) | holds (executed): `Image: macos-26-arm64`, `18 failed | 1032 passed | 1 skipped`, 15 `FAIL` lines in `test/terminal-basics.test.ts` and 3 in `test/work-item-menu.test.ts` |
| Run 44919934535 at `eb59857` passed the size check at every start, "and none of the 18 failures came back" | `trail/phases/phase-1.md:14` | `gh run view 44919934535 --log`, its `FAIL` lines and error lines against those of 44909892650 | does not hold (executed): the size check's message appears nowhere, but 4 of the 18 cases failed again: the worktree link case (`apps/desktop/test/terminal-basics.test.ts:736`) and the three after it (`:807`, `:865`, `:1013`), two of them with the message they failed with in 44909892650: `the window never showed a link under the pointer on row 3` and `ArrowLeft with the Command key: expected '' to be '01'` |
| After the worktree link case failed, "the four cases after it then failed on the pane it left open" | `gaps.md:9` | `grep -n -E '^\s+it(\.[a-zA-Z]+\([^)]*\))?\(' apps/desktop/test/terminal-basics.test.ts`; the `FAIL` lines of runs 44915064055 and 44919934535 | does not hold (executed): three cases follow the link case in the file (`:807`, `:865`, `:1013`), and in each run those three failed with it, four of the file in all |
| Run 44922266267 at this head passed all 34 files | `pr.md:14` | `gh run view 44922266267 --json headSha,conclusion`, `--log`; `git diff --stat c106646 HEAD -- . ':!seal'` | holds (executed): head `c106646`, success, `Test Files 34 passed (34)`, `Tests 1050 passed | 1 skipped`; nothing outside `seal/` differs between `c106646` and HEAD |
| The rulesets on `main` and `release/**` require no status check today | `pr.md:18` | `gh api repos/<repo>/rulesets` and each ruleset by id; `gh api .../branches/main/protection` | holds (executed): two active rulesets, `~DEFAULT_BRANCH` and `refs/heads/release/*`, each with the one rule `pull_request`; `main` has no branch protection (404) |
| The diagnostic step and the recording code were removed: `check.yml` is as `f51dae9` wrote it, `test/work-item-menu.test.ts` as `eb59857` wrote it, and `BuiltApp.atWindowSize` is gone | `trail/phases/phase-1.md:24`, `:14` | `git diff --stat f51dae9 HEAD -- .github/workflows/check.yml`; `git diff --stat eb59857 HEAD -- apps/desktop/test/work-item-menu.test.ts`; `git diff --stat 1db6c1f HEAD -- apps/desktop/test/work-item-menu.test.ts apps/desktop/test/terminal-basics.test.ts`; `grep -rn "atWindowSize\|setDeviceMetricsOverride\|clearDeviceMetricsOverride" test src` | holds (executed): all three diffs empty; the only device-metrics calls left are the narrow-window case's (`test/work-item-menu.test.ts:418`, `:441`), which stand at base |
| No `## Removes` of `frame/design.md`, and no removal the changelog names | — | `ls seal/threads/1795268298-desktop-suite-in-ci` | holds (executed): no `frame/`; `changelog.md` names no removal |
| The broad gate passed at `1459647` | `trail/gate.md` | not re-run (rule 2) | `unverified` by this audit; the orchestrator's run, answered by its record; GitHub's run at `c106646`, the same code, passed (above) |

## The parties

| Party | Says | Agrees with | Disagrees with |
|---|---|---|---|
| the design | No `frame/` was written (`routing.md` *Planning, the session*); the issue's two *Done when* lines are the frame | the issue: the workflow runs `pnpm -r run check` on `pull_request` into `main` and `release/**` (`.github/workflows/check.yml:9-11`, read), and a failing suite fails the job (run 44909892650, executed) | none |
| the build | The phase record: the screen cause fixed by `enableLargerThanScreen: background` and the helper's size check, the daemon case in bursts, the retry the orchestrator chose, the diagnostics removed | the diff (`apps/desktop/src/main/main.ts:119-121`, `src/main/window-size.ts`, `test/built-app.ts:191-194`, `test/daemon.test.ts:247`, `vitest.config.ts`, read), the re-runs above, `gaps.md` and `changelog.md` | the run log of 44919934535: `trail/phases/phase-1.md:14` says none of the 18 failures came back there, and four of those cases failed in it; the same record's paragraph at `:20` and `gaps.md:8-9` name that run's link-case and Open in failures, so the record tells two stories of one run |
| the last round | No round record: `routing.md` answers *Review, straight to the PR* | — | none |
| the changelog | The workflow, the screen fix with one home for the size, the daemon case in bursts, the runner's one retry under `CI`, the version 0.0.2 | the diff, the phase record, `gaps.md` and `pr.md`; `apps/desktop/package.json:3` reads `0.0.2` | none |
| the orchestrator's part of the pull request body | `pr.md`: the workflow, the two causes and their fixes, the two cases left to #117 under the runner's retry, run 44922266267 green, and the owner's two points | the diff, the phase record, the changelog, `gaps.md`, the runs and rulesets re-read above | none of its own; the records' copy below its line carries `gaps.md:9`'s count, which the tree contradicts (above) |

Read, and not a disagreement: `routing.md` *Why this way* names the Implementation row's raise to a crafter as making the suite hold on the runner across the built app's cases, which describes the diff's app change (`enableLargerThanScreen: background`, `background` false without `OWLERY_BACKGROUND=1`, `src/main/background.ts:12-14`) and the test changes. The retry under `CI` lets a case that fails once on the runner pass, which issue #30's second *Done when* line does not name; the orchestrator's judgment of 2026-11-22 states it with its cost in `gaps.md` *Not done*, and issue #117's *Done when* removes it. A case that fails twice still fails the run (executed, above). Outside the tree, issue #117's body repeats the same count, "with four cases after it failing in a chain".

```seal
target: 9bb48d0 against 1db6c1f
Verdict: withheld reason: two claims the runs and the tree contradict: the crafter's trail/phases/phase-1.md:14 says run 44919934535 at eb59857 brought none of the 18 failures back, and four of those cases failed in it (apps/desktop/test/terminal-basics.test.ts:736, :807, :865, :1013), two with their message of run 44909892650; gaps.md:9 says four cases after the worktree link case failed, and three cases follow it in that file (:807, :865, :1013) and three failed in runs 44915064055 and 44919934535
```

## Re-audit at `5ebc8aa`

Since the block above, three commits: `9bb48d0` and `6546b36` touch only `trail/gate.md` and `guarantee.md`, and `5ebc8aa` touches only `trail/phases/phase-1.md` and `gaps.md` (executed: `git log --no-merges --name-only 1459647..HEAD ^1db6c1f`). Nothing under `apps/`, `.github/`, `package.json` or `pnpm-lock.yaml` differs from `9bb48d0` (executed: `git diff --stat 9bb48d0 HEAD -- apps .github package.json pnpm-lock.yaml`, empty). So `trail/gate.md`'s run `1459647` is followed only by paths under `seal/threads/1795268298-desktop-suite-in-ci/`, and the base still resolves to `1db6c1f`. `seal pr-body 1795268298-desktop-suite-in-ci --body <pr-body.md> --check` on the recomposed body exited 0 (executed). This run re-checks only the claims at the coordinates `5ebc8aa` touched. The claims above that it did not touch stand as they were re-run.

### Claims re-run

| Claim | Source | Command | Result |
|---|---|---|---|
| Run 44919934535 at `eb59857` passed the size check at every start; four of the 18 cases failed again, the link case (`:736`) and the three after it (`:807`, `:865`, `:1013`), the link case and `:807` with their messages of run 44909892650; the other fourteen passed | `trail/phases/phase-1.md:14` | `comm` over the `FAIL` lines of runs 44909892650 and 44919934535, their error lines, and the per-file counts of 44919934535 | holds (executed): 18 cases failed at `f51dae9`, 4 of them failed again in 44919934535, and its one other failure is the Open in case, which is not among the 18; `terminal-basics.test.ts (25 tests | 4 failed)` and `work-item-menu.test.ts (29 tests | 1 failed)` skip nothing, and the run's one skipped case is in `korean-input.test.ts`, so the other fourteen passed; both messages stand in both runs; the size check's message stands in neither |
| At `eb59857` fourteen of the 18 passed, and the four that failed again are the link case and the three after it | `trail/phases/phase-1.md:16` | the same | holds (executed) |
| The three cases after the link case in the file (`:807`, `:865`, `:1013`) then failed, four failures of the file in each run | `gaps.md:9` | `grep -n -E '^\s+it(\.[a-zA-Z]+\([^)]*\))?\(' apps/desktop/test/terminal-basics.test.ts`; the `FAIL` lines of runs 44915064055 and 44919934535 | holds (executed): those three are the only cases after `:736`, and each run failed those three with it in that file |
| That the three failed "on the pane it left open" | `trail/phases/phase-1.md:14`, `gaps.md:9` | not re-run | read: the crafter's account of the cause; the order and the messages (`expected 'Shell 3' to be 'Shell 2'`, `the window never showed one tab`) do not contradict it |

### The parties

| Party | Says | Agrees with | Disagrees with |
|---|---|---|---|
| the design | unchanged: no `frame/`; the issue's two *Done when* lines | as above | none |
| the build | `trail/phases/phase-1.md` now says run 44919934535 failed four of the 18 cases, the link case and the three after it, and passed the other fourteen | the run logs, the tree, and its own paragraph at `:20` and `gaps.md:8-9` on that run | none |
| the last round | no round record (`routing.md`, *Review, straight to the PR*) | — | none |
| the changelog | unchanged | the diff, the phase record, `gaps.md`, `pr.md` | none |
| the orchestrator's part of the pull request body | `pr.md`, unchanged; the records' copy below its line now carries `gaps.md:9`'s three cases | the phase record, `gaps.md`, the changelog, the diff and the runs | none |

Outside the tree, issue #117's body now reads "the three cases after it (lines 807, 865 and 1013 at #30's head)" (executed: `gh issue view 117`).

```seal
target: 5ebc8aa against 1db6c1f
Verdict: sealed
```
