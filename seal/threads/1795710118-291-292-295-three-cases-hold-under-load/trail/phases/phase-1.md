# Phase 1: 1795710118-291-292-295-three-cases-hold-under-load

## What this phase found

**The frame is the three issues, and each held against the tree at `c80b900a` (read).** Each issue's cause is what the code does. #291: a read of the counts is one promise, `readingCommits` in `apps/desktop/src/daemon/daemon.ts`. Its timer starts no read once no client is connected (`scheduleCommitRead`), but a read already under way runs to its end, and a work item with no branch runs `headCounts`, `headStands` and `baseDistance` in series, each with its `git rev-list`. #292: `readBranch` hands a work item with no branch to `branchUp`, which runs on `this.changing`, a turn of its own. So the read's inbox, which carries the count, can go out before the branch is made. #295: the case ran fourteen sealed chains in series, each with a round, a gate and a seal before its pull request stage, and took 53 s alone on this Mac (executed, before any change).

**#291: the case waits for the read under way to end, read from the daemon's own fields.** After the client's close, the case waits until the daemon's `clients` map is empty, then awaits `readingCommits`. Once no client is connected, no read can begin: `readCommitsNow` has two callers, a hello, which needs a client, and the timer, which returns while `clients` is empty (read). So the read the case awaited is the last one before its count. The fixed 100 ms is gone. The daemon exposes no promise and sends no message when a read ends, so the case reads its private fields by name in brackets, `d["clients"]` and `d["readingCommits"]`, which the typecheck checks against the `Daemon` class. A rename of either field then fails the typecheck. A cast through `unknown` would not: a renamed `readingCommits` would read as `undefined`, and the case would wait for nothing (round 1, finding 1). Making the promise public would be a product change, which the spawn excluded. Judged against the issue's *Done when* ("a promise the daemon exposes, or the count settling") and the spawn's rule that a product change stops the work. A read of a private field by name is not a change to the product.

**#292: the case reads the disk once the work item's branch is made.** It now waits for an inbox with `newCommits === 1` and `branch === "owlery/runs-a-pane"`. `branchUp` broadcasts that inbox once it has stored the branch (read). After that, nothing the daemon does by itself writes to the repository or the worktree: later reads of a branched work item only read. Of the issue's two choices, making no commit in the worktree was rejected. The case's name says the next work item gets "a count the removed one did not bear", and that count is the commit's. The case now asserts more than before. `before` always holds the branch, so a removal that touched the branch fails it, where the old case, in its runs that read before the branch was made, could not see that.

**#295: the case is split into six cases by kind of failure, and no bound changed.** The issue offered a shorter bound for a `gh` that never ends. That bound costs only the two hanging shapes about 2 s and 4 s (the signal, then the kill 2 s later) out of the case's 53 s, so it was not the cause. The helper `failing` moved to the head of the describe block with its code unchanged. Its doc comment was rewritten to list what the helper asserts, where the old one said it gave the chain, the head and the calls gh had, which it never returned. The fourteen calls and every assertion went into six cases: no gh on the path; gh that fails at the list and at the create, with the rerun after `create` once gh answers; the push failures; the lists the stage does not take; the answers that do not read; and gh that never ends. A sort of the old case's statements against the new cases' statements, indentation stripped and the new `it` lines and comments left out, shows no difference (executed, `diff` in the scratch directory). The issue says "eight stand-in `gh`s"; the case ran fourteen chains, ten of them with a `gh` answer arranged (read).

**Each case still fails at its fault (executed, `seal mutate`, at `8981dc93`).**

| Case | Mutation | Failing line |
|---|---|---|
| #291 inbox | `if (this.clients.size === 0) return;` in `scheduleCommitRead` to `if (false) return;` | `expect(watched.calls("rev-list")).toBe(0)`, received 4 |
| #292 removal | after `this.dropWorkItems(ids)`, remove each work item's branch ref | `expect(onDisk(...)).toEqual(before)`, the `refs/heads/owlery/runs-a-pane` line missing |
| #292 removal | after `this.dropWorkItems(ids)`, write `touched.txt` into each worktree | red, same case (batch run, line not printed) |
| #295 no gh | `if (found === null) throw` (no gh stands) to `if (found === null && false) throw` | `failing`'s `says` match, `chain.test.ts:3524` |
| #295 list, create | `whyFailed` takes the line from `ended.out` alone | `says` match, `chain.test.ts:3529` |
| #295 push | `pushBranch` throws `why` in place of `git push to … failed: <line>` | `says` match, `chain.test.ts:3542` |
| #295 listed | `if (listed.length > 1) throw` to `> 2` | the wait for `stopped` timed out on a rested chain with pull request #1, `chain.test.ts:3569` |
| #295 unread | `if (!Array.isArray(value)) throw` (gh pr list) to `if (false) throw` | `says` match, `chain.test.ts:3578` |
| #295 never ends | `if (ended.stopped) return` to `if (false) return` | `says` match, `chain.test.ts:3587` |

**The old cases fail as the issues say once the daemon is slowed, and the new ones hold (executed, a probe).** A copy of the old `daemon.test.ts` ran as `test/test_tmp_old-daemon.test.ts`, and the probe file was then removed. First, 300 ms was added at the start of `readCommits`, standing in for a slow read. The old inbox case failed at `rev-list` with 4 and the new one passed. Second, 300 ms was added at the start of `branchUp`'s turn. The old removal case failed with `- detached` / `+ branch refs/heads/owlery/runs-a-pane`, the failure #292 quotes, and the new one passed. `seal mutate` called both new runs `SURVIVED`, which is the result wanted here: neither delay changes what the daemon does.

**Under load (executed, 2026-11-27).** Eight `yes` loops ran on this Mac's 10 cores beside the runs below, and the load average rose from 5.4 to 59.9. Two loops each ran the two daemon cases six times in parallel with a third loop, which ran the old cases, and two loops each ran the six chain cases twice.

| Case | Passes | Time |
|---|---|---|
| #291 inbox, new | 12 of 12 | 1.9 s to 2.7 s |
| #292 removal, new | 12 of 12 | 2.1 s to 2.9 s |
| #291 inbox, old | 0 of 6: `expected 1 to be +0` three times, `expected 3 to be +0` three times | |
| #292 removal, old | 5 of 6: one failure on the worktree's line | |
| #295, the six cases | 24 of 24: each case 4 times | 5.7 s to 22.0 s; the longest, "an answer of gh does not read", 20.5 s to 22.0 s |

Under that load the six chain cases took 104 s to 108 s in all, in each of the four runs, so the old single case would have run past its 60 s limit. The longest split case used about 37 percent of that limit. After its first minute, the load average stayed between 37 and 60 until the chain runs ended (`uptime` every 10 s).

**The rule changes nothing in `docs/`.** No document states these cases' waits. `git grep` for the old case name of #295 and its phrases found it nowhere outside `chain.test.ts` (executed).
