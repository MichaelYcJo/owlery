# Design: an idle daemon of another build is replaced

## Grounding

The tree as read at `f2b74826`.

Words this frame uses in one sense each:

- **The load** is one load of the window's page. Each load asks the main process for the daemon (`apps/desktop/src/renderer/renderer.ts#connect`), and the main process answers through `daemonControl`'s `start` act (`apps/desktop/src/main/daemon-control.ts`).
- **A daemon of another build** is one for which `otherBuild` answers true (`apps/desktop/src/main/daemon-client.ts#otherBuild`).
- **The lists** are the `sessions`, `headless` and `workItems` fields of the `ready` message a daemon sends in answer to a hello.
- **A kept daemon** is a daemon of another build the load attaches to and does not replace.
- **A request** is a client message that carries a numeric `requestId`.

| Policy clause | What it fixes for this work |
|---|---|
| `docs/architecture.md` *What a session survives*, the paragraph that opens "An update of the app ends no session" | It is #36's study, and it already states this work's rule: a daemon that holds no live pane and no working role session "is replaced at the window's next load, without a question", a daemon that holds either is kept, the daemon writes one line when it stops, and the daemon that starts after one that crashed writes that the one before it ended without stopping. This work builds that text. Where the build differs from it, *Rule changes* states the difference. |
| `docs/architecture.md` *What a session survives*, the same paragraph: "What goes with it is what its own exit lets go" | The replacement may end only what the daemon's own idle exit ends. `Daemon#checkIdle` (`apps/desktop/src/daemon/daemon.ts:4626`) exits where no client is connected, no session is alive, no headless session is `working` and no chain runs. *Scope* item 1 reads the same three facts from the lists, and counts a `queued` headless session as running as well. |
| `docs/architecture.md` *Overall layout*, the bullet "A person stops the daemon from the app's menu" | "The app signals because a daemon of any build ends at a signal, and a daemon of an earlier build would not know a message added to the protocol." The replacement stops the daemon by that signal, through `stopDaemon`, and adds no message that asks a daemon to stop. The bullet's head and its last sentence say the app replaces a daemon only on a person's word, which the owner's comment on the issue (2026-11-22) says this work rewrites. *Rule changes* rewrites both. |
| The same bullet, as the unsettled `change` of `seal/threads/1795651594-249-251-delete-dialog-names-the-queue-and-keeps-its-scroll/frame/design.md` *Rule changes* leaves it | That work changed the sentence on what the two dialogs name and added `apps/desktop/test/view.test.ts` to the bullet's check line. This work changes other sentences of the bullet and leaves the check line as that work wrote it. |
| `docs/architecture.md` *Rules that keep it portable*, rule 1 | Only neutral shapes pass over the protocol, and the phone uses the same protocol. So the daemon's answer to a request it does not know carries a field that says so, and the sentence that names the menu's "Restart Daemon…" is the window's. |
| `docs/architecture.md` *Open decisions*, the row "Holding the terminals apart from the daemon" | Its criterion counts, in the daemon's log, the restarts that ended a working agent and the crashes. So each line this work writes carries the daemon's process id and the time, and the stop's line carries the counts of live panes and working agents. |
| `docs/design.md` *A pull request that changes the window carries its screenshots* | The work shows two new sentences where a refusal is shown today, and draws no new form. The screenshot run's daemon is of the app's own build, so no view of the run draws differently. This frame judges that the pull request carries no screenshot. |
| The issue's comments (`gh issue view 133 --json body,comments`, `executed`, exit 0) | Two comments, both the owner's. The first asks that the sentence of *Overall layout* be rewritten with this work. The second records a move between milestones and changes nothing asked. The issue's milestone was `release: 0.1.0` when the framer read it, and on 2026-11-26 the owner moved it to `release: 0.0.5`, the walk release before 0.1.0 (`docs/roadmap.md` *Releases and the tracker*). |
| `routing.md` *Why this way* | No real `claude` session runs in this work item. The frame names none. |

What the tree says about the code (`read` unless marked):

- **The cause of the notice on an idle daemon.** `ensureDaemon` returns the daemon `daemon.json` names as soon as it answers, whatever its build (`apps/desktop/src/main/daemon-client.ts:43-44`). The main process then only reports `otherBuild` to the window (`apps/desktop/src/main/main.ts:174-183`). Nothing reads what the daemon runs.
- **The cause of the open request.** `Daemon#handle` ends in `default: return;` (`apps/desktop/src/daemon/daemon.ts:1763-1764`), so a message whose type the daemon does not know is dropped without an answer. The window keeps each request in a list of its own until an answer names its `requestId`, and no list has a wait (`apps/desktop/src/renderer/renderer.ts`, the units `ask`, `askAccounts`, `takePlan` and their like).
- **Every refusal ends at one place in the window.** `case "error"` of `onMessage` (`apps/desktop/src/renderer/renderer.ts:2010-2050`) hands a refusal to each list in turn and to the status line last. A refusal the window makes itself and hands to `onMessage` ends a request the same way.
- **Every message the window sends passes `send`** (`apps/desktop/src/renderer/shared.ts:62-64`).
- **What a daemon tells of what it runs.** `ready` carries `sessions`, each with `alive`, `headless`, each with `state`, and `workItems`, each with `chain` (`apps/desktop/src/shared/protocol.ts:973`, `:554-557`, `:730`, `:318`, `:507`). The same fields stand in the protocol of `v0.0.2`, `v0.0.3` and `v0.0.4`: `git show <tag>:apps/desktop/src/shared/protocol.ts`, for each of the three tags, printed the `ready` shape with `sessions`, `workItems` and `headless`, and one line `chain: Chain | null` (`executed`, exit 0). `answers` already says hello and receives `ready`, and reads only its type (`apps/desktop/src/main/daemon-client.ts:8-22`).
- **A daemon of `v0.0.2` ends at SIGTERM and removes its `daemon.json`.** `git show v0.0.2:apps/desktop/src/daemon/main.ts` printed the `SIGTERM` handler and the `rmSync` of the file (`executed`, exit 0), and the code at this commit does the same (`apps/desktop/src/daemon/main.ts:55-65`, `:105`). A daemon that is killed or crashes removes nothing, so its file stays.
- **The requests of the window at this commit are the requests of `v0.0.4`.** The `type` values of `ClientMessage` printed the same for `v0.0.4` and `HEAD`. `v0.0.3` lacks `readHeavyRuns`, `readMachine` and `setCaps`, and `v0.0.2` lacks the account requests as well (`executed`: `git show <tag>:apps/desktop/src/shared/protocol.ts` cut to the `ClientMessage` union, for the three tags and `HEAD`, exit 0).
- **Nothing in the tree already ends an unanswered request or records a daemon's end.** `git grep -n -i 'did not answer\|not answered\|uncaughtException\|unhandledRejection\|ended without\|stopped:' -- src`, run in `apps/desktop`, printed comments and unrelated sentences. No printed line is a wait on a request, a listener of the process's errors or a line on a stop (`executed`, exit 0, each printed line read).
- **A listener of `uncaughtExceptionMonitor` runs before the process ends, and changes neither the crash nor its exit code.** A probe on Electron 45.3.3 as Node (Node 24.22.3), `ELECTRON_RUN_AS_NODE=1 electron test_tmp_monitor.cjs throw` and the same with `reject`, printed the listener's line with `origin=uncaughtException` and with `origin=unhandledRejection`, and each run exited with 1 (`executed`).
- **Two apps of different builds can share one run folder on a developer's Mac.** The app holds no single instance lock: `git grep -n 'SingleInstance' -- src`, run in `apps/desktop`, printed nothing (`executed`, exit 1). An app started from a checkout takes the user data folder named for the package, `@owlery/desktop`, which every checkout shares. That folder stands on this Mac with a `run` folder in it (`executed`: a listing of the user's application support folder, exit 0). Each app whose window lost its daemon reloads after a second (`apps/desktop/src/renderer/renderer.ts:2088-2092`). So with *Scope* item 1 alone, two such apps would replace each other's idle daemon in turn without end. *Scope* item 3 stops that.
- **The cases have what the issue's fifth line asks for.** `apps/desktop/test/daemon-client.test.ts` starts stand-in daemons from scripts it writes. `apps/desktop/test/daemon-restart.test.ts` makes the app's own daemon a daemon of another build by rewriting `daemon.json` without `build`, and its panes run the receiver of `apps/desktop/test/fixtures`. `BuiltApp.start` takes `writeRun`, which writes into the run folder before the app starts (`apps/desktop/test/built-app.ts`).
- **No file under `apps/desktop/src/daemon` imports from `apps/desktop/src/main`.** `git grep -n 'from "\.\./main' -- src/daemon`, run in `apps/desktop`, printed nothing (`executed`, exit 1).

Nobody's finding, carried as an assumption: whether every request a daemon of `v0.0.2` to `v0.0.4` carries out answers with a message that names its `requestId`. At this commit each `case` read answers `done` first. Where one of those builds answers a request by a broadcast alone, *Scope* item 8 shows its sentence after the wait though the daemon did the work. This frame accepts that, because such daemons are builds from before the first public release. Nobody is owed an answer: no answer changes what is built.

## Scope

In scope, each item one behaviour:

1. **An idle daemon of another build is replaced at the load.** Where the daemon the load finds is of another build and its lists show that it runs nothing, the main process stops it as "Restart Daemon…" stops one (`stopDaemon`), starts the daemon of the running build, and answers the window with that daemon and `otherBuild` false. It does so inside the one turn of `daemonControl` that serves the load, before the window connects, and asks no question. A daemon runs nothing where its `sessions` holds no entry that is alive, its `headless` holds no entry whose state is other than `finished` or `failed`, and its `workItems` holds no entry whose `chain.state` is `running`.
2. **A daemon that runs something, or whose lists cannot be read, is kept.** The load attaches to it as it does today and answers `otherBuild` true. Lists cannot be read where `sessions`, `headless` or `workItems` is not a list. An entry of a list that is not of the shape item 1 reads counts as running.
3. **An app replaces a daemon of one build once while the app runs.** Where the load finds a daemon of a build this run of the app already replaced, the daemon is kept as item 2 keeps one. Daemons whose `daemon.json` holds no build count as one build.
4. **A replacement whose stop fails starts nothing.** The load's request is answered with the sentence `stopDaemon` rejected with, as a start that fails is answered today.
5. **The daemon answers a request whose type it does not know.** The answer is an `error` that names the request's `requestId`, carries `unknown: true`, and whose `message` says in one sentence that the daemon does not know the request, with the type's name. A message of a type the daemon does not know that carries no numeric `requestId` is dropped as it is today.
6. **`ready` says that the daemon gives that answer**, in a field `answersUnknown: true`.
7. **The window shows its own sentence for that answer.** Where an `error` carries `unknown: true`, the window shows `Owlery's background process is from another build and does not know this request. Choose "Restart Daemon…" from the menu to replace it.` in the place where it shows that request's refusal today.
8. **Against a daemon whose `ready` holds no `answersUnknown`, the window ends each request but a creation that has no answer after 10 seconds.** A creation (`createWorkItem`) arms no wait: every daemon from 0.0.2 on knows it and answers it by id, and a refusal before its answer would turn Create back on for a second work item. It ends the request as a refusal, with the sentence `Owlery's background process is from another build and has not answered. Choose "Restart Daemon…" from the menu to replace it.` An answer that names the request before the wait is over ends the wait. An answer that arrives after it is taken as the window takes an answer to a request it no longer waits for. Against a daemon whose `ready` holds the field, no request has a wait.
9. **The daemon writes one line when it stops.** The line holds the daemon's process id, the time, what stopped it, the count of live panes and the count of working agents, read before anything is ended. What stopped it is a signal with its name, the daemon's own idle exit, or an error. A working agent is a live pane whose state is `working` or a headless session whose state is `working`.
10. **A daemon that an error of its own code ends writes that line too.** A listener of the process's `uncaughtExceptionMonitor` writes it, with `error` as what stopped the daemon, and changes nothing else of how the process ends.
11. **A daemon that starts on the `daemon.json` of a daemon that no longer answers writes one line.** Before it writes its own `daemon.json`, the starting daemon reads the file that stands there. Where the file names a daemon and nothing answers a hello at the file's address with the file's token, it writes that the daemon of that process id ended without stopping.
12. **No case starts a real `claude`.** Each case uses a stand-in daemon, the app's own daemon with a rewritten `daemon.json`, the fake adapter or the receiver pane.

Out of scope:

- **A kept daemon that later runs nothing is not replaced until the next load.** The study's text says the next load, and a window that reloaded by itself would take the page from under the person. An app that stays open keeps its daemon until a person restarts the app or the daemon.
- **A single instance lock.** It would stop two apps on one run folder, and it changes what a second start of the app does, which nobody asked. Item 3 stops the one harm this work would add.
- **The two rows the settle of release 0.0.2 carried into the issue.** Whether a pane a daemon of an earlier build lists with `workItemId` null has a tab, and whether the window draws no seal button against a daemon of an earlier build. The issue says its *Done when* is unchanged by them. The builder carries both into `gaps.md` as open, with the answerer the issue names for each.
- **Where the packaged app keeps the files a kept daemon reads.** Issue #78 builds and checks it.
- **The update from GitHub Releases.** Issue #266.
- **A count over the log, and a bound on the log's size.** The decision this log serves reads it by hand when it is weighed.
- **The milestone numbers of `docs/roadmap.md`.** Its row that names #133 is stale since the owner renumbered the milestones, and the renumber is not this work's.

## User scenarios & acceptance *(mandatory)*

| Scenario | Given / When / Then | Verifiable how |
|---|---|---|
| A. An idle daemon of another build is replaced | Given the app's daemon holds no live pane, no headless session and no running chain, and its `daemon.json` holds no `build`. When the window loads. Then the earlier daemon's process is gone, `daemon.json` names another process and the build of the app's script, the status line reads `Daemon running, no agent` and is no notice, and a bystander daemon of another run folder still runs. | A case of `apps/desktop/test/daemon-restart.test.ts` in the built app. Cases of `apps/desktop/test/daemon-client.test.ts` with a stand-in daemon whose `ready` holds empty lists. |
| B. A daemon with a live pane is kept | Given the app's daemon holds one live receiver pane and its `daemon.json` holds no `build`. When the window loads. Then the daemon and the pane's process still run, and the status line shows the sentence of a daemon of another build. | The case of `apps/desktop/test/daemon-restart.test.ts` that stands at the frame's commit, whose first half is this scenario and which passes unchanged. |
| C. A daemon with a working headless session, a queued one or a running chain is kept | Given a stand-in daemon of another build whose `ready` lists one of the three. When the unit that serves the load runs. Then the stand-in received no signal and is the daemon answered. | Cases of `apps/desktop/test/daemon-client.test.ts`, one for each of the three, and one for a `ready` without lists. |
| D. The real daemon's `ready` is read as it runs | Given a `Daemon` of the suite with a live pane, then with a working headless session, then with a running chain, then with none of them. When the unit of *Scope* item 1 reads its `ready`. Then it answers that the daemon runs something in the first three and nothing in the last. | Three cases of the `idle exit` group of `apps/desktop/test/daemon.test.ts`. They tie the judgment to the lists the daemon really sends. |
| E. Two apps do not replace each other without end | Given this run of the app replaced a daemon of build X. When a load finds a daemon of build X again that runs nothing. Then that daemon is kept and received no signal. | A case of `apps/desktop/test/daemon-client.test.ts` with two stand-in daemons of one build. |
| F. A request the daemon does not know is refused at once | Given a client connected to a `Daemon` of the suite. When it sends `{ type: "noSuchRequest", requestId: 7 }`. Then it receives an `error` with `requestId` 7 and `unknown: true`, and the `ready` it received holds `answersUnknown: true`. A message of that type without `requestId` gets no answer. | Cases of `apps/desktop/test/daemon.test.ts`. |
| G. The window names "Restart Daemon…" for that refusal | Given an `error` with `unknown: true`. Then the sentence the window shows is the one of *Scope* item 7, whatever `message` holds. | A case of `apps/desktop/test/view.test.ts` on the unit that gives the sentence. |
| H. A request an older daemon leaves open ends | Given the app attached to a stand-in daemon of another build that lists one live pane, sends no `answersUnknown` and answers no request. When a person makes a press that sends a request. Then within 15 seconds the window shows the sentence of *Scope* item 8 where it shows that request's refusal. | A case of `apps/desktop/test/daemon-restart.test.ts` in the built app, its stand-in written into the run folder through `writeRun`. Cases of `apps/desktop/test/view.test.ts` on the unit that keeps the waits, with the timer passed in: a request answered in time gives no sentence, one not answered gives the sentence once, and a daemon with the field arms nothing. |
| I. A stop at a signal is recorded | Given the daemon's script started by the case on a run folder of its own. When the case sends it SIGTERM, and in a second row SIGINT. Then the log holds one line with that process id, a time, `signal SIGTERM` or `signal SIGINT` as the signal sent, and both counts as 0. | A case of `apps/desktop/test/daemon-restart.test.ts` run over both signals, which builds the script. |
| J. A stop at an idle exit or an error, and the counts, are recorded | Given the unit that writes the stop's line, and the unit that listens on a stand-in for the process. When the first is given `idle`, and when the stand-in emits `uncaughtExceptionMonitor`. Then each writes one line with its cause. Given a `Daemon` of the suite with three live panes, one of them `working`, an ended pane, one working headless session and one ended headless session. Then the counts it gives are 3 panes alive and 2 agents working, so each filter has an entry to leave out. | Cases of `apps/desktop/test/daemon.test.ts`. That `apps/desktop/src/daemon/main.ts` passes `idle` at `onIdle` is read at review: the idle exit takes 60 seconds, and no case waits for it. |
| K. An end without a stop is recorded by the next start | Given a run folder whose `daemon.json` names a process id and a port nothing listens on. When the daemon's script starts there. Then the log holds one line that names that process id as ended without stopping. Given a run folder without the file. Then the log holds no such line. | Cases of `apps/desktop/test/daemon-restart.test.ts`. |
| L. The lines hold no prompt, path or title | Given the lines of I, J and K. Then each matches the form of *Data & interfaces* whole, which holds process ids, a time, a cause and counts. | The cases of I, J and K compare the whole line with the form. |

## Data & interfaces

- **`ServerMessage`, `ready`** (`apps/desktop/src/shared/protocol.ts:973`): gains `answersUnknown?: true`. A daemon of an earlier build sends none, and a client reads its absence as a daemon that leaves a request it does not know unanswered.
- **`ServerMessage`, `error`** (`apps/desktop/src/shared/protocol.ts:1016`): gains `unknown?: true`, set where the daemon does not know the request's type.
- **`Daemon#handle`** (`apps/desktop/src/daemon/daemon.ts:965`): the `default` branch gives the answer of *Scope* item 5.
- **`Daemon`**: one public unit gives the counts of *Scope* item 9. `Daemon#close` ends the panes, so the stop reads the counts first.
- **`apps/desktop/src/daemon/main.ts`**: `stop` takes what stopped the daemon and writes the line before it closes anything. The start reads the standing `daemon.json` before `writeDiscovery`. The lines go to the standard output, which the app opened on `daemon.log` of the run folder.
- **The two lines**, each whole on one line, with `<time>` as `Date#toISOString` gives it:
  - `owlery daemon <pid> stopped at <time>: <cause>, panes alive <n>, agents working <m>`, where `<cause>` is `signal <name>`, `idle` or `error`.
  - `owlery daemon <pid> started at <time> after daemon <pid> ended without stopping`, where the second `<pid>` is the one the standing file names.
- **The hello a start and a load both say.** `answers` (`apps/desktop/src/main/daemon-client.ts:8`) becomes a unit that gives the `ready` it received, which `answers`, the unit of *Scope* item 1 and the start of item 11 use. The unit stands where the daemon's code and the main process's can both import it, beside `readDiscovery` in `apps/desktop/src/daemon/discovery.ts`, since no file of the daemon imports from the main process.
- **`ensureDaemon`**, or a unit that wraps it, carries *Scope* items 1 to 4. The builds this run of the app replaced are held by the main process for as long as it runs, and are written nowhere.
- **`DaemonConnection`** (`apps/desktop/src/shared/ipc.ts`): unchanged. After a replacement `otherBuild` is false because the daemon found is the one just started.
- **The window**: the two sentences and the unit that keeps the waits are units of `apps/desktop/src/renderer/view.ts`, which imports nothing of the page, beside `daemonNotice`. `send` of `apps/desktop/src/renderer/shared.ts` tells that unit of each request, `onMessage` tells it of each answer, and a wait that ends hands `onMessage` an `error` with the sentence of item 8. The wait is one named constant of 10 seconds.

## Rule changes

- change
  file: docs/architecture.md
  section: Overall layout
  from: **A person stops the daemon from the app's menu, and the app stops no daemon but its own run folder's.**
  to: **A person stops the daemon from the app's menu, the app itself replaces only a daemon of another build that runs nothing, and the app stops no daemon but its own run folder's.**
- change
  file: docs/architecture.md
  section: Overall layout
  from: Where that value differs from the script the app would start, the status line says the daemon is from another build and names "Restart Daemon…".
  to: Where that value differs from the script the app would start and the daemon runs nothing, the window's load replaces the daemon without a question ([What a session survives](#what-a-session-survives)). Where it differs and the daemon runs something, the status line says the daemon is from another build and names "Restart Daemon…".
- change
  file: docs/architecture.ko.md
  section: 전체 구성
  from: **사람은 앱 메뉴에서 데몬을 멈추고, 앱은 자기 실행 폴더의 데몬만 멈춥니다.**
  to: **사람은 앱 메뉴에서 데몬을 멈추고, 앱이 스스로 바꾸는 것은 아무것도 돌리지 않는 다른 빌드의 데몬뿐이며, 앱은 자기 실행 폴더의 데몬만 멈춥니다.**
- change
  file: docs/architecture.ko.md
  section: 전체 구성
  from: 그 값이 앱이 띄울 스크립트의 값과 다르면 상태 줄이 데몬이 다른 빌드의 것이라고 알리고 "Restart Daemon…"을 가리킵니다.
  to: 그 값이 앱이 띄울 스크립트의 값과 다르고 데몬이 아무것도 돌리지 않으면, 창이 페이지를 읽을 때 묻지 않고 데몬을 바꿉니다([세션이 견디는 것](#세션이-견디는-것)). 값이 다르고 데몬이 무언가를 돌리고 있으면 상태 줄이 데몬이 다른 빌드의 것이라고 알리고 "Restart Daemon…"을 가리킵니다.
- change
  file: docs/architecture.md
  section: What a session survives
  from: A daemon that holds no live pane and no working role session is replaced at the window's next load, without a question.
  to: A daemon that holds no live pane, no role session that works or waits for the machine, and no running chain is replaced at the window's next load, without a question. The app reads this from the lists the daemon sends in answer to a hello, which a daemon of 0.0.2 and of each build after it sends, and it keeps a daemon whose lists it cannot read. An app replaces a daemon of one build once while the app runs. Where it finds a daemon of that build again, another app of that build runs on the same run folder, so it keeps the daemon and the status line says that the daemon is of another build.
- change
  file: docs/architecture.md
  section: What a session survives
  from: A daemon that holds either is kept until the person chooses "Restart Daemon…", whose dialog names what runs.
  to: A daemon that holds any of them is kept until the person chooses "Restart Daemon…", whose dialog names what runs.
- change
  file: docs/architecture.md
  section: What a session survives
  from: the window reads a field the daemon does not send as a feature that is off.
  to: the window reads a field the daemon does not send as a feature that is off. A daemon answers a request whose kind it does not know with a refusal that says so, and the window shows in its place a sentence that names "Restart Daemon…". A daemon of a build before that answer leaves such a request unanswered. Against such a daemon the window ends each request but a creation that has no answer after 10 seconds, with a sentence that names "Restart Daemon…".
- change
  file: docs/architecture.md
  section: What a session survives
  from: A daemon that crashed writes nothing, so the daemon that starts after it writes that the one before it ended without stopping.
  to: A daemon that an error of its own code ends writes the line before it ends, and a daemon that is killed, or whose Mac lost power, writes nothing. Either leaves its `daemon.json`, so the daemon that starts after it writes that the one before it ended without stopping. Each line carries the daemon's process id and the time, and holds counts and no prompt, path or title.
- change
  file: docs/architecture.md
  section: What a session survives
  from: Issue #133 builds the replacement and the log lines in milestone 3, and issue #78 builds the update itself in milestone 5 ([Milestones](roadmap.md#milestones)).
  to: Issue #78 builds the update itself in milestone 5 ([Milestones](roadmap.md#milestones)).
    check: apps/desktop/test/daemon-client.test.ts apps/desktop/test/daemon-restart.test.ts apps/desktop/test/daemon.test.ts apps/desktop/test/view.test.ts
- change
  file: docs/architecture.ko.md
  section: 세션이 견디는 것
  from: 살아 있는 칸도 일하는 역할 세션도 없는 데몬은 창이 다음에 페이지를 읽을 때 묻지 않고 바꿉니다.
  to: 살아 있는 칸도, 일하거나 컴퓨터를 기다리는 역할 세션도, 돌고 있는 체인도 없는 데몬은 창이 다음에 페이지를 읽을 때 묻지 않고 바꿉니다. 앱은 이것을 데몬이 hello에 답하며 보내는 목록에서 읽습니다. 0.0.2와 그 뒤 빌드의 데몬은 모두 그 목록을 보내고, 앱은 목록을 읽을 수 없는 데몬을 그대로 둡니다. 앱은 실행되는 동안 한 빌드의 데몬을 한 번만 바꿉니다. 그 빌드의 데몬을 다시 만나면 그 빌드의 다른 앱이 같은 실행 폴더에서 돌고 있는 것이므로, 앱은 데몬을 그대로 두고 상태 줄은 데몬이 다른 빌드의 것이라고 알립니다.
- change
  file: docs/architecture.ko.md
  section: 세션이 견디는 것
  from: 둘 중 하나라도 쥔 데몬은 사람이 "Restart Daemon…"을 고를 때까지 그대로 두고, 그 대화 상자는 무엇이 돌고 있는지 이름으로 보여 줍니다.
  to: 셋 중 하나라도 쥔 데몬은 사람이 "Restart Daemon…"을 고를 때까지 그대로 두고, 그 대화 상자는 무엇이 돌고 있는지 이름으로 보여 줍니다.
- change
  file: docs/architecture.ko.md
  section: 세션이 견디는 것
  from: 창은 데몬이 보내지 않는 필드를 꺼진 기능으로 읽습니다.
  to: 창은 데몬이 보내지 않는 필드를 꺼진 기능으로 읽습니다. 데몬은 종류를 알지 못하는 요청에 알지 못한다는 거절로 답하고, 창은 그 자리에 "Restart Daemon…"을 가리키는 문장을 보입니다. 그 답이 생기기 전 빌드의 데몬은 그런 요청에 답하지 않습니다. 그런 데몬에 붙은 창은 10초가 지나도 답이 없는 요청을, 작업 항목을 만드는 요청을 빼고, "Restart Daemon…"을 가리키는 문장과 함께 끝냅니다.
- change
  file: docs/architecture.ko.md
  section: 세션이 견디는 것
  from: 죽은 데몬은 아무것도 쓰지 못하므로, 그다음에 뜨는 데몬이 앞의 데몬이 멈추지 않고 끝났다고 씁니다.
  to: 자기 코드의 오류로 끝나는 데몬은 끝나기 전에 그 줄을 쓰고, 강제로 종료되었거나 Mac의 전원이 끊긴 데몬은 아무것도 쓰지 못합니다. 어느 쪽이든 `daemon.json`이 남으므로, 그다음에 뜨는 데몬이 앞의 데몬이 멈추지 않고 끝났다고 씁니다. 줄마다 데몬의 프로세스 ID와 시각이 있고, 줄에는 개수만 있으며 프롬프트도 경로도 제목도 없습니다.
- change
  file: docs/architecture.ko.md
  section: 세션이 견디는 것
  from: 이 교체와 로그 줄은 이슈 #133이 마일스톤 3에서 만들고, 업데이트 자체는 이슈 #78이 마일스톤 5에서 만듭니다([마일스톤](roadmap.ko.md#마일스톤)).
  to: 업데이트 자체는 이슈 #78이 마일스톤 5에서 만듭니다([마일스톤](roadmap.ko.md#마일스톤)).
    check: apps/desktop/test/daemon-client.test.ts apps/desktop/test/daemon-restart.test.ts apps/desktop/test/daemon.test.ts apps/desktop/test/view.test.ts
- change
  file: docs/architecture.md
  section: Screen framework: Electron
  from: Where no answer comes within 15 seconds, the status line says so, and a daemon of an earlier build, which does not know the message, is told that way.
  to: Where no answer comes within 15 seconds, the status line says so. Against a daemon of a build before `answersUnknown`, which does not know the message, the window's wait of 10 seconds on each request ends the press first, with its own sentence ([What a session survives](#what-a-session-survives)).
    check: apps/desktop/test/view.test.ts apps/desktop/test/refresh.test.ts apps/desktop/test/daemon-restart.test.ts
- change
  file: docs/architecture.ko.md
  section: 화면 프레임워크: Electron
  from: 15초 안에 답이 오지 않으면 상태 줄이 그렇다고 말하고, 이 메시지를 모르는 이전 빌드의 데몬도 그렇게 알립니다.
  to: 15초 안에 답이 오지 않으면 상태 줄이 그렇다고 말합니다. 이 메시지를 모르는, `answersUnknown` 이전 빌드의 데몬에게는 창이 요청마다 두는 10초 기다림이 먼저 누름을 끝내고 자기 문장을 보입니다([세션이 견디는 것](#세션이-견디는-것)).
    check: apps/desktop/test/view.test.ts apps/desktop/test/refresh.test.ts apps/desktop/test/daemon-restart.test.ts

## Removes

| Removes | Coordinate | Where it lands, or why it can go |
|---|---|---|
| The clause that names this issue as the builder of the replacement and the log lines | `docs/architecture.md` *What a session survives* and `docs/architecture.ko.md` *세션이 견디는 것*, through the last `change` of each in *Rule changes* | The work is built, and the paragraph's own sentences say what it does. The history is the issue's and git's. |

The work adds one field to `ready`, one field to `error`, one wait in the window and two lines in the log, and takes no mechanism out in return, because none does these jobs today: *Grounding* shows that nothing ends an unanswered request and nothing records a daemon's end. The wait of *Scope* item 8 serves only daemons of builds before the first public release, and `frame/plan.md` *Alternatives considered* weighs building it against leaving it out.

Framed 2026-11-26 by framer, before the build.
