# Phase 2: 1795764399-321-the-held-session-is-held-again

## What this phase found

**No frame stands, and this phase's scope came from its spawn.** The work item is on the ladder's second rung, so `gaps.md` *Scope confirmation* stands for the plan. That line named the Held case alone. The orchestrator's broad gate at `81778dd4` (2026-11-27, this Mac) failed on a case phase 1 did not touch: `headless sessions > changes nothing at a start that fails after its session ended`, with `TypeError: rejects[0] is not a function` at `apps/desktop/test/daemon.test.ts:6681`. The spawn asked for that case and for every other case of the same cause. This phase added a sentence for them to *Scope confirmation*.

**The orchestrator's reading of the cause holds at `81778dd4`.** `Daemon#startHeadless` calls `roleAdapter.start` only once `commandsOf` resolves (`apps/desktop/src/daemon/daemon.ts:2577-2579`). `commandsOf` awaits `gitFolderOf(cwd)` (`daemon.ts:2482`), which runs `git rev-parse --path-format=absolute --git-common-dir` (`apps/desktop/src/daemon/worktrees.ts:1250-1252`), and for a proofer or a sealer it then makes the scratch folder (`daemon.ts:2489`). The daemon answers a client's `stopHeadless` with `done` before it stops anything (`daemon.ts:1696-1698`). The case's `stop(2, first)` waits for that `done` through the client's `until`, which looks once and then sleeps 20 ms (`daemon.test.ts:96-104`). Where git took longer than that, the stop's `done` arrived before the adapter's `start` had run, so `rejects` was still empty. `git log -S"this.commandsOf(session, cwd)" -- apps/desktop/src/daemon/daemon.ts` names `d323b45a` (#320, the pull request of #127's work item) alone. Before it, `startHeadless` called `roleAdapter.start` synchronously (`git show d323b45a^:apps/desktop/src/daemon/daemon.ts`, line 2492).

**The daemon is not wrong; the case was.** Judged against the docstring of `Daemon#stopHeadless` (`daemon.ts:2437-2443`), which says a stop gives nothing where the adapter is still starting and that the run is stopped once it has started, and against the comment in the rejection branch of `startHeadless`: a session that ended while its adapter was starting keeps what ended it. The fixed case asserts that, and it passed under the slowed git below. So `apps/desktop/src` is unchanged.

**Seen red, deterministically, with a probe.** `<scratch>` here stands for `<scratchpad>/1795764399-321-the-held-session-is-held-again/phase-2/`. A `git` wrapper in `<scratch>/bin/` put first on the path slept 0.4 s at the first `rev-parse --path-format=absolute --git-common-dir` of each case, which is `commandsOf`'s call alone (`git grep -n -e "git-common-dir" -e "gitFolderOf(" -- apps/desktop/src` names no other caller of that exact command). Copies of `daemon.test.ts` and `chain.test.ts` named `test_tmp_321_*.test.ts` installed it before each case. A third copy, made from `daemon.test.ts` at `81778dd4`, held the old cases for the mutation runs below. Each run went through a script in `<scratch>` that waits until no other `test-in-electron` run is going on this machine. The copies were removed afterwards. At `81778dd4`, the old cases ran in one command, and six failed, each on the line its subject holds:

- `changes nothing at a start that fails after its session ended`: `TypeError: rejects[0] is not a function` at the line that is `daemon.test.ts:6681` at `81778dd4`, the broad gate's failure.
- `waits at its close until each run it stopped has ended`: `expected +0 to be 1` at line 6443. The close found no run to wait for.
- `stops a run that starts only after the daemon closed`: `expected +0 to be 1` at line 6470, after its 300 ms pause.
- `keeps the sessions that ended last`: the client's `until` timed out at line 6604, since `finishSlow` was still the no-op the case declared.
- `reads the loss once more only after the headless runs the delete stopped have ended` (line 3010): the delete answered `done` instead of the refusal, since it found no run to wait for.
- `stays while a headless session is working, though no client is connected`: `expected +0 to be 1` at line 7217, after its fixed 600 ms.

The other two passed under the slowed git, as the next paragraph explains, and so did the chain case below.

**Two cases passed in either order, but did not test what they name where git was slow.** `enters each session still working when the daemon closes` and `goes on with a delete past a headless run whose end it waited for in vain` pass whether or not the run has started. Only a started run exercises the guard each names. Two `seal mutate` breaks of `apps/desktop/src/daemon/daemon.ts` show it, each run against the old case and the fixed case under the slowed git:

- The close stops the run before it enters the session (`if (session.info.state === "working") this.enter(session, "failed", "daemon");` replaced with `if (session.run) stops.push(session.run.stop()); if (session.info.state === "working") this.enter(session, "failed", "daemon");`). The old ledger case gave `SURVIVED`. The fixed one gave `red`, with the entry's `stopped` `null` where `"daemon"` was expected.
- The delete's wait has no bound (`await Promise.race([Promise.all([...panes.map((session) => session.exited), ...stops]), waited]);` replaced with `await Promise.all([...panes.map((session) => session.exited), ...stops]);`). The old delete case gave `SURVIVED`. The fixed one gave `red`: the delete never answered.

`seal mutate` restored the file each time, and `git diff --quiet HEAD -- apps/desktop/src` exited 0 after each run.

**What each fixed case waits on.** Each waits for the condition and not for a time. Judged against #321's *Done when* and the spawn, which asked for a fix of the cause and not a longer pause or timeout. Phase 1 judged the Held case against the same.

- In the broad gate's case, a helper `called(count)` waits until the adapter has been called `count` times, before each `stop`. The stop then always falls while the adapter's start is under way, so the case keeps one order instead of two.
- The close cases, the ledger case and the two delete cases wait for `inner.starts.length === 1`, the fake adapter's record of its start. The fake resolves its start at once, so the daemon holds the run by the time the client's next poll looks.
- `keeps the sessions that ended last` waits for `finishSlow` to be set before calling it.
- `stops a run that starts only after the daemon closed` and the idle case wait with `vi.waitFor` for the count they assert, as `holds a role session to its limit` in the same file does.
- Each wait carries a comment that the adapter is called only once git has named the repository's folder.

**Seen green.** The fixed cases ran in one command under the slowed git, from a probe copy of the cases as `dc227028` commits them: 8 passed. Then on `daemon.test.ts` itself, through the same lock, with `-t` naming the eight: `Test Files 1 passed`, `Tests 8 passed | 438 skipped`. Load averages were 3.05, 3.60 and 5.08 at the start. `pnpm exec tsc --noEmit` in `apps/desktop` exited 0 at `dc227028`.

**Mutation of units that add behaviour: none is owed.** The phase changes cases and no code of `apps/desktop/src`. The two breaks above are the evidence that the fixed cases watch what they name.

**Census of the cases that act on a role adapter's start, a sample.** It ran at `81778dd4`. It was built from the producer: the daemon calls a role adapter in two places (`git grep -n "roleAdapter.start(" -- apps/desktop/src/daemon` prints `daemon.ts:2276` and `daemon.ts:2578`). Only the second waits on `commandsOf`. The first, the account refresh's, calls the adapter at once, so the refresh cases of `accounts.test.ts` are outside the class. Then the census listed what a case can hold of a start, and where it acts on it:

```
git grep -l -E "startRoleSession|startChain\(" -- apps/desktop/test
git grep -n -E "start: *(async *)?\(|^\s+(async )?start\(" -- apps/desktop/test
git grep -n -E "function watched|seen\.(started|starts)|\.starts(\.length|\[|\.at\()" -- apps/desktop/test
git grep -n -E "(^|[^.A-Za-z])started(\[|\.length|\.map|\.at\(|\.filter|\)\.to|\)$|\);)" -- 'apps/desktop/test/*.ts'
git grep -n -A2 -E "startRoleSession\(|startChain\(" -- apps/desktop/test | grep -E "pause\(|setTimeout\("
git grep -n -A4 -E "startRoleSession\(|startChain\(" -- 'apps/desktop/test/*.ts' | grep -E "\.close\(\)|stopHeadless|removeRepository|archiveWorkItem|deleteWorkItem|removeAccount|setCaps"
git grep -n -E "state === \"working\"|\"working\"\)" -- apps/desktop/test/chain.test.ts apps/desktop/test/accounts.test.ts apps/desktop/test/pr-check.test.ts apps/desktop/test/role-session.test.ts
```

The first command named `accounts.test.ts`, `chain-run.ts`, `chain.test.ts`, `daemon-restart.test.ts`, `daemon.test.ts`, `gate.test.ts`, `pr-check.test.ts` and `role-session.test.ts`. Every hit of the others was read. The eight cases above are the ones fixed. The rest were left, each for one of these reasons:

- The case reads the start only after a message that the adapter's own events cause, such as a `finished` or `failed` that follows a result. Examples: `daemon.test.ts:6135`, `6205`, `6362` and `7167`, and the `ended()` helper of `accounts.test.ts`.
- The case reads the start after a chain has rested, stopped or parked. `runStage` awaits `session.started` before a stage ends (`daemon.ts:3897`). Examples: `chain.test.ts:1127`, `2752` and `3017`.
- The case asserts a negative that holds in either order: a stop count of 0, or no start for a session that is queued, refused or whose git fails. Examples: `daemon.test.ts:1864`, `2697`, `6232`, `6401` and `8225`.
- #127 already gave the case a wait on the start or on the count it asserts. Examples: `daemon.test.ts:1868`, `1891`, `2701`, `6157`, `6214`, `6412`, `6560` and `8320`.
- A stop, an archive or a removal acts on the session whether or not its run has started, and the case asserts nothing that depends on which. Examples: `daemon.test.ts:2971`, `6785` and `8317`, and `chain.test.ts:1043`, `1398` and `1430`.
- `chain.test.ts:1697`, `reads a chain stored running as stopped at the daemon's start`, closes the daemon while round 1's stage works and reads `started.length` after the close. It is safe because `Daemon#close` awaits `this.chains` (`daemon.ts:939`), and a chain's `runStage` awaits its stage's `session.started` (`daemon.ts:3897`). So the start has run when the close resolves. Its probe copy passed under the slowed git, in a run of its own.
- `daemon-control.test.ts` starts a daemon control and no role adapter.

The sample does not reach a case that holds a start through a helper or a variable under a name none of these patterns match, beyond `noted` in `chain-run.ts` and `accounts.test.ts`, `noting` and `watched` in `daemon.test.ts`, which were read. Nor does it reach a fixed wait placed more than two lines after a start, except in a case that also reads a start record the third or fourth command found.

**The daemon calls the adapter for a session a stop or a close already ended.** Where the stop or the close comes while git names the folder, `startHeadless` still calls the adapter when `commandsOf` resolves, and stops the run at once (`daemon.ts:2580-2587`). The real adapter then launches Claude Code only to stop it. This matches `stopHeadless`'s docstring and the case `stops a run that starts only after the daemon closed`, so this phase leaves it. `gaps.md` *Not done* names it.
