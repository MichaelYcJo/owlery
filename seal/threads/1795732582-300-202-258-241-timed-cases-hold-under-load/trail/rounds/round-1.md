# Review round 1: 1795732582-300-202-258-241-timed-cases-hold-under-load

```seal
target: 728b98cb against 57449b14
```

This round reviewed the branch `test/300-202-258-241-timed-cases-fail-under-load` at `728b98cb` against the commit it was cut from, `57449b14` of `release/v0.0.5`. The release has since moved to `907384ae`, and the orchestrator merges that in before the broad gate, so this round read nothing of #133's diff. It worked in the branch's worktree, which already held the patched install, and wrote its probe and its captured output under its own scratch directory. No earlier round exists, so nothing was carried. Every verdict below was reached at this target.

The routing names the defect to look hardest for: a case that now passes because it asserts less, a retry that hides a real failure, and, in the patch, a descriptor closed while still in use or a failed start that still leaks. The first three hold, and *Confirmations* says why. The last one does not, and it is finding 1.

## Findings

### 1. A start whose spawn fails still leaves its master pseudo-terminal open in the daemon, and `gaps.md` names only the paths that return before `done:`

```seal
severity: should
location: `patches/node-pty@1.1.0.patch`, `seal/threads/1795732582-300-202-258-241-timed-cases-hold-under-load/gaps.md:13`
evidence: executed `test_tmp_failed_start_and_drain.cjs` under Electron 45.3.3 as Node against the branch's patched `build/Release/pty.node` (see *Probes*); `git grep -n -F "done:"` and `git grep -n -e "still leak" -e "posix_spawnp failed"` over the work item's directory at HEAD; read node-pty 1.1.0 patched `src/unix/pty.cc:370-374`, `:707`, `:753-790`, and node-pty 1.2.0-beta.18 `src/unix/pty.cc`, the lines after `pty_posix_spawn(` in `PtyFork`
```

Why it matters: the claim is in `gaps.md:13`. It says "the patch closes the slave and the spare terminals at `done:` alone", and that the paths that leak are the ones that "return before the spawn". So it reads as if every path through `done:` now leaves nothing open. The code does otherwise. `posix_spawn` can fail after the master is open, for example with `ENOENT` or `EACCES` where the spawn helper is missing or not executable, or with `EAGAIN` at the user's process limit. That path reaches `done:` with `*err != 0`. The patch closes the slave and the spares there. But the master stays open. Its caller `PtyFork` (`pty.cc:370-374`) then throws `posix_spawnp failed.` and drops the master's number without closing it. The probe called the native `fork` five times with a spawn helper that does not exist. Each call threw `posix_spawnp failed.`, and the process was left with five new `/dev/ptmx` descriptors, `17` to `21`, which it still held after forty later sessions had ended. node-pty 1.2.0-beta.18, which `frame/design.md` *Scope* item 1 names as the model, closes it in `PtyFork`: `if (!err.empty()) { if (master != -1) { close(master); } throw ... }`.

The leak is older than this work. Unpatched, the same failed start left the master, the slave and the spare open. So this is no regression, and the patch cuts the cost from three descriptors to one. But a daemon that meets a broken spawn helper, or the process limit, loses one pseudo-terminal of the machine's 511 for each start a person retries. That is the failure #300 is about, on the one path where a start fails. The same close in `PtyFork` also takes the master off the early-return paths `gaps.md:13` names, which leaves only the spare open there.

The search for statements of this fact printed `gaps.md:13` and `trail/phases/phase-1.md:9`. The phase record's sentence, "The paths that return before `done:` still leak", is true but leaves out the master on the `done:` path. The phase record is the crafter's account of a past phase, so the fix pass owes no rewrite of it. A search on these words is a sample, and a statement of the fact in other words would escape it. *Scope* item 1 says "The patch changes `src/unix/pty.cc#pty_posix_spawn` alone", so the fix below goes beyond the frame's letter. The fix pass either takes it, says so as a departure in its account, and has the framer fold *Scope* item 1, or keeps the patch as it is and rewrites `gaps.md:13`. Both repairs are below.

The repair to the patch. Make it with `pnpm patch node-pty@1.1.0` and `pnpm patch-commit`, so the patch's hash in `pnpm-lock.yaml` moves with it. The precondition: `pty_posix_spawn` assigns `*master = posix_openpt(O_RDWR)` (`pty.cc:707`) before its first `return` or `goto`, so `master` is never read before it is set.

```diff
   int err = -1;
   pty_posix_spawn(argv, env, term, &winp, &master, &pid, &err);
   if (err != 0) {
+    // The start failed: no process holds the master, so nothing else closes it.
+    // pty_posix_spawn sets it before any return, to -1 where it failed to open.
+    if (master != -1) {
+      close(master);
+    }
     throw Napi::Error::New(napiEnv, "posix_spawnp failed.");
   }
```

The case that pins it goes in `apps/desktop/test/pty.test.ts`, beside "leaves no pseudo-terminal open in this process…". It calls the module's native `fork` with a spawn helper that does not exist, as the probe did, expects the throw, and expects `terminalDescriptors()` to be what it was before. Show it red against the current patch first.

If the patch stays as it is, `gaps.md:13` reads instead:

```markdown
Phase 1: the patch closes the slave and the spare terminals at `done:`, and no path closes the master of a start that failed. Where `posix_spawn` itself fails (a spawn helper missing or not executable, or the process limit), the start reaches `done:`, the caller throws `posix_spawnp failed.`, and the master stays open in the daemon. Where `pty_posix_spawn` returns before the spawn (the master, `grantpt`, `unlockpt`, the slave's name or open, `tcsetattr` or the window size fails), the spare terminal stays open as well, and the master after it was opened, as in node-pty 1.1.0. node-pty 1.2.0-beta.18 sends every such path to `done:` after moving the setup of the spawn's file actions above the first failure, and its `PtyFork` closes the master before it throws. That is a larger patch than `frame/design.md` *Scope* item 1 asks, and the move to node-pty 1.2.0, which `frame/design.md` *Scope* puts out of scope, brings it.
```

## Confirmations

What matched: the patch closes nothing that is still in use. After `posix_spawn` returns, the child holds the slave as its descriptors 0 to 2, and the spawn's file actions close the parent's copies in the child (`pty.cc:746-750`). Nothing in the parent reads `slave` or a spare after `done:`. `PtyFork` goes on with `master` alone (`pty.cc:375`), and node-pty's process-title read and resize both take the master's descriptor (`lib/unixTerminal.js`, `this._fd`). The bound `i < 3` keeps the loop inside `low_fds`, and the `-1` guard skips a failed open (read: `pty.cc:694-701`, `:777-790`). One comment in the patch is wrong: "`count` reaches 3 only where every open failed". `count` also reaches 3 where descriptors 0 and 1 were free and the third open failed, since the loop keeps any result below 2. The code's guard covers that case, so the error is in the comment alone, and the fix pass can correct it when it makes the patch again. Read.

What matched: closing the slave in the parent changes when node-pty's socket closes, and no output is lost to it. Before the patch, the parent's copy of the slave kept the master from ever reading end of file. So every exit waited out node-pty's `DESTROY_SOCKET_TIMEOUT_MS` of 200 ms (`lib/unixTerminal.js:35`, `:65-89`) and then destroyed the socket. With the patch, the socket closes once the output has been read to its end. In the probe, forty sessions printed `seq 1 5000` and exited, and every one of them had line 5000 in its output when its exit came. Executed, *Probes*.

What matched: the pty case holds what *Scope* item 2 asks, and it measures its own process alone. Vitest 4.1.12 runs each file of the unit project in a child process of its own (`pool` is not set in `apps/desktop/vitest.config.ts`, so it keeps its default, `forks`), so `lsof -p process.pid` lists no other file's terminals. Its 3-second poll waits for the master to close after the exit, and it fails on the list where anything is left. Phase 1's red form and its two mutations each name the descriptor kind their removed close would leave, `/dev/ptmx` or `(revoked)` (`trail/phases/phase-1.md:13-15`). Read.

What matched: neither fetch case asserts less, and the retry hides no failure of the product (`worktrees.test.ts:549-569`, `daemon.test.ts:1340-1369`). Each attempt asserts what the old case asserted of a fetch given up: the result with its wait's sentence, the elapsed time under twice that wait, and no lock (in the daemon's case, the order of the messages and the `baseFetched` answer). The loop stops at the first attempt whose stand-in recorded a start. After the loop the case asserts one start and its end, so a run where git never starts its transport still fails. Retrying cannot hide the faults the stand-in's end guards. A give-up that signals git alone leaves the stand-in running in every attempt that started it, so `ended` fails. A creation that starts a fetch of its own records two starts in one attempt, so `toHaveLength(1)` fails. Each of these failed its case under `seal mutate`, by `trail/phases/phase-2.md:15-16`, and reading the cases agrees. The one fact the old case pinned and the new one does not is that git starts its transport within 2 seconds. That is the load-bound fact #202 is about, and nothing the product promises (`frame/plan.md` *Alternatives considered*, the rows on #202). The product's message renders `6000` and `18_000` as "6 seconds" and "18 seconds" (`worktrees.ts:322`), as the cases expect. Executed: both cases passed in this round's run (*Probes*).

What matched: #258's case asserts the same events as before, `errorOutput: "still here\n"` among them, and its 10-second bound stays (`claude-adapter.test.ts:915-929`). Moving the text before the first line moves no part of the adapter's contract. The adapter collects `stderr` until `close`, or until 300 ms after the exit (`claude.ts:494-520`), and the stand-in's `exec sleep 30` leaves no child holding a stream. So `close` comes once both pipes reach end of file. The helper's new `before` parameter is used by that `it.each` alone, and its comment says why the order matters. Executed (*Probes*) and read.

What matched: *Scope* item 6 reached the whole class in `describe("the inbox")`. A Python pass over the block's cases at HEAD listed each case that calls `expect(inboxes(`, and whether it sets `readyWaitMs`. Thirteen cases (fourteen with the `it.each`) compare the inboxes and set the option, which matches phase 2's account. Three compare them and do not. "closes a pane…" (`daemon.test.ts:3612`) compares only the last inbox (`inboxes(c).at(-1)`). "asks git for a branch's log and diff…" (`:3765`) and "sends no inbox while the counts stay as they were" (`:3978`) say hello to a daemon whose store is empty, and their work item comes after `ready`. So the default wait leaves none of the three open to the extra inbox. Executed, the listing; read, the three cases. `gaps.md:15` names the cases outside the block as a sample, and its default stands.

What matched: *Scope* item 7. The comments at `client#until` (`daemon.test.ts:90-92`) and `holdingShell#launches` (`:8754-8756`) say the 5 seconds is a give-up, and they give 278 ms and 485 ms with the date, which are the longest polls in `trail/phases/phase-2.md:28-29`. They also say "load average up to 15". The phase record gives 16.8 as the highest reading of any command, and it does not say which command each reading came from. This round cannot tell whether the group's own commands stayed under 15. A comment of a case is read by its next editor, so this is no finding.

What matched: the records against the code at the target. Each coordinate `frame/design.md` *Scope* gives stands at HEAD under the name it gives. The line numbers of *Scope* item 6 (`:3848`, `:3977`, `:4097`) point to where those cases stood at the framer's commit, and the option stands in those cases at HEAD. The fold of phase 1 (`2d8b6cb3`) and the fold of phase 2 (`728b98cb`) agree with the phase records they cite. No other work item of the release changes `docs/architecture.md` *Overall layout* with anything but its own `add` (executed: `git grep -n -F "Overall layout"` and `git grep -n -F "전체 구성"` over `seal/threads/*/frame/design.md`). Read, except as marked.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The suite, the repository-wide lint and the typecheck, `unverified`. This round ran only the narrow commands under *Probes*. | `seal/config.json` `Broad gate` | the orchestrator, at the broad gate |
| Whether the hosted runner's and the packaging job's `pnpm install --frozen-lockfile` compile the patched `pty.cc`, and whether the packaged app loads `build/Release/pty.node` and not the unpatched prebuilt binary. Only a run on those machines shows it. | `frame/questions.md` Q1 and Q3, `gaps.md:7-9` | the orchestrator, from the pull request's `check` job and the next run of `.github/workflows/package.yml` |
| Whether the account-change group passes in a whole run of the suite beside another test run, now that the leak is gone. | `frame/questions.md` Q1, `gaps.md:8` | the orchestrator, at this work item's broad gate and at the gates of #132, #257 and #127 |
| Phase 2's runs with a slowed `git` and a slowed `Daemon#readCommits`, its `seal mutate` runs, and its three runs beside eight `yes` loops. This round read the cases against each named fault and ran none of these again. | `trail/phases/phase-2.md:13-38` | the crafter's executed account, which the sealer reads |

## Probes

| Command | Result |
|---|---|
| `sh <scratchpad>/heavy.sh <electron> <scratch>/round-1/test_tmp_failed_start_and_drain.cjs <worktree>`, with `ELECTRON_RUN_AS_NODE=1`, run once | five native `fork` calls with the spawn helper `/nonexistent/spawn-helper` each threw `posix_spawnp failed.`, and five new descriptors `17 /dev/ptmx` to `21 /dev/ptmx` stayed open; 40 of 40 sessions of `seq 1 5000` held line 5000 at their exit; the five descriptors were still open at the end |
| `cd apps/desktop && OWLERY_BACKGROUND=1 sh <scratchpad>/heavy.sh node scripts/test-in-electron.mjs test/pty.test.ts test/claude-adapter.test.ts` | exit 0: 2 files, 113 cases passed, 14 of `pty.test.ts` and 99 of `claude-adapter.test.ts`, the counts the phase records give; 43.5 s |
| `cd apps/desktop && OWLERY_BACKGROUND=1 sh <scratchpad>/heavy.sh node scripts/test-in-electron.mjs test/worktrees.test.ts test/daemon.test.ts -t "gives up a remote that does not answer within the wait\|has a creation join the fetch of its base\|the inbox"` | exit 0: 2 files, 73 cases passed and 460 skipped, the two fetch cases and `describe("the inbox")` among those passed; 54.6 s, with no other test run beside it |
