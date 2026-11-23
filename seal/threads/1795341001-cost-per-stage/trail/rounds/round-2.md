# Review round 2: 1795341001-cost-per-stage

```seal
target: 6f0d574, fixes 75fc841..6f0d574
```

This is the verifying round. It reviews the diff from round 1's target `75fc841` to `6f0d574` as a whole: `472a98a`, `98fa06b`, `dce89e5`, the close blocks of `7c35cd1` and the orchestrator's `6f0d574`. Beside that bound, it read each record of the work item whole at `6f0d574`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `pr.md`, both phase records and `trail/rounds/round-1.md`. No `seal/parity.json` is declared, and the frame cites no reference root. `Commit and pull request language` is English, so no `pr.<lang>.md` is owed.

Carried from round 1 rather than re-established: the coordinates in `apps/desktop/src/shared/protocol.ts` and `apps/desktop/src/daemon/daemon.ts`, among them the sealer's pair in `ROLE_STAGES` at `protocol.ts:345` and the rejected start at `daemon.ts:1402`. The range changes neither file in `apps/desktop/src` (executed: `git diff --stat 75fc841..6f0d574`, which names `src/daemon/ledger.ts` and `test/ledger.test.ts` alone under `apps/desktop`). Re-derived this round: every verdict below, and the listener of `startHeadless` at `daemon.ts:1341-1406`, which finding 2 rests on.

The axes walked on the fix: a write that fails part way, once and twice in a row; a write that fails before any byte; the line break before an entry after a cut line; the order of the held entries against the file's lines; the bytes a write that succeeds leaves, against the code at `472a98a`; and the precondition the fix names. On the records: each sentence of the files above against the target, each row the range adds to `gaps.md` and each row it removes (none), and each claim of the four close blocks.

## Findings

### 1. The comment on the fix says no entry is written twice, while the precondition it rests on is stated only in a memo the settle removes

```seal
severity: should
location: `apps/desktop/src/daemon/ledger.ts:97-98`
evidence: read `apps/desktop/src/daemon/ledger.ts:97-103`, `seal/threads/1795341001-cost-per-stage/gaps.md:11`, `seal/threads/1795341001-cost-per-stage/trail/rounds/round-1.md:25`
regression: round-1#1
```

Why it matters: the unit is the comment at `ledger.ts:97-98`, which `98fa06b` added. It says "an append that fails part way keeps only the entries whose line is not whole in the file, so no entry is written twice". `gaps.md:11` says the opposite for one case: "an append whose close fails after its whole line was written keeps the entry held, and the next append writes it a second time". `gaps.md` is the work item's closing memo, and the settle removes it with the work item's directory. After that, the comment is the only text in the tree on whether the ledger can hold an entry twice, and it says it cannot. Issue #76 publishes the ledger, and whoever decides there whether the export has to drop duplicate lines reads this comment.

The frame asks, in *Scope* item 8 (`frame/design.md:56`), that an entry whose append failed is held and written before the next entry's line. The plan's row on `ledger.jsonl` (`frame/plan.md:36`) rests on no write losing an entry. The fix took round 1's paste-ready code word for word, and that code's comment states the guarantee without the precondition that round 1's own prose named (`round-1.md:25`). So the defect came from round 1's snippet, not from the fix pass's reading of it. The fix touches a file write, so its precondition belongs beside the line (`skills/code-review/SKILL.md` *The record*, the paragraph on a fix at an OS boundary).

The statements of the fact were listed from the docstring of `Ledger`, the comments of `add`, the name of the new case, `changelog.md`, `pr.md` and `gaps.md`, each read whole. The docstring at `ledger.ts:75-76` says no write loses an entry, which is another fact and holds. The case's name says "as on a full disk", which is the case the precondition covers. `gaps.md:11` already says it. So the snippet below reaches every statement.

```ts
      // One append for each held entry, which leaves the held list once its append returns. An append that fails part way
      // keeps only the entries whose line is not whole in the file, so no entry is written twice. That rests on
      // `appendFileSync` throwing only where its text is not whole in the file: one whose close fails after a whole write
      // keeps its entry held, and the next append writes it a second time.
```

```seal
verdict: fixed 22ba7dd
answer: The finding holds, and the comment at `apps/desktop/src/daemon/ledger.ts` in `add` now carries the paste-ready text word for word. Read against the code: the entry leaves `held` once its own `appendFileSync` returns, so the clause "once its append returns" is the exact condition. The precondition holds as stated: `appendFileSync` opens, writes in a loop and closes, so an error thrown after the whole text is written, a failed close, leaves the entry in `held` and the next call writes it again, which is the case `gaps.md:11` names. Read against the frame: `frame/design.md` *Scope* item 8 asks that a failed entry be held and written before the next entry's line, and the comment states the guarantee that item gives and its one limit. The snippet fits the unit, and the comment changes no code (read: `git show 22ba7dd`). `gaps.md:11` already names the precondition and its answerer, so no row is added. `test/ledger.test.ts` passed, 11 of 11, exit 0, and `tsc` over `src/daemon/ledger.ts` and `test/ledger.test.ts` exited 0 (executed). A case is not added: the change is a comment, and the case that pins the behaviour is the one `98fa06b` added.
```

### 2. Three records say the daemon takes nothing from an agent after a stop, while it still takes the exit and the window shows its error output

```seal
severity: should
location: `seal/threads/1795341001-cost-per-stage/changelog.md:8`, `seal/threads/1795341001-cost-per-stage/trail/phases/phase-2.md:9`, `seal/threads/1795341001-cost-per-stage/frame/questions.md:21`
evidence: read `apps/desktop/src/daemon/daemon.ts:1349-1359`, `apps/desktop/src/renderer/view.ts:2134`, `apps/desktop/src/renderer/work-item-view.ts:705`; executed `git grep -n -i -E "after (a|the|its|it) ?stop|after it stops|no event|every event|takes nothing|takes no " 6f0d574 -- seal/threads/1795341001-cost-per-stage apps/desktop/src`
```

Why it matters: `changelog.md:8` becomes the release note a person reads. It says "The daemon takes nothing from an agent after it stops it, at its limit, at a request or at its own stop." That person then sees, in the work item's view, what the stopped agent printed on its error stream up to its exit. `trail/phases/phase-2.md:9` says "the daemon takes no event after a stop (`startHeadless`)", and the sealer reads it as phase 2's account of the code.

The grounds. The listener of `startHeadless` handles an `exit` event before its guard on the session's state (`daemon.ts:1349-1356`). After a stop it copies the exit's `errorOutput` into the session and, where the output changed, sends the session to every client. Only after that branch does the guard `if (info.state !== "working") return;` drop the other events (`daemon.ts:1359`). The window shows a failed session's `errorOutput` (`view.ts:2134`, `work-item-view.ts:705`), and a stopped session is failed. So the daemon still takes the exit and its error output after a stop, and what it takes no more is a usage, a result, a text or a permission request.

`6f0d574` corrected two sentences of this class, at `frame/plan.md:28` and at Q2's parenthetical. It left the three above. Q2 now holds both readings in one sentence: "The daemon takes nothing after a stop today" and, in the parenthetical, "it still passes the exit on". The list was made by reading each record of the work item whole at `6f0d574`, every sentence of each, and was cross-checked with the search on the finding's `evidence:` line. One other sentence was weighed and left: `frame/plan.md:29` names "the daemon's rule that nothing after the end changes a session". That is the rule the comment at `daemon.ts:1358` states for a result, and the row is about a result that arrives after a stop, which the rule covers. Code outside the work item's records was searched and not read whole, so for code the list is a sample. The one comment the search found on the listener, `daemon.ts:1358`, stands after the exit's branch and holds.

```md
changelog.md:8: ... The daemon takes no usage and no result from an agent after it stops it, at its limit, at a request or at its own stop. ...
trail/phases/phase-2.md:9: ... Only a result sets `HeadlessInfo.usage`, and the daemon takes no result after a stop (`startHeadless`), so a session that a stop or the daemon's close ended carries null. ...
frame/questions.md:21: ... The daemon takes no usage and no result after a stop today (`apps/desktop/src/daemon/daemon.ts#startHeadless`, whose listener passes on only the exit once the session is no longer working), and what the CLI prints then was not run: ...
```

Each line changes only the clause it shows. Every other word of the three lines stays.

```seal
verdict: fixed 4d9f760
answer: The orchestrator's `4d9f760` takes the record's three lines and changes one clause in each (read: `git show 4d9f760`). `changelog.md:8` now says the daemon takes no usage and no result from an agent after a stop. `trail/phases/phase-2.md:9` says it takes no result after a stop. `frame/questions.md:21` says it takes no usage and no result after a stop, and that its listener passes on only the exit once the session is no longer working. Each clause holds against `apps/desktop/src/daemon/daemon.ts#startHeadless` at HEAD: the `exit` event is handled before the guard `if (info.state !== "working") return;`, and every other event type is dropped after it, among them a result, which is the only event that sets `HeadlessInfo.usage` (read: `daemon.ts:1349-1359`). A search of the work item's records outside the round records for "takes nothing", "no event after", "takes no event" and "every event" finds no sentence left of this class (executed: `git grep -n -i -E` over `seal/threads/1795341001-cost-per-stage`). The search is a sample over words, and the records of the work item read whole at the round were the proofer's method. This pass changed none of the three files.
```

## Confirmations

```seal
confirms: round-1#1
```
What holds: `add` appends one held entry at a time and takes it out of `held` only once its own append returns (`apps/desktop/src/daemon/ledger.ts:99-104`). An append that fails part way therefore leaves held only the entries whose append did not return, and the next append starts a line of its own after the cut line (`ledger.ts:102`). Executed in a clone of the branch at `6f0d574`: `test/ledger.test.ts` passed 11 of 11, exit 0. With `src/daemon/ledger.ts` taken from `472a98a` and nothing else changed, the same command exited 1, and the one failing case was "writes each entry once where an append fails part way, as on a full disk, and leaves the line it cut", at `test/ledger.test.ts:226`, where the received lines held the first entry's line twice. So the fix pass's seen-red claim holds, and the case's file assertion is the guard. The close block's reading of round 1's mock also holds: a second call that writes its first line and then throws would, under the fix, write a one-line append whole and then throw, which is the failed close `gaps.md:11` names, so the case had to give the disk a room in characters instead (read: `test/ledger.test.ts:8-23`). `gaps.md:10` says an append that succeeds writes the same bytes as before. It holds: one call of the joined lines and one call for each line give the same text, and the line break before a cut line is written once, before the first of them (read: `git diff 472a98a 98fa06b -- apps/desktop/src/daemon/ledger.ts`). Finding 1 above is a defect in the comment this fix added, which is why two lines name this finding.

```seal
confirms: round-1#2
```
What holds: `pr.md:7` carries the record's paste-ready cell word for word, and no file the cell rests on changed in the range (read: `git show 472a98a`, and the carried coordinates above).

```seal
confirms: round-1#3
```
What holds: `frame/design.md:177` says an entry whose append failed is held "until an append writes it", and `frame/design.md:182` says "그 항목을 적는 덧붙이기가 성공할 때까지". Both hold under the code of `98fa06b`, where an entry leaves `held` once its own append returns (`ledger.ts:103`). The Korean sentence `6f0d574` rewrote now names the entry's own append, so the second reading the fix pass's close named is gone. The same fact at `trail/phases/phase-2.md:5`, "until an append of that entry writes it", holds too (read).

```seal
confirms: round-1#4
```
What holds: `frame/questions.md:21` and `frame/plan.md:28` name `startHeadless`, which stands at `apps/desktop/src/daemon/daemon.ts:1341`, and its guard at `:1359`. The words round 1's snippet brought in, that the listener drops every event, were corrected by `6f0d574` to "takes no usage and no result", which the code at `daemon.ts:1349-1359` does (read). The main clause of Q2 that this round's finding 2 names predates round 1's snippet. It is a new finding, not this close failing.

What matched: the new case against its group. The cases of "Ledger" in `test/ledger.test.ts` fail an append before any byte is written: a folder in the file's place, and a file that cannot be written. One holds the order of the held entries. The new case alone fails an append after some bytes are written, and so it holds a fact no other case holds. Its mock passes every other case's append through unchanged, since an unlimited room writes the whole text with the system's `appendFileSync` (read: `test/ledger.test.ts:8-23`). The repository declares no duplicate check and no `TARGET`.

What matched: `tsc` over the two files the fix changed. A scratch `tsconfig` that extends `apps/desktop/tsconfig.json` and lists `src/daemon/ledger.ts` and `test/ledger.test.ts` exited 0 in the clone (executed).

What matched: the records of the range. `gaps.md` gains two rows and loses none (read: `git diff 75fc841 6f0d574 -- seal/threads/1795341001-cost-per-stage/gaps.md`). The row at `gaps.md:11` names the fix's precondition and an answerer. `changelog.md:11` now names a failed append beside a crash, as the docstring of `endsInsideALine` does (`ledger.ts:51`), and the rest of the item still holds under the loop. `pr.md` quotes nothing, and no other sentence of the records read whole is contradicted by the target, except at the locations of findings 1 and 2.

What matched: the label of the suite. `gaps.md:10` labels the whole suite, the package's typecheck and the broad gate unverified at the fix pass's commit, with the orchestrator as the answerer, and names the files the fix pass did not run. The label is honest.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The whole suite, the package's typecheck and the broad gate at HEAD, among them the files that import `test/built-app.ts` | `seal/threads/1795341001-cost-per-stage/gaps.md:10` | the orchestrator, at the broad run after this round |
| Whether `appendFileSync` throws only where its text is not whole in the file, which the fix of round 1's finding 1 rests on | `seal/threads/1795341001-cost-per-stage/gaps.md:11` | the orchestrator, who decides whether it goes on to `seal/follow-up.md` |
| The fix pass's mutation run of `src/daemon/ledger.ts` and its narrow run of three files, read as claims and not run again | `seal/threads/1795341001-cost-per-stage/trail/rounds/round-1.md:51` | the sealer, where it weighs them |

## Probes

| Command | Result |
|---|---|
| `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/ledger.test.ts` in `apps/desktop` of a clone of the branch at `6f0d574`, through the run's lock | 1 file, 11 passed, exit 0. It started no built app and no `claude`. |
| The same command, after `git checkout 472a98a -- src/daemon/ledger.ts` in the clone | exit 1, 1 failed and 10 passed: the new case, at `test/ledger.test.ts:226`, with the first entry's line twice in the file. The file was then restored to `6f0d574`. |
| `tsc -p` a scratch `tsconfig` that extends `apps/desktop/tsconfig.json` and lists `src/daemon/ledger.ts` and `test/ledger.test.ts`, in the clone | exit 0, no output |
| `python3 skills/code-review/scripts/chain_check.py --baseline 41e8aa4 --root` (the branch worktree) `--worktree`, from the plugin's root, before this record stood | exit 0; it names the verifying round owed, and the missing gate and guarantee records, and prints no notice on a line of `frame/design.md` |
