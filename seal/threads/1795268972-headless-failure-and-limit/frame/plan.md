# Implementation Plan: 1795268972-headless-failure-and-limit

## Technical context

The tree as read at `24529d2`.

`apps/desktop`. The adapter interface is `src/daemon/adapters/adapter.ts`, the Claude adapter `src/daemon/adapters/claude.ts` (`claudeAdapter` spawns the CLI at line 159 and drops its error stream at line 166), and the fake adapter `src/daemon/adapters/fake.ts`. The daemon's headless sessions are in `src/daemon/daemon.ts`: the `ask` case (lines 668-687), `endSessions` (845-864), `startHeadless` (866-903), `headlessChanged` (906-910), `close` (228-242) and `checkIdle` (1178-1183). The protocol is `src/shared/protocol.ts` (`HeadlessInfo` at 210-222, `ClientMessage` with `ask` at 299-300, the server's `asked` and `headless` at 324-327). The window shows the sessions through `headlessLines` and `withHeadless` in `src/renderer/view.ts` (1609-1627) and `showAskSection` in `src/renderer/work-item-view.ts` (623-636). The cases are `test/claude-adapter.test.ts` (script CLIs found through `fakeShell`), `test/daemon.test.ts` (the fake adapter, `fakeAdapter({ delayMs: 60_000 })` for a run that does not end) and `test/view.test.ts`. They run with vitest inside Electron's Node (`pnpm run test`).

The process-group kill and the grace after the exit follow `askRemote` in `src/daemon/worktrees.ts` (286-338), which already does both for `git fetch`. The daemon's own waits, `END_WAIT_MS` (3,000 ms) and the app's `stopDaemon` (5,000 ms, `src/main/daemon-client.ts:107`), bound `KILL_AFTER_MS` from above. The probe's 389 ms exit of an idle CLI bounds it from below (`frame/design.md` *Grounding*).

The cases that run against time use short option values and wait on events, never on a fixed sleep. Once #30 merges, they run on a `macos-latest` runner of GitHub Actions as well, which is slower than the owner's machine.

**The failure scenario of the chosen approach.** In six months a role stage that is busy, such as a crafter's fix pass that runs a long suite, passes 60 minutes and is killed as a stuck one. The person then sees `stopped: "limit"` on a stage that would have finished. The constant stands in one place, and #41 can give a stage its own limit (Q4). The second failure: a release of Claude Code that puts its tool processes in process groups of their own. The group kill then misses them, and a tool's process outlives the stage (Q3). A third: a release that prints a failure's cause on the output stream in a line the mapping drops. The session then fails with the exit's text and an empty tail, as it does today.

## Alternatives considered

| Approach | Failure scenario | Verdict |
|---|---|---|
| A limit from the run's start (chosen) | A busy stage longer than the limit is killed | Chosen: it ends both a CLI that hangs printing nothing and one that loops printing, and the limit is one number a person can read |
| A limit on time with no output | A tool call that prints nothing for minutes, such as a suite, is killed while busy. An agent that loops and prints is never ended | Rejected: it misses the looping run and kills the busy one |
| `--max-budget-usd` as the limit | A CLI that hangs spends nothing and is never ended. The flag is Claude Code's, so the fake adapter and a later vendor's adapter have nothing to set | Rejected as the limit. A budget per stage stays open for #41 and #42 (`docs/architecture.md` *Options for launching Claude Code*) |
| The daemon escalates SIGTERM to SIGKILL itself | The daemon would need the process's id, which `RoleRun` does not carry, and every adapter would expose its process | Rejected: the adapter owns its process. `stop()` returns a promise that settles at the exit, and the daemon awaits it |
| Signal the CLI's process alone, as now (keeps the structure) | A child the CLI started in its own group, such as a tool's shell, outlives a CLI killed with SIGKILL, which cannot pass the signal on | Rejected: the premise that keeps it, that the CLI ends its children, holds only for SIGTERM. `askRemote` already runs a child in its own group for the same reason |
| Append the error stream's tail to `error` | A reader of the session, #41's code among them, cannot tell the daemon's sentence from the CLI's output, and a failed result's text and a crash's tail run together | Rejected for a field of its own, `errorOutput` |
| A new state `stopped` beside `failed` | Every reader of `HeadlessState`, the keep-awake rule, the running lists, the icon and the dialogs that name running sessions, gains a case | Rejected: a stopped run did not finish, so it is `failed`, and `stopped` says why. #41 names the stage states on the inbox line |
| Keep a bound per work item | The bound grows with the work items, so the daemon's list stays unbounded in total | Rejected for one bound on the daemon's whole list |
| Keep the list in memory alone (keeps the structure) | A daemon restart loses every answer, as today | Kept: the premise is that what must outlive a stage is a record in the repository (`docs/architecture.md` *State lives in three places*, read), and the list serves the window's recent view |
| Persist headless sessions in the run folder | A file of answers to keep in step with the list, and a format a later build has to read | Rejected for the premise above. Keeping sessions across a restart is out of scope (`frame/design.md` *Scope* item 10) |
| Let a window keep a dropped session until it reconnects | The window's list grows for the window's life, and a dropped session shows answers the daemon no longer holds | Rejected for `headlessDropped` |
| Leave the window without a "Stop" button | A person whose run hangs still has no way to stop it, which is the complaint of #26 | Rejected: the button sends the new message from the one client the tree has |

## Phases

| Phase | Delivers | Verified by | Status |
|---|---|---|---|
| 1 | `frame/design.md` *Scope* items 1 to 8, and the protocol and the interfaces of *Data & interfaces* | Scenarios 1 to 8 as cases, each seen red before its code; scenario 10's search, run after the build | `0163238` |
| 2 | *Scope* item 9 | Scenario 9: a case for each decision of `src/renderer/view.ts` the item adds, each seen red before its code, and one drive of the built app with a script CLI through a script `SHELL`, which stops a working session and shows a failed one's error output | `37c369b` |

## Overlap with the release

The spawn names #30 and #28 beside this work. #30's routing and its first commit are on its branch at `f51dae9`. #28's routing is committed at `5d4615e`, and its routing says the session frames it, so no frame of it stands.

| Work item | Where both change | Merges first | Grounds |
|---|---|---|---|
| #30, `1795268298-desktop-suite-in-ci` | No file of both. Its `.github/workflows/check.yml` runs `pnpm -r run check` on every pull request into a release branch, and so reads the cases this work adds. Its `apps/desktop/package.json` moves the version, and this work does not touch that file | #30 | `docs/roadmap.md` *Releases and the tracker* has the first pull request of a release move the version. Once #30 is in, this pull request's suite runs in that workflow before the merge, so the time-bound cases meet the slower runner inside rounds this work spends anyway |
| #28, `1795268971-panes-nothing-can-close` | `apps/desktop/src/daemon/daemon.ts` (`DaemonOptions`, where #28 removes `cwd` and this work adds `headlessLimitMs` and `keptHeadless`, and the client message switch, where #28 changes `start` and this work adds `stopHeadless`), `apps/desktop/src/shared/protocol.ts` (`ClientMessage`), and `apps/desktop/test/daemon.test.ts` | #28 | Its routing places it in the small tier, and its diff removes one path and adds one rule, so it is likelier to be sealed first. The two touch different members of the same interface and the same switch, so the later merge resolves neighbouring lines and no rule of either reads the other's. Where #28 bounds the exited panes by a count, the two bounds are separate rules of separate lists |

## Operational impact

No dependency is added and no environment variable. The protocol gains `stopHeadless`, `headlessDropped` and the fields of `HeadlessInfo` that `frame/design.md` *Data & interfaces* names. A window of this build connected to a daemon of an earlier build sends `stopHeadless` to a daemon that does not know it; the status line already names a daemon of another build (`docs/architecture.md` *Overall layout*). A headless run now ends after 60 minutes, and the daemon's close and a delete now wait up to about 2 seconds for a CLI that ignores its signal. The version does not move: #30 moves it (`routing.md`).

## Judgments of the run

| Date | Judgment | Grounds | Judged against |
|---|---|---|---|
| 2026-11-22 | Fold phase 1's two statements of *Data & interfaces*: `HEADLESS_LIMIT_MS` and `HEADLESS_KEPT` are exported from `daemon.ts` for the cases, and `headlessDropped` is sent only when the bound drops a session, as *Scope* item 7 already says. The orchestrator folds them and spawns no framer | The phase 1 crafter's hand-back names both, and HEAD (`4b3316e`) holds them; the second makes two sentences of the frame agree . Corrected the same day after phase 2: the fold first said the `headless` list a delete sends leaves the sessions out, and no message carries that list after a delete or a removal | the plugin's `skills/implement/orchestration.md` *A decision made after the frame is committed is folded* |
| 2026-11-22 | Raise the route from `straight to the PR` to `through the review chain` | The diff reaches the window and the waits of `Daemon#close` and `endSessions`, which the routing's grounds (the adapter bounded) did not name; the sealer's first audit withheld on it | the plugin's `skills/implement/orchestration.md` *Under agentic*, "A route is raised when the work outgrows it, and never lowered"; this work item's `routing.md` |
