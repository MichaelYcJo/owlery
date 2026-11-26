# Phase 2: 1795732582-300-202-258-241-timed-cases-hold-under-load

## What this phase found

**The frame holds for *Scope* items 3 to 8.** Each path, case name and line the frame gives for those items stood in the tree at `2d8b6cb3`. The decisions below fill in what the items leave open, and one reaches past the letter of item 6.

**The fetch cases wait twice an attempt's wait, and state a limit of 60 seconds.** *Scope* items 3 and 4 run the fetch with waits of 2, 6 and 18 seconds and stop at the first attempt whose stand-in recorded a start. The old case allowed 4 seconds for a wait of 2, so each attempt is allowed twice its wait. The three waits come to 26 seconds and the three allowances to 52, so each case states a limit of 60 seconds. The case of `worktrees.test.ts` runs every attempt in one clone, since item 3 asks for no clone of its own and a fetch that was given up leaves no lock, which each attempt asserts. The daemon's case gives each attempt a clone and a daemon of its own, as item 4 asks. It waits for `baseFetched` with the client's `until` at twice the attempt's wait, because `message` gives up at 5 seconds, which the waits of 6 and 18 seconds pass. Both cases assert one start and its end after the loop, so a run where no attempt started the stand-in fails on `toHaveLength(1)`. Judged against `frame/design.md` *Scope* items 3 and 4 and `frame/plan.md` *Alternatives considered*, the row that rejects `started().length <= 1`.

**The helper `launch` of `claude-adapter.test.ts` gained a parameter for what the script does before its lines.** `frame/plan.md` *Technical context* notes that `then` was the only place a case could add a command. The helper now takes `before`, a list of commands the script runs before it prints its lines, and its comment says why the order matters (*Scope* item 5, and the failure scenario of the chosen row of *Alternatives considered*). Only #258's `it.each` passes it. The expected events are unchanged, `errorOutput: "still here\n"` among them.

**Item 6 reached a case whose store lists no work item when its daemon starts.** The case "reads the counts between two hellos at most once per interval, and tells the other clients, in an inbox, of a count a hello's read changed" compares `inboxes(first)` with a whole list. Its first client creates the work item, and its second client's hello comes while the store lists it. Where that hello's read outlasts 500 ms, `ready` carries the old count and the read's inbox follows, and the case fails. The slowed read below showed it: the old form failed and the new held. So it was given `readyWaitMs: 5000` with the twelve cases that start from `daemonWithWorkItem`. The cases that compare a whole list and whose only hello comes before any work item exists were left as they were, since no hello of theirs reads a work item. Judged against `frame/design.md` *Grounding*, the row of #241 row 1795342001, which names the cause as a hello whose first read outlasts its wait.

**Seen red: each mutation of *User scenarios & acceptance* failed its case.** `seal mutate` ran each through the machine's lock, after the commit of the case changes:

- `worktrees.ts#askRemote`'s `giveUp` signalling git alone (`process.kill(child.pid, "SIGTERM")`): red, the fetch case failed on `expect(await ended(standIn.started())).toBe(true)`.
- `BaseFetches#fetch` without `if (joined !== undefined) return joined;`: red, the daemon's case failed on `expect(started).toHaveLength(1)` with two stand-ins started.
- `claude.ts`'s `exit` event carrying `""` where the launch was refused: red, both rows of #258's `it.each` failed on the events' `errorOutput`, `""` where `"still here\n"` was expected.

**A `git` that sleeps 3 seconds before a `fetch` fails the old fetch cases and not the new.** The `git` stood first on the runner's `PATH`, and each old case ran from a copy of the file at `2d8b6cb3` named `test_tmp_*`, beside the file as changed. Both old cases failed on `expect(standIn.started()).toHaveLength(1)` with no start recorded. Both new cases passed in their second attempt, in 8.9 and 9.0 seconds. The copies were removed afterwards.

**700 ms at the start of `Daemon#readCommits` fails the old inbox cases and not the new.** `seal mutate` wrote the delay. Alone, the old form of "lists a pane that sent no event in the time after its start…" failed on its list of inboxes, which held one more inbox before the pane's. Then the fourteen changed cases (the `it.each` counts two) ran old and new under the same delay: all fourteen new forms passed, and thirteen old forms failed. The old form of "sends an inbox when the state changes, and none for an event that leaves it as it was" passed in that run, because its compare runs as soon as the `finished` inbox arrives, before the read's inbox did. It stays in the class: its list fails wherever the read's inbox arrives before that compare.

**Under load, every case held and no wait came near its bound.** Each run was one command through the machine's lock, and the command started eight `yes` loops once it held the lock and ended them by their PIDs when it ended. The yes loops therefore loaded no other agent's run. The machine has 12 cores. The one-minute load average, read 2 seconds after the loops started, was 2.9 and 5.3 at the first run's first two commands, since it lags the loops, and 9.2 or more at every later one. The highest reading, at a command's end, was 16.8. The group's run 1 was the first command, so its times stand beside eight busy loops and a load average that had not yet risen. The account-change group (`-t "account|changed pane|refuses a change whose pane"`, eleven cases) ran twice in each run: from a copy named `test_tmp_*` that wrote each poll's time to a file, and from the file itself with the changed cases. The copy was removed afterwards. Times of three runs, 2026-11-27:

| Case | Bound | Times in runs 1, 2 and 3 |
|---|---|---|
| The account-change group, its longest case | 20 s, the unit project's | 2.5, 2.5, 2.5 s, eleven of eleven passing each time |
| The group's `client#until`, its longest poll | 5 s give-up | 278, 276, 277 ms |
| The group's `holdingShell#launches`, its longest poll | 5 s give-up | 397, 485, 362 ms |
| The group's `standInShell#given`, its longest poll | 5 s give-up | 377, 296, 315 ms |
| The fetch case of `worktrees.test.ts` | 60 s | 2.5, 2.5, 2.4 s, each in its first attempt |
| The daemon's fetch case | 60 s | 2.6, 2.7, 2.6 s, each in its first attempt |
| The changed cases of `describe("the inbox")`, the longest | 20 s | 1.2, 1.3, 1.2 s |
| `claude-adapter.test.ts`, "reports the exit of a CLI whose child still holds its streams soon after the exit…" | 10 s | 1.1, 1.1, 1.1 s |
| `claude-adapter.test.ts`, the two role launch cases (the `it.each`'s two rows, then "fails a role launch whose session gives a result before…") | 10 s | 0.7 to 0.8 s each |
| `settle.test.ts`, "exits 2 where AgenticSeal's settle exits 2, any exit but 0 or 1, or no exit, …" | 20 s, the unit project's | 3.6, 4.3, 3.7 s |

`claude-adapter.test.ts` passed whole each time, 99 cases. #258's `it.each` ran thirty more times under the same load, both rows passing each time, the longest in 0.8 s. That answers #241 rows 1795398267 and 1795457209 for this load: no case came near its bound.

**`frame/questions.md` Q2 is answered: the give-ups stay at 5 seconds.** The longest poll of the group was 485 ms, under a tenth of the give-up and under the half the question names. *Scope* item 7's comments, at `client#until` and at `holdingShell#launches`, say the 5 seconds is a give-up and give those two longest polls with the date. `frame/questions.md` is not the crafter's to write, so its Status cell is named in the hand-back.

**The phase boundary set ran as two commands.** The plan names each changed case, and the test files the phase changed are `worktrees.test.ts`, `claude-adapter.test.ts` and `daemon.test.ts`. No test file reads them or the test folder, and the repository has no contribution guide naming tree-wide test files. The machine's rule runs `daemon.test.ts` with `-t` only, and `-t` would filter the other two files in the same command. So `worktrees.test.ts` and `claude-adapter.test.ts` ran whole in one command, and `daemon.test.ts` ran with `-t` over `describe("the inbox")`, the account-change group and the fetch case in the other.
