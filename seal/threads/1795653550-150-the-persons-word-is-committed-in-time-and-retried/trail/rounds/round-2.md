# Review round 2: 1795653550-150-the-persons-word-is-committed-in-time-and-retried

```seal
target: 8ac53e0f, fixes 39fc28f7..8ac53e0f
```

The round is the verifying round after round 1's fix pass. It reviewed the commits of the branch `fix/150-a-commit-of-the-persons-word-hangs-on-a-hook-and-is-never-retried` after round 1's target `39fc28f7`, up to `8ac53e0f`, in a clone of its own. Those commits are `1dd0124c` (round 1's record), `376515e4`, `607caa50`, `675d2f54`, `2104c5de`, `fdcf071c` (the close blocks) and `8ac53e0f` (the orchestrator's fold of `frame/plan.md:20`). The code under review is that fix diff: the docstring and one comment of `Daemon#commitWord`, three new cases of `describe("the commit of a person's word")` in `apps/desktop/test/daemon.test.ts`, and the edits of `frame/design.md`, `frame/plan.md` and `gaps.md`. Beside that bound, the round read `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `pr.md`, the four phase records and round 1's record, each whole at `8ac53e0f`. `Commit and pull request language` is English, so no `pr.<lang>.md` is owed. The repository declares no `seal/parity.json`.

Carried from round 1, not established again: where `commitRunner`, `commitPaths`, `setUpRecords`, `placeOf`, `chainDirectory` and `commitBounds` stand, and round 1's confirmations of *Scope* items 1 to 5 and of the bounds reaching every commit. The fix diff touches none of `worktrees.ts`, `records-place.ts` or `stage-records.ts`, and it changes only a docstring and a comment in `daemon.ts`. The round established again whether each close holds. It re-ran round 1's `evidence: executed` probe for findings 4 and 5 (see `## Probes`).

## Findings

### 1. The new `gaps.md` paragraph on the reset after the close names only the record's and the routing's paths, and grounds the choice on a rule no document states

```seal
severity: should
location: `seal/threads/1795653550-150-the-persons-word-is-committed-in-time-and-retried/gaps.md:30`
evidence: executed `git grep -n "commitRecords(\|commitPaths(" -- apps/desktop/src` at 8ac53e0f; executed `git grep -n -F "the daemon's to commit" -- docs apps seal` at 8ac53e0f; read `apps/desktop/src/daemon/worktrees.ts:898-908`, `apps/desktop/src/daemon/worktrees.ts:1023-1044`, `apps/desktop/src/daemon/stage-records.ts:80-98`, `apps/desktop/src/daemon/daemon.ts:884-891`, `apps/desktop/src/daemon/daemon.ts:3443-3456`, `seal/threads/1795653550-150-the-persons-word-is-committed-in-time-and-retried/frame/design.md:53`, `seal/threads/1795653550-150-the-persons-word-is-committed-in-time-and-retried/frame/design.md:55`
regression: round-1
```

Why it matters: the unit is the third paragraph of `gaps.md` *Not done*, which `2104c5de` added for a gap round 1 named in its prose and in no finding. The frame decides this case. *Scope* item 1 (`frame/design.md:53`) has `commitPaths` take its paths out of the index "as it does after any failure", and item 3 (`:55`) ends a command whose signal fired before it "as at the limit". The fix pass wrote a paragraph that discloses the reset. But it listed only the callers it had in view, and it rested the choice on a sentence of its own rather than on those two items.

The handover asked whether the reset is this work's to fix. It is not. `commitRunner` gives "the commit was ended" without starting git where the signal has fired (`worktrees.ts:905-908`). `commitPaths` then calls `refused`, which runs `git reset --quiet -- <paths>` (`:1028-1035`). That is the reset the frame's items 1 and 3 ask for. It changes the index alone, and the file stands as written. The same reset has followed a failed `git add` since `9f9ba1da`. So the paragraph is the right place for the gap. Two of its sentences are wrong, though.

- "That takes back a change a person had staged at the record's or the routing's path." The search listed the callers of `commitPaths` and `commitRecords`. A stage's commit is one of them (`stage-records.ts:93`). It goes through `inWorktree` (`daemon.ts:3443-3456`), so it queues behind a word's commit that hangs. The close waits, fires `ending` (`daemon.ts:884-891`), and waits for that queue again. The stage's commit then runs its `write` and `commitPaths` after the signal. The reset then reaches the files the stage names and `trail/refusals.md`, as well as the record. The paragraph leaves those paths out.
- "a path under the work item's directory is the daemon's to commit." The second search found this sentence nowhere but `gaps.md:30` (the other hit, `screenshots.test.ts:68`, is another sentence). No policy document and no line of the frame states it. Behaviour called deliberate in the account alone is a question, not grounds. The grounds that do stand are *Scope* items 1 and 3.

The sealer and the owner read this memo for what the release leaves. As written, it narrows the gap and cites grounds nobody ratified.

```markdown
A commit that `commitPaths` is asked for after the close fired starts no `git add`, and `commitPaths` then runs `git reset` on its paths as after any failure (`worktrees.ts#commitPaths`, `refused`). That takes back a change a person had staged at one of those paths, and the file itself stands as written. The paths are the record's for a person's word, the `routing.md` for a renamed branch or a new directory, and, for a stage's commit whose turn comes after the close fired, the files the stage names with the record and `trail/refusals.md` (`stage-records.ts#commitRecords`). It was left as it is, as `frame/design.md` *Scope* items 1 and 3 state it: `commitPaths` takes its paths out of the index after any failure, and a command whose signal fired before it is ended as at the limit. The same reset has followed a `git add` that ran and failed since before this work. No case reaches it.
```

A search of the work item's records found one other statement of this reset: `git grep -n -e "git reset" -e "staged" 8ac53e0f -- seal/threads/1795653550-150-the-persons-word-is-committed-in-time-and-retried` (`executed`). That statement is `trail/phases/phase-1.md:23`. It says the paths are unstaged after a signal fired before the `git add`, cites *Scope* item 3, and names no path. So it stands as written. The search's other lines state the reset after a failure or a limit in general, or the frame's probe. That search is a sample.

```seal
verdict: fixed 2f0d0665
answer: The orchestrator replaced the third paragraph of `gaps.md` *Not done* with the record's paste-ready paragraph, word for word. It now names the stage's files and `trail/refusals.md` among the paths the reset reaches, and grounds the choice on `frame/design.md` *Scope* items 1 and 3. The code stays as it is, as the finding judged.
```

### 2. `frame/plan.md` says a change of the branch's head ends a failed try's wait, without the condition that a window is open

```seal
severity: should
location: `seal/threads/1795653550-150-the-persons-word-is-committed-in-time-and-retried/frame/plan.md:44`
evidence: executed `git grep -n -F -e "branch's head" -e "new commit on the branch" -e "ends it" -e "ends the wait" -e "due at once" -e "기다림이 끝" -- seal/threads/1795653550-150-the-persons-word-is-committed-in-time-and-retried apps/desktop/src docs` at 8ac53e0f; read `apps/desktop/src/daemon/daemon.ts:3171`, `apps/desktop/src/daemon/daemon.ts:4302-4311`
reopens: round-1#3
```

Why it matters: round 1's finding 3 holds where it was located. `frame/design.md:115` and `:120` now carry the condition. But the close did not reach every statement of the fact. Round 1's search looked for "ends the wait" and "makes the next try due at once". The plan's row says "ends it", so the search did not print it. The answer then said that each other line the search printed states the condition. At `8ac53e0f`, the row "Retry a failed commit at every turn, or every minute without end" of *Alternatives considered* ends: "a change of the record or of the branch's head ends it" (`frame/plan.md:44`). The pass compares the head that `readBranch` last read (`daemon.ts:3171`). The timer that reads the commits returns where no client is connected (`daemon.ts:4308-4309`). So the row states without its condition what *Scope* item 8, `changelog.md:9`, `trail/phases/phase-2.md:17` and the two `to:` lines all state with it.

The row's verdict describes what the work does, so it is read against the target. The search printed several lines that state a change of the head ending the wait. `frame/design.md:60`, `:115` and `:120` state it, and so do `changelog.md:9` and `trail/phases/phase-2.md:17`. Each carries the condition, and only `frame/plan.md:44` leaves it out. The other lines it printed state other facts. The search is on these words, so a statement in other words could escape it.

```markdown
| Retry a failed commit at every turn, or every minute without end | Each try runs the repository's hooks, and in a repository that signs with a passphrase each try opens the passphrase's prompt. | Rejected. The wait doubles from one minute to one hour, and a change of the record, or a new commit on the branch while a window is open, ends it. |
```

The row is the frame's, so the fix is the orchestrator's as the frame's writer, as `376515e4` was.

```seal
verdict: fixed c46b5ae3
answer: The orchestrator, as the frame's writer, replaced the row of *Alternatives considered* at `frame/plan.md:44` with the record's paste-ready row, word for word. It now carries the condition that a window is open, as *Scope* item 8 and the two `to:` lines do.
```

## Confirmations

```seal
confirms: round-1#1
```
What holds: `gaps.md:28` now says that the commit of a renamed branch's `routing.md` is not tried again. It says what happens where a session or a chain works, where the commit fails, and where it is ended, and that nothing in the window says so. Each clause matches `daemon.ts:2970-2982`. The commit returns where `this.chains.has(id) || this.works(id)`, and the `catch` logs "the renamed branch's routing was not committed: " with the error and ends (`read`). The search for the callers of `commitPaths` and `commitRecords` showed that no stage passes `routing.md` among its files (`stage-records.ts:184`, `:239`, `:288`, `:376`) and that the word's commit names the record alone (`daemon.ts:3122`) (`executed`). `declaredDirectory` commits a `routing.md` only where no directory names the branch (`stage-records.ts:133-147`). The paragraph says the log holds "git's words" for a commit that was ended too, where the log there holds the runner's sentence. It still says the commit is logged, which is the fact a reader acts on, so it opens no finding.

```seal
confirms: round-1#2
```
What holds: the docstring of `Daemon#commitWord` (`daemon.ts:2954-2969`) and its comment (`:2973`) are now the paste-ready text. Each statement holds against the same reads as round 1's confirmation above. The other statement of who carries a file left written, the comment at `daemon.ts:3115`, is about the record, which a stage's commit holds, so it stands (`read`).

```seal
confirms: round-1#4
```
What holds: two cases stand in `describe("the commit of a person's word")`, one for the record's text (`daemon.test.ts:4889-4910`) and one for the branch's head while a client is connected (`:4912-4929`). Each first expects no commit across 300 ms of turns after the hook is gone. So only the change that follows can make the try due. The round re-ran round 1's probe with both conditions taken out of `passWords` (`daemon.ts:3171`). The record's case failed at its wait for the commit (`:4907`), and the head's case at its wait for the third commit (`:4926`) (`executed`, see `## Probes`). Each case's run changes only its own condition. The record's case moves no head, because the hook refused the only commit. The head's case leaves the record as it failed. So the combined break reads as each guard broken alone, and the fix pass's own red under `seal mutate` (round 1's close) agrees. The 300 ms wait is a fixed sleep. `frame/plan.md:21` forbids sleeps of the default limits, and this is none.

```seal
confirms: round-1#5
```
What holds: the case "commits a word left for a working pane once the pane's process exits while the pane still says it is working" (`daemon.test.ts:4931-4948`) is the paste-ready case, with its comment on the state the exit leaves. In the same probe run, `works` without `info.alive &&` failed the case at its wait for the commit (`:4945`) (`executed`).

What matched: the three new cases cover nothing the group already covered. Under the probe's breaks, the other 26 cases the filter selected passed, so only the three new cases fail when their guards go (`executed`). The test files declare no `TARGET` of `seal layout`, so no duplicate check names a pair. At `8ac53e0f`, without the breaks, `test/daemon.test.ts` passed whole (`executed`, exit 0, 395 cases).

What matched: the fold `8ac53e0f` makes `frame/plan.md:20` say "an interrupted pane", as `trail/phases/phase-2.md:8` does. The case it names stands at `daemon.test.ts:4798`, and its form at `9f9ba1da` was "commits a word given once the person interrupted the turn of the work item's working pane" (`git show 9f9ba1da:apps/desktop/test/daemon.test.ts`, `executed`).

What matched: `fdcf071c` adds close blocks to `trail/rounds/round-1.md` alone, and each `fixed` commit it names touches a path its finding's `location:` names (`git diff --stat` of each, `executed`). `changelog.md` needs no change, since no fix changes what the work item ships. Its line 9 already carries the condition of finding 2 (`read`).

## Not judged

| What | Location | Who answers |
|---|---|---|
| The value of `COMMIT_LIMIT_MS`, five minutes (Q1) | `seal/threads/1795653550-150-the-persons-word-is-committed-in-time-and-retried/frame/questions.md` | the owner |
| A real `gpg` or `ssh` signer at the limit (Q2) | `seal/threads/1795653550-150-the-persons-word-is-committed-in-time-and-retried/gaps.md` row 7 | the owner, in the running app |
| The full suite, the typecheck and the broad gate, `unverified` | the repository | the orchestrator, after the rounds |
| The narrow set beyond `test/daemon.test.ts` that the fix pass reports, 654 cases over six files, which this round did not run again | `apps/desktop/test/` | the orchestrator's broad run |
| The built-app files and the screenshot run | `apps/desktop/test/decisions-and-questions.test.ts`, `apps/desktop/test/screenshots.test.ts` | the orchestrator's broad run |

## Probes

| Command | Result |
|---|---|
| `pnpm install --frozen-lockfile` in the clone, through the machine's lock | exit 0 |
| `node scripts/test-in-electron.mjs test/daemon.test.ts` in `apps/desktop` of the clone at `8ac53e0f`, through the machine's lock | exit 0: 1 file, 395 cases passed |
| `node scripts/test-in-electron.mjs test/daemon.test.ts -t "the commit of a person's word"` in `apps/desktop` of the clone, through the machine's lock. Two edits of `daemon.ts`, round 1's probe again: `passWords` at `:3171` without the record's text and the branch's head among its conditions, and `works` at `:3188` without `info.alive &&` | exit 1: 3 cases failed, 26 passed, 366 skipped. The failures were the record's case at `daemon.test.ts:4907`, the head's case at `:4926` and the exited pane's case at `:4945`, each in `until` waiting for the commit. `git checkout -- apps/desktop/src/daemon/daemon.ts` then restored the file, and `git status --short` printed nothing |
