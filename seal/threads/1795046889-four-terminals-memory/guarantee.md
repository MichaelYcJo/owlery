# Guarantee: 1795046889-four-terminals-memory

Audited at `046e6f2` against `ea78b7b`, the commit that `release/v0.0.1@{upstream}`, `origin/release/v0.0.1` and `release/v0.0.1` each resolve to. The first block below is the audit at `0168c60`, and the second, at `41f9194`, withheld on `gaps.md:16` and `gaps.md:18`. Since then `ea8ca87` committed that verdict, `000b421` rewrote those two rows of `gaps.md`, and `046e6f2` added a run to `trail/gate.md`. Nothing outside the work item's directory changed after `0168c60`. This audit reads the two rewritten rows against the records and the tree. It carries the reading at `41f9194` of every other sentence of `gaps.md`, which `000b421` did not touch, and the re-runs of the code at `0168c60`. The app was not started.

## Claims re-run

| Claim | Source | Command | Result |
|---|---|---|---|
| The broad gate ran at HEAD | `trail/gate.md:12` | `git log --no-merges --name-only 000b421..HEAD ^ea78b7b` | holds: `000b421` is an ancestor of HEAD, and only `046e6f2` follows it, which touches `trail/gate.md` alone |
| The body copies `pr.md` and the records | the body file `pr-body.md` the spawn names, 65,282 characters | `seal pr-body seal/threads/1795046889-four-terminals-memory --body <file> --check` | holds: exit 0, `matches` |
| The records arm of the chain holds at HEAD | `trail/rounds/round-1.md` to `round-10.md` | `chain_check.py --baseline ea78b7b --sealing` | holds: exit 0. It prints only that the guarantee is behind HEAD and that its newest block reads `withheld`, which this run answers |
| No code changed since the first audit | the spawn's account | `git diff --quiet 0168c60 HEAD -- . ':!seal/threads/1795046889-four-terminals-memory'` | holds: exit 0. The re-runs of the code at `0168c60` are carried: scenario 10, the cases seen red, the mutants, `## Removes`, and scenarios 12 to 14 |
| `000b421` changes `gaps.md:16` and `gaps.md:18` alone | the spawn's account | `git diff ea8ca87 000b421`; `git diff --quiet ea8ca87 -- guarantee.md` | holds: two lines of `gaps.md` change. The committed `guarantee.md` is the one the second block's run wrote |
| Row 12's close: 19 case files, 474 passed, 1 skipped, the Korean input case among them under `OWLERY_BACKGROUND=1` | `gaps.md:12` | the kept outputs `seal-gate-azh0o1iq`, `-8srukr6e` and `-6zzda72j` (`f0baf13`, `dcb6e4d`, `000b421`) `suite.txt`, read | holds: all three read `tsc --noEmit`, `Test Files 19 passed (19)` and `Tests 474 passed \| 1 skipped (475)`, exit 0. The one skipped is the person's typed run, `korean-input.test.ts:321`, as the second block's run read |
| Second launches of `inbox`, `one` and `eight-in-turn` within 6 MB of the first; no launch of phase 4 failed by `unread`; the other rewritten sentences of `dcb6e4d` | `gaps.md:8`, `:9`, `:13`, `:14`, `:17`, `:21`, `:25`, `:37`, `:43` | carried from the run at `41f9194`. `000b421` touched none of these lines | holds: 0.4, 5.7 and 1.0 MB apart. Thirteen launches passed, exit 0, after `b8f9fc7` |
| Thirteen `detach` messages in phase 3's drive | `gaps.md:16` | `trail/phases/phase-3.md:54`, read | holds: the record counts thirteen up to the inbox. The closed pane's `detach`, after the reload, is no longer counted among them |
| Phase 4's drive ran the wiring it added | `gaps.md:18` | `trail/phases/phase-4.md:46-53`, read | holds: the tiles, the press inside a tile, the control and the size held back for an exited pane. The sentence no longer reads as `detachUnshown`'s `detach` |
| The decisions stand in `screenTurns`, `recentKept` and `stageOf`; the last two changed after phase 4's drive, and no start of the app has closed the pane in front since | `gaps.md:18` | `git show f37bb25:apps/desktop/src/renderer/view.ts \| grep -c recentKept`; `git log ea78b7b..HEAD -- apps/desktop/src/renderer/view.ts`; `git grep -n -i close` over `test/memory.ts`, `test/korean-pane.ts`, `test/korean-input.test.ts` | holds: `recentKept` is absent at `f37bb25` (0) and came in `f155c71`. `stageOf` changed in `bb77204`, after `f37bb25`. The starts after them, the sealer's three `four` launches and the broad runs' Korean case, have no close step |

## The parties

| Party | Says | Agrees with | Disagrees with |
|---|---|---|---|
| the design | unchanged since `0168c60` | carried from the first block below | none |
| the build | unchanged since `0168c60`. Four phases, each with its `trail/phases/phase-N.md`, as `routing.md` `Implementation` `crafter` asks | carried from the first block below | none |
| the last round | Round 10, at `40590df`, unchanged. Its finding was closed `fixed c1fe8a4` in the records alone | carried from the first block below | none. No round reads `dcb6e4d` or `000b421`, which touch `gaps.md` alone, so this audit reads them |
| the changelog | unchanged since `0168c60` | carried from the first block below | none |
| the orchestrator's part of the pull request body | `pr.md`, unchanged since `0168c60`: "Part of #9", and the five quotes | carried from the first block below; the issue stays open | none |
| the orchestrator's closing memo, `gaps.md` at `000b421` | the rows and *Not done* point at the phase records, row 12 is closed on the broad run, and rows 16 and 18 are corrected | the phase records, the broad runs' output and the tree, for every sentence the two rewrites touched | none |

## Not verified

| What | Who answers |
|---|---|
| A person's run of the measurement, without `OWLERY_BACKGROUND` (`frame/questions.md` Q5) | the owner, at the machine |
| The window's wiring in the app where the pane in front closes, and two panes started before a view left the screen | `read` in the wiring; the owner at the window, as `gaps.md:18` names |
| The desktop suite, the typecheck and the Korean input case at HEAD | `read`: the orchestrator's broad run at `000b421` (`trail/gate.md`), not run again (contract rule 2) |

```seal
target: 0168c60 against ea78b7b
Verdict: sealed
```

```seal
target: 41f9194 against ea78b7b
Verdict: withheld reason: the orchestrator's closing memo as dcb6e4d rewrote it. gaps.md:18 says the wiring's decisions moved later into view.ts#screenTurns, #recentKept and #stageOf and that no start of the app has run the wiring since, but screenTurns and stageOf stood at f37bb25 (view.ts:644, :555) when phase 4's drive ran the wiring, and after bb77204 the sealer's three launches of four at 0168c60 and the broad runs' Korean input case at f0baf13 and dcb6e4d started the app and ran it. gaps.md:16 counts a closed pane's detach among the thirteen of phase 3's drive, which trail/phases/phase-3.md:54 counts up to the inbox, before the reload and the close at :59
```

```seal
target: 046e6f2 against ea78b7b
Verdict: sealed
```
