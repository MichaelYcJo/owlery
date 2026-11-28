# Review round 6: 1795797447-322-workflows-compose-around-iadd

```seal
target: 0e556f40, fixes 7dd65599..0e556f40
```

This is a verifying round. It answers the four findings round 5 closed, in the fix pass `8d37e899`, `80e8b109`, `caa37bd0` and `f8c1d3f4`, with its records commits `f81d9943` and `b9a3a3bc`. It also reads three commits no finding named: `152762de`, the orchestrator's rewrite of the two acceptance rows at `frame/design.md:110-111`, and `383c958f` and `0e556f40`, a fix pass that renamed the word broken for a lapsed inspection and updated `gaps.md`. The round read the branch's worktree at `0e556f40`, with no builder working in it, as the caller allowed, and changed no file there but this record. `git fetch` showed the base `origin/release/v0.2.0` still at `a75f4581`, and the range holds no merge of it. No `seal/parity.json` is declared. `seal/config.json` sets `Record language` to English. The work item holds `changelog.md` and no `pr.md` or `pr.<lang>.md`.

The caller ordered searches and reading only, since the orchestrator was running the whole built-app suite at the same time. This round ran no case, no build and no probe that executes code.

Read whole at the target: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md` and `trail/rounds/round-5.md`. `trail/phases/` and `trail/rounds/round-1.md` to `round-4.md` were not opened. No commit of the range changes them, and round 5 carried their coordinates.

Read whole in the code: every line that `80e8b109`, `caa37bd0`, `f8c1d3f4`, `152762de`, `383c958f` and `0e556f40` add or remove. For the built-app files, every line `8d37e899` adds or removes was read too. In the other files of `8d37e899`, the round read each replaced word pair. A word diff of the commit was tallied into 61 pairs of old word to new word, and every edit that removed or added words without a counterpart was read in context. Lines of those files were read in context where a pair could change behaviour: the work item titles that make record names, the `history` helper of `pr-check.test.ts:776`, `workflowName` in the stand-ins, the round-record helper `block`, and the fixture `# The project's own notes`. The rest of those lines were sampled.

Carried from round 5 rather than established again: the evidence searches of its findings 2, 3 and 4, which this round ran again, and its reading that the stand-in values are no input the product reads. That reading was checked here with `git grep -n workflowName -- apps/desktop/src`, which prints nothing.

## The acceptance searches

Both searches were run at `0e556f40` and at `f8c1d3f4`, exactly as the rows state them. The first prints 243 lines at each commit. The two outputs are the same text with the same line numbers. `383c958f` replaced each line it changed with one line, and no line it changed holds the letters `seal`. So the line numbers the rows give at `f8c1d3f4` still hold at the target, though the caller expected them to shift.

A script compared each printed line with the row's list: the two files `records-migration.ts` and `records-migration.test.ts` whole, and each `path:line` the row names. Every printed line is on the list, and every listed line is printed. Each of the 139 lines outside the two migration files was then read for its reason:

- The earlier trailers: `Seal-Built-By` (`chain.ts:88`, `daemon.ts:4058`, `stage-records.ts:336`, `chain.test.ts:3122` and `:3127`) and `Seal-Routing` (`chain_check.py:13`, `:2163` and `:2185`, `pr-check.test.ts:135`, `:137` and `:144`).
- What an earlier build stored or wrote: the stored stage kind `seal`, the pair `sealer` at `seal`, the chain states `sealed` and `reviewed` (`chain.ts:1165-1256`, `chain.test.ts:811-889`, `:3195` and `:3207`), the look's `seal` key (`last-look.test.ts:385` and `:389`), the ledger's earlier line (`ledger.test.ts:204` and `:206`), and the earlier chain's text "The sealer sealed ccccccc" in a chain stored `sealed` (`repositories.test.ts:199`). The pass renamed the same words at `:188`, which state today's chain.
- The refused verdict word (`chain-records.test.ts:44`) and the fence `seal` that is no block (`record-blocks.test.ts:82`).
- The earlier root, in the cases of the migration, the refusal of an earlier worktree, the dialog and Q12's heavy commands.
- The plugin's commands that no text may name (`role-bundle.test.ts:275`, `:276`, `:281` and `:327`, `pr-check.test.ts:935` and `:958`).
- This repository's own check `seal` (`rerun-unstarted.test.ts:144`, its fixture at `:121`).
- The letters alone (`model-stand-in.ts:119`).
- The names set aside (`docs/iadd.md:57`, `docs/iadd.ko.md:57`).
- The shipped releases' rows and this repository's pin (`docs/roadmap.md:22`, `:52-56` and `:87`, `docs/roadmap.ko.md:22` and `:53`).
- The plugin's side of *What we take from AgenticSeal*, the skill's name before the rename, the earlier trailer and the measurement dated 2026-11-17 (`docs/architecture.md` and its Korean edition at the lines the row names).

Each line holds the earlier word for the reason the row gives it, and none of them holds the earlier word for today's concept. The second search prints 10 lines at each commit. They are 8 in `records-migration.ts` and `adapters/claude-roles.ts:74` and `:101`, which is what the row at `frame/design.md:111` names. `152762de` rewrote the two rows in place and changed no other line of the frame, read.

The search cannot reach the Korean words for the seal. `git grep -n -e 인장 -e 봉인 -e 깨진 -- docs README.ko.md apps/desktop/src` prints lines in `docs/architecture.ko.md`, `docs/name.ko.md` and `docs/roadmap.ko.md` alone. Each of them is the Korean of an English line the row keeps: the plugin's invariants and hooks, AgenticSeal's emblem, and the rows of the shipped releases.

## Findings

### 1. The rename dropped the object key `inspector:` from the script `approval-line.test.ts` evaluates in the page, so the page refuses the script and the file's three cases fail

```seal
severity: must
location: `apps/desktop/test/approval-line.test.ts:215`, `seal/threads/1795797447-322-workflows-compose-around-iadd/gaps.md:29`
evidence: read `apps/desktop/test/approval-line.test.ts:203-217`, `apps/desktop/test/approval-line.test.ts:268-269`; executed `git show 8d37e899 -U3 -- apps/desktop/test/approval-line.test.ts`; executed `git show 8d37e899 383c958f -U0 --word-diff=plain -- <the 19 built-app files>`; read the orchestrator's log `<scratchpad>/1795797447-322/app-all-r5.log:24-106`
regression: round-5#1
```

The unit: the helper `inspectionsOf` of `approval-line.test.ts`, which `8d37e899` renamed from `sealsOf`. The frame's *Scope* item 4 and round 5's map asked for names, titles, comments and fixture words, which change no behaviour. The same hunk also turned the property `inspector: inspector ? [...] : null,` into `inspector ? [...] : null,`. That line stands inside the object literal the helper's script returns, at `approval-line.test.ts:207-216`. A property definition cannot open with a name followed by `?`, so the page refuses the whole script with `SyntaxError: Unexpected token '?'`. The probable source is that the edit read `inspector: inspector` as a redundant shorthand. It is not one where the value is a conditional expression. That source is this round's inference, read from the diff. Elsewhere `8d37e899` made the same shortening in `chain.test.ts:2999`, `:3030`, `:3057`, `:3094` and `:3548`, where `roles({ ..., inspector })` names a variable declared above it, so those stay valid TypeScript.

`tsc` cannot see the defect, because the text is a string that the page evaluates. The pass did not run the file, and `gaps.md:29` names it among the built-app files not run. The same row says that the pass "changed their helpers' names, titles, comments and fixture words alone". That is false for `:215`, which lost a key of the returned object. The orchestrator's whole built-app run at `0e556f40` (`app-all-r5.log:105-106`) failed the three cases of this file that call the helper, each with that error at the script's line 11, column 18. That position is the `?` of `:215`, read: the script opens at `:204`, and the name ends at column 17. `:269` reads `inView.inspector`, so the key is part of what the cases assert.

The class is every place where the two commits changed code that runs in the page, which a type check cannot see. The round read every line that `8d37e899` and `383c958f` add or remove in the built-app files (the 19 files that import `buildApp`, by the pattern in `apps/desktop/vitest.config.ts:14`). Of the 8 built-app files the two commits change, `approval-line.test.ts:215` alone changes text that the page evaluates. Every other change inside an `app.evaluate` or `app.until` string, in `screenshots.test.ts` and `inspection-sheet-view.test.ts`, is inside a `${...}` interpolation, so the test's own TypeScript computes it. That makes the list whole for the page's scripts. It does not reach a string that a unit file hands to a shell or a stand-in. The unit files' runs that the builder reports, as executed, cover those strings for `8d37e899`. For `383c958f`, `## Not judged` names them.

```ts
// apps/desktop/test/approval-line.test.ts:215, inside the object the page's script returns
        inspector: inspector ? [shown(inspector.querySelector(".mark")), inspector.querySelector(".note").textContent, [...inspector.querySelector(".state-icon").classList].filter((name) => name !== "state-icon" && name !== "state")] : null,
```

```markdown
seal/threads/1795797447-322-workflows-compose-around-iadd/gaps.md:29, the row's first cell, in place of "The pass changed their helpers' names, titles, comments and fixture words alone, and ran `role-bundle.test.ts` alone after `node build.mjs`":

The pass changed their helpers' names, titles, comments and fixture words, and at `approval-line.test.ts:215` it also dropped the key `inspector:` from the object the page's script returns, which review round 6's finding 1 found and its fix pass put back; it ran `role-bundle.test.ts` alone after `node build.mjs`
```

The fix pass reruns `approval-line.test.ts` alone after `node build.mjs`, as a built-app file, so the three cases are seen to pass again.

```seal
verdict: fixed 3f187a49
answer: `3f187a49` puts the key back, so `approval-line.test.ts:215` reads `inspector: inspector ? [...] : null,` as the paste-ready fix writes it; `2b2d3b74` rewrites the row of `gaps.md` on round 5's fix pass in its own words, which say the pass also dropped that key and that this pass put it back. Before the fix, at `750183d0`, `node build.mjs` then `OWLERY_BACKGROUND=1 pnpm run test:app test/approval-line.test.ts` in `apps/desktop` exited 1 with 3 failed and 4 passed of 7, each failure `SyntaxError: Unexpected token '?'` at the script's line 11, column 18, executed. After the fix, at the tree `3f187a49` commits, the same two commands exited 1 with 1 failed and 6 passed of 7, twice, executed: the two cases that call the helper at `:243` and `:294` now pass, and the case of the lapsed inspection fails at `:271`, the overflow assertion the refused script had hidden, with `section 441 in 440` and `inspector 111 in 110`. The command is not green, so the finding's ask to show it green is not met. That failure is not this finding's defect: `git diff 011f7298 3f187a49 -- apps/desktop/src` changes comments and docstrings of the daemon alone, `git diff 011f7298 -- apps/desktop/test/approval-line.test.ts` changes names and one comment, and the orchestrator's whole built-app run at phase 4's end passed this file, read in `<scratchpad>/1795797447-322/app-all-p4.log`. Two probes in the case's file, each run once and removed, measured it: the inspector's place's row holds the state icon (16px), the name (58.78px), the mark (18px) and two 6px gaps in a row of 98px, and moving the window to the display at scale factor 2 printed the same widths, executed. What changed since phase 4's run is not established, and `gaps.md` *Not verified* names the failure for the orchestrator. The class, every object key the two commits dropped while the name stayed in the hunk, was listed by a script over `git show 8d37e899 383c958f -U0 -- apps`: it prints `approval-line.test.ts:215` and five `inspector: sealer` lines of `chain.test.ts`, which became the shorthand `inspector` for a variable of that name declared above them, executed. `pnpm --filter @owlery/desktop run test test/chain.test.ts` passed 179 of 179, executed. The changed file passed `tsc` through a scoped `tsconfig` in this pass's scratch, executed.
```

### 2. `gaps.md` *Not done* still says that the two acceptance searches print lines outside their rows and that the rows are the orchestrator's to write, which `152762de` did

```seal
severity: should
location: `seal/threads/1795797447-322-workflows-compose-around-iadd/gaps.md:48`
evidence: read `seal/threads/1795797447-322-workflows-compose-around-iadd/gaps.md:48`, `seal/threads/1795797447-322-workflows-compose-around-iadd/frame/design.md:110-111`; executed both acceptance searches at `0e556f40` and `f8c1d3f4`, and a script that compares each printed line with the rows' lists, which printed no line outside them and no listed line left unprinted
```

Why it matters: the paragraph at `gaps.md:48` says that, at round 5's fix pass's last commit, the two searches print lines outside the files their rows list. It then says that "The rows' lists are a frame file's, which the orchestrator writes". The paragraph stands under `## Not done`, so a reader takes the rows as still to be written. `152762de` rewrote both rows, at `frame/design.md:110-111`, as lists of lines at `f8c1d3f4`. At that commit and at the target, each search prints the lines its row lists and nothing else (*The acceptance searches* above). The inspector reads `## Not done` for what the pull request leaves open. This paragraph would send it to look for work that is done. `0e556f40` rewrote the paragraph above it and left this one unchanged. `git grep -n -F "The rows' lists are a frame file's" -- seal/threads/1795797447-322-workflows-compose-around-iadd/` prints `gaps.md:48` alone, a sample of the fact's statements under contract rules 12 and 19.

```markdown
seal/threads/1795797447-322-workflows-compose-around-iadd/gaps.md:48, in place of the paragraph:

The two acceptance searches of `frame/design.md` *User scenarios & acceptance* printed, at review round 5's fix pass's last commit, lines outside the files their rows then listed. `152762de` rewrote both rows to list, line by line at `f8c1d3f4`, each line that keeps the earlier words and why. At `0e556f40` each search prints the lines its row lists and nothing else.
```

The paragraph can also be removed whole, since nothing in it is left undone. It is a paragraph of `## Not done`, not a row of `## Not verified`.

```seal
verdict: fixed 2b2d3b74
answer: `2b2d3b74` removes the paragraph whole, as the finding allows, since nothing in it is left undone and the history stands in `152762de` and this record. The same fact stood in a row of `## Not verified`, the one that said the acceptance row names no `ledger.test.ts` and gives `chain.ts` the earlier trailer alone as its reason, with the orchestrator to answer before the last phase; `frame/design.md:110` now names `ledger.test.ts:204` and `:206` and gives `chain.ts` and `chain.test.ts` the stored kinds too, read, so the same commit removes that row. The finding's search `git grep -n -F "The rows' lists are a frame file's" -- seal`, run again after the last fix commit, prints `trail/rounds/round-6.md:76` alone, this finding's own text, which stays, executed. `git grep -n -e 'names no `apps/desktop/test/ledger.test.ts`' -- seal` prints `trail/rounds/round-1.md:105` alone, round 1's record, which stays, executed.
```

### 3. `gaps.md` *Not done* names the reasons the word broken stays, but the list misses some printed lines, and two of its examples no longer stand at the target

```seal
severity: should
location: `seal/threads/1795797447-322-workflows-compose-around-iadd/gaps.md:46`
evidence: executed `git grep -n -i -e broke -e breaks -e breaking -- apps/desktop/test apps/desktop/src` at `0e556f40`; executed `git grep -n -i -w -e break -e breaking -e breaks -e unbroken -- apps/desktop/test apps/desktop/src` at `0e556f40`; executed `git grep -n -w -e brokenAt -e BROKEN_ID -- apps`, which printed nothing; read `apps/desktop/test/pty.test.ts:107`, `apps/desktop/test/theme-controls.test.ts:211`, `apps/desktop/src/daemon/daemon.ts:2702`, `apps/desktop/test/record-blocks.test.ts:73`
```

Why it matters: the paragraph is the pass's account of how it listed the class, and the inspector reads it to judge whether the class is closed. It says that the same two searches at `383c958f` "still print lines that stay, because the word has another sense in each", and then lists the senses. The searches, run at the target, also print lines whose sense the list does not name:

- Korean breaking in a shell with no `LANG` (`pty.test.ts:107`).
- A rule that "runs unbroken" (`theme-controls.test.ts:211`).
- The loop's `break` statement, which the `-w` search prints at many lines, such as `daemon.ts:2702`.
- A no-break space (`record-blocks.test.ts:73`, `:77`, `:90`, `:129` and `:136`).

None of these uses the word for a lapsed inspection, so the conclusion holds. But a reader who checks the list against the output finds lines the list does not account for. The same paragraph says that the first search "also prints names that hold the letters inside them, such as `brokenAt` and `BROKEN_ID`". `383c958f` renamed both, and neither stands at the target. The search now prints `record-blocks.ts#brokenOptions` as such a name.

```markdown
seal/threads/1795797447-322-workflows-compose-around-iadd/gaps.md:46, two edits:

in place of "which also prints names that hold the letters inside them, such as `brokenAt` and `BROKEN_ID`,":
which also prints names that hold the letters inside them, such as `brokenAt` and `BROKEN_ID` before this pass and `record-blocks.ts#brokenOptions` after it,

in place of "the slanted break of a lapsed place's drawing; and `record-blocks.ts#brokenOptions`.":
the slanted break of a lapsed place's drawing; Korean that breaks in a shell with no `LANG` and a rule that runs unbroken; the loop's `break` statement and a no-break space, which the `-w` search prints; and `record-blocks.ts#brokenOptions`.
```

```seal
verdict: fixed 2b2d3b74
answer: `2b2d3b74` applies the first edit as written and writes the second in its own words, since the finding's list is a sample of the searches' output. Both searches of the finding's `evidence:` line were run again at `3f187a49`, whose tree under `apps/` the last fix commit keeps: the first printed 50 lines and the second 73, and each line was read for its sense, executed. Beyond the four senses the finding names, that read found a value that holds no space to break at (`theme-controls.test.ts:224`), a rule that runs unbroken at `index.html:482` as well, and a chain whose crafter answers with a block the reader refuses (`chain.test.ts:2099`), so the paragraph names each sense the two outputs hold, with a coordinate for each sense the earlier list lacked. No printed line uses the word for a lapsed inspection. The list is whole for those two searches' output and is a sample of the class, since a spelling outside their words is not in it, as the paragraph says. `git grep -n -w -e brokenAt -e BROKEN_ID -- apps` prints nothing, executed. `pnpm --filter @owlery/desktop run test test/<a>.test.ts`, one command each, passed for the unit files `383c958f` changed: chain 179 of 179, daemon 440 of 440, pr-check 26 of 26 and view 612 of 612, executed. `daemon.ts` and the TypeScript files of `383c958f` passed `tsc` through a scoped `tsconfig` in this pass's scratch, executed.
```

## Confirmations

```seal
confirms: round-5#1
```
What holds: the first acceptance search at `0e556f40` prints no line that names today's inspection, inspector or their states by the seal's words, executed (*The acceptance searches*). Every helper, constant, title and comment that round 5's finding 1 listed now carries the name of its map, read in the word-diff tally of `8d37e899`. `git grep -n -i guarant -- apps pr-check` at the target prints only the lines that `gaps.md:44` names as staying, executed. Those lines are the earlier root's fixtures, `workflow.test.ts:106`, the agent contract's rule 13 and the taken `verify/SKILL.md:119`. It also prints the role bundle's "guarantor" at `agents/inspector.md:4` and `docs/forms/the-inspection.md:9`, which a search for "guarantee" does not reach. Both use the plain English sense that `docs/product.md:189` *What an inspection guarantees and what it doesn't* keeps for today's inspection, so they are no leftover name, read. The rows' lists, which the finding's paste-ready fix asked to grow, were written by `152762de` and hold exactly. Finding 1 above is the regression the pass introduced at `approval-line.test.ts:215`.

```seal
confirms: round-5#2
```
What holds: `apps/desktop/role-bundle/skills/inspection/SKILL.md:72-74` tells the session to start the subagent with no model where `model` is null, so that the subagent runs on the model its tool gives by default, read. `chain-command.ts:241` says "null for the CLI's default", and `chain-command.test.ts:82` says the default the subagent tool gives, read. `role-bundle.test.ts:110` pins the new sentence word for word, read. The finding's second search, `git grep -n -F -e "session's own model" -e "null for the session's own" -e "runs on the session's default" -- apps docs README.md`, prints nothing (exit 1), executed. The first search prints only the lines that say "the CLI's default", which stay, executed. The pass reports the pin as seen red; this round read that claim and did not run it again.

```seal
confirms: round-5#3
```
What holds: `chain_check.py:2623` names `apps/desktop/src/daemon/workflow.ts#OWL_CHAIN`, which `workflow.ts:31-32` defines, read. The finding's search prints only round 5's own record, executed.

```seal
confirms: round-5#4
```
What holds: `docs/iadd.md:39` reads "framer, crafter, proofer, orchestrator and tracer, as before, and the inspector, the final role, which inspects. Owlery's role bundle holds no tracer", read. `docs/iadd.ko.md:39` says the same, read. Each edition changes one table row in place, so the counts of headings and table rows that the broad gate compares do not change, read in the diff of `f8c1d3f4`. The finding's search prints the two rows, `role-bundle/README.md:38`, and two taken documents that name the plugin's tracer, executed.

What matched: `383c958f`, which no finding named, renames each constant, helper, title and comment that called a lapsed inspection broken, and each pair it makes is one name for one thing, read. The pairs are `BROKEN` to `LAPSED` or `LAPSED_ITEM`, `BROKE` to `LAPSED`, `brokenAt` to `lapsedAt` or `lapsedClearedAt`, `broke` to `lapsedBy`, `brokenBack` to `lapsedBack`, `BREAKING` to `LAPSING`, `BROKEN_ID` and `BROKEN_RECORDS` to `LAPSED_ID` and `LAPSED_RECORDS`, and the work item title "Broke" to "Lapses". No new name collides with a declaration in its scope, executed with `git grep -w` for each new name at `7dd65599` and at the target. Each new declaration stands at the line where the old name's declaration stood. Where a new name was already in a file at `7dd65599`, it was an object key there, such as `lapsedBy` in `daemon.test.ts:5305`, or it stood in a file the commit does not change, such as `LAPSED` in `last-look.test.ts:39`. The title "Lapses" changes no order, since `changesSince` orders by the daemon's order and not by title, read at `view.test.ts:2334-2344`. The comment it changes at `daemon.ts#runPullRequest` changes no code. The two searches the pass names, run at the target over `apps/desktop/test` and `apps/desktop/src`, print no line that uses the word for a lapsed inspection, executed. The same words over `apps/desktop/role-bundle` and `pr-check`, which the pass did not search, print only other senses, executed: a broken test, what a fix broke, a broken pattern, what breaks after a merge, tie-breaking, a line GFM breaks, and a broken link.

What matched: the other edits of `8d37e899` that could change behaviour change none, read. The option `history` of `pr-check.test.ts:776` changed only its type, from `seal?` to `inspection?`, to match what `chain-run.ts#commitInspection` reads and what the histories at `:798` already passed. `sealing` became `inspecting` in a parameter name, and the flag it passes was already `--inspecting`. `workflowName` in the stand-ins of `chain.test.ts` and `daemon.test.ts` is read by no file of `apps/desktop/src`, executed. `NAME` of `chain.test.ts` and the titles "Cleared work" were renamed together, so the record names they make agree. The helper `block` of `round-record.test.ts` writes the fence `iadd` it wrote as `sealed`.

What matched: `gaps.md:29-34` name, for each of the two fix passes, the built-app files it changed: `approval-line`, `decisions-and-questions`, `inspection-sheet-view`, `role-session`, `screenshots`, `work-item-form` and `role-bundle` for `8d37e899`, and `approval-line`, `daemon-restart`, `inspection-sheet-view` and `screenshots` for `383c958f`. Those are the files the commits change among the 19 that `vitest.config.ts:14` selects, executed. `gaps.md:44` names the guarantee lines that stay, which matches the search above. Finding 1 holds the one false clause of `:29`, and findings 2 and 3 hold `:48` and `:46`.

A case gap, with no finding: none is owed. A rename owes no new case (`skills/verify/SKILL.md` *The narrow command still has to be able to fail*), and the two commits add no case.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The broad gate at `0e556f40`: the whole suite, the typecheck and the documents' editions. The suite is `unverified`, since this round ran no case, as the caller ordered | the repository's `Broad gate` key of `seal/config.json` | the orchestrator, in the broad gate it runs alone once the rounds settle |
| The orchestrator's whole built-app run at `0e556f40`, reported as 1 file failed, 16 passed and 2 skipped. This round read its log's summary and the three failures, `executed` by the orchestrator, and ran nothing | `<scratchpad>/1795797447-322/app-all-r5.log` | the orchestrator, whose run it is, again after finding 1's fix |
| The unit files and the type check of `383c958f`: `chain.test.ts`, `daemon.test.ts`, `pr-check.test.ts`, `view.test.ts` and `daemon.ts`. No record of the work item and no commit message says that they ran after that commit | `seal/threads/1795797447-322-workflows-compose-around-iadd/gaps.md` | the orchestrator, in the broad gate's suite and typecheck |
| The line counts `seal range` wrote in `gaps.md:31` and `:34`, and what the builder says it read, read as claims and not run again | `seal/threads/1795797447-322-workflows-compose-around-iadd/gaps.md` | the orchestrator, who decides whether this round's read of the diff stands in for it |
| The lines of `8d37e899` outside the built-app files, read by the tally of their word pairs and sampled in context, not each line in context | `apps/desktop/test/` | the inspector, which reads the branch whole |

## Probes

| Command | Result |
|---|---|
| The first acceptance search, as `frame/design.md:110` states it, at `0e556f40` and at `f8c1d3f4` | 243 lines at each, with the same text and line numbers |
| The second acceptance search, as `frame/design.md:111` states it, at both commits | 10 lines at each: 8 in `records-migration.ts`, and `adapters/claude-roles.ts:74` and `:101` |
| A Python script in the round's scratch directory that checks each line of the first search's output against the row's list | no line outside the list, and no listed line left unprinted |
| A Python script that tallies the word pairs of `git show --word-diff=porcelain` for `8d37e899` and `383c958f` and lists each edit with no counterpart | 61 pairs and 10 one-sided edits for `8d37e899`, 17 pairs and 4 one-sided edits for `383c958f`. Of those edits, the edit at `approval-line.test.ts:215` alone is not valid code |
