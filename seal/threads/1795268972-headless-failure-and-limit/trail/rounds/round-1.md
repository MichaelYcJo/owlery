# Review round 1: 1795268972-headless-failure-and-limit

```seal
target: 7374426 against 78bb2b9
```

This round read the whole diff `git diff 78bb2b9...7374426`: the code under `apps/desktop/src`, the cases under `apps/desktop/test`, and every record of the work item. It read `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `pr.md`, `guarantee.md`, `trail/gate.md` and both phase records, each to its end, at `7374426`. No `pr.<lang>.md` stands, since `Commit and pull request language` is English. No `seal/parity.json` and no `Pact` key stand. There are no earlier rounds, so no coordinate or verdict was carried from one. The sealer's withheld audit (`guarantee.md`) is a claim. This round did not re-run its seen-red runs, its mutant runs or its drive. It took from them only where to look, and says so where it leans on one.

The axes were fixed before the read. They are the table's ten. This change adds its own: process lifetime, meaning a process group, a signal sent after the exit, and a child that holds the pipes. It also adds the lifetime of a session in the daemon's list, meaning the bound, a drop and an event that arrives for a session no longer listed. The last added axis is the gap between a daemon and a window of two builds.

## Findings

### 1. A start that fails after its session ended puts the session back into the bound, and the daemon drops a session it should keep

```seal
severity: should
location: `apps/desktop/src/daemon/daemon.ts:954`, `apps/desktop/src/daemon/daemon.ts:964-978`, `apps/desktop/test/daemon.test.ts`
evidence: executed `node scripts/test-in-electron.mjs test/test_tmp_round1.test.ts -t "tmp round1"` (case A, in the round's clone); read `apps/desktop/src/daemon/daemon.ts:905-978`
```

Why it matters: *Scope* item 7 says the daemon keeps the 50 sessions that ended last. *Scope* item 5 says an exit that arrives for a session the daemon no longer lists changes nothing. Phase 1 added that guard for the `exit` event alone (`daemon.ts:925`). The rejection of the adapter's start still calls `failed` without any guard (`daemon.ts:954`). `failed` calls `headlessChanged`. Since this diff, `headlessChanged` adds every session that is not `working` and not yet in `endedHeadless` to that set (`daemon.ts:966-968`). A session that left the list is no longer in the set, so a late rejection puts it back. The set then holds one id more than the list. The bound then drops the session that ended first among the real ones, and it broadcasts a `headless` message for a session the daemon no longer lists. The window's `withHeadless` appends that session again (`view.ts:1609-1611`). The same call also overwrites the error of a session that a stop or the limit had already failed. After that, `stopped` says `request` while `error` says the start failed.

Probe A ran with `keptHeadless: 1`. It asked a session whose start hangs, stopped it with `stopHeadless`, then asked a quick session that finished. As designed, the bound dropped the stopped session. Then the hanging start rejected. What came back: `after=[["headless",1,"the login shell found no CLI","request"],["headlessDropped",2]] ready=[]`. So the session that ended last, id 2, left the list. The daemon kept none. Every client was told that session 1 had failed again.

The path can be reached in the app. A start waits on the login shell's lookup, which can take up to 10 seconds (`docs/architecture.md` *Overall layout*, as `trail/phases/phase-1.md` cites). In that window a person can press "Stop" or delete the work item. A delete removes the worktree, and a spawn into a removed `cwd` rejects. With 50 ended sessions held, which is the daemon's steady state once role sessions run, each such rejection drops one session the bound should keep.

The class was listed from what produces the defect: every caller of `headlessChanged`, directly or through `failed` (`grep -n "headlessChanged(\|failed(\|stopHeadless(" src/daemon/daemon.ts`). The `ask` at 707 acts on a session that has just been listed. `stopHeadless` at 719 and 887 acts on sessions looked up in the list. The limit's timer at 703 is cleared when its session ends (968) and at the close (254). The text and result events at 936, 941 and 946 return at `info.state !== "working"` (933). The exit at 928-929 is guarded at 925. The rejection at 954 is the one member without a guard.

```ts
      (error: unknown) => {
        // A session that ended while its adapter was starting keeps what ended it, and one that left the list is told to nobody again.
        if (this.headless.get(info.id) !== session || info.state !== "working") return;
        failed(error instanceof Error ? error.message : String(error));
      },
```

The fix also owes a case in `daemon.test.ts`, *headless sessions*. Probe A's body is that case: an adapter whose start for one prompt rejects only when the case says so, `keptHeadless: 1`, a `stopHeadless` before the rejection and a quick session after it. It asserts that `ready` lists the quick session and that no message follows the rejection. Show it red against `7374426` before the guard goes in (contract rule 15).

### 2. The Claude adapter sends events after its `exit` where a child of the CLI still holds the output stream

```seal
severity: should
location: `apps/desktop/src/daemon/adapters/claude.ts:190-212`, `apps/desktop/src/daemon/adapters/adapter.ts:11`, `apps/desktop/test/claude-adapter.test.ts`
evidence: executed `node scripts/test-in-electron.mjs test/test_tmp_round1.test.ts -t "tmp round1"` (case B, in the round's clone); read `apps/desktop/src/daemon/adapters/claude.ts:190-212`, `apps/desktop/src/daemon/adapters/adapter.ts:11`
```

Why it matters: the interface says of `exit` that "Nothing follows it" (`adapter.ts:11`). Before this diff the adapter reported `exit` at the streams' `close`, so nothing could follow it. *Scope* item 2 adds a second path. Where a child the CLI started holds the pipes, `exit` goes out 300 ms after the CLI's exit (`claude.ts:208`). The readline over `child.stdout` (`claude.ts:190`) keeps reading after that. So a line the child prints later still reaches the listener after `exit`. The pipes' descriptors also stay open in the daemon for as long as that child lives. A tool that starts a long-lived process in the background is the case #41 and #39 bring.

Probe B used a script CLI that leaves a background subshell. The subshell prints a `result` line one second later, and the CLI exits 0. What came back: `events=[{"type":"exit","exitCode":0,"errorOutput":""},{"type":"result","text":"late","isError":false,"costUsd":0}]`. The daemon of this build ignores the late event, since a session is no longer `working` after its exit (`daemon.ts:933`). The interface's sentence is still false of the adapter, and the fake adapter cannot show it. #41 reads the events through this interface.

```ts
      const report = (code: number | null): void => {
        if (reported) return;
        reported = true;
        clearTimeout(grace);
        // Nothing follows the exit. A child the CLI started may still hold the streams, and what it prints is not the run's.
        // Precondition: the daemon's ends of the pipes are closed here, so a later write by that child fails with EPIPE
        // (or SIGPIPE where the child does not handle it); at a `close` the streams have ended already and this does nothing.
        lines.close();
        child.stdout.destroy();
        child.stderr.destroy();
        listener({ type: "exit", exitCode: code ?? 1, errorOutput });
      };
```

`lines` is declared at `claude.ts:190`, before `report`. The fix owes a case beside "reports the exit of a CLI whose child still holds its streams soon after the exit" in `claude-adapter.test.ts`. Probe B's body is that case: the child prints a line after the grace, and the events are `exit` alone. The fix pass also decides whether that case's `alive(childPid)` check still holds once the pipes are closed. The child there is `sleep 30`, which writes nothing, so it should hold.

### 3. No committed case holds the window's "Stop" button, its error output or the drop of a session

```seal
severity: should
location: `apps/desktop/src/renderer/work-item-view.ts:638-648`, `apps/desktop/src/renderer/renderer.ts:1319-1322`, `seal/threads/1795268972-headless-failure-and-limit/gaps.md:8`, `seal/threads/1795268972-headless-failure-and-limit/pr.md:22`
evidence: executed `git grep -n -e headlessDropped -e '"Stop"' -e 'error-output' -e '#headless' -- test` in `apps/desktop` at `7374426`; read `seal/threads/1795268972-headless-failure-and-limit/gaps.md:8`, `seal/threads/1795268972-headless-failure-and-limit/trail/phases/phase-2.md:21-27`, `seal/threads/1795268972-headless-failure-and-limit/guarantee.md:17`, `apps/desktop/vitest.config.ts:6-17`
```

Why it matters: the sealer asked whether this gap is acceptable. It is a finding. The diff changes what a person sees and does in the window. It adds a "Stop" button whose press sends `stopHeadless` (`work-item-view.ts:638-645`), a `.error-output` part under a failed line (`work-item-view.ts:648`), and a `headlessDropped` case in the message switch (`renderer.ts:1319-1322`). The search above finds no case that holds any of them. Its only hits under `test/` are the daemon's own `headlessDropped` cases and the hooks' `Stop` event. Contract rule 14 asks that a change to what a person sees be pinned in the same work. `skills/code-review/SKILL.md` *The record* makes such a gap a `should` where the diff changed a behaviour that no case then holds. The cases of `view.test.ts` hold the decisions `stop` and `errorOutput`. Deleting the `if (line.stop)` block, the `.error-output` append or the `headlessDropped` case would still pass the whole suite.

The frame's scenario 9 asks for "one drive of the built app" and not for a committed case. So the build is compliant on this point, and the gap is one of quality. The cost of closing it is low. The drive already exists as `test_tmp_headless_drive.test.ts` under `<scratchpad>/1795268972-headless-failure-and-limit/phase-2/`. It passed at `37c369b` in 3.57 s (`phase-2/drive.txt`), and the sealer re-ran it with 2 passed (`guarantee.md:17`). It imports `buildApp` from `./built-app`, so `vitest.config.ts:13-17` would place it among the files that run one at a time once it is committed.

`gaps.md:8` also says that "only the drive of phase 2 saw them, once, at `37c369b`". The target contradicts that: the sealer ran the same drive again at `3bf8c6c` (`guarantee.md:17`).

The fix:

- Commit the drive as `apps/desktop/test/ask-section.test.ts`. Drop its `log` and the `console.log` in `afterAll`, which vitest did not print (`phase-2.md:27`). Keep its two cases. Show each red before it counts (contract rule 15): the first with the `if (line.stop)` block of `showAskSection` removed, and the second with the `headlessDropped` case of `renderer.ts` removed. Read the failing line for that guard.
- Close the row at `gaps.md:8` in place, as `skills/implement/SKILL.md` *4. The closing memo* asks:

```markdown
| The window's "Stop" button, its press that sends `stopHeadless`, the `.error-output` part under a failed line and the `headlessDropped` case of `renderer.ts`'s switch. `test/ask-section.test.ts` holds them since <commit>, each case seen red with its guard removed | closed |
```

- Remove the bullet at `pr.md:22`, since the window is then held by a committed case. Where `pr.md` should still say the drive is slow, say that in one sentence instead.

### 4. `pr.md` says SIGKILL always follows, and the changelog says every child the CLI started stops with it

```seal
severity: should
location: `seal/threads/1795268972-headless-failure-and-limit/pr.md:8`, `seal/threads/1795268972-headless-failure-and-limit/changelog.md:8`, `apps/desktop/src/daemon/adapters/claude.ts:14`
evidence: read `apps/desktop/src/daemon/adapters/claude.ts:215-233`, `seal/threads/1795268972-headless-failure-and-limit/frame/design.md:47`, `seal/threads/1795268972-headless-failure-and-limit/pr.md:8`, `seal/threads/1795268972-headless-failure-and-limit/changelog.md:8`
```

Why it matters: `pr.md:8` says "The stop signals the CLI's whole process group with SIGTERM, then SIGKILL 2 seconds later (`KILL_AFTER_MS`)". The code sends SIGKILL only where the CLI has not exited by then. `clearTimeout(kill)` follows `await exit` (`claude.ts:231-232`), and `signal` sends nothing once `exited` is true (`claude.ts:217`). That is *Scope* item 2 (`design.md:47`). `changelog.md:8` says "so a child process it started stops with it". Two kinds of child do not stop. One is a child that ignores SIGTERM where the CLI exits at the signal. The other is any child of a CLI that exits by itself, since no stop then signals the group. The new case "reports the exit of a CLI whose child still holds its streams…" asserts the second: the child is alive after the stop (`claude-adapter.test.ts:334`). A person reading the release notes, and the sealer reading `pr.md` against the diff, would take every child for stopped. The search `git grep -n -i -e SIGKILL -e "killed 2 seconds" -e "kills the group" -e "stops with it"` over the work item and `apps/desktop/src` listed the statements of the kill. `design.md:47` and `design.md:98` state the condition. `claude.ts:14` drops it.

```markdown
| A run ends at a stated limit or by a client's message, and a process that ignores the signal is killed | A run ends 60 minutes after its start (`HEADLESS_LIMIT_MS`), or at the new client message `stopHeadless`, which the window's "Stop" button sends. The stop signals the CLI's whole process group with SIGTERM, then with SIGKILL 2 seconds later (`KILL_AFTER_MS`) where the CLI has not exited by then, and settles when the CLI has exited. `HeadlessInfo.stopped` reads `"limit"` or `"request"` |
```

```markdown
- **A CLI that ignores the stop is killed 2 seconds later, and so is what it started.** Owlery signals the CLI's whole process group, so a child process the CLI started receives the stop while the CLI runs, and the kill with the CLI where the CLI ignored the stop.
```

```ts
/** How long a stop waits, after it signalled the CLI's process group to end, before it kills the group where the CLI has not exited by then. */
```

## Confirmations

What matched: *Scope* item 1. The error stream is decoded as UTF-8 (`claude.ts:186`), and its last `ERROR_OUTPUT_CHARS` characters are kept without a leading low surrogate (`claude.ts:21-27`). `exit` carries the tail, and the fake adapter carries its option (`fake.ts:25-34`). Read. Scenario 10's search `git grep -n -e 'stderr.resume' 7374426 -- apps/desktop/src` printed nothing (exit 1). Executed.

What matched: *Scope* item 2 as the frame states it. The spawn uses `detached: true` (`claude.ts:178`), and the stop signals `-child.pid`, gives one promise through `??=` and settles at `exit` (`claude.ts:215-233`). The grace is 300 ms (`claude.ts:18`, `:208`). Read. The frame's ground for signalling nothing after the exit is that "the group's id may then name another's processes". That holds only for an empty group: a group id is not reused while the group has members. The `## Not judged` row below carries that ground.

What matched: *Scope* items 3, 4 and 5 in `daemon.ts`. The limit's timer is set at the ask (703), cleared at the end (967) and at the close (254). `stopHeadless` answers `done` before the stop, leaves a session that is not `working` alone, and refuses an unknown id with `no headless session <id>` (712-721). `HeadlessInfo` gains `errorOutput` and `stopped` (`protocol.ts:222-225`), and `endSessions` sets `stopped` to `request` (887). Read.

What matched: *Scope* item 6. `Daemon#close` awaits the stops with the server's close (`daemon.ts:252-261`). `endSessions` races the stops with the panes' exits against `endWaitMs`, and still refuses on the panes alone (`daemon.ts:887-896`). Read. `close` has no bound of its own, unlike `endSessions`. For the Claude adapter the bound rests on the kill. Node's `detached` makes the CLI a session leader, which cannot move to another group, so the group's SIGKILL reaches it. A later adapter whose stop never settles would hold the daemon's exit past the app's 5-second wait (`daemon-client.ts:106-124`, which then reports the pid). *Scope* item 6 puts the bound in the adapter, so this is the frame's choice and no finding.

What matched: *Scope* item 7 apart from finding 1. `endedHeadless` keeps the order of ending, the bound drops from its front, and `dropWorkItems` takes a deleted work item's ids out of it (`daemon.ts:162`, `:813-817`, `:964-978`). Read.

What matched: *Scope* item 8. The fixture holds three lines with placeholder ids. Read. Its two cases sit in `claude-adapter.test.ts:338-351`. They did not run in this round, and the sealer's run of them is its claim (`guarantee.md:16`, `:20`).

What matched: *Scope* item 9, read. A failed line shows its error, then `errorOutput` in its own part where that is not empty, as text and never as markup (`work-item-view.ts:647-648`, `shared.ts:81-86`). `--font-mono` and `.quiet` are defined in `index.html` (lines 78, 108). Against a daemon of an earlier build, `if (line.errorOutput)` reads the missing field as empty, and the earlier daemon's switch ends at `default: return` (`78bb2b9:apps/desktop/src/daemon/daemon.ts:719-720`). That matches `changelog.md:11` and `pr.md:17`.

What matched: the records' coordinates at the target. `protocol.ts:318` is the `inbox` member, which carries no headless list. Every commit that `frame/plan.md`, the phase records and `guarantee.md` name is an ancestor of `7374426`. `7374426` touches `frame/plan.md`, `guarantee.md` and `routing.md` alone. Executed. `frame/design.md:15` cites `daemon-client.ts:107` for the 5,000 ms default, which stands on line 106 at `24529d2`. That is one line off and leads no reader astray, so it is named here and is no finding.

One new case holds no fact the frame states: "leaves the sessions as they are where the window holds none of the id" (`view.test.ts:1560-1562`). The filter has no branch that the case before it leaves untested, so it pins nothing more. *The record* weighs such a case as no finding.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The whole suite, the typecheck and the documents' checks of the `Broad gate` key at the commit the fix pass leaves. This round ran its probe file once and no whole suite (contract rule 2) | `seal/config.json`, `Broad gate` | the orchestrator, at the broad gate after the rounds settle |
| Whether a stop should also send SIGKILL to the group where the CLI exited at SIGTERM but a member of its group ignored it. *Scope* item 2 signals nothing after the exit because "the group's id may then name another's processes". A group id is not reused while the group has members, so that ground covers only a group already empty, where the signal fails with ESRCH. With `frame/questions.md` Q3 open, a tool's process that ignores SIGTERM outlives the stop | `seal/threads/1795268972-headless-failure-and-limit/frame/design.md:47`, `apps/desktop/src/daemon/adapters/claude.ts:217` | the orchestrator, to fold or to hand to a framer under `skills/implement/orchestration.md` *A decision made after the frame is committed is folded* |
| What a real Claude Code does at the group kill during a turn (Q2, Q3) | `seal/threads/1795268972-headless-failure-and-limit/frame/questions.md:17-18` | a measurement, as `gaps.md:10` states |
| The cases that run against time on a slower runner | `seal/threads/1795268972-headless-failure-and-limit/gaps.md:9` | the `macos-latest` runner of the pull request's `check` workflow |

## Probes

| Command | Result |
|---|---|
| `node scripts/test-in-electron.mjs test/test_tmp_round1.test.ts -t "tmp round1"`, run once in `apps/desktop` of the round's clone at `7374426`. The file is a copy of `test/daemon.test.ts` with two cases added at the end of *headless sessions*, and it stands under `<scratchpad>/1795268972-headless-failure-and-limit/round-1/clone/` | Exit 1, 2 failed and 215 skipped. Case A printed `TMP-A slow=1 kept=2 after=[["headless",1,"the login shell found no CLI","request"],["headlessDropped",2]] ready=[]` and failed on `expected [] to deeply equal [ 2 ]`. Case B printed `TMP-B events=[{"type":"exit","exitCode":0,"errorOutput":""},{"type":"result","text":"late","isError":false,"costUsd":0}]` and failed on `expected [ 'exit', 'result' ] to deeply equal [ 'exit' ]`. No process of the probe was left (`ps`) |
