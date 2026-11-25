# Review round 2: 1795559731-pane-menu-cases-wait-on-what-they-read

```seal
target: ac0ac925, fixes 524b0376..ac0ac925
```

This is a verifying round over three commits. `4399091d` is the framer's fold of `frame/plan.md`. `ad5fcc5f` carries the hook's bound and the line numbers of `gaps.md`. `ac0ac925` writes the close blocks of round 1. `git diff --stat 524b0376 ac0ac925` names four files: `apps/desktop/test/terminal-basics.test.ts`, `frame/plan.md`, `gaps.md` and `trail/rounds/round-1.md`. So `routing.md`, `frame/design.md`, `frame/questions.md`, `changelog.md`, `pr.md` and the four phase records are the same as at `16214165`, which round 1 read whole. Executed. Round 1's reading of those files is carried, not done again. `frame/plan.md` and `gaps.md` were read whole at `ac0ac925`. Read.

## Findings

None.

## Confirmations

```seal
confirms: round-1#1
```
What holds: the `afterEach` of `apps/desktop/test/terminal-basics.test.ts:159-165` now closes with `}, 30_000);`. That is the bound the describe gives each case, and it covers the 15 seconds `BuiltApp.until` waits at line 162 (`apps/desktop/test/built-app.ts:266`). Round 1's `evidence: executed` line was run again, with the bound beside it. In one probe file in the round's clone at `ac0ac925`, an `afterEach` that waits 12 seconds inside `describe(..., { timeout: 30_000 })` failed with "Hook timed out in 10000ms." where it named no bound. The same hook with `30_000` passed. Executed. The comment on the step, line 158, now says why it is bounded, and what it says is true: `BuiltApp.until` defaults to 15 seconds and a hook to 10. The close says the crafter showed the step red and then green in the built app with a `throw` and an 11-second pause. This round did not run that again. The unit probe settles the bound by itself, and the close's account agrees with it. The close says the other hooks of the file already name their bounds. That holds: `beforeAll` takes `120_000` and `afterAll` takes `30_000` (lines 107 and 112). Read.

```seal
confirms: round-1#2
```
What holds: `seal/threads/1795559731-pane-menu-cases-wait-on-what-they-read/gaps.md:10` now names lines 669 and 749 as lines of `f521b5c2`. At that commit those are the card check and the link check the row means, and round 1's `git show f521b5c2:... | sed -n '669p;749p'` printed them. The close says no other line of `gaps.md` or `changelog.md` gives a line number. A search for the word "line" next to a number over both files at the target finds only this row. Executed.

```seal
confirms: round-1#3
```
What holds: `frame/plan.md:11` now says that where the replay is more than 15 seconds late or never comes, the cases that wait for a returned pane's replay fail at `untilReplayDrawn`. It says the Shift+Enter case fails first, and the menu-open case fails the same way before its paste. It says a sooner replay is taken up by the wait. The quoted message is what `comeOnto` throws for the `what` that `untilReplayDrawn` hands it (`terminal-basics.test.ts:383` and `:398`). The Shift+Enter case's call, at line 535, is the first call in the file, and the menu-open case's call at line 1040 comes before `pasteOnceBack`. Read. The rest of the paragraph is as round 1 found it. No other sentence of the work item's records says the menu-open case names the paste: `git grep -n "names the paste"` over the work item prints only round 1's own record. Executed.

What matched: the new unit in the fix diff, the *Overlap* row for #149 at `frame/plan.md:46` with its sentence in the paragraph at line 42. This round read the row as new text. Each claim was checked against pull request #203 at `a964e973`, its head commit by `gh pr view 203 --json headRefOid`. Executed. Against the merge base `4a005ebf`, #203 changes five files under `apps/`: `measurements/built-app-launch.md`, `package.json`, `test/launch.test.ts`, `test/launch.ts` and `test/memory.ts`. So `package.json` is the one file both pull requests change, and #203 touches neither `terminal-basics.test.ts`, `built-app.ts` nor any file under `apps/desktop/src`. Executed. Its `package.json` diff adds the `test:app` and `measure:launch` lines under `scripts`, and the version line is not touched. Its `test/memory.ts` diff exports `listed` and `footprintsOf`, the two functions the row names. Executed. Line 62 of #203's `frame/plan.md` says "This pull request does not move the version: #168 does." Line 58 says that, where Q1 is answered with the shared app, #168 merges first because the shared app's reset would be shown against this file's cases. The row states both. Read. Round 1's Not judged row on #149 is answered by the rewrite.

What matched: the fix diff touches no line of `apps/desktop/src`, so the round 1 reading of the app's rule carries unchanged. Executed, by the diff stat.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The full suite, the repository-wide typecheck and the broad gate of `seal/config.json`. They are `unverified` here: this round ran one probe file. With no finding left open, what comes due is the orchestrator's broad run, and the sealer's spawn after it | `seal/config.json` `Broad gate` | the orchestrator |
| Whether both menu cases pass on the first attempt of `check` three runs in a row on the hosted runner | `frame/questions.md` Q1 | the orchestrator, from the pull request's runs |

## Probes

| Command | Result |
|---|---|
| `node scripts/test-in-electron.mjs test/test_tmp_hook_bound.test.ts`, from `apps/desktop` of the round's clone at `ac0ac925`: two `afterEach` hooks of 12 s inside `describe(..., { timeout: 30_000 })`, one without a bound and one with `30_000` | 1 failed with "Hook timed out in 10000ms.", 1 passed, exit 1 as the unbounded half intends |
| `git fetch origin pull/203/head` into a temporary ref, then `git diff --stat 4a005ebf a964e973 -- apps` and the diffs of `package.json` and `test/memory.ts` | five files under `apps/`, as above. The temporary ref was deleted after the read |
