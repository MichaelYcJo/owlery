# Review round 3: 1795342001-progress-through-roles

```seal
target: 598cfef, fixes 40da7b5..598cfef
```

This is a verifying round. Its range is `40da7b5..598cfef`, which holds six commits. `188cb56` and `6399188` write and close round 2's record. `b7f028d` is the orchestrator's judgment that the rounds converge, a row of `frame/plan.md` *Judgments of the run*. `69b1198` is the crafter's fix of round 2's finding 1, and `f2b3a03` rewrites a row of `gaps.md`. `598cfef` folds the fix into `frame/design.md:157`. Each commit was read whole. The code this round reviews is that range's diff of `apps/desktop`: the pattern and the comment of `view.ts#asSentence` (`apps/desktop/src/renderer/view.ts:414-428`) and seven lines added to the case at `apps/desktop/test/view.test.ts:1401`. No other file under `apps/` changed. The work item's `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md` and `pr.md` were read whole at `598cfef`. No `pr.<lang>.md` stands, since `Commit and pull request language` is English. `seal/parity.json` is not declared. The three phase records were last changed at `2b23e1b`, before round 2's target, and were opened for their headings alone.

Carried from round 2 and not re-established: the list of every place the daemon sets a stage's `failure` or a session's `error` (`apps/desktop/src/daemon/daemon.ts:1209`, `:1454`, `:1485`, `:1543`, `:2178`, `:2184`, and the `ChainStop` messages of `chain.ts`), and the fact that each of the daemon's own clauses opens with a word that whitespace follows, or with a path. The range changes nothing under `apps/desktop/src/daemon`, so the list stands as round 2 read it. Every verdict below is this round's own.

## Findings

This round opens no finding.

## Confirmations

```seal
confirms: round-2#1
```
What holds: a failure whose first word of letters alone ends in marks before a space or the text's end now takes its capital under the places. `69b1198` changes the pattern at `apps/desktop/src/renderer/view.ts:426` to `/^\p{Ll}\p{L}*[,:;.!?]*(?=\s|$)/u`. Executed: `test/view.test.ts` passed at `598cfef` in a clone, 458 cases. With the line put back to the pattern before the fix, `/^\p{Ll}\p{L}*(?=\s|$)/u`, the run of `describe("the approval line")` failed one case, the one at `:1401`, and passed the other seven. Its failing line is `view.test.ts:1416`, which expected "Proofer: Error: unknown option '--no-such-option'." and received "Proofer: error: ...". That is the red result the close claims, on the line it names, and it is the guard the fix added. The file was restored with `git checkout`.

The close departs from round 2's snippet, and the departure is grounded. The close claims that the record's lookahead lets a colon end the word whatever follows, so it would turn "http://localhost:4000 refused the connection" into "Http://...". Executed with `node -e` on both patterns: the record's pattern matches "http://localhost:4000 refused the connection" and "node:fs could not be loaded", and the fix's matches neither. Both match "error: unknown option", "failed.", "stopped?! at", "git: x" and "fatal:". Neither matches "e.g. this", "file.md holds", "round-2.md holds" or "can't start". The case pins the departure: `view.test.ts:1420-1421` expect the address and `node:fs` to keep their first character. The close's eleven mutants under `seal mutate` were not re-run. Read: each mutant it names breaks one line of the case. With the marks removed, the line at `:1416` fails. With one mark removed, its iteration of the loop at `:1418` fails, and with `*` made `?`, the iteration of `?!` fails. With the lookahead removed, `:1420` fails. With its space arm removed, `:1416` fails, and with its end arm removed, `:1417` fails.

Every statement of the rule now says what the code does. The comment at `view.ts:414-422` names a word ended by marks before a space or the text's end, and says that an address stands as written. `598cfef` rewrites `frame/design.md:157` in place. It now names the six marks, a space or the text's end after them, and a word with a mark inside it, such as `http://…` or `node:fs`. The case's name at `:1401` and the comment on `ChainStage.failure` at `apps/desktop/src/shared/protocol.ts:315` stay true as written. `changelog.md:7` and `pr.md:7` say only that the reason stands under the places as a sentence. `docs/design.md:451` says the line under the places holds why the stage failed, and states no rule of capitals. Executed: `git grep -n asSentence`, which lists the function, its call at `view.ts:472`, the frame's line, the frame's judgment row and the round records.

What matched: `gaps.md:20`, as `f2b3a03` rewrites it, holds. The row was rewritten in place to cover the passes on rounds 1 and 2, and `gaps.md`'s diff over the range removes no other row. The pass on round 2 changed `src/renderer/view.ts` and `test/view.test.ts` (read: `git show --stat 69b1198`). `test/themes.test.ts` imports no `buildApp` (executed: `grep -n "buildApp\|BuiltApp"`, which printed nothing), so the row's claim that the pass started no built app agrees with the files it names. The runs it names at `69b1198` are the crafter's claim, and this round's run of `test/view.test.ts` at `598cfef` agrees with them. `test/approval-line.test.ts` has had no run since `99d3ca9`, and round 2 started no built app either, so the row's sentence on it is true. The suite stays `unverified`, and the label is honest: the row names the orchestrator at the broad gate.

What matched: the row `b7f028d` adds at `frame/plan.md:85` says what round 2 found. Round 1 left three findings, round 2 confirmed the three closes and opened one, a `should`. Read against `trail/rounds/round-2.md`. Its parenthesis says `view.ts#asSentence` reads no word that ends in a comma, a colon or a full stop. The target no longer does that, and this round reads the row as a dated judgment that names the finding it weighed, not as a statement of the tree at `598cfef`.

What matched: the other sentences of `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `changelog.md` and `pr.md` stand as round 2 confirmed them at `40da7b5`. The range changes no file they describe apart from `view.ts` and `view.test.ts`, and each of their sentences that touches those two units was read above. `pr.md` quotes no source at a coordinate.

The seven lines `69b1198` adds to the case at `view.test.ts:1401` hold facts `frame/design.md:157` states: the six marks, the run of marks `?!`, a word that a mark ends at the text's end, and a word with a mark inside it. The colon after "error" at `:1416` and the colon of the loop at `:1418` hold the same arm of the pattern. The line at `:1416` keeps the CLI's error text that round 2's grounds named, so the overlap is one expectation in one case and no finding. Under the frame's rule a first word with an apostrophe inside it keeps its small letter, as "can't start" does in the `node -e` run. No clause the daemon writes opens that way (round 2's list). A CLI's own error text is an unbounded domain, and the frame states the rule as it stands, so this is no finding.

This round leaves nothing open. What comes due is the orchestrator's broad run, and the sealer's spawn after it.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The whole suite, the typecheck of every package and the document checks of the broad gate at `598cfef`. The fix pass labels them `unverified`, and the label is honest. This round ran `test/view.test.ts` alone | `seal/threads/1795342001-progress-through-roles/gaps.md:20` | the orchestrator, at the broad gate |
| `test/approval-line.test.ts` at `598cfef`, which has had no run since `99d3ca9`. Read: its expectation of "Proofer: The session was stopped at a request before it finished." opens with "the" and a space, which both patterns capitalise. This round started no built app, by the owner's rule that starts it as few times as possible | `apps/desktop/test/approval-line.test.ts:228` | the orchestrator, at the broad gate |
| Whether the owner takes the line's form and words, carried from rounds 1 and 2 | `seal/threads/1795342001-progress-through-roles/frame/questions.md` Q1 | the owner, on the pull request |

## Probes

| Command | Result |
|---|---|
| `node scripts/test-in-electron.mjs test/view.test.ts` in `apps/desktop` of a clone at `598cfef`, under `OWLERY_BACKGROUND=1`, through the electron lock | exit 0, 1 file, 458 cases passed. No built app started |
| `node scripts/test-in-electron.mjs test/view.test.ts -t "the approval line"`, with `view.ts:426` put back to `/^\p{Ll}\p{L}*(?=\s|$)/u` | exit 1. 1 case failed, the one at `:1401`, on `view.test.ts:1416`, and 7 passed. The file was restored with `git checkout` |
| `node -e` over round 2's snippet pattern and `69b1198`'s pattern, on thirteen texts | the record's pattern matches "http://localhost:4000 refused the connection" and "node:fs could not be loaded", and the fix's matches neither. The other texts give the results Confirmations states |
| `git grep -n asSentence`, and `grep -n "buildApp\|BuiltApp" apps/desktop/test/themes.test.ts` | the lines Confirmations names, and nothing from the second |
