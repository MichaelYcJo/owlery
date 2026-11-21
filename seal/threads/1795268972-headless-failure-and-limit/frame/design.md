# Design: 1795268972-headless-failure-and-limit

The ticket is issue #26. It asks for three things: a failed headless session shows what its CLI printed on its error stream; a run ends at a stated limit or at a client's message, and a process that ignores the signal is killed; and the daemon keeps a bounded number of finished sessions.

## Grounding

The tree as read at `24529d2`.

| Policy clause | What it fixes for this work |
|---|---|
| `docs/architecture.md` *Agent adapters*, the table, row "Daemon to agent" | "Interrupting and stopping midway" is the adapter's to fit. This work builds stopping, and an interrupt that keeps the session stays out of scope (*Scope* item 10) |
| `docs/architecture.md` *Role sessions run detached from the user's environment* | The launch's flags and its five environment names stay as they are. Every probe below ran the adapter's own flags with a scratch `HOME` |
| `docs/architecture.md` *Rules that keep it portable*, rules 1 to 3 | The new protocol fields and the new messages name no vendor. The fake adapter gains each new capability the Claude adapter gains, so the daemon's cases reach it |
| `docs/architecture.md` *Memory design*, the opening sentence and the table's last row | Memory grows with the stages working now, not with the work done before. The process of a finished stage is ended. The bound of *Scope* item 7 and the kill of item 2 serve both |
| `docs/architecture.md` *Overall layout*, the bullet "A person stops the daemon from the app's menu" | The app signals the daemon and waits for it to be gone. `stopDaemon` waits 5,000 ms by default (`apps/desktop/src/main/daemon-client.ts:107`, read), so the daemon's own wait for its runs at close stays under that |
| `docs/architecture.md` *State lives in three places* and *Records are committed to the repository* | What must outlive a stage is a record in the repository. The daemon's list of headless sessions is the daemon's state and can be bounded (*Scope* item 7) |
| `docs/roadmap.md` *Milestones*, row 1 | Owlery never turns a permission check off. No flag changes |
| `docs/roadmap.md` *Releases and the tracker* | The pull request merges into `release/v0.0.2` by squash. The first pull request of the release moves the version, and that is #30's (`routing.md`) |

What the tree holds at `24529d2`, each fact labelled:

- **The error stream is dropped.** `apps/desktop/src/daemon/adapters/claude.ts:166` calls `child.stderr.resume()`, and the `exit` event carries the exit code alone (`adapter.ts`, `RoleEvent`). Read. `git grep -n -e 'stderr.resume' -- apps/desktop/src` printed that one line, `apps/desktop/src/daemon/adapters/claude.ts:166`. Executed at `24529d2`.
- **Stopping does not wait and does not escalate.** `claude.ts:175` returns `stop: () => void child.kill()`, one SIGTERM to the CLI alone. Read.
- **Nothing ends a run by time.** `startHeadless` (`apps/desktop/src/daemon/daemon.ts:866-903`) ends a session only at the adapter's events. Read. A session that is `working` keeps the daemon from its idle exit (`daemon.ts:1180`) and the Mac awake (`apps/desktop/src/daemon/keep-awake.ts:23-27`). Read.
- **No client message stops one session.** The protocol's `ClientMessage` (`apps/desktop/src/shared/protocol.ts`) holds `ask` and no stop. Only an archive, a delete and a repository's removal stop runs, through `endSessions` (`daemon.ts:845-864`), and that wait covers the panes alone. Read.
- **The daemon's close does not wait for its runs.** `Daemon#close` (`daemon.ts:236`) calls `run?.stop()` and goes on. `apps/desktop/src/daemon/main.ts:36-40` awaits `daemon.close()` and then exits. Read.
- **Every session stays until the daemon exits.** The `headless` map (`daemon.ts:146-147`) loses an entry only in `dropWorkItems` (`daemon.ts:780`), at a delete or a removal. Read.
- **The window shows a failed session's `error` in place of its answer.** `headlessLines` (`apps/desktop/src/renderer/view.ts:1622-1627`). Read.
- **The tree already kills a child's process group and reads its error stream.** `askRemote` (`apps/desktop/src/daemon/worktrees.ts:286-338`) spawns `git fetch` with `detached: true`, signals `-child.pid`, signals nothing once the child has exited, and ends at the exit plus a 300 ms grace where the pipe stays open (`FETCH_PRINTED_GRACE_MS`). Read. No other code in `apps/desktop/src` kills with a second signal or keeps a process's error stream. Executed: `git grep -n -i -e sigkill -e SIGTERM -e 'kill(' -- apps/desktop/src`. `OutputBuffer` (`apps/desktop/src/daemon/buffer.ts`) keeps a pane's last output for a terminal replay: it cuts at line starts and reads escape sequences, which an error stream's tail does not need. Read.
- **The installed CLI is Claude Code 2.1.330.** Executed: `claude --version`. The recorded fixture `apps/desktop/test/fixtures/claude-stream.jsonl` is from 2.1.327.

What the CLI does in each failure a probe could reach without spending usage. Each probe ran `/Users/yc/.local/bin/claude` with the arguments of `claudeArgs` and the environment names of `claudeEnv`, with `HOME` set to an empty scratch folder, on 2026-11-21. The scripts are `test_tmp_cli_failures.mjs` and `test_tmp_cli_stderr.mjs`, and their output is `probe-output.txt` and `probe-stderr-output.txt`, all under `/private/tmp/claude-501/-Users-yc-Documents-GitHub-owlery/d0446fb9-f77c-425f-bd37-d22bad5c7878/scratchpad/1795268972-headless-failure-and-limit/frame/`. Executed.

| Case | Output stream | Error stream | Exit |
|---|---|---|---|
| Not logged in: no API key, and the scratch `HOME` holds no login | `system` with `apiKeySource: "none"`; an `assistant` line whose model is `<synthetic>`, with the text block `Not logged in · Please run /login` and `"error":"authentication_failed"`; a `result` with `is_error: true`, `result: "Not logged in · Please run /login"`, `total_cost_usd: 0`, `terminal_reason: "api_error"` | nothing | code 1, after 698 ms |
| An API key the API refused (`ANTHROPIC_API_KEY` set to a key that is not one) | The same three lines, with the text `Invalid API key · Fix external API key` and `api_error_status: 401` | nothing | code 1, after 2,613 ms |
| An input line that is not JSON | nothing | `Error parsing streaming input line (type=unknown, 21 chars): SyntaxError` and a line break | code 1, after 213 ms |
| An option the CLI does not know (`--no-such-option`) | nothing | `error: unknown option '--no-such-option'` and a line break | code 1, after 79 ms |
| SIGTERM 3 seconds after the start, with standard input open and no message sent | nothing | nothing | code 143 and no signal, 389 ms after the signal |

So a failure the CLI can name comes as an error `result` on the output stream, which the mapping of `eventsForLine` already turns into a failed session with the result's text. A failure before the CLI can run a turn comes on the error stream alone, and that is the text this work keeps. The table's first two rows also answer most of the row #26 carries from the settle of release 0.0.1: the mapping of an error result holds for no login and for a refused key. The line of a run over the usage limit was not recorded, because no probe reaches it without an account over its limit (`frame/questions.md` Q1).

## Scope

1. **The adapter keeps the last of the error stream.** The Claude adapter reads the CLI's error stream as UTF-8 and keeps its last 2,000 characters (`ERROR_OUTPUT_CHARS`, a constant of `claude.ts`). A cut never leaves half of a character outside the basic plane at the tail's start. The `exit` event carries the tail as `errorOutput`, which is the empty string where the CLI printed nothing there. The fake adapter takes an `errorOutput` option, and its `exit` events carry it.
2. **A run's stop ends the process and says when it has.** `RoleRun.stop()` returns a promise that settles once the agent's process has exited, and a second call returns the same promise. The Claude adapter starts the CLI in a process group of its own (`detached: true`, as `askRemote` does), so the signal also reaches what the CLI started in its group. Its stop sends SIGTERM to the group, and SIGKILL to the group 2,000 ms later (`KILL_AFTER_MS`) where the process has not exited by then. It signals nothing once the process has exited, since the group's id may then name another's processes. The listener's `exit` event comes at the streams' `close` as now, or 300 ms after the process's exit where the pipes are still open then, because a child the CLI started can hold them. The fake adapter's stop settles at once.
3. **A run ends at the daemon's limit.** `DaemonOptions` gains `headlessLimitMs`, and `HEADLESS_LIMIT_MS`, 60 minutes, stands where it is absent. The limit counts from the session's start. A session still `working` at the limit is stopped: its run is stopped, it becomes `failed` with the error `the session reached its time limit and was stopped`, and its `stopped` field reads `limit`. A session whose adapter is still starting at the limit is stopped once it has started, as `endSessions` does now. The timer ends when the session ends, and at the daemon's close.
4. **A client stops one session.** The new client message `stopHeadless` names a headless session by its id. A session that is `working` is stopped: its run is stopped, it becomes `failed` with the error `the session was stopped at a request before it finished`, and `stopped` reads `request`. The daemon answers with `done`. A session that is not `working` is left as it is, and the answer is still `done`. An id the daemon does not list is answered with `error`, `no headless session <id>`. An archive, a delete and a repository's removal set `stopped` to `request` on the sessions they end, with their own error texts as now.
5. **A session carries what its process printed and why it stopped.** `HeadlessInfo` gains `errorOutput: string` and `stopped: "limit" | "request" | null`. They are `""` and `null` at the start. At the `exit` event the daemon writes the event's `errorOutput` into the session, whatever its state, and sends the session to every client where the field changed. An `exit` that arrives for a session the daemon no longer lists changes nothing. The error text of an exit without a result stays `the session exited with code <N> and gave no result`.
6. **The daemon waits for the runs it stops.** `Daemon#close` awaits the stop of every run it stops, which the kill of item 2 bounds to about 2 seconds, under the app's 5-second wait. `endSessions` waits for the headless runs it stopped alongside the panes' exits, within the same wait (`endWaitMs`). So a delete does not read the loss again while a CLI it stopped can still write. Its refusal where the wait runs out still counts the panes alone.
7. **The daemon keeps a bounded list.** It keeps the 50 headless sessions that ended last (`HEADLESS_KEPT`, with an option `keptHeadless` for the cases), and every session that is `working`. A session ends when it leaves `working`. When one more has ended than the bound holds, the session that ended first leaves the list, and every client receives `{ type: "headlessDropped"; id }`. The order is the order of ending, not of the ids, so a long run that ends last is the last to leave.
8. **The recorded lines of a run with no login become a fixture.** `apps/desktop/test/fixtures/claude-not-logged-in.jsonl` holds the output lines of the probe table's first row in *Grounding*, with each session id, uuid and request id replaced by a placeholder, as `claude-stream.jsonl` does. A case maps them to a `text` event, then a `result` with `isError: true`, the text `Not logged in · Please run /login` and `costUsd: 0`.
9. **The window shows the tail and can stop a run.** The line of a `working` session in the "Ask" section has a "Stop" button, which sends `stopHeadless` for that session. The line of a `failed` session shows its error, then the session's `errorOutput` where it is not empty, with its line breaks kept. At `headlessDropped` the window takes the session out of its list and draws the section again.
10. **Out of scope.** The line of a run over the usage limit, and telling a stage the usage limit ended from a failed one (#74). A limit for each stage, and the stage's state on the inbox line (#41). A budget per stage with `--max-budget-usd` (`docs/architecture.md` *Options for launching Claude Code* names it). The role bundle and the CLI's minimum version (#38). Tools and permission requests (#39). An interrupt that keeps the session for a follow-up prompt. Keeping headless sessions across a daemon restart. The pieces of an answer that are joined with nothing between them. A limit on how many runs work at once (#32).

## User scenarios & acceptance *(mandatory)*

| Scenario | Given / When / Then | Verifiable how |
|---|---|---|
| 1. A crash says why | Given a CLI that prints to its error stream and exits 3 without a result, then the adapter's `exit` event carries what it printed. Given more than 2,000 characters printed there, the event carries the last 2,000, and no half character opens them | Cases in `apps/desktop/test/claude-adapter.test.ts`, on a script CLI as the file's cases use |
| 2. The window's client reads it | Given the fake adapter told to exit 1 with an `errorOutput`, when a client asks, then every client receives the session `failed` with that `errorOutput`, and `ready` lists it so | A case in `apps/desktop/test/daemon.test.ts` |
| 3. A run that never ends is stopped at the limit | Given a daemon whose `headlessLimitMs` is short and a fake adapter that never answers, when a client asks, then the session becomes `failed` with the limit's error and `stopped: "limit"`, its run is stopped, and the daemon may go idle | A case |
| 4. A client stops a run | When a client sends `stopHeadless` for a working session, then the answer is `done` and the session is `failed` with the request's error and `stopped: "request"`. For a session that ended, the answer is `done` and nothing changes. For an id not listed, the answer is `error` | Cases |
| 5. A CLI that ignores SIGTERM is killed, and so is what it started | Given a script CLI that ignores SIGTERM and starts a child in the background, each writing its pid to a file, when the run is stopped, then the stop settles within about `KILL_AFTER_MS` and neither pid names a running process | A case in `claude-adapter.test.ts`. The script ignores the signal with `trap '' TERM` before it starts the child, and `exec`s a long `sleep`, since an ignored signal stays ignored across `exec` |
| 6. The daemon waits for what it stopped | Given an adapter whose stop settles late, `Daemon#close` settles only after it, and a delete that ends a working headless session reads the loss after the stop settled | Cases with an adapter of the case's own |
| 7. The list is bounded | Given `keptHeadless` of 2, when three sessions finish, then the first to end leaves the list, every client receives `headlessDropped` with its id, and `ready` lists two. A working session is never dropped, and a session that started first and ended last is kept | Cases |
| 8. No login maps to a failed session | The fixture of *Scope* item 8 maps to a `text` event and an error `result` | A case on the fixture |
| 9. The window | A working line offers "Stop", and a press sends `stopHeadless` for it. A failed line shows the error, then the error output. A dropped session leaves the section | Cases on the decisions of `apps/desktop/src/renderer/view.ts`; one drive of the built app with a script CLI found through a script `SHELL`, as `fakeShell` in `claude-adapter.test.ts` does, so no real `claude` runs |
| 10. No line drops the error stream | `git grep -n -e 'stderr.resume' -- apps/desktop/src` prints nothing | Executed at `24529d2`: it printed `apps/desktop/src/daemon/adapters/claude.ts:166`, the line *Scope* item 1 replaces. The search reads `apps/desktop/src` alone, so the frame's own quotes stay outside it |

## Data & interfaces

In `apps/desktop/src/daemon/adapters/adapter.ts`:

- `RoleEvent`'s `exit` becomes `{ type: "exit"; exitCode: number; errorOutput: string }`.
- `RoleRun.stop(): Promise<void>`, settled once the process has exited. Calling it again returns the same promise.

In `apps/desktop/src/daemon/adapters/claude.ts`: `ERROR_OUTPUT_CHARS = 2000` and `KILL_AFTER_MS = 2000`, exported for the cases. The 2,000 characters match the state text the daemon keeps (`STATE_TEXT_CHARS`, `daemon.ts`), which keeps the first characters of a text where this keeps the last.

In `apps/desktop/src/daemon/adapters/fake.ts`: `FakeAdapterOptions.errorOutput?: string`, carried by every `exit` the fake adapter sends.

In `apps/desktop/src/daemon/daemon.ts`: `DaemonOptions.headlessLimitMs?: number` (`HEADLESS_LIMIT_MS = 60 * 60_000`) and `DaemonOptions.keptHeadless?: number` (`HEADLESS_KEPT = 50`). The `END_WAIT_MS` docstring's last sentence is rewritten with the probe's measurement (*Removes*).

In `apps/desktop/src/shared/protocol.ts`:

- `HeadlessInfo` gains `errorOutput: string`, the last of what the agent's process printed on its error stream, and `stopped: "limit" | "request" | null`, which says what stopped a `failed` session and is null where the session ended by itself or still works.
- Client: `{ type: "stopHeadless"; requestId: number; id: number }`, answered with `done` or `error`.
- Server: `{ type: "headlessDropped"; id: number }`, sent to every client when a session leaves the list.

**What the milestone's next items build on, and do not get here.** #41 starts each stage through `startHeadless` and reads its end from `HeadlessInfo`. A stage that runs too long ends at `headlessLimitMs` with `stopped: "limit"`. A stage the daemon ends on purpose ends through the same stop as `stopHeadless`, with `stopped: "request"`. #41 reads `stopped`, not the error's words. A stage that failed carries `errorOutput` for its inbox line and for the orchestrator. #41 names its stage states, and judges whether one limit fits every stage (Q4). #74 tells a stage the usage limit ended from a failed one by the error `result`'s fields, which no probe recorded (Q1). #38 and #39 change the launch's arguments and add events, and the stop, the tail and the bound hold whatever the arguments are. #42 runs the broad gate as the daemon's own process, not through this adapter.

## Rule changes

- add
  file: docs/architecture.md
  section: Agent adapters
  to: **A headless run ends at its limit of 60 minutes or when a client stops it, and a CLI that does not exit at the signal is killed 2 seconds later.** Nothing else ends a CLI that never prints its result, and role sessions run while the person is away. The limit counts from the run's start. A long tool call prints nothing for minutes and a looping agent prints without end, so neither silence nor output tells a stuck run from a busy one. The adapter sends the termination signal to the CLI's process group, and the kill follows where the CLI is still running. Claude Code 2.1.330 exited 0.4 seconds after the signal while it waited for its first message (probed 2026-11-21). The app waits 5 seconds for the daemon to be gone, and the daemon waits for the runs it stops. A run stopped either way is `failed`, and its session says whether the limit or a request stopped it.
    check: apps/desktop/test/daemon.test.ts apps/desktop/test/claude-adapter.test.ts
- add
  file: docs/architecture.ko.md
  section: 에이전트 어댑터
  to: **headless 실행은 60분 한도에 이르거나 클라이언트가 멈추면 끝나고, 신호를 받고도 끝나지 않는 CLI는 2초 뒤에 강제로 끝냅니다.** 결과를 끝내 내지 않는 CLI를 끝낼 것은 이것 말고 없고, 역할 세션은 사람이 자리를 비운 사이에 돕니다. 한도는 실행이 시작된 때부터 셉니다. 오래 걸리는 도구 호출은 몇 분 동안 아무것도 찍지 않고 맴도는 에이전트는 끝없이 찍으므로, 조용한지 찍는지로는 멈춘 실행과 바쁜 실행을 가를 수 없습니다. 어댑터는 CLI의 프로세스 그룹에 종료 신호를 보내고, CLI가 그때도 돌고 있으면 강제로 끝냅니다. Claude Code 2.1.330은 첫 메시지를 기다리던 중 신호를 받고 0.4초 만에 끝났습니다(2026-11-21 실험). 앱은 데몬이 사라지기를 5초 기다리고, 데몬은 자기가 멈춘 실행이 끝나기를 기다립니다. 어느 쪽으로 멈춘 실행이든 `failed`가 되고, 그 세션은 한도가 멈췄는지 요청이 멈췄는지를 밝힙니다.
    check: apps/desktop/test/daemon.test.ts apps/desktop/test/claude-adapter.test.ts
- add
  file: docs/architecture.md
  section: Agent adapters
  to: **A headless session carries the last 2,000 characters its CLI printed on its error stream, and the window shows them under a failed session's error.** A CLI that dies before its result names the cause only there. Claude Code 2.1.330 printed `error: unknown option '--no-such-option'` for an option it did not know, and `Error parsing streaming input line (type=unknown, 21 chars): SyntaxError` for an input line that was not JSON, and nothing on its output stream (probed 2026-11-21). A failure the CLI reports as an error result, such as no login or a refused API key, comes on the output stream, and the error stream stayed empty then. The last characters are kept because a crash prints its cause last.
    check: apps/desktop/test/claude-adapter.test.ts apps/desktop/test/daemon.test.ts apps/desktop/test/view.test.ts
- add
  file: docs/architecture.ko.md
  section: 에이전트 어댑터
  to: **headless 세션은 CLI가 오류 스트림에 찍은 마지막 2,000글자를 지니고, 창은 실패한 세션의 오류 밑에 그것을 보여 줍니다.** 결과를 내기 전에 죽는 CLI는 그 까닭을 거기에만 찍습니다. Claude Code 2.1.330은 모르는 옵션에 `error: unknown option '--no-such-option'`을, JSON이 아닌 입력 줄에 `Error parsing streaming input line (type=unknown, 21 chars): SyntaxError`를 찍었고, 출력 스트림에는 아무것도 찍지 않았습니다(2026-11-21 실험). 로그인하지 않았거나 API 키가 거절된 것처럼 CLI가 오류 결과로 알리는 실패는 출력 스트림으로 오고, 그때 오류 스트림은 비어 있었습니다. 끝의 글자를 남기는 것은 죽는 프로그램이 그 까닭을 마지막에 찍기 때문입니다.
    check: apps/desktop/test/claude-adapter.test.ts apps/desktop/test/daemon.test.ts apps/desktop/test/view.test.ts
- add
  file: docs/architecture.md
  section: Memory design
  to: **The daemon keeps the 50 headless sessions that ended last, and every session still working.** The list in memory serves the window's view of recent sessions, and a result that must outlive it belongs in the repository's records ([Records are committed to the repository](#records-are-committed-to-the-repository)). Without a bound the list grows with every stage of every run until the daemon exits. The session that ended first leaves first, and every client is told.
    check: apps/desktop/test/daemon.test.ts
- add
  file: docs/architecture.ko.md
  section: 메모리 설계
  to: **데몬은 가장 늦게 끝난 headless 세션 50개와, 아직 일하는 세션을 모두 지닙니다.** 메모리에 든 목록은 창이 최근 세션을 보여 주는 데 쓰이고, 남아야 하는 결과는 저장소의 기록에 둡니다([기록은 저장소에 커밋합니다](#기록은-저장소에-커밋합니다)). 한도가 없으면 목록은 데몬이 끝날 때까지 모든 실행의 모든 단계만큼 자랍니다. 먼저 끝난 세션이 먼저 빠지고, 모든 클라이언트가 그것을 전해 받습니다.
    check: apps/desktop/test/daemon.test.ts

## Removes

The work adds a limit, a client message, a server message and fields of `HeadlessInfo` (*Data & interfaces*). In return it takes out the drop of the error stream and the stop that neither waited nor escalated, and the bound ends the unbounded growth of the daemon's list. No gate, check, hook or mark is added.

| Removes | Coordinate | Where it lands, or why it can go |
|---|---|---|
| The drain that drops the CLI's error stream, `child.stderr.resume()` | `apps/desktop/src/daemon/adapters/claude.ts#claudeAdapter` | The error stream's tail, *Scope* item 1 |
| The stop that sends one SIGTERM to the CLI alone and returns nothing, `stop: () => void child.kill()` | `apps/desktop/src/daemon/adapters/claude.ts#claudeAdapter` | The stop of *Scope* item 2, which signals the group, kills after `KILL_AFTER_MS` and settles at the exit |
| The fake adapter's stop that returns nothing, `stop: () => clearTimeout(timer)` | `apps/desktop/src/daemon/adapters/fake.ts#fakeAdapter` | The same stop, which also returns a settled promise (*Scope* item 2) |
| The sentence "How long an agent's CLI takes to exit at the signal was not measured." | `apps/desktop/src/daemon/daemon.ts#END_WAIT_MS` | Rewritten with the probe of *Grounding*: Claude Code 2.1.330 exited 389 ms after SIGTERM before its first message. The exit during a turn stays unmeasured (Q2) |
| `RoleRun.stop`'s docstring "Ends the agent's process if it is still running." | `apps/desktop/src/daemon/adapters/adapter.ts#RoleRun` | Rewritten to say that the promise settles at the exit (*Data & interfaces*) |

Framed 2026-11-21 by framer, before the build.
