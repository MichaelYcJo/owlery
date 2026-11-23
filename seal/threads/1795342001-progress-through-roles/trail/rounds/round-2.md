# Review round 2: 1795342001-progress-through-roles

```seal
target: 40da7b5, fixes 17deb2b..40da7b5
```

This is a verifying round. Its range is `17deb2b..40da7b5`, which holds eight commits: `77d1a89` and `e6b356f` write and close round 1's record, `a799df0` is the orchestrator's fix of finding 3, `6df50cf`, `99d3ca9` and `7b582ad` are the crafter's fixes of findings 1 and 2, `bb960c4` and `0822569` change `gaps.md` and rewrap a comment of `view.ts`, and `40da7b5` folds the fix into `frame/design.md` and `pr.md`. Each commit was read whole. The code this round reviews is that range's diff of `apps/desktop`: `view.ts#asSentence` and its call in `byChain`, the comment on `ChainStage.failure` in `protocol.ts`, and the cases changed or added in `test/view.test.ts` and `test/approval-line.test.ts`. The work item's `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md` and `pr.md` were read whole at `40da7b5`, and so were the three phase records and round 1's record. No `pr.<lang>.md` stands: `Commit and pull request language` is English. `seal/parity.json` is not declared.

Carried from round 1 and not re-established: where the daemon writes a stage's `failure` (`apps/desktop/src/daemon/daemon.ts:2176-2190`, `chain.ts:817`), the rules that colour the line under the places (`apps/desktop/src/renderer/index.html:167-168`), and where `shared.ts#detail` gives a failed place's line its class (`shared.ts:294`). Each was opened again at `40da7b5` and stands where round 1 named it. Every verdict below is this round's own.

## Findings

### 1. A failure whose first word ends at a colon or a comma keeps its small letter under the places

```seal
severity: should
location: `apps/desktop/src/renderer/view.ts:425`, `apps/desktop/test/view.test.ts:1401-1418`
evidence: executed `node scripts/test-in-electron.mjs test/test_tmp_as_sentence.test.ts` in `apps/desktop` of a clone at `40da7b5`; read `apps/desktop/src/renderer/view.ts:414-426`, `seal/threads/1795342001-progress-through-roles/frame/design.md:157`, `apps/desktop/src/daemon/daemon.ts:1443-1506`
regression: round-1#1
```

Why it matters: `view.ts#asSentence` is the unit the fix pass added for round 1's finding 1. `frame/design.md:157`, as `40da7b5` folds it, says "where its first word is letters alone it takes a capital". The function's comment at `view.ts:414-421` says the same. The fix tests the first word with `/^\p{Ll}\p{L}*(?=\s|$)/u` (`view.ts:425`), so a word counts only where whitespace or the end follows it. The lookahead keeps `round-2.md` and `seal/threads/...` as written, which is what it was for. It also leaves a word of letters alone uncapitalised wherever a comma, a colon or a full stop follows it. The probe gave these lines. A failure of "error: unknown option '--no-such-option'" reads "Proofer: error: unknown option '--no-such-option'.". A failure of "stopped, at a request" reads "Proofer: stopped, at a request.". The failure is the CLI's own error text wherever the session ended with an error result or its adapter failed to start (`daemon.ts:1485`, `:1506`). That text is not the daemon's to word, and the window's voice is the rule the fix exists to keep: `docs/design.md` *The voice of the window's words*, which round 1's finding 1 cited. The daemon's own clauses all open with a word that whitespace follows, so none of them hits this. The case at `view.test.ts:1401` names "a capital on a first word of letters alone", and no expectation in it has a first word that punctuation follows.

The frame gives a capital to a first word of letters alone. The fix wrote the test for where a word ends as "whitespace or the end", to tell a word from a path or a file's name. Read that way, a word followed by a comma or a colon is not a word, and that is where the defect came from. The snippet below lets a comma, a colon, a semicolon, `!` and `?` end the word. It also lets a full stop end the word where whitespace or the end follows the stop. A file's name such as `round-2.md` and a path still keep their first character. The comment at `view.ts:414-421`, the case's name and `frame/design.md:157` stay true as they are written, so the snippet reaches every statement of the rule.

```ts
// apps/desktop/src/renderer/view.ts:425, in `asSentence`. No OS boundary is crossed.
const opened = /^\p{Ll}\p{L}*(?=$|[\s,:;!?]|\.(?:\s|$))/u.test(text) ? text.charAt(0).toUpperCase() + text.slice(1) : text;

// apps/desktop/test/view.test.ts, in the case at line 1401, after the expectations of a path, a file's name and a number
// A first word that a comma, a colon or a final full stop ends is a word of letters alone.
expect(says("error: unknown option '--no-such-option'")).toEqual(["Proofer: Error: unknown option '--no-such-option'."]);
expect(says("stopped, at a request")).toEqual(["Proofer: Stopped, at a request."]);
expect(says("failed.")).toEqual(["Proofer: Failed."]);
```

The pattern was checked on its own against fourteen texts with `node -e`. The expectations above and those of the case at line 1401 held: `seal/threads/x.md was`, `round-2.md holds`, `file.md holds`, `e.g. this` and `2 blocks` keep their first character, and the others take a capital.

## Confirmations

```seal
confirms: round-1#1
```
What holds: a failed stage's `failure` reaches the line under the places as a sentence. `byChain` at `apps/desktop/src/renderer/view.ts:471` passes it through `asSentence`, and `test/view.test.ts:1382`, `:1385` and `test/approval-line.test.ts:228` expect "Proofer: The session reached its time limit and was stopped.", "Crafter: ..." and "Proofer: The session was stopped at a request before it finished.". Executed: `test/view.test.ts` passed at `40da7b5` in the clone. With the call at `view.ts:471` put back to `text: newest.failure`, both the case of the failed stage and the new case at `:1401` failed, and the other six cases of `describe("the approval line")` passed. That run is the crafter's claim of a case seen red, and it holds. The clauses the daemon writes were listed from every place that sets a stage's `failure` or a session's `error`: `daemon.ts:1209`, `:1454`, `:1485`, `:1543`, `:2178` and `:2184`, and the `ChainStop` messages of `chain.ts` and `daemon.ts` that `:2184` takes. Each opens with a word that whitespace follows, or with a path. Executed: the cases pin the clauses of `:1209` and `:1543`, and the probe ran those of `:1454` and `chain.ts:759`, and each took a capital and a full stop. Read: the clauses of `:1485` and `:2178` open with "the" and a space. The failures that open with a path (`chain.ts:285`, `daemon.ts:2102`, `:2139`) keep their first character, as the close says, and the probe ran one of the form of `:2139`. The departure from the record's snippet is grounded: the snippet would have turned a path into `Seal/threads/...`. The comment on `ChainStage.failure` at `apps/desktop/src/shared/protocol.ts:316` now says what the daemon writes and that the approval line says it as a sentence. Read against `daemon.ts:2176-2190`, it holds. Every statement the record listed was rewritten: `changelog.md:7` by `6df50cf`, and `frame/design.md:98` and `:157` by `40da7b5`. Executed: `git grep -n "stopped at a request before it finished"` over the tree. The clause's old form stands only in tests that pin the daemon's value, in #41's sentence of the chain, and in `trail/phases/phase-3.md`, which is history. Finding 1 above is a regression in the unit this fix made. It does not undo this close for the daemon's own clauses.

```seal
confirms: round-1#2
```
What holds: the last case of `apps/desktop/test/approval-line.test.ts` now reads the line's computed colour (`:230-240`). It compares that colour with the colour the page resolves for `--state-failed`, and that colour with a note's. Read: with the rule `.approval .under.failed` at `apps/desktop/src/renderer/index.html:168` removed, the line takes `.approval .under`'s `--ink-muted` (`:167`). That is also the colour of `.place .note` (`:166`), so the assertion gives `[false, true]`. That is the red result `7b582ad`'s close reports. This round did not start the built app to see it, by the owner's rule that starts the app as few times as possible. The probe span takes its colour from an inline style, so no rule of the section can change it. `bb960c4` rewrites `gaps.md`'s *Not done* in place. `40da7b5` rewrites `pr.md:9`. Both now say what the cases hold: a failed place's words and its colour in the built app, and a waiting place's words. No case reads a waiting place's colour in the built app. Read against `test/view.test.ts:1397-1398`, which holds a waiting place's words, and against `approval-line.test.ts`, whose cases draw no waiting place, this holds.

```seal
confirms: round-1#3
```
What holds: `pr.md:10` and `frame/design.md:51` carry the record's text word for word (read at `40da7b5`). The row says that the daemon reads the records committed or not, where the issue names the committed records. `a799df0` touches those two files alone, so the close is located in the work item's records alone.

What matched: `0822569` changes `view.ts` only by rewrapping the comment of `byChain` at `:459-465`. Its words are those `6df50cf` wrote. The row it adds at `gaps.md:20` is true. `test/terminal-basics.test.ts:20` imports `CARD_LEAVE_MS` and `CARD_SHOW_MS` from `src/renderer/view`, and `test/work-item-menu.test.ts:24` imports `NEW_WORK_ITEM_SAYS`, `REGISTER_ONLY_SAYS` and `rowButtons`. The fix pass changed none of those names, and both files start the built app (`buildApp`, `:86` and `:225`). The only file that imports `view.ts` apart from those two and `view.test.ts` is `test/daemon.test.ts`. Executed: `git grep -ln "renderer/view" -- test`.

What matched: the diff of `gaps.md` over the range removes no row of `## Not verified`. It adds the row at `:20` and rewrites the paragraph of *Not done* in place. Read: `git diff 17deb2b..40da7b5 -- seal/threads/1795342001-progress-through-roles/gaps.md`.

What matched: each sentence of `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `changelog.md` and `pr.md` that the range changed reads true against `40da7b5`. Read. `pr.md` quotes no source at a coordinate.

The new case at `apps/desktop/test/view.test.ts:1401` holds facts the frame states, at `frame/design.md:157`, and covers what the older case of a failed stage at `:1376` does not: the first word's rule and the full stop's rule. Its expectation `says("")` at `:1417` pins a line that reads "Proofer: " with nothing after the colon. A failure of whitespace alone gives that line too (the probe). *Scope* item 6 of `frame/design.md` asks for a line for each place "that has something to say", and no fact of the frame asks for an empty one. The daemon writes an empty failure only where an error carries no message (`daemon.ts:1506`, `:2132`). So this is a gap of a case and no finding. A failure that ends with a colon gains a full stop after it, as in "... was written and not committed:." from `daemon.ts:2139` where git's error has an empty first line (the probe). That comes of the daemon's wording, which this diff does not change.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The whole suite, the typecheck of every package and the document checks of the broad gate at `40da7b5`. The fix pass labels them `unverified`, and the label is honest: `gaps.md:20` names the runs it did not make, with the orchestrator as the one who answers. This round ran `test/view.test.ts` alone | `seal/threads/1795342001-progress-through-roles/gaps.md:20` | the orchestrator, at the broad gate |
| `test/approval-line.test.ts` at `40da7b5`, and its red result with the rule at `index.html:168` removed. This round read both and started no built app | `apps/desktop/test/approval-line.test.ts:208-241` | the orchestrator, at the broad gate |
| Whether the owner takes the line's form and words, carried from round 1 | `seal/threads/1795342001-progress-through-roles/frame/questions.md` Q1 | the owner, on the pull request |

## Probes

| Command | Result |
|---|---|
| `node scripts/test-in-electron.mjs test/view.test.ts test/test_tmp_as_sentence.test.ts` in `apps/desktop` of a clone at `40da7b5`, under `OWLERY_BACKGROUND=1`, through the electron lock | exit 0, 2 files, 459 cases passed. The probe file's output was not shown, since the runner prints no console output |
| `node scripts/test-in-electron.mjs test/test_tmp_as_sentence.test.ts`, the probe writing its lines to a file in the scratch directory | exit 0. "error: unknown option '--no-such-option'" gave "Proofer: error: unknown option '--no-such-option'.". "stopped, at a request" gave "Proofer: stopped, at a request.". Whitespace alone gave "Proofer: ". "... not committed: " gave "... not committed:.". "spawn claude ENOENT" gave "Proofer: Spawn claude ENOENT.". The daemon's "it left finding 1 open and raised no question" and "the session exited with code 1 and gave no result" each took a capital and a full stop |
| `node scripts/test-in-electron.mjs test/view.test.ts -t "the approval line"`, with `view.ts:471` changed to `text: newest.failure` | exit 1, 2 cases failed: the case of a failed stage and the case at `:1401`. 6 passed. The file was restored with `git checkout` |
| `node -e` over the pattern of finding 1's snippet and fourteen texts | each text took or kept its capital as the snippet's grounds state |
| `git grep -n "stopped at a request before it finished"` and `git grep -ln "renderer/view" -- test` | the lines Confirmations names |
