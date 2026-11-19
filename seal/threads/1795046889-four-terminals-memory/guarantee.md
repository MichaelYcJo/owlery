# Guarantee: 1795046889-four-terminals-memory

Audited at `41f9194` against `ea78b7b`, the commit that `release/v0.0.1@{upstream}`, `origin/release/v0.0.1` and `release/v0.0.1` each resolve to. The earlier audit, at `0168c60`, ended in the first block below. Since then `dcb6e4d` rewrote `gaps.md`, `9997103` added this file and `41f9194` added a run to `trail/gate.md`, and nothing outside the work item's directory changed. This audit therefore re-reads `gaps.md` against the phase records, the round records, `trail/gate.md`, the broad runs' output and the tree. It carries the earlier audit's re-runs of the code, which read nothing that changed. The app was not started.

## Claims re-run

| Claim | Source | Command | Result |
|---|---|---|---|
| The broad gate ran at HEAD | `trail/gate.md:8` | `git log --no-merges --name-only dcb6e4d..HEAD ^ea78b7b` | holds: `dcb6e4d` is an ancestor of HEAD, and only `41f9194` follows it, which touches `trail/gate.md` alone |
| The body copies `pr.md` and the records | the body file `pr-body.md` the spawn names | `seal pr-body seal/threads/1795046889-four-terminals-memory --body <file> --check` | holds: exit 0, `matches` |
| The records arm of the chain holds at HEAD | `trail/rounds/round-1.md` to `round-10.md` | `chain_check.py --baseline ea78b7b --sealing` | holds: exit 0. It prints only that the guarantee is behind HEAD, since `dcb6e4d` touches `gaps.md` |
| No code changed since the earlier audit | the spawn's account | `git diff --quiet 0168c60 HEAD -- . ':!seal/threads/1795046889-four-terminals-memory'` | holds: exit 0. The earlier audit's re-runs of the code at `0168c60` (scenario 10, the cases seen red, the mutants, `## Removes`, scenarios 12 to 14) are carried and not run again |
| Row 12's close: `pnpm -r run check` ran the typecheck of the whole app and 19 case files, 474 passed and 1 skipped, the Korean input case among them under `OWLERY_BACKGROUND=1` | `gaps.md:12` | the kept outputs `seal gate` names, `seal-gate-azh0o1iq/suite.txt` for `f0baf13` and `seal-gate-8srukr6e/suite.txt` for `dcb6e4d`, read; `apps/desktop/package.json`, `tsconfig.json`, `test/korean-input.test.ts`, `test/memory.test.ts` and `test/built-app.ts:127` read at HEAD | holds: both outputs read `tsc --noEmit`, `Test Files 19 passed (19)` and `Tests 474 passed \| 1 skipped (475)`, exit 0. `apps/desktop` is the only package, and its `tsc` includes `src` and `test`. The one skipped case is the person's typed run, `korean-input.test.ts:321`. The measurement's launches number none with `OWLERY_MEASURE_MEMORY` unset (`memory.test.ts:287`). So the Korean case's `BuiltApp.start` with no `keepBackground` ran, and that start sets `OWLERY_BACKGROUND=1` |
| Second launches of `inbox`, `one` and `eight-in-turn` fell within 6 MB of the first | `gaps.md:8` | `trail/phases/phase-1.md:9-11`, `phase-3.md:10`, `phase-4.md:7-9` and the outputs `phase-4/measure-rest.txt` and `phase-3/measure.txt`, read | holds: 156.4 against 156.0 MB, 454.1 against 459.8 MB and 480.3 against 481.3 MB, so 0.4, 5.7 and 1.0 MB apart |
| None of phase 4's thirteen launches, made after the rule, failed by `unread` | `gaps.md:43` | `git merge-base --is-ancestor b8f9fc7 f37bb25`; `git show f37bb25:apps/desktop/test/memory.ts`; `phase-4/measure-fours.txt`, `measure-rest.txt` and their `.exit` files, read | holds: the rule is an ancestor of `f37bb25`, where `measure` throws on `unread`'s sentence (`memory.ts:495`). The two runs read 9 passed and 4 passed, exit 0. Phase 3's one launch at `5814c92` was also made after the rule and passed. The memo does not name that launch, and that does not make the sentence false |
| Every launch of phases 1, 3 and 4 was kept | `gaps.md:9` | `phase-1/measure-1.txt`, `measure-2.txt`, `phase-3/measure.txt`, read | holds: the run whose tables were lost read 3 passed, exit 0, like the second run. Phase 3's read 1 passed |
| Phase 3's drive read the exit line before and after a reload, and phase 4's drive sent no `resize` for an exited pane | `gaps.md:13`, `gaps.md:17` | `trail/phases/phase-3.md:57-59`, `phase-4.md:53`, read | holds |
| Three pictures with WebGL, of one screen passed across three panes and of four tiles made twice | `gaps.md:14` | `trail/phases/phase-4.md:49`, read | holds |
| Thirteen `detach` messages in phase 3's drive, a closed pane's among them | `gaps.md:16` | `trail/phases/phase-3.md:54`, `:58-59`, read; the drive's output `phase-3/drive.txt:24,29`, read | does not hold: the record counts thirteen "up to the inbox", and the pane was closed after the reload. The output lists the thirteen as panes 1 to 8, 5, 6, 5, 6 and 7, and the close's `detach 7` after the reload, at `close 7`. The closed pane's `detach` was sent, as the fifteenth of the run |
| The decisions of the pool's wiring "moved later" into `screenTurns`, `recentKept` and `stageOf`, "and no start of the app has run the wiring since" | `gaps.md:18` | `git show f37bb25:apps/desktop/src/renderer/view.ts`; `git merge-base --is-ancestor 72e15fc f37bb25`; `git log ea78b7b..HEAD -- apps/desktop/src/renderer/view.ts`; `apps/desktop/test/memory.ts#STEPS` and `#sideBySide` read at HEAD | does not hold. `screenTurns` (`72e15fc`) and `stageOf` were in `view.ts` at `f37bb25` (`:644`, `:555`), the tree phase 4's drive ran, and the row's sentence before this one rests on `screenTurns` in that drive. After the last change to the decisions, `bb77204`, the sealer's three launches of `four` at `0168c60` (the first block below, `9997103`) started the app, added four panes and pressed "Side by side" until four tiles drew. The broad runs at `f0baf13` and `dcb6e4d` ran the Korean input case, which opens a pane in the window. What holds is narrower: no start since `f155c71` and `bb77204` has closed the pane in front (`git grep -n -i close` finds no close step in `test/memory.ts`, `test/korean-pane.ts` or `test/korean-input.test.ts`) |
| Phase 4's drive "ran the rest" | `gaps.md:18` | `trail/phases/phase-3.md:28`, `:50`; `phase-4.md:44-56`, read | reads two ways. After "all but the `detach` of `detachUnshown`", "the rest" can include that `detach`, which no record shows a run of. Phase 4's drive ran the tiles, the press inside a tile, the control and the held-back size, which is what the earlier text said |
| Phase 1 and phase 3 launched each of their scenarios once | `gaps.md:25` | `trail/phases/phase-1.md:22`, `:64`, read | holds as the record states it, "Each scenario has one launch". Phase 1 also made three launches whose tables were lost |
| No start of the app was made at a tree before round 3's fix | `gaps.md:21` | `trail/phases/phase-4.md:54`, read | holds in the row's sense, a start that drives the crossing, and in the record's words. Phase 3's drive at `5814c92` was a start before the fix that drove no crossing |
| The question a hidden pane asks: why, and the choices weighed, are in `frame/plan.md` *Judgments of the run* and `frame/design.md` *Scope* item 9 | `gaps.md:37` | `frame/plan.md:41`, `:106`; `frame/design.md:86-89`, read | holds for sending every replay's answers and for a screen state the daemon keeps. The third choice the earlier text named, sending no replay's answers, stands in no record now. That is a loss of text and contradicts nothing |

## The parties

| Party | Says | Agrees with | Disagrees with |
|---|---|---|---|
| the design | unchanged since `0168c60` | carried from the first block below | none |
| the build | unchanged since `0168c60`; four phases, each with its `trail/phases/phase-N.md`, as `routing.md` `Implementation` `crafter` asks | carried from the first block below | none |
| the last round | Round 10, at `40590df`, unchanged; its finding closed `fixed c1fe8a4` in the records alone, read by the earlier audit | carried from the first block below | none. No round reads `dcb6e4d`, which touches `gaps.md` alone, so this audit reads it |
| the changelog | unchanged since `0168c60` | carried from the first block below | none |
| the orchestrator's part of the pull request body | `pr.md`, unchanged since `0168c60`: "Part of #9", and the five quotes | carried from the first block below; the issue stays open | none |
| the orchestrator's closing memo, `gaps.md` at `dcb6e4d` | the rows and *Not done* rewritten to point at the phase records, row 12 closed on the broad run | the phase records, the broad runs' output and the tree, for every rewritten sentence but the two below | `gaps.md:16` and `gaps.md:18`, as the rows above give them |

## Not verified

| What | Who answers |
|---|---|
| A person's run of the measurement, without `OWLERY_BACKGROUND` (`frame/questions.md` Q5) | the owner, at the machine |
| The window's wiring in the app where the pane in front closes, and two panes started before a view left the screen | `read` in the wiring; the owner at the window, as `gaps.md:18` names |
| The desktop suite, the typecheck and the Korean input case at HEAD | `read`: the orchestrator's broad run at `dcb6e4d` (`trail/gate.md`), not run again (contract rule 2) |

```seal
target: 0168c60 against ea78b7b
Verdict: sealed
```

```seal
target: 41f9194 against ea78b7b
Verdict: withheld reason: the orchestrator's closing memo as dcb6e4d rewrote it. gaps.md:18 says the wiring's decisions moved later into view.ts#screenTurns, #recentKept and #stageOf and that no start of the app has run the wiring since, but screenTurns and stageOf stood at f37bb25 (view.ts:644, :555) when phase 4's drive ran the wiring, and after bb77204 the sealer's three launches of four at 0168c60 and the broad runs' Korean input case at f0baf13 and dcb6e4d started the app and ran it. gaps.md:16 counts a closed pane's detach among the thirteen of phase 3's drive, which trail/phases/phase-3.md:54 counts up to the inbox, before the reload and the close at :59
```
