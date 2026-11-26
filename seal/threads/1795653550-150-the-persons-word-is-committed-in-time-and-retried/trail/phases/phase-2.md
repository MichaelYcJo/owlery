# Phase 2: 1795653550-150-the-persons-word-is-committed-in-time-and-retried

## What this phase found

**The frame holds for this phase, but for one constraint.** Each coordinate of `frame/plan.md` *Technical context* that phase 2 builds on was opened at `4afe42b1` before the first edit: `Daemon#commitWord`, `#personWrote`, `#works`, `#inWorktree`, `#close`, `#readCommits`, `#scheduleCommitRead` and `#checkIdle`, `stage-records.ts#commitRecords` and `#declaredDirectory`, and `worktrees.ts#fileAt`. Each stands where the frame says, within a few lines. The constraint that does not hold is *Technical context* **Constraints**, which says each existing case of `describe("the commit of a person's word")` stays green without an edit. Four needed one, for the reasons below. Judged against *Scope* item 7, which makes the subject from what is owed, and item 8, which has the pass commit a word once its session ends.

- "makes the commits of one worktree one after another" now expects `chore: record the person's word` as the subject of the commit that carries reversals 2 and 3 together. *Scope* item 7 gives that subject to anything but one reversal alone or answers alone. The old case expected the subject of the reversal that asked for the commit.
- The case of a headless session and a pane, and the case of an interrupted pane, both expected the next word's commit to carry the word left before it. The pass now commits the left word within a turn of the session's end, so both cases were rewritten into scenario I. Each now ends the session and waits for the commit with no word sent after.
- The case of a `pre-commit` hook that exits 1 grew into scenario K. It keeps its old checks and adds `wordOwed`, the removal of the hook and the commit after it.

**`wordOwed` is null while a word's first try is due or under way.** *Scope* item 9 says the field is null where nothing is owed, and otherwise `session` or `retry`. A word that is owed, with no session working and no failed try yet, waits for neither of those. That state lasts while the try runs and while an earlier commit of the worktree holds the turn. The field is null there, and the docstring of `WorkItem.wordOwed` in `protocol.ts` says so. A word that failed keeps `retry` with the last reason while it is tried again, until a try commits it. Where a session works and a try has failed, the field says `session`, since that is what the next try waits for. Judged against *Scope* items 9 and 10.

**A stage's commit takes the daemon's bounds through its `Place`, so `chain-command.ts` is not changed.** *Data & interfaces* says `commitRecords` takes the bounds and hands them to `commitPaths`. `Place` gained an optional `bounds`, which `commitRecords` hands on, and `declaredDirectory` gained a last, optional `bounds` parameter. The daemon's `placeOf` and `chainDirectory` give the limit of its options and the close's signal. The chain command builds its places without bounds, so its commits keep the default limit and take no signal, as before. No call of the chain command changed. Judged against *Data & interfaces* and `frame/plan.md` *Overlap with the release*, the row of #246.

**The read of the records arms the pass and tries nothing itself.** The first build had `readCommits` try an owed word at once, beside the pass. `seal mutate` showed that taking out that try left every case green (mutant 13 below): the pass that `readOwed` arms commits the word at its next turn, which scenario L waits for. `b1308383` removed the try. The break of the arming then turned scenario L red. Judged against `skills/core/SKILL.md` *The rule a mechanism is kept against*.

**The pass runs no git, so a new head is seen where the records were read.** *Scope* item 8 makes the next try due at once where the record's text or the branch's head changes. The pass reads the record's file each turn and compares the branch's head that `readBranch` last read. `readBranch` runs only while a client is connected. With no window open, a commit made on the branch by hand makes a failed word due only at its next wait's end, or at the next change of the record. Judged against `frame/plan.md` *Alternatives considered*, the row of the timer, which says a turn runs no git.

**A try asks git whatever the reading before it gave, and a turn of the pass tries no word a session holds.** *Scope* item 6 says the daemon asks git for the committed text only where the record's text or the branch's head changed since it last asked. That holds at the read of the records. A try reads what is owed afresh before its commit and after it (`Daemon#commitOwed`), since the commit it makes, or one made by hand, changes the head without the daemon reading it. *Scope* item 8 says a word that waits for a session is tried at each turn. A turn finds the session at work in memory and tries nothing. The first turn that finds it ended tries the word, which keeps the item's bound of one turn after the session's end. Judged against *Scope* items 6 and 8 and `frame/plan.md` *Alternatives considered*, the row of the timer.

**Decisions settled while writing the code.**

- A word just written has a try of its own after a try already under way (`tryWord(held, true)`), so a word written during a commit is committed after it, as the case of the commits one after another pins. A try that is queued and has not begun stands for any later one.
- A commit the close ended records no failure and writes no log line. The next daemon finds the word in the tree.
- The renamed branch's commit of `routing.md` keeps its old path in `commitWord`, with the daemon's bounds, and is not tried again, as *Scope* says out of scope.
- The daemon gives its `commitLimitMs` to the setup of the records place too.
- `failedWhy` gives "git said nothing" where a failed commit printed nothing. No case reaches it.
- `watchedGit` of `daemon.test.ts` now notes each run's arguments whole, so scenario M can see that no `git show` named the record. `calls` still counts by the first argument.

**Scenario P's second half has no case.** The look keeps no `wordOwed`, which the case of `test/last-look.test.ts` pins. That the field is no change since the look holds because `view.ts#changeOf` reads no `wordOwed` at all. A case of it would pass with or without the field, so it pins no guard (contract rule 15). `gaps.md` carries it.

**Seen red.** Each guard was broken alone with `seal mutate` over the committed tree, `cf01d7cf` or `b1308383`, which differ only in `Daemon#readOwedAt` (`executed`). The first sixteen breaks of `daemon.ts` ran at `cf01d7cf`, and the break of the arming at `b1308383`. The daemon's breaks ran the cases of `describe("the commit of a person's word")` with `--bail=1`, which prints the verdict alone. So their third column names the case each break was aimed at, and the failing line was read only for the runs of one case.

| File | Break | Case aimed at | Verdict |
|---|---|---|---|
| `daemon.ts` | one reversal alone does not name its decision | scenario I | red |
| `daemon.ts` | anything else is named the answers | scenario N | red |
| `daemon.ts` | the reason keeps its period | scenario K | red |
| `daemon.ts` | the close fires no signal | scenario H | red |
| `daemon.ts` | the close waits no time | scenario H | red |
| `daemon.ts` | the daemon gives no limit | scenario G | red |
| `daemon.ts` | a working session holds no word | scenario I | red |
| `daemon.ts` | `wordOwed` never names the chain | scenario I, the chain | red |
| `daemon.ts` | `wordOwed` never names a session | scenario I | red |
| `daemon.ts` | the wait after a failure never ends | scenario K | red |
| `daemon.ts` | the wait does not double | scenario K, the doubling | red |
| `daemon.ts` | every failed try is logged | scenario K | red |
| `daemon.ts` | the read of the records tries nothing | scenario L | SURVIVED, then removed |
| `daemon.ts` | a commit the close ended is logged | scenario H | red |
| `daemon.ts` | a word just written takes no turn of its own | the commits one after another | red |
| `daemon.ts` | `wordOwed` never names a retry | scenario K | red |
| `daemon.ts` | the read of the records arms no pass | scenario L | red |
| `daemon.ts` | git is asked for any record | scenario M | red, at `watched.noted()` naming the record |
| `decision-record.ts` | a reversal the commit holds is still owed | the cases of the pure function | red |
| `decision-record.ts` | an answer the commit holds is still owed | the cases of the pure function | red |
| `decision-record.ts` | any decision is owed | the cases of the pure function | red |
| `decision-record.ts` | any question is owed | the cases of the pure function | red |
| `decision-record.ts` | a reversal is no word of the person's (`holdsWords`) | scenario I | red |
| `decision-record.ts` | an answer is no word of the person's (`holdsWords`) | the group | SURVIVED |
| `decision-record.ts` | the same break | `test/chain.test.ts`, "parks the work item where the orchestrator cannot decide a sealer's question" | red, at the chain's list of stages |
| `decision-record.ts` | a reversal the commit holds is still owed | scenario J | red, at `watched.calls("add")` |
| `last-look.ts` | the look keeps the lists' work items whole | scenario P | red, at the file's text naming `wordOwed` |

The break of `holdsWords`'s answers survived the group: each record of the group that holds an answer also holds a reversal. The case of `test/chain.test.ts` answers a parked chain's question alone, and it went red, so the phase adds no case for it. The mutants that each guard leaves to a second one, and the units no case ends, are in `gaps.md`.

**The phase boundary.** The *Verified by* cell names `test/daemon.test.ts`, `test/decision-record.test.ts`, `test/last-look.test.ts` and `test/chain.test.ts`. `skills/verify/SKILL.md` *Scope: cheap and often, broad and once* also asks for each test file that reads a changed path. Read as the files that import `daemon.ts`, `decision-record.ts` or `last-look.ts`, that adds `test/accounts.test.ts`, `test/gate.test.ts`, `test/chain-command.test.ts`, `test/record-writer.test.ts` and `test/seal-state.test.ts`. No test file imports `stage-records.ts`. The nine files ran in one command through the repository's runner.

- The first run, at `b1308383`, failed two cases of `describe("the last look")` in `test/daemon.test.ts` (`executed`, exit 1): its `asLooked` kept the new `wordOwed`, which the look drops. `8e53dd8a` drops it there too.
- The second run, at `8e53dd8a`, passed every case of the nine files (`executed`, exit 0, 744 cases).
- The built-app file `test/decisions-and-questions.test.ts` then ran alone with `OWLERY_BACKGROUND=1` at `8e53dd8a`, and both its cases passed (`executed`, exit 0).
- `tsc --noEmit` passed at `8e53dd8a` (`executed`, exit 0).
- `c61068dd`, the phase's last commit of code, changes the docstring of `Daemon#commitOwed` alone. The read of the range found that it counted a commit the close ended among the failures. `tsc --noEmit` passed there (`executed`, exit 0), and the cases did not run again.

Three files that read a changed path did not run. `test/role-session.test.ts` imports `daemon.ts` but runs only under `OWLERY_ROLE_RUN`, which starts a real `claude`. `test/screenshots.test.ts` imports `decision-record.ts` and runs only under `OWLERY_SCREENSHOTS`; it belongs to phase 4. The other files that import `protocol.ts` read no `wordOwed`, and the field is optional, so `tsc` is what reads them (`read`).

**For phase 3.** `WorkItem.wordOwed` is `{ waits: "session" | "retry"; why: string } | null`, and the daemon sends it on every work item, `null` where nothing is owed and on an archived work item. `why` for `retry` has no period at its end, so the sentence of *Scope* item 10 adds its own. The look keeps none.
