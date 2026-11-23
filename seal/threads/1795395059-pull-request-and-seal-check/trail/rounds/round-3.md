# Review round 3: 1795395059-pull-request-and-seal-check

```seal
target: 0ed5c16, fixes d887852..0ed5c16
```

This is a verifying round. Its code is the diff of the fixes after round 2's record (`d887852`): `6dbc8ea` (the orchestrator's row in `frame/plan.md` *Judgments of the run* that routes round 2's regressions), `4933560` to `e570b5e` (the crafter's fix pass), `89a23ce` (the close blocks) and `0ed5c16` (the orchestrator's fold of the marker rule into `frame/design.md` *Scope* item 9). The work item's records that state the present were read whole at `0ed5c16`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md` and `pr.md`. `pr.<lang>.md` does not stand, since `Commit and pull request language` is English. The tree holds no `seal/parity.json`, so no parity comparison was owed. The round worked in a `git clone --no-local` of the worktree at `0ed5c16`, under the round's scratch directory, and its narrow runs went through `apps/desktop/scripts/test-in-electron.mjs`.

Carried from earlier rounds, and not established again: round 1's reading that `daemon.ts#runPullRequest` is the one caller of the push and of `gh pr create` and `gh pr edit` (the fix diff changes no file of `apps/desktop/src` but `github.ts`, and adds no call site there); round 1's reading of the six guards of the watch and of the arms of `github.ts` that no case reaches; and round 1's rows of `## Not judged`, which stand as round 1 left them. Re-established here: how each of the three readers splits a text into lines, read at `apps/desktop/src/daemon/record-blocks.ts:73-77`, `apps/desktop/src/daemon/github.ts:484` and `pr-check/lib/blocks.py:117` and `:383-389`, and then executed over every code point (probe 2).

## Findings

### 1. The body's case pins "no other character" for `marked` with U+0085 alone, which JavaScript's `trim` keeps too, so a `marked` that reads `trim` again passes every case

```seal
severity: should
location: `apps/desktop/test/pull-request.test.ts:253-255`, `apps/desktop/src/daemon/github.ts:465`
evidence: executed `node scripts/test-in-electron.mjs test/pull-request.test.ts` with `github.ts:465` reading `line.trim()` (22 passed), `node scripts/test-in-electron.mjs test/pull-request.test.ts test/pr-check.test.ts` with `github.ts` and `chain_check.py` of `e7d94d9` (failed at `test/pr-check.test.ts:388` and `test/pull-request.test.ts:289` alone), and the snippet below in place of `:253-255` (red at its U+FEFF iteration with `:465` reading `trim`, green at `0ed5c16`); read `apps/desktop/test/pull-request.test.ts:242-256`, `apps/desktop/test/pull-request.test.ts:287-289`, `apps/desktop/src/daemon/github.ts:58-61`, `seal/threads/1795395059-pull-request-and-seal-check/frame/plan.md:116`
regression: round-2#3
```

Why it matters: the unit is `marked` in `github.ts#pullRequestBody` (`github.ts:465`) with its case at `test/pull-request.test.ts:242`, both changed at `5257869` for round 2's finding 3. The fix changed what `marked` does with a part whose marker line has, at its ends, a character that JavaScript's `trim` takes off and the rule keeps: U+FEFF, U+00A0, U+000B, U+000C, U+1680, U+2000 to U+200A, U+2028, U+2029, U+202F, U+205F and U+3000. At `e7d94d9` such a part gave way to the line that names its record. At the target it is copied whole, as the changelog's bullet now says ("with nothing but spaces or tabs around it"). No case holds that change. The case's one example of "any other character" is U+0085, and JavaScript's `trim` keeps U+0085 as well. So the assertion at `:255` passes against `e7d94d9`'s `marked`, and against any `marked` that stops calling `markerOf` and reads `trim` again. This round ran that mutant, and the file's 22 cases passed. The case at `:289` holds `withSealSection` with U+FEFF, and the case at `test/pr-check.test.ts:388` holds the check. So a mutant of `markerOf` itself is caught, and a `marked` that bypasses it is not. Such an edit replaces a changelog that quotes a marker after a no-break space or a byte order mark, and the body loses that part's text while the changelog says it does not. The check is not harmed, since that direction replaces more than the check needs.

The fix pass's close claims "Each kind is pinned in each reader: the body's case and the section's case of `test/pull-request.test.ts`, and the case of `test/pr-check.test.ts`", and that the cases were "Seen red against `e7d94d9`'s readers". This round ran the target's two test files against `github.ts` and `chain_check.py` of `e7d94d9`. Two cases failed, at `test/pull-request.test.ts:289` and `test/pr-check.test.ts:388`, and the body's case at `:242` passed. The body's case pins the kind of a space and a tab, at `:251-252`, and no character of the other kind that tells the rule from the code it replaced.

The frame asks for the pin. The row of `frame/plan.md:116` has the fix pass hold one rule in `marked`, `withSealSection` and `body`, and say that it "enumerates its inputs and pins them". *Scope* item 9 has the daemon hold that rule through `github.ts#markerOf`. The fix pass pinned `withSealSection`, whose old reader was `trim`, with U+FEFF, which `trim` takes off. It pinned `marked`, whose old reader was `trim` too, with U+0085, one of the two characters round 2 measured against Python's `str.strip`, and `trim` keeps that character. That is where the gap came from.

The snippet replaces `test/pull-request.test.ts:253-255` and keeps the comment above it:

```ts
    // A marker after any other character is no marker line, for the daemon as for the check, so the part is copied whole and the body holds one seal section.
    // U+0085 is white space to the check's Python and U+FEFF to JavaScript's trim, and the rule takes off neither.
    for (const end of ["\u0085", "﻿"]) {
      const other = records(made, { changelog: `- The section ends at:\n\n${end}${SECTION_CLOSE}\n` });
      expect(pullRequestBody(await bodyRecords(made.repo, other, DIRECTORY), 1_000_000), JSON.stringify(end)).toBe(`${[SECTION, `## What changed\n\n- The section ends at:\n\n${end}${SECTION_CLOSE}`, ROUNDS, GATE_PART, DECIDED].join("\n\n")}\n`);
    }
```

This round put the snippet in its clone and ran the case twice. With `github.ts:465` reading `line.trim()`, it failed at the U+FEFF iteration (`test/pull-request.test.ts:257` in the patched file). With `github.ts` at `0ed5c16`, it passed. The fix pass shows it red the same way.

```seal
verdict: deferred #47
answer: The rounds stop at round 3 by the row of 2026-11-24 committed at `85064cd` in `frame/plan.md` *Judgments of the run*, so this `should` takes a home that costs no round. Issue #47 owns the ground: its build changes how the daemon composes the pull request's body in `github.ts`. The comment https://github.com/MichaelYcJo/owlery/issues/47#issuecomment-7107532908 names the case to add, U+FEFF beside U+0085, with this round's snippet. The code of both readers holds the rule, as this round's *Confirmations* read.
```

### 2. *Scope* item 4 still says the pushed commit is "the one commit the seal section speaks of", which the frame's own *Data & interfaces* denies

```seal
severity: should
location: `seal/threads/1795395059-pull-request-and-seal-check/frame/design.md:99`
evidence: executed `git grep -n -i -e "speaks\? of" -- seal/threads/1795395059-pull-request-and-seal-check ':!*/trail/rounds/*' apps/desktop/src apps/desktop/test README.md README.ko.md pr-check`; read `seal/threads/1795395059-pull-request-and-seal-check/frame/design.md:99`, `seal/threads/1795395059-pull-request-and-seal-check/frame/design.md:197`, `seal/threads/1795395059-pull-request-and-seal-check/changelog.md:5`, `apps/desktop/test/chain.test.ts:2886-2892`
reopens: round-2#2
```

Why it matters: the close of round 2's finding 2 holds for the line it located. `changelog.md:5` now says "Owlery pushes the commit it read as the branch's head, named by its id". The defect stands in a second place. That defect is a statement that the commit pushed is the commit the seal speaks of. *Scope* item 4 ends its push with this sentence: "The push names the commit and not the branch, so a commit that lands on the branch after the stage read its head is not pushed, and the remote's branch, the pull request's head and the stored `pushed` are the one commit the seal section speaks of." The seal section's block holds `target:`, which names the gate's commit. The frame's *Data & interfaces* says "The gate's commit is the sealed commit, and the pull request's head follows it by commits of closing records alone" (`:197`). `test/chain.test.ts:2886` holds the sealed commit at `HEAD~2` of the pushed head. Read so, item 4 says that the pushed commit is the sealed one, which `:197` and the case deny. Read as the head commit that the section's fixed sentence names ("as this pull request's head commit holds it"), it holds. So a frame sentence that the crafter and the sealer act on has two readings, and the first is the one round 2 found wrong in the changelog. Round 2's grounds cited item 4 for "the whole id of that head" and did not quote this sentence, so its snippet did not reach it. The search above lists this line alone among the work item's records, the code, the tests and the READMEs.

The snippet replaces that sentence of item 4. It is the framer's to fold, as the orchestrator routes a finding located in the frame.

```markdown
The push names the commit and not the branch, so a commit that lands on the branch after the stage read its head is not pushed, and the remote's branch, the pull request's head and the stored `pushed` are the one commit the stage read as the branch's head.
```

```seal
verdict: fixed ae28a35
answer: The framer rewrote *Scope* item 4 to say the pushed commit and the stored `pushed` are the one commit the stage read as the branch's head, and that this is not the sealed commit the section's `target:` names, which it follows by commits of closing records. Scenario 3, which read the same two ways, now names the section's `target:` as the new seal's sealed commit and the remote's branch as the new head. The fix lies in the frame alone, so the sealer reads it, by the row of `85064cd`.
```

## Confirmations

```seal
confirms: round-2#1
```
What holds: the case "pushes the head the stage checked, by its id, and not a commit that lands on the branch between the check and the push" stands at `apps/desktop/test/chain.test.ts:2821-2835`, in the describe of the stage. A `git` first on the stage's `PATH` commits in the worktree just before it pushes, and the case holds the remote's branch and the stored `pushed` at the head the stage checked, read. Executed: at `0ed5c16` the stage's describe passed (10 passed). With `daemon.ts:2694` handing `pushBranch` the branch's name, the case failed at `:2833`, the assertion on the remote's branch. The row of `gaps.md` that handed the call to the review rounds is closed in place at `gaps.md:28`. It opens with `closed`, and the diff over the fix range removes the open row and adds that row with the same item, read.

```seal
confirms: round-2#3
```
What holds: the daemon and the check now read a marker line by one rule, and they agree on every line. `github.ts#markerOf` (`apps/desktop/src/daemon/github.ts:58-61`) and `chain_check.py#marker_of` (`pr-check/skills/code-review/scripts/chain_check.py:1807-1815`) each take off the runs of spaces and tabs at a line's two ends and compare the rest with the two markers exactly, read. `marked` (`github.ts:465`) and `withSealSection` (`github.ts:486`) read through `markerOf`, and `body` (`chain_check.py:1898-1899`) reads through `marker_of`, read. So round 2's row of `## Not judged` on `withSealSection` is answered by the same fix. The three splitters cut at the same places. `gfmLines` splits at CRLF, CR and LF and drops one empty last line (`record-blocks.ts:73-77`). `withSealSection` matches `[^\r\n]*(?:\r\n|\r|\n)|[^\r\n]+$` (`github.ts:484`), the pattern of `blocks.py#GFM_LINE_RE` (`pr-check/lib/blocks.py:117`), with `$` and `\Z` both at the text's end, since the JavaScript pattern has no `m` flag. `gfm_lines` then takes the line ending off (`blocks.py:383-389`), read. Executed (probe 2): six bodies were built around each code point from U+0000 to U+10FFFF, the marker before, after and around it and as a second marker. `withSealSection`'s outcome and `marked`'s answer were set beside the check's outcome and `marker_of`'s answer for each, and no row of the 1,114,112 differed. Only U+0009, U+000A, U+000D and U+0020 made any body read otherwise than with `a` in their place, for either reader. Each of 891 bodies that `pullRequestBody` wrote, with a changelog quoting a marker after one of 891 code points, was read by the check as one seal section. A line with several characters at its ends reads the same in both, since each takes off a whole run of spaces and tabs and compares the rest, read. Finding 1 above is the pin this fix left in `marked`'s case.

```seal
confirms: round-2#4
```
What holds: step 3 of `apps/desktop/role-bundle/agents/proofer.md:29-32` has a round read `pr.md` and `pr.<lang>.md` where one stands, read. Executed: the case "describes the check's body arm" of `test/role-bundle.test.ts` passed (1 passed, 14 skipped). With step 3 put back to read `pr.md` in every round, it failed at `:124`. The paragraph of `gaps.md` *Not done* that left the line was removed at `4933560`, read.

```seal
confirms: round-1#7
```
What holds: the bundle describes the pull request's body as Owlery holds it, and no line of it has a party compose a body with AgenticSeal's composer or read a `pr.md` every work item holds. Executed: `git grep -n -e 'pr\.md' -e 'pr\.<lang>' -- apps/desktop/role-bundle` lists step 3 of `agents/proofer.md`, its lines 127 to 136, which hold a `pr.md` and a `pr.<lang>.md` that stand to their sources, and the row of `skills/implement/SKILL.md:292`, which says nobody writes one. `git grep -n -e 'pr-body' -e 'pr_body' -- apps/desktop/role-bundle` prints nothing.

What matched: the records read whole at `0ed5c16` state the marker rule as the code holds it. *Scope* item 9 (`frame/design.md:104`), the changelog's third bullet (`changelog.md:7`) and the row of `frame/plan.md:116` each say that a marker line has spaces and tabs at its ends and nothing else. The read found no other sentence that the target contradicts, beyond finding 2's. `gaps.md`'s diff over the fix range closes one row of `## Not verified` in place, adds one row at `:27`, and removes the paragraph of `## Not done` that round 2's finding 4 named, read.

What matched: the new cases were each read against their group, and none repeats another. The chain's case at `test/chain.test.ts:2821` is the only case that makes a commit between the stage's check and the push. The assertion at `test/pull-request.test.ts:289` is the only one of `withSealSection` with a character other than a space or a tab at a marker's end. The lines at `test/pr-check.test.ts:387-396` are the only place the check reads a body whose markers carry spaces and tabs, or quote a marker below the section after another character. The assertion at `test/role-bundle.test.ts:124` is the only one that holds step 3 of the proofer. The case of `test/pr-check.test.ts` that holds the loop is named for bodies the check names as not read, and its loop holds bodies the check reads. That name claims less than the case pins, and the behaviour is the frame's, so it is no finding.

What matched: the fix pass labels the whole suite at its commits as not run, with the orchestrator's broad gate as its answerer (`gaps.md:27`), and the label is honest: the row names the narrow files the pass ran and nothing more.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The whole suite, the typecheck and the lint at `0ed5c16`, and the `app` files the fix pass ran in its batch | `seal/threads/1795395059-pull-request-and-seal-check/gaps.md:27` | The orchestrator's broad gate, after the review rounds |

## Probes

| Command | Result |
|---|---|
| 1. In the clone at `0ed5c16`, `node scripts/test-in-electron.mjs test/pull-request.test.ts test/pr-check.test.ts`, `... test/chain.test.ts -t "the pull request stage of a work item's chain"` and `... test/role-bundle.test.ts -t "body arm"` | Exit 0 each: 39 passed; 10 passed and 142 skipped; 1 passed and 14 skipped |
| 2. `node scripts/test-in-electron.mjs test/test_tmp_round3.test.ts`, which writes each reader's answers to files in the scratch directory and runs `python3 -I -B` over the check loaded from the clone | Exit 0, Python exit 0. Rows differing between the daemon and the check: 0, over 1,114,112 code points in six bodies each. Code points that read otherwise than `a`: U+0009, U+000A, U+000D and U+0020. Bodies of `pullRequestBody` the check did not read as one seal section: 0 of 1,782. The daemon replaced the changelog's part for U+0009, U+000A, U+000D and U+0020 alone |
| 3. `node scripts/test-in-electron.mjs test/pull-request.test.ts test/pr-check.test.ts`, with `github.ts` and `chain_check.py` of `e7d94d9` | Exit 1: 2 failed, at `test/pr-check.test.ts:388` and `test/pull-request.test.ts:289`, and 37 passed, the body's case at `:242` among them |
| 4. `node scripts/test-in-electron.mjs test/pull-request.test.ts`, with `github.ts:465` reading `line.trim() === SECTION_OPEN \|\| line.trim() === SECTION_CLOSE` | Exit 0, 22 passed: the mutant survived every case of the file |
| 5. `node scripts/test-in-electron.mjs test/pull-request.test.ts -t "replaces a part whose text holds a marker line"`, with finding 1's snippet in place of `:253-255`, once with the mutant of probe 4 and once at `0ed5c16` | With the mutant: exit 1, failed at the U+FEFF iteration. At `0ed5c16`: exit 0. The probe ran twice because one run cannot show it both red and green |
| 6. `node scripts/test-in-electron.mjs test/chain.test.ts -t "pushes the head the stage checked"` with `daemon.ts:2694` handing `pushBranch` the branch's name, and `... test/role-bundle.test.ts -t "body arm"` with step 3 of `agents/proofer.md` put back to read `pr.md` in every round | Exit 1 each: failed at `test/chain.test.ts:2833` and at `test/role-bundle.test.ts:124`. Every file a probe changed was restored with `git checkout` in the clone |
| 7. The plugin's `PATH=/usr/bin:/bin python3 skills/code-review/scripts/chain_check.py --baseline origin/release/v0.0.2 --root <the branch worktree> --worktree`, run before this record was written | Exit 0. It named round 2's findings 1, 3 and 4 as owed a verifying round, the last round's `target:` as behind HEAD, `trail/gate.md` and `guarantee.md` as not carried, and the body as not read under `--worktree`. It printed no notice at `frame/design.md`. No `gh` stood on its `PATH`, and it named the pull request's state as unknown |
| 8. The same command, run over this record before the hand-back | Exit 0. It refused each of this record's two findings as open, which the fix pass answers, named `trail/gate.md` and `guarantee.md` as not carried, and refused nothing else of this record. It named no finding of round 2 as owed a verifying round, and printed no notice at `frame/design.md` |
