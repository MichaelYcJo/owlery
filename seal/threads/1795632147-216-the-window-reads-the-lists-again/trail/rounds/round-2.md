# Review round 2: 1795632147-216-the-window-reads-the-lists-again

```seal
target: 297d2e20, fixes c05de658..297d2e20
```

This round verifies the fix pass after round 1 (`5275d783`, `2e099317`, `9428c76f`, `1e650004`), the crafter's merge of `release/v0.0.5` at `783e2331` (`7951da31`), and the orchestrator's fold of that merge (`297d2e20`). Every file of the work item's records was read whole at `297d2e20`. The code was read and run in a `git clone --no-local` of the branch worktree, checked out at the target.

Carried from round 1 rather than re-established: the readings of `answerReadLists` on the axes *Concurrency & atomicity* and *Security*, and of the refusal's route through `renderer.ts#onMessage`. They carry because the branch's own added and removed lines in `apps/` and `docs/` are the same against `783e2331` as they were against `943b1bfd`, except for the fix of `2e099317` (executed, *Probes* row 1). What the merge could change around those lines was read again, and *What matched* below gives it.

## Findings

### 1. A judgment row of the plan cites a section, *Order against other work items*, that the plan does not hold

```seal
severity: should
location: `seal/threads/1795632147-216-the-window-reads-the-lists-again/frame/plan.md:64`
evidence: executed `git grep -n -F "Order against other work items" -- seal/` at `297d2e20`, which printed `frame/plan.md:64` alone; executed `grep -n "^## " frame/plan.md`, which printed *Technical context*, *Alternatives considered*, *Phases*, *Overlap with the release*, *Operational impact* and *Judgments of the run*; read `git show 5275d783` and `git show 297d2e20` on `frame/plan.md`
regression: round-1
```

Why it matters: the fourth row of `frame/plan.md` *Judgments of the run* grounds the order "This item merges after #215" with "They share the sidebar's head (`frame/plan.md` *Order against other work items*)". The plan has no section of that name. The order and its grounds stand in *Overlap with the release*, in the row of #215 (`frame/plan.md:48`), whose *Merges first* cell is "#215". The sealer and the settle read this row, and a reader who opens the cited section finds nothing. The row was written in the fix pass, at `5275d783`, and `297d2e20` rewrote its judgment cell and kept the citation. The frame's *Overlap with the release* row of #215 says #215 merges first because both change the sidebar's head. The fix pass restated that order and cited it under a heading the plan never held. The search above is a sample, since it reads one spelling. It found this one statement.

```markdown
| 2026-11-26 | This item merges after #215. Its branch merged the release at `783e2331` (`7951da31`) while #224, #217 and #215 waited for their tails, to take its conflicts early, and merges the release again once #215 has merged. | They share the sidebar's head (`frame/plan.md` *Overlap with the release*, the row of #215); the release tail runs one item at a time. | the run's rule of one tail at a time |
```

```seal
verdict: fixed 53d8f62d
answer: The orchestrator replaced the row with the round's paste-ready row, which cites *Overlap with the release*, the row of #215. The change is to the work item's records alone.
```

### 2. The frame's undated sections cite line numbers of `8c7eb798`, and the target contradicts each of them

```seal
severity: should
location: `seal/threads/1795632147-216-the-window-reads-the-lists-again/frame/design.md:68`, `seal/threads/1795632147-216-the-window-reads-the-lists-again/frame/design.md:74-75`, `seal/threads/1795632147-216-the-window-reads-the-lists-again/frame/design.md:82-83`, `seal/threads/1795632147-216-the-window-reads-the-lists-again/frame/design.md:88-89`, `seal/threads/1795632147-216-the-window-reads-the-lists-again/frame/design.md:98`, `seal/threads/1795632147-216-the-window-reads-the-lists-again/frame/plan.md:22-32`, `seal/threads/1795632147-216-the-window-reads-the-lists-again/frame/plan.md:48-50`
evidence: executed `grep -n -o -E` for a backticked `path:line` and for `line N` or `lines N to M` over `frame/design.md` and `frame/plan.md` at `297d2e20`; executed `git grep -n` at `8c7eb798`, `76171cfd` and `297d2e20` for `type: "readMachine"`, `type: "inbox"`, `readyWaitMs?:`, `case "readMachine"`, `tell(message.message)`, the cases whose names hold "hello", `describe("the watch of an open pull request"` and the case of icon-only buttons in `test/work-item-menu.test.ts`; executed `git show 8c7eb798:<file> | sed -n <line>p` for `daemon.test.ts:7339`, `protocol.ts:957`, `renderer.ts:124`, `:1588`, `:1817-1818` and `daemon.ts:849-853`, `:1701`, `:4026`
```

Why it matters: `frame/design.md` dates its tree once, at the head of *Grounding* ("The tree as read at `8c7eb798`"), and `frame/plan.md` does so at the head of *Technical context*. Only those sections are dated. The plugin's `skills/implement/SKILL.md` *Document layout — two roots, three lifetimes* names them as the frame's dated account of the tree. A line number in any other section of the frame is a present-tense coordinate, and the target contradicts every one of them that the grep listed. Each holds at `8c7eb798` (executed above). So the numbers are right for the framer's tree, and the sections do not say so.

- `frame/design.md:68`, `watched` at line 7339 of `daemon.test.ts`. At the target `watched` stands at 7808, in the describe "the watch of an open pull request" that opens at 7796.
- `frame/design.md:74`, the cases at lines 6084 and 7369, which stand at 6456 and 7838.
- `frame/design.md:75`, `work-item-menu.test.ts:598`, which stands at 603.
- `frame/design.md:82-83`, `readMachine` at line 948 and the comment of `inbox` at line 957 of `protocol.ts`. They stand at 969 and 980.
- `frame/design.md:88-89`, `readyWaitMs` at line 292 and the `readMachine` case at line 1685 of `daemon.ts`, which stand at 343 and 1798.
- `frame/design.md:98`, `tell(message.message)` at line 1995 of `renderer.ts`, which stands at 2075.
- `frame/plan.md:22-32`, the rows of *Alternatives considered*: `daemon.ts:4026-4036`, `renderer.ts:1817-1818`, `daemon.ts:849-853`, `renderer.ts:124`, `github.ts:29`, `daemon.ts:1685-1690`, `daemon.ts:1701` and line 1588 of `renderer.ts`.
- `frame/plan.md:48-50`, the rows of *Overlap with the release*: the case at line 598, `readMachine` at line 1685, the `asked` case at line 1934, and the hunks of this work and of #217 at the lines they name.

The merge at `7951da31` moved the coordinates of `protocol.ts` and of `readyWaitMs`. The others already differed at `76171cfd`, and round 1 did not report them. The sealer opens a coordinate of the frame to check the sentence that holds it, and these lead to the wrong line. The fix dates each section, as *Grounding* and *Technical context* are dated, and leaves the numbers as the framer's. It is one sentence at the head of each of the four sections below. The method lists every backticked `path:line` and every "line N" of the two files. It is whole for those two spellings, and a coordinate written in another form is outside it. The coordinates in *Grounding*, in *Technical context*, and those already marked "at `8c7eb798`" (`frame/design.md:144`, `frame/plan.md:39`) need no change.

```markdown
In `frame/design.md`, as the first line under `## User scenarios & acceptance *(mandatory)*`:
A line number in this section is the line at `8c7eb798`, the tree *Grounding* names. The build and the merges of the release moved them, so a case is found at HEAD by its name.

In `frame/design.md`, as the first line under `## Data & interfaces`:
A line number in this section is the line at `8c7eb798`, the tree *Grounding* names, beside which the build was to make its change. The build and the merges of the release moved them.

In `frame/plan.md`, as the first line under `## Alternatives considered`:
A coordinate in this table is the line at `8c7eb798`, the tree *Technical context* names.

In `frame/plan.md` *Overlap with the release*, as the last sentence of the paragraph that opens "Read:":
A line number in the table below is a line at `8c7eb798`, or a line of a named branch's hunks as `git diff -U0` printed them then.
```

```seal
verdict: fixed 53d8f62d
answer: The orchestrator put the round's four dating sentences at the heads of the four sections, as the paste-ready block places them. The change is to the work item's records alone.
```

## Confirmations

```seal
confirms: round-1#1
```
What holds: `gaps.md:17-27` links the six shots under the paragraph "Only the inbox's shots are committed", each as `../blob/7336a3a1f4fd764e7ba9485e9458734fd3240445/<path>?raw=true`, the form `docs/design.md:517` gives. `7336a3a1` is an ancestor of the target. Each of the six blobs it names equals the blob at the target. Executed: `git rev-parse` of each path at both commits, and `git merge-base --is-ancestor`. Round 1's command, run again at the target (`pr_body.py ... --body`, then `grep -c "raw=true"`), printed 8. The six image lines stand in the body's *Not done* section, outside any table or fence, and the other two lines are the quotes of round 1's record. The shot `register-light-inbox.png` was opened. Its head row holds the bell with its count 3, the refresh's two arrows, the filter and "+", as its alt text and `docs/design.md:444` say. The release changed no line of `#repositories-head` (executed: `git diff 943b1bfd 783e2331 -- apps/desktop/src/renderer/index.html`), so the shots still show the row as it stands.

```seal
confirms: round-1#2
```
What holds: `frame/design.md:96` says that `refresh.ts` "exports the window's three sentences of the table below, and the daemon's refusal is written in `daemon.ts#answerReadLists`". `trail/phases/phase-2.md:13` says "The module still exports the window's three sentences". `refresh.ts` exports `REFRESH_ANSWER_MS` (line 15) and `REFRESH_SAYS`, `REFRESHING_SAYS` and `NO_ANSWER_SAYS` (lines 17, 19 and 21). Executed: `grep -n "export const"`. Round 1's search, run again with the round records left out, printed `phase-2.md:13` alone. That hit is its quote of the frame as phase 2 read it. The phrase "import from `refresh.ts` only" (`1e650004`) holds too, since `refresh.test.ts` now also imports `daemonNotice` from `view.ts`.

```seal
confirms: round-1#3
```
What holds: claimed, the wait's end tells the sentence of no answer and then the notice of a daemon of another build. `refresh.ts:68-69` reads `world.daemonNotice()` and tells `` `${NO_ANSWER_SAYS} ${notice}` `` where the notice is not empty, and `NO_ANSWER_SAYS` otherwise. `renderer.ts:138` gives `daemonNotice: () => held.daemonNotice`. `held.daemonNotice` is a string, "" by default (`shared.ts:24`). `connect` sets it once, from `view.ts#daemonNotice(answer.otherBuild)`, before the socket opens (`renderer.ts:2106`), and nothing else writes it (executed: `grep -n "daemonNotice"`). So at a press, which needs `ready`, it holds the notice the status line shows. `sidebar.ts:102` draws the window's own notice before the daemon's (`view.ts#statusNotice`), so the joined sentence shows whole. The next `tell("")`, at the `done` of another request (`renderer.ts:1985`), brings back the notice alone. The line of `renderer.ts` runs in no case, as `gaps.md:11` says, and this reading answers that row. The words match `frame/design.md:107`, `changelog.md:9` and `frame/plan.md:55` (now "followed by the notice"). The new case was seen red twice in the clone, through `Edit` and restored after. With the join removed, the new case failed on the told sentence. With the join made unconditional, the 15-second case failed on a trailing space. That matches the fix pass's account. Executed: *Probes* rows 3 and 4.

```seal
confirms: round-1#4
```
What holds: `frame/plan.md:61` holds the row "The pull request's title takes the prefix `feat:`.", with `fix:` named as the kind that came closest. `pr.md:8` quotes it word for word. Read.

What matched: the merge kept both sides. The added and removed lines of `git diff 943b1bfd 76171cfd -- apps docs` and of `git diff 783e2331 297d2e20 -- apps docs` differ only by the lines of `2e099317`. The target's diff against `783e2331` touches only the 13 files of this work. So no line of the release was lost, and no line of the branch was dropped. `git show --remerge-diff 7951da31` shows the three conflicts, and each keeps both sides. `protocol.ts` keeps #265's `addEnded` and this work's sentence on a `readLists`'s `done`. Both editions of `docs/design.md` keep the row "The sidebar's head" and #264's rewritten row of a list of records. Executed.

What matched: the answer to a `readLists` carries every list an `inbox` carries. `answerReadLists` sends `{ type: "inbox", ...this.lists() }` (`daemon.ts:1010`), and `broadcastInbox` sends the same spread (`daemon.ts:4238`). `lists()` (`daemon.ts:2933-2940`) gives the four lists that `protocol.ts:981` types. The release added no list. #264's `wordOwed` rides in each `WorkItem` (`daemon.ts:3036`, in `workItemOf`). Read.

What matched: #264's read of the owed words joined the press. `readCommits` now awaits `readOwedAt` for each open work item (`daemon.ts:4585-4586`). `readOutside` reaches it through `readCommitsNow` (`daemon.ts:956`, `:4553-4562`), and `answerReadLists` awaits that read with no bound, as it awaited git before. The release did not touch `accept` (`daemon.ts:902-925`), so the hello still reads only through `readOutside`, and `## Removes` row 1 holds. The rule change's list (`frame/design.md:132`, `:137`) and `changelog.md:6` name the owed words, as the fifth judgment row (`frame/plan.md:65`) says. That row's list of #259, #262, #263, #264, #265, #267 and #268 is `git log 943b1bfd..783e2331`. Executed.

What matched: the narrow cases at the merged tree. `refresh.test.ts` passed 5 cases. `daemon.test.ts -t "readLists|hello"` passed 14 cases, the 7 new ones and the 7 whose names hold "hello". Executed: *Probes* rows 2 and 5.

What matched: the new case of `refresh.test.ts`, read against its group. The 15-second case holds the bare sentence with no notice (`windowLike`'s `notice` is "" by default). The new case holds the joined sentence. Neither covers what the other does. Read.

What matched: the axis *Record against another work item's frame*, for the work items the merge brought. #231's operations on `docs/architecture.md` *Screen framework: Electron* rewrite its sentence on opening a file, apart from this work's `add`. #249-251's *Grounding* reads #242's `add` and changes nothing of it. #150's operations name *Records are committed to the repository*, *Foundation* and the screenshots section. Executed: `grep -n -F "Screen framework: Electron"` and `grep -n -F "Components and their states"` over `seal/threads/*/frame/design.md`, and a read of #150's `## Rule changes`.

What matched: the label of the suite. `gaps.md:7` names the full suite, the typecheck, the lint and the count of table rows as unverified, with the orchestrator's broad gate as their answerer. No record claims a run of any of them after the merge. The label is honest.

## Not judged

| What | Location | Who answers |
|---|---|---|
| `origin/release/v0.0.5` moved past the target's base to `3fb1dedd`, the merge of #270 (#224), which removes the `asked` case right after the `done` case this work extends in `renderer.ts#onMessage`. `git merge-tree --write-tree 297d2e20 3fb1dedd` reported no textual conflict, and no round has read the meeting of the two | `apps/desktop/src/renderer/renderer.ts:1983-2013`, `apps/desktop/src/shared/protocol.ts` | the orchestrator, at the next merge of the release, and the round that reads it |
| The built-app files after the merge: `test/notification-click.test.ts`, `test/work-item-menu.test.ts`, whose list of icon-only buttons now also meets #267's find bar, and `test/screenshots.test.ts`. This round ran none of them | `seal/threads/1795632147-216-the-window-reads-the-lists-again/gaps.md:7` | the orchestrator's batch of the built app, and its broad gate |
| The full suite, the typecheck, the lint and the count of table rows across the two editions of `docs/design.md`, at the merged tree | `seal/threads/1795632147-216-the-window-reads-the-lists-again/gaps.md:7` | the orchestrator's broad gate |
| How the arrows look while they turn, and that they turn about their centre, carried from round 1 | `apps/desktop/src/renderer/index.html` | a person's look at the built app |

## Probes

No probe file was written. The runs below are this round's, in the scratch clone at `297d2e20`. The clone's `node_modules` and `apps/desktop/node_modules` are links to the branch worktree's. The edits of rows 3 and 4 were made to the clone's `refresh.ts` through `Edit`, and restored before row 5. `git merge-tree --write-tree` of the first *Not judged* row ran in the branch worktree's repository. It wrote unreferenced objects there and moved no ref.

| Command | Result |
|---|---|
| `diff` of the added and removed lines of `git diff 943b1bfd 76171cfd -- apps docs` and `git diff 783e2331 297d2e20 -- apps docs` | the two differ only by the lines of `2e099317`, in `refresh.ts`, `renderer.ts` and `refresh.test.ts` |
| `node scripts/test-in-electron.mjs test/refresh.test.ts`, in `apps/desktop` | exit 0: 5 cases passed |
| the same, with `refresh.ts:69` telling `NO_ANSWER_SAYS` alone | exit 1: the case "keeps the notice of a daemon of another build after the sentence of no answer" failed, receiving the sentence without the notice |
| the same, with `refresh.ts:69` joining the notice unconditionally | exit 1: the 15-second case failed, receiving the sentence with a trailing space |
| `node scripts/test-in-electron.mjs test/daemon.test.ts -t "readLists\|hello"`, in `apps/desktop` | exit 0: 14 cases passed, 396 skipped |
| the plugin's `skills/code-review/scripts/pr_body.py seal/threads/1795632147-216-the-window-reads-the-lists-again --body` into the scratch directory, then `grep -c "raw=true"` | exit 0; 8 lines: the six images and two quotes of round 1's record |
