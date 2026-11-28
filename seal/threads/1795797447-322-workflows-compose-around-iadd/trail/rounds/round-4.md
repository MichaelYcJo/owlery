# Review round 4: 1795797447-322-workflows-compose-around-iadd

```seal
target: 67902de0, fixes 841519da..67902de0
```

This is a verifying round. It answers the three findings round 3 closed, and it reviews the code of the fix range `841519da..67902de0`: `243cfa33`, `d134bfc4`, `e20c01e4`, `f824096e` and `65a5c2d9` for findings 1 and 2, `608361b2` for finding 3, `f4e41f58` and `c5ac7e94` for the screenshot run, which no finding named, and `04de0d32` for `gaps.md`. The range holds no merge of the base. The round read a `git clone --no-local` of the repository checked out at `67902de0`, under the proofer's scratch directory, and never the branch's worktree, where a crafter builds phase 4. The base is `origin/release/v0.2.0` at `a75f4581`. No `seal/parity.json` is declared, so no parity comparison is owed. `seal/config.json` sets `Record language` and `Commit and pull request language` to English. The work item holds no `changelog.md`, `pr.md` or `pr.<lang>.md` at the target.

Read whole at the target: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `trail/phases/phase-3.md` and `trail/rounds/round-3.md`. `trail/phases/phase-1.md`, `trail/phases/phase-2.md`, `trail/rounds/round-1.md` and `trail/rounds/round-2.md` were not opened again: the fix range changes none of them, and round 3 carries their coordinates. Read whole in the code: the diff of the fix range for every file it changes, and `apps/desktop/src/daemon/records-migration.ts` at the target, lines 1 to 590. Read in the callers: `apps/desktop/src/daemon/record-blocks.ts#read` (`:607-642`), `apps/desktop/src/daemon/decision-record.ts#writeRecord` and `#head` (`:452-487`), `apps/desktop/src/renderer/summary.ts:74` and `apps/desktop/src/renderer/shared.ts:174-185`.

Carried from round 3 rather than established again: the coordinates of `earlierRecordsSays`, of `planned` and of the plan's refusal paths, the fixture helpers of `records-migration.test.ts` (`earlier`, `ROUND`, `DECISIONS`), and the shapes of round 3's probe `test_tmp_round3.test.ts`, which the two new cases now commit. Every verdict below was reached at this target.

The axes walked, beyond the table of `skills/code-review/SKILL.md`: the two callers of `rewrite` with and without `stray`; a record below `iadd/threads/` that holds no block IADD's grammar reads, with a shown block the earlier grammar reads and with one it refuses; what the commit removes once it names no folder; the record kinds Owlery itself writes, and whether any of them can hold no block; and the screenshot run's selector and its stand-in for `gh` against the renderer.

## Findings

### 1. `gaps.md` says the cost of dropping round 3's second condition is a chain refused until the fence is edited, but where the shown block reads in the earlier grammar, `migrate` commits that example as a live IADD block, and the paragraph's example names a `decisions.md` Owlery never writes

```seal
severity: should
location: `seal/threads/1795797447-322-workflows-compose-around-iadd/gaps.md:28`
evidence: executed the probe `test_tmp_round4.test.ts` of `## Probes`, its two cases; executed `git grep -n -F -e 'until the fence is edited' -e 'with no entry yet' -e 'reads as earlier-form' -e 'holds no block IADD' -- seal apps/desktop/src apps/desktop/test`, which printed `gaps.md:28`, `records-migration.ts:327`, `records-migration.test.ts:483` and `round-3.md:72`; read `apps/desktop/src/daemon/records-migration.ts:330-340`, `apps/desktop/src/daemon/records-migration.ts:155-163`, `apps/desktop/src/daemon/records-migration.ts:440-462`, `apps/desktop/src/daemon/decision-record.ts:452-487`, `seal/threads/1795797447-322-workflows-compose-around-iadd/frame/design.md:34`, `seal/threads/1795797447-322-workflows-compose-around-iadd/frame/design.md:105`, `seal/threads/1795797447-322-workflows-compose-around-iadd/gaps.md:26-28`
regression: round-3#2
```

Why it matters: the unit is the paragraph `04de0d32` added at `gaps.md:28`, which states what the narrowed test of `records-migration.ts#rewrite` costs. The frame decides that `migrate` rewrites records in the earlier form it finds under `iadd/threads/` (`frame/design.md:34`). The fix narrowed that test to records of which IADD's grammar reads no block (`records-migration.ts:339`). It wrote a paragraph that gives the whole of the narrowed test's cost to the dropped condition, and names only one of the cost's two outcomes. The orchestrator reads this paragraph to place that cost, so a sentence there that says less than the code does is one it acts on.

The paragraph says: "What it costs: a record of IADD's form that holds no block IADD's grammar reads and shows a fence of info `seal` in its prose, such as a `decisions.md` with no entry yet, is read as the earlier form's, and the chain refuses its work item until the fence is edited." The probe committed such a `decisions.md` under a moved repository's `iadd/threads/1-x/`. It held the head Owlery writes, a sentence, and a top-level fence of info `seal` that shows one decision as an example.

- Where the earlier grammar refuses the shown lines (`decision: <id> <kind>`), the paragraph holds. `earlierRecordsSays` gives the sentence that names `migrate`, and the plan is blocked at `iadd/threads/1-x/decisions.md:6`.
- Where the earlier grammar reads them (`decision: 1 route`), the chain is refused with the same sentence. That sentence sends the session to `migrate`, and its plan is not blocked. Its commit is `M iadd/threads/1-x/decisions.md`. It rewrites the example's opener to three backticks and `iadd`. `readDecisionRecord` then reads decision 1, "No framer.", which nobody decided, and `earlierRecordsSays` gives null. The chain then runs on that decision. It is not refused until the fence is edited.

The second outcome does not come from the dropped condition. Round 3's paste-ready `writtenEarlier` reads the same record as the earlier form's too, since the earlier grammar reads one block of it. So the paragraph's "Without it" sentence and its "What it costs" sentence together say that the condition's drop alone costs something, and that the cost is a refusal. Both are wrong for the readable case. The example "a `decisions.md` with no entry yet" also names a state Owlery does not produce. `decision-record.ts#writeRecord` writes a record only where the change gives a text other than the one it had, and every change it takes writes a block. So a `decisions.md` with no block is one a person or a session wrote by hand, as a round record or a gate's run with no block would be.

The search reads the paragraph's own words, so it is a sample under contract rules 12 and 19: a statement of the cost in other words escapes it. Of what it printed, `records-migration.ts:327` (the docstring of `rewrite`) and `records-migration.test.ts:483` (a case's comment) say what the code does and stay. `round-3.md:72` is round 3's closed finding, and it stays. The repair rewrites the paragraph's last two sentences:

```markdown
seal/threads/1795797447-322-workflows-compose-around-iadd/gaps.md:28, in place of the two sentences from "What it costs:" to the paragraph's end:

What the drop costs: a record of IADD's form that holds no block IADD's grammar reads, and shows in its prose a fence of info `seal` whose lines the earlier grammar refuses, is read as the earlier form's. The chain refuses its work item with the sentence that names `migrate`, and the plan is blocked at the refused line until the fence is edited. What the narrowed test costs with or without the condition: where the earlier grammar reads the shown block, the plan is not blocked, and `migrate`'s commit rewrites that fence's opener to IADD's, so the example becomes a block the chain reads, such as a decision of `decisions.md` that nobody made. Owlery writes no such record: a round record and a gate's run of IADD's form hold a block from their first commit, and `decision-record.ts#writeRecord` writes a `decisions.md` only with the block its change adds, so such a record is one a person or a session wrote by hand. Whether the plan refuses such a record rather than rewrite it is the orchestrator's to place.
```

```seal
verdict: fixed c41f1613
answer: gaps.md:28 now carries the round's paste-ready text, naming both outcomes, and places the question whether the plan should refuse such a record on issue #343 in hardening. The orchestrator made the repair in the work item's records.
```

## Confirmations

```seal
confirms: round-3#1
```
What holds: `planned` takes as the kept root the first of `EARLIER_ROOTS` under whose `threads/` the commit holds a file (`records-migration.ts:431`). It moves that `threads/` alone (`moving`, `:434`, `:438`), and gives git's status that path (`:480`). `migrateRecords` removes each file the plan moves to another path and no folder (`:525`), read. The docstrings of `planned` (`:347-352`), `migrateRecords` (`:493-507`) and `MigrationPlan.from` and `.moves` (`:277-280`) say the same, read. With the whole root, every entry below it that is not a file blocks the plan (`odd`, `:469`), so the list of moved files is the list of the root's files, and the commit removes what `git rm -r` of the folder removed before, read. The case at `records-migration.test.ts:347-390` runs round 3's shape twice, once with `seal/notes.txt` alone and once beside a `seal/README.md` of the project's own. It also keeps `agentic-seal/config.json` committed and `agentic-seal/local.txt` untracked, read. With `:431` put back to `holds(root)` in the clone, the case failed with "fatal: no path specified", as the close reports, executed. With the line restored, `records-migration.test.ts` passed, 13 cases, executed.

```seal
confirms: round-3#2
```
What holds: `rewrite` takes `stray`, and below IADD's root it gives null for a record of which IADD's grammar reads a block (`records-migration.ts:339`). `earlierRecordsSays` passes `true` (`:162`), and the plan passes its `stray` (`:448`), read. A round of IADD's form whose prose shows a fence of info `seal` is no longer the earlier form's. The case at `records-migration.test.ts:472-488` holds it, and holds the refused earlier round of the second half, read. With `:339` removed in the clone, the case failed at `earlierRecordsSays(...)` `toBeNull`, executed. `gaps.md:26` holds the round's sentence on the mixed record, word for word, read. The docstrings of `earlierRecordsSays` (`:117-118`) and `planned` (`:356-357`) name the test as "a record the earlier form wrote, as `rewrite` tells one below IADD's root", read. The paragraph the fix pass added at `gaps.md:28` is finding 1.

```seal
confirms: round-3#3
```
What holds: `608361b2` removes the four sentences round 3 named, word for word, at `docs/product.md:24`, `:204` and `docs/product.ko.md:24`, `:204`, read. The finding's evidence search, run again at the target, prints only the case title `apps/desktop/test/daemon.test.ts:8856`, which states no choice, executed. Both editions hold 15 headings and 36 table rows, executed with `grep -c`.

What matched: the first departure the fix pass declared, which left out the `writtenEarlier` helper round 3 proposed. `skills/implement/fix-pass.md` *A fix that needs a unit the frame does not name waits for the fold* names "a function ... private helpers among them" as a unit. `writtenEarlier` was a new module-level name the frame holds nowhere, so the stop applies to it. The same section says that "a change to the body of a part the tree already holds", such as "a branch added to a function", adds no unit. An optional parameter of `rewrite` and the one line that reads it change a function the tree already holds. `moving` is a constant local to `planned`, not a module-level name. So the departure holds, read. It gives both callers one test, as round 3's helper did. It also keeps the old order in which a `guarantee.md` and a `trail/refusals.md` are told before the block kinds (`:335-336`). Neither of those two outcomes differs from the helper's.

What matched: the second departure, which dropped the condition "the earlier grammar reads at least one block". `frame/design.md:105` asks that a record holding a block the earlier reader refuses be named by file and line, with no commit. With the condition, a round record or a gate's run of the earlier form whose every block the earlier grammar refuses would read under `iadd/` as IADD's record of no blocks, and nothing would name it. That is the silent loss the scenario rules out. Without the condition, the cost is a refusal that names the line, on a record only a hand can write, which the probe's second case shows. So the departure's trade holds against the scenario, and its cost is acceptable, executed and read. What `gaps.md:28` says the trade costs is finding 1.

What matched: the screenshot run's repairs. Each summary line carries `markPlace("line", ...)` (`apps/desktop/src/renderer/summary.ts:74`), whose class is `mark` and whose `dataset.inspection` holds the state (`apps/desktop/src/renderer/shared.ts:176-185`), so `f4e41f58`'s selector reads what the line draws, read. `c5ac7e94`'s stand-in for `gh` answers a check named `inspection`, which matches `CHECKS` of `apps/desktop/test/screenshots.test.ts:254`, read. The sample `gaps.md:42` states is labelled a sample, read.

What matched: `chain-command.test.ts` and `pr-check.test.ts`, the unit files besides `records-migration.test.ts` that the close says call the move, passed, 51 cases, executed.

A case gap, with no finding: neither new case puts a `trail/refusals.md` or a `guarantee.md` below `iadd/threads/` beside a record of IADD's form, so nothing pins that `rewrite` still tells those two before the `stray` line (`records-migration.ts:335-339`). The earlier case at `records-migration.test.ts:392` holds the `guarantee.md`, and no case holds the order.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The broad gate at `67902de0`: the whole suite, the typecheck and the documents' editions. The suite is `unverified` | the repository's `Broad gate` key of `seal/config.json` | the orchestrator, in the broad gate it runs alone once the rounds settle |
| The built-app files of `gaps.md:22` (`records-dialog.test.ts`, whose dialog runs `migrateRecords`), and the screenshot run `gaps.md:42` reports as passed at `c5ac7e94`. This round ran no built-app case | `apps/desktop/test/` | the orchestrator, in its next whole built-app run |
| The cases of `daemon.test.ts` whose titles say "earlier form", which the close reports run. This round did not run them | `apps/desktop/test/daemon.test.ts` | the orchestrator, in the broad gate |
| The other mutants the closes of findings 1 and 2 report, read and not run again: this round re-ran one guard of each | `trail/rounds/round-3.md` | the orchestrator, who decides whether a run of them is owed |

## Probes

| Command | Result |
|---|---|
| `node node_modules/vitest/vitest.mjs run test/test_tmp_round4.test.ts test/records-migration.test.ts --project unit`, in `apps/desktop/` of the clone at `67902de0`, with the main checkout's node modules linked into the clone | 2 files, 15 cases passed. The probe's first run gave a `routing.md` with no review row, so `earlierRecordsSays` found no work item, and its findings on the sentence were not used |
| `node node_modules/vitest/vitest.mjs run test/test_tmp_round4.test.ts --project unit`, the probe with the full `routing.md`, writing its lines to a log in the round's scratch directory. Each case moved a repository, checked out `feature`, and committed `iadd/threads/1-x/decisions.md` with Owlery's head, no `iadd` block and a top-level fence of info `seal` | First case, a decision the earlier grammar reads: `earlierRecordsSays` gave the sentence that names `migrate`. The plan was not blocked, with one move `iadd/threads/1-x/decisions.md` in place and `rewritten: true`. The commit was `M iadd/threads/1-x/decisions.md`. The file then held the example under an `iadd` opener, `readDecisionRecord` read decision 1 `route` "No framer.", and `earlierRecordsSays` gave null. Second case, `decision: <id> <kind>`: the same sentence, and the plan blocked at `iadd/threads/1-x/decisions.md:6`. Each case's temporary repository was removed by the case |
| `node node_modules/vitest/vitest.mjs run test/records-migration.test.ts --project unit`, with `records-migration.ts:339` removed and `:431` put back to `holds(root)`, made with the `Edit` tool in the clone and restored with `git checkout` | 13 cases: 11 passed, and the two new cases failed. The case of finding 1 failed with "fatal: no path specified", and the case of finding 2 failed at `earlierRecordsSays` `toBeNull` |
| `node node_modules/vitest/vitest.mjs run test/chain-command.test.ts test/pr-check.test.ts --project unit`, in the same place | 2 files, 51 cases passed: a narrow run, and no gate |
