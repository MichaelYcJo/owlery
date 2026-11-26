# Review round 2: 1795710118-291-292-295-three-cases-hold-under-load

```seal
target: 8b9fb9a5, fixes ae3e57ee..f5034186
```

This is a verifying round. Its target is the diff from round 1's target `ae3e57ee` to HEAD `8b9fb9a5`. That diff holds four commits: `db85e23f`, which commits round 1's record; `291bf7c9`, the orchestrator's rewrite of the plan's judgment row; `f5034186`, the fix commit; and `8b9fb9a5`, which appends the two close blocks to round 1. The code it changes is three lines of `apps/desktop/test/daemon.test.ts`, the inbox case of #291. No new unit was added. From round 1 this round carried coordinates and no verdicts: the case's lines, the plan row, and the phase record's paragraphs 7 and 11. Since round 1's record was committed, its body is unchanged, and only the two close blocks were added (executed, `git diff db85e23f..HEAD` over `round-1.md`). The work item's other records, `frame/design.md`, `gaps.md`, `changelog.md`, `pr.md` and `routing.md`, are unchanged since `ae3e57ee` (executed, `git diff --stat ae3e57ee..HEAD`), and round 1's reading of them still holds. `pr.md` quotes the plan's row 13, which the fix pass left alone.

## Findings

No finding.

## Confirmations

```seal
confirms: round-1#1
```
What holds: the inbox case now reads `d["clients"].size` and awaits `d["readingCommits"]` (`apps/desktop/test/daemon.test.ts:3901-3902`), where `d` is the `Daemon` that the case's `daemon(...)` call returns (`:3894`). No cast through `unknown` is left in the case. Round 1's probe showed that TypeScript checks a bracket read of a private member both by name and by type, so a renamed `readingCommits` now fails the typecheck, where before it read as `undefined` with no error. The fix pass's own run reports the same `TS2551` against `Daemon`; this round read that report and did not run it again. The case's comment now says the fields are read by name, which the typecheck reads. The listings were run again at HEAD (executed). `git grep -n -e "as unknown as" -- apps/desktop/test/daemon.test.ts` prints only `:5729`, the `headless` read, which round 1 left because a rename of it throws at once. `git grep -n -F "cast"` over the work item's directory prints `frame/plan.md:14` and `trail/phases/phase-1.md:7`. Both name the cast as the form that was not kept. They no longer say the case uses it. The plan row's claim that the typecheck checks both names and types matches round 1's probe. Its *Judged against* column cites round 1's finding 1, which is where the grounds now stand. The case still passes (executed, the one narrow run under `## Probes`). The fix changed only how the wait reads the two fields, not what the case asserts, so the mutation of the timer's `clients.size === 0` guard that round 1 read as red still applies. The fix pass reports running that mutation again, red with 4 received (read).

```seal
confirms: round-1#2
```
What holds: `trail/phases/phase-1.md:11` now says the helper `failing` moved "with its code unchanged", and that its doc comment was rewritten to list what the helper asserts. That matches the diff of the helper between `c80b900a` and the target, which round 1 read. `git grep -n -F "moved to the head of the describe block, unchanged"` over the work item's directory finds the old sentence only in round 1's own quotes of it (executed).

## Not judged

| What | Location | Who answers |
|---|---|---|
| The broad gate at HEAD, the typecheck among it, which reads `d["clients"]` and `d["readingCommits"]` against the `Daemon` class. This round ran one narrow case. | `seal/config.json` `Broad gate` | the orchestrator, at the broad gate |
| The `check` job on GitHub's runner, where #291 and #295 failed. | the pull request's `check` job | the orchestrator, from the pull request |

## Probes

| Command | Result |
|---|---|
| `ELECTRON_OVERRIDE_DIST_PATH=.../electron/dist/Electron.app/Contents/MacOS node scripts/test-in-electron.mjs test/daemon.test.ts -t 'reads no count while no client is connected' --reporter=verbose` | exit 0: 1 passed, 407 skipped; the inbox case 1218 ms |
